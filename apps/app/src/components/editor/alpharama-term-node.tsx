"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import hyphenDe from 'hyphen/de';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';

export type AlpharamaTermItem = {
  id: string;
  image: string;
  alt: string;
  term: string;
};

export type AlpharamaTermAttrs = {
  items: AlpharamaTermItem[];
  pageBreakBetweenItems: boolean;
};

const DEFAULT_ITEM: AlpharamaTermItem = {
  id: 'alpharama-term-1',
  image: '/placeholders/rewrite-landscape.svg',
  alt: 'Term illustration',
  term: '',
};

export const DEFAULT_ALPHARAMA_TERM_ATTRS: AlpharamaTermAttrs = {
  items: [{ ...DEFAULT_ITEM }],
  pageBreakBetweenItems: false,
};

function parseItems(value: string | null): AlpharamaTermItem[] {
  if (!value) return [{ ...DEFAULT_ITEM }];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [{ ...DEFAULT_ITEM }];
    const items = parsed.flatMap((item, index): AlpharamaTermItem[] => (
      item && typeof item === 'object'
        ? [{
            id: typeof item.id === 'string' ? item.id : `alpharama-term-${index + 1}`,
            image: typeof item.image === 'string' ? item.image : '',
            alt: typeof item.alt === 'string' ? item.alt : '',
            term: typeof item.term === 'string' ? item.term : '',
          }]
        : []
    ));
    return items.length ? items : [{ ...DEFAULT_ITEM }];
  } catch {
    return [{ ...DEFAULT_ITEM }];
  }
}

function syllablesForTerm(term: string) {
  const hyphenated = hyphenDe.hyphenateSync(term.trim());
  return hyphenated.split('\u00AD').filter(Boolean);
}

export function LiteracyWritingLineBlock({ term }: { term?: string }) {
  const syllables = term ? syllablesForTerm(term) : [];
  return (
    <div className="alpharama-term__writing-lines">
      {syllables.length > 0 && (
        <span className="alpharama-term__term" aria-label={term}>
          {syllables.map((syllable, index) => (
            <span className="alpharama-term__syllable" key={`${syllable}-${index}`}>
              <span className="alpharama-term__syllable-text">{syllable}</span>
            </span>
          ))}
        </span>
      )}
      <div className="alpharama-term__line alpharama-term__line--top" />
      <div className="alpharama-term__line alpharama-term__line--middle" />
      <div className="alpharama-term__line alpharama-term__line--baseline" />
      <div className="alpharama-term__line alpharama-term__line--bottom" />
      {syllables.length > 0 && (
        <div aria-hidden="true" className="alpharama-term__syllable-arches">
          {syllables.map((syllable, index) => (
            <span className="alpharama-term__arch-syllable" key={`${syllable}-${index}`}>
              <span className="alpharama-term__arch-width">{syllable}</span>
              <span className="alpharama-term__syllable-arch" />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function AlpharamaTermContent({ attrs }: { attrs: AlpharamaTermAttrs }) {
  return (
    <div className="alpharama-term-node">
      {attrs.items.map((item, index) => (
        <article
          className={`alpharama-term__item${attrs.pageBreakBetweenItems && index > 0 ? ' alpharama-term__item--page-break' : ''}`}
          key={item.id}
        >
          <span className="alpharama-term__item-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="alpharama-term__image-wrap">
            {item.image.trim() ? (
              <img
                alt={item.alt || item.term}
                className="alpharama-term__image"
                src={item.image}
              />
            ) : null}
          </div>
          <div className="alpharama-term__exercise">
            <LiteracyWritingLineBlock term={item.term} />
            <LiteracyWritingLineBlock />
          </div>
        </article>
      ))}
    </div>
  );
}

function AlpharamaTermNodeView({ node, selected }: NodeViewProps) {
  return (
    <CustomBlockRoot selected={selected} className="alpharama-term-node-wrapper">
      <AlpharamaTermContent attrs={node.attrs as AlpharamaTermAttrs} />
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    alpharamaTerm: {
      insertAlpharamaTerm: (attrs?: Partial<AlpharamaTermAttrs>) => ReturnType;
    };
  }
}

export const AlpharamaTerm = Node.create({
  name: 'alpharamaTerm',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_ALPHARAMA_TERM_ATTRS.items,
        parseHTML: (element: HTMLElement) => parseItems(
          element.getAttribute('data-alpharama-term-items'),
        ),
        renderHTML: (attributes: AlpharamaTermAttrs) => ({
          'data-alpharama-term-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
      pageBreakBetweenItems: {
        default: DEFAULT_ALPHARAMA_TERM_ATTRS.pageBreakBetweenItems,
        parseHTML: (element: HTMLElement) => element.getAttribute(
          'data-alpharama-term-page-break-between-items',
        ) === 'true',
        renderHTML: (attributes: AlpharamaTermAttrs) => ({
          'data-alpharama-term-page-break-between-items': String(attributes.pageBreakBetweenItems),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="alpharama-term"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'alpharama-term' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AlpharamaTermNodeView);
  },

  addCommands() {
    return {
      insertAlpharamaTerm:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              items: attrs.items ?? DEFAULT_ALPHARAMA_TERM_ATTRS.items,
              pageBreakBetweenItems: attrs.pageBreakBetweenItems
                ?? DEFAULT_ALPHARAMA_TERM_ATTRS.pageBreakBetweenItems,
            },
          }),
    };
  },
});
