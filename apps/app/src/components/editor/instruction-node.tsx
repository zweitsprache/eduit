"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import {
  CUSTOM_BLOCK_NODE_GROUP,
} from '@/components/editor/custom-blocks/numbering';

export type InstructionBlockAttrs = {
  instruction: string;
};

export const DEFAULT_STANDALONE_INSTRUCTION = 'Add your instruction.';

function InstructionNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as InstructionBlockAttrs;

  return (
    <CustomBlockRoot selected={selected} className="instruction-node">
      <BlockInstruction>
        {attrs.instruction || DEFAULT_STANDALONE_INSTRUCTION}
      </BlockInstruction>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    instructionBlock: {
      insertInstructionBlock: (
        attrs?: Partial<InstructionBlockAttrs>,
      ) => ReturnType;
    };
  }
}

export const InstructionBlock = Node.create({
  name: 'instructionBlock',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_STANDALONE_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-instruction-text')
          ?? DEFAULT_STANDALONE_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-instruction-text': attributes.instruction,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="instruction-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'instruction-block',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InstructionNodeView);
  },

  addCommands() {
    return {
      insertInstructionBlock:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction:
                attrs.instruction ?? DEFAULT_STANDALONE_INSTRUCTION,
            },
          }),
    };
  },
});
