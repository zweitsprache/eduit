"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type OrderingItem = {
  id: string;
  text: string;
};

export type OrderingAttrs = {
  instruction: string;
  items: OrderingItem[];
  shuffleItems: boolean;
  generation: number;
  showRandomAsExample: boolean;
};

export const DEFAULT_ORDERING_ITEMS: OrderingItem[] = [
  { id: 'ordering-1', text: 'First step' },
  { id: 'ordering-2', text: 'Second step' },
  { id: 'ordering-3', text: 'Third step' },
  { id: 'ordering-4', text: 'Final step' },
];

function defaultItems() {
  return DEFAULT_ORDERING_ITEMS.map((item) => ({ ...item }));
}

function parseItems(value: string | null): OrderingItem[] {
  if (!value) return defaultItems();

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultItems();
    const items = parsed.flatMap((item, index): OrderingItem[] => (
      typeof item?.text === 'string'
        ? [{
            id: typeof item.id === 'string' ? item.id : `ordering-${index + 1}`,
            text: item.text,
          }]
        : []
    ));
    return items.length >= 2 ? items : defaultItems();
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

function shuffledItems(items: OrderingItem[], generation: number) {
  const result = [...items];
  let state = stableHash(`${generation}:${items.map(({ id }) => id).join(':')}`);
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  if (
    result.length > 1
    && result.every((item, index) => item.id === items[index].id)
  ) {
    result.push(result.shift()!);
  }
  return result;
}

function exampleItemId(items: OrderingItem[], generation: number) {
  if (!items.length) return null;
  const hash = stableHash(
    `example:${generation}:${items.map(({ id }) => id).join(':')}`,
  );
  return items[hash % items.length].id;
}

function OrderingNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as OrderingAttrs;
  const displayedItems = attrs.shuffleItems
    ? shuffledItems(attrs.items, attrs.generation)
    : attrs.items;
  const exampleId = attrs.showRandomAsExample
    ? exampleItemId(displayedItems, attrs.generation)
    : null;

  return (
    <CustomBlockRoot selected={selected} className="ordering-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="ordering-node__items">
        {displayedItems.map((item) => {
          const correctPosition = attrs.items.findIndex(
            ({ id }) => id === item.id,
          ) + 1;
          const isExample = item.id === exampleId;

          return (
            <div className="ordering-node__item" key={item.id}>
              <span
                className="ordering-node__position"
                data-answer={correctPosition}
                data-example={isExample}
              />
              <span className="ordering-node__text">
                <InlineFormattedText text={item.text} />
              </span>
            </div>
          );
        })}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ordering: {
      insertOrdering: (attrs?: Partial<OrderingAttrs>) => ReturnType;
    };
  }
}

export const Ordering = Node.create({
  name: 'ordering',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Number the items in the correct order.',
        parseHTML: (element) => (
          element.getAttribute('data-ordering-instruction')
          ?? 'Number the items in the correct order.'
        ),
        renderHTML: (attributes) => ({
          'data-ordering-instruction': attributes.instruction,
        }),
      },
      items: {
        default: DEFAULT_ORDERING_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-ordering-items'),
        ),
        renderHTML: (attributes) => ({
          'data-ordering-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
      shuffleItems: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-ordering-shuffle') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-ordering-shuffle': String(attributes.shuffleItems),
        }),
      },
      generation: {
        default: 0,
        parseHTML: (element) => (
          Number(element.getAttribute('data-ordering-generation')) || 0
        ),
        renderHTML: (attributes) => ({
          'data-ordering-generation': attributes.generation,
        }),
      },
      showRandomAsExample: {
        default: true,
        parseHTML: (element) => {
          const value = element.getAttribute(
            'data-ordering-show-random-example',
          );
          if (value !== null) return value !== 'false';
          const legacyValue = element.getAttribute(
            'data-ordering-show-first-example',
          );
          return legacyValue === null ? true : legacyValue === 'true';
        },
        renderHTML: (attributes) => ({
          'data-ordering-show-random-example': String(
            attributes.showRandomAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="ordering"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'ordering' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(OrderingNodeView);
  },

  addCommands() {
    return {
      insertOrdering:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction:
                attrs.instruction ?? 'Number the items in the correct order.',
              items: attrs.items ?? defaultItems(),
              shuffleItems: attrs.shuffleItems ?? true,
              generation: attrs.generation ?? 0,
              showRandomAsExample: attrs.showRandomAsExample ?? true,
            },
          }),
    };
  },
});
