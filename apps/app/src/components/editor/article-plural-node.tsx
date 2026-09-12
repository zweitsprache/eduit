"use client";

import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  BlockRow,
  BlockRows,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';

export type GermanArticle = 'der' | 'das' | 'die';
export type ArticlePluralOrder = 'alphabetical' | 'shuffle';

export type ArticlePluralRow = {
  id: string;
  term: string;
  articles: GermanArticle[];
  plural: string;
};

export type ArticlePluralAttrs = {
  instruction: string | null;
  rows: ArticlePluralRow[];
  order: ArticlePluralOrder;
  shuffleSeed: number;
  hideInstructionBadge: boolean;
  showAdditionalBlankItems: boolean;
  showPluralColumn: boolean;
  continuation: boolean;
  rowNumberOffset: number;
};

export const ARTICLE_PLURAL_ROWS_PER_PAGE = 22;

export const ARTICLE_OPTIONS: GermanArticle[] = ['der', 'das', 'die'];
export const DEFAULT_ARTICLE_PLURAL_ROWS: ArticlePluralRow[] = [
  { id: 'article-plural-1', term: 'Apfel', articles: ['der'], plural: 'Äpfel' },
  { id: 'article-plural-2', term: 'Buch', articles: ['das'], plural: 'Bücher' },
  { id: 'article-plural-3', term: 'Lampe', articles: ['die'], plural: 'Lampen' },
];

function defaultRows() {
  return DEFAULT_ARTICLE_PLURAL_ROWS.map((row) => ({ ...row }));
}

export function chunkArticlePluralRows(rows: ArticlePluralRow[]) {
  return Array.from(
    { length: Math.ceil(rows.length / ARTICLE_PLURAL_ROWS_PER_PAGE) },
    (_, index) => rows.slice(
      index * ARTICLE_PLURAL_ROWS_PER_PAGE,
      (index + 1) * ARTICLE_PLURAL_ROWS_PER_PAGE,
    ),
  );
}

function parseRows(value: string | null): ArticlePluralRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    const rows = parsed.flatMap((row, index): ArticlePluralRow[] => {
      if (typeof row?.term !== 'string') return [];
      const storedArticles = Array.isArray(row.articles)
        ? row.articles
        : [row.article];
      return [{
        id: typeof row.id === 'string' ? row.id : `article-plural-${index + 1}`,
        term: row.term,
        articles: ARTICLE_OPTIONS.filter((article) => storedArticles.includes(article)),
        plural: typeof row.plural === 'string' ? row.plural : '',
      }];
    });
    return rows.length ? rows.slice(0, ARTICLE_PLURAL_ROWS_PER_PAGE) : defaultRows();
  } catch {
    return defaultRows();
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

export function orderedArticlePluralRows(
  rows: ArticlePluralRow[],
  order: ArticlePluralOrder,
  shuffleSeed: number,
) {
  if (order === 'alphabetical') {
    return [...rows].sort((left, right) => left.term.localeCompare(
      right.term,
      'de',
      { sensitivity: 'base' },
    ));
  }

  const result = [...rows];
  let state = stableHash(`${shuffleSeed}:${rows.map(({ id }) => id).join(':')}`);
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), 1 | state);
    state ^= state + Math.imul(state ^ (state >>> 7), 61 | state);
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  if (result.length > 1 && result.every((row, index) => row.id === rows[index].id)) {
    result.push(result.shift()!);
  }
  return result;
}

function ArticlePluralNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as ArticlePluralAttrs;
  const layoutRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(layoutRef);
  const rows = orderedArticlePluralRows(attrs.rows, attrs.order, attrs.shuffleSeed)
    .slice(0, ARTICLE_PLURAL_ROWS_PER_PAGE);
  const emptyRowCount = ARTICLE_PLURAL_ROWS_PER_PAGE - rows.length;
  const showAdditionalSection = attrs.showAdditionalBlankItems && emptyRowCount >= 3;

  return (
    <CustomBlockRoot
      selected={selected}
      className={`article-plural-node${
        attrs.showPluralColumn ? '' : ' article-plural-node--without-plural'
      }`}
    >
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {!attrs.continuation && (
          <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
            {attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.articlePlural}
          </BlockInstruction>
        )}
        <div className="article-plural-node__header">
          <span aria-hidden="true" className="article-plural-node__index-spacer" />
          <div className="article-plural-node__articles">
            {ARTICLE_OPTIONS.map((article) => <strong key={article}>{article}</strong>)}
          </div>
          <span className="article-plural-node__term-header">Begriff</span>
          {attrs.showPluralColumn && (
            <strong className="article-plural-node__plural-header">Plural</strong>
          )}
        </div>
        <BlockRows>
          {rows.map((row, rowIndex) => (
            <BlockRow index={attrs.rowNumberOffset + rowIndex} key={row.id}>
              <div className="article-plural-node__articles">
                {ARTICLE_OPTIONS.map((article) => (
                  <BlockChoiceIndicator
                    checked={false}
                    key={article}
                    solutionKey={row.articles.includes(article) ? `${row.id}:${article}` : undefined}
                  />
                ))}
              </div>
              <div className="article-plural-node__term">
                <InlineFormattedText
                  text={row.term}
                  fallback={`Term ${attrs.rowNumberOffset + rowIndex + 1}`}
                />
              </div>
              {attrs.showPluralColumn && (
                <div className="article-plural-node__plural-answer">
                  <span>die</span>
                  <span
                    className="matching-pairs-node__writing-line article-plural-node__writing-line"
                    data-solution-text={row.plural || undefined}
                  />
                </div>
              )}
            </BlockRow>
          ))}
        </BlockRows>
        {showAdditionalSection && (
          <section className="article-plural-node__additional-section">
            <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
              Suchen Sie weitere Nomen / Substantive zum Thema.
            </BlockInstruction>
            <div className="article-plural-node__header">
              <span aria-hidden="true" className="article-plural-node__index-spacer" />
              <div className="article-plural-node__articles">
                {ARTICLE_OPTIONS.map((article) => <strong key={article}>{article}</strong>)}
              </div>
              <span className="article-plural-node__term-header">Begriff</span>
              {attrs.showPluralColumn && (
                <strong className="article-plural-node__plural-header">Plural</strong>
              )}
            </div>
            <BlockRows>
              {Array.from({ length: emptyRowCount }, (_, emptyIndex) => (
                <BlockRow
                  className="article-plural-node__empty-row"
                  index={emptyIndex}
                  key={`empty-${emptyIndex}`}
                >
                  <div className="article-plural-node__articles">
                    {ARTICLE_OPTIONS.map((article) => (
                      <BlockChoiceIndicator checked={false} key={article} />
                    ))}
                  </div>
                  <div className="article-plural-node__plural-answer article-plural-node__term-answer">
                    <span aria-hidden="true" className="article-plural-node__term-baseline">die</span>
                    <span className="matching-pairs-node__writing-line article-plural-node__writing-line" />
                  </div>
                  {attrs.showPluralColumn && (
                    <div className="article-plural-node__plural-answer">
                      <span>die</span>
                      <span className="matching-pairs-node__writing-line article-plural-node__writing-line" />
                    </div>
                  )}
                </BlockRow>
              ))}
            </BlockRows>
          </section>
        )}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    articlePlural: {
      insertArticlePlural: (attrs?: Partial<ArticlePluralAttrs>) => ReturnType;
    };
  }
}

export const ArticlePlural = Node.create({
  name: 'articlePlural',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rows: {
        default: DEFAULT_ARTICLE_PLURAL_ROWS,
        parseHTML: (element) => parseRows(element.getAttribute('data-article-plural-rows')),
        renderHTML: (attributes) => ({
          'data-article-plural-rows': encodeURIComponent(JSON.stringify(attributes.rows)),
        }),
      },
      order: {
        default: 'alphabetical',
        parseHTML: (element) => (
          element.getAttribute('data-article-plural-order') === 'shuffle'
            ? 'shuffle'
            : 'alphabetical'
        ),
        renderHTML: (attributes) => ({ 'data-article-plural-order': attributes.order }),
      },
      shuffleSeed: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-article-plural-shuffle-seed')) || 0,
        renderHTML: (attributes) => ({
          'data-article-plural-shuffle-seed': String(attributes.shuffleSeed),
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-article-plural-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-article-plural-hide-instruction-badge': String(
            attributes.hideInstructionBadge,
          ),
        }),
      },
      showAdditionalBlankItems: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-article-plural-show-additional-blank-items') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-article-plural-show-additional-blank-items': String(
            attributes.showAdditionalBlankItems,
          ),
        }),
      },
      showPluralColumn: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-article-plural-show-plural-column') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-article-plural-show-plural-column': String(attributes.showPluralColumn),
        }),
      },
      continuation: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-article-plural-continuation') === 'true',
        renderHTML: (attributes) => ({
          'data-article-plural-continuation': String(attributes.continuation),
        }),
      },
      rowNumberOffset: {
        default: 0,
        parseHTML: (element) => (
          Number(element.getAttribute('data-article-plural-row-number-offset')) || 0
        ),
        renderHTML: (attributes) => ({
          'data-article-plural-row-number-offset': String(attributes.rowNumberOffset),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="article-plural"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'article-plural' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ArticlePluralNodeView);
  },

  addCommands() {
    return {
      insertArticlePlural:
        (attrs = {}) =>
        ({ commands }) => {
          const order = attrs.order ?? 'alphabetical';
          const shuffleSeed = attrs.shuffleSeed ?? 0;
          const sourceRows = attrs.rows ?? defaultRows();
          const rows = order === 'alphabetical'
            ? orderedArticlePluralRows(sourceRows, order, shuffleSeed)
            : sourceRows;
          return commands.insertContent(
            chunkArticlePluralRows(rows).map((chunk, index) => ({
            type: this.name,
            attrs: {
              ...attrs,
              rows: chunk,
              order,
              shuffleSeed,
              continuation: attrs.continuation === true || index > 0,
              rowNumberOffset: (attrs.rowNumberOffset ?? 0)
                + index * ARTICLE_PLURAL_ROWS_PER_PAGE,
            },
          })),
          );
        },
    };
  },
});
