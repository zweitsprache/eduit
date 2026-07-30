export const TWO_WAY_PREPOSITIONS = [
  'an',
  'auf',
  'hinter',
  'in',
  'neben',
  'über',
  'unter',
  'vor',
  'zwischen',
] as const;

export type TwoWayPreposition = (typeof TWO_WAY_PREPOSITIONS)[number];
export type TwoWayShape = 'square' | 'circle' | 'ellipse';
export type TwoWayCase = 'accusative' | 'dative';
export type TwoWayMode = 'mcq' | 'trueFalse';

export type TwoWayPrepositionItem = {
  id: string;
  preposition: TwoWayPreposition;
  grammaticalCase: TwoWayCase;
  subjectShape: TwoWayShape;
  referenceShape: TwoWayShape;
  secondReferenceShape: TwoWayShape | null;
  subjectPlural: boolean;
  referencePlural: boolean;
  statement: string;
  statementCorrect: boolean;
  options: Array<{ id: string; text: string; correct: boolean }>;
};

const SHAPES: Record<TwoWayShape, {
  nominative: string;
  nominativePlural: string;
  accusative: string;
  dative: string;
  accusativePlural: string;
  dativePlural: string;
}> = {
  square: {
    nominative: 'Das Quadrat',
    nominativePlural: 'Die Quadrate',
    accusative: 'das Quadrat',
    dative: 'dem Quadrat',
    accusativePlural: 'die Quadrate',
    dativePlural: 'den Quadraten',
  },
  circle: {
    nominative: 'Der Kreis',
    nominativePlural: 'Die Kreise',
    accusative: 'den Kreis',
    dative: 'dem Kreis',
    accusativePlural: 'die Kreise',
    dativePlural: 'den Kreisen',
  },
  ellipse: {
    nominative: 'Die Ellipse',
    nominativePlural: 'Die Ellipsen',
    accusative: 'die Ellipse',
    dative: 'der Ellipse',
    accusativePlural: 'die Ellipsen',
    dativePlural: 'den Ellipsen',
  },
};

export function twoWaySentence(input: {
  preposition: TwoWayPreposition;
  grammaticalCase: TwoWayCase;
  subjectShape: TwoWayShape;
  referenceShape: TwoWayShape;
  secondReferenceShape?: TwoWayShape | null;
  subjectPlural: boolean;
  referencePlural: boolean;
}) {
  const subject = SHAPES[input.subjectShape];
  const reference = SHAPES[input.referenceShape];
  const secondReference = input.secondReferenceShape
    ? SHAPES[input.secondReferenceShape]
    : null;
  const subjectText = input.grammaticalCase === 'accusative'
    ? (
        input.subjectPlural
          ? subject.accusativePlural
          : subject.accusative
      )
    : (
        input.subjectPlural
          ? subject.nominativePlural
          : subject.nominative
      );
  const referenceText = secondReference
    ? (
        input.grammaticalCase === 'accusative'
          ? `${reference.accusative} und ${secondReference.accusative}`
          : `${reference.dative} und ${secondReference.dative}`
      )
    : input.referencePlural
    ? (
        input.grammaticalCase === 'accusative'
          ? reference.accusativePlural
          : reference.dativePlural
      )
    : (
        input.grammaticalCase === 'accusative'
          ? reference.accusative
          : reference.dative
      );
  const contractedReference = (
    !input.referencePlural
    && !secondReference
    && input.grammaticalCase === 'dative'
    && referenceText.startsWith('dem ')
  )
    ? input.preposition === 'in'
      ? `im ${referenceText.slice(4)}`
      : input.preposition === 'an'
        ? `am ${referenceText.slice(4)}`
        : `${input.preposition} ${referenceText}`
    : `${input.preposition} ${referenceText}`;
  return input.grammaticalCase === 'accusative'
    ? `Ich lege ${subjectText} ${contractedReference}.`
    : `${subjectText} ${input.subjectPlural ? 'liegen' : 'liegt'} ${contractedReference}.`;
}

function shuffled<T>(values: T[]) {
  const next = [...(values)];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

export function generateTwoWayItems(input: {
  cases?: TwoWayCase[];
  count: number;
  mode: TwoWayMode;
  prepositions: TwoWayPreposition[];
}) {
  const shapes: TwoWayShape[] = ['square', 'circle', 'ellipse'];
  const cases = input.cases?.length
    ? input.cases
    : (['dative', 'accusative'] as const);
  const candidates = input.prepositions.flatMap((preposition) => (
    cases.flatMap((grammaticalCase) => (
      shapes.flatMap((subjectShape) => shapes
        .filter((shape) => shape !== subjectShape)
        .map((referenceShape) => ({
          preposition,
          grammaticalCase,
          subjectShape,
          referenceShape,
        })))
    ))
  ));
  return shuffled(candidates).slice(0, input.count).map((candidate, index) => {
    const secondReferenceShape = candidate.preposition === 'zwischen'
      && index % 2 === 0
      ? shapes.find((shape) => (
          shape !== candidate.subjectShape
          && shape !== candidate.referenceShape
        )) ?? null
      : null;
    const referencePlural = candidate.preposition === 'zwischen'
      && !secondReferenceShape;
    const subjectPlural = index % 4 === 3;
    const correctSentence = twoWaySentence({
      ...candidate,
      secondReferenceShape,
      subjectPlural,
      referencePlural,
    });
    const wrongCaseSentence = twoWaySentence({
      ...candidate,
      secondReferenceShape,
      grammaticalCase: candidate.grammaticalCase === 'dative'
        ? 'accusative'
        : 'dative',
      subjectPlural,
      referencePlural,
    });
    const alternative = TWO_WAY_PREPOSITIONS.find((value) => (
      value !== candidate.preposition
      && input.prepositions.includes(value)
    )) ?? (candidate.preposition === 'in' ? 'auf' : 'in');
    const wrongPrepositionSentence = twoWaySentence({
      ...candidate,
      preposition: alternative,
      secondReferenceShape: alternative === 'zwischen'
        ? secondReferenceShape
        : null,
      subjectPlural,
      referencePlural: alternative === 'zwischen',
    });
    const statementCorrect = input.mode === 'trueFalse' ? index % 2 === 0 : true;
    const statement = statementCorrect
      ? correctSentence
      : (index % 4 === 1 ? wrongCaseSentence : wrongPrepositionSentence);
    const options = shuffled([
      { text: correctSentence, correct: true },
      { text: wrongCaseSentence, correct: false },
      { text: wrongPrepositionSentence, correct: false },
    ]).map((option, optionIndex) => ({
      id: `two-way-option-${Date.now()}-${index}-${optionIndex}`,
      ...option,
    }));
    return {
      id: `two-way-${Date.now()}-${index}`,
      ...candidate,
      secondReferenceShape,
      subjectPlural,
      referencePlural,
      statement,
      statementCorrect,
      options,
    } satisfies TwoWayPrepositionItem;
  });
}
