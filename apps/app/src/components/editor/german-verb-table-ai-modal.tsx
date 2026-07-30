"use client";

import { useEffect, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { useI18n } from '@/components/i18n/locale-provider';
import type {
  GermanVerbTableAttrs,
  GermanVerbTableForms,
} from '@/components/editor/german-verb-table-node';
import type { GermanVerbAuxiliary } from '@/lib/german-verb-forms';

export type GeneratedGermanVerbTable = Pick<
  GermanVerbTableAttrs,
  | 'leftVerb'
  | 'leftForms'
  | 'leftAuxiliary'
  | 'leftParticiple'
  | 'comparisonAuxiliary'
  | 'separablePrefix'
>;

export function GermanVerbTableAIModal({
  initialVerb,
  onClose,
  onGenerated,
  open,
}: {
  initialVerb: string;
  onClose: () => void;
  onGenerated: (result: GeneratedGermanVerbTable) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [infinitive, setInfinitive] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setInfinitive(initialVerb);
    setPending(false);
    setError('');
  }, [initialVerb, open]);

  async function generate() {
    if (!infinitive.trim()) {
      setError(de
        ? 'Gib einen deutschen Infinitiv ein.'
        : 'Enter a German infinitive.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/german-verb-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infinitive: infinitive.trim() }),
      });
      const result = await response.json() as {
        infinitive?: string;
        forms?: GermanVerbTableForms;
        auxiliary?: GermanVerbAuxiliary;
        participle?: string;
        comparisonAuxiliary?: GermanVerbAuxiliary;
        separablePrefix?: string;
        error?: string;
      };
      if (
        !response.ok
        || !result.infinitive
        || !result.forms
        || !result.auxiliary
        || !result.participle
        || !result.comparisonAuxiliary
      ) {
        throw new Error(result.error ?? (de
          ? 'Die Verbtabelle konnte nicht generiert werden.'
          : 'The verb table could not be generated.'));
      }
      onGenerated({
        leftVerb: result.infinitive,
        leftForms: result.forms,
        leftAuxiliary: result.auxiliary,
        leftParticiple: result.participle,
        comparisonAuxiliary: result.comparisonAuxiliary,
        separablePrefix: result.separablePrefix ?? '',
      });
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : de
          ? 'Die Verbtabelle konnte nicht generiert werden.'
          : 'The verb table could not be generated.');
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel={de ? 'Tabelle generieren' : 'Generate table'}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel={de ? 'Verbformen werden geprüft …' : 'Checking verb forms…'}
      title={de
        ? 'Verbtabelle mit Eduit AI generieren'
        : 'Generate German verb table with Eduit AI'}
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        {de ? 'Verb' : 'Verb'}
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          {de ? 'Infinitiv' : 'German infinitive'}
          <input
            autoFocus
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
            maxLength={80}
            onChange={(event) => setInfinitive(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !pending) void generate();
            }}
            placeholder={de ? 'z. B. fahren' : 'e.g. fahren'}
            type="text"
            value={infinitive}
          />
        </label>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-primary p-5">
        <h3 className="text-sm font-semibold text-primary">
          {de ? 'Hervorgehobene Ausnahmen' : 'Highlighted exceptions'}
        </h3>
        <p className="mt-1 text-sm leading-6 text-tertiary">
          {de
            ? 'Die korrekten Formen werden mit der regelmässigen Bildung verglichen. Abweichende Buchstaben erscheinen in der Tabelle fett.'
            : 'Correct forms are compared with strict regular formation. Characters that differ are shown in bold in the table.'}
        </p>
        <div className="mt-4 grid gap-2 text-xs text-tertiary sm:grid-cols-3">
          <span className="rounded-md border border-secondary bg-secondary px-3 py-2">
            Präsens: Stamm + Endung
          </span>
          <span className="rounded-md border border-secondary bg-secondary px-3 py-2">
            Perfekt: haben / sein
          </span>
          <span className="rounded-md border border-secondary bg-secondary px-3 py-2">
            Präteritum: Stamm + te
          </span>
        </div>
      </section>
    </AIGenerationModal>
  );
}
