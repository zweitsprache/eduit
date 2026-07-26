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

export type MCMOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type MCMRow = {
  id: string;
  text: string;
  options: MCMOption[];
};

export type MCMAttrs = {
  question: string;
  rows: MCMRow[];
};

export const DEFAULT_MCM_ROWS: MCMRow[] = [
  {
    id: 'row-1',
    text: 'Answer row A',
    options: [
      { id: 'row-1-option-1', text: 'Option A', correct: false },
      { id: 'row-1-option-2', text: 'Option B', correct: false },
      { id: 'row-1-option-3', text: 'Option C', correct: false },
    ],
  },
  {
    id: 'row-2',
    text: 'Answer row B',
    options: [
      { id: 'row-2-option-1', text: 'Option A', correct: false },
      { id: 'row-2-option-2', text: 'Option B', correct: false },
      { id: 'row-2-option-3', text: 'Option C', correct: false },
    ],
  },
];

function defaultRows(): MCMRow[] {
  return DEFAULT_MCM_ROWS.map((row) => ({
    ...row,
    options: row.options.map((option) => ({ ...option })),
  }));
}

function parseRows(value: string | null): MCMRow[] {
  if (!value) return defaultRows();

  try {
    const rows = JSON.parse(decodeURIComponent(value));
    return Array.isArray(rows) ? rows : defaultRows();
  } catch {
    return defaultRows();
  }
}

function MCMNodeView({ node, selected }: NodeViewProps) {
  const { question, rows } = node.attrs as MCMAttrs;
  const optionColumnCount = Math.min(
    3,
    Math.max(1, ...rows.map((row) => row.options.length)),
  );
  const optionWidthRef = useMatrixOptionWidth({
    labels: rows.flatMap((row) => row.options.map((option) => option.text)),
    columns: optionColumnCount,
    controlWithLabel: true,
  });

  return (
    <CustomBlockRoot selected={selected} className="mcm-node">
      <div className="custom-block__matrix-layout" ref={optionWidthRef}>
        <BlockInstruction>Choose the correct answer for each row.</BlockInstruction>
        <BlockQuestion>{question}</BlockQuestion>
        <BlockRows>
          {rows.map((row, rowIndex) => (
            <BlockRow index={rowIndex} key={row.id}>
              <BlockRowLabel>{row.text || `Answer row ${rowIndex + 1}`}</BlockRowLabel>
              <div className="mcm-node__options" data-columns={optionColumnCount}>
                {Array.from({ length: optionColumnCount }, (_, optionIndex) => {
                  const option = row.options[optionIndex];
                  return option ? (
                    <div className="mcm-node__option" key={option.id}>
                      <BlockChoiceIndicator checked={option.correct} />
                      <span className="mcm-node__option-label">
                        {option.text || `Option ${String.fromCharCode(65 + optionIndex)}`}
                      </span>
                    </div>
                  ) : (
                    <span
                      aria-hidden="true"
                      className="mcm-node__option mcm-node__option--empty"
                      key={`empty-${optionIndex}`}
                    />
                  );
                })}
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
    mcm: {
      insertMCM: (attrs?: Partial<MCMAttrs>) => ReturnType;
    };
  }
}

export const MCM = Node.create({
  name: 'mcm',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      question: {
        default: 'Enter your question here',
        parseHTML: (element) => element.getAttribute('data-mcm-question') ?? 'Enter your question here',
        renderHTML: (attributes) => ({ 'data-mcm-question': attributes.question }),
      },
      rows: {
        default: DEFAULT_MCM_ROWS,
        parseHTML: (element) => parseRows(element.getAttribute('data-mcm-rows')),
        renderHTML: (attributes) => ({
          'data-mcm-rows': encodeURIComponent(JSON.stringify(attributes.rows)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mcm"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mcm' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MCMNodeView);
  },

  addCommands() {
    return {
      insertMCM:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              question: attrs.question ?? 'Enter your question here',
              rows: attrs.rows ?? defaultRows(),
            },
          }),
    };
  },
});
