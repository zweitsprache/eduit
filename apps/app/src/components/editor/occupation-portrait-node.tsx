"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type OccupationPortraitTextType = 'self-portrait' | 'portrait';

export type OccupationPortraitAttrs = {
  profession: string;
  title: string;
  paragraphs: string[];
  sourceUrl: string;
  proficiencyLevel: string;
  proficiencyPhase: string;
  textType: OccupationPortraitTextType;
};

export const DEFAULT_OCCUPATION_PORTRAIT_ATTRS: OccupationPortraitAttrs = {
  profession: 'Kaufmann/-frau EFZ',
  title: 'Mein Beruf',
  paragraphs: ['Hier entsteht ein Berufsporträt.'],
  sourceUrl: 'https://www.berufsberatung.ch/de/suche/berufe',
  proficiencyLevel: 'A2.1',
  proficiencyPhase: 'beginning',
  textType: 'self-portrait',
};

function parseParagraphs(value: string | null) {
  if (!value) return DEFAULT_OCCUPATION_PORTRAIT_ATTRS.paragraphs;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string')
      : DEFAULT_OCCUPATION_PORTRAIT_ATTRS.paragraphs;
  } catch {
    return DEFAULT_OCCUPATION_PORTRAIT_ATTRS.paragraphs;
  }
}

function OccupationPortraitNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as OccupationPortraitAttrs;
  return (
    <CustomBlockRoot selected={selected} className="occupation-portrait-node">
      <h3 className="occupation-portrait-node__title">{attrs.title}</h3>
      <div className="occupation-portrait-node__body">
        {attrs.paragraphs.map((paragraph, index) => (
          <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
        ))}
      </div>
      <a
        className="occupation-portrait-node__source"
        href={attrs.sourceUrl}
        rel="noreferrer"
        target="_blank"
      >
        Quelle: berufsberatung.ch
      </a>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    occupationPortrait: {
      insertOccupationPortrait: (
        attrs?: Partial<OccupationPortraitAttrs>,
      ) => ReturnType;
    };
  }
}

export const OccupationPortrait = Node.create({
  name: 'occupationPortrait',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      profession: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.profession,
        parseHTML: (element) => element.getAttribute('data-profession') ?? '',
        renderHTML: ({ profession }) => ({ 'data-profession': profession }),
      },
      title: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.title,
        parseHTML: (element) => element.getAttribute('data-title') ?? '',
        renderHTML: ({ title }) => ({ 'data-title': title }),
      },
      paragraphs: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.paragraphs,
        parseHTML: (element) => parseParagraphs(
          element.getAttribute('data-paragraphs'),
        ),
        renderHTML: ({ paragraphs }) => ({
          'data-paragraphs': encodeURIComponent(JSON.stringify(paragraphs)),
        }),
      },
      sourceUrl: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.sourceUrl,
        parseHTML: (element) => element.getAttribute('data-source-url') ?? '',
        renderHTML: ({ sourceUrl }) => ({ 'data-source-url': sourceUrl }),
      },
      proficiencyLevel: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.proficiencyLevel,
        parseHTML: (element) => (
          element.getAttribute('data-proficiency-level') ?? 'A2.1'
        ),
        renderHTML: ({ proficiencyLevel }) => ({
          'data-proficiency-level': proficiencyLevel,
        }),
      },
      proficiencyPhase: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.proficiencyPhase,
        parseHTML: (element) => (
          element.getAttribute('data-proficiency-phase') ?? 'beginning'
        ),
        renderHTML: ({ proficiencyPhase }) => ({
          'data-proficiency-phase': proficiencyPhase,
        }),
      },
      textType: {
        default: DEFAULT_OCCUPATION_PORTRAIT_ATTRS.textType,
        parseHTML: (element) => (
          element.getAttribute('data-text-type') === 'portrait'
            ? 'portrait'
            : 'self-portrait'
        ),
        renderHTML: ({ textType }) => ({ 'data-text-type': textType }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="occupation-portrait"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'occupation-portrait',
    })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(OccupationPortraitNodeView);
  },
  addCommands() {
    return {
      insertOccupationPortrait: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: { ...DEFAULT_OCCUPATION_PORTRAIT_ATTRS, ...attrs },
        })
      ),
    };
  },
});
