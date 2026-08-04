"use client";

import {
  Fragment,
  useLayoutEffect,
  useRef,
} from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import rough from 'roughjs';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  BlockQuestion,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';

export type MatchingPair = {
  id: string;
  left: string;
  right: string;
};

export type MatchingPairsAnswerStyle = 'checkboxes' | 'writingLines';

export type MatchingPairsAttrs = {
  instruction: string;
  question: string;
  pairs: MatchingPair[];
  rightOrder: string[];
  showWordBank: boolean;
  shuffleWordBank: boolean;
  showFirstAsExample: boolean;
  answerStyle: MatchingPairsAnswerStyle;
};

export const DEFAULT_MATCHING_INSTRUCTION =
  'Match the items on the left with the items on the right.';

export const DEFAULT_MATCHING_PAIRS: MatchingPair[] = [
  { id: 'pair-1', left: 'Item 1', right: 'Match 1' },
  { id: 'pair-2', left: 'Item 2', right: 'Match 2' },
  { id: 'pair-3', left: 'Item 3', right: 'Match 3' },
];

function defaultPairs() {
  return DEFAULT_MATCHING_PAIRS.map((pair) => ({ ...pair }));
}

function parseValue<T>(value: string | null, fallback: () => T[]): T[] {
  if (!value) return fallback();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed) ? parsed : fallback();
  } catch {
    return fallback();
  }
}

function normalizedRightOrder(pairs: MatchingPair[], rightOrder: string[]) {
  const pairIds = new Set(pairs.map(({ id }) => id));
  return [
    ...rightOrder.filter((id) => pairIds.has(id)),
    ...pairs.map(({ id }) => id).filter((id) => !rightOrder.includes(id)),
  ];
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function MatchingEndpoint({
  answerStyle,
  side,
  solutionText,
  solutionKind,
}: {
  answerStyle: MatchingPairsAnswerStyle;
  side: 'left' | 'right';
  solutionText?: string;
  solutionKind?: 'solution' | 'example';
}) {
  if (answerStyle === 'writingLines') {
    return (
      <span
        aria-hidden="true"
        className="matching-pairs-node__endpoint matching-pairs-node__writing-line"
        data-matching-endpoint
        data-matching-endpoint-side={side}
        data-solution-text={solutionText}
        data-solution-kind={solutionKind}
      />
    );
  }
  return (
    <span
      className="matching-pairs-node__endpoint"
      data-matching-endpoint
      data-matching-endpoint-side={side}
    >
      <BlockChoiceIndicator checked={false} />
    </span>
  );
}

function MatchingPairsNodeView({ node, selected }: NodeViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<SVGSVGElement>(null);
  const {
    instruction,
    question,
    pairs,
    rightOrder,
    showWordBank,
    shuffleWordBank,
    showFirstAsExample,
    answerStyle,
  } = node.attrs as MatchingPairsAttrs;
  const pairById = new Map(pairs.map((pair) => [pair.id, pair]));
  const orderedRightPairs = normalizedRightOrder(pairs, rightOrder)
    .map((id) => pairById.get(id))
    .filter((pair): pair is MatchingPair => Boolean(pair));
  const rightLetterByPairId = new Map(
    orderedRightPairs.map((pair, index) => [
      pair.id,
      String.fromCharCode(97 + index),
    ]),
  );
  const leftNumberByPairId = new Map(
    pairs.map((pair, index) => [pair.id, String(index + 1)]),
  );
  const wordBankItems = pairs
    .map((pair) => ({
      id: pair.id,
      text: `${pair.left.trim()}${pair.right.trim()}`,
    }))
    .filter(({ text }) => text.trim())
    .sort((first, second) => (
      shuffleWordBank ? stableHash(first.id) - stableHash(second.id) : 0
    ));

  useLayoutEffect(() => {
    const root = rootRef.current;
    const svg = solutionsRef.current;
    const columns = svg?.parentElement;
    if (!root || !svg || !columns) return;

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
        '[data-matching-pair-id][data-matching-side]',
      ).forEach((row) => {
        const pairId = row.dataset.matchingPairId;
        const side = row.dataset.matchingSide;
        const indicator = row.querySelector<HTMLElement>(
          '[data-matching-endpoint]',
        );
        if (!pairId || !indicator || (side !== 'left' && side !== 'right')) {
          return;
        }
        const endpoint = endpoints.get(pairId) ?? {};
        endpoint[side] = indicator;
        endpoints.set(pairId, endpoint);
      });

      pairs.forEach((pair) => {
        const endpoint = endpoints.get(pair.id);
        if (!endpoint?.left || !endpoint.right) return;
        const leftRect = endpoint.left.getBoundingClientRect();
        const rightRect = endpoint.right.getBoundingClientRect();
        const line = roughSvg.line(
          (
            leftRect.left
            + leftRect.width / 2
            - columnsRect.left
          ) / scaleX,
          (
            leftRect.top
            + leftRect.height / 2
            - columnsRect.top
          ) / scaleY,
          (
            rightRect.left
            + rightRect.width / 2
            - columnsRect.left
          ) / scaleX,
          (
            rightRect.top
            + rightRect.height / 2
            - columnsRect.top
          ) / scaleY,
          {
            bowing: 1.4,
            disableMultiStroke: true,
            roughness: 1.15,
            seed: stableHash(pair.id) || 1,
            stroke: 'var(--custom-block-solution-color)',
            strokeWidth: 1.5,
          },
        );
        const solutionKind = showFirstAsExample && pair === pairs[0]
          ? 'example'
          : 'solution';
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
    columns.querySelectorAll<HTMLElement>(
      '.matching-pairs-node__row',
    ).forEach((row) => resizeObserver.observe(row));
    window.addEventListener('resize', drawSolutions);
    void document.fonts.ready.then(drawSolutions);
    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawSolutions);
    };
  }, [pairs, rightOrder, question, showFirstAsExample, showWordBank, answerStyle]);

  return (
    <CustomBlockRoot
      selected={selected}
      className="matching-pairs-node"
      rootRef={rootRef}
    >
      <BlockInstruction>
        {instruction || DEFAULT_MATCHING_INSTRUCTION}
      </BlockInstruction>
      <BlockQuestion>
        <InlineFormattedText text={question} />
      </BlockQuestion>
      {showWordBank && (
        <div className="custom-block__word-bank matching-pairs-node__word-bank">
          {wordBankItems.map((item) => (
            <span
              className="custom-block__word-bank-item matching-pairs-node__word-bank-item"
              key={item.id}
            >
              <InlineFormattedText text={item.text} />
              {showFirstAsExample && item.id === pairs[0]?.id && (
                <RoughExampleStrike seed={`matching:${item.id}`} />
              )}
            </span>
          ))}
        </div>
      )}
      <div className={`matching-pairs-node__columns${answerStyle === 'writingLines' ? ' matching-pairs-node__columns--writing-lines' : ''}`}>
        {pairs.map((pair, index) => {
          const rightPair = orderedRightPairs[index];
          return (
            <Fragment key={pair.id}>
            <div
              className="matching-pairs-node__row"
              data-matching-pair-id={pair.id}
              data-matching-side="left"
              key={pair.id}
            >
              <span className="custom-block__row-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="matching-pairs-node__label matching-pairs-node__label--left">
                <InlineFormattedText
                  fallback={`Item ${index + 1}`}
                  text={pair.left}
                />
              </span>
              <MatchingEndpoint
                answerStyle={answerStyle}
                side="left"
                solutionText={rightLetterByPairId.get(pair.id)}
                solutionKind={showFirstAsExample && pair === pairs[0] ? 'example' : 'solution'}
              />
            </div>
            <div
              className="matching-pairs-node__row"
              data-matching-pair-id={rightPair?.id}
              data-matching-side="right"
            >
              <MatchingEndpoint
                answerStyle={answerStyle}
                side="right"
                solutionText={rightPair ? leftNumberByPairId.get(rightPair.id) : undefined}
                solutionKind={showFirstAsExample && rightPair?.id === pairs[0]?.id ? 'example' : 'solution'}
              />
              <span className="matching-pairs-node__label">
                <InlineFormattedText
                  fallback={`Match ${index + 1}`}
                  text={rightPair?.right ?? ''}
                />
              </span>
              <span className="custom-block__row-index matching-pairs-node__letter">
                {String.fromCharCode(97 + index)}
              </span>
            </div>
            </Fragment>
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
    matchingPairs: {
      insertMatchingPairs: (attrs?: Partial<MatchingPairsAttrs>) => ReturnType;
    };
  }
}

export const MatchingPairs = Node.create({
  name: 'matchingPairs',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_MATCHING_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-matching-instruction')
          ?? DEFAULT_MATCHING_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-matching-instruction': attributes.instruction,
        }),
      },
      question: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-matching-question')
          ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-matching-question': attributes.question,
        }),
      },
      pairs: {
        default: DEFAULT_MATCHING_PAIRS,
        parseHTML: (element) => parseValue(
          element.getAttribute('data-matching-pairs'),
          defaultPairs,
        ),
        renderHTML: (attributes) => ({
          'data-matching-pairs': encodeURIComponent(JSON.stringify(attributes.pairs)),
        }),
      },
      rightOrder: {
        default: ['pair-2', 'pair-1', 'pair-3'],
        parseHTML: (element) => parseValue(
          element.getAttribute('data-matching-right-order'),
          () => ['pair-2', 'pair-1', 'pair-3'],
        ),
        renderHTML: (attributes) => ({
          'data-matching-right-order': encodeURIComponent(
            JSON.stringify(attributes.rightOrder),
          ),
        }),
      },
      showWordBank: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-matching-show-word-bank') === 'true',
        renderHTML: (attributes) => ({
          'data-matching-show-word-bank': String(attributes.showWordBank),
        }),
      },
      shuffleWordBank: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-matching-shuffle-word-bank') === 'true',
        renderHTML: (attributes) => ({
          'data-matching-shuffle-word-bank': String(attributes.shuffleWordBank),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-matching-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-matching-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
      answerStyle: {
        default: 'checkboxes' satisfies MatchingPairsAnswerStyle,
        parseHTML: (element) => (
          element.getAttribute('data-matching-answer-style') === 'writingLines'
            ? 'writingLines'
            : 'checkboxes'
        ),
        renderHTML: (attributes) => ({
          'data-matching-answer-style': attributes.answerStyle,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="matching-pairs"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'matching-pairs' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MatchingPairsNodeView);
  },

  addCommands() {
    return {
      insertMatchingPairs:
        (attrs = {}) =>
        ({ commands }) => {
          const pairs = attrs.pairs ?? defaultPairs();
          return commands.insertContent({
            type: this.name,
            attrs: {
              instruction:
                attrs.instruction ?? DEFAULT_MATCHING_INSTRUCTION,
              question: attrs.question ?? '',
              pairs,
              rightOrder: attrs.rightOrder
                ?? [pairs[1]?.id, pairs[0]?.id, ...pairs.slice(2).map(({ id }) => id)]
                  .filter((id): id is string => Boolean(id)),
              showWordBank: attrs.showWordBank ?? false,
              shuffleWordBank: attrs.shuffleWordBank ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
              answerStyle: attrs.answerStyle ?? 'checkboxes',
            },
          });
        },
    };
  },
});
