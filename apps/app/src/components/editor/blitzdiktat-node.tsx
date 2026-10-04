"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReplaceStep, ReplaceAroundStep } from '@tiptap/pm/transform';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type BlitzdiktatItem = {
  id: string;
  text: string;
};

export type BlitzdiktatTextSize = 'xs' | 's' | 'm' | 'l' | 'xl';

export type BlitzdiktatAttrs = {
  items: BlitzdiktatItem[];
  textSize: BlitzdiktatTextSize;
  groupIndex: number;
  groupSize: number;
  groupId: string;
};

export const DEFAULT_BLITZDIKTAT_ITEMS: BlitzdiktatItem[] = [
  { id: 'blitzdiktat-1', text: 'Haus' },
  { id: 'blitzdiktat-2', text: 'Baum' },
  { id: 'blitzdiktat-3', text: 'Auto' },
  { id: 'blitzdiktat-4', text: 'Schule' },
  { id: 'blitzdiktat-5', text: 'Garten' },
];

// Each cell is one full card (no domino-style half-card split), so the grid
// uses half as many columns as the domino grid for the same card width.
const GRID_COLUMNS = 3;
const GRID_ROWS = 4;
export const GRID_CELLS = GRID_COLUMNS * GRID_ROWS;
export const BLITZDIKTAT_MAX_ITEMS = 200;

function defaultItems() {
  return DEFAULT_BLITZDIKTAT_ITEMS.map((item) => ({ ...item }));
}

function newGroupId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `blitzdiktat-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseItems(value: string | null): BlitzdiktatItem[] {
  if (!value) return defaultItems();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultItems();
    return parsed
      .filter(
        (item): item is { id?: unknown; text?: unknown } =>
          item !== null && typeof item === 'object',
      )
      .map((item, index) => ({
        id: typeof item.id === 'string' ? item.id : `blitzdiktat-${index + 1}`,
        text: typeof item.text === 'string' ? item.text : '',
      }));
  } catch {
    return defaultItems();
  }
}

export function blitzdiktatGroupSize(items: BlitzdiktatItem[]): number {
  return Math.max(1, Math.ceil(items.length / GRID_CELLS));
}

function BlitzdiktatGridView({
  items,
  textSize,
}: {
  items: BlitzdiktatItem[];
  textSize: BlitzdiktatTextSize;
}) {
  return (
    <div className="blitzdiktat-node__grid">
      {Array.from({ length: GRID_CELLS }, (_, index) => {
        const item = items[index];
        return (
          <div
            key={index}
            className={[
              'blitzdiktat-node__cell',
              item ? `blitzdiktat-node__cell--text-${textSize}` : 'blitzdiktat-node__cell--empty',
            ].join(' ')}
          >
            {item && (
              <span className="blitzdiktat-node__cell-text">{item.text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BlitzdiktatNodeView({ node, selected }: NodeViewProps) {
  const { items, textSize, groupIndex } = node.attrs as BlitzdiktatAttrs;
  const pageStart = groupIndex * GRID_CELLS;
  const pageEnd = Math.min(pageStart + GRID_CELLS, items.length);
  const pageItems = items.slice(pageStart, pageEnd);

  return (
    <CustomBlockRoot selected={selected} className="blitzdiktat-node">
      <BlitzdiktatGridView items={pageItems} textSize={textSize} />
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blitzdiktat: {
      insertBlitzdiktat: (attrs?: Partial<BlitzdiktatAttrs>) => ReturnType;
    };
  }
}

export const Blitzdiktat = Node.create({
  name: 'blitzdiktat',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_BLITZDIKTAT_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-blitzdiktat-items'),
        ),
        renderHTML: (attributes) => ({
          'data-blitzdiktat-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
      textSize: {
        default: 'm',
        parseHTML: (element) => {
          const value = element.getAttribute('data-blitzdiktat-text-size');
          return ['xs', 's', 'm', 'l', 'xl'].includes(value ?? '') ? value : 'm';
        },
        renderHTML: (attributes) => ({
          'data-blitzdiktat-text-size': attributes.textSize,
        }),
      },
      groupIndex: {
        default: 0,
        parseHTML: (element) => (
          Number(element.getAttribute('data-blitzdiktat-group-index')) || 0
        ),
        renderHTML: (attributes) => ({
          'data-blitzdiktat-group-index': String(attributes.groupIndex),
        }),
      },
      groupSize: {
        default: 1,
        parseHTML: (element) => (
          Number(element.getAttribute('data-blitzdiktat-group-size')) || 1
        ),
        renderHTML: (attributes) => ({
          'data-blitzdiktat-group-size': String(attributes.groupSize),
        }),
      },
      groupId: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-blitzdiktat-group-id') ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-blitzdiktat-group-id': attributes.groupId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="blitzdiktat"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'blitzdiktat' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlitzdiktatNodeView);
  },

  addCommands() {
    return {
      insertBlitzdiktat:
        (attrs = {}) =>
        ({ commands }) => {
          const items = attrs.items ?? defaultItems();
          return commands.insertContent({
            type: this.name,
            attrs: {
              items,
              textSize: attrs.textSize ?? 'm',
              groupIndex: attrs.groupIndex ?? 0,
              groupSize: attrs.groupSize ?? 1,
              groupId: attrs.groupId ?? newGroupId(),
            },
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('blitzdiktatSync'),
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true;
          const blitzdiktatType = state.schema.nodes.blitzdiktat;
          if (!blitzdiktatType) return true;

          const changedGroupIds = new Set<string>();
          tr.steps.forEach((step) => {
            if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) return;
            step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
              tr.doc.nodesBetween(newStart, newEnd, (node) => {
                if (node.type.name === 'blitzdiktat' && node.attrs.groupId) {
                  changedGroupIds.add(node.attrs.groupId as string);
                }
              });
            });
          });

          if (changedGroupIds.size === 0) return true;

          changedGroupIds.forEach((groupId) => {
            const nodes: { node: ProseMirrorNode; pos: number }[] = [];
            tr.doc.descendants((node, pos) => {
              if (node.type.name === 'blitzdiktat' && node.attrs.groupId === groupId) {
                nodes.push({ node, pos });
              }
            });
            if (nodes.length <= 1) return;

            // Use the first node's items as the source of truth.
            const source = nodes[0].node;
            const items = source.attrs.items as BlitzdiktatItem[];
            const textSize = source.attrs.textSize as BlitzdiktatTextSize;
            const groupSize = blitzdiktatGroupSize(items);

            nodes.forEach(({ node, pos }, index) => {
              if (
                node.attrs.items !== items
                || node.attrs.textSize !== textSize
                || node.attrs.groupSize !== groupSize
                || node.attrs.groupIndex !== index
              ) {
                tr.setNodeAttribute(pos, 'items', items);
                tr.setNodeAttribute(pos, 'textSize', textSize);
                tr.setNodeAttribute(pos, 'groupSize', groupSize);
                tr.setNodeAttribute(pos, 'groupIndex', index);
              }
            });
          });

          return true;
        },
      }),
    ];
  },
});
