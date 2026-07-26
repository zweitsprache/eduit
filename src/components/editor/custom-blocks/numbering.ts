import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  ACTIVE_CUSTOM_BLOCK_BRAND,
  formatHeadingNumber,
  formatInstructionNumber,
} from '@/components/editor/custom-blocks/brand';

export const CUSTOM_BLOCK_GROUP = 'customBlock';
export const CUSTOM_BLOCK_NODE_GROUP = `block ${CUSTOM_BLOCK_GROUP}`;

function isCustomBlock(node: ProseMirrorNode) {
  return node.type.spec.group?.split(/\s+/).includes(CUSTOM_BLOCK_GROUP) ?? false;
}

function buildNumberingDecorations(doc: ProseMirrorNode) {
  const decorations: Decoration[] = [];
  let ordinal = 0;
  const headingCounters = [0, 0, 0, 0, 0, 0];

  doc.descendants((node, pos) => {
    if (node.type.name === 'customHeading') {
      // Activity numbering is scoped to the current heading section.
      ordinal = 0;
      const level = Math.min(5, Math.max(1, Number(node.attrs.level) || 1));
      if (!node.attrs.numbered) {
        // An unnumbered heading still starts a new hierarchy branch.
        // Reset its own level and every descendant level.
        headingCounters.fill(0, level - 1);
        return false;
      }
      headingCounters[level - 1] += 1;
      // A heading always restarts the counters of its descendant levels.
      headingCounters.fill(0, level);
      const parts = headingCounters.slice(0, level);
      const label = formatHeadingNumber(
        parts,
        ACTIVE_CUSTOM_BLOCK_BRAND.headingNumberFormats,
      );
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {
        'data-heading-number': label,
        style: `--heading-number-label: "${label}";`,
      }));
      return false;
    }

    if (!isCustomBlock(node)) return true;

    ordinal += 1;
    const label = formatInstructionNumber(
      ordinal,
      ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberFormat,
    );
    decorations.push(Decoration.node(pos, pos + node.nodeSize, {
      'data-custom-block-ordinal': String(ordinal),
      style: `--custom-block-instruction-label: "${label}"`,
    }));
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

export const CustomBlockNumbering = Extension.create({
  name: 'customBlockNumbering',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('customBlockNumbering'),
        state: {
          init: (_, state) => buildNumberingDecorations(state.doc),
          apply: (transaction, decorations, _oldState, newState) => (
            transaction.docChanged
              ? buildNumberingDecorations(newState.doc)
              : decorations
          ),
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
