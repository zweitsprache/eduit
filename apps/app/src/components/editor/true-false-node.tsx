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

export type TrueFalseValue = 'true' | 'false' | 'na';

export type TrueFalseRow = {
  id: string;
  text: string;
  correctValue: TrueFalseValue | null;
};

export type TrueFalseAttrs = {
  hideInstructionBadge: boolean;
  question: string;
  trueLabel: string;
  falseLabel: string;
  showNa: boolean;
  naLabel: string;
  rows: TrueFalseRow[];
  showFirstAsExample: boolean;
};

export const DEFAULT_TRUE_FALSE_ROWS: TrueFalseRow[] = [
  { id: 'row-1', text: 'Statement 1', correctValue: null },
  { id: 'row-2', text: 'Statement 2', correctValue: null },
  { id: 'row-3', text: 'Statement 3', correctValue: null },
];

function defaultRows() {
  return DEFAULT_TRUE_FALSE_ROWS.map((row) => ({ ...row }));
}

function parseRows(value: string | null): TrueFalseRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed : defaultRows();
  } catch {
    return defaultRows();
  }
}

function TrueFalseNodeView({ node, selected }: NodeViewProps) {
  const {
    hideInstructionBadge,
    question,
    trueLabel,
    falseLabel,
    showNa,
    naLabel,
    rows,
    showFirstAsExample,
  } = node.attrs as TrueFalseAttrs;
  const options = [
    { value: 'true' as const, label: trueLabel },
    { value: 'false' as const, label: falseLabel },
    ...(showNa ? [{ value: 'na' as const, label: naLabel }] : []),
  ];
  const optionWidthRef = useMatrixOptionWidth({
    labels: options.map(({ label }) => label),
    columns: options.length,
    controlWithLabel: false,
  });
  const solutionsRef = useRoughSolutionXs(optionWidthRef);

  return (
    <CustomBlockRoot
      selected={selected}
      className={`mch-node true-false-node${showNa ? ' true-false-node--with-na' : ''}`}
    >
      <div className="custom-block__matrix-layout" ref={optionWidthRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction hideBadge={hideInstructionBadge}>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.trueFalse}
        </BlockInstruction>
        <BlockQuestion>{question}</BlockQuestion>
        <div className="mch-node__header">
          <span aria-hidden="true" className="mch-node__index-spacer" />
          <span aria-hidden="true" className="mch-node__label-spacer" />
          <div className="mch-node__option-columns" data-columns={options.length}>
            {options.map((option) => (
              <strong className="mch-node__header-option" key={option.value}>
                {option.label}
              </strong>
            ))}
          </div>
        </div>
        <BlockRows>
          {rows.map((row, rowIndex) => (
            <BlockRow index={rowIndex} key={row.id}>
              <BlockRowLabel>{row.text || `Statement ${rowIndex + 1}`}</BlockRowLabel>
              <div className="mch-node__option-columns" data-columns={options.length}>
                {options.map((option) => (
                  <span className="mch-node__choice" key={option.value}>
                    <BlockChoiceIndicator
                      checked={false}
                      example={showFirstAsExample && rowIndex === 0}
                      solutionKey={row.correctValue === option.value
                        ? `${row.id}:${option.value}`
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
    trueFalse: {
      insertTrueFalse: (attrs?: Partial<TrueFalseAttrs>) => ReturnType;
    };
  }
}

export const TrueFalse = Node.create({
  name: 'trueFalse',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-true-false-hide-instruction-badge') === 'true',
        renderHTML: (attributes) => ({
          'data-true-false-hide-instruction-badge': String(attributes.hideInstructionBadge),
        }),
      },
      question: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-true-false-question')
          ?? '',
        renderHTML: (attributes) => ({
          'data-true-false-question': attributes.question,
        }),
      },
      trueLabel: {
        default: 'True',
        parseHTML: (element) => element.getAttribute('data-true-label') ?? 'True',
        renderHTML: (attributes) => ({ 'data-true-label': attributes.trueLabel }),
      },
      falseLabel: {
        default: 'False',
        parseHTML: (element) => element.getAttribute('data-false-label') ?? 'False',
        renderHTML: (attributes) => ({ 'data-false-label': attributes.falseLabel }),
      },
      showNa: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-show-na') === 'true',
        renderHTML: (attributes) => ({ 'data-show-na': String(attributes.showNa) }),
      },
      naLabel: {
        default: 'N/A',
        parseHTML: (element) => element.getAttribute('data-na-label') ?? 'N/A',
        renderHTML: (attributes) => ({ 'data-na-label': attributes.naLabel }),
      },
      rows: {
        default: DEFAULT_TRUE_FALSE_ROWS,
        parseHTML: (element) => parseRows(element.getAttribute('data-true-false-rows')),
        renderHTML: (attributes) => ({
          'data-true-false-rows': encodeURIComponent(JSON.stringify(attributes.rows)),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-true-false-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-true-false-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="true-false"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'true-false' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TrueFalseNodeView);
  },

  addCommands() {
    return {
      insertTrueFalse:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              hideInstructionBadge: attrs.hideInstructionBadge ?? false,
              question: attrs.question ?? '',
              trueLabel: attrs.trueLabel ?? 'True',
              falseLabel: attrs.falseLabel ?? 'False',
              showNa: attrs.showNa ?? false,
              naLabel: attrs.naLabel ?? 'N/A',
              rows: attrs.rows ?? defaultRows(),
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
