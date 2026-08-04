"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';

export type DominoPair = {
  id: string;
  left: string;
  right: string;
};

export type DominoAttrs = {
  pairs: DominoPair[];
  showFirstAsExample: boolean;
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
const GRID_CELLS = GRID_COLUMNS * GRID_ROWS;

function defaultPairs() {
  return DEFAULT_DOMINO_PAIRS.map((pair) => ({ ...pair }));
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

function buildDominoCells(pairs: DominoPair[]) {
  const cells: Array<{ kind: 'start' | 'end' | 'left' | 'right'; text: string; pairId?: string }> = [];
  cells.push({ kind: 'start', text: 'START' });
  pairs.forEach((pair) => {
    cells.push({ kind: 'left', text: pair.left, pairId: pair.id });
    cells.push({ kind: 'right', text: pair.right, pairId: pair.id });
  });
  cells.push({ kind: 'end', text: 'ZIEL' });
  return cells;
}

function DominoNodeView({ node, selected }: NodeViewProps) {
  const { pairs, showFirstAsExample } = node.attrs as DominoAttrs;
  const cells = buildDominoCells(pairs);

  return (
    <CustomBlockRoot selected={selected} className="domino-node">
      <div className="domino-node__grid">
        {Array.from({ length: GRID_CELLS }, (_, index) => {
          const cell = cells[index];
          const isExample = showFirstAsExample && index === 1;
          return (
            <div
              key={index}
              className={[
                'domino-node__cell',
                cell ? `domino-node__cell--${cell.kind}` : 'domino-node__cell--empty',
                isExample ? 'domino-node__cell--example' : '',
              ].join(' ')}
              data-cell-index={index}
            >
              {cell && (
                <span className="domino-node__cell-text">
                  <InlineFormattedText
                    fallback={cell.kind === 'start' || cell.kind === 'end' ? 'ZIEL' : ''}
                    text={cell.text}
                  />
                </span>
              )}
            </div>
          );
        })}
      </div>
    </CustomBlockRoot>
  );
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
            },
          });
        },
    };
  },
});
