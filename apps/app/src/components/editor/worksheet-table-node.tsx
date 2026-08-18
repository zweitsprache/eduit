"use client";

import {
  Fragment,
  type CSSProperties,
  useCallback,
  useLayoutEffect,
  useRef,
} from 'react';
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
  shouldAttachBlankToPreviousText,
  type FillInTheBlankPart,
} from '@/components/editor/fill-in-the-blank-node';
import {
  InlineFormattedText,
} from '@/components/editor/custom-blocks/inline-formatting';
import { getEditorPageAreas } from '@/components/editor/page-layout';

export type WorksheetTableColumn = {
  id: string;
  label: string;
  span: number;
  align: 'left' | 'center' | 'right';
  useTabularNums?: boolean;
};

export type WorksheetTableRow = {
  id: string;
  isHeader: boolean;
  cells: Record<string, string>;
};

export type WorksheetTableAttrs = {
  instruction: string;
  showInstruction: boolean;
  columns: WorksheetTableColumn[];
  rows: WorksheetTableRow[];
  showHeader: boolean;
  compactSingleLetterBlanks: boolean;
  hideBlankNumbers: boolean;
  blankWidthFactor: number;
  showFirstAsExample: boolean;
};

export const DEFAULT_WORKSHEET_TABLE_COLUMNS: WorksheetTableColumn[] = [
  {
    id: 'table-column-1',
    label: 'Term',
    span: 8,
    align: 'left',
    useTabularNums: false,
  },
  {
    id: 'table-column-2',
    label: 'Definition',
    span: 16,
    align: 'left',
    useTabularNums: false,
  },
];

export const DEFAULT_WORKSHEET_TABLE_ROWS: WorksheetTableRow[] = [
  {
    id: 'table-row-header',
    isHeader: true,
    cells: {
      'table-column-1': 'Term',
      'table-column-2': 'Definition',
    },
  },
  {
    id: 'table-row-1',
    isHeader: false,
    cells: {
      'table-column-1': '**Example**',
      'table-column-2': 'Complete the {{blank:answer}}.',
    },
  },
  {
    id: 'table-row-2',
    isHeader: false,
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
    isHeader: row.isHeader,
    cells: { ...row.cells },
  }));
}

function columnSpan(column: WorksheetTableColumn) {
  const legacyWidth = Number(
    (column as WorksheetTableColumn & { width?: number }).width,
  );
  const span = Number(column.span);
  const clampSpan = (value: number) => Math.max(0.5, Math.min(24, value));
  if (Number.isFinite(span)) {
    return clampSpan(Math.round(span * 2) / 2);
  }
  if (Number.isFinite(legacyWidth)) {
    return clampSpan(Math.round((legacyWidth * 0.24) * 2) / 2);
  }
  return 1;
}

function normalizedSpans(columns: WorksheetTableColumn[]) {
  if (!columns.length) return [];
  const totalUnits = 48;
  const weights = columns.map(columnSpan);
  const total = weights.reduce((sum, span) => sum + span, 0);
  const quotas = weights.map((span) => (span / total) * totalUnits);
  const spans = quotas.map((quota) => Math.max(1, Math.floor(quota)));
  let difference = totalUnits - spans.reduce((sum, span) => sum + span, 0);

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
              ? Math.max(0.5, Math.min(24, Math.round(Number(column.span) * 2) / 2))
              : Number.isFinite(Number(column.width))
                ? Math.max(
                    0.5,
                    Math.min(24, Math.round((Number(column.width) * 0.24) * 2) / 2),
                  )
                : 1,
            align: column.align === 'center' || column.align === 'right'
              ? column.align
              : 'left',
            useTabularNums: column.useTabularNums === true,
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
        isHeader: row.isHeader === true,
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
  compactSingleLetterBlanks,
  hideBlankNumbers,
  parts,
  showFirstAsExample,
}: {
  compactSingleLetterBlanks: boolean;
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
                compactSingleLetterBlanks
                  && isSingleLetterBlankAnswer(part.answer)
                  ? ' fill-in-the-blank-node__blank--single-letter'
                  : ''
              }${
                shouldAttachBlankToPreviousText(parts, index)
                  ? ' fill-in-the-blank-node__blank--suffix'
                  : ''
              }`}
              data-answer={part.answer}
              data-example={showFirstAsExample && part.index === 1}
              data-show-number={!hideBlankNumbers}
              style={{
                '--fill-blank-width-factor': part.widthFactor,
              } as CSSProperties}
            >
              <span
                aria-hidden="true"
                className="custom-block__compact-label fill-in-the-blank-node__blank-number"
                style={{
                  visibility: hideBlankNumbers ? 'hidden' : 'visible',
                }}
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
  const frameRef = useRef<HTMLDivElement>(null);
  const attrs = node.attrs as WorksheetTableAttrs;
  const spanUnits = normalizedSpans(attrs.columns);
  const hasRowHeaders = attrs.rows.some((row) => row.isHeader);
  const displayedRows: WorksheetTableRow[] = hasRowHeaders || !attrs.showHeader
    ? attrs.rows
    : [
        {
          id: 'legacy-table-header',
          isHeader: true,
          cells: Object.fromEntries(
            attrs.columns.map((column, index) => [
              column.id,
              column.label || `Column ${index + 1}`,
            ]),
          ),
        },
        ...attrs.rows.map((row) => ({ ...row, isHeader: false })),
      ];
  let blankOffset = 0;
  const parsedRows = displayedRows.map((row) => ({
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

  const markPageEndingRows = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const rows = Array.from(frame.querySelectorAll<HTMLElement>(
      '.worksheet-table-node__header, .worksheet-table-node__row',
    ));
    rows.forEach((row) => row.removeAttribute('data-page-last'));
    if (!rows.length) return;

    const editor = frame.closest('.ProseMirror');
    const pageAreas = getEditorPageAreas(editor as HTMLElement | null);

    if (!pageAreas.length) {
      rows.at(-1)?.setAttribute('data-page-last', 'true');
      return;
    }

    pageAreas.forEach((area) => {
      const candidates = rows.flatMap((row) => {
        const rect = row.getBoundingClientRect();
        const intersection = Math.max(
          0,
          Math.min(rect.bottom, area.bottom) - Math.max(rect.top, area.top),
        );
        return intersection > 0 && rect.top < area.bottom
          ? [{ row, bottom: rect.bottom, intersection }]
          : [];
      });
      const lastCandidate = candidates.sort((left, right) => (
        right.bottom - left.bottom
        || right.intersection - left.intersection
      ))[0];
      lastCandidate?.row.setAttribute('data-page-last', 'true');
    });
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const editor = frame.closest('.ProseMirror');
    let animationFrame = requestAnimationFrame(markPageEndingRows);
    const scheduleMeasure = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(markPageEndingRows);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(frame);
    const mutationObserver = editor
      ? new MutationObserver((mutations) => {
        const onlyPageLastChanges = mutations.every((mutation) => (
          mutation.type === 'attributes'
          && mutation.attributeName === 'data-page-last'
        ));
        if (!onlyPageLastChanges) scheduleMeasure();
      })
      : null;
    mutationObserver?.observe(editor!, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [markPageEndingRows, parsedRows.length]);

  return (
    <CustomBlockRoot selected={selected} className="worksheet-table-node">
      {attrs.showInstruction && (
        <BlockInstruction>{attrs.instruction}</BlockInstruction>
      )}
      <div
        className="worksheet-table-node__frame"
        ref={frameRef}
        role="table"
      >
        <div role="rowgroup">
          {parsedRows.map(({ row, cells }) => {
            const renderedCells: Array<{
              key: string;
              colSpan: number;
              align: 'left' | 'center' | 'right';
              useTabularNums: boolean;
              headerText: string;
              fallback: string;
              parts: FillInTheBlankPart[];
              isHeader: boolean;
            }> = [];

            for (let index = 0; index < attrs.columns.length; index += 1) {
              const column = attrs.columns[index];
              const cell = cells[index];
              const headerText = row.cells[column.id] ?? '';
              const headerTextTrimmed = headerText.trim();
              const baseSpan = spanUnits[index] ?? 1;

              if (row.isHeader && headerTextTrimmed.length > 0) {
                let mergedSpan = baseSpan;
                let mergeEnd = index;
                for (
                  let mergeIndex = index + 1;
                  mergeIndex < attrs.columns.length;
                  mergeIndex += 1
                ) {
                  const nextColumn = attrs.columns[mergeIndex];
                  const nextHeaderText = (row.cells[nextColumn.id] ?? '').trim();
                  if (nextHeaderText.length > 0) break;
                  mergedSpan += spanUnits[mergeIndex] ?? 1;
                  mergeEnd = mergeIndex;
                }

                renderedCells.push({
                  key: `${row.id}-${column.id}`,
                  colSpan: mergedSpan,
                  align: column.align ?? 'left',
                  useTabularNums: attrs.columns
                    .slice(index, mergeEnd + 1)
                    .some((mergedColumn) => mergedColumn.useTabularNums === true),
                  headerText,
                  fallback: `Column ${index + 1}`,
                  parts: cell.parts,
                  isHeader: true,
                });

                index = mergeEnd;
                continue;
              }

              renderedCells.push({
                key: `${row.id}-${column.id}`,
                colSpan: baseSpan,
                align: column.align ?? 'left',
                useTabularNums: column.useTabularNums === true,
                headerText,
                fallback: `Column ${index + 1}`,
                parts: cell.parts,
                isHeader: row.isHeader,
              });
            }

            return (
              <div
                className={row.isHeader
                  ? 'worksheet-table-node__header'
                  : 'worksheet-table-node__row'}
                key={row.id}
                role="row"
              >
                {renderedCells.map((cell) => (
                  <div
                    className={`${cell.isHeader
                      ? 'worksheet-table-node__header-cell'
                      : 'worksheet-table-node__cell'}${cell.useTabularNums
                      ? ' worksheet-table-node__cell--tabular-nums'
                      : ''}`}
                    key={cell.key}
                    role={cell.isHeader ? 'columnheader' : 'cell'}
                    style={{
                      gridColumn: `span ${cell.colSpan}`,
                      textAlign: cell.align,
                    }}
                  >
                    {cell.isHeader ? (
                      <InlineFormattedText
                        fallback={cell.fallback}
                        text={cell.headerText}
                      />
                    ) : (
                      <TableCellContent
                        compactSingleLetterBlanks={
                          attrs.compactSingleLetterBlanks
                        }
                        hideBlankNumbers={attrs.hideBlankNumbers}
                        parts={cell.parts}
                        showFirstAsExample={attrs.showFirstAsExample}
                      />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
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
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-show-instruction': String(
            attributes.showInstruction,
          ),
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
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-show-header') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-show-header': String(attributes.showHeader),
        }),
      },
      compactSingleLetterBlanks: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-worksheet-table-compact-single-letter')
            !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-worksheet-table-compact-single-letter': String(
            attributes.compactSingleLetterBlanks,
          ),
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
              showInstruction: attrs.showInstruction ?? true,
              columns: attrs.columns ?? defaultColumns(),
              rows: attrs.rows ?? defaultRows(),
              showHeader: attrs.showHeader ?? false,
              compactSingleLetterBlanks: attrs.compactSingleLetterBlanks ?? true,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              blankWidthFactor: attrs.blankWidthFactor ?? 1,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
