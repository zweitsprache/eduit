"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type MiniFormColumns = 1 | 2 | 3;

export type MiniFormField = {
  id: string;
  label: string;
};

export type MiniFormItem = {
  id: string;
  prompt: string;
  values: Record<string, string>;
  image?: {
    src: string;
    alt: string;
  };
};

export type MiniFormAttrs = {
  instruction: string;
  fields: MiniFormField[];
  columns: MiniFormColumns;
  showFirstAsExample: boolean;
  items: MiniFormItem[];
};

export const DEFAULT_MINI_FORM_FIELDS: MiniFormField[] = [
  { id: 'mini-form-name', label: 'Name' },
  { id: 'mini-form-country', label: 'Country' },
  { id: 'mini-form-languages', label: 'Language(s)' },
];

export const DEFAULT_MINI_FORM_ITEMS: MiniFormItem[] = [
  {
    id: 'mini-form-item-1',
    prompt: 'My name is Amir. I come from Syria and now live in Zurich. I speak Arabic, some German, and English.',
    values: {
      'mini-form-name': 'Amir',
      'mini-form-country': 'Syria',
      'mini-form-languages': 'Arabic, German, English',
    },
  },
  {
    id: 'mini-form-item-2',
    prompt: 'My name is Fatima. I come from Somalia and have lived in Bern for two years. I speak Somali, German, and some French.',
    values: {
      'mini-form-name': 'Fatima',
      'mini-form-country': 'Somalia',
      'mini-form-languages': 'Somali, German, French',
    },
  },
  {
    id: 'mini-form-item-3',
    prompt: 'I am Luan. I come from Kosovo and live in Lucerne. I speak Albanian, German, and English.',
    values: {
      'mini-form-name': 'Luan',
      'mini-form-country': 'Kosovo',
      'mini-form-languages': 'Albanian, German, English',
    },
  },
];

function defaultFields() {
  return DEFAULT_MINI_FORM_FIELDS.map((field) => ({ ...field }));
}

function defaultItems() {
  return DEFAULT_MINI_FORM_ITEMS.map((item) => ({
    ...item,
    values: { ...item.values },
  }));
}

function parseFields(value: string | null): MiniFormField[] {
  if (!value) return defaultFields();
  try {
    const fields = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(fields)) return defaultFields();
    const parsed = fields.flatMap((field, index): MiniFormField[] => (
      typeof field?.label === 'string'
        ? [{
            id: typeof field.id === 'string'
              ? field.id
              : `mini-form-field-${index + 1}`,
            label: field.label,
          }]
        : []
    ));
    return parsed.length ? parsed : defaultFields();
  } catch {
    return defaultFields();
  }
}

function parseItems(value: string | null): MiniFormItem[] {
  if (!value) return defaultItems();
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) return defaultItems();
    const parsed = items.flatMap((item, index): MiniFormItem[] => {
      if (!item || typeof item.prompt !== 'string') return [];
      const values = item.values && typeof item.values === 'object'
        ? Object.fromEntries(
            Object.entries(item.values).map(([key, fieldValue]) => [
              key,
              typeof fieldValue === 'string' ? fieldValue : '',
            ]),
          )
        : {};
      return [{
        id: typeof item.id === 'string'
          ? item.id
          : `mini-form-item-${index + 1}`,
        prompt: item.prompt,
        values,
        image: typeof item.image?.src === 'string'
          ? {
              src: item.image.src,
              alt: typeof item.image.alt === 'string' ? item.image.alt : '',
            }
          : undefined,
      }];
    });
    return parsed.length ? parsed : defaultItems();
  } catch {
    return defaultItems();
  }
}

function MiniFormNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as MiniFormAttrs;

  return (
    <CustomBlockRoot selected={selected} className="mini-form-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="mini-form-node__items">
        {attrs.items.map((item, itemIndex) => (
          <div
            className={`mini-form-node__item${
              item.image ? ' mini-form-node__item--with-image' : ''
            }`}
            key={item.id}
          >
            <span className="custom-block__row-index mini-form-node__index">
              {String(itemIndex + 1).padStart(2, '0')}
            </span>
            {item.image && (
              <img
                alt={item.image.alt}
                className="mini-form-node__image"
                src={item.image.src}
              />
            )}
            <div className="mini-form-node__body">
              <p className="mini-form-node__prompt">{item.prompt}</p>
              <div
                className="mini-form-node__fields"
                data-columns={attrs.columns}
              >
                {attrs.fields.map((field, fieldIndex) => {
                  const answer = item.values[field.id] ?? '';
                  const showExample = attrs.showFirstAsExample
                    && itemIndex === 0
                    && fieldIndex === 0;
                  return (
                    <div className="mini-form-node__field" key={field.id}>
                      <strong className="mini-form-node__field-label">
                        {field.label || `Field ${fieldIndex + 1}`}
                      </strong>
                      <span
                        aria-label={showExample ? answer : undefined}
                        className="mini-form-node__answer"
                        data-answer={answer}
                        data-example={showExample}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    miniForm: {
      insertMiniForm: (attrs?: Partial<MiniFormAttrs>) => ReturnType;
    };
  }
}

export const MiniForm = Node.create({
  name: 'miniForm',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Read the sentences and complete the forms.',
        parseHTML: (element) => (
          element.getAttribute('data-mini-form-instruction')
          ?? 'Read the sentences and complete the forms.'
        ),
        renderHTML: (attributes) => ({
          'data-mini-form-instruction': attributes.instruction,
        }),
      },
      fields: {
        default: DEFAULT_MINI_FORM_FIELDS,
        parseHTML: (element) => parseFields(
          element.getAttribute('data-mini-form-fields'),
        ),
        renderHTML: (attributes) => ({
          'data-mini-form-fields': encodeURIComponent(
            JSON.stringify(attributes.fields),
          ),
        }),
      },
      columns: {
        default: 3,
        parseHTML: (element) => {
          const columns = Number(element.getAttribute('data-mini-form-columns'));
          return columns === 1 || columns === 2 ? columns : 3;
        },
        renderHTML: (attributes) => ({
          'data-mini-form-columns': attributes.columns,
        }),
      },
      showFirstAsExample: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-mini-form-show-example') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-mini-form-show-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
      items: {
        default: DEFAULT_MINI_FORM_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-mini-form-items'),
        ),
        renderHTML: (attributes) => ({
          'data-mini-form-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mini-form"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'mini-form' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MiniFormNodeView);
  },

  addCommands() {
    return {
      insertMiniForm:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction: attrs.instruction
                ?? 'Read the sentences and complete the forms.',
              fields: attrs.fields ?? defaultFields(),
              columns: attrs.columns ?? 3,
              showFirstAsExample: attrs.showFirstAsExample ?? true,
              items: attrs.items ?? defaultItems(),
            },
          }),
    };
  },
});
