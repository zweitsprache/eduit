import type {
  WordGridDirections,
} from '@/components/editor/word-grid-node';

export const MAX_WORD_GRID_SIZE = 20;

type GridSize = {
  columns: number;
  rows: number;
};

export type WordGridFitResult = GridSize & {
  changed: boolean;
  longestWordLength: number;
};

function activeCapacities(
  columns: number,
  rows: number,
  directions: WordGridDirections,
) {
  const capacities: number[] = [];
  if (directions.leftToRight || directions.rightToLeft) {
    capacities.push(columns);
  }
  if (directions.topToBottom || directions.bottomToTop) {
    capacities.push(rows);
  }
  if (
    directions.northWestToSouthEast
    || directions.southWestToNorthEast
    || directions.northEastToSouthWest
    || directions.southEastToNorthWest
  ) {
    capacities.push(Math.min(columns, rows));
  }
  return capacities;
}

export function currentWordGridCapacity(
  columns: number,
  rows: number,
  directions: WordGridDirections,
) {
  return Math.max(0, ...activeCapacities(columns, rows, directions));
}

function growForDensity(
  size: GridSize,
  targetArea: number,
): GridSize {
  let { columns, rows } = size;
  while (
    columns * rows < targetArea
    && (columns < MAX_WORD_GRID_SIZE || rows < MAX_WORD_GRID_SIZE)
  ) {
    const canGrowColumns = columns < MAX_WORD_GRID_SIZE;
    const canGrowRows = rows < MAX_WORD_GRID_SIZE;
    if (
      canGrowColumns
      && (!canGrowRows || columns <= rows)
    ) {
      columns += 1;
    } else {
      rows += 1;
    }
  }
  return { columns, rows };
}

export function fitWordGridDimensions({
  columns,
  directions,
  rows,
  words,
}: GridSize & {
  directions: WordGridDirections;
  words: string[];
}): WordGridFitResult | null {
  const lengths = words.map((word) => Array.from(word.trim()).length);
  const longestWordLength = Math.max(0, ...lengths);
  if (longestWordLength > MAX_WORD_GRID_SIZE) return null;

  const candidates: GridSize[] = [];
  if (currentWordGridCapacity(columns, rows, directions) >= longestWordLength) {
    candidates.push({ columns, rows });
  }
  if (directions.leftToRight || directions.rightToLeft) {
    candidates.push({
      columns: Math.max(columns, longestWordLength),
      rows,
    });
  }
  if (directions.topToBottom || directions.bottomToTop) {
    candidates.push({
      columns,
      rows: Math.max(rows, longestWordLength),
    });
  }
  if (
    directions.northWestToSouthEast
    || directions.southWestToNorthEast
    || directions.northEastToSouthWest
    || directions.southEastToNorthWest
  ) {
    candidates.push({
      columns: Math.max(columns, longestWordLength),
      rows: Math.max(rows, longestWordLength),
    });
  }
  if (candidates.length === 0) return null;

  const totalLetters = lengths.reduce((sum, length) => sum + length, 0);
  const targetArea = Math.min(
    MAX_WORD_GRID_SIZE ** 2,
    Math.max(columns * rows, Math.ceil(totalLetters * 1.5)),
  );
  const fitted = candidates
    .map((candidate) => growForDensity(candidate, targetArea))
    .filter((candidate) => (
      candidate.columns <= MAX_WORD_GRID_SIZE
      && candidate.rows <= MAX_WORD_GRID_SIZE
      && currentWordGridCapacity(
        candidate.columns,
        candidate.rows,
        directions,
      ) >= longestWordLength
    ))
    .sort((left, right) => (
      left.columns * left.rows - right.columns * right.rows
      || Math.abs(left.columns - columns) + Math.abs(left.rows - rows)
        - Math.abs(right.columns - columns) - Math.abs(right.rows - rows)
      || Math.abs(left.columns - left.rows) - Math.abs(right.columns - right.rows)
    ))[0];

  return fitted ? {
    ...fitted,
    changed: fitted.columns !== columns || fitted.rows !== rows,
    longestWordLength,
  } : null;
}
