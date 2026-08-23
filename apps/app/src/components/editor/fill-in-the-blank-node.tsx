"use client";

import {
  Fragment,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';

export type FillInTheBlankAttrs = {
  title: string;
  text: string;
  distractors: string[];
  widthFactor: number;
  hideInstructionBadge: boolean;
  compactSingleLetterBlanks: boolean;
  hideBlankNumbers: boolean;
  hideItemNumbers: boolean;
  showLineNumbers: boolean;
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
  if (!answer) {
    return { answer: payload.trim(), widthFactor: defaultWidthFactor };
  }

  if (!Number.isFinite(parsedFactor) || parsedFactor < 0.25) {
    return { answer, widthFactor: defaultWidthFactor };
  }

  return {
    answer,
    widthFactor: Math.min(Math.max(defaultWidthFactor * parsedFactor, 0.25), 5),
  };
}

export function parseFillInTheBlankText(
  text: string,
  defaultWidthFactor = 1,
): FillInTheBlankPart[] {
  const parts: FillInTheBlankPart[] = [];
  const normalizedDefaultWidthFactor = Number.isFinite(defaultWidthFactor)
    ? Math.min(Math.max(defaultWidthFactor, 0.25), 5)
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

export function shouldAttachBlankToPreviousText(
  parts: FillInTheBlankPart[],
  partIndex: number,
) {
  const previousPart = partIndex > 0 ? parts[partIndex - 1] : null;
  return previousPart?.type === 'text' && /\S$/.test(previousPart.value);
}
const WORD_JOINER = '\u2060';
const openingQuoteBeforeBlankPattern = /[«‹]$/;
const closingQuoteAfterBlankPattern = /^[»›]/;

export function textWithBlankBoundaryJoiners(
  value: string,
  parts: FillInTheBlankPart[],
  partIndex: number,
) {
  let joinedValue = value;
  const previousPart = partIndex > 0 ? parts[partIndex - 1] : null;
  const nextPart = partIndex < parts.length - 1 ? parts[partIndex + 1] : null;

  if (nextPart?.type === 'blank' && openingQuoteBeforeBlankPattern.test(joinedValue)) {
    joinedValue += WORD_JOINER;
  }

  if (previousPart?.type === 'blank' && closingQuoteAfterBlankPattern.test(joinedValue)) {
    joinedValue = `${WORD_JOINER}${joinedValue}`;
  }

  return joinedValue;
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

function stableWordBankOrder(items: Array<{ id: string; text: string }>) {
  const score = (value: string) => Array.from(value).reduce(
    (hash, character) => ((hash * 31) + (character.codePointAt(0) ?? 0)) | 0,
    17,
  );
  return [...items].sort((left, right) => (
    score(`${left.id}:${left.text}`) - score(`${right.id}:${right.text}`)
  ));
}

function FillInTheBlankParts({
  compactSingleLetterBlanks,
  hideBlankNumbers,
  itemNumber,
  parts,
  showFirstAsExample,
}: {
  compactSingleLetterBlanks: boolean;
  hideBlankNumbers: boolean;
  itemNumber?: number;
  parts: FillInTheBlankPart[];
  showFirstAsExample: boolean;
}) {
  const renderText = (value: string) => value
    .split(/(<sup>(?:SINGULAR|PLURAL|FORMELL)<\/sup>)/g)
    .filter(Boolean)
    .map((segment, segmentIndex) => {
      const label = segment.match(/^<sup>(SINGULAR|PLURAL|FORMELL)<\/sup>$/)?.[1];
      return label
        ? <sup key={segmentIndex}>{label}</sup>
        : <Fragment key={segmentIndex}>{segment}</Fragment>;
    });

  const blankCount = parts.filter((part) => part.type === 'blank').length;
  let blankOrdinal = 0;
  return parts.map((part, index) => {
    if (part.type === 'blank') blankOrdinal += 1;
    const isSuffixBlank = part.type === 'blank'
      && shouldAttachBlankToPreviousText(parts, index);
    const blankLabel = itemNumber === undefined
      ? String(part.type === 'blank' ? part.index : 0).padStart(2, '0')
      : `${String(itemNumber).padStart(2, '0')}${
        blankCount > 1 ? String.fromCharCode(96 + blankOrdinal) : ''
      }`;
    return (
    <Fragment key={`${part.type}-${index}`}>
      {part.type === 'text' ? renderText(textWithBlankBoundaryJoiners(part.value, parts, index)) : (
        <span
          aria-label={`Blank ${blankLabel}`}
          className={`fill-in-the-blank-node__blank${
            compactSingleLetterBlanks && isSingleLetterBlankAnswer(part.answer)
              ? ' fill-in-the-blank-node__blank--single-letter'
              : ''
          }${
            isSuffixBlank
              ? ' fill-in-the-blank-node__blank--suffix'
              : ''
          }`}
          data-answer={part.answer}
          data-example={showFirstAsExample && part.index === 1}
          data-first-blank={part.index === 1}
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
            {blankLabel}
          </span>
        </span>
      )}
    </Fragment>
    );
  });
}

function FillInTheBlankNodeView({ node, selected }: NodeViewProps) {
  const {
    title,
    text,
    widthFactor,
    hideInstructionBadge,
    compactSingleLetterBlanks,
    hideBlankNumbers,
    hideItemNumbers,
    showLineNumbers,
    showWordBank,
    showFirstAsExample,
    distractors,
  } = node.attrs as FillInTheBlankAttrs;
  const itemsRef = useRef<HTMLDivElement>(null);
  const [lineNumberMarkers, setLineNumberMarkers] = useState<Array<{
    number: number;
    top: number;
  }>>([]);
  const paragraphs = parseParagraphs(text, widthFactor);
  const hasMultipleParagraphs = paragraphs.length > 1;
  const wordBankItems = paragraphs.flatMap((parts) => (
    parts.flatMap((part) => (
      part.type === 'blank' && part.answer.trim()
        ? [{ id: `blank-${part.index}`, text: part.answer.trim() }]
        : []
    ))
  ));
  const distractorItems = distractors
    .map((text, index) => ({ id: `distractor-${index}`, text: text.trim() }))
    .filter((item) => item.text);
  const orderedWordBankItems = stableWordBankOrder([
    ...wordBankItems,
    ...distractorItems,
  ]);
  const measureLineNumbers = useCallback(() => {
    const items = itemsRef.current;
    if (!items || !hideItemNumbers || !showLineNumbers) {
      setLineNumberMarkers([]);
      return;
    }
    const itemsRect = items.getBoundingClientRect();
    let lineNumber = 0;
    const next: Array<{ number: number; top: number }> = [];

    items.querySelectorAll<HTMLElement>(
      '.fill-in-the-blank-node__text',
    ).forEach((paragraph) => {
      const paragraphStyles = getComputedStyle(paragraph);
      const lineHeight = Number.parseFloat(paragraphStyles.lineHeight);
      const paragraphRect = paragraph.getBoundingClientRect();
      if (!Number.isFinite(lineHeight) || lineHeight <= 0) return;
      const range = document.createRange();
      range.selectNodeContents(paragraph);
      const lineIndexes = Array.from(range.getClientRects()).reduce<number[]>(
        (indexes, rect) => {
          if (!rect.width && !rect.height) return indexes;
          const index = Math.max(
            0,
            Math.round((rect.top - paragraphRect.top) / lineHeight),
          );
          if (!indexes.includes(index)) indexes.push(index);
          return indexes;
        },
        [],
      ).sort((left, right) => left - right);

      lineIndexes.forEach((lineIndex) => {
        lineNumber += 1;
        if (lineNumber !== 1 && lineNumber % 5 !== 0) return;
        next.push({
          number: lineNumber,
          top:
            paragraphRect.top
            - itemsRect.top
            + (lineIndex * lineHeight)
            + (lineHeight / 2),
        });
      });
    });

    setLineNumberMarkers((current) => (
      current.length === next.length
      && current.every((marker, index) => (
        marker.number === next[index].number
        && Math.abs(marker.top - next[index].top) < 0.5
      ))
        ? current
        : next
    ));
  }, [hideItemNumbers, showLineNumbers, text, widthFactor]);

  useLayoutEffect(() => {
    const items = itemsRef.current;
    if (!items || !hideItemNumbers || !showLineNumbers) {
      setLineNumberMarkers([]);
      return;
    }
    let frame = requestAnimationFrame(measureLineNumbers);
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureLineNumbers);
    };
    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(items);
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [hideItemNumbers, measureLineNumbers, showLineNumbers]);

  const finalPairStart = Math.max(0, paragraphs.length - 2);
  const renderParagraph = (parts: FillInTheBlankPart[], paragraphIndex: number) => (
    <div
      className={`fill-in-the-blank-node__item${
        paragraphIndex === 0 ? ' fill-in-the-blank-node__item--first' : ''
      }`}
      key={paragraphIndex}
    >
      {!hideItemNumbers && (
        <span className="custom-block__row-index">
          {String(paragraphIndex + 1).padStart(2, '0')}
        </span>
      )}
      <p className="fill-in-the-blank-node__text">
        <FillInTheBlankParts
          compactSingleLetterBlanks={compactSingleLetterBlanks}
          hideBlankNumbers={hideBlankNumbers}
          itemNumber={paragraphIndex + 1}
          parts={parts}
          showFirstAsExample={showFirstAsExample}
        />
      </p>
    </div>
  );

  return (
    <CustomBlockRoot selected={selected} className="fill-in-the-blank-node">
      <BlockInstruction hideBadge={hideInstructionBadge}>
        {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.fillInTheBlank}
      </BlockInstruction>
      {showWordBank && orderedWordBankItems.length > 0 && (
        <div className="custom-block__word-bank fill-in-the-blank-node__word-bank">
          {orderedWordBankItems.map((item) => (
            <span className="custom-block__word-bank-item" key={item.id}>
              {item.text}
              {showFirstAsExample && item.id === 'blank-1' && (
                <RoughExampleStrike seed={item.id} />
              )}
            </span>
          ))}
        </div>
      )}
      {title.trim() && (
        <p className="fill-in-the-blank-node__title">
          <strong>{title}</strong>
        </p>
      )}
      {hasMultipleParagraphs ? (
        <div
          ref={itemsRef}
          className={`fill-in-the-blank-node__items${
            hideItemNumbers
              ? ' fill-in-the-blank-node__items--unnumbered'
              : ''
          }${
            hideItemNumbers && showLineNumbers
              ? ' fill-in-the-blank-node__items--line-numbered'
              : ''
          }`}
        >
          {lineNumberMarkers.map((marker) => (
            <span
              aria-hidden="true"
              className="fill-in-the-blank-node__line-number"
              key={marker.number}
              style={{ top: marker.top }}
            >
              {String(marker.number).padStart(2, '0')}
            </span>
          ))}
          {paragraphs.slice(0, finalPairStart).map(renderParagraph)}
          <div className="fill-in-the-blank-node__final-pair">
            {paragraphs.slice(finalPairStart).map((parts, offset) => (
              renderParagraph(parts, finalPairStart + offset)
            ))}
          </div>
        </div>
      ) : (
        <p className="fill-in-the-blank-node__text">
          <FillInTheBlankParts
            compactSingleLetterBlanks={compactSingleLetterBlanks}
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
      title: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-title') ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-title': attributes.title,
        }),
      },
      text: {
        default: 'The {{blank:answer}} is the correct word.',
        parseHTML: (element) => element.getAttribute('data-fill-blank-text')
          ?? 'The {{blank:answer}} is the correct word.',
        renderHTML: (attributes) => ({
          'data-fill-blank-text': attributes.text,
        }),
      },
      distractors: {
        default: [],
        parseHTML: (element) => {
          try {
            const value = JSON.parse(
              element.getAttribute('data-fill-blank-distractors') ?? '[]',
            );
            return Array.isArray(value)
              ? value.filter((item): item is string => typeof item === 'string')
              : [];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          'data-fill-blank-distractors': JSON.stringify(attributes.distractors),
        }),
      },
      widthFactor: {
        default: 1,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-fill-blank-width-factor'));
          return Number.isFinite(value) && value >= 0.25 ? Math.min(value, 5) : 1;
        },
        renderHTML: (attributes) => ({
          'data-fill-blank-width-factor': attributes.widthFactor,
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-hide-instruction-badge': String(
            attributes.hideInstructionBadge,
          ),
        }),
      },
      compactSingleLetterBlanks: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-compact-single-letter') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-compact-single-letter': String(
            attributes.compactSingleLetterBlanks,
          ),
        }),
      },
      hideBlankNumbers: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-fill-blank-hide-numbers') === 'true',
        renderHTML: (attributes) => ({
          'data-fill-blank-hide-numbers': String(attributes.hideBlankNumbers),
        }),
      },
      hideItemNumbers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-hide-item-numbers') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-hide-item-numbers': String(
            attributes.hideItemNumbers,
          ),
        }),
      },
      showLineNumbers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-fill-blank-show-line-numbers') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-fill-blank-show-line-numbers': String(
            attributes.showLineNumbers,
          ),
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
              title: attrs.title ?? '',
              text: attrs.text ?? 'The {{blank:answer}} is the correct word.',
              distractors: attrs.distractors ?? [],
              widthFactor: attrs.widthFactor ?? 1,
              hideInstructionBadge: attrs.hideInstructionBadge ?? false,
              compactSingleLetterBlanks: attrs.compactSingleLetterBlanks ?? true,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              hideItemNumbers: attrs.hideItemNumbers ?? false,
              showLineNumbers: attrs.showLineNumbers ?? false,
              showWordBank: attrs.showWordBank ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
