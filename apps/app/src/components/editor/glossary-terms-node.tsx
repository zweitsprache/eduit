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
import {
  resolveTranslatedText,
  useWorksheetViewLanguage,
} from '@/components/editor/worksheet-view-language';

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
  additional: string;
  example: string;
  // Per-language translated definitions, keyed by document-level language code.
  definitionTranslations?: Record<string, string>;
};

export type GlossaryHeaderLabels = string[];

export type GlossaryTermsAttrs = {
  terms: GlossaryTerm[];
  termWidth: GlossaryTermWidth;
  definitionWidth: GlossaryTermWidth;
  additionalWidth: GlossaryTermWidth;
  preset: GlossaryPreset;
  headerLabels: GlossaryHeaderLabels;
  showColumnHeaders: boolean;
  showInstruction: boolean;
  showExample: boolean;
  showAdditionalColumn: boolean;
};

function parseHeaderLabels(value: string | null): GlossaryHeaderLabels {
  if (!value) return [];
  try {
    const labels = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(labels)) return [];
    return labels
      .slice(0, 4)
      .map((label) => (typeof label === 'string' ? label : ''));
  } catch {
    return [];
  }
}

export function hasGlossaryAdditionalColumn(
  attrs: Pick<GlossaryTermsAttrs, 'preset' | 'showExample' | 'showAdditionalColumn'>,
) {
  return attrs.showAdditionalColumn
    && attrs.showExample
    && GLOSSARY_PRESETS[attrs.preset].headers.length === 3;
}

export function glossaryHeaders(
  attrs: Pick<GlossaryTermsAttrs, 'preset' | 'headerLabels' | 'showExample' | 'showAdditionalColumn'>,
) {
  const presetHeaders = GLOSSARY_PRESETS[attrs.preset].headers;
  const headers = presetHeaders.length === 3 && attrs.showExample
    ? hasGlossaryAdditionalColumn(attrs)
      ? [presetHeaders[0], presetHeaders[1], 'Zusatz', presetHeaders[2]]
      : [presetHeaders[0], presetHeaders[1], presetHeaders[2]]
    : [presetHeaders[0], presetHeaders[1]];
  return headers.map((header, index) => {
    const customLabel = attrs.headerLabels[index]?.trim();
    return customLabel?.length ? customLabel : header;
  });
}

/** Two-column layouts give the definition whatever the term column leaves over. */
export function glossaryColumnWidths(
  attrs: Pick<GlossaryTermsAttrs, 'preset' | 'termWidth' | 'definitionWidth' | 'additionalWidth' | 'showExample' | 'showAdditionalColumn'>,
) {
  const presetConfig = GLOSSARY_PRESETS[attrs.preset];
  const hasExample = presetConfig.headers.length === 3 && attrs.showExample;
  const hasAdditionalColumn = hasGlossaryAdditionalColumn(attrs);
  const termWidth = attrs.preset === 'default' ? attrs.termWidth : presetConfig.termWidth;
  const definitionWidth = attrs.preset === 'default'
    ? attrs.definitionWidth
    : presetConfig.definitionWidth;
  const additionalWidth = attrs.preset === 'default' ? attrs.additionalWidth : 20;
  return {
    hasExample,
    hasAdditionalColumn,
    widths: hasExample
      ? hasAdditionalColumn
        ? [
            termWidth,
            definitionWidth,
            additionalWidth,
            Math.max(1, 100 - termWidth - definitionWidth - additionalWidth),
          ]
        : [termWidth, definitionWidth, Math.max(1, 100 - termWidth - definitionWidth)]
      : [termWidth, Math.max(1, 100 - termWidth)],
  };
}

export const DEFAULT_GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    id: 'term-1',
    term: 'Term',
    definition: 'Definition',
    additional: 'Additional',
    example: 'Example',
  },
  {
    id: 'term-2',
    term: 'Term',
    definition: 'Definition',
    additional: 'Additional',
    example: 'Example',
  },
];

function defaultTerms(): GlossaryTerm[] {
  return DEFAULT_GLOSSARY_TERMS.map((term) => ({ ...term }));
}

function parseDefinitionTranslations(value: unknown): Record<string, string> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string');
  return entries.length ? Object.fromEntries(entries) : undefined;
}

function parseTerms(value: string | null): GlossaryTerm[] {
  if (!value) return defaultTerms();

  try {
    const terms = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(terms)) return defaultTerms();
    const parsed = terms.flatMap((term, index): GlossaryTerm[] => {
      if (!term || typeof term !== 'object') return [];
      return [{
        id: typeof term.id === 'string' ? term.id : `term-${index + 1}`,
        term: typeof term.term === 'string' ? term.term : '',
        definition: typeof term.definition === 'string' ? term.definition : '',
        additional: typeof term.additional === 'string' ? term.additional : '',
        example: typeof term.example === 'string' ? term.example : '',
        definitionTranslations: parseDefinitionTranslations(term.definitionTranslations),
      }];
    });
    return parsed.length ? parsed : defaultTerms();
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
  const { terms } = attrs;
  const viewLanguage = useWorksheetViewLanguage();
  const headers = glossaryHeaders(attrs);
  const {
    hasAdditionalColumn,
    hasExample,
    widths: columnWidths,
  } = glossaryColumnWidths(attrs);
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
        <span className="glossary-terms-node__cell" style={columnStyle(1)}>
          {resolveTranslatedText(item.definition, item.definitionTranslations, viewLanguage)}
        </span>
        {hasAdditionalColumn && (
          <span className="glossary-terms-node__cell" style={columnStyle(2)}>
            {item.additional}
          </span>
        )}
        {hasExample && (
          <span className="glossary-terms-node__cell" style={columnStyle(hasAdditionalColumn ? 3 : 2)}>
            {item.example}
          </span>
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
        {attrs.showColumnHeaders && (
          <div className="glossary-terms-node__header">
            <span className="glossary-terms-node__index-spacer" />
            <span className="glossary-terms-node__columns">
              {headers.map((header, index) => (
                <strong key={`${index}-${header}`} style={columnStyle(index)}>{header}</strong>
              ))}
            </span>
          </div>
        )}
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
      additionalWidth: {
        default: 20,
        parseHTML: (element) => parseTermWidth(
          element.getAttribute('data-glossary-additional-width'),
        ),
        renderHTML: (attributes) => ({
          'data-glossary-additional-width': attributes.additionalWidth,
        }),
      },
      preset: {
        default: 'default',
        parseHTML: (element) => parsePreset(element.getAttribute('data-glossary-preset')),
        renderHTML: (attributes) => ({ 'data-glossary-preset': attributes.preset }),
      },
      headerLabels: {
        default: [],
        parseHTML: (element) => parseHeaderLabels(
          element.getAttribute('data-glossary-header-labels'),
        ),
        renderHTML: (attributes) => ({
          'data-glossary-header-labels': encodeURIComponent(
            JSON.stringify(attributes.headerLabels ?? []),
          ),
        }),
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
      showColumnHeaders: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-glossary-show-column-headers') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-glossary-show-column-headers': String(
            attributes.showColumnHeaders,
          ),
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
      showAdditionalColumn: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-glossary-show-additional-column') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-glossary-show-additional-column': String(
            attributes.showAdditionalColumn,
          ),
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
              additionalWidth: attrs.additionalWidth ?? 20,
              preset: attrs.preset ?? 'default',
              headerLabels: attrs.headerLabels ?? [],
              showInstruction: attrs.showInstruction ?? true,
              showColumnHeaders: attrs.showColumnHeaders ?? true,
              showExample: attrs.showExample ?? true,
              showAdditionalColumn: attrs.showAdditionalColumn ?? false,
            },
          }),
    };
  },
});
