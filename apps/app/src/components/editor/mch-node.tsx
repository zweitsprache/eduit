"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  BlockQuestion,
  BlockRow,
  BlockRowLabel,
  BlockRows,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { useMatrixOptionWidth } from '@/components/editor/custom-blocks/use-matrix-option-width';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import {
  InlineFormattedText,
  stripInlineFormatting,
} from '@/components/editor/custom-blocks/inline-formatting';

export type MCHOption = {
  id: string;
  text: string;
};

export type MCHRow = {
  id: string;
  text: string;
  correctOptionId: string | null;
};

export type MCHAttrs = {
  question: string;
  options: MCHOption[];
  rows: MCHRow[];
  showFirstAsExample: boolean;
};

export const DEFAULT_MCH_OPTIONS: MCHOption[] = [
  { id: 'option-a', text: 'Option A' },
  { id: 'option-b', text: 'Option B' },
  { id: 'option-c', text: 'Option C' },
];

export const DEFAULT_MCH_ROWS: MCHRow[] = [
  { id: 'row-1', text: 'Answer row A', correctOptionId: null },
  { id: 'row-2', text: 'Answer row B', correctOptionId: null },
];

function defaultOptions(): MCHOption[] {
  return DEFAULT_MCH_OPTIONS.map((option) => ({ ...option }));
}

function defaultRows(): MCHRow[] {
  return DEFAULT_MCH_ROWS.map((row) => ({ ...row }));
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

function MCHNodeView({ node, selected }: NodeViewProps) {
  const {
    question,
    options,
    rows,
    showFirstAsExample,
  } = node.attrs as MCHAttrs;
  const optionWidthRef = useMatrixOptionWidth({
    labels: options.map((option) => stripInlineFormatting(option.text)),
    columns: options.length,
    controlWithLabel: false,
  });
  const solutionsRef = useRoughSolutionXs(optionWidthRef);

  return (
    <CustomBlockRoot selected={selected} className="mch-node">
      <div className="custom-block__matrix-layout" ref={optionWidthRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.mch}
        </BlockInstruction>
        <BlockQuestion>
          {question.trim()
            ? <InlineFormattedText text={question} />
            : null}
        </BlockQuestion>
        <div className="mch-node__header">
          <span aria-hidden="true" className="mch-node__index-spacer" />
          <span aria-hidden="true" className="mch-node__label-spacer" />
          <div className="mch-node__option-columns" data-columns={options.length}>
            {options.map((option, index) => (
              <span className="mch-node__header-option" key={option.id}>
                <InlineFormattedText
                  fallback={`Option ${String.fromCharCode(65 + index)}`}
                  text={option.text}
                />
              </span>
            ))}
          </div>
        </div>
        <BlockRows>
          {rows.map((row, rowIndex) => (
            <BlockRow index={rowIndex} key={row.id}>
              <BlockRowLabel>
                <InlineFormattedText
                  fallback={`Answer row ${rowIndex + 1}`}
                  text={row.text}
                />
              </BlockRowLabel>
              <div className="mch-node__option-columns" data-columns={options.length}>
                {options.map((option) => (
                  <span className="mch-node__choice" key={option.id}>
                    <BlockChoiceIndicator
                      checked={false}
                      example={showFirstAsExample && rowIndex === 0}
                      solutionKey={row.correctOptionId === option.id
                        ? `${row.id}:${option.id}`
                        : undefined}
                    />
                  </span>
                ))}
              </div>
            </BlockRow>
          ))}
        </BlockRows>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mch: {
      insertMCH: (attrs?: Partial<MCHAttrs>) => ReturnType;
    };
  }
}

export const MCH = Node.create({
  name: 'mch',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      question: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-mch-question') ?? '',
        renderHTML: (attributes) => ({ 'data-mch-question': attributes.question }),
      },
      options: {
        default: DEFAULT_MCH_OPTIONS,
        parseHTML: (element) => parseValue(
          element.getAttribute('data-mch-options'),
          defaultOptions,
        ),
        renderHTML: (attributes) => ({
          'data-mch-options': encodeURIComponent(JSON.stringify(attributes.options)),
        }),
      },
      rows: {
        default: DEFAULT_MCH_ROWS,
        parseHTML: (element) => parseValue(
          element.getAttribute('data-mch-rows'),
          defaultRows,
        ),
        renderHTML: (attributes) => ({
          'data-mch-rows': encodeURIComponent(JSON.stringify(attributes.rows)),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-mch-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-mch-show-first-example': String(attributes.showFirstAsExample),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mch"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mch' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MCHNodeView);
  },

  addCommands() {
    return {
      insertMCH:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              question: attrs.question ?? '',
              options: attrs.options ?? defaultOptions(),
              rows: attrs.rows ?? defaultRows(),
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
