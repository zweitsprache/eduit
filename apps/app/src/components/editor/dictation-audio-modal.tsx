"use client";

import { useCallback, useEffect, useState } from 'react';
import { Download, Volume2 } from 'lucide-react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type {
  DictationAudioTrack,
  DictationLineItem,
} from '@/components/editor/dictation-lines-node';
import { DEFAULT_DIALOGUE_AUDIO_INSTRUCTION } from '@/lib/dialogue-audio';

type Voice = {
  voiceId: string;
  displayName: string;
  description: string;
  tags: string[];
};

type DeliveryMode = 'STABLE' | 'BALANCED' | 'CREATIVE';
const inputClass = 'mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

export function DictationAudioModal({
  contentLanguage,
  initialTracks,
  items,
  onClose,
  onGenerated,
  open,
}: {
  contentLanguage: string;
  initialTracks: DictationAudioTrack[];
  items: DictationLineItem[];
  onClose: () => void;
  onGenerated: (result: { tracks: DictationAudioTrack[]; playlistUrl: string }) => void;
  open: boolean;
}) {
  const [voiceCatalog, setVoiceCatalog] = useState<Voice[]>([]);
  const [voice, setVoice] = useState('');
  const [instruction, setInstruction] = useState(DEFAULT_DIALOGUE_AUDIO_INSTRUCTION);
  const [speakingRate, setSpeakingRate] = useState(0.9);
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('BALANCED');
  const [tracks, setTracks] = useState<DictationAudioTrack[]>(initialTracks);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const language = contentLanguage.trim();

  const loadVoices = useCallback(async () => {
    try {
      const response = await fetch(`/api/ai/dialogue/audio?language=${encodeURIComponent(language)}`);
      const result = await response.json() as { voices?: Voice[]; error?: string };
      if (!response.ok || !result.voices?.length) throw new Error(result.error ?? 'Could not load voices.');
      setVoiceCatalog(result.voices);
      setVoice((current) => current || result.voices![0].voiceId);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load voices.');
    }
  }, [language]);

  useEffect(() => {
    if (!open) return;
    setTracks(initialTracks);
    setInstruction(DEFAULT_DIALOGUE_AUDIO_INSTRUCTION);
    setPending(false);
    setError('');
    void loadVoices();
  }, [initialTracks, loadVoices, open]);

  async function generate() {
    const spokenItems = items.filter((item) => item.text.trim());
    if (!spokenItems.length) {
      setError('Add at least one dictation answer first.');
      return;
    }
    if (!voice) {
      setError('Choose a voice.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/dictation/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: spokenItems,
          voice,
          instruction: instruction.trim(),
          language,
          deliveryMode,
          speakingRate,
        }),
      });
      const result = await response.json() as { tracks?: Array<Omit<DictationAudioTrack, 'updatedAt'>>; playlistUrl?: string; error?: string };
      if (!response.ok || !result.tracks || !result.playlistUrl) throw new Error(result.error ?? 'Could not generate dictation audio.');
      const generated = result.tracks.map((track) => ({
        ...track,
        updatedAt: new Date().toISOString(),
      }));
      setTracks(generated);
      onGenerated({ tracks: generated, playlistUrl: result.playlistUrl });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Could not generate dictation audio.');
    }
    setPending(false);
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel={tracks.length ? 'Regenerate audio' : 'Generate audio'}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel="Synthesising dictation tracks…"
      title="Generate Dictation Audio"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">Voice</h3>
      <select value={voice} disabled={!voiceCatalog.length} onChange={(event) => setVoice(event.target.value)} className={inputClass}>
        <option value="">{voiceCatalog.length ? 'Select a voice' : 'Loading voices…'}</option>
        {voiceCatalog.map((candidate) => <option key={candidate.voiceId} value={candidate.voiceId}>{candidate.displayName}</option>)}
      </select>
      <h3 className="mt-6 text-sm font-semibold text-primary">Delivery</h3>
      <section className="mt-3 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Speaking instruction
          <textarea rows={3} value={instruction} onChange={(event) => setInstruction(event.target.value)} placeholder="clear, natural pronunciation" className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand" />
        </label>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-secondary pt-4">
          <label className="block text-xs font-semibold text-tertiary">Speaking rate<input type="number" min={0.5} max={1.5} step={0.05} value={speakingRate} onChange={(event) => setSpeakingRate(Math.min(1.5, Math.max(0.5, Number(event.target.value) || 1)))} className={inputClass} /></label>
          <label className="block text-xs font-semibold text-tertiary">Variation<select value={deliveryMode} onChange={(event) => setDeliveryMode(event.target.value as DeliveryMode)} className={inputClass}><option value="STABLE">Stable</option><option value="BALANCED">Balanced</option><option value="CREATIVE">Creative</option></select></label>
        </div>
      </section>
      <h3 className="mt-6 text-sm font-semibold text-primary">Items</h3>
      <div className="mt-3 space-y-3 rounded-xl border border-secondary bg-secondary p-4">
        {items.map((item, index) => {
          const track = tracks.find((candidate) => candidate.itemId === item.id);
          return <div className="rounded-lg border border-secondary bg-primary p-3" key={item.id}><div className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary"><span>Item {index + 1}</span>{track && <a href={track.url} download className="flex items-center gap-1 text-brand"><Download className="size-3.5" />Download</a>}</div><p className="mt-1 text-sm text-secondary">{item.text || 'No answer text'}</p>{track && <audio controls preload="none" src={track.url} className="mt-2 w-full" />}</div>;
        })}
      </div>
      {tracks.length > 0 && <p className="mt-4 flex items-center gap-2 text-xs text-tertiary"><Volume2 className="size-4 text-brand-secondary" />One QR code opens all dictation tracks in the micro-player.</p>}
    </AIGenerationModal>
  );
}
