"use client";

import { Fragment } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type MatchingPair = {
  id: string;
  left: string;
  right: string;
};

export type MatchingPairsAttrs = {
  pairs: MatchingPair[];
  rightOrder: string[];
  showWordBank: boolean;
  shuffleWordBank: boolean;
};

export const DEFAULT_MATCHING_PAIRS: MatchingPair[] = [
  { id: 'pair-1', left: 'Item 1', right: 'Match 1' },
  { id: 'pair-2', left: 'Item 2', right: 'Match 2' },
  { id: 'pair-3', left: 'Item 3', right: 'Match 3' },
];

function defaultPairs() {
  return DEFAULT_MATCHING_PAIRS.map((pair) => ({ ...pair }));
}

function parseValue<T>(value: string | null, fallback: () => T[]): T[] {
  if (!value) return fallback();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed : fallback();
  } catch {
    return fallback();
  }
}

function normalizedRightOrder(pairs: MatchingPair[], rightOrder: string[]) {
  const pairIds = new Set(pairs.map(({ id }) => id));
  return [
    ...rightOrder.filter((id) => pairIds.has(id)),
    ...pairs.map(({ id }) => id).filter((id) => !rightOrder.includes(id)),
  ];
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function MatchingPairsNodeView({ node, selected }: NodeViewProps) {
  const {
    pairs,
    rightOrder,
    showWordBank,
    shuffleWordBank,
  } = node.attrs as MatchingPairsAttrs;
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const orderedRightPairs = normalizedRightOrder(pairs, rightOrder)
    .map((id) => pairById.get(id))
    .filter((pair): pair is MatchingPair => Boolean(pair));
  const wordBankItems = pairs
    .map((pair) => ({
      id: pair.id,
      text: `${pair.left.trim()}${pair.right.trim()}`,
    }))
    .filter(({ text }) => text.trim())
    .sort((first, second) => (
      shuffleWordBank ? stableHash(first.id) - stableHash(second.id) : 0
    ));

  return (
    <CustomBlockRoot selected={selected} className="matching-pairs-node">
      <BlockInstruction>
        Match the items on the left with the items on the right.
      </BlockInstruction>
      {showWordBank && (
        <div className="custom-block__word-bank matching-pairs-node__word-bank">
          {wordBankItems.map((item) => (
            <span className="matching-pairs-node__word-bank-item" key={item.id}>
              {item.text}
            </span>
          ))}
        </div>
      )}
      <div className="matching-pairs-node__columns">
        {pairs.map((pair, index) => {
          const rightPair = orderedRightPairs[index];
          return (
            <Fragment key={pair.id}>
            <div className="matching-pairs-node__row" key={pair.id}>
              <span className="custom-block__row-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="matching-pairs-node__label matching-pairs-node__label--left">
                {pair.left || `Item ${index + 1}`}
              </span>
              <BlockChoiceIndicator checked={false} />
            </div>
            <div className="matching-pairs-node__row">
              <BlockChoiceIndicator checked={false} />
              <span className="matching-pairs-node__label">
                {rightPair?.right || `Match ${index + 1}`}
              </span>
              <span className="custom-block__row-index matching-pairs-node__letter">
                {String.fromCharCode(97 + index)}
              </span>
            </div>
            </Fragment>
          );
        })}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    matchingPairs: {
      insertMatchingPairs: (attrs?: Partial<MatchingPairsAttrs>) => ReturnType;
    };
  }
}

export const MatchingPairs = Node.create({
  name: 'matchingPairs',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      pairs: {
        default: DEFAULT_MATCHING_PAIRS,
        parseHTML: (element) => parseValue(
          element.getAttribute('data-matching-pairs'),
          defaultPairs,
        ),
        renderHTML: (attributes) => ({
          'data-matching-pairs': encodeURIComponent(JSON.stringify(attributes.pairs)),
        }),
      },
      rightOrder: {
        default: ['pair-2', 'pair-1', 'pair-3'],
        parseHTML: (element) => parseValue(
          element.getAttribute('data-matching-right-order'),
          () => ['pair-2', 'pair-1', 'pair-3'],
        ),
        renderHTML: (attributes) => ({
          'data-matching-right-order': encodeURIComponent(
            JSON.stringify(attributes.rightOrder),
          ),
        }),
      },
      showWordBank: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-matching-show-word-bank') === 'true',
        renderHTML: (attributes) => ({
          'data-matching-show-word-bank': String(attributes.showWordBank),
        }),
      },
      shuffleWordBank: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-matching-shuffle-word-bank') === 'true',
        renderHTML: (attributes) => ({
          'data-matching-shuffle-word-bank': String(attributes.shuffleWordBank),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="matching-pairs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'matching-pairs' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MatchingPairsNodeView);
  },

  addCommands() {
    return {
      insertMatchingPairs:
        (attrs = {}) =>
        ({ commands }) => {
          const pairs = attrs.pairs ?? defaultPairs();
          return commands.insertContent({
            type: this.name,
            attrs: {
              pairs,
              rightOrder: attrs.rightOrder
                ?? [pairs[1]?.id, pairs[0]?.id, ...pairs.slice(2).map(({ id }) => id)]
                  .filter((id): id is string => Boolean(id)),
              showWordBank: attrs.showWordBank ?? false,
              shuffleWordBank: attrs.shuffleWordBank ?? false,
            },
          });
        },
    };
  },
});
