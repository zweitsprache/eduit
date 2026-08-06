import {
  buildGermanVerbReferenceForms,
  differingActualCharacters,
  GERMAN_REFLEXIVE_PRONOUNS,
  germanLexicalInfinitive,
  isGermanOptionalReflexiveInfinitive,
  isGermanReflexiveInfinitive,
  splitGermanSeparableForm,
} from '@/lib/german-verb-forms';

export type VerbTense = 'present' | 'preterite' | 'perfect' | 'pluperfect' | 'future-one' | 'future-two';
export type VerbMood = 'indicative' | 'subjunctive-one' | 'subjunctive-two';
type Forms = Record<'ich' | 'du' | 'formalSingular' | 'thirdSingular' | 'wir' | 'ihr' | 'formalPlural' | 'thirdPlural' | 'preteriteIch', string>;

const rows: Array<{ key: keyof Forms; label: string; pronoun: string }> = [
  { key: 'ich', label: '1. Person Singular', pronoun: 'ich' },
  { key: 'du', label: '2. Person Singular, informell', pronoun: 'du' },
  { key: 'formalSingular', label: '2. Person Singular, formell', pronoun: 'Sie' },
  { key: 'thirdSingular', label: '3. Person Singular', pronoun: 'er / sie / es' },
  { key: 'wir', label: '1. Person Plural', pronoun: 'wir' },
  { key: 'ihr', label: '2. Person Plural, informell', pronoun: 'ihr' },
  { key: 'formalPlural', label: '2. Person Plural, formell', pronoun: 'Sie' },
  { key: 'thirdPlural', label: '3. Person Plural', pronoun: 'sie' },
];

const escapeHtml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

function marked(actual: string, reference: string) {
  const { characters, differs } = differingActualCharacters(actual, reference);
  const protectedCharacters = Array<boolean>(characters.length).fill(false);
  for (const match of actual.matchAll(/\((?:mich|dich|sich|uns|euch)\)/gi)) {
    const start = Array.from(actual.slice(0, match.index)).length;
    for (let index = start; index < start + Array.from(match[0]).length; index += 1) protectedCharacters[index] = true;
  }
  const runs: Array<{ different: boolean; text: string }> = [];
  characters.forEach((character, index) => {
    const different = differs[index] && !protectedCharacters[index];
    const previous = runs.at(-1);
    if (previous?.different === different) previous.text += character;
    else runs.push({ different, text: character });
  });
  return runs.map(({ different, text }) => different
    ? `<strong data-verb-exception>${escapeHtml(text)}</strong>`
    : escapeHtml(text)).join('');
}

function conjugationMarkup(actual: string, reference: string, separablePrefix: string) {
  if (!separablePrefix.trim()) return marked(actual, reference);
  const actualParts = splitGermanSeparableForm(actual, separablePrefix);
  const referenceParts = splitGermanSeparableForm(reference, separablePrefix);
  const base = marked(actualParts.base, referenceParts.base);
  if (!actualParts.hasPrefix) return base;
  return `${base} ${marked(actualParts.prefix, referenceParts.prefix)}`;
}

function compoundForms(result: VerbResult, tense: VerbTense, mood: VerbMood): Forms {
  const indicative = mood === 'indicative';
  const subjunctiveOne = mood === 'subjunctive-one';
  const auxiliary = result.comparisonAuxiliary;
  const infinitive = germanLexicalInfinitive(result.infinitive);
  const reflexive = isGermanReflexiveInfinitive(result.infinitive);
  const optional = isGermanOptionalReflexiveInfinitive(result.infinitive);
  const habenPresent = indicative ? ['habe','hast','haben','hat','haben','habt','haben','haben'] : subjunctiveOne ? ['habe','habest','haben','habe','haben','habet','haben','haben'] : ['hätte','hättest','hätten','hätte','hätten','hättet','hätten','hätten'];
  const seinPresent = indicative ? ['bin','bist','sind','ist','sind','seid','sind','sind'] : subjunctiveOne ? ['sei','seiest','seien','sei','seien','seiet','seien','seien'] : ['wäre','wärest','wären','wäre','wären','wäret','wären','wären'];
  const habenPast = indicative ? ['hatte','hattest','hatten','hatte','hatten','hattet','hatten','hatten'] : ['hätte','hättest','hätten','hätte','hätten','hättet','hätten','hätten'];
  const seinPast = indicative ? ['war','warst','waren','war','waren','wart','waren','waren'] : ['wäre','wärest','wären','wäre','wären','wäret','wären','wären'];
  const werden = indicative ? ['werde','wirst','werden','wird','werden','werdet','werden','werden'] : subjunctiveOne ? ['werde','werdest','werden','werde','werden','werdet','werden','werden'] : ['würde','würdest','würden','würde','würden','würdet','würden','würden'];
  const referenceParticiple = buildGermanVerbReferenceForms(result.infinitive, result.separablePrefix ?? '').participle;
  let values = tense === 'perfect'
    ? (auxiliary === 'sein' ? seinPresent : habenPresent).map((form) => `${form} ${referenceParticiple}`)
    : tense === 'pluperfect'
      ? (auxiliary === 'sein' ? seinPast : habenPast).map((form) => `${form} ${referenceParticiple}`)
      : tense === 'future-two'
        ? werden.map((form) => `${form} ${referenceParticiple} ${auxiliary}`)
        : werden.map((form) => `${form} ${infinitive}`);
  if (reflexive) values = values.map((value, index) => {
    const [finite, ...rest] = value.split(' ');
    const pronoun = Object.values(GERMAN_REFLEXIVE_PRONOUNS)[index];
    return [finite, optional ? `(${pronoun})` : pronoun, ...rest].join(' ');
  });
  return Object.fromEntries([...rows.map(({ key }, index) => [key, values[index]]), ['preteriteIch', values[0]]]) as Forms;
}

export type VerbResult = { forms: Forms; infinitive: string; separablePrefix?: string; auxiliary: 'sein' | 'haben'; comparisonAuxiliary: 'sein' | 'haben'; participle: string };

export function buildVerbLearningCards(result: VerbResult, tense: VerbTense, mood: VerbMood, displayTenseLabel?: string) {
  const tenseLabel = displayTenseLabel ?? ({ present:'Präsens', preterite:'Präteritum', perfect:'Perfekt', pluperfect:'Plusquamperfekt', 'future-one':'Futur I', 'future-two':'Futur II' } as const)[tense];
  const moodLabel = ({ indicative:'Indikativ', 'subjunctive-one':'Konjunktiv I', 'subjunctive-two':'Konjunktiv II' } as const)[mood];
  const prefix = result.separablePrefix ?? '';
  const reference = tense === 'present' || tense === 'preterite'
    ? buildGermanVerbReferenceForms(result.infinitive, prefix, tense, mood)
    : compoundForms(result, tense, mood);
  const items = rows.map((row, index) => ({
    id: `${result.infinitive}-${tense}-${index + 1}`,
    front: `<strong>${escapeHtml(result.infinitive)}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} …</div>`,
    back: `<strong>${escapeHtml(result.infinitive)}</strong><br>${moodLabel} ${tenseLabel}<br>${row.label}<div data-card-answer>${row.pronoun} ${conjugationMarkup(result.forms[row.key], reference[row.key], prefix)}</div>`,
  }));
  items.push({ id: `${result.infinitive}-${tense}-empty`, front: '', back: '' });
  return { items, title: `«${result.infinitive}» | ${moodLabel} ${tenseLabel}` };
}
