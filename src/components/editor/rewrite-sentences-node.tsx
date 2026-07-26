"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';

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
  showFirstAsExample: boolean;
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

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export type RewriteWordBankMode = 'none' | 'automatic' | 'manual';

export function rewriteWordBankMode(input: string): RewriteWordBankMode {
  if (input.includes('||')) return 'manual';
  if (input.includes('|')) return 'automatic';
  return 'none';
}

function shuffledSegments(
  item: RewriteSentenceItem,
  separator: '|' | '||',
) {
  const segments = item.input
    .split(separator)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const shuffled = segments
    .map((text, index) => ({
      id: `${item.id}-${index}`,
      index,
      text,
    }))
    .sort((first, second) => (
      stableHash(`${item.id}:${item.input}:${first.index}`)
      - stableHash(`${item.id}:${item.input}:${second.index}`)
    ));

  if (
    shuffled.length > 1
    && shuffled.every((segment, index) => segment.index === index)
  ) {
    return [...shuffled.slice(1), shuffled[0]];
  }

  return shuffled;
}

function RewriteSentencesNodeView({ node, selected }: NodeViewProps) {
  const { items, showFirstAsExample } = node.attrs as RewriteSentencesAttrs;

  return (
    <CustomBlockRoot selected={selected} className="rewrite-sentences-node">
      <BlockInstruction>Rewrite the sentences correctly.</BlockInstruction>
      <div className="rewrite-sentences-node__items">
        {items.map((item, index) => {
          const wordBankMode = rewriteWordBankMode(item.input);
          const usesWordBank = wordBankMode !== 'none';
          const separator = wordBankMode === 'manual' ? '||' : '|';
          const segments = usesWordBank
            ? shuffledSegments(item, separator)
            : [];
          const solution = wordBankMode === 'automatic'
            ? item.input
                .split('|')
                .map((segment) => segment.trim())
                .filter(Boolean)
                .join(' ')
            : item.solution;

          return (
            <div
              className={`rewrite-sentences-node__item${
                item.image ? ' rewrite-sentences-node__item--with-image' : ''
              }${usesWordBank ? ' rewrite-sentences-node__item--word-bank' : ''}`}
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
              {usesWordBank ? (
                <div className="rewrite-sentences-node__input rewrite-sentences-node__word-bank">
                  {segments.map((segment) => (
                    <span
                      className="custom-block__word-bank-item rewrite-sentences-node__word-bank-item"
                      key={segment.id}
                    >
                      {segment.text}
                      {showFirstAsExample && index === 0 && (
                        <RoughExampleStrike seed={segment.id} />
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="rewrite-sentences-node__input">
                  {item.input || `Sentence ${index + 1}`}
                </p>
              )}
              <span
                aria-hidden="true"
                className="rewrite-sentences-node__writing-line"
                data-example={showFirstAsExample && index === 0}
                data-solution={solution}
              />
            </div>
          );
        })}
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
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-rewrite-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-rewrite-show-first-example': String(
            attributes.showFirstAsExample,
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
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
