"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type CrosswordEntry = {
  id: string;
  answer: string;
  clue: string;
};

export type CrosswordAttrs = {
  instruction: string;
  entries: CrosswordEntry[];
  layoutSeed: number;
  cellSize: number;
  showWordBank: boolean;
};

type Direction = 'across' | 'down';
type PlacedEntry = CrosswordEntry & {
  word: string;
  x: number;
  y: number;
  direction: Direction;
  number: number;
};
type LayoutCell = {
  x: number;
  y: number;
  letter: string;
  number?: number;
};

export type CrosswordLayout = {
  width: number;
  height: number;
  cells: LayoutCell[];
  entries: PlacedEntry[];
  unplaced: CrosswordEntry[];
};

export const DEFAULT_CROSSWORD_INSTRUCTION =
  'Complete the crossword using the clues.';
export const DEFAULT_CROSSWORD_ENTRIES: CrosswordEntry[] = [
  { id: 'crossword-1', answer: 'SPRACHE', clue: 'System aus Wörtern und Regeln' },
  { id: 'crossword-2', answer: 'SCHULE', clue: 'Ort zum Lernen' },
  { id: 'crossword-3', answer: 'BUCH', clue: 'Gebundene Seiten zum Lesen' },
  { id: 'crossword-4', answer: 'HAUS', clue: 'Gebäude zum Wohnen' },
  { id: 'crossword-5', answer: 'PAUSE', clue: 'Kurze Unterbrechung' },
];

function crosswordWord(value: string) {
  return (value.toLocaleUpperCase('de-CH').match(/[\p{L}\p{N}]/gu) ?? [])
    .join('');
}

function stableHash(value: string) {
  return Array.from(value).reduce(
    (hash, character) => ((hash * 31) + (character.codePointAt(0) ?? 0)) | 0,
    17,
  );
}

function key(x: number, y: number) {
  return `${x},${y}`;
}

function parseEntries(value: string | null) {
  if (!value) return DEFAULT_CROSSWORD_ENTRIES.map((entry) => ({ ...entry }));
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) throw new Error('Invalid entries');
    return parsed.flatMap((entry, index): CrosswordEntry[] => (
      entry
      && typeof entry.answer === 'string'
      && typeof entry.clue === 'string'
        ? [{
            id: typeof entry.id === 'string'
              ? entry.id
              : `crossword-${index + 1}`,
            answer: entry.answer,
            clue: entry.clue,
          }]
        : []
    ));
  } catch {
    return DEFAULT_CROSSWORD_ENTRIES.map((entry) => ({ ...entry }));
  }
}

export function generateCrosswordLayout(
  sourceEntries: CrosswordEntry[],
  seed = 1,
): CrosswordLayout {
  const targetGridWidth = 26;
  const normalizedSeed = Math.max(0, Math.floor(seed));
  const candidates = sourceEntries
    .map((entry) => ({ ...entry, word: crosswordWord(entry.answer) }))
    .filter(({ word }) => word.length >= 2)
    .sort((left, right) => (
      right.word.length - left.word.length
      || stableHash(`${normalizedSeed}:${left.id}`)
        - stableHash(`${normalizedSeed}:${right.id}`)
    ));
  if (!candidates.length) {
    return { width: 0, height: 0, cells: [], entries: [], unplaced: sourceEntries };
  }

  const grid = new Map<string, {
    letter: string;
    directions: Set<Direction>;
  }>();
  const placed: Array<Omit<PlacedEntry, 'number'>> = [];

  const canPlace = (
    word: string,
    x: number,
    y: number,
    direction: Direction,
    requireIntersection: boolean,
  ) => {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    if (grid.has(key(x - dx, y - dy))) return -1;
    if (grid.has(key(x + dx * word.length, y + dy * word.length))) return -1;
    let intersections = 0;
    for (let index = 0; index < word.length; index += 1) {
      const cellX = x + dx * index;
      const cellY = y + dy * index;
      const existing = grid.get(key(cellX, cellY));
      if (existing) {
        if (
          existing.letter !== word[index]
          || existing.directions.has(direction)
        ) return -1;
        intersections += 1;
        continue;
      }
      const neighbours = direction === 'across'
        ? [[cellX, cellY - 1], [cellX, cellY + 1]]
        : [[cellX - 1, cellY], [cellX + 1, cellY]];
      if (neighbours.some(([nx, ny]) => grid.has(key(nx, ny)))) return -1;
    }
    return requireIntersection && intersections === 0 ? -1 : intersections;
  };

  const commit = (
    entry: typeof candidates[number],
    x: number,
    y: number,
    direction: Direction,
  ) => {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    Array.from(entry.word).forEach((letter, index) => {
      const cellKey = key(x + dx * index, y + dy * index);
      const existing = grid.get(cellKey);
      if (existing) {
        existing.directions.add(direction);
      } else {
        grid.set(cellKey, { letter, directions: new Set([direction]) });
      }
    });
    placed.push({ ...entry, x, y, direction });
  };

  commit(
    candidates[0],
    0,
    0,
    normalizedSeed % 2 === 0 ? 'down' : 'across',
  );
  for (const entry of candidates.slice(1)) {
    const placements: Array<{
      x: number;
      y: number;
      direction: Direction;
      intersections: number;
      width: number;
      height: number;
      widthOverflow: number;
      area: number;
      tie: number;
    }> = [];
    for (const [cellKey, cell] of grid) {
      const [cellX, cellY] = cellKey.split(',').map(Number);
      Array.from(entry.word).forEach((letter, letterIndex) => {
        if (letter !== cell.letter) return;
        (['across', 'down'] as const).forEach((direction) => {
          if (cell.directions.has(direction)) return;
          const x = cellX - (direction === 'across' ? letterIndex : 0);
          const y = cellY - (direction === 'down' ? letterIndex : 0);
          const intersections = canPlace(entry.word, x, y, direction, true);
          if (intersections < 0) return;
          const xs = [
            ...placed.flatMap((item) => [
              item.x,
              item.x + (item.direction === 'across' ? item.word.length - 1 : 0),
            ]),
            x,
            x + (direction === 'across' ? entry.word.length - 1 : 0),
          ];
          const ys = [
            ...placed.flatMap((item) => [
              item.y,
              item.y + (item.direction === 'down' ? item.word.length - 1 : 0),
            ]),
            y,
            y + (direction === 'down' ? entry.word.length - 1 : 0),
          ];
          const width = Math.max(...xs) - Math.min(...xs) + 1;
          const height = Math.max(...ys) - Math.min(...ys) + 1;
          placements.push({
            x,
            y,
            direction,
            intersections,
            width,
            height,
            widthOverflow: Math.max(0, width - targetGridWidth),
            area: width * height,
            tie: stableHash(
              `${normalizedSeed}:${entry.id}:${x}:${y}:${direction}`,
            ),
          });
        });
      });
    }
    placements.sort((left, right) => (
      right.intersections - left.intersections
      || left.widthOverflow - right.widthOverflow
      || left.height - right.height
      || right.width - left.width
      || left.area - right.area
      || left.tie - right.tie
    ));
    if (placements[0]) {
      commit(entry, placements[0].x, placements[0].y, placements[0].direction);
    }
  }

  const connectedIds = new Set(placed.map(({ id }) => id));
  const disconnected = candidates.filter(({ id }) => !connectedIds.has(id));
  const occupiedYs = Array.from(grid.keys()).map((cellKey) => (
    Number(cellKey.split(',')[1])
  ));
  let disconnectedY = Math.max(...occupiedYs, 0) + 2;
  let disconnectedX = 0;
  for (const entry of disconnected) {
    if (
      disconnectedX > 0
      && disconnectedX + entry.word.length > targetGridWidth
    ) {
      disconnectedX = 0;
      disconnectedY += 2;
    }
    commit(entry, disconnectedX, disconnectedY, 'across');
    disconnectedX += entry.word.length + 2;
  }

  const xs = Array.from(grid.keys()).map((cellKey) => Number(cellKey.split(',')[0]));
  const ys = Array.from(grid.keys()).map((cellKey) => Number(cellKey.split(',')[1]));
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const starts = placed
    .map((entry) => ({ ...entry, x: entry.x - minX, y: entry.y - minY }))
    .sort((left, right) => (
      left.y - right.y || left.x - right.x
      || (left.direction === 'across' ? -1 : 1)
    ));
  const numberByStart = new Map<string, number>();
  starts.forEach((entry) => {
    const startKey = key(entry.x, entry.y);
    if (!numberByStart.has(startKey)) {
      numberByStart.set(startKey, numberByStart.size + 1);
    }
  });
  const numberedEntries = starts.map((entry) => ({
    ...entry,
    number: numberByStart.get(key(entry.x, entry.y)) ?? 0,
  }));
  const cells = Array.from(grid.entries()).map(([cellKey, cell]) => {
    const [rawX, rawY] = cellKey.split(',').map(Number);
    const x = rawX - minX;
    const y = rawY - minY;
    return {
      x,
      y,
      letter: cell.letter,
      number: numberByStart.get(key(x, y)),
    };
  });
  return {
    width: Math.max(...cells.map(({ x }) => x)) + 1,
    height: Math.max(...cells.map(({ y }) => y)) + 1,
    cells,
    entries: numberedEntries,
    unplaced: sourceEntries.filter(({ id }) => (
      !numberedEntries.some((entry) => entry.id === id)
    )),
  };
}

function CrosswordNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as CrosswordAttrs;
  const layout = generateCrosswordLayout(attrs.entries, attrs.layoutSeed);
  const effectiveCellSize = Math.max(6, Math.min(
    attrs.cellSize,
    Math.floor(620 / Math.max(1, layout.width)),
    Math.floor(560 / Math.max(1, layout.height)),
  ));
  const hasTwoDigitClueNumber = layout.entries.some(
    ({ number }) => number > 9,
  );
  const wordBank = attrs.entries
    .map(({ answer }) => crosswordWord(answer))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));

  return (
    <CustomBlockRoot selected={selected} className="crossword-node">
      <BlockInstruction>
        {attrs.instruction || DEFAULT_CROSSWORD_INSTRUCTION}
      </BlockInstruction>
      {attrs.showWordBank && wordBank.length > 0 && (
        <div className="custom-block__word-bank crossword-node__word-bank">
          {wordBank.map((word, index) => (
            <span className="custom-block__word-bank-item" key={`${word}-${index}`}>
              {word}
            </span>
          ))}
        </div>
      )}
      {layout.cells.length > 0 ? (
        <div className="crossword-node__body">
          <div
            className="crossword-node__grid"
            style={{
              '--crossword-base-cell-size': `${effectiveCellSize}px`,
              gridTemplateColumns: `repeat(${layout.width}, var(--crossword-cell-size))`,
              gridTemplateRows: `repeat(${layout.height}, var(--crossword-cell-size))`,
            } as React.CSSProperties}
          >
            {layout.cells.map((cell) => (
              <span
                className="crossword-node__cell"
                key={key(cell.x, cell.y)}
                style={{
                  gridColumn: cell.x + 1,
                  gridRow: cell.y + 1,
                }}
              >
                {cell.number && (
                  <span className="crossword-node__number">{cell.number}</span>
                )}
                <strong className="crossword-node__letter">{cell.letter}</strong>
              </span>
            ))}
          </div>
          <div
            className={[
              'crossword-node__clues',
              hasTwoDigitClueNumber
                ? 'crossword-node__clues--two-digit-numbers'
                : '',
            ].filter(Boolean).join(' ')}
          >
            {(['across', 'down'] as const).map((direction) => {
              const entries = layout.entries.filter(
                (entry) => entry.direction === direction,
              );
              if (!entries.length) return null;
              return (
                <section key={direction}>
                  <h4>
                    <span className="custom-block__instruction-language custom-block__instruction-language--en">
                      {direction === 'across' ? 'Across' : 'Down'}
                    </span>
                    <span className="custom-block__instruction-language custom-block__instruction-language--de">
                      {direction === 'across' ? 'Waagrecht' : 'Senkrecht'}
                    </span>
                    <span className="custom-block__instruction-language custom-block__instruction-language--de-formal">
                      {direction === 'across' ? 'Waagrecht' : 'Senkrecht'}
                    </span>
                  </h4>
                  <ol>
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        <strong>{entry.number}</strong>
                        <span>{entry.clue}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="crossword-node__empty">
          Add at least one answer with two letters.
        </p>
      )}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    crossword: {
      insertCrossword: (attrs?: Partial<CrosswordAttrs>) => ReturnType;
    };
  }
}

export const Crossword = Node.create({
  name: 'crossword',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_CROSSWORD_INSTRUCTION,
        parseHTML: (element) => element.getAttribute('data-crossword-instruction')
          ?? DEFAULT_CROSSWORD_INSTRUCTION,
        renderHTML: (attributes) => ({
          'data-crossword-instruction': attributes.instruction,
        }),
      },
      entries: {
        default: DEFAULT_CROSSWORD_ENTRIES,
        parseHTML: (element) => parseEntries(
          element.getAttribute('data-crossword-entries'),
        ),
        renderHTML: (attributes) => ({
          'data-crossword-entries': encodeURIComponent(
            JSON.stringify(attributes.entries),
          ),
        }),
      },
      layoutSeed: {
        default: 1,
        parseHTML: (element) => Number(
          element.getAttribute('data-crossword-layout-seed') ?? 1,
        ),
        renderHTML: (attributes) => ({
          'data-crossword-layout-seed': attributes.layoutSeed,
        }),
      },
      cellSize: {
        default: 30,
        parseHTML: (element) => Math.min(40, Math.max(22, Number(
          element.getAttribute('data-crossword-cell-size') ?? 30,
        ))),
        renderHTML: (attributes) => ({
          'data-crossword-cell-size': attributes.cellSize,
        }),
      },
      showWordBank: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-crossword-show-word-bank') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-crossword-show-word-bank': String(attributes.showWordBank),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="crossword"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'crossword' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CrosswordNodeView);
  },

  addCommands() {
    return {
      insertCrossword:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_CROSSWORD_INSTRUCTION,
            entries: attrs.entries
              ?? DEFAULT_CROSSWORD_ENTRIES.map((entry) => ({ ...entry })),
            layoutSeed: attrs.layoutSeed ?? 1,
            cellSize: attrs.cellSize ?? 30,
            showWordBank: attrs.showWordBank ?? false,
          },
        }),
    };
  },
});
