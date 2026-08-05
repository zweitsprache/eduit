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
  showFirstAsExample: boolean;
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

function defaultPairs() {
  return DEFAULT_DOMINO_PAIRS.map((pair) => ({ ...pair }));
}

function newGroupId() {
  return globalThis.crypto?.randomUUID?.() ?? `domino-${Date.now()}-${Math.random().toString(36).slice(2)}`;
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
): CellSpec[] {
  const cells: CellSpec[] = [{ kind: 'start', text: 'START' }];
  pairs.forEach((pair) => {
    const time = extractTime(pair, leftRepresentation, rightRepresentation);
    cells.push({
      kind: 'left',
      text: renderSide(leftRepresentation, time, rightRepresentation, pair.left),
      pairId: pair.id,
    });
    cells.push({
      kind: 'right',
      text: renderSide(rightRepresentation, time, leftRepresentation, pair.right),
      pairId: pair.id,
    });
  });
  cells.push({ kind: 'end', text: 'ZIEL' });
  return cells;
}

function DominoGridView({
  cells,
  showFirstAsExample,
  oddTextSize,
  evenTextSize,
}: {
  cells: CellSpec[];
  showFirstAsExample: boolean;
  oddTextSize: DominoTextSize;
  evenTextSize: DominoTextSize;
}) {
  return (
    <div className="domino-node__grid">
      {Array.from({ length: GRID_CELLS }, (_, index) => {
        const cell = cells[index];
        const isExample = showFirstAsExample && index === 1 && cell?.kind === 'left';
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
              isExample ? 'domino-node__cell--example' : '',
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
    showFirstAsExample,
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
  );
  const pageStart = groupIndex * GRID_CELLS;
  const pageEnd = Math.min(pageStart + GRID_CELLS, allCells.length);
  const pageCells = allCells.slice(pageStart, pageEnd);
  const isFirstPage = groupIndex === 0;

  return (
    <CustomBlockRoot selected={selected} className="domino-node">
      <DominoGridView
        cells={pageCells}
        showFirstAsExample={showFirstAsExample && isFirstPage}
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
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-domino-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-domino-show-first-example': String(attributes.showFirstAsExample),
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
              showFirstAsExample: attrs.showFirstAsExample ?? false,
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

            // Use the first node's pairs/showFirstAsExample as the source of truth.
            const source = nodes[0].node;
            const pairs = source.attrs.pairs as DominoPair[];
            const showFirstAsExample = source.attrs.showFirstAsExample as boolean;
            const groupSize = dominoGroupSize(pairs);

            nodes.forEach(({ node, pos }, index) => {
              if (
                node.attrs.pairs !== pairs
                || node.attrs.showFirstAsExample !== showFirstAsExample
                || node.attrs.groupSize !== groupSize
                || node.attrs.groupIndex !== index
              ) {
                tr.setNodeAttribute(pos, 'pairs', pairs);
                tr.setNodeAttribute(pos, 'showFirstAsExample', showFirstAsExample);
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
