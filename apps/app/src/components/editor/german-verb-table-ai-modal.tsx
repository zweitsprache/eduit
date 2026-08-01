"use client";

import { useEffect, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { useI18n } from '@/components/i18n/locale-provider';
import type {
  GermanVerbTableAttrs,
  GermanVerbTableForms,
  GermanVerbTableMultipleVerb,
} from '@/components/editor/german-verb-table-node';
import type { GermanVerbAuxiliary } from '@/lib/german-verb-forms';

export type GeneratedGermanVerbTable = (Pick<
  GermanVerbTableAttrs,
  | 'leftVerb'
  | 'leftForms'
  | 'leftAuxiliary'
  | 'leftParticiple'
  | 'comparisonAuxiliary'
  | 'separablePrefix'
  | 'tense'
> | Pick<GermanVerbTableAttrs, 'multipleVerbs' | 'tense'>);

type GermanVerbTableAIInitialSettings = Pick<
  GermanVerbTableAttrs,
  'tableStyle' | 'multipleVerbCount' | 'multipleVerbs' | 'leftVerb' | 'tense'
>;

type GermanVerbGenerationResult = {
  infinitive: string;
  forms: GermanVerbTableForms;
  auxiliary: GermanVerbAuxiliary;
  participle: string;
  comparisonAuxiliary: GermanVerbAuxiliary;
  separablePrefix: string;
};

export function GermanVerbTableAIModal({
  initialSettings,
  onClose,
  onGenerated,
  open,
}: {
  initialSettings: GermanVerbTableAIInitialSettings;
  onClose: () => void;
  onGenerated: (result: GeneratedGermanVerbTable) => void;
  open: boolean;
}) {
  const { locale } = useI18n();
  const de = locale === 'de';
  const [infinitive, setInfinitive] = useState('');
  const [multipleInfinitiveText, setMultipleInfinitiveText] = useState('');
  const [tense, setTense] = useState<'present' | 'preterite'>('present');
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setInfinitive(initialSettings.leftVerb);
    setMultipleInfinitiveText(
      initialSettings.multipleVerbs
        .slice(0, initialSettings.multipleVerbCount)
        .map(({ verb }) => verb)
        .filter(Boolean)
        .join('\n'),
    );
    setTense(initialSettings.tense);
    setSortAlphabetically(false);
    setPending(false);
    setError('');
  }, [open]);

  async function generateVerb(value: string): Promise<GermanVerbGenerationResult> {
    const response = await fetch('/api/ai/german-verb-table', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ infinitive: value.trim(), tense }),
    });
    const result = await response.json() as Partial<GermanVerbGenerationResult> & {
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
    return {
      infinitive: result.infinitive,
      forms: result.forms,
      auxiliary: result.auxiliary,
      participle: result.participle,
      comparisonAuxiliary: result.comparisonAuxiliary,
      separablePrefix: result.separablePrefix ?? '',
    };
  }

  async function generate() {
    const multiple = initialSettings.tableStyle === 'multiple';
    const enteredInfinitives = multiple
      ? multipleInfinitiveText
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)
      : [infinitive];
    const requestedInfinitives = multiple && sortAlphabetically
      ? [...enteredInfinitives].sort(
        new Intl.Collator('de-CH', { sensitivity: 'base' }).compare,
      )
      : enteredInfinitives;
    if (requestedInfinitives.length > 50) {
      setError(de
        ? 'Es können maximal 50 Verben auf einmal generiert werden.'
        : 'You can generate up to 50 verbs at once.');
      return;
    }
    const populatedInfinitives = requestedInfinitives
      .map((value, index) => ({ index, value }))
      .filter(({ value }) => value.trim());
    if (!populatedInfinitives.length) {
      setError(de
        ? 'Gib mindestens einen deutschen Infinitiv ein.'
        : 'Enter at least one German infinitive.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const results: GermanVerbGenerationResult[] = [];
      for (let index = 0; index < populatedInfinitives.length; index += 5) {
        results.push(...await Promise.all(
          populatedInfinitives
            .slice(index, index + 5)
            .map(({ value }) => generateVerb(value)),
        ));
      }
      if (multiple) {
        const multipleVerbs: GermanVerbTableMultipleVerb[] =
          initialSettings.multipleVerbs.map((verb, index) => ({
            ...verb,
            verb: index < requestedInfinitives.length
              ? requestedInfinitives[index].trim()
              : '',
          }));
        populatedInfinitives.forEach(({ index }, resultIndex) => {
          const result = results[resultIndex];
          multipleVerbs[index] = {
            verb: result.infinitive,
            forms: result.forms,
            separablePrefix: result.separablePrefix,
          };
        });
        onGenerated({
          multipleVerbs,
          tense,
        });
      } else {
        const [result] = results;
        onGenerated({
          leftVerb: result.infinitive,
          leftForms: result.forms,
          leftAuxiliary: result.auxiliary,
          leftParticiple: result.participle,
          comparisonAuxiliary: result.comparisonAuxiliary,
          separablePrefix: result.separablePrefix,
          tense,
        });
      }
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
        {initialSettings.tableStyle === 'multiple'
          ? (de ? 'Verben' : 'Verbs')
          : (de ? 'Verb' : 'Verb')}
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        {initialSettings.tableStyle === 'multiple' ? (
          <>
              <label
                className="block text-sm font-semibold text-primary"
              >
                {de ? 'Infinitive – ein Verb pro Zeile' : 'Infinitives – one verb per line'}
                <textarea
                  autoFocus
                  className="mt-2 min-h-36 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-medium text-primary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
                  maxLength={4050}
                  onChange={(event) => setMultipleInfinitiveText(event.target.value)}
                  placeholder={de
                    ? 'abfahren\neinkaufen\ngehen'
                    : 'abfahren\neinkaufen\ngehen'}
                  value={multipleInfinitiveText}
                />
              </label>
            <p className="mt-3 text-xs text-tertiary">
              {de
                ? `${initialSettings.multipleVerbCount} Verben pro Tabelle, maximal 50 insgesamt.`
                : `${initialSettings.multipleVerbCount} verbs per table, up to 50 total.`}
            </p>
            <label className="mt-4 flex items-center gap-3 text-sm font-semibold text-primary">
              <input
                checked={sortAlphabetically}
                className="size-4 accent-brand"
                onChange={(event) => setSortAlphabetically(event.target.checked)}
                type="checkbox"
              />
              {de ? 'Verben alphabetisch sortieren' : 'Sort verbs alphabetically'}
            </label>
          </>
        ) : (
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
        )}
      </section>

      <label className="mt-5 flex items-center gap-3 rounded-xl border border-secondary bg-primary p-4 text-sm font-semibold text-primary">
          <input
            checked={tense === 'preterite'}
            className="size-4 accent-brand"
            onChange={(event) => setTense(
              event.target.checked ? 'preterite' : 'present',
            )}
            type="checkbox"
          />
          {de
            ? 'Präteritum statt Präsens generieren'
            : 'Generate preterite instead of present'}
        </label>

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
            {tense === 'preterite'
              ? 'Präteritum: Stamm + te + Endung'
              : 'Präsens: Stamm + Endung'}
          </span>
          <span className="rounded-md border border-secondary bg-secondary px-3 py-2">
            Perfekt: haben / sein
          </span>
          <span className="rounded-md border border-secondary bg-secondary px-3 py-2">
            Trennbare und unregelmässige Verben
          </span>
        </div>
      </section>
    </AIGenerationModal>
  );
}
