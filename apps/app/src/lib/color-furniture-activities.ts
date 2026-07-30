export type ColorFurnitureMode = 'mcq' | 'trueFalse';

export type FurnitureKind =
  | 'sofaSingle'
  | 'sofaDouble'
  | 'table'
  | 'chair'
  | 'desk'
  | 'bed'
  | 'wardrobe'
  | 'cupboard'
  | 'bookshelf';

export type FurnitureColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'purple'
  | 'pink'
  | 'brown'
  | 'grey'
  | 'black';

export type ColorFurnitureItem = {
  id: string;
  furniture: FurnitureKind;
  color: FurnitureColor;
  statement: string;
  statementCorrect: boolean;
  options: Array<{ id: string; text: string; correct: boolean }>;
};

export const FURNITURE_KINDS: Array<{
  value: FurnitureKind;
  label: string;
  noun: string;
  icon: string;
}> = [
  { value: 'sofaSingle', label: 'Sofa', noun: 'Das Sofa', icon: '/moebel/002-sofa.svg' },
  { value: 'sofaDouble', label: 'Sofa', noun: 'Das Sofa', icon: '/moebel/003-sofa.svg' },
  { value: 'table', label: 'Tisch', noun: 'Der Tisch', icon: '/moebel/004-table.svg' },
  { value: 'chair', label: 'Stuhl', noun: 'Der Stuhl', icon: '/moebel/005-chair.svg' },
  { value: 'desk', label: 'Schreibtisch', noun: 'Der Schreibtisch', icon: '/moebel/006-table.svg' },
  { value: 'bed', label: 'Bett', noun: 'Das Bett', icon: '/moebel/007-bed.svg' },
  { value: 'wardrobe', label: 'Schrank', noun: 'Der Schrank', icon: '/moebel/008-cupboard.svg' },
  { value: 'cupboard', label: 'Schrank', noun: 'Der Schrank', icon: '/moebel/010-cupboard.svg' },
  { value: 'bookshelf', label: 'Bücherregal', noun: 'Das Bücherregal', icon: '/moebel/011-bookshelf.svg' },
];

export const FURNITURE_COLORS: Array<{
  value: FurnitureColor;
  label: string;
  hex: string;
}> = [
  { value: 'red', label: 'rot', hex: '#e5484d' },
  { value: 'blue', label: 'blau', hex: '#3e63dd' },
  { value: 'green', label: 'grün', hex: '#30a46c' },
  { value: 'yellow', label: 'gelb', hex: '#f5d90a' },
  { value: 'orange', label: 'orange', hex: '#f76b15' },
  { value: 'purple', label: 'lila', hex: '#8e4ec6' },
  { value: 'pink', label: 'rosa', hex: '#d6409f' },
  { value: 'brown', label: 'braun', hex: '#ad7f58' },
  { value: 'grey', label: 'grau', hex: '#8b8d98' },
  { value: 'black', label: 'schwarz', hex: '#1c2024' },
];

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function sentence(furniture: FurnitureKind, color: FurnitureColor) {
  const noun = FURNITURE_KINDS.find(({ value }) => value === furniture)?.noun
    ?? 'Das Möbelstück';
  const colorLabel = FURNITURE_COLORS.find(({ value }) => value === color)?.label
    ?? color;
  return `${noun} ist ${colorLabel}.`;
}

export function generateColorFurnitureItems(input: {
  count: number;
  mode: ColorFurnitureMode;
  furnitureKinds: FurnitureKind[];
  colors: FurnitureColor[];
}) {
  const combinations = shuffled(input.furnitureKinds.flatMap((furniture) => (
    input.colors.map((color) => ({ furniture, color }))
  )));
  const selected = combinations.slice(0, Math.min(input.count, combinations.length));
  const stamp = Date.now();

  return selected.map(({ furniture, color }, index) => {
    const wrongColor = input.colors.find((value) => value !== color)
      ?? FURNITURE_COLORS.find(({ value }) => value !== color)?.value
      ?? color;
    const furnitureNoun = FURNITURE_KINDS.find(
      ({ value }) => value === furniture,
    )?.noun;
    const wrongFurniture = input.furnitureKinds.find((value) => (
      FURNITURE_KINDS.find(({ value: candidate }) => candidate === value)?.noun
      !== furnitureNoun
    )) ?? FURNITURE_KINDS.find(({ noun }) => noun !== furnitureNoun)?.value
      ?? furniture;
    const correctSentence = sentence(furniture, color);
    const wrongColorSentence = sentence(furniture, wrongColor);
    const wrongFurnitureSentence = sentence(wrongFurniture, color);
    const statementCorrect = input.mode === 'trueFalse' ? index % 2 === 0 : true;

    return {
      id: `color-furniture-${stamp}-${index}`,
      furniture,
      color,
      statement: statementCorrect
        ? correctSentence
        : (index % 4 === 1 ? wrongColorSentence : wrongFurnitureSentence),
      statementCorrect,
      options: shuffled([
        { text: correctSentence, correct: true },
        { text: wrongColorSentence, correct: false },
        { text: wrongFurnitureSentence, correct: false },
      ]).map((option, optionIndex) => ({
        id: `color-furniture-option-${stamp}-${index}-${optionIndex}`,
        ...option,
      })),
    } satisfies ColorFurnitureItem;
  });
}
