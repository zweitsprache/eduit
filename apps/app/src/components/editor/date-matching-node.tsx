"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  GERMAN_MONTHS,
  numericDate,
  parseDateValue,
  writtenDate,
  type DateRepresentation,
  type DateValue,
} from '@/lib/german-date';

export type DateMatchingAttrs = {
  instruction: string;
  leftRepresentation: DateRepresentation;
  rightRepresentation: DateRepresentation;
  dates: DateValue[];
  rightOrder: string[];
};

export const DEFAULT_DATE_MATCHING_ATTRS: DateMatchingAttrs = {
  instruction: 'Ordne die Datumsangaben einander zu.',
  leftRepresentation: 'calendar',
  rightRepresentation: 'numeric',
  dates: [
    { id: 'date-1', date: '2025-03-12' },
    { id: 'date-2', date: '2025-07-01' },
    { id: 'date-3', date: '2025-11-24' },
  ],
  rightOrder: ['date-2', 'date-3', 'date-1'],
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function MiniCalendar({ value }: { value: string }) {
  const parsed = parseDateValue(value);
  if (!parsed) return null;
  const firstWeekday = (
    new Date(Date.UTC(parsed.year, parsed.month - 1, 1)).getUTCDay() + 6
  ) % 7;
  const daysInMonth = new Date(
    Date.UTC(parsed.year, parsed.month, 0),
  ).getUTCDate();
  const cells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  return (
    <span
      aria-label={writtenDate(value)}
      className="date-matching-node__calendar"
    >
      <span className="date-matching-node__calendar-header">
        {GERMAN_MONTHS[parsed.month - 1]} {parsed.year}
      </span>
      <span className="date-matching-node__calendar-grid date-matching-node__calendar-weekdays">
        {['M', 'D', 'M', 'D', 'F', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </span>
      <span className="date-matching-node__calendar-grid">
        {cells.map((day, index) => (
          <span
            className={day === parsed.day
              ? 'date-matching-node__calendar-day--selected'
              : undefined}
            key={`${day ?? 'empty'}-${index}`}
          >
            {day}
          </span>
        ))}
      </span>
    </span>
  );
}

function DateDisplay({
  representation,
  value,
}: {
  representation: DateRepresentation;
  value: string;
}) {
  if (representation === 'calendar') return <MiniCalendar value={value} />;
  return (
    <span className={representation === 'numeric'
      ? 'date-matching-node__numeric'
      : 'date-matching-node__text'}
    >
      {representation === 'numeric' ? numericDate(value) : writtenDate(value)}
    </span>
  );
}

function DateMatchingNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as DateMatchingAttrs;
  const usesCalendar = attrs.leftRepresentation === 'calendar'
    || attrs.rightRepresentation === 'calendar';
  const byId = new Map(attrs.dates.map((date) => [date.id, date]));
  const rightDates = [
    ...attrs.rightOrder.map((id) => byId.get(id)).filter(Boolean),
    ...attrs.dates.filter(({ id }) => !attrs.rightOrder.includes(id)),
  ] as DateValue[];
  const calendarAnswerRepresentation = attrs.leftRepresentation === 'calendar'
    ? attrs.rightRepresentation
    : attrs.leftRepresentation;
  return (
    <CustomBlockRoot selected={selected} className="date-matching-node">
      <BlockInstruction>
        {usesCalendar
          ? 'Schreibe die passende Nummer zu jeder Datumsangabe.'
          : attrs.instruction}
      </BlockInstruction>
      {usesCalendar ? (
        <>
          <div className="date-matching-node__calendar-items">
            {attrs.dates.map((date, index) => (
              <div className="date-matching-node__calendar-item" key={date.id}>
                <div className="date-matching-node__calendar-number-row">
                  <span className="custom-block__row-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <MiniCalendar value={date.date} />
              </div>
            ))}
          </div>
          <div className="date-matching-node__calendar-options">
            {rightDates.map((date, index) => (
              <div className="date-matching-node__calendar-option" key={date.id}>
                <span className="custom-block__row-index matching-pairs-node__letter">
                  {String.fromCharCode(97 + index)}
                </span>
                <span
                  aria-label={`Nummer zu ${String.fromCharCode(97 + index)}`}
                  className="date-matching-node__answer-line"
                />
                <span className="date-matching-node__calendar-option-text">
                  <DateDisplay
                    representation={calendarAnswerRepresentation}
                    value={date.date}
                  />
                </span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="matching-pairs-node__columns date-matching-node__columns">
        {attrs.dates.map((date, index) => {
          const right = rightDates[index];
          return (
            <div className="contents" key={date.id}>
              <div className="matching-pairs-node__row date-matching-node__row date-matching-node__row--left">
                <span className="custom-block__row-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="matching-pairs-node__label matching-pairs-node__label--left">
                  <DateDisplay representation={attrs.leftRepresentation} value={date.date} />
                </span>
                <BlockChoiceIndicator checked={false} />
              </div>
              <div className="matching-pairs-node__row date-matching-node__row date-matching-node__row--right">
                <BlockChoiceIndicator checked={false} />
                <span className="matching-pairs-node__label">
                  {right && (
                    <DateDisplay representation={attrs.rightRepresentation} value={right.date} />
                  )}
                </span>
                <span className="custom-block__row-index matching-pairs-node__letter">
                  {String.fromCharCode(97 + index)}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      )}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dateMatching: {
      insertDateMatching: (attrs?: Partial<DateMatchingAttrs>) => ReturnType;
    };
  }
}

export const DateMatching = Node.create({
  name: 'dateMatching',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_DATE_MATCHING_ATTRS.instruction,
        parseHTML: (element) => element.getAttribute('data-instruction')
          ?? DEFAULT_DATE_MATCHING_ATTRS.instruction,
        renderHTML: ({ instruction }) => ({ 'data-instruction': instruction }),
      },
      leftRepresentation: {
        default: DEFAULT_DATE_MATCHING_ATTRS.leftRepresentation,
        parseHTML: (element) => element.getAttribute('data-left-representation')
          ?? DEFAULT_DATE_MATCHING_ATTRS.leftRepresentation,
        renderHTML: ({ leftRepresentation }) => ({
          'data-left-representation': leftRepresentation,
        }),
      },
      rightRepresentation: {
        default: DEFAULT_DATE_MATCHING_ATTRS.rightRepresentation,
        parseHTML: (element) => element.getAttribute('data-right-representation')
          ?? DEFAULT_DATE_MATCHING_ATTRS.rightRepresentation,
        renderHTML: ({ rightRepresentation }) => ({
          'data-right-representation': rightRepresentation,
        }),
      },
      dates: {
        default: DEFAULT_DATE_MATCHING_ATTRS.dates,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-dates'),
          DEFAULT_DATE_MATCHING_ATTRS.dates,
        ),
        renderHTML: ({ dates }) => ({
          'data-dates': encodeURIComponent(JSON.stringify(dates)),
        }),
      },
      rightOrder: {
        default: DEFAULT_DATE_MATCHING_ATTRS.rightOrder,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-right-order'),
          DEFAULT_DATE_MATCHING_ATTRS.rightOrder,
        ),
        renderHTML: ({ rightOrder }) => ({
          'data-right-order': encodeURIComponent(JSON.stringify(rightOrder)),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="date-matching"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'date-matching' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(DateMatchingNodeView);
  },
  addCommands() {
    return {
      insertDateMatching: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { ...DEFAULT_DATE_MATCHING_ATTRS, ...attrs },
      }),
    };
  },
});
