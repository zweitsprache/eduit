"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { germanVerbExceptionRuns } from '@/lib/german-verb-forms';

export type IndefiniteArticleCaseKey = 'nom' | 'akk' | 'dat' | 'gen';
export type IndefiniteArticleGenderKey = 'masculine' | 'neuter' | 'feminine' | 'plural';

export type IndefiniteArticleRow = {
  gender: IndefiniteArticleGenderKey;
  values: Record<IndefiniteArticleCaseKey, string>;
  additional: string;
};

export type IndefiniteArticleAttrs = {
  rows: IndefiniteArticleRow[];
  displayedCases: IndefiniteArticleCaseKey[];
};

export const INDEFINITE_ARTICLE_CASES: Array<{
  key: IndefiniteArticleCaseKey;
  label: string;
}> = [
  { key: 'nom', label: 'NOMINATIV' },
  { key: 'akk', label: 'AKKUSATIV' },
  { key: 'dat', label: 'DATIV' },
  { key: 'gen', label: 'GENITIV' },
];

export const INDEFINITE_ARTICLE_GENDERS: Array<{
  key: IndefiniteArticleGenderKey;
  label: string;
}> = [
  { key: 'masculine', label: 'der' },
  { key: 'neuter', label: 'das' },
  { key: 'feminine', label: 'die' },
  { key: 'plural', label: 'die PLURAL' },
];

function defaultRows(): IndefiniteArticleRow[] {
  return [
    {
      gender: 'masculine',
      additional: '',
      values: { nom: 'ein', akk: 'einen', dat: 'einem', gen: 'eines' },
    },
    {
      gender: 'neuter',
      additional: '',
      values: { nom: 'ein', akk: 'ein', dat: 'einem', gen: 'eines' },
    },
    {
      gender: 'feminine',
      additional: '',
      values: { nom: 'eine', akk: 'eine', dat: 'einer', gen: 'einer' },
    },
    {
      gender: 'plural',
      additional: '',
      values: { nom: '–', akk: '–', dat: '–', gen: '–' },
    },
  ];
}

export const DEFAULT_INDEFINITE_ARTICLE_ATTRS: IndefiniteArticleAttrs = {
  rows: defaultRows(),
  displayedCases: INDEFINITE_ARTICLE_CASES.map(({ key }) => key),
};

function parseDisplayedCases(value: string | null): IndefiniteArticleCaseKey[] {
  if (!value) return [...DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [...DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases];
    return INDEFINITE_ARTICLE_CASES
      .map(({ key }) => key)
      .filter((key) => parsed.includes(key));
  } catch {
    return [...DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases];
  }
}

function parseRows(value: string | null): IndefiniteArticleRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    const fallback = defaultRows();
    return INDEFINITE_ARTICLE_GENDERS.map(({ key: gender }, rowIndex) => {
      const source = parsed.find((row) => row?.gender === gender);
      return {
        gender,
        additional: typeof source?.additional === 'string' ? source.additional : '',
        values: INDEFINITE_ARTICLE_CASES.reduce((values, { key }) => {
          values[key] = typeof source?.values?.[key] === 'string'
            ? source.values[key]
            : fallback[rowIndex].values[key];
          return values;
        }, {} as Record<IndefiniteArticleCaseKey, string>),
      };
    });
  } catch {
    return defaultRows();
  }
}

function renderArticleValue(value: string, nominativeValue: string) {
  const normalizedValue = value.trim();
  if (!normalizedValue) return '\u00A0';
  return germanVerbExceptionRuns(normalizedValue, nominativeValue.trim()).map((run, index) => (
    run.different
      ? <strong className="indefinite-article-node__highlight" key={index}>{run.text}</strong>
      : <span key={index}>{run.text}</span>
  ));
}

function IndefiniteArticleNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as IndefiniteArticleAttrs;
  const rows = attrs.rows?.length ? attrs.rows : defaultRows();
  const displayedCases = attrs.displayedCases
    ?? DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases;
  const visibleCases = INDEFINITE_ARTICLE_CASES.filter(
    ({ key }) => displayedCases.includes(key),
  );
  const spacerColumns = Array.from(
    { length: 10 - visibleCases.length - 2 },
    (_, index) => index,
  );

  return (
    <CustomBlockRoot selected={selected} className="indefinite-article-node">
      <div className="indefinite-article-node__scroller">
        <table className="indefinite-article-node__table">
          <colgroup>
            <col className="indefinite-article-node__visible-column" />
            {visibleCases.map(({ key }) => (
              <col className="indefinite-article-node__visible-column" key={key} />
            ))}
            <col className="indefinite-article-node__visible-column" />
            {spacerColumns.map((index) => (
              <col className="indefinite-article-node__spacer-column" key={index} />
            ))}
          </colgroup>
          <tbody>
            <tr className="indefinite-article-node__header-row">
              <th aria-label="Genus" scope="col">
                <span className="indefinite-article-node__cell-content" />
              </th>
              {visibleCases.map(({ key, label }) => (
                <th key={key} scope="col">
                  <span className="indefinite-article-node__cell-content">{label}</span>
                </th>
              ))}
              <th aria-label="Leere Zusatzspalte" scope="col">
                <span className="indefinite-article-node__cell-content" />
              </th>
              {spacerColumns.map((index) => (
                <th
                  aria-hidden="true"
                  className="indefinite-article-node__spacer-cell"
                  key={index}
                />
              ))}
            </tr>
            {INDEFINITE_ARTICLE_GENDERS.map(({ key: gender, label }) => {
              const row = rows.find((item) => item.gender === gender);
              return (
                <tr key={gender}>
                  <th scope="row">
                    <span className="indefinite-article-node__cell-content">
                      {gender === 'plural'
                        ? <>die{'\u00A0'}<sup>PLURAL</sup></>
                        : label}
                    </span>
                  </th>
                  {visibleCases.map(({ key }) => (
                    <td key={key}>
                      <span className="indefinite-article-node__cell-content">
                        {key === 'nom'
                          ? (row?.values[key] || '\u00A0')
                          : renderArticleValue(
                            row?.values[key] ?? '',
                            row?.values.nom ?? '',
                          )}
                      </span>
                    </td>
                  ))}
                  <td aria-label="Leere Zusatzspalte">
                    <span className="indefinite-article-node__cell-content">
                      {row?.additional || '\u00A0'}
                    </span>
                  </td>
                  {spacerColumns.map((index) => (
                    <td
                      aria-hidden="true"
                      className="indefinite-article-node__spacer-cell"
                      key={index}
                    />
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indefiniteArticle: {
      insertIndefiniteArticle: (
        attrs?: Partial<IndefiniteArticleAttrs>,
      ) => ReturnType;
    };
  }
}

export const IndefiniteArticle = Node.create({
  name: 'indefiniteArticle',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      rows: {
        default: DEFAULT_INDEFINITE_ARTICLE_ATTRS.rows,
        parseHTML: (element) => parseRows(
          element.getAttribute('data-indefinite-article-rows'),
        ),
        renderHTML: ({ rows }) => ({
          'data-indefinite-article-rows': encodeURIComponent(JSON.stringify(rows)),
        }),
      },
      displayedCases: {
        default: DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases,
        parseHTML: (element) => parseDisplayedCases(
          element.getAttribute('data-indefinite-article-displayed-cases'),
        ),
        renderHTML: ({ displayedCases }) => ({
          'data-indefinite-article-displayed-cases': encodeURIComponent(
            JSON.stringify(displayedCases),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="indefinite-article"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'indefinite-article',
    })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(IndefiniteArticleNodeView);
  },

  addCommands() {
    return {
      insertIndefiniteArticle: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: {
            ...DEFAULT_INDEFINITE_ARTICLE_ATTRS,
            ...attrs,
            rows: attrs.rows ?? defaultRows(),
            displayedCases: attrs.displayedCases
              ?? [...DEFAULT_INDEFINITE_ARTICLE_ATTRS.displayedCases],
          },
        })
      ),
    };
  },
});