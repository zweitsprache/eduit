"use client";

import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  BlockRowLabel,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';

export type MCQTwoOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type MCQTwoItem = {
  id: string;
  options: MCQTwoOption[];
};

export type MCQTwoColumns = 1 | 2 | 3;

export type MCQTwoAttrs = {
  instruction: string;
  hideInstructionBadge: boolean;
  items: MCQTwoItem[];
  columns: MCQTwoColumns;
  showFirstAsExample: boolean;
};

export const DEFAULT_MCQ_TWO_INSTRUCTION = 'Choose the correct answer.';

function defaultOptions(): MCQTwoOption[] {
  return [
    { id: 'mcq-two-option-a', text: 'Option A', correct: true },
    { id: 'mcq-two-option-b', text: 'Option B', correct: false },
    { id: 'mcq-two-option-c', text: 'Option C', correct: false },
    { id: 'mcq-two-option-d', text: 'Option D', correct: false },
  ];
}

export const DEFAULT_MCQ_TWO_ITEMS: MCQTwoItem[] = [
  { id: 'mcq-two-item-1', options: defaultOptions() },
];

function parseItems(value: string | null): MCQTwoItem[] {
  if (!value) return DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item }));
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) {
      return DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item }));
    }
    const parsed = items.flatMap((item, index): MCQTwoItem[] => (
      item && Array.isArray(item.options)
        ? [{
            id: typeof item.id === 'string' ? item.id : `mcq-two-item-${index + 1}`,
            options: item.options.flatMap((option: unknown, optionIndex: number) => {
              const candidate = option as { id?: unknown; text?: unknown; correct?: unknown };
              return typeof candidate?.text === 'string'
                ? [{
                    id: typeof candidate.id === 'string'
                      ? candidate.id
                      : `mcq-two-item-${index + 1}-option-${optionIndex + 1}`,
                    text: candidate.text,
                    correct: candidate.correct === true,
                  }]
                : [];
            }),
          }]
        : []
    ));
    return parsed.length
      ? parsed
      : DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item }));
  }
}

function parseColumns(value: unknown): MCQTwoColumns {
  const columns = Number(value);
  return columns === 1 || columns === 2 ? columns : 3;
}

function MCQTwoNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as MCQTwoAttrs;
  const layoutRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(layoutRef);

  return (
    <CustomBlockRoot selected={selected} className="mcq-two-node">
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
          {attrs.instruction || DEFAULT_MCQ_TWO_INSTRUCTION}
        </BlockInstruction>
        <div className="mcq-two-node__items">
          {attrs.items.map((item, index) => (
            <div className="mcq-two-node__item" key={item.id}>
              <span className="custom-block__row-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div
                className="mcq-two-node__options"
                style={{
                  gridTemplateColumns: `repeat(${attrs.columns}, minmax(0, 1fr))`,
                }}
              >
                {item.options.map((option, optionIndex) => (
                  <span className="mcq-two-node__option" key={option.id}>
                    <BlockChoiceIndicator
                      checked={false}
                      example={attrs.showFirstAsExample && index === 0}
                      solutionKey={option.correct ? option.id : undefined}
                    />
                    <BlockRowLabel>
                      <InlineFormattedText
                        fallback={`Option ${String.fromCharCode(65 + optionIndex)}`}
                        text={option.text}
                      />
                    </BlockRowLabel>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mcqTwo: {
      insertMCQTwo: (attrs?: Partial<MCQTwoAttrs>) => ReturnType;
    };
  }
}

export const MCQTwo = Node.create({
  name: 'mcqTwo',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_MCQ_TWO_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-two-instruction')
          ?? DEFAULT_MCQ_TWO_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-mcq-two-instruction': attributes.instruction,
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-two-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-two-hide-instruction-badge': String(attributes.hideInstructionBadge),
        }),
      },
      items: {
        default: DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item })),
        parseHTML: (element) => parseItems(
          element.getAttribute('data-mcq-two-items'),
        ),
        renderHTML: (attributes) => ({
          'data-mcq-two-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
      columns: {
        default: 3,
        parseHTML: (element) => parseColumns(
          element.getAttribute('data-mcq-two-columns'),
        ),
        renderHTML: (attributes) => ({
          'data-mcq-two-columns': attributes.columns,
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-two-show-first-as-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-two-show-first-as-example': String(attributes.showFirstAsExample),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mcq-two"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mcq-two' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MCQTwoNodeView);
  },

  addCommands() {
    return {
      insertMCQTwo:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_MCQ_TWO_INSTRUCTION,
            hideInstructionBadge: attrs.hideInstructionBadge ?? false,
            items: attrs.items ?? DEFAULT_MCQ_TWO_ITEMS.map((item) => ({ ...item })),
            columns: attrs.columns ?? 3,
            showFirstAsExample: attrs.showFirstAsExample ?? false,
          },
        }),
    };
  },
});
