"use client";

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/components/i18n/locale-provider';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  generateTwoWayItems,
  TWO_WAY_PREPOSITIONS,
  type TwoWayMode,
  type TwoWayCase,
  type TwoWayPreposition,
  type TwoWayPrepositionItem,
} from '@/lib/two-way-prepositions';

export function TwoWayPrepositionsAIModal({
  initialCount,
  onClose,
  onGenerated,
  open,
}: {
  initialCount: number;
  onClose: () => void;
  onGenerated: (result: {
    instruction: string;
    mode: TwoWayMode;
    items: TwoWayPrepositionItem[];
  }) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [mode, setMode] = useState<TwoWayMode>('mcq');
  const [caseSelection, setCaseSelection] =
    useState<'accusative' | 'dative' | 'both'>('both');
  const [prepositions, setPrepositions] = useState<TwoWayPreposition[]>([
    ...TWO_WAY_PREPOSITIONS,
  ]);
  const [count, setCount] = useState(6);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode('mcq');
    setCaseSelection('both');
    setPrepositions([...TWO_WAY_PREPOSITIONS]);
    setCount(Math.min(12, Math.max(1, initialCount || 6)));
    setError('');
  }, [initialCount, open]);

  const availableCount = useMemo(
    () => prepositions.length * (caseSelection === 'both' ? 12 : 6),
    [caseSelection, prepositions.length],
  );
  const actualCount = Math.min(count, availableCount);

  const generate = () => {
    if (!prepositions.length) {
      setError(de
        ? 'Wähle mindestens eine Präposition aus.'
        : 'Select at least one preposition.');
      return;
    }
    onGenerated({
      instruction: mode === 'mcq'
        ? 'Wähle die Aussage, die zur Abbildung passt.'
        : 'Entscheide, ob die Aussage zur Abbildung passt.',
      mode,
      items: generateTwoWayItems({
        cases: (
          caseSelection === 'both'
            ? ['accusative', 'dative']
            : [caseSelection]
        ) as TwoWayCase[],
        count: actualCount,
        mode,
        prepositions,
      }),
    });
  };

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={generate}
      open={open}
      pending={false}
      title={de
        ? 'Wechselpräpositionen generieren'
        : 'Generate two-way prepositions'}
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <p className="text-sm font-semibold text-primary">
          {de ? 'Aufgabentyp' : 'Activity type'}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {([
            ['mcq', de ? 'Multiple Choice' : 'Multiple choice'],
            ['trueFalse', de ? 'Richtig / falsch' : 'True / false'],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={mode === value}
              className={[
                'h-10 rounded-md border px-3 text-sm font-semibold transition',
                mode === value
                  ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                  : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
              ].join(' ')}
              key={value}
              onClick={() => setMode(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold text-primary">
          {de ? 'Kasus und Frage' : 'Case and question'}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {([
            ['accusative', 'Akkusativ | Wohin?'],
            ['dative', 'Dativ | Wo?'],
            ['both', de ? 'Beide' : 'Both'],
          ] as const).map(([value, label]) => (
            <button
              aria-pressed={caseSelection === value}
              className={[
                'min-h-10 rounded-md border px-2 py-2 text-sm font-semibold transition',
                caseSelection === value
                  ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                  : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
              ].join(' ')}
              key={value}
              onClick={() => setCaseSelection(value)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <p className="mt-5 text-sm font-semibold text-primary">
          {de ? 'Präpositionen' : 'Prepositions'}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {TWO_WAY_PREPOSITIONS.map((preposition) => {
            const selected = prepositions.includes(preposition);
            return (
              <button
                aria-pressed={selected}
                className={[
                  'h-9 rounded-md border text-sm font-semibold transition',
                  selected
                    ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                    : 'border-primary bg-primary text-secondary hover:bg-primary_hover',
                ].join(' ')}
                key={preposition}
                onClick={() => setPrepositions((current) => (
                  selected
                    ? current.filter((value) => value !== preposition)
                    : [...current, preposition]
                ))}
                type="button"
              >
                {preposition}
              </button>
            );
          })}
        </div>

        <label className="mt-5 block text-sm font-semibold text-primary">
          {de ? 'Anzahl' : 'Number of items'}
          <input
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            max={12}
            min={1}
            onChange={(event) => setCount(Math.min(12, Math.max(1, Number(event.target.value))))}
            type="number"
            value={count}
          />
        </label>
        <p className="mt-2 text-xs text-quaternary">
          {de
            ? `${actualCount} eindeutige Kompositionen werden erstellt.`
            : `${actualCount} unique compositions will be created.`}
        </p>
      </section>
    </AIGenerationModal>
  );
}
