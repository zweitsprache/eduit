export type GermanVerbAuxiliary = 'sein' | 'haben';

export type GermanVerbReferenceForms = {
  ich: string;
  du: string;
  formalSingular: string;
  thirdSingular: string;
  wir: string;
  ihr: string;
  formalPlural: string;
  thirdPlural: string;
  preteriteIch: string;
  participle: string;
};

export const GERMAN_REFLEXIVE_PRONOUNS = {
  ich: 'mich', du: 'dich', formalSingular: 'sich', thirdSingular: 'sich',
  wir: 'uns', ihr: 'euch', formalPlural: 'sich', thirdPlural: 'sich',
} as const;

export function isGermanOptionalReflexiveInfinitive(infinitive: string) {
  return /^\(sich\)\s+/i.test(infinitive.trim());
}

export function isGermanReflexiveInfinitive(infinitive: string) {
  return /^(?:sich|\(sich\))\s+/i.test(infinitive.trim());
}

export function germanLexicalInfinitive(infinitive: string) {
  return infinitive.trim().replace(/^(?:sich|\(sich\))\s+/i, '').trim();
}

export function germanVerbStem(infinitive: string) {
  const normalized = infinitive.trim().toLocaleLowerCase('de-DE');
  return normalized.endsWith('en') ? normalized.slice(0, -2) : normalized;
}

export function buildGermanVerbReferenceForms(
  infinitive: string,
  separablePrefix = '',
  tense: 'present' | 'preterite' = 'present',
  mood: 'indicative' | 'subjunctive-one' | 'subjunctive-two' = 'indicative',
): GermanVerbReferenceForms {
  const normalizedPrefix = separablePrefix
    .trim()
    .toLocaleLowerCase('de-DE');
  const reflexive = isGermanReflexiveInfinitive(infinitive);
  const optionalReflexive = isGermanOptionalReflexiveInfinitive(infinitive);
  const normalizedInfinitive = germanLexicalInfinitive(infinitive)
    .toLocaleLowerCase('de-DE');
  // "sein" is suppletive: its finite forms are not transformations of a
  // shared regular stem. Comparing them character-by-character with a
  // hypothetical *sei-* paradigm would incorrectly mark coincidental shared
  // letters as regular, so every character must count as an exception.
  if (!normalizedPrefix && normalizedInfinitive === 'sein') {
    return {
      ich: '',
      du: '',
      formalSingular: '',
      thirdSingular: '',
      wir: '',
      ihr: '',
      formalPlural: '',
      thirdPlural: '',
      preteriteIch: '',
      participle: '',
    };
  }
  const baseInfinitive = normalizedPrefix
    && normalizedInfinitive.startsWith(normalizedPrefix)
    ? normalizedInfinitive.slice(normalizedPrefix.length)
    : normalizedInfinitive;
  const stem = germanVerbStem(baseInfinitive);
  const withComplements = (
    form: string,
    key: keyof typeof GERMAN_REFLEXIVE_PRONOUNS,
  ) => [
    form,
    reflexive
      ? optionalReflexive
        ? `(${GERMAN_REFLEXIVE_PRONOUNS[key]})`
        : GERMAN_REFLEXIVE_PRONOUNS[key]
      : '',
    normalizedPrefix,
  ].filter(Boolean).join(' ');
  const finiteForms = tense === 'present' && mood === 'subjunctive-one'
    ? {
      ich: withComplements(`${stem}e`, 'ich'),
      du: withComplements(`${stem}est`, 'du'),
      formalSingular: withComplements(`${stem}en`, 'formalSingular'),
      thirdSingular: withComplements(`${stem}e`, 'thirdSingular'),
      wir: withComplements(`${stem}en`, 'wir'),
      ihr: withComplements(`${stem}et`, 'ihr'),
      formalPlural: withComplements(`${stem}en`, 'formalPlural'),
      thirdPlural: withComplements(`${stem}en`, 'thirdPlural'),
    }
    : tense === 'preterite' || mood === 'subjunctive-two'
    ? {
      ich: withComplements(`${stem}te`, 'ich'),
      du: withComplements(`${stem}test`, 'du'),
      formalSingular: withComplements(`${stem}ten`, 'formalSingular'),
      thirdSingular: withComplements(`${stem}te`, 'thirdSingular'),
      wir: withComplements(`${stem}ten`, 'wir'),
      ihr: withComplements(`${stem}tet`, 'ihr'),
      formalPlural: withComplements(`${stem}ten`, 'formalPlural'),
      thirdPlural: withComplements(`${stem}ten`, 'thirdPlural'),
    }
    : {
      ich: withComplements(`${stem}e`, 'ich'),
      du: withComplements(`${stem}st`, 'du'),
      formalSingular: withComplements(`${stem}en`, 'formalSingular'),
      thirdSingular: withComplements(`${stem}t`, 'thirdSingular'),
      wir: withComplements(`${stem}en`, 'wir'),
      ihr: withComplements(`${stem}t`, 'ihr'),
      formalPlural: withComplements(`${stem}en`, 'formalPlural'),
      thirdPlural: withComplements(`${stem}en`, 'thirdPlural'),
    };
  return {
    ...finiteForms,
    preteriteIch: withComplements(`${stem}te`, 'ich'),
    participle: `${normalizedPrefix}ge${stem}t`,
  };
}

export function firstPersonAuxiliary(auxiliary: GermanVerbAuxiliary) {
  return auxiliary === 'sein' ? 'bin' : 'habe';
}

export function differingActualCharacters(actual: string, reference: string) {
  const actualCharacters = Array.from(actual);
  const referenceCharacters = Array.from(reference);
  const rows = actualCharacters.length + 1;
  const columns = referenceCharacters.length + 1;
  const lengths = Array.from(
    { length: rows },
    () => Array<number>(columns).fill(0),
  );

  for (let actualIndex = actualCharacters.length - 1; actualIndex >= 0; actualIndex -= 1) {
    for (
      let referenceIndex = referenceCharacters.length - 1;
      referenceIndex >= 0;
      referenceIndex -= 1
    ) {
      lengths[actualIndex][referenceIndex] =
        actualCharacters[actualIndex] === referenceCharacters[referenceIndex]
          ? lengths[actualIndex + 1][referenceIndex + 1] + 1
          : Math.max(
              lengths[actualIndex + 1][referenceIndex],
              lengths[actualIndex][referenceIndex + 1],
            );
    }
  }

  const differs = Array<boolean>(actualCharacters.length).fill(true);
  let actualIndex = 0;
  let referenceIndex = 0;
  while (
    actualIndex < actualCharacters.length
    && referenceIndex < referenceCharacters.length
  ) {
    if (actualCharacters[actualIndex] === referenceCharacters[referenceIndex]) {
      differs[actualIndex] = false;
      actualIndex += 1;
      referenceIndex += 1;
    } else if (
      lengths[actualIndex + 1][referenceIndex]
      >= lengths[actualIndex][referenceIndex + 1]
    ) {
      actualIndex += 1;
    } else {
      referenceIndex += 1;
    }
  }

  return { characters: actualCharacters, differs };
}

export function germanVerbExceptionRuns(actual: string, reference: string) {
  const { characters, differs } = differingActualCharacters(actual, reference);
  const runs: Array<{ different: boolean; text: string }> = [];
  characters.forEach((character, index) => {
    const previous = runs.at(-1);
    if (previous?.different === differs[index]) previous.text += character;
    else runs.push({ different: differs[index], text: character });
  });
  return runs;
}

export function splitGermanSeparableForm(value: string, separablePrefix: string) {
  const normalizedPrefix = separablePrefix.trim();
  const trimmed = value.trimEnd();
  const hasPrefix = Boolean(normalizedPrefix) && trimmed
    .toLocaleLowerCase('de-DE')
    .endsWith(normalizedPrefix.toLocaleLowerCase('de-DE'));
  return {
    base: hasPrefix
      ? trimmed.slice(0, -normalizedPrefix.length).trimEnd()
      : value,
    hasPrefix,
  };
}
