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
import {
  CUSTOM_BLOCK_NODE_GROUP,
} from '@/components/editor/custom-blocks/numbering';

export type MCQOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type MCQColumns = 1 | 2 | 3;
export type MCQAnswerMode = 'single' | 'multiple';

export type MCQAttrs = {
  question: string;
  options: MCQOption[];
  columns: MCQColumns;
  answerMode: MCQAnswerMode;
};

export const DEFAULT_MCQ_OPTIONS: MCQOption[] = [
  { id: 'option-a', text: 'Option A', correct: false },
  { id: 'option-b', text: 'Option B', correct: false },
  { id: 'option-c', text: 'Option C', correct: false },
  { id: 'option-d', text: 'Option D', correct: false },
];

function parseOptions(value: string | null): MCQOption[] {
  if (!value) return DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));

  try {
    const options = JSON.parse(decodeURIComponent(value));
    return Array.isArray(options) ? options : DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));
  } catch {
    return DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));
  }
}

function MCQNodeView({ node, selected }: NodeViewProps) {
  const { question, options, columns } = node.attrs as MCQAttrs;

  return (
    <CustomBlockRoot selected={selected} className="mcq-node">
      <BlockInstruction>Choose the correct answer.</BlockInstruction>
      <BlockQuestion>{question}</BlockQuestion>
      <BlockRows columns={columns}>
        {options.map((option, index) => (
          <BlockRow index={index} key={option.id}>
            <BlockChoiceIndicator checked={option.correct} />
            <BlockRowLabel>
              {option.text || `Option ${String.fromCharCode(65 + index)}`}
            </BlockRowLabel>
          </BlockRow>
        ))}
      </BlockRows>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mcq: {
      insertMCQ: (attrs?: Partial<MCQAttrs>) => ReturnType;
    };
  }
}

export const MCQ = Node.create({
  name: 'mcq',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      question: {
        default: 'Enter your question here',
        parseHTML: (element) => element.getAttribute('data-mcq-question') ?? 'Enter your question here',
        renderHTML: (attributes) => ({ 'data-mcq-question': attributes.question }),
      },
      options: {
        default: DEFAULT_MCQ_OPTIONS,
        parseHTML: (element) => parseOptions(element.getAttribute('data-mcq-options')),
        renderHTML: (attributes) => ({
          'data-mcq-options': encodeURIComponent(JSON.stringify(attributes.options)),
        }),
      },
      columns: {
        default: 1,
        parseHTML: (element) => {
          const columns = Number(element.getAttribute('data-mcq-columns'));
          return columns === 2 || columns === 3 ? columns : 1;
        },
        renderHTML: (attributes) => ({
          'data-mcq-columns': attributes.columns,
        }),
      },
      answerMode: {
        default: 'single',
        parseHTML: (element) => (
          element.getAttribute('data-mcq-answer-mode') === 'multiple'
            ? 'multiple'
            : 'single'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-answer-mode': attributes.answerMode,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="mcq"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'mcq' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MCQNodeView);
  },

  addCommands() {
    return {
      insertMCQ:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              question: attrs.question ?? 'Enter your question here',
              options: attrs.options ?? DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option })),
              columns: attrs.columns ?? 1,
              answerMode: attrs.answerMode ?? 'single',
            },
          }),
    };
  },
});
