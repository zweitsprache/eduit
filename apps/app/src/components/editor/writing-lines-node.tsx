"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';

export type WritingLinesAttrs = {
  lineCount: number;
  lineHeight: number;
};

export const DEFAULT_WRITING_LINES_COUNT = 4;
export const MIN_WRITING_LINES_COUNT = 1;
export const MAX_WRITING_LINES_COUNT = 30;

export const DEFAULT_WRITING_LINE_HEIGHT = 40;
export const MIN_WRITING_LINE_HEIGHT = 16;
export const MAX_WRITING_LINE_HEIGHT = 120;

function parseLineCount(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return DEFAULT_WRITING_LINES_COUNT;
  return Math.min(
    MAX_WRITING_LINES_COUNT,
    Math.max(MIN_WRITING_LINES_COUNT, Math.round(count)),
  );
}

function parseLineHeight(value: unknown) {
  const height = Number(value);
  if (!Number.isFinite(height)) return DEFAULT_WRITING_LINE_HEIGHT;
  return Math.min(
    MAX_WRITING_LINE_HEIGHT,
    Math.max(MIN_WRITING_LINE_HEIGHT, Math.round(height)),
  );
}

function WritingLinesNodeView({ editor, getPos, node, selected }: NodeViewProps) {
  const attrs = node.attrs as WritingLinesAttrs;
  const lineCount = parseLineCount(attrs.lineCount);
  const lineHeight = parseLineHeight(attrs.lineHeight);

  return (
    <NodeViewWrapper
      className={`writing-lines-node${selected ? ' writing-lines-node--selected' : ''}`}
      data-drag-handle
      onClick={() => {
        const pos = getPos();
        if (typeof pos === 'number') editor.commands.setNodeSelection(pos);
      }}
    >
      {Array.from({ length: lineCount }, (_, index) => (
        <div
          className="writing-lines-node__line"
          key={index}
          style={{ height: `${lineHeight}px` }}
        />
      ))}
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    writingLines: {
      insertWritingLines: (attrs?: Partial<WritingLinesAttrs>) => ReturnType;
    };
  }
}

export const WritingLines = Node.create({
  name: 'writingLines',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      lineCount: {
        default: DEFAULT_WRITING_LINES_COUNT,
        parseHTML: (element) => parseLineCount(
          element.getAttribute('data-writing-lines-count'),
        ),
        renderHTML: (attributes) => ({
          'data-writing-lines-count': parseLineCount(attributes.lineCount),
        }),
      },
      lineHeight: {
        default: DEFAULT_WRITING_LINE_HEIGHT,
        parseHTML: (element) => parseLineHeight(
          element.getAttribute('data-writing-lines-height'),
        ),
        renderHTML: (attributes) => ({
          'data-writing-lines-height': parseLineHeight(attributes.lineHeight),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="writing-lines"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'writing-lines' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WritingLinesNodeView);
  },

  addCommands() {
    return {
      insertWritingLines:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              lineCount: parseLineCount(
                attrs.lineCount ?? DEFAULT_WRITING_LINES_COUNT,
              ),
              lineHeight: parseLineHeight(
                attrs.lineHeight ?? DEFAULT_WRITING_LINE_HEIGHT,
              ),
            },
          }),
    };
  },
});
