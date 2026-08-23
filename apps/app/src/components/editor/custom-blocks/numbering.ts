import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  ACTIVE_CUSTOM_BLOCK_BRAND,
  formatInstructionNumber,
  type HeadingNumberFormats,
  type InstructionNumberFormat,
} from '@/components/editor/custom-blocks/brand';

export const CUSTOM_BLOCK_GROUP = 'customBlock';
export const CUSTOM_BLOCK_NODE_GROUP = `block ${CUSTOM_BLOCK_GROUP}`;

type NumberingBrand = {
  headingNumberFormats: HeadingNumberFormats;
  instructionNumberFormat: InstructionNumberFormat;
};

const numberingPluginKey = new PluginKey<{
  brand: NumberingBrand;
  decorations: DecorationSet;
}>('customBlockNumbering');

function isCustomBlock(node: ProseMirrorNode) {
  return node.type.spec.group?.split(/\s+/).includes(CUSTOM_BLOCK_GROUP) ?? false;
}

function buildNumberingDecorations(
  doc: ProseMirrorNode,
  brand: NumberingBrand,
) {
  const decorations: Decoration[] = [];
  let ordinal = 0;
  const headingCounters = [0, 0, 0, 0, 0, 0];

  doc.descendants((node, pos) => {
    if (node.type.name === 'customHeading') {
      // Activity numbering is scoped to the current heading section unless the
      // heading explicitly opts out of restarting instruction numbering.
      if (node.attrs.restartInstructionNumbering !== false) {
        ordinal = 0;
      }
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
      const label = formatInstructionNumber(
        headingCounters[level - 1],
        brand.headingNumberFormats[
          level as keyof HeadingNumberFormats
        ],
      );
      decorations.push(Decoration.node(pos, pos + node.nodeSize, {
        'data-heading-number': label,
        style: `--heading-number-label: "${label}";`,
      }));
      return false;
    }

    if (!isCustomBlock(node)) return true;
    if (node.type.name === 'messenger') return false;
    if (node.attrs.showInstruction === false) return false;
    if (node.attrs.hideInstructionBadge === true) return false;

    const isArticlePluralContinuation = (
      node.type.name === 'articlePlural'
      && node.attrs.continuation === true
    );
    const hasAdditionalArticlePluralInstruction = (
      node.type.name === 'articlePlural'
      && Array.isArray(node.attrs.rows)
      && node.attrs.rows.length <= 19
    );
    if (isArticlePluralContinuation && !hasAdditionalArticlePluralInstruction) return false;

    if (!isArticlePluralContinuation) ordinal += 1;
    const label = formatInstructionNumber(
      ordinal,
      brand.instructionNumberFormat,
    );
    if (isArticlePluralContinuation) ordinal += 1;
    const additionalLabel = hasAdditionalArticlePluralInstruction
      ? formatInstructionNumber(
        isArticlePluralContinuation ? ordinal : ordinal + 1,
        brand.instructionNumberFormat,
      )
      : null;
    decorations.push(Decoration.node(pos, pos + node.nodeSize, {
      'data-custom-block-ordinal': String(ordinal),
      style: [
        `--custom-block-instruction-label: "${label}"`,
        additionalLabel
          ? `--article-plural-additional-instruction-label: "${additionalLabel}"`
          : '',
      ].filter(Boolean).join(';'),
    }));
    if (hasAdditionalArticlePluralInstruction && !isArticlePluralContinuation) ordinal += 1;
    return false;
  });

  return DecorationSet.create(doc, decorations);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    customBlockNumbering: {
      setCustomBlockNumberingBrand: (brand: NumberingBrand) => ReturnType;
    };
  }
}

export const CustomBlockNumbering = Extension.create({
  name: 'customBlockNumbering',

  addCommands() {
    return {
      setCustomBlockNumberingBrand:
        (brand) =>
        ({ dispatch, tr }) => {
          if (dispatch) tr.setMeta(numberingPluginKey, brand);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const defaultBrand: NumberingBrand = {
      headingNumberFormats: ACTIVE_CUSTOM_BLOCK_BRAND.headingNumberFormats,
      instructionNumberFormat:
        ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberFormat,
    };
    return [
      new Plugin({
        key: numberingPluginKey,
        state: {
          init: (_, state) => ({
            brand: defaultBrand,
            decorations: buildNumberingDecorations(state.doc, defaultBrand),
          }),
          apply: (transaction, pluginState, _oldState, newState) => {
            const brand = transaction.getMeta(numberingPluginKey) as
              NumberingBrand | undefined;
            const nextBrand = brand ?? pluginState.brand;
            return {
              brand: nextBrand,
              decorations: transaction.docChanged || brand
                ? buildNumberingDecorations(newState.doc, nextBrand)
                : pluginState.decorations,
            };
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)?.decorations ?? null;
          },
        },
      }),
    ];
  },
});
