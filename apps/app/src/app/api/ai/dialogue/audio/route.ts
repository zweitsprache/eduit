import { put } from '@vercel/blob';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import {
  DEFAULT_DIALOGUE_AUDIO_INSTRUCTION,
  DIALOGUE_AUDIO_PAUSE_SECONDS,
  MAX_DIALOGUE_AUDIO_LINES,
  dialogueSpeechLines,
} from '@/lib/dialogue-audio';
import {
  INWORLD_MAX_TEXT_LENGTH,
  concatMp3,
  estimateMp3Seconds,
  isInworldConfigured,
  listInworldVoices,
  synthesizeInworldSpeech,
} from '@/lib/inworld-tts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const CONCURRENCY = 4;

const speakerRecord = (value: z.ZodType<string>) => z.object({
  1: value,
  2: value,
  3: value,
  4: value,
}).partial();

const requestSchema = z.object({
  items: z.array(z.object({
    speaker: z.number().int().min(1).max(4),
    text: z.string().max(1000),
  })).min(1).max(MAX_DIALOGUE_AUDIO_LINES),
  voices: speakerRecord(z.string().trim().min(1).max(120)),
  instruction: z.string().trim().max(600).default(DEFAULT_DIALOGUE_AUDIO_INSTRUCTION),
  speakerInstructions: speakerRecord(z.string().trim().max(600)).optional(),
  language: z.string().trim().max(20).default(''),
  deliveryMode: z.enum(['STABLE', 'BALANCED', 'CREATIVE']).default('BALANCED'),
  speakingRate: z.number().min(0.5).max(1.5).default(0.95),
  pauseSeconds: z.number().min(0).max(3).default(DIALOGUE_AUDIO_PAUSE_SECONDS),
});

function errorResponse(error: unknown, status = 400) {
  let message = 'Dialogue audio request failed.';
  if (typeof error === 'string') message = error;
  else if (error instanceof z.ZodError) {
    message = `Invalid dialogue audio request: ${
      error.issues.map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')
    }`;
  } else if (error instanceof Error) message = error.message;
  return Response.json({ error: message }, { status });
}

async function mapWithConcurrency<T, R>(
  values: T[],
  limit: number,
  run: (value: T, index: number) => Promise<R>,
) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await run(values[index], index);
    }
  }));
  return results;
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);
  if (!isInworldConfigured()) {
    return errorResponse('Text-to-speech is not configured. Add INWORLD_API_KEY.', 503);
  }
  try {
    const language = new URL(request.url).searchParams.get('language') ?? '';
    return Response.json({ voices: await listInworldVoices(language) });
  } catch (error) {
    return errorResponse(error, 502);
  }
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);
  if (!isInworldConfigured()) {
    return errorResponse('Text-to-speech is not configured. Add INWORLD_API_KEY.', 503);
  }

  let input: z.infer<typeof requestSchema>;
  try {
    input = requestSchema.parse(await request.json());
  } catch (error) {
    return errorResponse(error);
  }

  const lines = dialogueSpeechLines(input.items);
  if (!lines.length) return errorResponse('The dialogue has no spoken text.');

  const missingVoice = lines.find((line) => !input.voices[line.speaker]);
  if (missingVoice) {
    return errorResponse(`Choose a voice for speaker ${missingVoice.speaker}.`);
  }

  const pause = input.pauseSeconds > 0
    ? ` <break time="${Math.round(input.pauseSeconds * 1000)}ms" />`
    : '';

  try {
    const parts = await mapWithConcurrency(lines, CONCURRENCY, (line, index) => {
      const text = `${line.text}${index < lines.length - 1 ? pause : ''}`;
      if (text.length > INWORLD_MAX_TEXT_LENGTH) {
        throw new Error(`Dialogue line ${index + 1} is too long for speech synthesis.`);
      }
      return synthesizeInworldSpeech({
        text,
        voiceId: input.voices[line.speaker]!,
        instruction: input.speakerInstructions?.[line.speaker]?.trim() || input.instruction,
        language: input.language || undefined,
        deliveryMode: input.deliveryMode,
        speakingRate: input.speakingRate,
        previousTexts: lines.slice(Math.max(0, index - 3), index).map(({ text: value }) => value),
        signal: request.signal,
      });
    });

    const audio = concatMp3(parts);
    // Public access: the QR-linked "listen" page must play this without login.
    // addRandomSuffix keeps the URL unguessable since there is no auth check.
    const blob = await put(`dialogue-audio-public/${user.id}/dialogue.mp3`, audio, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'audio/mpeg',
      cacheControlMaxAge: 31_536_000,
    });

    return Response.json({
      audio: {
        url: blob.url,
        byteSize: audio.byteLength,
        durationSeconds: estimateMp3Seconds(audio.byteLength),
        lineCount: lines.length,
      },
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 502);
  }
}
