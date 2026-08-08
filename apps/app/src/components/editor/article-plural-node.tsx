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

export type GermanArticle = 'der' | 'das' | 'die';
export type ArticlePluralOrder = 'alphabetical' | 'shuffle';

export type ArticlePluralRow = {
  id: string;
  term: string;
  article: GermanArticle | null;
  plural: string;
};

export type ArticlePluralAttrs = {
  rows: ArticlePluralRow[];
  order: ArticlePluralOrder;
  shuffleSeed: number;
};

export const ARTICLE_PLURAL_ROWS_PER_PAGE = 22;

const ARTICLE_PLURAL_INSTRUCTION =
  'Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.';

export const ARTICLE_OPTIONS: GermanArticle[] = ['der', 'das', 'die'];
export const DEFAULT_ARTICLE_PLURAL_ROWS: ArticlePluralRow[] = [
  { id: 'article-plural-1', term: 'Apfel', article: 'der', plural: 'Äpfel' },
  { id: 'article-plural-2', term: 'Buch', article: 'das', plural: 'Bücher' },
  { id: 'article-plural-3', term: 'Lampe', article: 'die', plural: 'Lampen' },
];

function defaultRows() {
  return DEFAULT_ARTICLE_PLURAL_ROWS.map((row) => ({ ...row }));
}

function parseRows(value: string | null): ArticlePluralRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    const rows = parsed.flatMap((row, index): ArticlePluralRow[] => {
      if (typeof row?.term !== 'string') return [];
      return [{
        id: typeof row.id === 'string' ? row.id : `article-plural-${index + 1}`,
        term: row.term,
        article: ARTICLE_OPTIONS.includes(row.article) ? row.article : null,
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

  return (
    <CustomBlockRoot selected={selected} className="article-plural-node">
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction>
          {ARTICLE_PLURAL_INSTRUCTION}
        </BlockInstruction>
        <div className="article-plural-node__header">
          <span aria-hidden="true" className="article-plural-node__index-spacer" />
          <div className="article-plural-node__articles">
            {ARTICLE_OPTIONS.map((article) => <strong key={article}>{article}</strong>)}
          </div>
          <span className="article-plural-node__term-header">Begriff</span>
          <strong className="article-plural-node__plural-header">Plural</strong>
        </div>
        <BlockRows>
          {rows.map((row, rowIndex) => (
            <BlockRow index={rowIndex} key={row.id}>
              <div className="article-plural-node__articles">
                {ARTICLE_OPTIONS.map((article) => (
                  <BlockChoiceIndicator
                    checked={false}
                    key={article}
                    solutionKey={row.article === article ? `${row.id}:${article}` : undefined}
                  />
                ))}
              </div>
              <div className="article-plural-node__term">
                <InlineFormattedText text={row.term} fallback={`Term ${rowIndex + 1}`} />
              </div>
              <div className="article-plural-node__plural-answer">
                <span>die</span>
                <span
                  className="matching-pairs-node__writing-line article-plural-node__writing-line"
                  data-solution-text={row.plural || undefined}
                />
              </div>
            </BlockRow>
          ))}
        </BlockRows>
        {emptyRowCount > 0 && (
          <section className="article-plural-node__additional-section">
            <BlockInstruction>
              Suchen Sie weitere Nomen / Substantive zum Thema.
            </BlockInstruction>
            <div className="article-plural-node__header">
              <span aria-hidden="true" className="article-plural-node__index-spacer" />
              <div className="article-plural-node__articles">
                {ARTICLE_OPTIONS.map((article) => <strong key={article}>{article}</strong>)}
              </div>
              <span className="article-plural-node__term-header">Begriff</span>
              <strong className="article-plural-node__plural-header">Plural</strong>
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
                  <div className="article-plural-node__plural-answer">
                    <span>die</span>
                    <span className="matching-pairs-node__writing-line article-plural-node__writing-line" />
                  </div>
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
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            rows: (attrs.rows ?? defaultRows()).slice(0, ARTICLE_PLURAL_ROWS_PER_PAGE),
            order: attrs.order ?? 'alphabetical',
            shuffleSeed: attrs.shuffleSeed ?? 0,
          },
        }),
    };
  },
});
