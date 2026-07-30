"use client";

import { useEffect, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type {
  OccupationPortraitAttrs,
  OccupationPortraitTextType,
} from '@/components/editor/occupation-portrait-node';
import type { WorksheetContext } from '@/lib/worksheet-types';

const LEVELS = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'] as const;
const PHASES = ['beginning', 'middle', 'towards-end', 'completed'] as const;
const inputClass = 'mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

function initialLevel(value: string) {
  return LEVELS.find((level) => value.includes(level)) ?? 'A2.1';
}

export function OccupationPortraitAIModal({
  context,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (result: OccupationPortraitAttrs) => boolean | void;
  open: boolean;
}) {
  const [profession, setProfession] = useState('');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('A2.1');
  const [phase, setPhase] = useState<(typeof PHASES)[number]>('beginning');
  const [textType, setTextType] =
    useState<OccupationPortraitTextType>('self-portrait');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setProfession('');
    setLevel(initialLevel(context.languageLevel));
    setPhase('beginning');
    setTextType('self-portrait');
    setPending(false);
    setError('');
  }, [context.languageLevel, open]);

  async function generate() {
    if (profession.trim().length < 2) {
      setError('Wähle oder erfasse einen Beruf.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/occupation-portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profession: profession.trim(),
          proficiencyLevel: level,
          proficiencyPhase: phase,
          textType,
        }),
      });
      const result = await response.json() as OccupationPortraitAttrs & {
        error?: string;
      };
      if (!response.ok || !result.sourceUrl || !result.paragraphs) {
        throw new Error(result.error ?? 'Berufsporträt konnte nicht erstellt werden.');
      }
      if (onGenerated(result) === false) {
        throw new Error('Berufsporträt konnte nicht eingefügt werden.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Generierung fehlgeschlagen.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel="Berufsporträt erstellen"
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={pending}
      progressLabel="Quelle prüfen und Text erstellen…"
      title="Berufsporträt"
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-xs font-semibold text-tertiary">
          Beruf
          <input
            autoFocus
            className={inputClass}
            onChange={(event) => setProfession(event.target.value)}
            placeholder="z. B. Kaufmann/-frau EFZ"
            value={profession}
          />
        </label>
        <p className="mt-2 text-xs text-quaternary">
          Quelle: berufsberatung.ch
        </p>
      </section>
      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <div className="grid grid-cols-3 gap-4">
          <label className="text-xs font-semibold text-tertiary">
            Sprachniveau
            <select
              className={inputClass}
              onChange={(event) => setLevel(
                event.target.value as (typeof LEVELS)[number],
              )}
              value={level}
            >
              {LEVELS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Position im Teilniveau
            <select
              className={inputClass}
              onChange={(event) => setPhase(
                event.target.value as (typeof PHASES)[number],
              )}
              value={phase}
            >
              <option value="beginning">Anfang</option>
              <option value="middle">Mitte</option>
              <option value="towards-end">Gegen Ende</option>
              <option value="completed">Abgeschlossen</option>
            </select>
          </label>
          <fieldset>
            <legend className="text-xs font-semibold text-tertiary">
              Textsorte
            </legend>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {([
                ['self-portrait', 'Selbstporträt'],
                ['portrait', 'Porträt'],
              ] as const).map(([value, label]) => (
                <button
                  aria-pressed={textType === value}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold ${
                    textType === value
                      ? 'border-brand bg-brand-primary text-brand-secondary'
                      : 'border-primary bg-primary text-secondary'
                  }`}
                  key={value}
                  onClick={() => setTextType(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>
    </AIGenerationModal>
  );
}
