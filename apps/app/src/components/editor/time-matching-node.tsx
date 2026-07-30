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
  digitalTime,
  informalTime,
  officialTime,
  type TimeRepresentation,
  type TimeValue,
} from '@/lib/german-time';

export type TimeMatchingAttrs = {
  instruction: string;
  leftRepresentation: TimeRepresentation;
  rightRepresentation: TimeRepresentation;
  times: TimeValue[];
  rightOrder: string[];
};

export const DEFAULT_TIME_MATCHING_ATTRS: TimeMatchingAttrs = {
  instruction: 'Ordne die Uhrzeiten einander zu.',
  leftRepresentation: 'analog',
  rightRepresentation: 'digital',
  times: [
    { id: 'time-1', hour: 8, minute: 5 },
    { id: 'time-2', hour: 12, minute: 30 },
    { id: 'time-3', hour: 15, minute: 20 },
  ],
  rightOrder: ['time-2', 'time-3', 'time-1'],
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function AnalogClock({ hour, minute }: { hour: number; minute: number }) {
  return (
    <span className="time-matching-node__clock" aria-label={digitalTime(hour, minute)}>
      <img
        alt=""
        aria-hidden="true"
        src={`/api/time-clock?hour=${hour}&minute=${minute}`}
      />
    </span>
  );
}

function TimeDisplay({
  representation,
  time,
}: {
  representation: TimeRepresentation;
  time: TimeValue;
}) {
  if (representation === 'analog') {
    return <AnalogClock hour={time.hour} minute={time.minute} />;
  }
  if (representation === 'digital') {
    return (
      <span className="time-matching-node__digital">
        {digitalTime(time.hour, time.minute)}
      </span>
    );
  }
  return (
    <span className="time-matching-node__text">
      {representation === 'official'
        ? officialTime(time.hour, time.minute)
        : informalTime(time.hour, time.minute)}
    </span>
  );
}

function TimeMatchingNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as TimeMatchingAttrs;
  const byId = new Map(attrs.times.map((time) => [time.id, time]));
  const rightTimes = [
    ...attrs.rightOrder.map((id) => byId.get(id)).filter(Boolean),
    ...attrs.times.filter(({ id }) => !attrs.rightOrder.includes(id)),
  ] as TimeValue[];
  return (
    <CustomBlockRoot selected={selected} className="time-matching-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="matching-pairs-node__columns time-matching-node__columns">
        {attrs.times.map((time, index) => {
          const right = rightTimes[index];
          return (
            <div className="contents" key={time.id}>
              <div className="matching-pairs-node__row time-matching-node__row time-matching-node__row--left">
                <span className="custom-block__row-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="matching-pairs-node__label matching-pairs-node__label--left">
                  <TimeDisplay representation={attrs.leftRepresentation} time={time} />
                </span>
                <BlockChoiceIndicator checked={false} />
              </div>
              <div className="matching-pairs-node__row time-matching-node__row time-matching-node__row--right">
                <BlockChoiceIndicator checked={false} />
                <span className="matching-pairs-node__label">
                  {right && (
                    <TimeDisplay representation={attrs.rightRepresentation} time={right} />
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
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    timeMatching: {
      insertTimeMatching: (attrs?: Partial<TimeMatchingAttrs>) => ReturnType;
    };
  }
}

export const TimeMatching = Node.create({
  name: 'timeMatching',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_TIME_MATCHING_ATTRS.instruction,
        parseHTML: (element) => element.getAttribute('data-instruction')
          ?? DEFAULT_TIME_MATCHING_ATTRS.instruction,
        renderHTML: ({ instruction }) => ({ 'data-instruction': instruction }),
      },
      leftRepresentation: {
        default: DEFAULT_TIME_MATCHING_ATTRS.leftRepresentation,
        parseHTML: (element) => element.getAttribute('data-left-representation')
          ?? DEFAULT_TIME_MATCHING_ATTRS.leftRepresentation,
        renderHTML: ({ leftRepresentation }) => ({
          'data-left-representation': leftRepresentation,
        }),
      },
      rightRepresentation: {
        default: DEFAULT_TIME_MATCHING_ATTRS.rightRepresentation,
        parseHTML: (element) => element.getAttribute('data-right-representation')
          ?? DEFAULT_TIME_MATCHING_ATTRS.rightRepresentation,
        renderHTML: ({ rightRepresentation }) => ({
          'data-right-representation': rightRepresentation,
        }),
      },
      times: {
        default: DEFAULT_TIME_MATCHING_ATTRS.times,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-times'),
          DEFAULT_TIME_MATCHING_ATTRS.times,
        ),
        renderHTML: ({ times }) => ({
          'data-times': encodeURIComponent(JSON.stringify(times)),
        }),
      },
      rightOrder: {
        default: DEFAULT_TIME_MATCHING_ATTRS.rightOrder,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-right-order'),
          DEFAULT_TIME_MATCHING_ATTRS.rightOrder,
        ),
        renderHTML: ({ rightOrder }) => ({
          'data-right-order': encodeURIComponent(JSON.stringify(rightOrder)),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="time-matching"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'time-matching' })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TimeMatchingNodeView);
  },
  addCommands() {
    return {
      insertTimeMatching: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { ...DEFAULT_TIME_MATCHING_ATTRS, ...attrs },
      }),
    };
  },
});
