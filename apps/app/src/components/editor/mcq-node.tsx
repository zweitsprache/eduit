"use client";

import { useRef } from 'react';
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
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';

export type MCQOption = {
  id: string;
  text: string;
  correct: boolean;
};

export type MCQColumns = 1 | 2 | 3;
export type MCQAnswerMode = 'single' | 'multiple';

export type MCQAttrs = {
  instruction: string;
  question: string;
  options: MCQOption[];
  columns: MCQColumns;
  answerMode: MCQAnswerMode;
  shuffleAnswers: boolean;
};

export const DEFAULT_MCQ_INSTRUCTION = 'Choose the correct answer.';

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

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function shuffledOptions(options: MCQOption[]) {
  const result = [...options];
  let state = stableHash(options.map(({ id }) => id).join(':'));
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  if (
    result.length > 1
    && result.every((option, index) => option.id === options[index].id)
  ) {
    result.push(result.shift()!);
  }
  return result;
}

function MCQNodeView({ node, selected }: NodeViewProps) {
  const {
    instruction,
    question,
    options,
    columns,
    shuffleAnswers,
  } = node.attrs as MCQAttrs;
  const layoutRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(layoutRef);
  const displayedOptions = shuffleAnswers ? shuffledOptions(options) : options;

  return (
    <CustomBlockRoot selected={selected} className="mcq-node">
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction>
          {instruction || DEFAULT_MCQ_INSTRUCTION}
        </BlockInstruction>
        <BlockQuestion>
          <InlineFormattedText text={question} />
        </BlockQuestion>
        <BlockRows columns={columns}>
          {displayedOptions.map((option, index) => (
            <BlockRow index={index} key={option.id}>
              <BlockChoiceIndicator
                checked={false}
                solutionKey={option.correct ? option.id : undefined}
              />
              <BlockRowLabel>
                <InlineFormattedText
                  fallback={`Option ${String.fromCharCode(65 + index)}`}
                  text={option.text}
                />
              </BlockRowLabel>
            </BlockRow>
          ))}
        </BlockRows>
      </div>
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
      instruction: {
        default: DEFAULT_MCQ_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-instruction')
          ?? DEFAULT_MCQ_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-mcq-instruction': attributes.instruction,
        }),
      },
      question: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-mcq-question') ?? '',
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
      shuffleAnswers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-shuffle-answers') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-shuffle-answers': String(attributes.shuffleAnswers),
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
              instruction: attrs.instruction ?? DEFAULT_MCQ_INSTRUCTION,
              question: attrs.question ?? '',
              options: attrs.options ?? DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option })),
              columns: attrs.columns ?? 1,
              answerMode: attrs.answerMode ?? 'single',
              shuffleAnswers: attrs.shuffleAnswers ?? false,
            },
          }),
    };
  },
});
