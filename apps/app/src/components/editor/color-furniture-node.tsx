"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  BlockRow,
  BlockRowLabel,
  BlockRows,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  FurnitureColorIcon,
} from '@/components/editor/furniture-color-icon';
import {
  FURNITURE_COLORS,
  FURNITURE_KINDS,
  generateColorFurnitureItems,
  type ColorFurnitureItem,
  type ColorFurnitureMode,
} from '@/lib/color-furniture-activities';

export type ColorFurnitureAttrs = {
  instruction: string;
  mode: ColorFurnitureMode;
  items: ColorFurnitureItem[];
  itemStart: number;
  paginationPart: 'combined' | 'cards' | 'tasks';
  showCards: boolean;
  showInstruction: boolean;
  showTasks: boolean;
};

export const DEFAULT_COLOR_FURNITURE_ATTRS: ColorFurnitureAttrs = {
  instruction: 'Wähle die Aussage, die zum Bild passt.',
  mode: 'mcq',
  itemStart: 0,
  paginationPart: 'combined',
  showCards: true,
  showInstruction: true,
  showTasks: true,
  items: generateColorFurnitureItems({
    count: 4,
    mode: 'mcq',
    furnitureKinds: ['sofaSingle', 'table', 'chair', 'bed'],
    colors: ['red', 'blue', 'green', 'yellow'],
  }),
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function ColorFurnitureNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as ColorFurnitureAttrs;
  const rawItemStart = Number(attrs.itemStart);
  const itemStart = Number.isFinite(rawItemStart) ? rawItemStart : 0;
  const showCards = attrs.showCards !== false;
  const showInstruction = attrs.showInstruction !== false;
  const showTasks = attrs.showTasks !== false;
  const cardRows = Array.from(
    { length: Math.ceil(attrs.items.length / 4) },
    (_, rowIndex) => attrs.items.slice(rowIndex * 4, rowIndex * 4 + 4),
  );
  return (
    <CustomBlockRoot
      selected={selected}
      className={[
        'color-furniture-node',
        attrs.mode === 'trueFalse' ? 'mch-node true-false-node' : '',
        attrs.mode === 'mcq' ? 'mcq-node' : '',
        showInstruction ? '' : 'color-furniture-node--continuation',
        !showCards && showTasks
          ? 'color-furniture-node--tasks-only'
          : '',
      ].join(' ')}
    >
      {showInstruction ? (
        <BlockInstruction>{attrs.instruction}</BlockInstruction>
      ) : null}
      {showCards ? <div className="color-furniture-node__cards">
        {cardRows.map((row, rowIndex) => (
          <div className="color-furniture-node__cards-row" key={row[0]?.id}>
            {row.map((item, itemIndex) => {
              const furniture = FURNITURE_KINDS.find(
                ({ value }) => value === item.furniture,
              );
              const color = FURNITURE_COLORS.find(
                ({ value }) => value === item.color,
              );
              const index = itemStart + rowIndex * 4 + itemIndex;
              return (
                <div className="color-furniture-node__card-wrap" key={item.id}>
                  <div className="color-furniture-node__number-row">
                    <span className="custom-block__row-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="color-furniture-node__card">
                    <FurnitureColorIcon
                      alt={`${furniture?.label ?? item.furniture}, ${color?.label ?? item.color}`}
                      className="color-furniture-node__image"
                      color={color?.hex ?? '#8b8d98'}
                      src={furniture?.icon ?? '/moebel/005-chair.svg'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div> : null}
      {showTasks && attrs.mode === 'mcq' ? (
        <div className="color-furniture-node__mcq custom-block__matrix-layout">
          {attrs.items.map((item) => (
            <div className="mcq-node__question" key={item.id}>
              <BlockRows columns={3}>
                {item.options.map((option) => (
                  <BlockRow
                    index={item.options.indexOf(option)}
                    key={option.id}
                  >
                    <BlockChoiceIndicator checked={false} />
                    <BlockRowLabel>{option.text}</BlockRowLabel>
                  </BlockRow>
                ))}
              </BlockRows>
            </div>
          ))}
        </div>
      ) : showTasks ? (
        <div className="color-furniture-node__tf-matrix custom-block__matrix-layout">
          <div className="mch-node__header">
            <span aria-hidden="true" className="mch-node__index-spacer" />
            <span aria-hidden="true" className="mch-node__label-spacer" />
            <div className="mch-node__option-columns" data-columns="2">
              <strong className="mch-node__header-option">Richtig</strong>
              <strong className="mch-node__header-option">Falsch</strong>
            </div>
          </div>
          <BlockRows>
            {attrs.items.map((item, index) => (
              <BlockRow index={itemStart + index} key={item.id}>
                <BlockRowLabel>{item.statement}</BlockRowLabel>
                <div className="mch-node__option-columns" data-columns="2">
                  <span className="mch-node__choice">
                    <BlockChoiceIndicator checked={false} />
                  </span>
                  <span className="mch-node__choice">
                    <BlockChoiceIndicator checked={false} />
                  </span>
                </div>
              </BlockRow>
            ))}
          </BlockRows>
        </div>
      ) : null}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    colorFurniture: {
      insertColorFurniture: (attrs?: Partial<ColorFurnitureAttrs>) => ReturnType;
    };
  }
}

export const ColorFurniture = Node.create({
  name: 'colorFurniture',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_COLOR_FURNITURE_ATTRS.instruction,
        parseHTML: (element) => element.getAttribute('data-instruction')
          ?? DEFAULT_COLOR_FURNITURE_ATTRS.instruction,
        renderHTML: ({ instruction }) => ({ 'data-instruction': instruction }),
      },
      mode: {
        default: DEFAULT_COLOR_FURNITURE_ATTRS.mode,
        parseHTML: (element) => element.getAttribute('data-mode') ?? 'mcq',
        renderHTML: ({ mode }) => ({ 'data-mode': mode }),
      },
      items: {
        default: DEFAULT_COLOR_FURNITURE_ATTRS.items,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-items'),
          DEFAULT_COLOR_FURNITURE_ATTRS.items,
        ),
        renderHTML: ({ items }) => ({
          'data-items': encodeURIComponent(JSON.stringify(items)),
        }),
      },
      itemStart: {
        default: 0,
        parseHTML: (element) => {
          const value = Number(element.getAttribute('data-item-start') ?? 0);
          return Number.isFinite(value) ? value : 0;
        },
        renderHTML: ({ itemStart }) => ({
          'data-item-start': String(itemStart),
        }),
      },
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-show-instruction') !== 'false'
        ),
        renderHTML: ({ showInstruction }) => ({
          'data-show-instruction': String(showInstruction),
        }),
      },
      showCards: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-show-cards') !== 'false',
        renderHTML: ({ showCards }) => ({ 'data-show-cards': String(showCards) }),
      },
      showTasks: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-show-tasks') !== 'false',
        renderHTML: ({ showTasks }) => ({ 'data-show-tasks': String(showTasks) }),
      },
      paginationPart: {
        default: 'combined',
        parseHTML: (element) => (
          element.getAttribute('data-pagination-part') ?? 'combined'
        ),
        renderHTML: ({ paginationPart }) => ({
          'data-pagination-part': paginationPart,
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="color-furniture"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'color-furniture',
    })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(ColorFurnitureNodeView);
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => (
            transaction.docChanged
            || transaction.getMeta('splitOversizedColorFurniture')
          ))) {
            return null;
          }
          const topLevel: Array<{
            attrs: ColorFurnitureAttrs;
            node: typeof newState.doc;
            nodeSize: number;
            pos: number;
          }> = [];
          newState.doc.forEach((node, pos) => {
            topLevel.push({
              attrs: node.attrs as ColorFurnitureAttrs,
              node: node as typeof newState.doc,
              nodeSize: node.nodeSize,
              pos,
            });
          });
          const replacements: Array<{
            attrs: ColorFurnitureAttrs;
            from: number;
            items: ColorFurnitureItem[];
            to: number;
          }> = [];
          for (let index = 0; index < topLevel.length; index += 1) {
            const entry = topLevel[index];
            if (
              entry.node.type.name !== this.name
              || (entry.attrs.paginationPart ?? 'combined') !== 'combined'
            ) continue;
            const items = [...entry.attrs.items];
            let endIndex = index;
            while (
              endIndex + 1 < topLevel.length
              && topLevel[endIndex + 1].node.type.name === this.name
              && (
                topLevel[endIndex + 1].attrs.paginationPart ?? 'combined'
              ) === 'combined'
              && topLevel[endIndex + 1].attrs.showInstruction === false
            ) {
              endIndex += 1;
              items.push(...topLevel[endIndex].attrs.items);
            }
            if (items.length > 4 || endIndex > index) {
              const last = topLevel[endIndex];
              replacements.push({
                attrs: entry.attrs,
                from: entry.pos,
                items,
                to: last.pos + last.nodeSize,
              });
            }
            index = endIndex;
          }
          const invalidStarts: Array<{ itemStart: number; pos: number }> = [];
          let nextContinuationStart = 0;
          newState.doc.forEach((node, pos) => {
            if (node.type.name !== this.name) {
              nextContinuationStart = 0;
              return;
            }
            const attrs = node.attrs as ColorFurnitureAttrs;
            if (attrs.showInstruction !== false) nextContinuationStart = 0;
            const rawStart = Number(attrs.itemStart);
            const normalizedStart = Number.isFinite(rawStart)
              ? rawStart
              : nextContinuationStart;
            if (!Number.isFinite(rawStart) && attrs.items.length <= 4) {
              invalidStarts.push({ itemStart: normalizedStart, pos });
            }
            nextContinuationStart = normalizedStart + attrs.items.length;
          });
          if (!replacements.length && !invalidStarts.length) return null;

          const transaction = newState.tr;
          for (const entry of invalidStarts) {
            transaction.setNodeAttribute(
              entry.pos,
              'itemStart',
              entry.itemStart,
            );
          }
          for (const entry of replacements.reverse()) {
            const rawItemStart = Number(entry.attrs.itemStart);
            const itemStart = Number.isFinite(rawItemStart) ? rawItemStart : 0;
            const chunks = Array.from(
              { length: Math.ceil(entry.items.length / 4) },
              (_, index) => entry.items.slice(index * 4, index * 4 + 4),
            );
            transaction.replaceWith(
              entry.from,
              entry.to,
              [
                ...chunks.map((items, index) => (
                  newState.schema.nodes.colorFurniture.create({
                    ...entry.attrs,
                    items,
                    itemStart: itemStart + index * 4,
                    paginationPart: 'cards',
                    showCards: true,
                    showInstruction: index === 0
                      ? entry.attrs.showInstruction
                      : false,
                    showTasks: false,
                  })
                )),
                ...chunks.map((items, index) => (
                  newState.schema.nodes.colorFurniture.create({
                    ...entry.attrs,
                    items,
                    itemStart: itemStart + index * 4,
                    paginationPart: 'tasks',
                    showCards: false,
                    showInstruction: false,
                    showTasks: true,
                  })
                )),
              ],
            );
          }
          return transaction;
        },
        view: (view) => {
          queueMicrotask(() => {
            if (!view.isDestroyed) {
              view.dispatch(
                view.state.tr.setMeta('splitOversizedColorFurniture', true),
              );
            }
          });
          return {};
        },
      }),
    ];
  },
  addCommands() {
    return {
      insertColorFurniture: (attrs = {}) => ({ commands }) => (
        commands.insertContent({
          type: this.name,
          attrs: { ...DEFAULT_COLOR_FURNITURE_ATTRS, ...attrs },
        })
      ),
    };
  },
});
