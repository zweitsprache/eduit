"use client";

import { Fragment, type CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  isSingleLetterBlankAnswer,
  parseFillInTheBlankText,
  type FillInTheBlankPart,
} from '@/components/editor/fill-in-the-blank-node';
import {
  InlineFormattedText,
} from '@/components/editor/custom-blocks/inline-formatting';

export type WorksheetTableColumn = {
  id: string;
  label: string;
  span: number;
  align: 'left' | 'center' | 'right';
};

export type WorksheetTableRow = {
  id: string;
  cells: Record<string, string>;
};

export type WorksheetTableAttrs = {
  instruction: string;
  columns: WorksheetTableColumn[];
  rows: WorksheetTableRow[];
  showHeader: boolean;
  hideBlankNumbers: boolean;
  blankWidthFactor: number;
  showFirstAsExample: boolean;
};

export const DEFAULT_WORKSHEET_TABLE_COLUMNS: WorksheetTableColumn[] = [
  { id: 'table-column-1', label: 'Term', span: 4, align: 'left' },
  { id: 'table-column-2', label: 'Definition', span: 8, align: 'left' },
];

export const DEFAULT_WORKSHEET_TABLE_ROWS: WorksheetTableRow[] = [
  {
    id: 'table-row-1',
    cells: {
      'table-column-1': '**Example**',
      'table-column-2': 'Complete the {{blank:answer}}.',
    },
  },
  {
    id: 'table-row-2',
    cells: {
      'table-column-1': 'Second term',
      'table-column-2': 'Enter the definition.',
    },
  },
];

function defaultColumns() {
  return DEFAULT_WORKSHEET_TABLE_COLUMNS.map((column) => ({ ...column }));
}

function defaultRows() {
  return DEFAULT_WORKSHEET_TABLE_ROWS.map((row) => ({
    ...row,
    cells: { ...row.cells },
  }));
}

function columnSpan(column: WorksheetTableColumn) {
  const legacyWidth = Number(
    (column as WorksheetTableColumn & { width?: number }).width,
  );
  const span = Number(column.span);
  if (Number.isFinite(span)) {
    return Math.max(1, Math.min(12, Math.round(span)));
  }
  if (Number.isFinite(legacyWidth)) {
    return Math.max(1, Math.min(12, Math.round(legacyWidth * 0.12)));
  }
  return 1;
}

function normalizedSpans(columns: WorksheetTableColumn[]) {
  if (!columns.length) return [];
  const weights = columns.map(columnSpan);
  const total = weights.reduce((sum, span) => sum + span, 0);
  if (total === 12) return weights;

  const quotas = weights.map((span) => (span / total) * 12);
  const spans = quotas.map((quota) => Math.max(1, Math.floor(quota)));
  let difference = 12 - spans.reduce((sum, span) => sum + span, 0);

  while (difference > 0) {
    const candidates = quotas
      .map((quota, index) => ({ index, remainder: quota - spans[index] }))
      .sort((a, b) => b.remainder - a.remainder);
    for (const { index } of candidates) {
      if (difference <= 0) break;
      spans[index] += 1;
      difference -= 1;
    }
  }
  while (difference < 0) {
    const index = spans.reduce(
      (largestIndex, span, currentIndex) => (
        span > spans[largestIndex] ? currentIndex : largestIndex
      ),
      0,
    );
    if (spans[index] <= 1) break;
    spans[index] -= 1;
    difference += 1;
  }
  return spans;
}

function parseColumns(value: string | null): WorksheetTableColumn[] {
  if (!value) return defaultColumns();
  try {
    const columns = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(columns)) return defaultColumns();
    const parsed = columns.flatMap((column, index): WorksheetTableColumn[] => (
      typeof column?.label === 'string'
        ? [{
            id: typeof column.id === 'string'
              ? column.id
              : `table-column-${index + 1}`,
            label: column.label,
            span: Number.isFinite(Number(column.span))
              ? Math.max(1, Math.min(12, Math.round(Number(column.span))))
              : Number.isFinite(Number(column.width))
                ? Math.max(
                    1,
                    Math.min(12, Math.round(Number(column.width) * 0.12)),
                  )
                : 1,
            align: column.align === 'center' || column.align === 'right'
              ? column.align
              : 'left',
          }]
        : []
    ));
    return parsed.length ? parsed.slice(0, 6) : defaultColumns();
  } catch {
    return defaultColumns();
  }
}

function parseRows(value: string | null): WorksheetTableRow[] {
  if (!value) return defaultRows();
  try {
    const rows = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(rows)) return defaultRows();
    const parsed = rows.flatMap((row, index): WorksheetTableRow[] => {
      if (!row || typeof row.cells !== 'object') return [];
      return [{
        id: typeof row.id === 'string'
          ? row.id
          : `table-row-${index + 1}`,
        cells: Object.fromEntries(
          Object.entries(row.cells).map(([columnId, value]) => [
            columnId,
            typeof value === 'string' ? value : '',
          ]),
        ),
      }];
    });
    return parsed.length ? parsed : defaultRows();
  } catch {
    return defaultRows();
  }
}

function clampBlankWidth(value: unknown) {
  const width = Number(value);
  return Number.isFinite(width) ? Math.min(5, Math.max(1, width)) : 1;
}

function TableCellContent({
  hideBlankNumbers,
  parts,
  showFirstAsExample,
}: {
  hideBlankNumbers: boolean;
  parts: FillInTheBlankPart[];
  showFirstAsExample: boolean;
}) {
  return (
    <span className="worksheet-table-node__cell-content">
      {parts.map((part, index) => (
        <Fragment key={`${part.type}-${index}`}>
          {part.type === 'text' ? (
            part.value.split(/\r?\n/).map((line, lineIndex) => (
              <Fragment key={`${lineIndex}-${line}`}>
                {lineIndex > 0 && <br />}
                <InlineFormattedText text={line} />
              </Fragment>
            ))
          ) : (
            <span
              aria-label={`Blank ${part.index}`}
              className={`fill-in-the-blank-node__blank${
                isSingleLetterBlankAnswer(part.answer)
                  ? ' fill-in-the-blank-node__blank--single-letter'
                  : ''
              }${
                hideBlankNumbers
                  ? ' fill-in-the-blank-node__blank--without-number'
                  : ''
              }`}
              data-answer={part.answer}
              data-example={showFirstAsExample && part.index === 1}
              style={{
                '--fill-blank-width-factor': part.widthFactor,
              } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="custom-block__compact-label fill-in-the-blank-node__blank-number"
              >
                {String(part.index).padStart(2, '0')}
              </span>
            </span>
          )}
        </Fragment>
      ))}
    </span>
  );
}

function WorksheetTableNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as WorksheetTableAttrs;
  const spans = normalizedSpans(attrs.columns);
  let blankOffset = 0;
  const parsedRows = attrs.rows.map((row) => ({
    row,
    cells: attrs.columns.map((column) => {
      const parts = parseFillInTheBlankText(
        row.cells[column.id] ?? '',
        attrs.blankWidthFactor,
      ).map((part) => {
        if (part.type === 'text') return part;
        blankOffset += 1;
        return { ...part, index: blankOffset };
      });
      return { columnId: column.id, parts };
    }),
  }));

  return (
    <CustomBlockRoot selected={selected} className="worksheet-table-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div
        className="worksheet-table-node__frame"
        role="table"
      >
        {attrs.showHeader && (
          <div
            className="worksheet-table-node__header"
            role="row"
          >
            {attrs.columns.map((column, index) => (
              <div
                className="worksheet-table-node__header-cell"
                key={column.id}
                role="columnheader"
                style={{
                  gridColumn: `span ${spans[index]}`,
                  textAlign: column.align ?? 'left',
                }}
              >
                <InlineFormattedText
                  fallback={`Column ${index + 1}`}
                  text={column.label}
                />
              </div>
            ))}
          </div>
        )}
        <div role="rowgroup">
          {parsedRows.map(({ row, cells }) => (
            <div
              className="worksheet-table-node__row"
              key={row.id}
              role="row"
            >
              {cells.map(({ columnId, parts }, columnIndex) => (
                <div
                  className="worksheet-table-node__cell"
                  key={columnId}
                  role="cell"
                  style={{
                    gridColumn: `span ${spans[columnIndex]}`,
                    textAlign: attrs.columns[columnIndex].align ?? 'left',
                  }}
                >
                  <TableCellContent
                    hideBlankNumbers={attrs.hideBlankNumbers}
                    parts={parts}
                    showFirstAsExample={attrs.showFirstAsExample}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    worksheetTable: {
      insertWorksheetTable: (
        attrs?: Partial<WorksheetTableAttrs>,
      ) => ReturnType;
    };
  }
}

export const WorksheetTable = Node.create({
  name: 'worksheetTable',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Complete the table.',
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-instruction')
          ?? 'Complete the table.'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-instruction': attributes.instruction,
        }),
      },
      columns: {
        default: DEFAULT_WORKSHEET_TABLE_COLUMNS,
        parseHTML: (element) => parseColumns(
          element.getAttribute('data-worksheet-table-columns'),
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-columns': encodeURIComponent(
            JSON.stringify(attributes.columns),
          ),
        }),
      },
      rows: {
        default: DEFAULT_WORKSHEET_TABLE_ROWS,
        parseHTML: (element) => parseRows(
          element.getAttribute('data-worksheet-table-rows'),
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-rows': encodeURIComponent(
            JSON.stringify(attributes.rows),
          ),
        }),
      },
      showHeader: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-show-header') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-show-header': String(attributes.showHeader),
        }),
      },
      hideBlankNumbers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-hide-blank-numbers')
          === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-hide-blank-numbers': String(
            attributes.hideBlankNumbers,
          ),
        }),
      },
      blankWidthFactor: {
        default: 1,
        parseHTML: (element) => clampBlankWidth(
          element.getAttribute('data-worksheet-table-blank-width'),
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-blank-width': attributes.blankWidthFactor,
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-show-first-example')
            === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="worksheet-table"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'worksheet-table' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WorksheetTableNodeView);
  },

  addCommands() {
    return {
      insertWorksheetTable:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction: attrs.instruction ?? 'Complete the table.',
              columns: attrs.columns ?? defaultColumns(),
              rows: attrs.rows ?? defaultRows(),
              showHeader: attrs.showHeader ?? true,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              blankWidthFactor: attrs.blankWidthFactor ?? 1,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
