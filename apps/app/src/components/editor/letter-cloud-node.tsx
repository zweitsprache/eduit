"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type LetterCloudNodeItem = {
  id: string;
  word: string;
};

export type LetterCloudAttrs = {
  instruction: string;
  hideInstructionBadge: boolean;
  items: LetterCloudNodeItem[];
  showItemNumbers: boolean;
  columns: number;
};

export const DEFAULT_LETTER_CLOUD_INSTRUCTION =
  'Unscramble the letters and write the word on the line.';
export const DEFAULT_LETTER_CLOUD_ITEMS: LetterCloudNodeItem[] = [
  { id: 'letter-cloud-item-1', word: 'Haus' },
  { id: 'letter-cloud-item-2', word: 'Schule' },
];

export const MIN_LETTER_CLOUD_COLUMNS = 1;
export const MAX_LETTER_CLOUD_COLUMNS = 4;
export const DEFAULT_LETTER_CLOUD_COLUMNS = 2;

function parseColumns(value: unknown) {
  const columns = Number(value);
  if (!Number.isFinite(columns)) return DEFAULT_LETTER_CLOUD_COLUMNS;
  return Math.min(
    MAX_LETTER_CLOUD_COLUMNS,
    Math.max(MIN_LETTER_CLOUD_COLUMNS, Math.round(columns)),
  );
}

function parseItems(value: string | null): LetterCloudNodeItem[] {
  if (!value) return DEFAULT_LETTER_CLOUD_ITEMS.map((item) => ({ ...item }));
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) {
      return DEFAULT_LETTER_CLOUD_ITEMS.map((item) => ({ ...item }));
    }
    const parsed = items.flatMap((item, index): LetterCloudNodeItem[] => (
      item && typeof item.word === 'string'
        ? [{
            id: typeof item.id === 'string'
              ? item.id
              : `letter-cloud-item-${index + 1}`,
            word: item.word,
          }]
        : []
    ));
    return parsed.length
      ? parsed
      : DEFAULT_LETTER_CLOUD_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_LETTER_CLOUD_ITEMS.map((item) => ({ ...item }));
  }
}

// Deterministic 32-bit hash so the same word/id always scatters the same way.
function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type ScatteredLetter = {
  char: string;
  left: number;
  top: number;
  rotate: number;
};

// Places letters on a jittered grid (rather than pure random x/y) so a small
// word cloud still fills its card evenly without letters overlapping.
export function scatterLetters(word: string, seedKey: string): ScatteredLetter[] {
  const characters = Array.from(word).filter((character) => !/\s/.test(character));
  if (!characters.length) return [];
  const random = mulberry32(hashString(`${seedKey}::${word}`));
  const columns = Math.max(1, Math.ceil(Math.sqrt(characters.length)));
  const rows = Math.max(1, Math.ceil(characters.length / columns));
  const cellWidth = 100 / columns;
  const cellHeight = 100 / rows;
  const cells = Array.from({ length: columns * rows }, (_, index) => index);
  for (let index = cells.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [cells[index], cells[target]] = [cells[target], cells[index]];
  }
  return characters.map((char, index) => {
    const cell = cells[index];
    const col = cell % columns;
    const row = Math.floor(cell / columns);
    const jitterX = (random() - 0.5) * cellWidth * 0.5;
    const jitterY = (random() - 0.5) * cellHeight * 0.5;
    const rotate = (random() - 0.5) * 34;
    return {
      char,
      left: Math.min(96, Math.max(4, col * cellWidth + cellWidth / 2 + jitterX)),
      top: Math.min(94, Math.max(6, row * cellHeight + cellHeight / 2 + jitterY)),
      rotate,
    };
  });
}

function LetterCloudNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as LetterCloudAttrs;

  return (
    <CustomBlockRoot selected={selected} className="letter-cloud-node">
      <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
        {attrs.instruction || DEFAULT_LETTER_CLOUD_INSTRUCTION}
      </BlockInstruction>
      <div
        className="letter-cloud-node__grid"
        style={{
          gridTemplateColumns: `repeat(${attrs.columns}, minmax(0, 1fr))`,
        }}
      >
        {attrs.items.map((item, index) => (
          <div
            className="letter-cloud-node__item"
            data-item-numbers={attrs.showItemNumbers}
            key={item.id}
          >
            {attrs.showItemNumbers && (
              <span className="custom-block__row-index">
                {String(index + 1).padStart(2, '0')}
              </span>
            )}
            <div className="letter-cloud-node__card">
              <div className="letter-cloud-node__canvas">
                {scatterLetters(item.word, item.id).map((letter, letterIndex) => (
                  <span
                    className="letter-cloud-node__letter"
                    key={`${item.id}-${letterIndex}`}
                    style={{
                      left: `${letter.left}%`,
                      top: `${letter.top}%`,
                      transform: `translate(-50%, -50%) rotate(${letter.rotate}deg)`,
                    }}
                  >
                    {letter.char}
                  </span>
                ))}
              </div>
            </div>
            <div className="letter-cloud-node__line">
              <span className="letter-cloud-node__solution">{item.word}</span>
            </div>
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterCloud: {
      insertLetterCloud: (attrs?: Partial<LetterCloudAttrs>) => ReturnType;
    };
  }
}

export const LetterCloud = Node.create({
  name: 'letterCloud',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_LETTER_CLOUD_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-letter-cloud-instruction')
          ?? DEFAULT_LETTER_CLOUD_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-letter-cloud-instruction': attributes.instruction,
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-letter-cloud-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-letter-cloud-hide-instruction-badge': String(attributes.hideInstructionBadge),
        }),
      },
      showItemNumbers: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-letter-cloud-item-numbers') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-letter-cloud-item-numbers': String(attributes.showItemNumbers),
        }),
      },
      columns: {
        default: DEFAULT_LETTER_CLOUD_COLUMNS,
        parseHTML: (element) => parseColumns(
          element.getAttribute('data-letter-cloud-columns'),
        ),
        renderHTML: (attributes) => ({
          'data-letter-cloud-columns': parseColumns(attributes.columns),
        }),
      },
      items: {
        default: DEFAULT_LETTER_CLOUD_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-letter-cloud-items'),
        ),
        renderHTML: (attributes) => ({
          'data-letter-cloud-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="letter-cloud"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'letter-cloud' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LetterCloudNodeView);
  },

  addCommands() {
    return {
      insertLetterCloud:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_LETTER_CLOUD_INSTRUCTION,
            hideInstructionBadge: attrs.hideInstructionBadge ?? false,
            showItemNumbers: attrs.showItemNumbers ?? true,
            columns: parseColumns(
              attrs.columns ?? DEFAULT_LETTER_CLOUD_COLUMNS,
            ),
            items: attrs.items
              ?? DEFAULT_LETTER_CLOUD_ITEMS.map((item) => ({ ...item })),
          },
        }),
    };
  },
});
