"use client";

import { useLayoutEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import rough from 'roughjs';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type ChooseCorrectWordItem = {
  id: string;
  word: string;
  optionCount: number;
};

export type ChooseCorrectWordsAttrs = {
  instruction: string;
  keepLeft: number;
  keepRight: number;
  showFirstAsExample: boolean;
  items: ChooseCorrectWordItem[];
  generation: number;
};

export const DEFAULT_CHOOSE_CORRECT_WORD_ITEMS: ChooseCorrectWordItem[] = [
  { id: 'correct-word-1', word: 'welcome', optionCount: 8 },
  { id: 'correct-word-2', word: 'woman', optionCount: 8 },
  { id: 'correct-word-3', word: 'where', optionCount: 8 },
  { id: 'correct-word-4', word: 'arrive', optionCount: 8 },
];

function defaultItems() {
  return DEFAULT_CHOOSE_CORRECT_WORD_ITEMS.map((item) => ({ ...item }));
}

function clampInteger(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number,
) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.min(maximum, Math.max(minimum, Math.round(number)))
    : fallback;
}

function parseItems(value: string | null): ChooseCorrectWordItem[] {
  if (!value) return defaultItems();
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) return defaultItems();
    return items.map((item, index) => ({
      id: typeof item.id === 'string' ? item.id : `correct-word-${index + 1}`,
      word: typeof item.word === 'string' ? item.word : '',
      optionCount: clampInteger(item.optionCount, 2, 12, 8),
    }));
  } catch {
    return defaultItems();
  }
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(values: T[], random: () => number) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function generateOptions(
  item: ChooseCorrectWordItem,
  keepLeft: number,
  keepRight: number,
  generation: number,
  correctFirst: boolean,
) {
  const characters = Array.from(item.word.trim());
  const lockedLeft = Math.min(keepLeft, characters.length);
  const lockedRight = Math.min(
    keepRight,
    Math.max(0, characters.length - lockedLeft),
  );
  const left = characters.slice(0, lockedLeft);
  const right = lockedRight
    ? characters.slice(characters.length - lockedRight)
    : [];
  const middle = characters.slice(
    lockedLeft,
    lockedRight ? characters.length - lockedRight : characters.length,
  );
  const random = createRandom(stableHash(`${item.id}:${item.word}:${generation}`));
  const correctCount = Math.max(1, Math.round(item.optionCount * 0.3));
  const options = Array.from({ length: correctCount }, () => ({
    text: item.word,
    correct: true,
  }));

  for (let index = correctCount; index < item.optionCount; index += 1) {
    let incorrectMiddle = shuffle(middle, random);
    for (
      let attempt = 0;
      attempt < 8 && incorrectMiddle.join('') === middle.join('');
      attempt += 1
    ) {
      incorrectMiddle = shuffle(middle, random);
    }

    if (incorrectMiddle.join('') === middle.join('')) {
      if (incorrectMiddle.length) {
        const mutationIndex = index % incorrectMiddle.length;
        const character = incorrectMiddle[mutationIndex];
        const isUpperCase = character === character.toLocaleUpperCase()
          && character !== character.toLocaleLowerCase();
        const replacements = Array.from(
          isUpperCase ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz',
        );
        const replacementOffset = Math.floor(random() * replacements.length);
        const replacement = replacements.find((candidate, candidateIndex) => (
          candidateIndex >= replacementOffset && candidate !== character
        )) ?? replacements.find((candidate) => candidate !== character) ?? 'x';
        incorrectMiddle = [...incorrectMiddle];
        incorrectMiddle[mutationIndex] = replacement;
      } else {
        incorrectMiddle = ['x'];
      }
    }

    options.push({
      text: [...left, ...incorrectMiddle, ...right].join(''),
      correct: false,
    });
  }

  const shuffled = shuffle(options, random);
  if (!correctFirst) return shuffled;
  const correctIndex = shuffled.findIndex(({ correct }) => correct);
  if (correctIndex <= 0) return shuffled;
  return [
    shuffled[correctIndex],
    ...shuffled.filter((_, index) => index !== correctIndex),
  ];
}

function ChooseCorrectWordsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as ChooseCorrectWordsAttrs;
  const rowsRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<SVGSVGElement>(null);
  const items = attrs.generation === 0
    ? attrs.items
    : [...attrs.items].sort((first, second) => (
        stableHash(`${first.id}:${attrs.generation}`)
        - stableHash(`${second.id}:${attrs.generation}`)
      ));
  const renderedItems = items.map((item) => ({
    item,
    options: generateOptions(
      item,
      attrs.keepLeft,
      attrs.keepRight,
      attrs.generation,
      attrs.showFirstAsExample,
    ),
  }));

  useLayoutEffect(() => {
    const rows = rowsRef.current;
    const svg = solutionsRef.current;
    if (!rows || !svg) return;

    const drawSolutions = () => {
      const rowsRect = rows.getBoundingClientRect();
      if (!rowsRect.width || !rowsRect.height) return;

      svg.replaceChildren();
      svg.setAttribute('viewBox', `0 0 ${rowsRect.width} ${rowsRect.height}`);
      const roughSvg = rough.svg(svg);

      rows.querySelectorAll<HTMLElement>(
        '.choose-correct-words-node__option[data-correct="true"]:not([data-example="true"])',
      ).forEach((option) => {
        const optionRect = option.getBoundingClientRect();
        const centerX = optionRect.left + optionRect.width / 2 - rowsRect.left;
        const centerY = optionRect.top + optionRect.height / 2 - rowsRect.top;
        const solutionKey = option.dataset.solutionKey ?? '';
        const oval = roughSvg.ellipse(
          centerX,
          centerY,
          Math.max(1, optionRect.width - 4),
          Math.max(1, optionRect.height - 4),
          {
            bowing: 1.4,
            disableMultiStroke: true,
            roughness: 1.15,
            seed: stableHash(solutionKey) || 1,
            stroke: 'var(--custom-block-solution-color)',
            strokeWidth: 1.5,
          },
        );
        svg.appendChild(oval);
      });
    };

    drawSolutions();
    const resizeObserver = new ResizeObserver(drawSolutions);
    resizeObserver.observe(rows);
    window.addEventListener('resize', drawSolutions);
    void document.fonts.ready.then(drawSolutions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawSolutions);
    };
  });

  return (
    <CustomBlockRoot selected={selected} className="choose-correct-words-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="choose-correct-words-node__rows" ref={rowsRef}>
        <svg
          aria-hidden="true"
          className="choose-correct-words-node__solutions"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {renderedItems.map(({ item, options }, itemIndex) => (
          <div className="choose-correct-words-node__row" key={item.id}>
            <span className="custom-block__row-index">
              {String(itemIndex + 1).padStart(2, '0')}
            </span>
            <div className="choose-correct-words-node__options">
              {options.map((option, optionIndex) => (
                <span
                  className="choose-correct-words-node__option"
                  data-correct={option.correct}
                  data-example={
                    attrs.showFirstAsExample
                    && optionIndex === 0
                  }
                  data-solution-key={`${item.id}:${optionIndex}`}
                  key={`${optionIndex}-${option.text}`}
                >
                  <span className="custom-block__compact-label">
                    {option.text}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    chooseCorrectWords: {
      insertChooseCorrectWords: (
        attrs?: Partial<ChooseCorrectWordsAttrs>,
      ) => ReturnType;
    };
  }
}

export const ChooseCorrectWords = Node.create({
  name: 'chooseCorrectWords',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Choose the correctly written words.',
        parseHTML: (element) => (
          element.getAttribute('data-choose-correct-instruction')
          ?? 'Choose the correctly written words.'
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-instruction': attributes.instruction,
        }),
      },
      keepLeft: {
        default: 1,
        parseHTML: (element) => clampInteger(
          element.getAttribute('data-choose-correct-keep-left'),
          0,
          10,
          1,
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-keep-left': attributes.keepLeft,
        }),
      },
      keepRight: {
        default: 1,
        parseHTML: (element) => clampInteger(
          element.getAttribute('data-choose-correct-keep-right'),
          0,
          10,
          1,
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-keep-right': attributes.keepRight,
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-choose-correct-show-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-show-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
      items: {
        default: DEFAULT_CHOOSE_CORRECT_WORD_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-choose-correct-items'),
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
      generation: {
        default: 0,
        parseHTML: (element) => clampInteger(
          element.getAttribute('data-choose-correct-generation'),
          0,
          Number.MAX_SAFE_INTEGER,
          0,
        ),
        renderHTML: (attributes) => ({
          'data-choose-correct-generation': attributes.generation,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="choose-correct-words"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'choose-correct-words' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ChooseCorrectWordsNodeView);
  },

  addCommands() {
    return {
      insertChooseCorrectWords:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction: attrs.instruction
                ?? 'Choose the correctly written words.',
              keepLeft: attrs.keepLeft ?? 1,
              keepRight: attrs.keepRight ?? 1,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
              items: attrs.items ?? defaultItems(),
              generation: attrs.generation ?? 0,
            },
          }),
    };
  },
});
