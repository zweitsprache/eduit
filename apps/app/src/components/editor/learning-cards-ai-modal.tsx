"use client";

import { useEffect, useState } from 'react';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type { LearningCardItem } from '@/components/editor/learning-cards-node';
import type { GermanVerbTableForms } from '@/components/editor/german-verb-table-node';
import {
  buildGermanVerbReferenceForms,
  differingActualCharacters,
  germanLexicalInfinitive,
  GERMAN_REFLEXIVE_PRONOUNS,
  isGermanOptionalReflexiveInfinitive,
  isGermanReflexiveInfinitive,
  splitGermanSeparableForm,
} from '@/lib/german-verb-forms';

type Preset = 'verb-conjugation' | 'article-training' | 'plural-training';
export type Tense =
  | 'present'
  | 'preterite'
  | 'perfect'
  | 'pluperfect'
  | 'future-one'
  | 'future-two';
export type Mood =
  | 'indicative'
  | 'subjunctive-one'
  | 'subjunctive-two'
  | 'imperative';

export type GeneratedLearningCards = {
  items: LearningCardItem[];
  title: string;
};

const FORM_ROWS: Array<{
  key: keyof GermanVerbTableForms;
  label: string;
  pronoun: string;
}> = [
  { key: 'ich', label: '1. Person Singular', pronoun: 'ich' },
  { key: 'du', label: '2. Person Singular, informell', pronoun: 'du' },
  { key: 'formalSingular', label: '2. Person Singular, formell', pronoun: 'Sie' },
  { key: 'thirdSingular', label: '3. Person Singular', pronoun: 'er / sie / es' },
  { key: 'wir', label: '1. Person Plural', pronoun: 'wir' },
  { key: 'ihr', label: '2. Person Plural, informell', pronoun: 'ihr' },
  { key: 'formalPlural', label: '2. Person Plural, formell', pronoun: 'Sie' },
  { key: 'thirdPlural', label: '3. Person Plural', pronoun: 'sie' },
];

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function exceptionMarkup(actual: string, reference: string) {
  const { characters, differs } = differingActualCharacters(actual, reference);
  const protectedCharacters = Array<boolean>(characters.length).fill(false);
  for (const match of actual.matchAll(/\((?:mich|dich|sich|uns|euch)\)/gi)) {
    const start = Array.from(actual.slice(0, match.index)).length;
    const length = Array.from(match[0]).length;
    for (let index = start; index < start + length; index += 1) {
      protectedCharacters[index] = true;
    }
  }
  const runs: Array<{ different: boolean; text: string }> = [];
  characters.forEach((character, index) => {
    const different = differs[index] && !protectedCharacters[index];
    const previous = runs.at(-1);
    if (previous?.different === different) previous.text += character;
    else runs.push({ different, text: character });
  });
  return runs.map(({ different, text }) => (
      different
        ? `<strong data-verb-exception>${escapeHtml(text)}</strong>`
        : escapeHtml(text)
    ))
    .join('');
}

function conjugationMarkup(
  actual: string,
  reference: string,
  separablePrefix: string,
) {
  if (!separablePrefix.trim()) return exceptionMarkup(actual, reference);
  const actualParts = splitGermanSeparableForm(actual, separablePrefix);
  const referenceParts = splitGermanSeparableForm(reference, separablePrefix);
  const base = exceptionMarkup(actualParts.base, referenceParts.base);
  if (!actualParts.hasPrefix) return base;
  const prefix = exceptionMarkup(
    separablePrefix,
    referenceParts.hasPrefix ? separablePrefix : '',
  );
  return `${base} ${prefix}`;
}

function compoundReferenceForms({
  auxiliary,
  infinitive,
  mood,
  participle,
  tense,
}: {
  auxiliary: 'sein' | 'haben';
  infinitive: string;
  mood: Mood;
  participle: string;
  tense: Tense;
}): GermanVerbTableForms {
  const reflexive = isGermanReflexiveInfinitive(infinitive);
  const optionalReflexive = isGermanOptionalReflexiveInfinitive(infinitive);
  const lexicalInfinitive = germanLexicalInfinitive(infinitive);
  const indicative = mood === 'indicative';
  const subjunctiveOne = mood === 'subjunctive-one';
  const habenPresent = indicative
    ? ['habe', 'hast', 'haben', 'hat', 'haben', 'habt', 'haben', 'haben']
    : subjunctiveOne
      ? ['habe', 'habest', 'haben', 'habe', 'haben', 'habet', 'haben', 'haben']
      : ['hätte', 'hättest', 'hätten', 'hätte', 'hätten', 'hättet', 'hätten', 'hätten'];
  const seinPresent = indicative
    ? ['bin', 'bist', 'sind', 'ist', 'sind', 'seid', 'sind', 'sind']
    : subjunctiveOne
      ? ['sei', 'seiest', 'seien', 'sei', 'seien', 'seiet', 'seien', 'seien']
      : ['wäre', 'wärest', 'wären', 'wäre', 'wären', 'wäret', 'wären', 'wären'];
  const habenPast = indicative
    ? ['hatte', 'hattest', 'hatten', 'hatte', 'hatten', 'hattet', 'hatten', 'hatten']
    : ['hätte', 'hättest', 'hätten', 'hätte', 'hätten', 'hättet', 'hätten', 'hätten'];
  const seinPast = indicative
    ? ['war', 'warst', 'waren', 'war', 'waren', 'wart', 'waren', 'waren']
    : ['wäre', 'wärest', 'wären', 'wäre', 'wären', 'wäret', 'wären', 'wären'];
  const werden = indicative
    ? ['werde', 'wirst', 'werden', 'wird', 'werden', 'werdet', 'werden', 'werden']
    : subjunctiveOne
      ? ['werde', 'werdest', 'werden', 'werde', 'werden', 'werdet', 'werden', 'werden']
      : ['würde', 'würdest', 'würden', 'würde', 'würden', 'würdet', 'würden', 'würden'];
  let values: string[];
  if (tense === 'perfect') {
    values = (auxiliary === 'sein' ? seinPresent : habenPresent)
      .map((form) => `${form} ${participle}`);
  } else if (tense === 'pluperfect') {
    values = (auxiliary === 'sein' ? seinPast : habenPast)
      .map((form) => `${form} ${participle}`);
  } else if (tense === 'future-two') {
    values = werden.map((form) => `${form} ${participle} ${auxiliary}`);
  } else {
    values = werden.map((form) => `${form} ${lexicalInfinitive}`);
  }
  if (reflexive) {
    const pronouns = Object.values(GERMAN_REFLEXIVE_PRONOUNS);
    values = values.map((value, index) => {
      const [finite, ...rest] = value.split(' ');
      const pronoun = optionalReflexive
        ? `(${pronouns[index]})`
        : pronouns[index];
      return [finite, pronoun, ...rest].join(' ');
    });
  }
  return {
    ich: values[0],
    du: values[1],
    formalSingular: values[2],
    thirdSingular: values[3],
    wir: values[4],
    ihr: values[5],
    formalPlural: values[6],
    thirdPlural: values[7],
    preteriteIch: values[0],
  };
}

export function buildGeneratedVerbLearningCards(
  result: {
    forms: GermanVerbTableForms;
    infinitive: string;
    separablePrefix?: string;
    auxiliary: 'sein' | 'haben';
    comparisonAuxiliary: 'sein' | 'haben';
    participle: string;
  },
  tense: Tense,
  mood: Exclude<Mood, 'imperative'>,
  displayTenseLabel?: string,
): GeneratedLearningCards {
  const tenseLabel = displayTenseLabel ?? ({
    present: 'Präsens', preterite: 'Präteritum', perfect: 'Perfekt',
    pluperfect: 'Plusquamperfekt', 'future-one': 'Futur I', 'future-two': 'Futur II',
  } as const)[tense];
  const moodLabel = ({
    indicative: 'Indikativ', 'subjunctive-one': 'Konjunktiv I',
    'subjunctive-two': 'Konjunktiv II',
  } as const)[mood];
  const separablePrefix = result.separablePrefix ?? '';
  const referenceForms = tense === 'present' || tense === 'preterite'
    ? buildGermanVerbReferenceForms(result.infinitive, separablePrefix, tense, mood)
    : compoundReferenceForms({
      auxiliary: result.comparisonAuxiliary,
      infinitive: result.infinitive,
      mood,
      participle: buildGermanVerbReferenceForms(
        result.infinitive,
        separablePrefix,
      ).participle,
      tense,
    });
  const items: LearningCardItem[] = FORM_ROWS.map((row, index) => ({
    id: `${result.infinitive}-${tense}-${index + 1}`,
    front: `<strong>${result.infinitive}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} …</div>`,
    back: `<strong>${result.infinitive}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} ${conjugationMarkup(result.forms[row.key], referenceForms[row.key], separablePrefix)}</div>`,
  }));
  items.push({ id: `${result.infinitive}-${tense}-empty`, front: '', back: '' });
  return { items, title: `«${result.infinitive}» | ${moodLabel} ${tenseLabel}` };
}

export function LearningCardsAIModal({
  onClose,
  onGenerated,
  open,
}: {
  onClose: () => void;
  onGenerated: (result: GeneratedLearningCards) => void;
  open: boolean;
}) {
  const [preset, setPreset] = useState<Preset>('verb-conjugation');
  const [tense, setTense] = useState<Tense>('present');
  const [mood, setMood] = useState<Mood>('indicative');
  const [infinitive, setInfinitive] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setPreset('verb-conjugation');
    setTense('present');
    setMood('indicative');
    setInfinitive('');
    setPending(false);
    setError('');
  }, [open]);

  async function generate() {
    if (preset !== 'verb-conjugation' || !infinitive.trim()) {
      setError('Gib einen deutschen Infinitiv ein.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/german-verb-table', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ infinitive: infinitive.trim(), tense, mood }),
      });
      const result = await response.json() as {
        error?: string;
        forms?: GermanVerbTableForms;
        infinitive?: string;
        separablePrefix?: string;
        auxiliary?: 'sein' | 'haben';
        comparisonAuxiliary?: 'sein' | 'haben';
        participle?: string;
      };
      if (
        !response.ok
        || !result.forms
        || !result.infinitive
        || !result.auxiliary
        || !result.comparisonAuxiliary
        || !result.participle
      ) {
        throw new Error(result.error ?? 'Die Lernkarten konnten nicht generiert werden.');
      }
      const forms = result.forms;
      const tenseLabel = ({
        present: 'Präsens',
        preterite: 'Präteritum',
        perfect: 'Perfekt',
        pluperfect: 'Plusquamperfekt',
        'future-one': 'Futur I',
        'future-two': 'Futur II',
      } as const)[tense];
      const moodLabel = ({
        indicative: 'Indikativ',
        'subjunctive-one': 'Konjunktiv I',
        'subjunctive-two': 'Konjunktiv II',
        imperative: 'Imperativ',
      } as const)[mood];
      const separablePrefix = result.separablePrefix ?? '';
      const referenceForms = tense === 'present' || tense === 'preterite'
        ? buildGermanVerbReferenceForms(
          result.infinitive,
          separablePrefix,
          tense,
          mood === 'subjunctive-one'
            ? 'subjunctive-one'
            : mood === 'subjunctive-two'
              ? 'subjunctive-two'
              : 'indicative',
        )
        : compoundReferenceForms({
          auxiliary: result.comparisonAuxiliary,
          infinitive: result.infinitive,
          mood,
          participle: buildGermanVerbReferenceForms(
            result.infinitive,
            separablePrefix,
          ).participle,
          tense,
        });
      const items: LearningCardItem[] = FORM_ROWS.map((row, index) => ({
        id: `${result.infinitive}-${tense}-${index + 1}`,
        front: `<strong>${result.infinitive}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} …</div>`,
        back: `<strong>${result.infinitive}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} ${conjugationMarkup(forms[row.key], referenceForms[row.key], separablePrefix)}</div>`,
      }));
      items.push({
        id: `${result.infinitive}-${tense}-empty`,
        front: '',
        back: '',
      });
      onGenerated({
        items,
        title: `«${result.infinitive}» | ${moodLabel} ${tenseLabel}`,
      });
      onClose();
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Die Lernkarten konnten nicht generiert werden.');
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      generateLabel="Lernkarten generieren"
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel="Verbformen werden generiert …"
      title="Lernkarten mit Eduit AI generieren"
    >
      <label className="block text-sm font-semibold text-primary">
        Preset
        <select
          className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          onChange={(event) => setPreset(event.target.value as Preset)}
          value={preset}
        >
          <option value="verb-conjugation">Verbkonjugation</option>
          <option disabled value="article-training">Artikeltraining (noch nicht verfügbar)</option>
          <option disabled value="plural-training">Pluraltraining (noch nicht verfügbar)</option>
        </select>
      </label>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Zeitform
          <select
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            onChange={(event) => setTense(event.target.value as Tense)}
            value={tense}
          >
            <option value="present">Präsens</option>
            <option value="preterite">Präteritum</option>
            <option value="perfect">Perfekt</option>
            <option value="pluperfect">Plusquamperfekt</option>
            <option value="future-one">Futur I</option>
            <option value="future-two">Futur II</option>
          </select>
        </label>

        <label className="mt-5 block text-sm font-semibold text-primary">
          Modus
          <select
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            onChange={(event) => setMood(event.target.value as Mood)}
            value={mood}
          >
            <option value="indicative">Indikativ</option>
            <option value="subjunctive-one">Konjunktiv I</option>
            <option value="subjunctive-two">Konjunktiv II</option>
            <option disabled value="imperative">Imperativ (Logik folgt)</option>
          </select>
        </label>

        <label className="mt-5 block text-sm font-semibold text-primary">
          Infinitiv
          <input
            autoFocus
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-primary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
            maxLength={80}
            onChange={(event) => setInfinitive(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !pending) void generate();
            }}
            placeholder="z. B. sein"
            value={infinitive}
          />
        </label>
      </section>
    </AIGenerationModal>
  );
}
