"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';

export type WordBankAttrs = {
  items: string[];
};

export const DEFAULT_WORD_BANK_ITEMS = [
  'welcome',
  'good',
  'day',
  'from',
  'where',
  'be',
];

function normalizedItems(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => (
      typeof item === 'string' && item.trim().length > 0
    )).map((item) => item.trim())
    : [...DEFAULT_WORD_BANK_ITEMS];
}

function parseItems(value: string | null) {
  if (!value) return [...DEFAULT_WORD_BANK_ITEMS];
  try {
    return normalizedItems(JSON.parse(decodeURIComponent(value)));
  } catch {
    return [...DEFAULT_WORD_BANK_ITEMS];
  }
}

function WordBankNodeView({ node, selected }: NodeViewProps) {
  const { items } = node.attrs as WordBankAttrs;

  return (
    <CustomBlockRoot selected={selected} className="word-bank-node">
      <div className="custom-block__word-bank word-grid-node__word-list">
        {items.map((item, index) => (
          <span
            className="custom-block__word-bank-item word-grid-node__word"
            key={`${index}-${item}`}
          >
            <span className="custom-block__compact-label">{item}</span>
          </span>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    wordBank: {
      insertWordBank: (attrs?: Partial<WordBankAttrs>) => ReturnType;
    };
  }
}

export const WordBank = Node.create({
  name: 'wordBank',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_WORD_BANK_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-word-bank-items'),
        ),
        renderHTML: (attributes) => ({
          'data-word-bank-items': encodeURIComponent(
            JSON.stringify(normalizedItems(attributes.items)),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="word-bank"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'word-bank' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WordBankNodeView);
  },

  addCommands() {
    return {
      insertWordBank:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            items: normalizedItems(attrs.items),
          },
        }),
    };
  },
});
