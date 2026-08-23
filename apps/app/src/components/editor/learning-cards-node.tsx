"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode, NodeType } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { htmlToInlineFormatting } from '@/components/editor/custom-blocks/inline-formatting';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { getEditorPageAreas } from '@/components/editor/page-layout';
import {
  isSingleLetterBlankAnswer,
  shouldAttachBlankToPreviousText,
  textWithBlankBoundaryJoiners,
} from '@/components/editor/fill-in-the-blank-node';

export type LearningCardItem = {
  id: string;
  front: string;
  back: string;
};

export type LearningCardTextSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export type LearningCardsAttrs = {
  title: string;
  format: 'a8-landscape';
  sidedness: 'single' | 'double' | 'single-solution';
  compactSingleLetterBlanks: boolean;
  blankWidthFactor: number;
  items: LearningCardItem[];
  frontTextSize: LearningCardTextSize;
  backTextSize: LearningCardTextSize;
  groupIndex: number;
  sheetSide: 'front' | 'back' | 'solutions';
  solutionSheetIndex: number;
  solutionSheetCount: number;
  solutionStartIndex: number;
  solutionEndIndex: number;
};

const CARDS_PER_GROUP = 9;
// The source grid is rotated 90° clockwise on the page. A physical short-edge
// flip therefore maps to reversing the source columns while preserving rows.
const SHORT_EDGE_BACK_ORDER = [2, 1, 0, 5, 4, 3, 8, 7, 6];

export const DEFAULT_LEARNING_CARD_ITEMS: LearningCardItem[] = Array.from(
  { length: CARDS_PER_GROUP },
  (_, index) => ({
    id: `learning-card-${index + 1}`,
    front: '',
    back: '',
  }),
);

export const DEFAULT_LEARNING_CARDS_ATTRS: LearningCardsAttrs = {
  title: 'Learning cards',
  format: 'a8-landscape',
  sidedness: 'double',
  compactSingleLetterBlanks: true,
  blankWidthFactor: 1,
  items: DEFAULT_LEARNING_CARD_ITEMS,
  frontTextSize: 'm',
  backTextSize: 'm',
  groupIndex: 0,
  sheetSide: 'front',
  solutionSheetIndex: 0,
  solutionSheetCount: 1,
  solutionStartIndex: 0,
  solutionEndIndex: 0,
};

function parseItems(value: string | null): LearningCardItem[] {
  if (!value) return DEFAULT_LEARNING_CARD_ITEMS.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) throw new Error('Invalid learning-card items');
    const items = parsed.flatMap((item, index): LearningCardItem[] => (
      item && typeof item === 'object'
        ? [{
          id: typeof item.id === 'string' ? item.id : `learning-card-${index + 1}`,
          front: typeof item.front === 'string' ? item.front : '',
          back: typeof item.back === 'string' ? item.back : '',
        }]
        : []
    ));
    return items.length ? items : DEFAULT_LEARNING_CARD_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_LEARNING_CARD_ITEMS.map((item) => ({ ...item }));
  }
}

type LearningCardBlankPart =
  | { type: 'text'; value: string }
  | { type: 'blank'; answer: string; index: number; widthFactor: number };

function parseLearningCardBlankPayload(payload: string, defaultWidthFactor = 1) {
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

function parseLearningCardBlanks(
  text: string,
  defaultWidthFactor = 1,
): LearningCardBlankPart[] {
  const parts: LearningCardBlankPart[] = [];
  const normalizedDefaultWidthFactor = Number.isFinite(defaultWidthFactor)
    ? Math.min(Math.max(defaultWidthFactor, 0.25), 5)
    : 1;
  const pattern = /\{\{blank:([^{}]+)\}\}/gi;
  let cursor = 0;
  let blankIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, match.index) });
    }
    blankIndex += 1;
    const blank = parseLearningCardBlankPayload(match[1], normalizedDefaultWidthFactor);
    parts.push({
      type: 'blank',
      answer: blank.answer,
      index: blankIndex,
      widthFactor: blank.widthFactor,
    });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) });
  }

  return parts.length ? parts : [{ type: 'text', value: text }];
}

function bracketHighlightsToInlineMarkup(value: string) {
  return value.replace(
    /(?<!\[)\[([^\[\]\r\n]+)\](?!\])/g,
    '[[verb-exception]]$1[[/verb-exception]]',
  );
}

function groupsOfNine(items: LearningCardItem[]) {
  const safeItems = items.length ? items : DEFAULT_LEARNING_CARD_ITEMS;
  return Array.from(
    { length: Math.ceil(safeItems.length / CARDS_PER_GROUP) },
    (_, index) => safeItems.slice(index * CARDS_PER_GROUP, (index + 1) * CARDS_PER_GROUP),
  );
}

type SolutionRange = { start: number; end: number };

/**
 * Pack solution items into page-sized ranges from their actual measured
 * heights (in px). `pageZeroHeight` is the usable height on the first sheet
 * (which also carries the title); `pageHeight` applies to continuation
 * sheets. An item taller than a page is placed alone to avoid an infinite
 * split.
 */
function packSolutionRanges(
  heights: number[],
  pageZeroHeight: number,
  pageHeight: number,
): SolutionRange[] {
  if (!heights.length) return [{ start: 0, end: 0 }];
  const ranges: SolutionRange[] = [];
  let start = 0;
  let used = 0;
  let capacity = pageZeroHeight;
  for (let index = 0; index < heights.length; index += 1) {
    const height = heights[index];
    if (index > start && used + height > capacity) {
      ranges.push({ start, end: index });
      start = index;
      used = 0;
      capacity = pageHeight;
    }
    used += height;
  }
  ranges.push({ start, end: heights.length });
  return ranges;
}

function rangesEqual(a: SolutionRange[], b: SolutionRange[]) {
  if (a.length !== b.length) return false;
  return a.every((range, index) => (
    range.start === b[index].start && range.end === b[index].end
  ));
}

function isFirstSolutionSheetNode(node: ProseMirrorNode) {
  if (node.type.name !== 'learningCards') return false;
  const attrs = node.attrs as LearningCardsAttrs;
  return attrs.sheetSide === 'solutions' && attrs.solutionSheetIndex === 0;
}

/**
 * Join sheets with page breaks. The break before the first solution sheet
 * restarts page numbering so the solution key is numbered as its own section.
 */
function joinSheetsWithBreaks(
  sheets: ProseMirrorNode[],
  pageBreakType: NodeType | undefined,
) {
  return sheets.flatMap((sheet, index) => {
    if (index >= sheets.length - 1 || !pageBreakType) return [sheet];
    const restartPagination = isFirstSolutionSheetNode(sheets[index + 1]);
    return [sheet, pageBreakType.create({ restartPagination })];
  });
}

/**
 * Rebuild the solution sheets to match measured page ranges, preserving the
 * front/back card sheets untouched. No-ops when the document already matches,
 * which keeps this convergent and loop-safe.
 */
function applyMeasuredSolutionRanges(editor: Editor, ranges: SolutionRange[]) {
  const { doc, schema } = editor.state;
  const cardType = schema.nodes.learningCards;
  const pageBreakType = schema.nodes.pageBreak;
  if (!cardType) return;

  const cardSheets: ProseMirrorNode[] = [];
  const currentRanges: SolutionRange[] = [];
  let baseAttrs: LearningCardsAttrs | null = null;
  let containsForeignNode = false;

  for (let index = 0; index < doc.childCount; index += 1) {
    const child = doc.child(index);
    if (child.type.name === 'learningCards') {
      const childAttrs = child.attrs as LearningCardsAttrs;
      if (childAttrs.sheetSide === 'solutions') {
        if (!baseAttrs) baseAttrs = childAttrs;
        const hasExplicitRange = childAttrs.solutionEndIndex > childAttrs.solutionStartIndex;
        currentRanges.push(hasExplicitRange
          ? { start: childAttrs.solutionStartIndex, end: childAttrs.solutionEndIndex }
          : { start: 0, end: childAttrs.items.length });
      } else {
        cardSheets.push(child);
      }
    } else if (child.type.name !== 'pageBreak') {
      containsForeignNode = true;
    }
  }

  if (containsForeignNode || !baseAttrs) return;
  if (rangesEqual(currentRanges, ranges)) return;

  const groups = groupsOfNine(baseAttrs.items);
  const solutionSheets = ranges.map((range, index) => cardType.create({
    ...baseAttrs,
    groupIndex: groups.length + index,
    sheetSide: 'solutions',
    solutionSheetIndex: index,
    solutionSheetCount: ranges.length,
    solutionStartIndex: range.start,
    solutionEndIndex: range.end,
  }));

  const sheets = [...cardSheets, ...solutionSheets];
  const outputNodes = joinSheetsWithBreaks(sheets, pageBreakType);

  const tr = editor.state.tr
    .replaceWith(0, editor.state.doc.content.size, outputNodes)
    .setMeta('addToHistory', false);
  editor.view.dispatch(tr);
}

function LearningCardsGrid({
  back,
  blankWidthFactor,
  compactSingleLetterBlanks,
  textSize,
  items,
  cardOffset,
  showCardNumbers,
}: {
  back: boolean;
  blankWidthFactor: number;
  compactSingleLetterBlanks: boolean;
  textSize: LearningCardTextSize;
  items: LearningCardItem[];
  cardOffset: number;
  showCardNumbers: boolean;
}) {
  const cells = Array.from({ length: CARDS_PER_GROUP }, (_, index) => items[index] ?? null);
  const ordered = back ? SHORT_EDGE_BACK_ORDER.map((index) => cells[index]) : cells;
  return (
    <div className="learning-cards-node__rotated-grid" data-side={back ? 'back' : 'front'}>
      {ordered.map((item, index) => {
        const globalIndex = cardOffset + index + 1;
        return (
          <div
            className={[
              'learning-cards-node__card',
              showCardNumbers ? 'learning-cards-node__card--solution-key' : '',
            ].filter(Boolean).join(' ')}
            data-solution-key={showCardNumbers ? 'true' : 'false'}
            key={item?.id ?? `empty-${index}`}
          >
            {showCardNumbers && item ? (
              <span className="custom-block__row-index learning-cards-node__solution-badge learning-cards-node__number">{String(globalIndex).padStart(2, '0')}</span>
            ) : null}
            {item ? (
              <LearningCardContent
                blankWidthFactor={blankWidthFactor}
                compactSingleLetterBlanks={compactSingleLetterBlanks}
                fallback={item.id.endsWith('-empty')
                  ? undefined
                  : `Card ${globalIndex}`}
                textSize={textSize}
                text={back ? item.back : item.front}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function renderLearningCardSolution(item: LearningCardItem, index: number) {
  const rawValue = htmlToInlineFormatting(item.back || '');
  const match = /\[\[card-answer\]\]([\s\S]*?)\[\[\/card-answer\]\]/.exec(rawValue);
  const answer = match?.[1]?.trim() ?? null;
  const prefix = match
    ? rawValue.slice(0, match.index).replace(/^\n+|\n+$/g, '').trim()
    : rawValue.replace(/^\n+|\n+$/g, '').trim();
  const prefixParts = parseLearningCardBlanks(prefix);

  const renderPart = (part: LearningCardBlankPart, key: string) => (
    part.type === 'text'
      ? <InlineFormattedText key={key} text={bracketHighlightsToInlineMarkup(part.value)} />
      : (
        <InlineFormattedText
          key={key}
          text={`[[verb-exception]]${part.answer}[[/verb-exception]]`}
        />
      )
  );

  return (
    <li className="learning-cards-node__solution-key-item" key={item.id ?? `solution-${index}`}>
      <span className="custom-block__row-index learning-cards-node__solution-badge">
        <span className="custom-block__compact-label">{String(index + 1).padStart(2, '0')}</span>
      </span>
      <span className="learning-cards-node__solution-key-text">
        {answer
          ? (
            <>
              {prefixParts.map((part, partIndex) => renderPart(part, `prefix-${partIndex}`))}
              <InlineFormattedText
                text={`[[verb-exception]]${bracketHighlightsToInlineMarkup(answer)}[[/verb-exception]]`}
              />
            </>
          )
          : parseLearningCardBlanks(prefix || rawValue)
            .map((part, partIndex) => renderPart(part, `solution-${partIndex}`))}
      </span>
    </li>
  );
}

export function LearningCardContent({
  blankWidthFactor = 1,
  compactSingleLetterBlanks = true,
  fallback,
  textSize = 'm',
  text,
}: {
  blankWidthFactor?: number;
  compactSingleLetterBlanks?: boolean;
  fallback?: string;
  textSize?: LearningCardTextSize;
  text: string;
}) {
  const value = htmlToInlineFormatting(text || fallback || '');
  const match = /\[\[card-answer\]\]([\s\S]*?)\[\[\/card-answer\]\]/.exec(value);
  const answer = match?.[1] ?? null;
  const body = match
    ? `${value.slice(0, match.index)}${value.slice(match.index + match[0].length)}`
      .replace(/^\n+|\n+$/g, '')
    : value;
  const parts = parseLearningCardBlanks(body, blankWidthFactor);

  let blankIndex = 0;
  return (
    <div className={`learning-cards-node__content learning-cards-node__content--text-${textSize}`}>
      <div className="learning-cards-node__body">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return (
              <InlineFormattedText
                key={`text-${index}`}
                text={textWithBlankBoundaryJoiners(part.value, parts, index)}
              />
            );
          }

          blankIndex += 1;
          return (
            <span
              aria-label={`Blank ${String(blankIndex).padStart(2, '0')}`}
              className={`fill-in-the-blank-node__blank${
                compactSingleLetterBlanks
                  && isSingleLetterBlankAnswer(part.answer)
                  ? ' fill-in-the-blank-node__blank--single-letter'
                  : ''
              }${
                shouldAttachBlankToPreviousText(parts, index)
                  ? ' fill-in-the-blank-node__blank--suffix'
                  : ''
              }`}
              data-answer={part.answer}
              key={`blank-${index}`}
              role="img"
              style={{
                '--fill-blank-width-factor': part.widthFactor,
              } as CSSProperties}
            />
          );
        })}
      </div>
      {answer !== null && (
        <div className="learning-cards-node__answer">
          <InlineFormattedText text={answer} />
        </div>
      )}
    </div>
  );
}

function LearningCardsNodeView({ node, editor, selected }: NodeViewProps) {
  const attrs = node.attrs as LearningCardsAttrs;
  const groups = groupsOfNine(attrs.items);
  const items = groups[attrs.groupIndex] ?? [];
  const back = attrs.sheetSide === 'back';
  const textSize = back ? attrs.backTextSize : attrs.frontTextSize;
  const isSolutionsSheet = attrs.sheetSide === 'solutions';
  const isFirstSolutionSheet = isSolutionsSheet && attrs.solutionSheetIndex === 0;
  const hasExplicitRange = attrs.solutionEndIndex > attrs.solutionStartIndex;
  const solutionStart = hasExplicitRange ? attrs.solutionStartIndex : 0;
  const solutionEnd = hasExplicitRange ? attrs.solutionEndIndex : attrs.items.length;
  const solutionItems = attrs.items.slice(solutionStart, solutionEnd);

  const sheetRef = useRef<HTMLElement | null>(null);
  const solutionKeyRef = useRef<HTMLDivElement | null>(null);
  const realListRef = useRef<HTMLOListElement | null>(null);
  const measureListRef = useRef<HTMLOListElement | null>(null);

  // Solution splitting is measurement-driven: the first solution sheet renders
  // every item in a hidden probe list, reads each row's real rendered height,
  // and packs page-sized ranges. Items wrap to different heights, so no fixed
  // per-page count can be correct — only measured heights are reliable.
  const measurementSignature = isFirstSolutionSheet
    ? attrs.items.map((item) => item.back).join('\u0001')
    : '';

  useLayoutEffect(() => {
    if (!isFirstSolutionSheet) return undefined;
    const sheetEl = sheetRef.current;
    const solutionKeyEl = solutionKeyRef.current;
    const measureList = measureListRef.current;
    if (!sheetEl || !solutionKeyEl || !measureList) return undefined;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      const rows = Array.from(measureList.children) as HTMLElement[];
      // Measure every box with getBoundingClientRect so all values share the
      // same coordinate space. If the editor is zoomed, the transform scales
      // the sheet and the rows by the same factor, so their ratio (and thus
      // the packing) stays correct. Rect heights are also fractional, which
      // avoids the per-row rounding that offsetHeight accumulates into a
      // conservative (too-small) capacity.
      const sheetRect = sheetEl.getBoundingClientRect();
      const heights = rows.map((row) => row.getBoundingClientRect().height);

      // Real per-page content capacity: a card sheet is a stable 222 mm atom
      // that always fits one page, so the distance from its top (= the page
      // content top) to its page footer (= the page content bottom) is the true
      // printable body height the Pages extension grants per page — measured in
      // the same scaled units as the rows. This avoids hard-coding a height and
      // can't overshoot the real page limit (which fragments the pagination).
      const editorRoot = sheetEl.closest('.tiptap') as HTMLElement | null;
      let capacity = sheetRect.height;
      if (editorRoot) {
        const cardSheet = editorRoot.querySelector(
          'section.learning-cards-node__sheet[data-solution-key="false"]',
        );
        if (cardSheet) {
          const cardTop = cardSheet.getBoundingClientRect().top;
          const pageAreas = getEditorPageAreas(editorRoot);
          let nearest = Infinity;
          for (const area of pageAreas) {
            const gap = area.bottom - cardTop;
            if (gap > 0 && gap < nearest) nearest = gap;
          }
          if (Number.isFinite(nearest) && nearest > capacity) {
            capacity = nearest;
          }
        }
      }

      // Keep each packed atom just under the measured limit so it never spills
      // onto a second page.
      const SAFETY_PX = 6;
      const pageHeight = Math.max(1, capacity - SAFETY_PX);

      // The first page also carries the title. Measure the space it consumes
      // geometrically as the gap between the sheet top and the real list top
      // (title height + its margins) in the same scaled units as everything
      // else, rather than reading unscaled computed-style margins.
      const realList = realListRef.current;
      const titleBlock = realList
        ? Math.max(0, realList.getBoundingClientRect().top - sheetRect.top)
        : 0;
      const pageZeroHeight = Math.max(1, pageHeight - titleBlock);
      const ranges = packSolutionRanges(heights, pageZeroHeight, pageHeight);
      const enqueue = typeof queueMicrotask === 'function'
        ? queueMicrotask
        : (callback: () => void) => {
          void Promise.resolve().then(callback);
        };
      enqueue(() => {
        if (cancelled || editor.isDestroyed) return;
        applyMeasuredSolutionRanges(editor, ranges);
      });
    };

    measure();
    if (typeof document !== 'undefined' && document.fonts?.status !== 'loaded') {
      document.fonts.ready.then(() => measure()).catch(() => undefined);
    }

    return () => {
      cancelled = true;
    };
  }, [editor, isFirstSolutionSheet, measurementSignature]);

  return (
    <CustomBlockRoot selected={selected} className="learning-cards-node">
      <section
        ref={sheetRef}
        className="learning-cards-node__sheet"
        data-side={attrs.sheetSide}
        data-solution-key={isSolutionsSheet ? 'true' : 'false'}
      >
        {attrs.groupIndex === 0 && !back && !isSolutionsSheet && (
          <h1 className="learning-cards-node__title">{attrs.title}</h1>
        )}
        {isSolutionsSheet ? (
          <div
            ref={solutionKeyRef}
            className={[
              'learning-cards-node__solution-key',
              attrs.solutionSheetIndex > 0
                ? 'learning-cards-node__solution-key--continuation'
                : '',
            ].filter(Boolean).join(' ')}
          >
            {attrs.solutionSheetIndex === 0 ? (
              <h1
                className="learning-cards-node__title learning-cards-node__solution-key-title"
              >
                {attrs.title} – Lösungen
              </h1>
            ) : null}
            <ol ref={realListRef} className="learning-cards-node__solution-key-list">
              {solutionItems.map((item, index) => (
                renderLearningCardSolution(item, solutionStart + index)
              ))}
            </ol>
            {isFirstSolutionSheet ? (
              <ol
                aria-hidden="true"
                className="learning-cards-node__solution-key-list learning-cards-node__solution-key-list--measure"
                ref={measureListRef}
              >
                {attrs.items.map((item, index) => (
                  renderLearningCardSolution(item, index)
                ))}
              </ol>
            ) : null}
          </div>
        ) : (
          <LearningCardsGrid
            back={back}
            blankWidthFactor={attrs.blankWidthFactor}
            cardOffset={attrs.groupIndex * 9}
            compactSingleLetterBlanks={attrs.compactSingleLetterBlanks}
            items={items}
            showCardNumbers={attrs.sidedness === 'single-solution' && !back}
            textSize={textSize}
          />
        )}
      </section>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    learningCards: {
      insertLearningCards: (attrs?: Partial<LearningCardsAttrs>) => ReturnType;
    };
  }
}

export const LearningCards = Node.create({
  name: 'learningCards',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      title: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.title,
        parseHTML: (element) => element.getAttribute('data-title') ?? DEFAULT_LEARNING_CARDS_ATTRS.title,
        renderHTML: ({ title }) => ({ 'data-title': title }),
      },
      format: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.format,
        parseHTML: () => 'a8-landscape',
        renderHTML: () => ({ 'data-format': 'a8-landscape' }),
      },
      sidedness: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.sidedness,
        parseHTML: (element) => {
          const value = element.getAttribute('data-sidedness');
          return value === 'single' || value === 'single-solution'
            ? value
            : 'double';
        },
        renderHTML: ({ sidedness }) => ({ 'data-sidedness': sidedness }),
      },
      compactSingleLetterBlanks: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.compactSingleLetterBlanks,
        parseHTML: (element) => (
          element.getAttribute('data-compact-single-letter-blanks') !== 'false'
        ),
        renderHTML: ({ compactSingleLetterBlanks }) => ({
          'data-compact-single-letter-blanks': String(compactSingleLetterBlanks),
        }),
      },
      blankWidthFactor: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.blankWidthFactor,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-learning-cards-blank-width-factor'));
          return Number.isFinite(value) && value >= 0.25 ? Math.min(value, 5) : 1;
        },
        renderHTML: ({ blankWidthFactor }) => ({
          'data-learning-cards-blank-width-factor': String(blankWidthFactor),
        }),
      },
      frontTextSize: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.frontTextSize,
        parseHTML: (element) => {
          const value = element.getAttribute('data-front-text-size');
          return value === 'xs'
            || value === 's'
            || value === 'm'
            || value === 'l'
            || value === 'xl'
            ? value
            : DEFAULT_LEARNING_CARDS_ATTRS.frontTextSize;
        },
        renderHTML: ({ frontTextSize }) => ({ 'data-front-text-size': frontTextSize }),
      },
      backTextSize: {
        default: DEFAULT_LEARNING_CARDS_ATTRS.backTextSize,
        parseHTML: (element) => {
          const value = element.getAttribute('data-back-text-size');
          return value === 'xs'
            || value === 's'
            || value === 'm'
            || value === 'l'
            || value === 'xl'
            ? value
            : DEFAULT_LEARNING_CARDS_ATTRS.backTextSize;
        },
        renderHTML: ({ backTextSize }) => ({ 'data-back-text-size': backTextSize }),
      },
      items: {
        default: DEFAULT_LEARNING_CARD_ITEMS,
        parseHTML: (element) => parseItems(element.getAttribute('data-items')),
        renderHTML: ({ items }) => ({
          'data-items': encodeURIComponent(JSON.stringify(items)),
        }),
      },
      groupIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-group-index')) || 0,
        renderHTML: ({ groupIndex }) => ({ 'data-group-index': groupIndex }),
      },
      sheetSide: {
        default: 'front',
        parseHTML: (element) => {
          const value = element.getAttribute('data-sheet-side');
          if (value === 'back') return 'back';
          if (value === 'solutions') return 'solutions';
          return 'front';
        },
        renderHTML: ({ sheetSide }) => ({ 'data-sheet-side': sheetSide }),
      },
      solutionSheetIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-solution-sheet-index')) || 0,
        renderHTML: ({ solutionSheetIndex }) => ({
          'data-solution-sheet-index': String(solutionSheetIndex ?? 0),
        }),
      },
      solutionSheetCount: {
        default: 1,
        parseHTML: (element) => Math.max(1, Number(element.getAttribute('data-solution-sheet-count')) || 1),
        renderHTML: ({ solutionSheetCount }) => ({
          'data-solution-sheet-count': String(Math.max(1, solutionSheetCount ?? 1)),
        }),
      },
      solutionStartIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-solution-start-index')) || 0,
        renderHTML: ({ solutionStartIndex }) => ({
          'data-solution-start-index': String(solutionStartIndex ?? 0),
        }),
      },
      solutionEndIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-solution-end-index')) || 0,
        renderHTML: ({ solutionEndIndex }) => ({
          'data-solution-end-index': String(solutionEndIndex ?? 0),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="learning-cards"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'learning-cards' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LearningCardsNodeView);
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      filterTransaction: (transaction) => {
        if (!transaction.docChanged) return true;
        let learningCardsCount = 0;
        let containsForeignNode = false;
        transaction.doc.forEach((child) => {
          if (child.type.name === this.name) learningCardsCount += 1;
          else if (child.type.name !== 'pageBreak') containsForeignNode = true;
        });
        return learningCardsCount === 0
          || !containsForeignNode;
      },
      appendTransaction: (transactions, _oldState, newState) => {
        if (!transactions.some((transaction) => transaction.docChanged)) return null;

        const cardSheets: ProseMirrorNode[] = [];
        const solutionSheets: ProseMirrorNode[] = [];
        let baseAttrs: LearningCardsAttrs | undefined;
        let containsForeignNode = false;
        let pageBreakCount = 0;

        for (let index = 0; index < newState.doc.childCount; index += 1) {
          const child = newState.doc.child(index);
          if (child.type.name === this.name) {
            const childAttrs = child.attrs as LearningCardsAttrs;
            if (!baseAttrs) baseAttrs = childAttrs;
            if (childAttrs.sheetSide === 'solutions') solutionSheets.push(child);
            else cardSheets.push(child);
            continue;
          }
          if (child.type.name === 'pageBreak') {
            pageBreakCount += 1;
            continue;
          }
          containsForeignNode = true;
        }

        if (!baseAttrs || containsForeignNode) return null;

        const groups = groupsOfNine(baseAttrs.items);
        const needsSolutionSheet = baseAttrs.sidedness === 'single-solution';
        const expectedCardCount = groups.length * (baseAttrs.sidedness === 'double' ? 2 : 1);
        const totalNodeCount = cardSheets.length + solutionSheets.length;

        const cardStructureOk = cardSheets.length === expectedCardCount;
        const solutionStructureOk = needsSolutionSheet
          ? solutionSheets.length >= 1
          : solutionSheets.length === 0;
        const pageBreaksOk = pageBreakCount === Math.max(0, totalNodeCount - 1);

        // The solution split is owned by the measurement effect in the node
        // view; preserve existing solution sheets verbatim and only rebuild
        // when the card sheets or the page-break skeleton are actually wrong.
        if (cardStructureOk && solutionStructureOk && pageBreaksOk) return null;

        const pageBreakType = newState.schema.nodes.pageBreak;
        const rebuiltCards = groups.flatMap((_, groupIndex) => {
          const front = this.type.create({
            ...baseAttrs,
            groupIndex,
            sheetSide: 'front',
            solutionSheetIndex: 0,
            solutionSheetCount: 1,
            solutionStartIndex: 0,
            solutionEndIndex: 0,
          });
          if (baseAttrs.sidedness === 'double') {
            const back = this.type.create({
              ...baseAttrs,
              groupIndex,
              sheetSide: 'back',
              solutionSheetIndex: 0,
              solutionSheetCount: 1,
              solutionStartIndex: 0,
              solutionEndIndex: 0,
            });
            return [front, back];
          }
          return [front];
        });

        let rebuiltSolutions: ProseMirrorNode[] = [];
        if (needsSolutionSheet) {
          rebuiltSolutions = solutionSheets.length > 0
            ? solutionSheets
            : [this.type.create({
              ...baseAttrs,
              groupIndex: groups.length,
              sheetSide: 'solutions',
              solutionSheetIndex: 0,
              solutionSheetCount: 1,
              solutionStartIndex: 0,
              solutionEndIndex: 0,
            })];
        }

        const normalizedSheets = [...rebuiltCards, ...rebuiltSolutions];
        const outputNodes = joinSheetsWithBreaks(normalizedSheets, pageBreakType);

        return newState.tr.replaceWith(0, newState.doc.content.size, outputNodes);
      },
    })];
  },

  addCommands() {
    return {
      insertLearningCards: (attrs = {}) => ({ state, dispatch }) => {
        const docIsEmpty = state.doc.childCount === 0 || (
          state.doc.childCount === 1
          && state.doc.firstChild?.isTextblock
          && state.doc.firstChild.content.size === 0
        );
        if (!docIsEmpty) return false;
        const baseAttrs = {
          ...DEFAULT_LEARNING_CARDS_ATTRS,
          ...attrs,
          items: attrs.items ?? DEFAULT_LEARNING_CARD_ITEMS.map((item) => ({ ...item })),
        };
        const pageBreakType = state.schema.nodes.pageBreak;
        const groups = groupsOfNine(baseAttrs.items);
        const nodes = groups.flatMap((_, groupIndex) => {
          const sheets = [this.type.create({
            ...baseAttrs,
            groupIndex,
            sheetSide: 'front',
            solutionSheetIndex: 0,
            solutionSheetCount: 1,
            solutionStartIndex: 0,
            solutionEndIndex: 0,
          })];
          if (baseAttrs.sidedness === 'double') {
            sheets.push(this.type.create({
              ...baseAttrs,
              groupIndex,
              sheetSide: 'back',
              solutionSheetIndex: 0,
              solutionSheetCount: 1,
              solutionStartIndex: 0,
              solutionEndIndex: 0,
            }));
          }
          return sheets;
        });
        if (baseAttrs.sidedness === 'single-solution') {
          // Start with a single solution sheet; the measurement effect in the
          // node view splits it into page-sized sheets from real row heights.
          nodes.push(this.type.create({
            ...baseAttrs,
            groupIndex: groups.length,
            sheetSide: 'solutions',
            solutionSheetIndex: 0,
            solutionSheetCount: 1,
            solutionStartIndex: 0,
            solutionEndIndex: 0,
          }));
        }
        const outputNodes = joinSheetsWithBreaks(nodes, pageBreakType);
        if (dispatch) dispatch(state.tr.replaceWith(0, state.doc.content.size, outputNodes));
        return true;
      },
    };
  },
});
