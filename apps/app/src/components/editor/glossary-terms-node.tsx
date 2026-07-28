"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';

export type GlossaryTermWidth = 25 | 33 | 50 | 66;

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  example: string;
};

export type GlossaryTermsAttrs = {
  terms: GlossaryTerm[];
  termWidth: GlossaryTermWidth;
};

export const DEFAULT_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'term-1',
    term: 'Term',
    definition: 'Definition',
    example: 'Example',
  },
  {
    id: 'term-2',
    term: 'Term',
    definition: 'Definition',
    example: 'Example',
  },
];

function defaultTerms(): GlossaryTerm[] {
  return DEFAULT_GLOSSARY_TERMS.map((term) => ({ ...term }));
}

function parseTerms(value: string | null): GlossaryTerm[] {
  if (!value) return defaultTerms();

  try {
    const terms = JSON.parse(decodeURIComponent(value));
    return Array.isArray(terms) ? terms : defaultTerms();
  } catch {
    return defaultTerms();
  }
}

function parseTermWidth(value: string | null): GlossaryTermWidth {
  const width = Number(value);
  return width === 25 || width === 33 || width === 50 || width === 66
    ? width
    : 33;
}

function GlossaryTermsNodeView({ node, selected }: NodeViewProps) {
  const { terms, termWidth } = node.attrs as GlossaryTermsAttrs;

  return (
    <CustomBlockRoot selected={selected} className="glossary-terms-node">
      <BlockInstruction>
        {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.glossaryTerms}
      </BlockInstruction>
      <div
        className="glossary-terms-node__table"
        data-term-width={termWidth}
      >
        <div className="glossary-terms-node__header">
          <span className="glossary-terms-node__index-spacer" />
          <strong>Term</strong>
          <strong>Definition</strong>
          <strong>Example</strong>
        </div>
        {terms.map((item, index) => (
          <div className="glossary-terms-node__row" key={item.id}>
            <span className="custom-block__row-index">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className="glossary-terms-node__cell">{item.term}</span>
            <span className="glossary-terms-node__cell">{item.definition}</span>
            <span className="glossary-terms-node__cell">{item.example}</span>
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    glossaryTerms: {
      insertGlossaryTerms: (attrs?: Partial<GlossaryTermsAttrs>) => ReturnType;
    };
  }
}

export const GlossaryTerms = Node.create({
  name: 'glossaryTerms',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      terms: {
        default: DEFAULT_GLOSSARY_TERMS,
        parseHTML: (element) => parseTerms(element.getAttribute('data-glossary-terms')),
        renderHTML: (attributes) => ({
          'data-glossary-terms': encodeURIComponent(JSON.stringify(attributes.terms)),
        }),
      },
      termWidth: {
        default: 33,
        parseHTML: (element) => parseTermWidth(
          element.getAttribute('data-glossary-term-width'),
        ),
        renderHTML: (attributes) => ({
          'data-glossary-term-width': attributes.termWidth,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="glossary-terms"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'glossary-terms' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GlossaryTermsNodeView);
  },

  addCommands() {
    return {
      insertGlossaryTerms:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              terms: attrs.terms ?? defaultTerms(),
              termWidth: attrs.termWidth ?? 33,
            },
          }),
    };
  },
});
