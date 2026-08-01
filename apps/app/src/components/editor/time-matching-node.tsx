"use client";

import { useLayoutEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import rough from 'roughjs';
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
  TIME_MINUTES,
  type TimeRepresentation,
  type TimeValue,
} from '@/lib/german-time';

export type TimeMatchingAttrs = {
  instruction: string;
  leftRepresentation: TimeRepresentation;
  rightRepresentation: TimeRepresentation;
  times: TimeValue[];
  rightOrder: string[];
  allowedMinutes: number[];
  rangeStart: string;
  rangeEnd: string;
  shuffleLeft: boolean;
  shuffleRight: boolean;
  showFirstAsExample: boolean;
};

export const DEFAULT_TIME_MATCHING_ATTRS: TimeMatchingAttrs = {
  instruction: 'Verbinden Sie die passenden Uhrzeiten.',
  leftRepresentation: 'analog',
  rightRepresentation: 'digital',
  times: [
    { id: 'time-1', hour: 8, minute: 5 },
    { id: 'time-2', hour: 12, minute: 30 },
    { id: 'time-3', hour: 15, minute: 20 },
  ],
  rightOrder: ['time-2', 'time-3', 'time-1'],
  allowedMinutes: TIME_MINUTES,
  rangeStart: '00:00',
  rangeEnd: '23:59',
  shuffleLeft: false,
  shuffleRight: true,
  showFirstAsExample: false,
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
  const rootRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<SVGSVGElement>(null);
  const byId = new Map(attrs.times.map((time) => [time.id, time]));
  const rightTimes = [
    ...attrs.rightOrder.map((id) => byId.get(id)).filter(Boolean),
    ...attrs.times.filter(({ id }) => !attrs.rightOrder.includes(id)),
  ] as TimeValue[];

  useLayoutEffect(() => {
    const root = rootRef.current;
    const svg = solutionsRef.current;
    const columns = svg?.parentElement;
    if (!root || !svg || !columns) return;

    const stableHash = (value: string) => {
      let hash = 2166136261;
      for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 16777619);
      }
      return hash >>> 0;
    };
    let cancelled = false;
    const drawSolutions = () => {
      if (cancelled) return;
      const columnsRect = columns.getBoundingClientRect();
      const width = columns.clientWidth;
      const height = columns.clientHeight;
      if (width <= 0 || height <= 0) return;
      const scaleX = columnsRect.width / width || 1;
      const scaleY = columnsRect.height / height || 1;
      svg.replaceChildren();
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('width', String(width));
      svg.setAttribute('height', String(height));
      const roughSvg = rough.svg(svg);
      const endpoints = new Map<string, {
        left?: HTMLElement;
        right?: HTMLElement;
      }>();
      columns.querySelectorAll<HTMLElement>(
        '[data-time-id][data-time-side]',
      ).forEach((row) => {
        const id = row.dataset.timeId;
        const side = row.dataset.timeSide;
        const indicator = row.querySelector<HTMLElement>(
          '.custom-block__choice-indicator',
        );
        if (!id || !indicator || (side !== 'left' && side !== 'right')) return;
        const endpoint = endpoints.get(id) ?? {};
        endpoint[side] = indicator;
        endpoints.set(id, endpoint);
      });
      attrs.times.forEach((time, index) => {
        const endpoint = endpoints.get(time.id);
        if (!endpoint?.left || !endpoint.right) return;
        const leftRect = endpoint.left.getBoundingClientRect();
        const rightRect = endpoint.right.getBoundingClientRect();
        const solutionKind =
          attrs.showFirstAsExample && index === 0 ? 'example' : 'solution';
        const line = roughSvg.line(
          (leftRect.left + leftRect.width / 2 - columnsRect.left) / scaleX,
          (leftRect.top + leftRect.height / 2 - columnsRect.top) / scaleY,
          (rightRect.left + rightRect.width / 2 - columnsRect.left) / scaleX,
          (rightRect.top + rightRect.height / 2 - columnsRect.top) / scaleY,
          {
            bowing: 1.4,
            disableMultiStroke: true,
            roughness: 1.15,
            seed: stableHash(time.id) || 1,
            stroke: solutionKind === 'example'
              ? 'var(--custom-block-example-solution-color)'
              : 'var(--custom-block-solution-color)',
            strokeWidth: 1.5,
          },
        );
        line.dataset.solutionKind = solutionKind;
        line.querySelectorAll('path').forEach((path) => {
          path.style.stroke = solutionKind === 'example'
            ? 'var(--custom-block-example-solution-color)'
            : 'var(--custom-block-solution-color)';
        });
        svg.appendChild(line);
      });
    };

    drawSolutions();
    const resizeObserver = new ResizeObserver(drawSolutions);
    resizeObserver.observe(columns);
    columns.querySelectorAll<HTMLElement>('.time-matching-node__row')
      .forEach((row) => resizeObserver.observe(row));
    window.addEventListener('resize', drawSolutions);
    void document.fonts.ready.then(drawSolutions);
    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawSolutions);
    };
  }, [attrs.rightOrder, attrs.showFirstAsExample, attrs.times]);

  return (
    <CustomBlockRoot
      selected={selected}
      className="time-matching-node"
      rootRef={rootRef}
    >
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="matching-pairs-node__columns time-matching-node__columns">
        {attrs.times.map((time, index) => {
          const right = rightTimes[index];
          return (
            <div className="contents" key={time.id}>
              <div
                className="matching-pairs-node__row time-matching-node__row time-matching-node__row--left"
                data-time-id={time.id}
                data-time-side="left"
              >
                <span className="custom-block__row-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="matching-pairs-node__label matching-pairs-node__label--left">
                  <TimeDisplay representation={attrs.leftRepresentation} time={time} />
                </span>
                <BlockChoiceIndicator checked={false} />
              </div>
              <div
                className="matching-pairs-node__row time-matching-node__row time-matching-node__row--right"
                data-time-id={right?.id}
                data-time-side="right"
              >
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
        <svg
          aria-hidden="true"
          className="matching-pairs-node__solutions"
          ref={solutionsRef}
        />
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
      allowedMinutes: {
        default: DEFAULT_TIME_MATCHING_ATTRS.allowedMinutes,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-allowed-minutes'),
          DEFAULT_TIME_MATCHING_ATTRS.allowedMinutes,
        ),
        renderHTML: ({ allowedMinutes }) => ({
          'data-allowed-minutes': encodeURIComponent(
            JSON.stringify(allowedMinutes),
          ),
        }),
      },
      rangeStart: {
        default: DEFAULT_TIME_MATCHING_ATTRS.rangeStart,
        parseHTML: (element) => (
          element.getAttribute('data-range-start')
          ?? DEFAULT_TIME_MATCHING_ATTRS.rangeStart
        ),
        renderHTML: ({ rangeStart }) => ({
          'data-range-start': rangeStart,
        }),
      },
      rangeEnd: {
        default: DEFAULT_TIME_MATCHING_ATTRS.rangeEnd,
        parseHTML: (element) => (
          element.getAttribute('data-range-end')
          ?? DEFAULT_TIME_MATCHING_ATTRS.rangeEnd
        ),
        renderHTML: ({ rangeEnd }) => ({
          'data-range-end': rangeEnd,
        }),
      },
      shuffleLeft: {
        default: DEFAULT_TIME_MATCHING_ATTRS.shuffleLeft,
        parseHTML: (element) => (
          element.getAttribute('data-shuffle-left') === 'true'
        ),
        renderHTML: ({ shuffleLeft }) => ({
          'data-shuffle-left': String(shuffleLeft),
        }),
      },
      shuffleRight: {
        default: DEFAULT_TIME_MATCHING_ATTRS.shuffleRight,
        parseHTML: (element) => (
          element.getAttribute('data-shuffle-right') !== 'false'
        ),
        renderHTML: ({ shuffleRight }) => ({
          'data-shuffle-right': String(shuffleRight),
        }),
      },
      showFirstAsExample: {
        default: DEFAULT_TIME_MATCHING_ATTRS.showFirstAsExample,
        parseHTML: (element) => (
          element.getAttribute('data-show-first-as-example') === 'true'
        ),
        renderHTML: ({ showFirstAsExample }) => ({
          'data-show-first-as-example': String(showFirstAsExample),
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
