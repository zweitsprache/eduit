"use client";

import { useCallback, useEffect, useState } from 'react';
import { Download, Volume2 } from 'lucide-react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type {
  DialogueAudio,
  DialogueItem,
  DialogueSpeaker,
  DialogueSpeakerNames,
} from '@/components/editor/dialogue-node';
import {
  DEFAULT_DIALOGUE_AUDIO_INSTRUCTION,
  DIALOGUE_AUDIO_PAUSE_SECONDS,
  PREFERRED_DIALOGUE_VOICES,
  dialogueLineToSpeechText,
} from '@/lib/dialogue-audio';

type Voice = {
  voiceId: string;
  displayName: string;
  description: string;
  tags: string[];
};

type DeliveryMode = 'STABLE' | 'BALANCED' | 'CREATIVE';

const inputClass = 'mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

function usedSpeakers(items: DialogueItem[]) {
  return ([1, 2, 3, 4] as DialogueSpeaker[])
    .filter((speaker) => items.some((item) => item.speaker === speaker));
}

function pickDefaultVoices(
  speakers: DialogueSpeaker[],
  voices: Voice[],
  saved: Partial<Record<DialogueSpeaker, string>>,
) {
  const available = new Set(voices.map((voice) => voice.voiceId));
  const preferred = PREFERRED_DIALOGUE_VOICES.filter((id) => available.has(id));
  const pool = preferred.length ? preferred : voices.slice(0, 4).map((voice) => voice.voiceId);
  return Object.fromEntries(speakers.map((speaker, index) => [
    speaker,
    saved[speaker] && available.has(saved[speaker]!)
      ? saved[speaker]!
      : pool[index % Math.max(pool.length, 1)] ?? '',
  ])) as Record<DialogueSpeaker, string>;
}

function scriptFromItems(
  items: DialogueItem[],
  saved: DialogueAudio['scriptItems'] | undefined,
) {
  const fallback = items.map((item) => ({
    id: item.id,
    speaker: item.speaker,
    text: dialogueLineToSpeechText(item.text),
  }));
  if (!saved?.length) return fallback;
  if (saved.length !== fallback.length) return fallback;
  const matchingSpeakers = saved.every((line, index) => line.speaker === fallback[index].speaker);
  if (!matchingSpeakers) return fallback;
  return fallback.map((line, index) => ({
    ...line,
    text: saved[index].text || line.text,
  }));
}

export function DialogueAudioModal({
  contentLanguage,
  defaultInstruction = DEFAULT_DIALOGUE_AUDIO_INSTRUCTION,
  defaultPauseSeconds = DIALOGUE_AUDIO_PAUSE_SECONDS,
  defaultSpeakingRate = 0.95,
  initialAudio,
  items,
  onClose,
  onGenerated,
  open,
  speakerNames,
}: {
  contentLanguage: string;
  defaultInstruction?: string;
  defaultPauseSeconds?: number;
  defaultSpeakingRate?: number;
  initialAudio: DialogueAudio | null;
  items: DialogueItem[];
  onClose: () => void;
  onGenerated: (audio: DialogueAudio) => void;
  open: boolean;
  speakerNames: DialogueSpeakerNames;
}) {
  const [voiceCatalog, setVoiceCatalog] = useState<Voice[]>([]);
  const [voices, setVoices] = useState<Record<string, string>>({});
  const [instruction, setInstruction] = useState(defaultInstruction);
  const [speakingRate, setSpeakingRate] = useState(defaultSpeakingRate);
  const [pauseSeconds, setPauseSeconds] = useState(defaultPauseSeconds);
  const [scriptItems, setScriptItems] = useState<DialogueItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('BALANCED');
  const [audio, setAudio] = useState<DialogueAudio | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const speakers = usedSpeakers(items);
  const language = contentLanguage.trim();

  const loadVoices = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/ai/dialogue/audio?language=${encodeURIComponent(language)}`,
      );
      const result = await response.json() as { voices?: Voice[]; error?: string };
      if (!response.ok || !result.voices?.length) {
        throw new Error(result.error ?? 'Could not load the Inworld voice list.');
      }
      setVoiceCatalog(result.voices);
      setVoices(pickDefaultVoices(
        usedSpeakers(items),
        result.voices,
        initialAudio?.voices ?? {},
      ));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load voices.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    if (!open) return;
    setInstruction(initialAudio?.instruction || defaultInstruction);
    setSpeakingRate(initialAudio?.speakingRate || defaultSpeakingRate);
    setPauseSeconds(defaultPauseSeconds);
    setScriptItems(scriptFromItems(items, initialAudio?.scriptItems));
    setDeliveryMode('BALANCED');
    setAudio(initialAudio);
    setPending(false);
    setError('');
    void loadVoices();
    // Re-initialising on every `initialAudio` identity change would refetch the
    // voice list right after a successful generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultInstruction, defaultPauseSeconds, defaultSpeakingRate, open]);

  async function generate() {
    const spokenItems = scriptItems
      .map(({ speaker, text }) => ({ speaker, text: text.trim() }))
      .filter((item) => item.text.length > 0);
    if (!spokenItems.length) {
      setError('Add at least one spoken script line.');
      return;
    }
    const missingVoice = spokenItems.find((item) => !voices[item.speaker]);
    if (missingVoice) {
      setError(`Choose a voice for speaker ${missingVoice.speaker}.`);
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/dialogue/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: spokenItems,
          voices,
          instruction: instruction.trim(),
          language,
          deliveryMode,
          speakingRate,
          pauseSeconds,
        }),
      });
      const result = await response.json() as {
        audio?: { url: string; durationSeconds: number };
        error?: string;
      };
      if (!response.ok || !result.audio) {
        throw new Error(result.error ?? 'Could not generate the dialogue audio.');
      }
      const generated: DialogueAudio = {
        url: result.audio.url,
        voices,
        instruction: instruction.trim(),
        language,
        speakingRate,
        scriptItems: spokenItems,
        durationSeconds: result.audio.durationSeconds,
        updatedAt: new Date().toISOString(),
      };
      setAudio(generated);
      onGenerated(generated);
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the dialogue audio.');
    }
    setPending(false);
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel={audio ? 'Regenerate audio' : 'Generate audio'}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel="Synthesising speech…"
      title="Generate Dialogue Audio"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">Voices</h3>
      <div className="space-y-2">
        {speakers.map((speaker) => (
          <div
            className="grid grid-cols-[8rem_minmax(0,1fr)] items-end gap-3 rounded-lg border border-secondary bg-secondary p-3"
            key={speaker}
          >
            <span className="mb-2.5 truncate text-xs font-semibold text-tertiary">
              {speakerNames[speaker] || `Speaker ${speaker}`}
            </span>
            <label className="block text-xs font-semibold text-tertiary">
              Voice
              <select
                value={voices[speaker] ?? ''}
                disabled={!voiceCatalog.length}
                onChange={(event) => setVoices((current) => ({
                  ...current,
                  [speaker]: event.target.value,
                }))}
                className={inputClass}
              >
                <option value="">
                  {voiceCatalog.length ? 'Select a voice' : 'Loading voices…'}
                </option>
                {voiceCatalog.map((voice) => (
                  <option key={voice.voiceId} value={voice.voiceId}>
                    {voice.displayName}
                    {voice.tags.length ? ` — ${voice.tags.slice(0, 3).join(', ')}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      <h3 className="mt-6 text-sm font-semibold text-primary">Delivery</h3>
      <section className="mt-3 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Speaking instruction
          <textarea
            rows={3}
            value={instruction}
            onChange={(event) => setInstruction(event.target.value)}
            placeholder="friendly, deep tone, not too exaggerated, but still natural"
            className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
          <span className="mt-1.5 block text-xs font-normal text-quaternary">
            Write the instruction in English — it steers every line, whatever
            language the dialogue is in.
          </span>
        </label>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-secondary pt-4">
          <label className="block text-xs font-semibold text-tertiary">
            Speaking rate
            <input
              type="number"
              min={0.5}
              max={1.5}
              step={0.05}
              value={speakingRate}
              onChange={(event) => setSpeakingRate(
                Math.min(1.5, Math.max(0.5, Number(event.target.value) || 1)),
              )}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold text-tertiary">
            Pause between lines (s)
            <input
              type="number"
              min={0}
              max={3}
              step={0.1}
              value={pauseSeconds}
              onChange={(event) => setPauseSeconds(
                Math.min(3, Math.max(0, Number(event.target.value) || 0)),
              )}
              className={inputClass}
            />
          </label>
          <label className="block text-xs font-semibold text-tertiary">
            Variation
            <select
              value={deliveryMode}
              onChange={(event) => setDeliveryMode(event.target.value as DeliveryMode)}
              className={inputClass}
            >
              <option value="STABLE">Stable</option>
              <option value="BALANCED">Balanced</option>
              <option value="CREATIVE">Creative</option>
            </select>
          </label>
        </div>
      </section>

      <h3 className="mt-6 text-sm font-semibold text-primary">Script</h3>
      <div className="mt-3 space-y-3 rounded-xl border border-secondary bg-secondary p-4">
        {scriptItems.map((item, index) => (
          <label className="block" key={item.id || `script-line-${index + 1}`}>
            <span className="text-xs font-semibold text-tertiary">
              {speakerNames[item.speaker] || `Speaker ${item.speaker}`}
              {' '}
              <span className="font-normal text-quaternary">Line {index + 1}</span>
            </span>
            <textarea
              rows={2}
              value={item.text}
              onChange={(event) => setScriptItems((current) => current.map((line, lineIndex) => (
                lineIndex === index
                  ? { ...line, text: event.target.value }
                  : line
              )))}
              className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>
        ))}
        <p className="text-xs text-quaternary">
          The script is editable for pronunciation and spelling tweaks without changing the block content.
        </p>
      </div>

      {audio && (
        <section className="mt-6 rounded-xl border border-secondary bg-secondary p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Volume2 className="size-4 text-brand-secondary" />
              Dialogue audio
              {audio.durationSeconds > 0 && (
                <span className="font-normal text-quaternary">
                  ≈{audio.durationSeconds}s
                </span>
              )}
            </span>
            <a
              href={audio.url}
              download
              className="flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-secondary hover:bg-primary_hover"
            >
              <Download className="size-3.5" />
              Download MP3
            </a>
          </div>
          <audio controls preload="none" src={audio.url} className="mt-3 w-full" />
        </section>
      )}
    </AIGenerationModal>
  );
}
