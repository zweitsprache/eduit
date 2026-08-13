"use client";

import { useEffect, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type {
  DeclinationBaseForms,
  DeclinationCaseKey,
  DeclinationCaseRow,
  DeclinationGenderKey,
} from '@/components/editor/declination-table-node';

export type GeneratedDeclinationTable = {
  rows: DeclinationCaseRow[];
  baseAdjectives: DeclinationBaseForms;
  baseNouns: DeclinationBaseForms;
};

const GENDER_KEYS: DeclinationGenderKey[] = [
  'masculine',
  'feminine',
  'neuter',
  'plural',
];

const CASE_KEYS: DeclinationCaseKey[] = ['nom', 'akk', 'dat', 'gen'];

const NOUN_LABELS: Array<{ key: DeclinationGenderKey; label: string }> = [
  { key: 'masculine', label: 'Nomen 1 (Maskulinum)' },
  { key: 'neuter', label: 'Nomen 2 (Neutral)' },
  { key: 'feminine', label: 'Nomen 3 (Femininum)' },
  { key: 'plural', label: 'Nomen 4 (Plural)' },
];

const ADJECTIVE_LABELS: Array<{ key: DeclinationGenderKey; label: string }> = [
  { key: 'masculine', label: 'Adjektiv 1 (Maskulinum)' },
  { key: 'neuter', label: 'Adjektiv 2 (Neutral)' },
  { key: 'feminine', label: 'Adjektiv 3 (Femininum)' },
  { key: 'plural', label: 'Adjektiv 4 (Plural)' },
];

export function DeclinationTableAIModal({
  onClose,
  onGenerated,
  open,
}: {
  onClose: () => void;
  onGenerated: (result: GeneratedDeclinationTable) => void;
  open: boolean;
}) {
  const [nouns, setNouns] = useState<Record<DeclinationGenderKey, string>>({
    masculine: '',
    feminine: '',
    neuter: '',
    plural: '',
  });
  const [adjectives, setAdjectives] = useState<Record<DeclinationGenderKey, string>>({
    masculine: '',
    feminine: '',
    neuter: '',
    plural: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setNouns({
      masculine: '',
      feminine: '',
      neuter: '',
      plural: '',
    });
    setAdjectives({
      masculine: '',
      feminine: '',
      neuter: '',
      plural: '',
    });
    setPending(false);
    setError('');
  }, [open]);

  async function generate() {
    const nounValues = GENDER_KEYS.map((key) => nouns[key].trim()).filter(Boolean);
    if (nounValues.length < 4) {
      setError('Bitte gib alle 4 Nomen ein.');
      return;
    }

    const adjectiveValues = GENDER_KEYS.map((key) => adjectives[key].trim()).filter(Boolean);
    if (!adjectiveValues.length) {
      setError('Bitte gib mindestens 1 Adjektiv ein.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/declination-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nouns, adjectives }),
      });
      const result = await response.json() as {
        error?: string;
        rows?: DeclinationCaseRow[];
        baseAdjectives?: DeclinationBaseForms;
        baseNouns?: DeclinationBaseForms;
      };
      if (
        !response.ok
        || !result.rows
        || result.rows.length !== CASE_KEYS.length
        || !result.baseAdjectives
        || !result.baseNouns
      ) {
        throw new Error(result.error ?? 'Die Deklinationstabelle konnte nicht generiert werden.');
      }
      onGenerated({
        rows: result.rows,
        baseAdjectives: result.baseAdjectives,
        baseNouns: result.baseNouns,
      });
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Die Deklinationstabelle konnte nicht generiert werden.');
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel="Tabelle generieren"
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel="Deklinationen werden erstellt …"
      title="Deklinationstabelle mit Eduit AI generieren"
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">4 Nomen</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {NOUN_LABELS.map(({ key, label }) => (
            <label className="text-sm font-semibold text-primary" key={key}>
              {label}
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                onChange={(event) => setNouns((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
                placeholder="z. B. Rock"
                type="text"
                value={nouns[key]}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">Adjektive</h3>
        <p className="mt-1 text-xs text-tertiary">
          Gib 1 oder 4 Adjektive ein. Wenn nur das erste Feld ausgefüllt ist, wird es für alle 4 Nomen verwendet.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {ADJECTIVE_LABELS.map(({ key, label }, index) => (
            <label className="text-sm font-semibold text-primary" key={key}>
              {label}
              <input
                className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                onChange={(event) => setAdjectives((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
                placeholder={index === 0 ? 'z. B. rot' : 'optional'}
                type="text"
                value={adjectives[key]}
              />
            </label>
          ))}
        </div>
      </section>
    </AIGenerationModal>
  );
}
