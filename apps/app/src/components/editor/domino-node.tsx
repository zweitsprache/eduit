"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReplaceStep, ReplaceAroundStep } from '@tiptap/pm/transform';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import {
  digitalTime,
  informalTime,
  officialTime,
  type TimeRepresentation,
} from '@/lib/german-time';

export type DominoPair = {
  id: string;
  left: string;
  right: string;
};

export type DominoTextSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export type DominoRepresentation = TimeRepresentation | 'text';

export type DominoAttrs = {
  pairs: DominoPair[];
  shuffle: boolean;
  groupIndex: number;
  groupSize: number;
  groupId: string;
  oddTextSize: DominoTextSize;
  evenTextSize: DominoTextSize;
  leftRepresentation: DominoRepresentation;
  rightRepresentation: DominoRepresentation;
};

export const DEFAULT_DOMINO_PAIRS: DominoPair[] = [
  { id: 'domino-1', left: 'Hello', right: 'Hallo' },
  { id: 'domino-2', left: 'Thank you', right: 'Danke' },
  { id: 'domino-3', left: 'Goodbye', right: 'Auf Wiedersehen' },
  { id: 'domino-4', left: 'Please', right: 'Bitte' },
  { id: 'domino-5', left: 'Sorry', right: 'Entschuldigung' },
];

const GRID_COLUMNS = 6;
const GRID_ROWS = 4;
export const GRID_CELLS = GRID_COLUMNS * GRID_ROWS;
export const DOMINO_MAX_PAIRS = 23;

function defaultPairs() {
  return DEFAULT_DOMINO_PAIRS.map((pair) => ({ ...pair }));
}

function newGroupId() {
  return globalThis.crypto?.randomUUID?.() ?? `domino-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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

// Deterministic so every page of a multi-page domino group renders the same order.
function shuffleWithSeed<T>(items: T[], seed: string): T[] {
  const random = createRandom(stableHash(seed));
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function parsePairs(value: string | null): DominoPair[] {
  if (!value) return defaultPairs();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultPairs();
    return parsed
      .filter(
        (item): item is { id?: unknown; left?: unknown; right?: unknown } =>
          item !== null && typeof item === 'object',
      )
      .map((item, index) => ({
        id: typeof item.id === 'string' ? item.id : `domino-${index + 1}`,
        left: typeof item.left === 'string' ? item.left : '',
        right: typeof item.right === 'string' ? item.right : '',
      }));
  } catch {
    return defaultPairs();
  }
}

type CellSpec = {
  kind: 'start' | 'end' | 'left' | 'right';
  text: string;
  pairId?: string;
};

function parseClock(text: string): { hour: number; minute: number } | null {
  const match = /^\[\[clock\s+hour=(\d+)\s+minute=(\d+)\s*\]\]$/.exec(text.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}



function DominoCellContent({
  fallback,
  text,
}: {
  fallback?: string;
  text: string;
}) {
  const clock = parseClock(text);
  if (clock) {
    return (
      <img
        alt=""
        aria-hidden="true"
        className="domino-node__clock-img"
        src={`/api/time-clock?hour=${clock.hour}&minute=${clock.minute}`}
      />
    );
  }
  const digitalVariants = text.split('\n').filter((line) => /^\d{2}:\d{2}$/.test(line.trim()));
  if (digitalVariants.length) {
    return (
      <span className="domino-node__digital-cell">
        {digitalVariants.map((line) => (
          <span key={line} className="time-matching-node__digital">
            {line.trim()}
          </span>
        ))}
      </span>
    );
  }
  const textVariants = text.split('\n').filter(Boolean);
  if (textVariants.length > 1) {
    return (
      <span className="domino-node__text-variants">
        {textVariants.map((line) => (
          <span key={line} className="domino-node__text-variant">
            <InlineFormattedText text={line.trim()} />
          </span>
        ))}
      </span>
    );
  }
  return <InlineFormattedText fallback={fallback} text={text} />;
}

function detectRepresentation(text: string): TimeRepresentation | 'text' {
  if (parseClock(text)) return 'analog';
  if (/^\d{2}:\d{2}$/.test(text.trim())) return 'digital';
  if (/\bUhr\b/.test(text.trim())) return 'official';
  return 'text';
}

function parseDigitalTime(text: string): { hour: number; minute: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(text.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

function extractTime(
  pair: DominoPair,
  leftRepresentation: TimeRepresentation | 'text',
  rightRepresentation: TimeRepresentation | 'text',
): { hour: number; minute: number } | null {
  if (leftRepresentation === 'analog') {
    const clock = parseClock(pair.left);
    if (clock) return clock;
  }
  if (rightRepresentation === 'analog') {
    const clock = parseClock(pair.right);
    if (clock) return clock;
  }
  if (leftRepresentation === 'digital') {
    const time = parseDigitalTime(pair.left);
    if (time) return time;
  }
  if (rightRepresentation === 'digital') {
    const time = parseDigitalTime(pair.right);
    if (time) return time;
  }
  return null;
}

function renderSide(
  representation: TimeRepresentation | 'text',
  time: { hour: number; minute: number } | null,
  otherRepresentation: TimeRepresentation | 'text',
  rawText: string,
): string {
  if (representation === 'text' || !time) return rawText;
  if (representation === 'analog') {
    return `[[clock hour=${time.hour} minute=${time.minute}]]`;
  }
  const { hour, minute } = time;
  if (representation === 'digital') {
    if (otherRepresentation === 'official') {
      return digitalTime(hour, minute);
    }
    const normalized = hour % 12 || 12;
    return [digitalTime(normalized, minute), digitalTime(normalized + 12, minute)].join('\n');
  }
  if (representation === 'official') {
    if (otherRepresentation === 'digital') {
      return officialTime(hour, minute);
    }
    const normalized = hour % 12 || 12;
    const first = officialTime(normalized, minute);
    const second = officialTime(normalized + 12, minute);
    return first === second ? first : [first, second].join('\n');
  }
  const normalized = hour % 12 || 12;
  return informalTime(normalized, minute);
}

function buildAllCells(
  pairs: DominoPair[],
  leftRepresentation: TimeRepresentation,
  rightRepresentation: TimeRepresentation,
  shuffle: boolean,
): CellSpec[] {
  const cards: CellSpec[] = [];
  pairs.forEach((pair) => {
    const time = extractTime(pair, leftRepresentation, rightRepresentation);
    cards.push({
      kind: 'left',
      text: renderSide(leftRepresentation, time, rightRepresentation, pair.left),
      pairId: pair.id,
    });
    cards.push({
      kind: 'right',
      text: renderSide(rightRepresentation, time, leftRepresentation, pair.right),
      pairId: pair.id,
    });
  });
  // Shuffle individual cut-out cards, not whole pairs, so adjacent cards in
  // the printed grid don't already reveal the correct matches before cutting.
  const orderedCards = shuffle
    ? shuffleWithSeed(cards, cards.map((card) => `${card.pairId}:${card.kind}`).join(','))
    : cards;
  return [{ kind: 'start', text: 'START' }, ...orderedCards, { kind: 'end', text: 'ZIEL' }];
}

function DominoGridView({
  cells,
  oddTextSize,
  evenTextSize,
}: {
  cells: CellSpec[];
  oddTextSize: DominoTextSize;
  evenTextSize: DominoTextSize;
}) {
  return (
    <div className="domino-node__grid">
      {Array.from({ length: GRID_CELLS }, (_, index) => {
        const cell = cells[index];
        const isStart = cell?.kind === 'start';
        const isEnd = cell?.kind === 'end';
        const isOddColumn = (index % 6) % 2 === 0;
        const sizeClass = isStart || isEnd
          ? ''
          : `domino-node__cell--text-${isOddColumn ? oddTextSize : evenTextSize}`;
        return (
          <div
            key={index}
            className={[
              'domino-node__cell',
              cell ? `domino-node__cell--${cell.kind}` : 'domino-node__cell--empty',
              sizeClass,
            ].join(' ')}
            data-cell-index={index}
          >
            {cell && (
              <span className="domino-node__cell-text">
                <DominoCellContent
                  fallback={cell.kind === 'start' || cell.kind === 'end' ? 'ZIEL' : ''}
                  text={cell.text}
                />
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function DominoNodeView({ node, selected }: NodeViewProps) {
  const {
    pairs,
    shuffle,
    groupIndex,
    oddTextSize,
    evenTextSize,
    leftRepresentation,
    rightRepresentation,
  } = node.attrs as DominoAttrs;
  const isTextOnly = leftRepresentation === 'text' && rightRepresentation === 'text';
  const detectedLeft = isTextOnly && pairs[0] ? detectRepresentation(pairs[0].left) : leftRepresentation;
  const detectedRight = isTextOnly && pairs[0] ? detectRepresentation(pairs[0].right) : rightRepresentation;
  const allCells = buildAllCells(
    pairs,
    detectedLeft as TimeRepresentation,
    detectedRight as TimeRepresentation,
    shuffle,
  );
  const pageStart = groupIndex * GRID_CELLS;
  const pageEnd = Math.min(pageStart + GRID_CELLS, allCells.length);
  const pageCells = allCells.slice(pageStart, pageEnd);

  return (
    <CustomBlockRoot selected={selected} className="domino-node">
      <DominoGridView
        cells={pageCells}
        oddTextSize={oddTextSize}
        evenTextSize={evenTextSize}
      />
    </CustomBlockRoot>
  );
}

export function dominoGroupSize(pairs: DominoPair[]): number {
  const totalCells = pairs.length * 2 + 2;
  return Math.ceil(totalCells / GRID_CELLS);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    domino: {
      insertDomino: (attrs?: Partial<DominoAttrs>) => ReturnType;
    };
  }
}

export const Domino = Node.create({
  name: 'domino',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pairs: {
        default: DEFAULT_DOMINO_PAIRS,
        parseHTML: (element) => parsePairs(
          element.getAttribute('data-domino-pairs'),
        ),
        renderHTML: (attributes) => ({
          'data-domino-pairs': encodeURIComponent(JSON.stringify(attributes.pairs)),
        }),
      },
      shuffle: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-domino-shuffle') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-domino-shuffle': String(attributes.shuffle),
        }),
      },
      groupIndex: {
        default: 0,
        parseHTML: (element) => (
          Number(element.getAttribute('data-domino-group-index')) || 0
        ),
        renderHTML: (attributes) => ({
          'data-domino-group-index': String(attributes.groupIndex),
        }),
      },
      groupSize: {
        default: 1,
        parseHTML: (element) => (
          Number(element.getAttribute('data-domino-group-size')) || 1
        ),
        renderHTML: (attributes) => ({
          'data-domino-group-size': String(attributes.groupSize),
        }),
      },
      groupId: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-domino-group-id') ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-domino-group-id': attributes.groupId,
        }),
      },
      oddTextSize: {
        default: 'm',
        parseHTML: (element) => {
          const value = element.getAttribute('data-domino-odd-text-size');
          return ['xs', 's', 'm', 'l', 'xl'].includes(value ?? '') ? value : 'm';
        },
        renderHTML: (attributes) => ({
          'data-domino-odd-text-size': attributes.oddTextSize,
        }),
      },
      evenTextSize: {
        default: 'm',
        parseHTML: (element) => {
          const value = element.getAttribute('data-domino-even-text-size');
          return ['xs', 's', 'm', 'l', 'xl'].includes(value ?? '') ? value : 'm';
        },
        renderHTML: (attributes) => ({
          'data-domino-even-text-size': attributes.evenTextSize,
        }),
      },
      leftRepresentation: {
        default: 'text',
        parseHTML: (element) => {
          const value = element.getAttribute('data-domino-left-representation');
          return ['analog', 'digital', 'official', 'informal', 'text'].includes(value ?? '')
            ? value
            : 'text';
        },
        renderHTML: (attributes) => ({
          'data-domino-left-representation': attributes.leftRepresentation,
        }),
      },
      rightRepresentation: {
        default: 'text',
        parseHTML: (element) => {
          const value = element.getAttribute('data-domino-right-representation');
          return ['analog', 'digital', 'official', 'informal', 'text'].includes(value ?? '')
            ? value
            : 'text';
        },
        renderHTML: (attributes) => ({
          'data-domino-right-representation': attributes.rightRepresentation,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="domino"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'domino' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DominoNodeView);
  },

  addCommands() {
    return {
      insertDomino:
        (attrs = {}) =>
        ({ commands }) => {
          const pairs = attrs.pairs ?? defaultPairs();
          return commands.insertContent({
            type: this.name,
            attrs: {
              pairs,
              shuffle: attrs.shuffle ?? false,
              groupIndex: attrs.groupIndex ?? 0,
              groupSize: attrs.groupSize ?? 1,
              groupId: attrs.groupId ?? newGroupId(),
              oddTextSize: attrs.oddTextSize ?? 'm',
              evenTextSize: attrs.evenTextSize ?? 'm',
              leftRepresentation: attrs.leftRepresentation ?? 'text',
              rightRepresentation: attrs.rightRepresentation ?? 'text',
            },
          });
        },
    };
  },

  addStorage() {
    return { pendingSyncGroupId: null as string | null };
  },

  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: new PluginKey('dominoSync'),
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true;
          const dominoType = state.schema.nodes.domino;
          if (!dominoType) return true;

          const changedGroupIds = new Set<string>();
          tr.steps.forEach((step) => {
            if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) return;
            step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
              tr.doc.nodesBetween(newStart, newEnd, (node) => {
                if (node.type.name === 'domino' && node.attrs.groupId) {
                  changedGroupIds.add(node.attrs.groupId as string);
                }
              });
            });
          });

          if (changedGroupIds.size === 0) return true;

          changedGroupIds.forEach((groupId) => {
            const nodes: { node: ProseMirrorNode; pos: number }[] = [];
            tr.doc.descendants((node, pos) => {
              if (node.type.name === 'domino' && node.attrs.groupId === groupId) {
                nodes.push({ node, pos });
              }
            });
            if (nodes.length <= 1) return;

            // Use the first node's pairs/shuffle as the source of truth.
            const source = nodes[0].node;
            const pairs = source.attrs.pairs as DominoPair[];
            const shuffle = source.attrs.shuffle as boolean;
            const groupSize = dominoGroupSize(pairs);

            nodes.forEach(({ node, pos }, index) => {
              if (
                node.attrs.pairs !== pairs
                || node.attrs.shuffle !== shuffle
                || node.attrs.groupSize !== groupSize
                || node.attrs.groupIndex !== index
              ) {
                tr.setNodeAttribute(pos, 'pairs', pairs);
                tr.setNodeAttribute(pos, 'shuffle', shuffle);
                tr.setNodeAttribute(pos, 'groupSize', groupSize);
                tr.setNodeAttribute(pos, 'groupIndex', index);
              }
            });
          });

          return true;
        },
      }),
    ];
  },
});
