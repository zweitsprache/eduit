"use client";

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Plugin } from '@tiptap/pm/state';
import {
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import {
  type WorksheetTableColumn,
  type WorksheetTableRow,
} from '@/components/editor/worksheet-table-node';

export type InformationGapActivityAttrs = {
  activityId: string;
  title: string;
  partner: 'A' | 'B';
  columns: WorksheetTableColumn[];
  rows: WorksheetTableRow[];
};

export const DEFAULT_INFORMATION_GAP_COLUMNS: WorksheetTableColumn[] = [
  { id: 'info-gap-day', label: 'Day', span: 4, align: 'left' },
  { id: 'info-gap-time', label: 'Time', span: 4, align: 'left', useTabularNums: true },
  { id: 'info-gap-person', label: 'Person', span: 6, align: 'left' },
  { id: 'info-gap-place', label: 'Place', span: 6, align: 'left' },
  { id: 'info-gap-activity', label: 'Activity', span: 4, align: 'left' },
];

export const DEFAULT_INFORMATION_GAP_ROWS: WorksheetTableRow[] = [
  {
    id: 'info-gap-header',
    isHeader: true,
    cells: {
      'info-gap-day': 'Day',
      'info-gap-time': 'Time',
      'info-gap-person': 'Person',
      'info-gap-place': 'Place',
      'info-gap-activity': 'Activity',
    },
  },
  {
    id: 'info-gap-row-1',
    isHeader: false,
    cells: {
      'info-gap-day': 'Monday',
      'info-gap-time': '09:00 – 10:30',
      'info-gap-person': 'Mia',
      'info-gap-place': 'Library',
      'info-gap-activity': 'Study group',
    },
  },
  {
    id: 'info-gap-row-2',
    isHeader: false,
    cells: {
      'info-gap-day': 'Tuesday',
      'info-gap-time': '14:30 – 16:00',
      'info-gap-person': 'Jonas',
      'info-gap-place': 'Sports hall',
      'info-gap-activity': 'Basketball',
    },
  },
  {
    id: 'info-gap-row-3',
    isHeader: false,
    cells: {
      'info-gap-day': 'Thursday',
      'info-gap-time': '17:00 – 18:30',
      'info-gap-person': 'Leila',
      'info-gap-place': 'Cafe Central',
      'info-gap-activity': 'Language exchange',
    },
  },
  {
    id: 'info-gap-row-4',
    isHeader: false,
    cells: {
      'info-gap-day': 'Friday',
      'info-gap-time': '19:30 – 21:00',
      'info-gap-person': 'Noah',
      'info-gap-place': 'City cinema',
      'info-gap-activity': 'Watch a film',
    },
  },
];

function defaultColumns() {
  return DEFAULT_INFORMATION_GAP_COLUMNS.map((column) => ({ ...column }));
}

function defaultRows() {
  return DEFAULT_INFORMATION_GAP_ROWS.map((row) => ({
    ...row,
    cells: { ...row.cells },
  }));
}

function parseColumns(value: string | null): WorksheetTableColumn[] {
  if (!value) return defaultColumns();
  try {
    const columns = JSON.parse(decodeURIComponent(value));
    return Array.isArray(columns) && columns.length ? columns : defaultColumns();
  } catch {
    return defaultColumns();
  }
}

function parseRows(value: string | null): WorksheetTableRow[] {
  if (!value) return defaultRows();
  try {
    const rows = JSON.parse(decodeURIComponent(value));
    return Array.isArray(rows) && rows.length ? rows : defaultRows();
  } catch {
    return defaultRows();
  }
}

function normalizedSpans(columns: WorksheetTableColumn[]) {
  const weights = columns.map((column) => Math.max(0.5, Number(column.span) || 1));
  const total = weights.reduce((sum, span) => sum + span, 0);
  const quotas = weights.map((span) => (span / total) * 48);
  const spans = quotas.map((quota) => Math.max(1, Math.floor(quota)));
  let remaining = 48 - spans.reduce((sum, span) => sum + span, 0);

  quotas
    .map((quota, index) => ({ index, remainder: quota - spans[index] }))
    .sort((left, right) => right.remainder - left.remainder)
    .forEach(({ index }) => {
      if (remaining <= 0) return;
      spans[index] += 1;
      remaining -= 1;
    });

  return spans;
}

function InformationGapActivityNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as InformationGapActivityAttrs;
  const spans = normalizedSpans(attrs.columns);
  const partnerOffset = attrs.partner === 'B' ? 1 : 0;

  return (
    <CustomBlockRoot
      selected={selected}
      className="information-gap-activity-node"
    >
      <h1 className="information-gap-activity-node__title">
        {attrs.title} – {attrs.partner}
      </h1>
      <div
        className="worksheet-table-node__frame information-gap-activity-node__table"
        role="table"
      >
        <div role="rowgroup">
          {attrs.rows.map((row, rowIndex) => (
            <div
              className={row.isHeader
                ? 'worksheet-table-node__header'
                : 'worksheet-table-node__row'}
              key={row.id}
              role="row"
            >
              <div
                aria-label={row.isHeader
                  ? undefined
                  : `Row ${attrs.rows
                    .slice(0, rowIndex + 1)
                    .filter((candidate) => !candidate.isHeader).length}`}
                className={`information-gap-activity-node__index-cell${row.isHeader
                  ? ' information-gap-activity-node__index-cell--header'
                  : ''}`}
                role={row.isHeader ? 'columnheader' : 'rowheader'}
              >
                {!row.isHeader && (
                  <span className="custom-block__row-index">
                    {String(attrs.rows
                      .slice(0, rowIndex + 1)
                      .filter((candidate) => !candidate.isHeader).length)
                      .padStart(2, '0')}
                  </span>
                )}
              </div>
              {attrs.columns.map((column, columnIndex) => {
                const showCell = row.isHeader
                  || (rowIndex + columnIndex + partnerOffset) % 2 === 0;
                const className = row.isHeader
                  ? 'worksheet-table-node__header-cell'
                  : 'worksheet-table-node__cell';

                return (
                  <div
                    className={`${className}${showCell
                      ? ''
                      : ' information-gap-activity-node__cell--empty'}`}
                    key={`${row.id}-${column.id}`}
                    role={row.isHeader ? 'columnheader' : 'cell'}
                    style={{
                      gridColumn: `span ${spans[columnIndex] ?? 1}`,
                      textAlign: column.align,
                    }}
                  >
                    <span className={showCell
                      ? 'information-gap-activity-node__given'
                      : 'information-gap-activity-node__solution'}
                    >
                      <InlineFormattedText
                        fallback={`Column ${columnIndex + 1}`}
                        text={row.cells[column.id] ?? ''}
                      />
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    informationGapActivity: {
      insertInformationGapActivity: (
        attrs?: Partial<InformationGapActivityAttrs>,
      ) => ReturnType;
    };
  }
}

export const InformationGapActivity = Node.create({
  name: 'informationGapActivity',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      activityId: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-activity-id') ?? '',
        renderHTML: ({ activityId }) => ({ 'data-activity-id': activityId }),
      },
      title: {
        default: 'Information gap activity',
        parseHTML: (element) => element.getAttribute('data-title')
          ?? 'Information gap activity',
        renderHTML: ({ title }) => ({ 'data-title': title }),
      },
      partner: {
        default: 'A',
        parseHTML: (element) => element.getAttribute('data-partner') === 'B'
          ? 'B'
          : 'A',
        renderHTML: ({ partner }) => ({ 'data-partner': partner }),
      },
      columns: {
        default: DEFAULT_INFORMATION_GAP_COLUMNS,
        parseHTML: (element) => parseColumns(element.getAttribute('data-columns')),
        renderHTML: ({ columns }) => ({
          'data-columns': encodeURIComponent(JSON.stringify(columns)),
        }),
      },
      rows: {
        default: DEFAULT_INFORMATION_GAP_ROWS,
        parseHTML: (element) => parseRows(element.getAttribute('data-rows')),
        renderHTML: ({ rows }) => ({
          'data-rows': encodeURIComponent(JSON.stringify(rows)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="information-gap-activity"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'information-gap-activity',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InformationGapActivityNodeView);
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      appendTransaction: (transactions, oldState, newState) => {
        if (!transactions.some((transaction) => transaction.docChanged)) {
          return null;
        }

        const changedByActivity = new Map<string, InformationGapActivityAttrs>();
        newState.doc.descendants((node, pos) => {
          if (node.type.name !== this.name) return;
          const attrs = node.attrs as InformationGapActivityAttrs;
          const oldNode = oldState.doc.nodeAt(pos);
          if (
            oldNode?.type.name === this.name
            && JSON.stringify(oldNode.attrs) !== JSON.stringify(node.attrs)
          ) {
            changedByActivity.set(attrs.activityId, attrs);
          }
        });
        if (!changedByActivity.size) return null;

        const transaction = newState.tr;
        newState.doc.descendants((node, pos) => {
          if (node.type.name !== this.name) return;
          const attrs = node.attrs as InformationGapActivityAttrs;
          const source = changedByActivity.get(attrs.activityId);
          if (!source || source.partner === attrs.partner) return;
          const nextAttrs = {
            ...attrs,
            title: source.title,
            columns: source.columns,
            rows: source.rows,
          };
          if (JSON.stringify(attrs) !== JSON.stringify(nextAttrs)) {
            transaction.setNodeMarkup(pos, undefined, nextAttrs);
          }
        });

        return transaction.docChanged ? transaction : null;
      },
    })];
  },

  addCommands() {
    return {
      insertInformationGapActivity: (attrs = {}) => ({ commands }) => {
        const activityId = attrs.activityId || crypto.randomUUID();
        const sharedAttrs = {
          title: attrs.title ?? 'Information gap activity',
          columns: attrs.columns ?? defaultColumns(),
          rows: attrs.rows ?? defaultRows(),
        };

        return commands.insertContent([
          {
            type: this.name,
            attrs: { ...sharedAttrs, activityId, partner: 'A' },
          },
          { type: 'pageBreak', attrs: { restartPagination: false } },
          {
            type: this.name,
            attrs: { ...sharedAttrs, activityId, partner: 'B' },
          },
        ]);
      },
    };
  },
});