"use client";

import { Fragment } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import type { ErrorCorrectionLanguage } from '@/lib/error-correction-types';

export type ErrorCorrectionError = {
  id: string;
  typeId: string;
  incorrect: string;
  correct: string;
  explanation: string;
  start: number;
  end: number;
};

export type ErrorCorrectionAttrs = {
  instruction: string;
  language: ErrorCorrectionLanguage;
  markup: string;
  incorrectText: string;
  correctText: string;
  errors: ErrorCorrectionError[];
  markErrorPositions: boolean;
  correctionLines: number;
};

export const DEFAULT_ERROR_CORRECTION_INSTRUCTION =
  'Find and correct the errors in the text.';
export const DEFAULT_ERROR_CORRECTION_ERRORS: ErrorCorrectionError[] = [
  {
    id: 'error-correction-1',
    typeId: 'de-number',
    incorrect: 'spielt',
    correct: 'spielen',
    explanation: 'The plural subject requires a plural verb form.',
    start: 11,
    end: 17,
  },
];
export const DEFAULT_ERROR_CORRECTION_INCORRECT =
  'Die Kinder spielt jeden Nachmittag im Park.';
export const DEFAULT_ERROR_CORRECTION_CORRECT =
  'Die Kinder spielen jeden Nachmittag im Park.';
export const DEFAULT_ERROR_CORRECTION_MARKUP =
  'Die Kinder {{error:spielen}}spielt{{/error}} jeden Nachmittag im Park.';

function parseErrors(value: string | null) {
  if (!value) return DEFAULT_ERROR_CORRECTION_ERRORS.map((error) => ({ ...error }));
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) throw new Error('Invalid errors');
    return parsed.flatMap((error, index): ErrorCorrectionError[] => (
      error
      && typeof error.incorrect === 'string'
      && typeof error.correct === 'string'
        ? [{
            id: typeof error.id === 'string'
              ? error.id
              : `error-correction-${index + 1}`,
            typeId: typeof error.typeId === 'string' ? error.typeId : '',
            incorrect: error.incorrect,
            correct: error.correct,
            explanation: typeof error.explanation === 'string'
              ? error.explanation
              : '',
            start: Number.isFinite(Number(error.start)) ? Number(error.start) : -1,
            end: Number.isFinite(Number(error.end)) ? Number(error.end) : -1,
          }]
        : []
    ));
  } catch {
    return DEFAULT_ERROR_CORRECTION_ERRORS.map((error) => ({ ...error }));
  }
}

function errorRanges(text: string, errors: ErrorCorrectionError[]) {
  let searchFrom = 0;
  return errors.flatMap((error) => {
    const storedStart = Math.max(0, error.start);
    const hasValidStoredRange = error.end > storedStart
      && text.slice(storedStart, error.end) === error.incorrect;
    const start = hasValidStoredRange
      ? storedStart
      : text.indexOf(error.incorrect, searchFrom);
    if (start < 0 || !error.incorrect) return [];
    const end = start + error.incorrect.length;
    searchFrom = end;
    return [{ error, start, end }];
  }).sort((left, right) => left.start - right.start);
}

export function createErrorCorrectionMarkup(
  incorrectText: string,
  errors: ErrorCorrectionError[],
) {
  const ranges = errorRanges(incorrectText, errors);
  let cursor = 0;
  return ranges.map(({ error, start, end }) => {
    const before = incorrectText.slice(cursor, start);
    cursor = end;
    return `${before}{{error:${error.correct}}}${
      incorrectText.slice(start, end)
    }{{/error}}`;
  }).join('') + incorrectText.slice(cursor);
}

export function parseErrorCorrectionMarkup(
  markup: string,
  metadata: ErrorCorrectionError[] = [],
) {
  const pattern = /\{\{error:([^{}]+)\}\}([\s\S]*?)\{\{\/error\}\}/g;
  let sourceCursor = 0;
  let incorrectText = '';
  let correctText = '';
  const errors: ErrorCorrectionError[] = [];
  let match = pattern.exec(markup);
  while (match) {
    const before = markup.slice(sourceCursor, match.index);
    const correct = match[1];
    const incorrect = match[2];
    incorrectText += before;
    correctText += before;
    const start = incorrectText.length;
    incorrectText += incorrect;
    correctText += correct;
    const existing = metadata[errors.length];
    errors.push({
      id: existing?.id ?? `error-correction-${errors.length + 1}`,
      typeId: existing?.typeId ?? '',
      incorrect,
      correct,
      explanation: existing?.explanation ?? '',
      start,
      end: start + incorrect.length,
    });
    sourceCursor = match.index + match[0].length;
    match = pattern.exec(markup);
  }
  const remainder = markup.slice(sourceCursor);
  incorrectText += remainder;
  correctText += remainder;
  return { incorrectText, correctText, errors };
}

function AnnotatedText({
  errors,
  markErrorPositions,
  text,
}: {
  errors: ErrorCorrectionError[];
  markErrorPositions: boolean;
  text: string;
}) {
  const ranges = errorRanges(text, errors);
  let cursor = 0;
  const content = ranges.flatMap(({ error, start, end }, index) => {
    if (start < cursor) return [];
    const before = text.slice(cursor, start);
    cursor = end;
    return [
      before,
      <span
        className="error-correction-node__error"
        data-marked={markErrorPositions}
        key={`${error.id}-${index}`}
      >
        {text.slice(start, end)}
      </span>,
    ];
  });
  content.push(text.slice(cursor));
  return content.map((part, index) => (
    <Fragment key={typeof part === 'string' ? `text-${index}` : part.key}>
      {part}
    </Fragment>
  ));
}

function ErrorCorrectionNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as ErrorCorrectionAttrs;
  const parsed = parseErrorCorrectionMarkup(
    attrs.markup || createErrorCorrectionMarkup(
      attrs.incorrectText,
      attrs.errors,
    ),
    attrs.errors,
  );
  return (
    <CustomBlockRoot selected={selected} className="error-correction-node">
      <BlockInstruction>
        {attrs.instruction || DEFAULT_ERROR_CORRECTION_INSTRUCTION}
      </BlockInstruction>
      <div className="error-correction-node__text">
        <AnnotatedText
          errors={parsed.errors}
          markErrorPositions={attrs.markErrorPositions}
          text={parsed.incorrectText}
        />
      </div>
      {attrs.correctionLines > 0 && (
        <div
          aria-label="Correction space"
          className="error-correction-node__lines"
          style={{ '--error-correction-lines': attrs.correctionLines } as React.CSSProperties}
        />
      )}
      <div className="error-correction-node__solution">
        <h4>Corrections</h4>
        <ol>
          {parsed.errors.map((error, index) => (
            <li key={error.id}>
              <span>{index + 1}.</span>
              <del>{error.incorrect}</del>
              <span aria-hidden="true">→</span>
              <strong>{error.correct}</strong>
              {error.explanation && <small>{error.explanation}</small>}
            </li>
          ))}
        </ol>
        <p>{parsed.correctText}</p>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    errorCorrection: {
      insertErrorCorrection: (
        attrs?: Partial<ErrorCorrectionAttrs>,
      ) => ReturnType;
    };
  }
}

export const ErrorCorrection = Node.create({
  name: 'errorCorrection',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_ERROR_CORRECTION_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-error-correction-instruction')
          ?? DEFAULT_ERROR_CORRECTION_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-instruction': attributes.instruction,
        }),
      },
      language: {
        default: 'german',
        parseHTML: (element) => (
          element.getAttribute('data-error-correction-language') === 'english'
            ? 'english'
            : 'german'
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-language': attributes.language,
        }),
      },
      markup: {
        default: DEFAULT_ERROR_CORRECTION_MARKUP,
        parseHTML: (element) => {
          const stored = element.getAttribute('data-error-correction-markup');
          if (stored) return decodeURIComponent(stored);
          const incorrectText = element.getAttribute(
            'data-error-correction-incorrect',
          ) ?? DEFAULT_ERROR_CORRECTION_INCORRECT;
          const errors = parseErrors(
            element.getAttribute('data-error-correction-errors'),
          );
          return createErrorCorrectionMarkup(incorrectText, errors);
        },
        renderHTML: (attributes) => ({
          'data-error-correction-markup': encodeURIComponent(attributes.markup),
        }),
      },
      incorrectText: {
        default: DEFAULT_ERROR_CORRECTION_INCORRECT,
        parseHTML: (element) => (
          element.getAttribute('data-error-correction-incorrect')
          ?? DEFAULT_ERROR_CORRECTION_INCORRECT
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-incorrect': attributes.incorrectText,
        }),
      },
      correctText: {
        default: DEFAULT_ERROR_CORRECTION_CORRECT,
        parseHTML: (element) => (
          element.getAttribute('data-error-correction-correct')
          ?? DEFAULT_ERROR_CORRECTION_CORRECT
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-correct': attributes.correctText,
        }),
      },
      errors: {
        default: DEFAULT_ERROR_CORRECTION_ERRORS,
        parseHTML: (element) => parseErrors(
          element.getAttribute('data-error-correction-errors'),
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-errors': encodeURIComponent(
            JSON.stringify(attributes.errors),
          ),
        }),
      },
      markErrorPositions: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-error-correction-mark-errors') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-error-correction-mark-errors': String(
            attributes.markErrorPositions,
          ),
        }),
      },
      correctionLines: {
        default: 2,
        parseHTML: (element) => Math.min(8, Math.max(0, Number(
          element.getAttribute('data-error-correction-lines') ?? 2,
        ))),
        renderHTML: (attributes) => ({
          'data-error-correction-lines': attributes.correctionLines,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="error-correction"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'error-correction' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ErrorCorrectionNodeView);
  },

  addCommands() {
    return {
      insertErrorCorrection:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction
              ?? DEFAULT_ERROR_CORRECTION_INSTRUCTION,
            language: attrs.language ?? 'german',
            markup: attrs.markup ?? createErrorCorrectionMarkup(
              attrs.incorrectText ?? DEFAULT_ERROR_CORRECTION_INCORRECT,
              attrs.errors ?? DEFAULT_ERROR_CORRECTION_ERRORS,
            ),
            incorrectText: attrs.incorrectText
              ?? DEFAULT_ERROR_CORRECTION_INCORRECT,
            correctText: attrs.correctText ?? DEFAULT_ERROR_CORRECTION_CORRECT,
            errors: attrs.errors
              ?? DEFAULT_ERROR_CORRECTION_ERRORS.map((error) => ({ ...error })),
            markErrorPositions: attrs.markErrorPositions ?? true,
            correctionLines: attrs.correctionLines ?? 2,
          },
        }),
    };
  },
});
