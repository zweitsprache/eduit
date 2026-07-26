"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type RewriteSentenceItem = {
  id: string;
  input: string;
  solution: string;
  image?: {
    src: string;
    alt: string;
  };
};

export type RewriteSentencesAttrs = {
  items: RewriteSentenceItem[];
};

export const DEFAULT_REWRITE_SENTENCE_ITEMS: RewriteSentenceItem[] = [
  {
    id: 'rewrite-1',
    input: 'ichheissemartinaSchmid',
    solution: 'Ich heisse Martina Schmid',
  },
  {
    id: 'rewrite-2',
    input: 'wokommenSieher',
    solution: 'Wo kommen Sie her?',
  },
];

function defaultItems() {
  return DEFAULT_REWRITE_SENTENCE_ITEMS.map((item) => ({ ...item }));
}

function parseItems(value: string | null): RewriteSentenceItem[] {
  if (!value) return defaultItems();
  try {
    const items = JSON.parse(decodeURIComponent(value));
    return Array.isArray(items)
      ? items.map((item, index) => ({
          id: typeof item.id === 'string' ? item.id : `rewrite-${index + 1}`,
          input: typeof item.input === 'string' ? item.input : '',
          solution: typeof item.solution === 'string' ? item.solution : '',
          image: typeof item.image?.src === 'string'
            ? {
                src: item.image.src,
                alt: typeof item.image.alt === 'string' ? item.image.alt : '',
              }
            : undefined,
        }))
      : defaultItems();
  } catch {
    return defaultItems();
  }
}

function RewriteSentencesNodeView({ node, selected }: NodeViewProps) {
  const { items } = node.attrs as RewriteSentencesAttrs;

  return (
    <CustomBlockRoot selected={selected} className="rewrite-sentences-node">
      <BlockInstruction>Rewrite the sentences correctly.</BlockInstruction>
      <div className="rewrite-sentences-node__items">
        {items.map((item, index) => (
          <div
            className={`rewrite-sentences-node__item${
              item.image ? ' rewrite-sentences-node__item--with-image' : ''
            }`}
            data-solution={item.solution}
            key={item.id}
          >
            <span className="custom-block__row-index rewrite-sentences-node__index">
              {String(index + 1).padStart(2, '0')}
            </span>
            {item.image && (
              <img
                alt={item.image.alt}
                className="rewrite-sentences-node__image"
                src={item.image.src}
              />
            )}
            <p className="rewrite-sentences-node__input">
              {item.input || `Sentence ${index + 1}`}
            </p>
            <span aria-hidden="true" className="rewrite-sentences-node__writing-line" />
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    rewriteSentences: {
      insertRewriteSentences: (attrs?: Partial<RewriteSentencesAttrs>) => ReturnType;
    };
  }
}

export const RewriteSentences = Node.create({
  name: 'rewriteSentences',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_REWRITE_SENTENCE_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-rewrite-sentence-items'),
        ),
        renderHTML: (attributes) => ({
          'data-rewrite-sentence-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="rewrite-sentences"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'rewrite-sentences' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RewriteSentencesNodeView);
  },

  addCommands() {
    return {
      insertRewriteSentences:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              items: attrs.items ?? defaultItems(),
            },
          }),
    };
  },
});
