"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

export type SpacerAttrs = {
  height: number;
};

export const DEFAULT_SPACER_HEIGHT = 32;
export const MAX_SPACER_HEIGHT = 400;

function parseHeight(value: unknown) {
  const height = Number(value);
  if (!Number.isFinite(height)) return DEFAULT_SPACER_HEIGHT;
  return Math.min(MAX_SPACER_HEIGHT, Math.max(0, Math.round(height)));
}

function SpacerNodeView({ editor, getPos, node, selected }: NodeViewProps) {
  const attrs = node.attrs as SpacerAttrs;

  return (
    <NodeViewWrapper
      className={`spacer-node${selected ? ' spacer-node--selected' : ''}`}
      data-drag-handle
      onClick={() => {
        const pos = getPos();
        if (typeof pos === 'number') editor.commands.setNodeSelection(pos);
      }}
      style={{ height: `${parseHeight(attrs.height)}px` }}
    />
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    spacer: {
      insertSpacer: (attrs?: Partial<SpacerAttrs>) => ReturnType;
    };
  }
}

export const Spacer = Node.create({
  name: 'spacer',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      height: {
        default: DEFAULT_SPACER_HEIGHT,
        parseHTML: (element) => parseHeight(
          element.getAttribute('data-spacer-height'),
        ),
        renderHTML: (attributes) => ({
          'data-spacer-height': parseHeight(attributes.height),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="spacer"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'spacer' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpacerNodeView);
  },

  addCommands() {
    return {
      insertSpacer:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              height: parseHeight(attrs.height ?? DEFAULT_SPACER_HEIGHT),
            },
          }),
    };
  },
});
