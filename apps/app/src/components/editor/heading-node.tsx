"use client";

import { createElement } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { cx } from '@/utils/cx';

export type CustomHeadingLevel = 1 | 2 | 3 | 4 | 5;

export type CustomHeadingAttrs = {
  text: string;
  level: CustomHeadingLevel;
  numbered: boolean;
};

function parseLevel(value: string | null): CustomHeadingLevel {
  const level = Number(value);
  return level >= 1 && level <= 5 ? level as CustomHeadingLevel : 2;
}

function CustomHeadingNodeView({ node, selected }: NodeViewProps) {
  const { text, level, numbered } = node.attrs as CustomHeadingAttrs;

  return (
    <NodeViewWrapper
      className={cx(
        'heading-node',
        `heading-node--h${level}`,
        numbered && 'heading-node--numbered',
        selected && 'heading-node--selected',
      )}
      data-drag-handle
    >
      {createElement(
        `h${level}`,
        { className: 'heading-node__content' },
        text || 'Heading',
      )}
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customHeading: {
      insertCustomHeading: (attrs?: Partial<CustomHeadingAttrs>) => ReturnType;
    };
  }
}

export const CustomHeading = Node.create({
  name: 'customHeading',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      text: {
        default: 'Heading',
        parseHTML: (element) => element.getAttribute('data-heading-text') ?? 'Heading',
        renderHTML: (attributes) => ({ 'data-heading-text': attributes.text }),
      },
      level: {
        default: 2,
        parseHTML: (element) => parseLevel(element.getAttribute('data-heading-level')),
        renderHTML: (attributes) => ({ 'data-heading-level': attributes.level }),
      },
      numbered: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-heading-numbered') === 'true',
        renderHTML: (attributes) => ({
          'data-heading-numbered': String(attributes.numbered),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="custom-heading"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'custom-heading' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CustomHeadingNodeView);
  },

  addCommands() {
    return {
      insertCustomHeading:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              text: attrs.text ?? 'Heading',
              level: attrs.level ?? 2,
              numbered: attrs.numbered ?? false,
            },
          }),
    };
  },
});
