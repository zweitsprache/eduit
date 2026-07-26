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

export type TrueFalseValue = 'true' | 'false' | 'na';

export type TrueFalseRow = {
  id: string;
  text: string;
  correctValue: TrueFalseValue | null;
};

export type TrueFalseAttrs = {
  question: string;
  trueLabel: string;
  falseLabel: string;
  showNa: boolean;
  naLabel: string;
  rows: TrueFalseRow[];
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
    question,
    trueLabel,
    falseLabel,
    showNa,
    naLabel,
    rows,
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

  return (
    <CustomBlockRoot
      selected={selected}
      className={`mch-node true-false-node${showNa ? ' true-false-node--with-na' : ''}`}
    >
      <div className="custom-block__matrix-layout" ref={optionWidthRef}>
        <BlockInstruction>Mark each statement as true or false.</BlockInstruction>
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
                    <BlockChoiceIndicator checked={row.correctValue === option.value} />
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
      question: {
        default: 'Decide whether each statement is true or false.',
        parseHTML: (element) => element.getAttribute('data-true-false-question')
          ?? 'Decide whether each statement is true or false.',
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
              question: attrs.question ?? 'Decide whether each statement is true or false.',
              trueLabel: attrs.trueLabel ?? 'True',
              falseLabel: attrs.falseLabel ?? 'False',
              showNa: attrs.showNa ?? false,
              naLabel: attrs.naLabel ?? 'N/A',
              rows: attrs.rows ?? defaultRows(),
            },
          }),
    };
  },
});
