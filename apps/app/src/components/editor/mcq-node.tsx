"use client";

import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, type EditorState } from '@tiptap/pm/state';
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

export type MCQQuestion = {
  id: string;
  question: string;
  options: MCQOption[];
  answerMode: MCQAnswerMode;
};

export type MCQAttrs = {
  instruction: string;
  blockQuestion: string;
  questions: MCQQuestion[];
  /** Legacy single-question fields, retained for saved-document compatibility. */
  question: string;
  options: MCQOption[];
  columns: MCQColumns;
  answerMode: MCQAnswerMode;
  shuffleAnswers: boolean;
  questionNumber: number | null;
  showInstruction: boolean;
  hideInstructionBadge: boolean;
};

export const DEFAULT_MCQ_INSTRUCTION = 'Choose the correct answer.';

export const DEFAULT_MCQ_OPTIONS: MCQOption[] = [
  { id: 'option-a', text: 'Option A', correct: false },
  { id: 'option-b', text: 'Option B', correct: false },
  { id: 'option-c', text: 'Option C', correct: false },
  { id: 'option-d', text: 'Option D', correct: false },
];

export function createMCQQuestion(
  question: Partial<MCQQuestion> = {},
): MCQQuestion {
  return {
    id: question.id ?? `mcq-question-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    question: question.question ?? '',
    options: question.options ?? DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option })),
    answerMode: question.answerMode ?? 'single',
  };
}

export function getMCQQuestions(attrs: MCQAttrs): MCQQuestion[] {
  if (Array.isArray(attrs.questions) && attrs.questions.length > 0) {
    return attrs.questions;
  }
  return [createMCQQuestion({
    id: 'legacy-mcq-question',
    question: attrs.question,
    options: attrs.options,
    answerMode: attrs.answerMode,
  })];
}

function parseOptions(value: string | null): MCQOption[] {
  if (!value) return DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));

  try {
    const options = JSON.parse(decodeURIComponent(value));
    return Array.isArray(options) ? options : DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));
  } catch {
    return DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option }));
  }
}

function parseQuestions(value: string | null): MCQQuestion[] {
  if (!value) return [];
  try {
    const questions = JSON.parse(decodeURIComponent(value));
    return Array.isArray(questions) ? questions : [];
  } catch {
    return [];
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
    blockQuestion,
    columns,
    questionNumber,
    shuffleAnswers,
    showInstruction,
    hideInstructionBadge,
  } = node.attrs as MCQAttrs;
  const questions = getMCQQuestions(node.attrs as MCQAttrs);
  const hasBlockQuestion = blockQuestion.trim().length > 0;
  const layoutRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(layoutRef);

  return (
    <CustomBlockRoot selected={selected} className="mcq-node">
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {showInstruction && (
          <BlockInstruction hideBadge={hideInstructionBadge}>
            {instruction || DEFAULT_MCQ_INSTRUCTION}
          </BlockInstruction>
        )}
        {hasBlockQuestion && (
          <BlockQuestion>
            <InlineFormattedText text={blockQuestion} />
          </BlockQuestion>
        )}
        {questions.map((mcqQuestion, questionIndex) => {
          const displayedOptions = shuffleAnswers
            ? shuffledOptions(mcqQuestion.options)
            : mcqQuestion.options;
          return (
            <div className="mcq-node__question" key={mcqQuestion.id}>
              {questions.length > 1 && (
                <p className="mcq-node__question-number">
                  <strong>Frage {questionNumber ?? (questionIndex + 1)}</strong>
                </p>
              )}
              {questions.length === 1 && questionNumber !== null && (
                <p className="mcq-node__question-number">
                  <strong>Frage {questionNumber}</strong>
                </p>
              )}
              <BlockQuestion>
                <InlineFormattedText text={mcqQuestion.question} />
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
          );
        })}
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
      questions: {
        default: [],
        parseHTML: (element) => parseQuestions(element.getAttribute('data-mcq-questions')),
        renderHTML: (attributes) => ({
          'data-mcq-questions': encodeURIComponent(JSON.stringify(attributes.questions)),
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
      questionNumber: {
        default: null,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-mcq-question-number'));
          return Number.isInteger(value) && value > 0 ? value : null;
        },
        renderHTML: (attributes) => (
          attributes.questionNumber === null
            ? {}
            : { 'data-mcq-question-number': attributes.questionNumber }
        ),
      },
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-show-instruction': String(attributes.showInstruction),
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-mcq-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-mcq-hide-instruction-badge': String(
            attributes.hideInstructionBadge,
          ),
        }),
      },
      blockQuestion: {
        default: '',
        parseHTML: (element) => (
          decodeURIComponent(element.getAttribute('data-mcq-block-question') ?? '')
        ),
        renderHTML: (attributes) => ({
          'data-mcq-block-question': encodeURIComponent(attributes.blockQuestion ?? ''),
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

  addProseMirrorPlugins() {
    const buildSplitTransaction = (state: EditorState) => {
      const replacements: Array<{
        from: number;
        questions: MCQQuestion[];
        to: number;
        attrs: MCQAttrs;
      }> = [];

      state.doc.forEach((node, pos) => {
        if (node.type.name !== this.name) return;
        const attrs = node.attrs as MCQAttrs;
        const questions = getMCQQuestions(attrs);
        if (questions.length <= 1) return;
        replacements.push({
          from: pos,
          to: pos + node.nodeSize,
          attrs,
          questions,
        });
      });

      if (!replacements.length) return null;

      const tr = state.tr;
      replacements.reverse().forEach(({ from, to, attrs, questions }) => {
        const nodes = questions.map((question, index) => this.type.create({
          ...attrs,
          question: question.question,
          options: question.options,
          answerMode: question.answerMode,
          questions: [question],
          questionNumber: index + 1,
          showInstruction: index === 0 ? attrs.showInstruction : false,
          blockQuestion: index === 0 ? attrs.blockQuestion : '',
        }));
        tr.replaceWith(from, to, nodes);
      });

      return tr;
    };

    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          return buildSplitTransaction(newState);
        },
        view: (view) => {
          const tr = buildSplitTransaction(view.state);
          if (tr) {
            view.dispatch(tr.setMeta('addToHistory', false));
          }
          return {};
        },
      }),
    ];
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
              blockQuestion: attrs.blockQuestion ?? '',
              questions: attrs.questions ?? (attrs.question !== undefined || attrs.options !== undefined
                ? [createMCQQuestion({
                    question: attrs.question,
                    options: attrs.options,
                    answerMode: attrs.answerMode,
                  })]
                : [createMCQQuestion()]),
              question: attrs.question ?? '',
              options: attrs.options ?? DEFAULT_MCQ_OPTIONS.map((option) => ({ ...option })),
              columns: attrs.columns ?? 1,
              answerMode: attrs.answerMode ?? 'single',
              shuffleAnswers: attrs.shuffleAnswers ?? false,
              questionNumber: attrs.questionNumber ?? null,
              showInstruction: attrs.showInstruction ?? true,
              hideInstructionBadge: attrs.hideInstructionBadge ?? false,
            },
          }),
    };
  },
});
