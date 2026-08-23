"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  BlockRowLabel,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type AnagramNodeItem = {
  id: string;
  clue: string;
  answer: string;
};

export type AnagramNodeAttrs = {
  instruction: string;
  hideInstructionBadge: boolean;
  showClues: boolean;
  showItemNumbers: boolean;
  items: AnagramNodeItem[];
};

export const DEFAULT_ANAGRAM_INSTRUCTION =
  'Put the letters in the correct order and write the word.';
export const DEFAULT_ANAGRAM_ITEMS: AnagramNodeItem[] = [
  { id: 'anagram-item-1', clue: 'Gebäude zum Wohnen', answer: 'HAUS' },
  { id: 'anagram-item-2', clue: 'Ort zum Lernen', answer: 'SCHULE' },
];

function parseItems(value: string | null): AnagramNodeItem[] {
  if (!value) return DEFAULT_ANAGRAM_ITEMS.map((item) => ({ ...item }));
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) throw new Error('Invalid anagram items');
    const parsed = items.flatMap((item, index): AnagramNodeItem[] => (
      item && typeof item.clue === 'string' && typeof item.answer === 'string'
        ? [{
            id: typeof item.id === 'string'
              ? item.id
              : `anagram-item-${index + 1}`,
            clue: item.clue,
            answer: item.answer,
          }]
        : []
    ));
    return parsed.length
      ? parsed
      : DEFAULT_ANAGRAM_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_ANAGRAM_ITEMS.map((item) => ({ ...item }));
  }
}

function shuffleLetters(value: string, seedText: string) {
  const letters = Array.from(value).filter((character) => !/\s/.test(character));
  let seed = 2166136261;
  for (const character of `${seedText}::${value}`) {
    seed ^= character.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  for (let index = letters.length - 1; index > 0; index -= 1) {
    seed += 0x6D2B79F5;
    let random = Math.imul(seed ^ seed >>> 15, 1 | seed);
    random ^= random + Math.imul(random ^ random >>> 7, 61 | random);
    const target = Math.floor(((random ^ random >>> 14) >>> 0) / 4294967296 * (index + 1));
    [letters[index], letters[target]] = [letters[target], letters[index]];
  }
  if (letters.length > 1 && letters.every((letter, index) => (
    letter === Array.from(value).filter((character) => !/\s/.test(character))[index]
  ))) {
    [letters[0], letters[1]] = [letters[1], letters[0]];
  }
  if (/\s/.test(value)) letters.push(' ');
  return letters;
}

function AnagramSquares({
  letters,
  solution = false,
}: {
  letters: string[];
  solution?: boolean;
}) {
  return (
    <div className="anagram-node__row" data-solution={solution}>
      {letters.map((letter, index) => (
        <span
          className="anagram-node__cell"
          data-blank={/\s/.test(letter)}
          key={`${letter}-${index}`}
        >
          {!/\s/.test(letter) && (
            <strong className="anagram-node__letter">{letter}</strong>
          )}
        </span>
      ))}
    </div>
  );
}

function AnagramNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as AnagramNodeAttrs;

  return (
    <CustomBlockRoot selected={selected} className="anagram-node">
      <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
        {attrs.instruction || DEFAULT_ANAGRAM_INSTRUCTION}
      </BlockInstruction>
      <div className="anagram-node__items">
        {attrs.items.map((item, index) => {
          const answerLetters = Array.from(item.answer);
          return (
            <div
              className="anagram-node__item"
              data-item-numbers={attrs.showItemNumbers}
              data-show-clues={attrs.showClues}
              key={item.id}
            >
              {(attrs.showClues || attrs.showItemNumbers) && (
                <div className="anagram-node__heading">
                  {attrs.showItemNumbers && (
                    <span className="custom-block__row-index">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  )}
                  {attrs.showClues && <BlockRowLabel>{item.clue}</BlockRowLabel>}
                </div>
              )}
              <div className="anagram-node__rows">
                <AnagramSquares letters={shuffleLetters(item.answer, item.id)} />
                <AnagramSquares letters={answerLetters} solution />
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
    anagramNode: {
      insertAnagramNode: (attrs?: Partial<AnagramNodeAttrs>) => ReturnType;
    };
  }
}

export const AnagramNode = Node.create({
  name: 'anagramNode',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_ANAGRAM_INSTRUCTION,
        parseHTML: (element: HTMLElement) => (
          element.getAttribute('data-anagram-instruction')
          ?? DEFAULT_ANAGRAM_INSTRUCTION
        ),
        renderHTML: (attributes: AnagramNodeAttrs) => ({
          'data-anagram-instruction': attributes.instruction,
        }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element: HTMLElement) => (
          element.getAttribute('data-anagram-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes: AnagramNodeAttrs) => ({
          'data-anagram-hide-instruction-badge': String(
            attributes.hideInstructionBadge,
          ),
        }),
      },
      showClues: {
        default: true,
        parseHTML: (element: HTMLElement) => (
          element.getAttribute('data-anagram-show-clues') !== 'false'
        ),
        renderHTML: (attributes: AnagramNodeAttrs) => ({
          'data-anagram-show-clues': String(attributes.showClues),
        }),
      },
      showItemNumbers: {
        default: true,
        parseHTML: (element: HTMLElement) => (
          element.getAttribute('data-anagram-item-numbers') !== 'false'
        ),
        renderHTML: (attributes: AnagramNodeAttrs) => ({
          'data-anagram-item-numbers': String(attributes.showItemNumbers),
        }),
      },
      items: {
        default: DEFAULT_ANAGRAM_ITEMS,
        parseHTML: (element: HTMLElement) => (
          parseItems(element.getAttribute('data-anagram-items'))
        ),
        renderHTML: (attributes: AnagramNodeAttrs) => ({
          'data-anagram-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="anagram-node"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'anagram-node' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(AnagramNodeView);
  },

  addCommands() {
    return {
      insertAnagramNode:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_ANAGRAM_INSTRUCTION,
            hideInstructionBadge: attrs.hideInstructionBadge ?? false,
            showClues: attrs.showClues ?? true,
            showItemNumbers: attrs.showItemNumbers ?? true,
            items: attrs.items
              ?? DEFAULT_ANAGRAM_ITEMS.map((item) => ({ ...item })),
          },
        }),
    };
  },
});