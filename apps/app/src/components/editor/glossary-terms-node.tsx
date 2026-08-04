"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import type { CSSProperties } from 'react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';

export const GLOSSARY_COLUMN_WIDTHS = [10, 15, 20, 25, 33, 50, 66] as const;
export type GlossaryTermWidth = typeof GLOSSARY_COLUMN_WIDTHS[number];
export type GlossaryPreset = 'default' | 'verbs' | 'nouns' | 'adjectives';

export const GLOSSARY_PRESETS: Record<GlossaryPreset, {
  label: string;
  headers: [string, string, string?];
  termWidth: GlossaryTermWidth;
  definitionWidth: GlossaryTermWidth;
}> = {
  default: { label: 'Standard', headers: ['Begriff', 'Definition', 'Beispiel'], termWidth: 33, definitionWidth: 33 },
  verbs: { label: 'Verb', headers: ['Infinitiv', 'Perfekt', 'Beispiel'], termWidth: 20, definitionWidth: 25 },
  nouns: { label: 'Substantive', headers: ['Singular', 'Plural'], termWidth: 50, definitionWidth: 50 },
  adjectives: { label: 'Adjektive', headers: ['Adjektiv', 'Gegenteil'], termWidth: 50, definitionWidth: 50 },
};

export type GlossaryTerm = {
  id: string;
  term: string;
  definition: string;
  example: string;
};

export type GlossaryTermsAttrs = {
  terms: GlossaryTerm[];
  termWidth: GlossaryTermWidth;
  definitionWidth: GlossaryTermWidth;
  preset: GlossaryPreset;
  showInstruction: boolean;
  showExample: boolean;
};

/** Two-column layouts give the definition whatever the term column leaves over. */
export function glossaryColumnWidths(
  attrs: Pick<GlossaryTermsAttrs, 'preset' | 'termWidth' | 'definitionWidth' | 'showExample'>,
) {
  const presetConfig = GLOSSARY_PRESETS[attrs.preset];
  const hasExample = presetConfig.headers.length === 3 && attrs.showExample;
  const termWidth = attrs.preset === 'default' ? attrs.termWidth : presetConfig.termWidth;
  const definitionWidth = attrs.preset === 'default'
    ? attrs.definitionWidth
    : presetConfig.definitionWidth;
  return {
    hasExample,
    widths: hasExample
      ? [termWidth, definitionWidth, Math.max(1, 100 - termWidth - definitionWidth)]
      : [termWidth, Math.max(1, 100 - termWidth)],
  };
}

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
  return GLOSSARY_COLUMN_WIDTHS.includes(width as GlossaryTermWidth)
    ? width as GlossaryTermWidth
    : 33;
}

function parsePreset(value: string | null): GlossaryPreset {
  return value === 'verbs' || value === 'nouns' || value === 'adjectives'
    ? value
    : 'default';
}

function GlossaryTermsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as GlossaryTermsAttrs;
  const { terms, preset } = attrs;
  const presetConfig = GLOSSARY_PRESETS[preset];
  const { hasExample, widths: columnWidths } = glossaryColumnWidths(attrs);
  const columnStyle = (index: number) => ({
    width: `${columnWidths[index]}%`,
  }) as CSSProperties;
  const finalPairStart = Math.max(0, terms.length - 2);
  const renderRow = (item: GlossaryTerm, index: number) => (
    <div className="glossary-terms-node__row" key={item.id}>
      <span className="custom-block__row-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="glossary-terms-node__columns">
        <span className="glossary-terms-node__cell" style={columnStyle(0)}>{item.term}</span>
        <span className="glossary-terms-node__cell" style={columnStyle(1)}>{item.definition}</span>
        {hasExample && (
          <span className="glossary-terms-node__cell" style={columnStyle(2)}>{item.example}</span>
        )}
      </span>
    </div>
  );

  return (
    <CustomBlockRoot selected={selected} className="glossary-terms-node">
      {node.attrs.showInstruction && (
        <BlockInstruction>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.glossaryTerms}
        </BlockInstruction>
      )}
      <div
        className="glossary-terms-node__table"
      >
        <div className="glossary-terms-node__header">
          <span className="glossary-terms-node__index-spacer" />
          <span className="glossary-terms-node__columns">
            {presetConfig.headers.slice(0, columnWidths.length).map((header, index) => (
              <strong key={header} style={columnStyle(index)}>{header}</strong>
            ))}
          </span>
        </div>
        {terms.slice(0, finalPairStart).map(renderRow)}
        <div className="glossary-terms-node__final-pair">
          {terms.slice(finalPairStart).map((item, offset) => (
            renderRow(item, finalPairStart + offset)
          ))}
        </div>
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
      definitionWidth: {
        default: 33,
        parseHTML: (element) => parseTermWidth(
          element.getAttribute('data-glossary-definition-width'),
        ),
        renderHTML: (attributes) => ({
          'data-glossary-definition-width': attributes.definitionWidth,
        }),
      },
      preset: {
        default: 'default',
        parseHTML: (element) => parsePreset(element.getAttribute('data-glossary-preset')),
        renderHTML: (attributes) => ({ 'data-glossary-preset': attributes.preset }),
      },
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-glossary-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-glossary-show-instruction': String(attributes.showInstruction),
        }),
      },
      showExample: {
        default: true,
        // Documents saved before this attribute existed keep their example column.
        parseHTML: (element) => (
          element.getAttribute('data-glossary-show-example') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-glossary-show-example': String(attributes.showExample),
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
              definitionWidth: attrs.definitionWidth ?? 33,
              preset: attrs.preset ?? 'default',
              showInstruction: attrs.showInstruction ?? true,
              showExample: attrs.showExample ?? true,
            },
          }),
    };
  },
});
