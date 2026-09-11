import { put } from '@vercel/blob';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { DEFAULT_DIALOGUE_AUDIO_INSTRUCTION } from '@/lib/dialogue-audio';
import {
  INWORLD_MAX_TEXT_LENGTH,
  estimateMp3Seconds,
  isInworldConfigured,
  synthesizeInworldSpeech,
} from '@/lib/inworld-tts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const requestSchema = z.object({
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    text: z.string().trim().max(1000),
  })).min(1).max(30),
  voice: z.string().trim().min(1).max(120),
  instruction: z.string().trim().max(600).default(DEFAULT_DIALOGUE_AUDIO_INSTRUCTION),
  language: z.string().trim().max(20).default(''),
  deliveryMode: z.enum(['STABLE', 'BALANCED', 'CREATIVE']).default('BALANCED'),
  speakingRate: z.number().min(0.5).max(1.5).default(0.9),
});

function errorResponse(error: unknown, status = 400) {
  let message = 'Dictation audio request failed.';
  if (typeof error === 'string') message = error;
  else if (error instanceof z.ZodError) {
    message = `Invalid dictation audio request: ${error.issues
      .map((issue) => `${issue.path.join('.')} ${issue.message}`).join('; ')}`;
  } else if (error instanceof Error) message = error.message;
  return Response.json({ error: message }, { status });
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

  const items = input.items.filter((item) => item.text.length > 0);
  if (!items.length) return errorResponse('Add at least one dictation answer.');

  try {
    const tracks = await Promise.all(items.map(async (item) => {
      if (item.text.length > INWORLD_MAX_TEXT_LENGTH) {
        throw new Error(`Dictation item ${item.id} is too long for speech synthesis.`);
      }
      const audio = await synthesizeInworldSpeech({
        text: item.text,
        voiceId: input.voice,
        instruction: input.instruction,
        language: input.language || undefined,
        deliveryMode: input.deliveryMode,
        speakingRate: input.speakingRate,
        signal: request.signal,
      });
      const blob = await put(
        `dialogue-audio-public/${user.id}/dictation-${item.id}.mp3`,
        audio,
        {
          access: 'private',
          addRandomSuffix: true,
          contentType: 'audio/mpeg',
          cacheControlMaxAge: 31_536_000,
        },
      );
      return {
        itemId: item.id,
        url: `/api/public/dialogue-audio?path=${encodeURIComponent(blob.pathname)}`,
        byteSize: audio.byteLength,
        durationSeconds: estimateMp3Seconds(audio.byteLength),
      };
    }));

    const manifest = await put(
      `dialogue-audio-public/${user.id}/dictation-playlist.json`,
      JSON.stringify({
        title: 'Dictation audio',
        tracks: tracks.map(({ itemId, url, durationSeconds }) => ({
          itemId,
          url,
          durationSeconds,
        })),
      }),
      {
        access: 'private',
        addRandomSuffix: true,
        contentType: 'application/json',
        cacheControlMaxAge: 31_536_000,
      },
    );

    return Response.json({
      tracks,
      playlistUrl: `/api/public/dialogue-audio?path=${encodeURIComponent(manifest.pathname)}`,
    }, { status: 201 });
  } catch (error) {
    return errorResponse(error, 502);
  }
}
