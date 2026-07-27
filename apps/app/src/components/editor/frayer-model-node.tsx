"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';

export type FrayerQuadrant = {
  id: 'definition' | 'characteristics' | 'examples' | 'nonExamples';
  label: string;
  answer: string;
};

export type FrayerModelAttrs = {
  instruction: string;
  concept: string;
  quadrants: FrayerQuadrant[];
  responseLines: number;
  showModelAnswers: boolean;
};

export const DEFAULT_FRAYER_QUADRANTS: FrayerQuadrant[] = [
  { id: 'definition', label: 'Definition', answer: '' },
  { id: 'characteristics', label: 'Characteristics', answer: '' },
  { id: 'examples', label: 'Examples', answer: '' },
  { id: 'nonExamples', label: 'Non-examples', answer: '' },
];

function defaultQuadrants() {
  return DEFAULT_FRAYER_QUADRANTS.map((quadrant) => ({ ...quadrant }));
}

function parseQuadrants(value: string | null): FrayerQuadrant[] {
  if (!value) return defaultQuadrants();

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultQuadrants();

    return DEFAULT_FRAYER_QUADRANTS.map((fallback) => {
      const quadrant = parsed.find((item) => item?.id === fallback.id);
      return {
        id: fallback.id,
        label: typeof quadrant?.label === 'string'
          ? quadrant.label
          : fallback.label,
        answer: typeof quadrant?.answer === 'string' ? quadrant.answer : '',
      };
    });
  } catch {
    return defaultQuadrants();
  }
}

function parseResponseLines(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 6 ? parsed : 3;
}

function FrayerModelNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as FrayerModelAttrs;

  return (
    <CustomBlockRoot selected={selected} className="frayer-model-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="frayer-model-node__frame">
        {attrs.quadrants.map((quadrant) => (
          <section className="frayer-model-node__quadrant" key={quadrant.id}>
            <strong className="frayer-model-node__label">
              {quadrant.label}
            </strong>
            <div
              className="frayer-model-node__response"
              data-show-answer={attrs.showModelAnswers}
              style={{
                minHeight: `calc(var(--custom-block-row-height) * ${attrs.responseLines})`,
              }}
            >
              <div className="frayer-model-node__answer">
                <InlineFormattedText text={quadrant.answer} />
              </div>
            </div>
          </section>
        ))}
        <div className="frayer-model-node__concept">
          <strong>{attrs.concept || 'Key concept'}</strong>
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    frayerModel: {
      insertFrayerModel: (attrs?: Partial<FrayerModelAttrs>) => ReturnType;
    };
  }
}

export const FrayerModel = Node.create({
  name: 'frayerModel',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Complete the Frayer model for the concept.',
        parseHTML: (element) => (
          element.getAttribute('data-frayer-instruction')
          ?? 'Complete the Frayer model for the concept.'
        ),
        renderHTML: (attributes) => ({
          'data-frayer-instruction': attributes.instruction,
        }),
      },
      concept: {
        default: 'Key concept',
        parseHTML: (element) => (
          element.getAttribute('data-frayer-concept') ?? 'Key concept'
        ),
        renderHTML: (attributes) => ({
          'data-frayer-concept': attributes.concept,
        }),
      },
      quadrants: {
        default: DEFAULT_FRAYER_QUADRANTS,
        parseHTML: (element) => parseQuadrants(
          element.getAttribute('data-frayer-quadrants'),
        ),
        renderHTML: (attributes) => ({
          'data-frayer-quadrants': encodeURIComponent(
            JSON.stringify(attributes.quadrants),
          ),
        }),
      },
      responseLines: {
        default: 3,
        parseHTML: (element) => parseResponseLines(
          element.getAttribute('data-frayer-response-lines'),
        ),
        renderHTML: (attributes) => ({
          'data-frayer-response-lines': attributes.responseLines,
        }),
      },
      showModelAnswers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-frayer-show-model-answers') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-frayer-show-model-answers': String(attributes.showModelAnswers),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="frayer-model"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'frayer-model' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FrayerModelNodeView);
  },

  addCommands() {
    return {
      insertFrayerModel:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction:
                attrs.instruction ?? 'Complete the Frayer model for the concept.',
              concept: attrs.concept ?? 'Key concept',
              quadrants: attrs.quadrants ?? defaultQuadrants(),
              responseLines: attrs.responseLines ?? 3,
              showModelAnswers: attrs.showModelAnswers ?? false,
            },
          }),
    };
  },
});
