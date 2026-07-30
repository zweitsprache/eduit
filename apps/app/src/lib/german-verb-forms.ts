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

export function germanVerbStem(infinitive: string) {
  const normalized = infinitive.trim().toLocaleLowerCase('de-DE');
  return normalized.endsWith('en') ? normalized.slice(0, -2) : normalized;
}

export function buildGermanVerbReferenceForms(
  infinitive: string,
  separablePrefix = '',
): GermanVerbReferenceForms {
  const normalizedPrefix = separablePrefix
    .trim()
    .toLocaleLowerCase('de-DE');
  const normalizedInfinitive = infinitive.trim().toLocaleLowerCase('de-DE');
  const baseInfinitive = normalizedPrefix
    && normalizedInfinitive.startsWith(normalizedPrefix)
    ? normalizedInfinitive.slice(normalizedPrefix.length)
    : normalizedInfinitive;
  const stem = germanVerbStem(baseInfinitive);
  const withPrefix = (form: string) => (
    normalizedPrefix ? `${form} ${normalizedPrefix}` : form
  );
  return {
    ich: withPrefix(`${stem}e`),
    du: withPrefix(`${stem}st`),
    formalSingular: withPrefix(`${stem}en`),
    thirdSingular: withPrefix(`${stem}t`),
    wir: withPrefix(`${stem}en`),
    ihr: withPrefix(`${stem}t`),
    formalPlural: withPrefix(`${stem}en`),
    thirdPlural: withPrefix(`${stem}en`),
    preteriteIch: withPrefix(`${stem}te`),
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
