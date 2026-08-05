"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import type { CSSProperties } from 'react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { htmlToInlineFormatting } from '@/components/editor/custom-blocks/inline-formatting';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  isSingleLetterBlankAnswer,
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
  sidedness: 'single' | 'double';
  items: LearningCardItem[];
  frontTextSize: LearningCardTextSize;
  backTextSize: LearningCardTextSize;
  groupIndex: number;
  sheetSide: 'front' | 'back';
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
  items: DEFAULT_LEARNING_CARD_ITEMS,
  frontTextSize: 'm',
  backTextSize: 'm',
  groupIndex: 0,
  sheetSide: 'front',
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
  if (!answer || !Number.isFinite(parsedFactor) || parsedFactor < 0.5) {
    return { answer: payload.trim(), widthFactor: defaultWidthFactor };
  }

  return {
    answer,
    widthFactor: Math.min(parsedFactor, 5),
  };
}

function parseLearningCardBlanks(text: string): LearningCardBlankPart[] {
  const parts: LearningCardBlankPart[] = [];
  const pattern = /\{\{blank:([^{}]+)\}\}/gi;
  let cursor = 0;
  let blankIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, match.index) });
    }
    blankIndex += 1;
    const blank = parseLearningCardBlankPayload(match[1], 1);
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

function groupsOfNine(items: LearningCardItem[]) {
  const safeItems = items.length ? items : DEFAULT_LEARNING_CARD_ITEMS;
  return Array.from(
    { length: Math.ceil(safeItems.length / CARDS_PER_GROUP) },
    (_, index) => safeItems.slice(index * CARDS_PER_GROUP, (index + 1) * CARDS_PER_GROUP),
  );
}

function LearningCardsGrid({
  back,
  textSize,
  items,
}: {
  back: boolean;
  textSize: LearningCardTextSize;
  items: LearningCardItem[];
}) {
  const cells = Array.from({ length: CARDS_PER_GROUP }, (_, index) => items[index] ?? null);
  const ordered = back ? SHORT_EDGE_BACK_ORDER.map((index) => cells[index]) : cells;
  return (
    <div className="learning-cards-node__rotated-grid" data-side={back ? 'back' : 'front'}>
      {ordered.map((item, index) => (
        <div className="learning-cards-node__card" key={item?.id ?? `empty-${index}`}>
          {item ? (
            <LearningCardContent
              fallback={item.id.endsWith('-empty')
                ? undefined
                : `Card ${items.indexOf(item) + 1}`}
              textSize={textSize}
              text={back ? item.back : item.front}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function LearningCardContent({
  fallback,
  textSize = 'm',
  text,
}: {
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
  const parts = parseLearningCardBlanks(body);

  let blankIndex = 0;
  return (
    <div className={`learning-cards-node__content learning-cards-node__content--text-${textSize}`}>
      <div className="learning-cards-node__body">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return <InlineFormattedText key={`text-${index}`} text={part.value} />;
          }

          blankIndex += 1;
          return (
            <span
              aria-label={`Blank ${String(blankIndex).padStart(2, '0')}`}
              className={`fill-in-the-blank-node__blank${
                isSingleLetterBlankAnswer(part.answer)
                  ? ' fill-in-the-blank-node__blank--single-letter'
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

function LearningCardsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as LearningCardsAttrs;
  const groups = groupsOfNine(attrs.items);
  const items = groups[attrs.groupIndex] ?? [];
  const back = attrs.sheetSide === 'back';
  const textSize = back ? attrs.backTextSize : attrs.frontTextSize;
  return (
    <CustomBlockRoot selected={selected} className="learning-cards-node">
      <section className="learning-cards-node__sheet" data-side={attrs.sheetSide}>
        {attrs.groupIndex === 0 && !back && (
          <h1 className="learning-cards-node__title">{attrs.title}</h1>
        )}
        <LearningCardsGrid items={items} back={back} textSize={textSize} />
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
        parseHTML: (element) => element.getAttribute('data-sidedness') === 'single' ? 'single' : 'double',
        renderHTML: ({ sidedness }) => ({ 'data-sidedness': sidedness }),
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
        parseHTML: (element) => element.getAttribute('data-sheet-side') === 'back' ? 'back' : 'front',
        renderHTML: ({ sheetSide }) => ({ 'data-sheet-side': sheetSide }),
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
          })];
          if (baseAttrs.sidedness === 'double') {
            sheets.push(this.type.create({
              ...baseAttrs,
              groupIndex,
              sheetSide: 'back',
            }));
          }
          return sheets;
        }).flatMap((sheet, index, sheets) => (
          index < sheets.length - 1 && pageBreakType
            ? [sheet, pageBreakType.create()]
            : [sheet]
        ));
        if (dispatch) dispatch(state.tr.replaceWith(0, state.doc.content.size, nodes));
        return true;
      },
    };
  },
});
