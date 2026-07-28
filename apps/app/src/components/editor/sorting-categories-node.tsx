"use client";

import type { CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';

export type SortingCategory = {
  id: string;
  title: string;
};

export type SortingCategoryItem = {
  id: string;
  text: string;
  categoryId: string;
};

export type SortingCategoriesAttrs = {
  categories: SortingCategory[];
  items: SortingCategoryItem[];
  colorCoding: boolean;
  showFirstAsExample: boolean;
};

export const DEFAULT_SORTING_CATEGORIES: SortingCategory[] = [
  { id: 'category-1', title: 'Category A' },
  { id: 'category-2', title: 'Category B' },
  { id: 'category-3', title: 'Category C' },
];

export const DEFAULT_SORTING_CATEGORY_ITEMS: SortingCategoryItem[] = [
  { id: 'sorting-item-1', text: 'Item 1', categoryId: 'category-1' },
  { id: 'sorting-item-2', text: 'Item 2', categoryId: 'category-2' },
  { id: 'sorting-item-3', text: 'Item 3', categoryId: 'category-3' },
  { id: 'sorting-item-4', text: 'Item 4', categoryId: 'category-1' },
  { id: 'sorting-item-5', text: 'Item 5', categoryId: 'category-2' },
  { id: 'sorting-item-6', text: 'Item 6', categoryId: 'category-3' },
];

function defaultCategories() {
  return DEFAULT_SORTING_CATEGORIES.map((category) => ({ ...category }));
}

function defaultItems() {
  return DEFAULT_SORTING_CATEGORY_ITEMS.map((item) => ({ ...item }));
}

function parseArray<T>(value: string | null, fallback: () => T[]): T[] {
  if (!value) return fallback();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed : fallback();
  } catch {
    return fallback();
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

function SortingCategoriesNodeView({ node, selected }: NodeViewProps) {
  const {
    categories,
    items,
    colorCoding,
    showFirstAsExample,
  } = node.attrs as SortingCategoriesAttrs;
  const categoryColorIndex = new Map(
    categories.map((category, index) => [category.id, index + 1]),
  );
  const shuffledItems = [...items].sort(
    (first, second) => stableHash(first.id) - stableHash(second.id),
  );
  const writingLineCount = Math.max(
    1,
    ...categories.map((category) => (
      items.filter((item) => item.categoryId === category.id).length
    )),
  );

  return (
    <CustomBlockRoot
      selected={selected}
      className={colorCoding
        ? 'sorting-categories-node sorting-categories-node--color-coded'
        : 'sorting-categories-node'}
    >
      <BlockInstruction>
        {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.sortingCategories}
      </BlockInstruction>
      <div className="custom-block__word-bank sorting-categories-node__bank">
        {shuffledItems.map((item) => (
          <span
            className="sorting-categories-node__bank-item"
            data-category-color={categoryColorIndex.get(item.categoryId) ?? 1}
            data-category-id={item.categoryId}
            key={item.id}
          >
            <span className="custom-block__compact-label">{item.text}</span>
            {showFirstAsExample && item.id === items[0]?.id && (
              <RoughExampleStrike seed={item.id} />
            )}
          </span>
        ))}
      </div>
      <div
        className="sorting-categories-node__categories"
        data-columns={categories.length}
        style={{
          '--sorting-categories-line-count': writingLineCount,
          '--sorting-categories-row-span': writingLineCount + 1,
        } as CSSProperties}
      >
        {categories.map((category, categoryIndex) => {
          const categoryItems = items.filter(
            (item) => item.categoryId === category.id,
          );

          return (
            <section className="sorting-categories-node__category" key={category.id}>
              <h3
                className="sorting-categories-node__category-title"
                data-category-color={categoryIndex + 1}
              >
                <span className="sorting-categories-node__category-title-label">
                  {category.title || `Category ${categoryIndex + 1}`}
                </span>
              </h3>
              {Array.from({ length: writingLineCount }, (_, lineIndex) => (
                <span
                  aria-hidden="true"
                  className="sorting-categories-node__writing-line"
                  data-example={
                    showFirstAsExample
                    && categoryItems[lineIndex]?.id === items[0]?.id
                  }
                  data-solution={categoryItems[lineIndex]?.text ?? ''}
                  key={lineIndex}
                />
              ))}
            </section>
          );
        })}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    sortingCategories: {
      insertSortingCategories: (attrs?: Partial<SortingCategoriesAttrs>) => ReturnType;
    };
  }
}

export const SortingCategories = Node.create({
  name: 'sortingCategories',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      categories: {
        default: DEFAULT_SORTING_CATEGORIES,
        parseHTML: (element) => parseArray(
          element.getAttribute('data-sorting-categories'),
          defaultCategories,
        ).slice(0, 4),
        renderHTML: (attributes) => ({
          'data-sorting-categories': encodeURIComponent(
            JSON.stringify(attributes.categories),
          ),
        }),
      },
      items: {
        default: DEFAULT_SORTING_CATEGORY_ITEMS,
        parseHTML: (element) => parseArray(
          element.getAttribute('data-sorting-category-items'),
          defaultItems,
        ),
        renderHTML: (attributes) => ({
          'data-sorting-category-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
      colorCoding: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-sorting-color-coding') === 'true',
        renderHTML: (attributes) => ({
          'data-sorting-color-coding': String(attributes.colorCoding),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-sorting-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-sorting-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="sorting-categories"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'sorting-categories' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SortingCategoriesNodeView);
  },

  addCommands() {
    return {
      insertSortingCategories:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              categories: (attrs.categories ?? defaultCategories()).slice(0, 4),
              items: attrs.items ?? defaultItems(),
              colorCoding: attrs.colorCoding ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
