"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';

export type TimetableRow = {
  id: string;
  service: string;
  time: string;
  destination: string;
  platform: string;
  notice: string;
};

export type TimetableAttrs = {
  instruction?: string | null;
  showInstruction: boolean;
  hideInstructionBadge: boolean;
  destinationLabel: string;
  platformLabel: string;
  noticeLabel: string;
  footer: string;
  rows: TimetableRow[];
};

export const DEFAULT_TIMETABLE_ROWS: TimetableRow[] = [
  {
    id: 'timetable-row-1',
    service: 'IC 5',
    time: '13.30',
    destination: 'Olten  Solothurn  Biel/Bienne  Lausanne',
    platform: '31',
    notice: '',
  },
  {
    id: 'timetable-row-2',
    service: 'IC 1',
    time: '13.32',
    destination: 'Bern  Lausanne  Genève-Aéroport',
    platform: '32',
    notice: '',
  },
  {
    id: 'timetable-row-3',
    service: 'IR 75',
    time: '13.35',
    destination: 'Thalwil  Baar  Zug  Rotkreuz  Luzern',
    platform: '6',
    notice: '',
  },
  {
    id: 'timetable-row-4',
    service: 'IR 17',
    time: '13.53',
    destination: 'Altstetten  Olten  Langenthal  Burgdorf  Bern',
    platform: '',
    notice: 'Ausfall',
  },
];

export const DEFAULT_TIMETABLE_ATTRS: TimetableAttrs = {
  instruction: null,
  showInstruction: true,
  hideInstructionBadge: false,
  destinationLabel: 'Nach',
  platformLabel: 'Gleis',
  noticeLabel: 'Hinweis',
  footer: 'Nach Olten: IC 5 nach Genève-Aéroport, Abfahrt 14.03 Uhr, Gleis 14',
  rows: DEFAULT_TIMETABLE_ROWS,
};

function defaultRows() {
  return DEFAULT_TIMETABLE_ROWS.map((row) => ({ ...row }));
}

function parseRows(value: string | null): TimetableRow[] {
  if (!value) return defaultRows();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultRows();
    const rows = parsed.flatMap((row, index): TimetableRow[] => (
      row && typeof row === 'object'
        ? [{
          id: typeof row.id === 'string' ? row.id : `timetable-row-${index + 1}`,
          service: typeof row.service === 'string' ? row.service : '',
          time: typeof row.time === 'string' ? row.time : '',
          destination: typeof row.destination === 'string' ? row.destination : '',
          platform: typeof row.platform === 'string' ? row.platform : '',
          notice: typeof row.notice === 'string' ? row.notice : '',
        }]
        : []
    ));
    return rows.length ? rows : defaultRows();
  } catch {
    return defaultRows();
  }
}

function textAttribute(key: keyof TimetableAttrs, name: string, fallback: string) {
  return {
    default: fallback,
    parseHTML: (element: HTMLElement) => (
      decodeURIComponent(element.getAttribute(name) ?? '')
    ),
    renderHTML: (attributes: TimetableAttrs) => ({
      [name]: encodeURIComponent(String(attributes[key] ?? '')),
    }),
  };
}

function TimetableNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as TimetableAttrs;
  return (
    <CustomBlockRoot selected={selected} className="timetable-node">
      {attrs.showInstruction && (
        <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
          {attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.timetable}
        </BlockInstruction>
      )}
      <div className="timetable-node__board">
        <div className="timetable-node__header" aria-hidden="true">
          <span />
          <span />
          <strong>{attrs.destinationLabel}</strong>
          <strong>{attrs.platformLabel}</strong>
          <strong>{attrs.noticeLabel}</strong>
        </div>
        <div className="timetable-node__rows">
          {attrs.rows.map((row) => (
            <div className="timetable-node__row" key={row.id}>
              <strong className="timetable-node__service">{row.service}</strong>
              <time className="timetable-node__time">{row.time}</time>
              <span className="timetable-node__destination">{row.destination}</span>
              <span className="timetable-node__platform">{row.platform}</span>
              <span className="timetable-node__notice">{row.notice}</span>
            </div>
          ))}
        </div>
        {attrs.footer && (
          <p className="timetable-node__footer">{attrs.footer}</p>
        )}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    timetable: {
      insertTimetable: (attrs?: Partial<TimetableAttrs>) => ReturnType;
    };
  }
}

export const Timetable = Node.create({
  name: 'timetable',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-show-instruction': String(attributes.showInstruction),
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-hide-instruction-badge': String(attributes.hideInstructionBadge),
        }),
      },
      destinationLabel: textAttribute(
        'destinationLabel',
        'data-destination-label',
        DEFAULT_TIMETABLE_ATTRS.destinationLabel,
      ),
      platformLabel: textAttribute(
        'platformLabel',
        'data-platform-label',
        DEFAULT_TIMETABLE_ATTRS.platformLabel,
      ),
      noticeLabel: textAttribute(
        'noticeLabel',
        'data-notice-label',
        DEFAULT_TIMETABLE_ATTRS.noticeLabel,
      ),
      footer: textAttribute('footer', 'data-footer', DEFAULT_TIMETABLE_ATTRS.footer),
      rows: {
        default: DEFAULT_TIMETABLE_ROWS,
        parseHTML: (element) => parseRows(element.getAttribute('data-rows')),
        renderHTML: (attributes) => ({
          'data-rows': encodeURIComponent(JSON.stringify(attributes.rows)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="timetable"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'timetable' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TimetableNodeView);
  },

  addCommands() {
    return {
      insertTimetable: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: {
          ...DEFAULT_TIMETABLE_ATTRS,
          ...attrs,
          rows: attrs.rows ?? defaultRows(),
        },
      }),
    };
  },
});