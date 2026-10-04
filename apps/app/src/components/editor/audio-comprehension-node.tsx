"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type AudioComprehensionItem = {
  id: string;
  text: string;
};

export type AudioComprehensionTextAlign = 'left' | 'center';

export type AudioComprehensionAttrs = {
  instruction: string;
  hideInstructionBadge: boolean;
  items: AudioComprehensionItem[];
  columns: number;
  shuffleItems: boolean;
  showFirstAsExample: boolean;
  textAlign: AudioComprehensionTextAlign;
};

export const DEFAULT_AUDIO_COMPREHENSION_INSTRUCTION =
  'Listen and click the word you hear.';
export const DEFAULT_AUDIO_COMPREHENSION_ITEMS: AudioComprehensionItem[] = [
  { id: 'audio-comprehension-item-1', text: 'apple' },
  { id: 'audio-comprehension-item-2', text: 'banana' },
  { id: 'audio-comprehension-item-3', text: 'orange' },
];

export const MIN_AUDIO_COMPREHENSION_COLUMNS = 1;
export const MAX_AUDIO_COMPREHENSION_COLUMNS = 3;
export const DEFAULT_AUDIO_COMPREHENSION_COLUMNS = 2;

function parseColumns(value: unknown) {
  const columns = Number(value);
  if (!Number.isFinite(columns)) return DEFAULT_AUDIO_COMPREHENSION_COLUMNS;
  return Math.min(
    MAX_AUDIO_COMPREHENSION_COLUMNS,
    Math.max(MIN_AUDIO_COMPREHENSION_COLUMNS, Math.round(columns)),
  );
}

function parseTextAlign(value: string | null): AudioComprehensionTextAlign {
  return value === 'left' ? 'left' : 'center';
}

function parseItems(value: string | null): AudioComprehensionItem[] {
  if (!value) return DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item }));
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) {
      return DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item }));
    }
    const parsed = items.flatMap((item, index): AudioComprehensionItem[] => (
      item && typeof item.text === 'string'
        ? [{
            id: typeof item.id === 'string'
              ? item.id
              : `audio-comprehension-item-${index + 1}`,
            text: item.text,
          }]
        : []
    ));
    return parsed.length
      ? parsed
      : DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item }));
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

// Deterministic so the shuffled display order is stable across re-renders/print.
function shuffledItems(items: AudioComprehensionItem[]) {
  const result = [...items];
  let state = stableHash(items.map(({ id }) => id).join(':'));
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function AudioComprehensionNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as AudioComprehensionAttrs;
  const displayedItems = attrs.shuffleItems
    ? shuffledItems(attrs.items)
    : attrs.items;

  return (
    <CustomBlockRoot selected={selected} className="audio-comprehension-node">
      <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
        {attrs.instruction || DEFAULT_AUDIO_COMPREHENSION_INSTRUCTION}
      </BlockInstruction>
      <div
        className="audio-comprehension-node__items"
        data-text-align={attrs.textAlign}
        style={{
          gridTemplateColumns: `repeat(${attrs.columns}, minmax(0, 1fr))`,
        }}
      >
        {displayedItems.map((item, index) => (
          <div className="audio-comprehension-node__row" key={item.id}>
            <span
              aria-hidden="true"
              className="audio-comprehension-node__number-box"
              data-example={attrs.showFirstAsExample && index === 0}
            />
            <span className="audio-comprehension-node__item">
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audioComprehension: {
      insertAudioComprehension: (
        attrs?: Partial<AudioComprehensionAttrs>
      ) => ReturnType;
    };
  }
}

export const AudioComprehension = Node.create({
  name: 'audioComprehension',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_AUDIO_COMPREHENSION_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-audio-comprehension-instruction')
          ?? DEFAULT_AUDIO_COMPREHENSION_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-instruction': attributes.instruction,
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-audio-comprehension-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-hide-instruction-badge':
            String(attributes.hideInstructionBadge),
        }),
      },
      items: {
        default: DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item })),
        parseHTML: (element) => parseItems(
          element.getAttribute('data-audio-comprehension-items'),
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
      columns: {
        default: DEFAULT_AUDIO_COMPREHENSION_COLUMNS,
        parseHTML: (element) => parseColumns(
          element.getAttribute('data-audio-comprehension-columns'),
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-columns': String(attributes.columns),
        }),
      },
      shuffleItems: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-audio-comprehension-shuffle') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-shuffle': String(attributes.shuffleItems),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-audio-comprehension-show-first-as-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-show-first-as-example':
            String(attributes.showFirstAsExample),
        }),
      },
      textAlign: {
        default: 'center',
        parseHTML: (element) => parseTextAlign(
          element.getAttribute('data-audio-comprehension-text-align'),
        ),
        renderHTML: (attributes) => ({
          'data-audio-comprehension-text-align': attributes.textAlign,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="audio-comprehension"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'audio-comprehension' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AudioComprehensionNodeView);
  },

  addCommands() {
    return {
      insertAudioComprehension:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_AUDIO_COMPREHENSION_INSTRUCTION,
            hideInstructionBadge: attrs.hideInstructionBadge ?? false,
            items: attrs.items ?? DEFAULT_AUDIO_COMPREHENSION_ITEMS.map((item) => ({ ...item })),
            columns: attrs.columns ?? DEFAULT_AUDIO_COMPREHENSION_COLUMNS,
            shuffleItems: attrs.shuffleItems ?? false,
            showFirstAsExample: attrs.showFirstAsExample ?? false,
            textAlign: attrs.textAlign ?? 'center',
          },
        }),
    };
  },
});
