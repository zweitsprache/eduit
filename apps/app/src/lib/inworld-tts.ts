const INWORLD_API_BASE = 'https://api.inworld.ai';

/** Steering (`instruction`) is only supported by `inworld-tts-2`. */
export const INWORLD_TTS_MODEL = 'inworld-tts-2';
export const INWORLD_MAX_TEXT_LENGTH = 2000;

export type InworldVoice = {
  voiceId: string;
  displayName: string;
  description: string;
  languages: string[];
  tags: string[];
  isCustom: boolean;
};

export type InworldDeliveryMode = 'STABLE' | 'BALANCED' | 'CREATIVE';

export type SynthesizeOptions = {
  text: string;
  voiceId: string;
  /** English-only steering instruction, e.g. "friendly, slightly slower than usual". */
  instruction?: string;
  /** BCP-47 tag such as `de-CH`. Omit to auto-detect from the text. */
  language?: string;
  deliveryMode?: InworldDeliveryMode;
  speakingRate?: number;
  /** Text of earlier lines in the same conversation; improves prosody. */
  previousTexts?: string[];
  signal?: AbortSignal;
};

/**
 * The Inworld portal hands out an already base64-encoded credential, but the
 * raw `key:secret` form is accepted too.
 */
function authorizationHeader() {
  const key = process.env.INWORLD_API_KEY?.trim();
  if (!key) {
    throw new Error('INWORLD_API_KEY is not configured.');
  }
  return `Basic ${key.includes(':') ? Buffer.from(key).toString('base64') : key}`;
}

export function isInworldConfigured() {
  return Boolean(process.env.INWORLD_API_KEY?.trim());
}

/**
 * Inworld only accepts tags present in its catalog, so regional variants such
 * as `de-CH` are reduced to their primary subtag.
 */
export function normalizeInworldLanguage(language?: string) {
  return language?.trim().split(/[-_]/)[0].toLowerCase() ?? '';
}

async function inworldError(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string } | null;
  return new Error(
    body?.message || `Inworld TTS request failed (${response.status}).`,
  );
}

export async function listInworldVoices(language?: string) {
  const url = new URL('/tts/v1/voices', INWORLD_API_BASE);
  const code = normalizeInworldLanguage(language);
  if (code) url.searchParams.set('filter', `language=${code}`);

  const response = await fetch(url, {
    headers: { Authorization: authorizationHeader() },
    cache: 'no-store',
  });
  if (!response.ok) throw await inworldError(response);

  const body = await response.json() as { voices?: Partial<InworldVoice>[] };
  return (body.voices ?? []).map((voice) => ({
    voiceId: String(voice.voiceId ?? ''),
    displayName: String(voice.displayName ?? voice.voiceId ?? ''),
    description: String(voice.description ?? ''),
    languages: Array.isArray(voice.languages) ? voice.languages.map(String) : [],
    tags: Array.isArray(voice.tags) ? voice.tags.map(String) : [],
    isCustom: Boolean(voice.isCustom),
  })).filter((voice) => voice.voiceId);
}

/** Returns a complete MP3 file (128 kbps, 44.1 kHz) for a single utterance. */
export async function synthesizeInworldSpeech({
  text,
  voiceId,
  instruction,
  language,
  deliveryMode = 'BALANCED',
  speakingRate,
  previousTexts,
  signal,
}: SynthesizeOptions) {
  const languageCode = normalizeInworldLanguage(language);
  const response = await fetch(`${INWORLD_API_BASE}/tts/v1/voice`, {
    method: 'POST',
    signal,
    headers: {
      Authorization: authorizationHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voiceId,
      modelId: INWORLD_TTS_MODEL,
      deliveryMode,
      applyTextNormalization: 'ON',
      ...(instruction ? { instruction } : {}),
      ...(languageCode ? { language: languageCode } : {}),
      audioConfig: {
        audioEncoding: 'MP3',
        bitRate: 128_000,
        sampleRateHertz: 44_100,
        ...(speakingRate ? { speakingRate } : {}),
      },
      ...(previousTexts?.length
        ? { synthesisContext: { previousRequests: previousTexts.map((value) => ({ text: value })) } }
        : {}),
    }),
  });
  if (!response.ok) throw await inworldError(response);

  const body = await response.json() as { audioContent?: string };
  if (!body.audioContent) throw new Error('Inworld TTS returned no audio.');
  return Buffer.from(body.audioContent, 'base64');
}

/**
 * MP3 frames are self-contained, so files can be joined byte-wise once the
 * ID3v2 header and ID3v1 trailer of each part are removed.
 */
function stripId3(buffer: Buffer) {
  let start = 0;
  if (buffer.length >= 10 && buffer.toString('latin1', 0, 3) === 'ID3') {
    const size = ((buffer[6] & 0x7f) << 21)
      | ((buffer[7] & 0x7f) << 14)
      | ((buffer[8] & 0x7f) << 7)
      | (buffer[9] & 0x7f);
    start = 10 + size + ((buffer[5] & 0x10) ? 10 : 0);
  }
  let end = buffer.length;
  if (end - start >= 128 && buffer.toString('latin1', end - 128, end - 125) === 'TAG') {
    end -= 128;
  }
  return buffer.subarray(Math.min(start, buffer.length), Math.max(end, start));
}

export function concatMp3(parts: Buffer[]) {
  return Buffer.concat(parts.map(stripId3));
}

/** Rough playback length from the constant 128 kbps bit rate. */
export function estimateMp3Seconds(byteSize: number) {
  return Math.round((byteSize * 8) / 128_000);
}
