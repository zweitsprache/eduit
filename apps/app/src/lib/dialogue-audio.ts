/**
 * Shared helpers for turning a dialogue block into Inworld TTS input.
 * Kept free of React imports so both the editor and route handlers can use it.
 */

export type DialogueAudioSpeaker = 1 | 2 | 3 | 4;

export const DEFAULT_DIALOGUE_AUDIO_INSTRUCTION =
  'slightly slower than native explainer video speech speed, friendly, not too exaggerated, natural and clear enough for language learners';

/** Only used to preselect from the live Inworld voice list. */
export const PREFERRED_DIALOGUE_VOICES = ['Ashley', 'Dennis', 'Alex', 'Olivia'];

export const DIALOGUE_AUDIO_PAUSE_SECONDS = 0.6;
export const MAX_DIALOGUE_AUDIO_LINES = 40;

/**
 * Expands blanks back to their answers and removes editor markup, steering
 * brackets and SSML angle brackets so nothing in learner text is interpreted
 * as an Inworld instruction or tag.
 */
export function dialogueLineToSpeechText(text: string) {
  return text
    .replace(/\{\{blank:([^{}]+)\}\}/gi, (_match, payload: string) => {
      const separator = payload.lastIndexOf('|');
      const answer = separator === -1 ? payload : payload.slice(0, separator);
      return answer.trim();
    })
    .replace(/\[\[clock hour=(\d+) minute=(\d+)\]\]/gi, (_match, hour: string, minute: string) => (
      `${Number(hour)}:${minute.padStart(2, '0')}`
    ))
    .replace(/\[\[\/?[a-z-]+\]\]/gi, '')
    .replace(/\*\*/g, '')
    .replace(/[[\]<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function dialogueSpeechLines(
  items: Array<{ speaker: number; text: string }>,
) {
  return items
    .map((item) => ({
      speaker: Math.min(4, Math.max(1, Math.round(item.speaker))) as DialogueAudioSpeaker,
      text: dialogueLineToSpeechText(item.text),
    }))
    .filter((line) => line.text.length > 0);
}
