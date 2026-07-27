"use client";

import { Fragment, type CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';

export type FillInTheBlankAttrs = {
  text: string;
  widthFactor: number;
  hideBlankNumbers: boolean;
  showWordBank: boolean;
  showFirstAsExample: boolean;
};

export type FillInTheBlankPart =
  | { type: 'text'; value: string }
  | { type: 'blank'; answer: string; index: number; widthFactor: number };

function parseBlankPayload(payload: string, defaultWidthFactor: number) {
  const separatorIndex = payload.lastIndexOf('|');
  if (separatorIndex === -1) {
    return { answer: payload.trim(), widthFactor: defaultWidthFactor };
  }

  const answer = payload.slice(0, separatorIndex).trim();
  const parsedFactor = Number(payload.slice(separatorIndex + 1).trim());
  if (!answer || !Number.isFinite(parsedFactor) || parsedFactor < 1) {
    return { answer: payload.trim(), widthFactor: defaultWidthFactor };
  }

  return {
    answer,
    widthFactor: Math.min(parsedFactor, 5),
  };
}

export function parseFillInTheBlankText(
  text: string,
  defaultWidthFactor = 1,
): FillInTheBlankPart[] {
  const parts: FillInTheBlankPart[] = [];
  const normalizedDefaultWidthFactor = Number.isFinite(defaultWidthFactor)
    ? Math.min(Math.max(defaultWidthFactor, 1), 5)
    : 1;
  const pattern = /\{\{blank:([^{}]+)\}\}/gi;
  let cursor = 0;
  let blankIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    const matchIndex = match.index;
    if (matchIndex > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, matchIndex) });
    }
    blankIndex += 1;
    const blank = parseBlankPayload(match[1], normalizedDefaultWidthFactor);
    parts.push({
      type: 'blank',
      answer: blank.answer,
      index: blankIndex,
      widthFactor: blank.widthFactor,
    });
    cursor = matchIndex + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) });
  }

  return parts.length ? parts : [{ type: 'text', value: text }];
}

export function isSingleLetterBlankAnswer(answer: string) {
  const characters = Array.from(answer.trim());
  return characters.length === 1
    && characters[0].toLocaleLowerCase() !== characters[0].toLocaleUpperCase();
}

function parseParagraphs(text: string, defaultWidthFactor: number) {
  let blankOffset = 0;

  return text
    .split(/\r?\n/)
    .filter((paragraph) => paragraph.trim().length > 0)
    .map((paragraph) => {
      const parts = parseFillInTheBlankText(paragraph, defaultWidthFactor)
        .map((part) => (
          part.type === 'blank'
            ? { ...part, index: part.index + blankOffset }
            : part
        ));
      blankOffset += parts.filter((part) => part.type === 'blank').length;
      return parts;
    });
}

function FillInTheBlankParts({
  hideBlankNumbers,
  parts,
  showFirstAsExample,
}: {
  hideBlankNumbers: boolean;
  parts: FillInTheBlankPart[];
  showFirstAsExample: boolean;
}) {
  return parts.map((part, index) => (
    <Fragment key={`${part.type}-${index}`}>
      {part.type === 'text' ? part.value : (
        <span
          aria-label={`Blank ${part.index}`}
          className={`fill-in-the-blank-node__blank${
            isSingleLetterBlankAnswer(part.answer)
              ? ' fill-in-the-blank-node__blank--single-letter'
              : ''
          }`}
          data-answer={part.answer}
          data-example={showFirstAsExample && part.index === 1}
          data-show-number={!hideBlankNumbers}
          style={{
            '--fill-blank-width-factor': part.widthFactor,
          } as CSSProperties}
        >
          <span
            aria-hidden="true"
            className="custom-block__compact-label fill-in-the-blank-node__blank-number"
            style={{ visibility: hideBlankNumbers ? 'hidden' : 'visible' }}
          >
            {String(part.index).padStart(2, '0')}
          </span>
        </span>
      )}
    </Fragment>
  ));
}

function FillInTheBlankNodeView({ node, selected }: NodeViewProps) {
  const {
    text,
    widthFactor,
    hideBlankNumbers,
    showWordBank,
    showFirstAsExample,
  } = node.attrs as FillInTheBlankAttrs;
  const paragraphs = parseParagraphs(text, widthFactor);
  const hasMultipleParagraphs = paragraphs.length > 1;
  const wordBankItems = paragraphs.flatMap((parts) => (
    parts.flatMap((part) => (
      part.type === 'blank' && part.answer.trim()
        ? [{ id: `blank-${part.index}`, text: part.answer.trim() }]
        : []
    ))
  ));

  return (
    <CustomBlockRoot selected={selected} className="fill-in-the-blank-node">
      <BlockInstruction>Fill in the blanks with the correct words.</BlockInstruction>
      {showWordBank && wordBankItems.length > 0 && (
        <div className="custom-block__word-bank fill-in-the-blank-node__word-bank">
          {wordBankItems.map((item) => (
            <span className="custom-block__word-bank-item" key={item.id}>
              {item.text}
              {showFirstAsExample && item.id === 'blank-1' && (
                <RoughExampleStrike seed={item.id} />
              )}
            </span>
          ))}
        </div>
      )}
      {hasMultipleParagraphs ? (
        <div className="fill-in-the-blank-node__items">
          {paragraphs.map((parts, paragraphIndex) => (
            <div className="fill-in-the-blank-node__item" key={paragraphIndex}>
              <span className="custom-block__row-index">
                {String(paragraphIndex + 1).padStart(2, '0')}
              </span>
              <p className="fill-in-the-blank-node__text">
                <FillInTheBlankParts
                  hideBlankNumbers={hideBlankNumbers}
                  parts={parts}
                  showFirstAsExample={showFirstAsExample}
                />
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="fill-in-the-blank-node__text">
          <FillInTheBlankParts
            hideBlankNumbers={hideBlankNumbers}
            parts={paragraphs[0] ?? []}
            showFirstAsExample={showFirstAsExample}
          />
        </p>
      )}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fillInTheBlank: {
      insertFillInTheBlank: (attrs?: Partial<FillInTheBlankAttrs>) => ReturnType;
    };
  }
}

export const FillInTheBlank = Node.create({
  name: 'fillInTheBlank',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      text: {
        default: 'The {{blank:answer}} is the correct word.',
        parseHTML: (element) => element.getAttribute('data-fill-blank-text')
          ?? 'The {{blank:answer}} is the correct word.',
        renderHTML: (attributes) => ({
          'data-fill-blank-text': attributes.text,
        }),
      },
      widthFactor: {
        default: 1,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-fill-blank-width-factor'));
          return Number.isFinite(value) && value >= 1 ? Math.min(value, 5) : 1;
        },
        renderHTML: (attributes) => ({
          'data-fill-blank-width-factor': attributes.widthFactor,
        }),
      },
      hideBlankNumbers: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-fill-blank-hide-numbers') === 'true',
        renderHTML: (attributes) => ({
          'data-fill-blank-hide-numbers': String(attributes.hideBlankNumbers),
        }),
      },
      showWordBank: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-show-word-bank') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-show-word-bank': String(attributes.showWordBank),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="fill-in-the-blank"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'fill-in-the-blank' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FillInTheBlankNodeView);
  },

  addCommands() {
    return {
      insertFillInTheBlank:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              text: attrs.text ?? 'The {{blank:answer}} is the correct word.',
              widthFactor: attrs.widthFactor ?? 1,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              showWordBank: attrs.showWordBank ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
