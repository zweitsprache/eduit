"use client";

import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import rough from 'roughjs';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';

export type WordGridDirection =
  | 'leftToRight'
  | 'rightToLeft'
  | 'topToBottom'
  | 'bottomToTop'
  | 'northWestToSouthEast'
  | 'southWestToNorthEast'
  | 'northEastToSouthWest'
  | 'southEastToNorthWest';

export type WordGridDirections = Record<WordGridDirection, boolean>;

export type WordGridAttrs = {
  instruction: string;
  columns: number;
  rows: number;
  rowHeight: number;
  showWordList: boolean;
  showFirstAsExample: boolean;
  directions: WordGridDirections;
  words: string[];
  generation: number;
};

export const DEFAULT_WORD_GRID_DIRECTIONS: WordGridDirections = {
  leftToRight: true,
  rightToLeft: false,
  topToBottom: true,
  bottomToTop: false,
  northWestToSouthEast: false,
  southWestToNorthEast: false,
  northEastToSouthWest: false,
  southEastToNorthWest: false,
};

export const DEFAULT_WORD_GRID_WORDS = [
  'welcome',
  'good',
  'day',
  'from',
  'where',
  'be',
];

const DEFAULT_ATTRS: WordGridAttrs = {
  instruction: 'Find the words in the grid.',
  columns: 10,
  rows: 10,
  rowHeight: 1,
  showWordList: true,
  showFirstAsExample: false,
  directions: DEFAULT_WORD_GRID_DIRECTIONS,
  words: DEFAULT_WORD_GRID_WORDS,
  generation: 0,
};

const DIRECTION_VECTORS: Record<WordGridDirection, [number, number]> = {
  leftToRight: [0, 1],
  rightToLeft: [0, -1],
  topToBottom: [1, 0],
  bottomToTop: [-1, 0],
  northWestToSouthEast: [1, 1],
  southWestToNorthEast: [-1, 1],
  northEastToSouthWest: [1, -1],
  southEastToNorthWest: [-1, -1],
};

type Placement = {
  wordIndex: number;
  cells: number[];
};

function clamp(value: unknown, minimum: number, maximum: number, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, number))
    : fallback;
}

function normalizeAttrs(value: Partial<WordGridAttrs>): WordGridAttrs {
  const directions = Object.fromEntries(
    Object.keys(DEFAULT_WORD_GRID_DIRECTIONS).map((key) => [
      key,
      typeof value.directions?.[key as WordGridDirection] === 'boolean'
        ? value.directions[key as WordGridDirection]
        : DEFAULT_WORD_GRID_DIRECTIONS[key as WordGridDirection],
    ]),
  ) as WordGridDirections;

  if (!Object.values(directions).some(Boolean)) directions.leftToRight = true;

  return {
    instruction: typeof value.instruction === 'string'
      ? value.instruction
      : DEFAULT_ATTRS.instruction,
    columns: Math.round(clamp(value.columns, 3, 20, DEFAULT_ATTRS.columns)),
    rows: Math.round(clamp(value.rows, 3, 20, DEFAULT_ATTRS.rows)),
    rowHeight: Math.round(
      clamp(value.rowHeight, 0.5, 2, DEFAULT_ATTRS.rowHeight) * 20,
    ) / 20,
    showWordList: typeof value.showWordList === 'boolean'
      ? value.showWordList
      : DEFAULT_ATTRS.showWordList,
    showFirstAsExample: typeof value.showFirstAsExample === 'boolean'
      ? value.showFirstAsExample
      : DEFAULT_ATTRS.showFirstAsExample,
    directions,
    words: Array.isArray(value.words)
      ? value.words.filter((word): word is string => typeof word === 'string')
      : [...DEFAULT_ATTRS.words],
    generation: Math.max(0, Math.round(Number(value.generation) || 0)),
  };
}

function parseAttrs(value: string | null): WordGridAttrs {
  if (!value) return normalizeAttrs(DEFAULT_ATTRS);
  try {
    return normalizeAttrs(JSON.parse(decodeURIComponent(value)));
  } catch {
    return normalizeAttrs(DEFAULT_ATTRS);
  }
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function wordLetters(word: string) {
  return Array.from(word.trim().toLocaleUpperCase());
}

function buildGrid(attrs: WordGridAttrs) {
  const activeDirections = (
    Object.keys(attrs.directions) as WordGridDirection[]
  ).filter((direction) => attrs.directions[direction]);
  const words = attrs.words.map(wordLetters);
  const baseSeed = stableHash(JSON.stringify({
    columns: attrs.columns,
    rows: attrs.rows,
    words,
    directions: attrs.directions,
    generation: attrs.generation,
  }));

  let bestCells: Array<string | null> = [];
  let bestPlacements: Placement[] = [];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const random = createRandom(baseSeed + attempt);
    const cells: Array<string | null> = Array(attrs.columns * attrs.rows).fill(null);
    const placements: Placement[] = [];

    words.forEach((letters, wordIndex) => {
      if (!letters.length) return;
      const candidates: { cells: number[] }[] = [];

      activeDirections.forEach((direction) => {
        const [rowStep, columnStep] = DIRECTION_VECTORS[direction];
        for (let row = 0; row < attrs.rows; row += 1) {
          for (let column = 0; column < attrs.columns; column += 1) {
            const endRow = row + rowStep * (letters.length - 1);
            const endColumn = column + columnStep * (letters.length - 1);
            if (
              endRow < 0
              || endRow >= attrs.rows
              || endColumn < 0
              || endColumn >= attrs.columns
            ) continue;

            const candidateCells = letters.map((_, letterIndex) => (
              (row + rowStep * letterIndex) * attrs.columns
              + column
              + columnStep * letterIndex
            ));
            if (candidateCells.every((cellIndex, letterIndex) => (
              cells[cellIndex] === null || cells[cellIndex] === letters[letterIndex]
            ))) {
              candidates.push({ cells: candidateCells });
            }
          }
        }
      });

      if (!candidates.length) return;
      const candidate = candidates[Math.floor(random() * candidates.length)];
      candidate.cells.forEach((cellIndex, letterIndex) => {
        cells[cellIndex] = letters[letterIndex];
      });
      placements.push({ wordIndex, cells: candidate.cells });
    });

    if (placements.length > bestPlacements.length) {
      bestCells = cells;
      bestPlacements = placements;
    }
    if (placements.length === words.filter(({ length }) => length > 0).length) break;
  }

  const filler = Array.from(new Set(
    [...words.flat(), ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ')],
  ));
  const random = createRandom(baseSeed ^ 0x9e3779b9);
  const cells = bestCells.length
    ? bestCells
    : Array(attrs.columns * attrs.rows).fill(null);

  return {
    cells: cells.map((letter) => (
      letter ?? filler[Math.floor(random() * filler.length)]
    )),
    placements: bestPlacements,
  };
}

function WordGridNodeView({ node, selected }: NodeViewProps) {
  const attrs = normalizeAttrs(node.attrs as WordGridAttrs);
  const { cells, placements } = buildGrid(attrs);
  const gridRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<SVGSVGElement>(null);
  const exampleCells = attrs.showFirstAsExample
    ? new Set(placements.find(({ wordIndex }) => wordIndex === 0)?.cells ?? [])
    : new Set<number>();
  const placedWords = new Set(placements.map(({ wordIndex }) => wordIndex));

  useLayoutEffect(() => {
    const grid = gridRef.current;
    const svg = solutionsRef.current;
    if (!grid || !svg) return;

    const drawSolutions = () => {
      const gridRect = grid.getBoundingClientRect();
      if (!gridRect.width || !gridRect.height) return;

      svg.replaceChildren();
      svg.setAttribute('viewBox', `0 0 ${gridRect.width} ${gridRect.height}`);
      const roughSvg = rough.svg(svg);

      placements.forEach((placement) => {
        const firstIndex = placement.cells[0];
        const lastIndex = placement.cells.at(-1);
        if (firstIndex === undefined || lastIndex === undefined) return;

        const firstCell = grid.querySelector<HTMLElement>(
          `[data-word-grid-cell="${firstIndex}"]`,
        );
        const lastCell = grid.querySelector<HTMLElement>(
          `[data-word-grid-cell="${lastIndex}"]`,
        );
        if (!firstCell || !lastCell) return;

        const firstRect = firstCell.getBoundingClientRect();
        const lastRect = lastCell.getBoundingClientRect();
        const startX = firstRect.left + firstRect.width / 2 - gridRect.left;
        const startY = firstRect.top + firstRect.height / 2 - gridRect.top;
        const endX = lastRect.left + lastRect.width / 2 - gridRect.left;
        const endY = lastRect.top + lastRect.height / 2 - gridRect.top;
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const angle = Math.atan2(deltaY, deltaX);
        const distance = Math.hypot(deltaX, deltaY);
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        const cellWidth = (firstRect.width + lastRect.width) / 2;
        const cellHeight = (firstRect.height + lastRect.height) / 2;
        const inset = 4;
        const width = Math.max(
          1,
          distance
            + Math.abs(cosine) * cellWidth
            + Math.abs(sine) * cellHeight
            - inset * 2,
        );
        const height = Math.max(
          1,
          Math.abs(sine) * cellWidth
            + Math.abs(cosine) * cellHeight
            - inset * 2,
        );
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        const rectangle = roughSvg.rectangle(
          centerX - width / 2,
          centerY - height / 2,
          width,
          height,
          {
            bowing: 1.4,
            disableMultiStroke: true,
            roughness: 1.15,
            seed: stableHash(
              `${placement.wordIndex}:${placement.cells.join(',')}`,
            ) || 1,
            stroke: 'var(--custom-block-solution-color)',
            strokeWidth: 1.5,
          },
        );
        const solutionKind = attrs.showFirstAsExample
          && placement.wordIndex === 0
          ? 'example'
          : 'solution';
        rectangle.dataset.solutionKind = solutionKind;
        rectangle.querySelectorAll('path').forEach((path) => {
          path.style.stroke = solutionKind === 'example'
            ? 'var(--custom-block-example-solution-color)'
            : 'var(--custom-block-solution-color)';
        });
        rectangle.setAttribute(
          'transform',
          `rotate(${angle * 180 / Math.PI} ${centerX} ${centerY})`,
        );
        svg.appendChild(rectangle);
      });
    };

    drawSolutions();
    const resizeObserver = new ResizeObserver(drawSolutions);
    resizeObserver.observe(grid);
    window.addEventListener('resize', drawSolutions);
    void document.fonts.ready.then(drawSolutions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawSolutions);
    };
  });

  return (
    <CustomBlockRoot selected={selected} className="word-grid-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      {attrs.showWordList && (
        <div className="custom-block__word-bank word-grid-node__word-list">
          {attrs.words.map((word, index) => (
            <span
              className="word-grid-node__word"
              data-example={attrs.showFirstAsExample && index === 0}
              data-placed={placedWords.has(index)}
              key={`${index}-${word}`}
            >
              <span className="custom-block__compact-label">{word}</span>
              {attrs.showFirstAsExample && index === 0 && (
                <RoughExampleStrike seed={`word-grid:${word}`} />
              )}
            </span>
          ))}
        </div>
      )}
      <div
        aria-label={`${attrs.columns} by ${attrs.rows} word grid`}
        className="word-grid-node__grid"
        ref={gridRef}
        role="grid"
        style={{
          '--word-grid-columns': attrs.columns,
          '--word-grid-row-height': `${2.5 * attrs.rowHeight}rem`,
        } as CSSProperties}
      >
        <svg
          aria-hidden="true"
          className="word-grid-node__solutions"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {cells.map((letter, index) => (
          <span
            className="word-grid-node__cell"
            data-example={exampleCells.has(index)}
            data-word-grid-cell={index}
            key={index}
            role="gridcell"
          >
            {letter}
          </span>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wordGrid: {
      insertWordGrid: (attrs?: Partial<WordGridAttrs>) => ReturnType;
    };
  }
}

export const WordGrid = Node.create({
  name: 'wordGrid',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_ATTRS.instruction,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).instruction,
      },
      columns: {
        default: DEFAULT_ATTRS.columns,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).columns,
      },
      rows: {
        default: DEFAULT_ATTRS.rows,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).rows,
      },
      rowHeight: {
        default: DEFAULT_ATTRS.rowHeight,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).rowHeight,
      },
      showWordList: {
        default: DEFAULT_ATTRS.showWordList,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).showWordList,
      },
      showFirstAsExample: {
        default: DEFAULT_ATTRS.showFirstAsExample,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).showFirstAsExample,
      },
      directions: {
        default: DEFAULT_ATTRS.directions,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).directions,
      },
      words: {
        default: DEFAULT_ATTRS.words,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).words,
      },
      generation: {
        default: DEFAULT_ATTRS.generation,
        parseHTML: (element) => parseAttrs(
          element.getAttribute('data-word-grid-attrs'),
        ).generation,
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="word-grid"]' }];
  },

  renderHTML({ node }) {
    const attrs = normalizeAttrs(node.attrs as WordGridAttrs);
    return [
      'div',
      {
        'data-type': 'word-grid',
        'data-word-grid-attrs': encodeURIComponent(JSON.stringify(attrs)),
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WordGridNodeView);
  },

  addCommands() {
    return {
      insertWordGrid:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: normalizeAttrs({ ...DEFAULT_ATTRS, ...attrs }),
          }),
    };
  },
});
