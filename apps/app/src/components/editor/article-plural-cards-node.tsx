"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type ArticlePluralCardItem = {
  id: string;
  article: string;
  singular: string;
  plural: string;
};

export type ArticlePluralCardsAttrs = {
  title: string;
  format: 'a8-landscape';
  sidedness: 'double';
  items: ArticlePluralCardItem[];
  groupIndex: number;
  sheetSide: 'front' | 'back';
};

const CARDS_PER_GROUP = 9;
const SHORT_EDGE_BACK_ORDER = [2, 1, 0, 5, 4, 3, 8, 7, 6];

export const DEFAULT_ARTICLE_PLURAL_CARD_ITEMS: ArticlePluralCardItem[] = Array.from(
  { length: CARDS_PER_GROUP },
  (_, index) => ({
    id: `article-plural-card-${index + 1}`,
    article: '',
    singular: '',
    plural: '',
  }),
);

export const DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS: ArticlePluralCardsAttrs = {
  title: 'Article/Plural Cards',
  format: 'a8-landscape',
  sidedness: 'double',
  items: DEFAULT_ARTICLE_PLURAL_CARD_ITEMS,
  groupIndex: 0,
  sheetSide: 'front',
};

function parseItems(value: string | null): ArticlePluralCardItem[] {
  if (!value) return DEFAULT_ARTICLE_PLURAL_CARD_ITEMS.map((item) => ({ ...item }));
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) throw new Error('Invalid article-plural-card items');
    const items = parsed.flatMap((item, index): ArticlePluralCardItem[] => (
      item && typeof item === 'object'
        ? [{
          id: typeof item.id === 'string' ? item.id : `article-plural-card-${index + 1}`,
          article: typeof item.article === 'string' ? item.article : '',
          singular: typeof item.singular === 'string' ? item.singular : '',
          plural: typeof item.plural === 'string' ? item.plural : '',
        }]
        : []
    ));
    return items.length
      ? items
      : DEFAULT_ARTICLE_PLURAL_CARD_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_ARTICLE_PLURAL_CARD_ITEMS.map((item) => ({ ...item }));
  }
}

function groupsOfNine(items: ArticlePluralCardItem[]) {
  const safeItems = items.length ? items : DEFAULT_ARTICLE_PLURAL_CARD_ITEMS;
  return Array.from(
    { length: Math.ceil(safeItems.length / CARDS_PER_GROUP) },
    (_, index) => safeItems.slice(index * CARDS_PER_GROUP, (index + 1) * CARDS_PER_GROUP),
  );
}

function pluralDiffSegments(singular: string, plural: string) {
  const sourceChars = [...singular.trim()];
  const targetChars = [...plural.trim()];
  if (!targetChars.length) return [] as Array<{ text: string; changed: boolean }>;
  if (!sourceChars.length) {
    return [{ text: targetChars.join(''), changed: false }];
  }

  const sourceLower = sourceChars.map((char) => char.toLocaleLowerCase('de'));
  const targetLower = targetChars.map((char) => char.toLocaleLowerCase('de'));
  const rows = sourceLower.length;
  const cols = targetLower.length;
  const table = Array.from(
    { length: rows + 1 },
    () => Array.from({ length: cols + 1 }, () => 0),
  );

  for (let row = rows - 1; row >= 0; row -= 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      table[row][col] = sourceLower[row] === targetLower[col]
        ? table[row + 1][col + 1] + 1
        : Math.max(table[row + 1][col], table[row][col + 1]);
    }
  }

  const keep = new Set<number>();
  let row = 0;
  let col = 0;
  while (row < rows && col < cols) {
    if (sourceLower[row] === targetLower[col]) {
      keep.add(col);
      row += 1;
      col += 1;
    } else if (table[row + 1][col] >= table[row][col + 1]) {
      row += 1;
    } else {
      col += 1;
    }
  }

  const segments: Array<{ text: string; changed: boolean }> = [];
  for (let index = 0; index < targetChars.length; index += 1) {
    const changed = !keep.has(index);
    const current = segments[segments.length - 1];
    if (!current || current.changed !== changed) {
      segments.push({ text: targetChars[index], changed });
    } else {
      current.text += targetChars[index];
    }
  }

  return segments;
}

function ArticlePluralCardsGrid({
  back,
  items,
}: {
  back: boolean;
  items: ArticlePluralCardItem[];
}) {
  const cells = Array.from({ length: CARDS_PER_GROUP }, (_, index) => items[index] ?? null);
  const ordered = back ? SHORT_EDGE_BACK_ORDER.map((index) => cells[index]) : cells;

  return (
    <div className="learning-cards-node__rotated-grid" data-side={back ? 'back' : 'front'}>
      {ordered.map((item, index) => {
        const fallbackNoun = `Substantiv ${index + 1}`;
        const rawSingular = item?.singular.trim() ?? '';
        const singular = rawSingular || fallbackNoun;
        const article = item?.article.trim() || 'der/die/das';
        const plural = item?.plural.trim();
        const segments = pluralDiffSegments(rawSingular, plural ?? '');
        return (
          <div className="learning-cards-node__card" key={item?.id ?? `empty-${index}`}>
            {item ? (
              back ? (
                <div className="article-plural-cards-node__content article-plural-cards-node__content--back">
                  <p className="article-plural-cards-node__line">
                    <strong>{article}</strong>
                    <span> </span>
                    <span>{singular}</span>
                  </p>
                  <p className="article-plural-cards-node__line">
                    <strong>die</strong>
                    <span> </span>
                    {plural ? (
                      <span>
                        {segments.map((segment, segmentIndex) => (
                          <span
                            className={segment.changed
                              ? 'article-plural-cards-node__plural-diff'
                              : undefined}
                            key={`${item.id}-segment-${segmentIndex}`}
                          >
                            {segment.text}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="article-plural-cards-node__plural-placeholder">Plural</span>
                    )}
                  </p>
                </div>
              ) : (
                <div className="article-plural-cards-node__content article-plural-cards-node__content--front">
                  <p className="article-plural-cards-node__prompt">Artikel und Plural?</p>
                  <div className="learning-cards-node__answer article-plural-cards-node__noun-box">
                    <strong>{singular}</strong>
                  </div>
                </div>
              )
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ArticlePluralCardsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as ArticlePluralCardsAttrs;
  const groups = groupsOfNine(attrs.items);
  const items = groups[attrs.groupIndex] ?? [];
  const back = attrs.sheetSide === 'back';

  return (
    <CustomBlockRoot selected={selected} className="learning-cards-node article-plural-cards-node">
      <section className="learning-cards-node__sheet" data-side={attrs.sheetSide}>
        {attrs.groupIndex === 0 && !back && (
          <h1 className="learning-cards-node__title">{attrs.title}</h1>
        )}
        <ArticlePluralCardsGrid back={back} items={items} />
      </section>
    </CustomBlockRoot>
  );
}

function joinSheetsWithBreaks(
  sheets: ProseMirrorNode[],
  pageBreakType: ProseMirrorNode['type'] | undefined,
) {
  return sheets.flatMap((sheet, index) => (
    index < sheets.length - 1 && pageBreakType
      ? [sheet, pageBreakType.create({ restartPagination: false })]
      : [sheet]
  ));
}

function rebuildSheets(
  extension: ReturnType<typeof Node.create>,
  attrs: ArticlePluralCardsAttrs,
  pageBreakType: ProseMirrorNode['type'] | undefined,
) {
  const groups = groupsOfNine(attrs.items);
  const sheets = groups.flatMap((_, groupIndex) => ([
    extension.type.create({
      ...attrs,
      groupIndex,
      sheetSide: 'front',
    }),
    extension.type.create({
      ...attrs,
      groupIndex,
      sheetSide: 'back',
    }),
  ]));
  return joinSheetsWithBreaks(sheets, pageBreakType);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articlePluralCards: {
      insertArticlePluralCards: (attrs?: Partial<ArticlePluralCardsAttrs>) => ReturnType;
    };
  }
}

export const ArticlePluralCards = Node.create({
  name: 'articlePluralCards',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      title: {
        default: DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS.title,
        parseHTML: (element) => element.getAttribute('data-title') ?? DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS.title,
        renderHTML: ({ title }) => ({ 'data-title': title }),
      },
      format: {
        default: DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS.format,
        parseHTML: () => 'a8-landscape',
        renderHTML: () => ({ 'data-format': 'a8-landscape' }),
      },
      sidedness: {
        default: DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS.sidedness,
        parseHTML: () => 'double',
        renderHTML: () => ({ 'data-sidedness': 'double' }),
      },
      items: {
        default: DEFAULT_ARTICLE_PLURAL_CARD_ITEMS,
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
        parseHTML: (element) => (
          element.getAttribute('data-sheet-side') === 'back'
            ? 'back'
            : 'front'
        ),
        renderHTML: ({ sheetSide }) => ({ 'data-sheet-side': sheetSide }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="article-plural-cards"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'article-plural-cards' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArticlePluralCardsNodeView);
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      filterTransaction: (transaction) => {
        if (!transaction.docChanged) return true;
        let cardsCount = 0;
        let containsForeignNode = false;
        transaction.doc.forEach((child) => {
          if (child.type.name === this.name) cardsCount += 1;
          else if (child.type.name !== 'pageBreak') containsForeignNode = true;
        });
        return cardsCount === 0 || !containsForeignNode;
      },
      appendTransaction: (transactions, _oldState, newState) => {
        if (!transactions.some((transaction) => transaction.docChanged)) return null;

        const sheets: ProseMirrorNode[] = [];
        let baseAttrs: ArticlePluralCardsAttrs | null = null;
        let containsForeignNode = false;
        let pageBreakCount = 0;

        for (let index = 0; index < newState.doc.childCount; index += 1) {
          const child = newState.doc.child(index);
          if (child.type.name === this.name) {
            sheets.push(child);
            if (!baseAttrs) baseAttrs = child.attrs as ArticlePluralCardsAttrs;
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
        const expectedSheetCount = groups.length * 2;
        const structureOk = sheets.length === expectedSheetCount
          && sheets.every((sheet, index) => {
            const expectedGroupIndex = Math.floor(index / 2);
            const expectedSide = index % 2 === 0 ? 'front' : 'back';
            return Number(sheet.attrs.groupIndex) === expectedGroupIndex
              && sheet.attrs.sheetSide === expectedSide;
          });
        const pageBreaksOk = pageBreakCount === Math.max(0, expectedSheetCount - 1);

        if (structureOk && pageBreaksOk) return null;

        const pageBreakType = newState.schema.nodes.pageBreak;
        const rebuilt = rebuildSheets(this, baseAttrs, pageBreakType);
        return newState.tr.replaceWith(0, newState.doc.content.size, rebuilt);
      },
    })];
  },

  addCommands() {
    return {
      insertArticlePluralCards: (attrs = {}) => ({ state, dispatch }) => {
        const docIsEmpty = state.doc.childCount === 0 || (
          state.doc.childCount === 1
          && state.doc.firstChild?.isTextblock
          && state.doc.firstChild.content.size === 0
        );
        if (!docIsEmpty) return false;

        const baseAttrs: ArticlePluralCardsAttrs = {
          ...DEFAULT_ARTICLE_PLURAL_CARDS_ATTRS,
          ...attrs,
          items: attrs.items ?? DEFAULT_ARTICLE_PLURAL_CARD_ITEMS.map((item) => ({ ...item })),
          sidedness: 'double',
          format: 'a8-landscape',
        };

        const pageBreakType = state.schema.nodes.pageBreak;
        const nodes = rebuildSheets(this, baseAttrs, pageBreakType);
        if (dispatch) dispatch(state.tr.replaceWith(0, state.doc.content.size, nodes));
        return true;
      },
    };
  },
});
