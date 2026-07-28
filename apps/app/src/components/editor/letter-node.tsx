"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockInstruction,
  BlockRowLabel,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import {
  CUSTOM_BLOCK_NODE_GROUP,
} from '@/components/editor/custom-blocks/numbering';

export type LetterNodeItem = {
  id: string;
  clue: string;
  answer: string;
};

export type LetterNodeAttrs = {
  instruction: string;
  alphabetChoice: 'english' | 'german';
  alphabet: string;
  helperLetters: string;
  keyColumns: number;
  cellHeight: number;
  showKey: boolean;
  showItemNumbers: boolean;
  showFirstAsExample: boolean;
  items: LetterNodeItem[];
};

export const ENGLISH_LETTER_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const GERMAN_LETTER_ALPHABET = `${ENGLISH_LETTER_ALPHABET}ÄÖÜ`;
export const DEFAULT_LETTER_ALPHABET = GERMAN_LETTER_ALPHABET;
export const DEFAULT_LETTER_INSTRUCTION =
  'Use the number code to find the words.';
export const DEFAULT_LETTER_ITEMS: LetterNodeItem[] = [
  {
    id: 'letter-item-1',
    clue: 'Gebäude zum Wohnen',
    answer: 'HAUS',
  },
  {
    id: 'letter-item-2',
    clue: 'Ort zum Lernen',
    answer: 'SCHULE',
  },
];

function normalizeCharacters(value: string) {
  return Array.from(value.toLocaleUpperCase('de-CH'));
}

function uniqueAlphabet(value: string) {
  return [...new Set(
    normalizeCharacters(value).filter((character) => !/\s/.test(character)),
  )];
}

function parseItems(value: string | null): LetterNodeItem[] {
  if (!value) return DEFAULT_LETTER_ITEMS.map((item) => ({ ...item }));
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) {
      return DEFAULT_LETTER_ITEMS.map((item) => ({ ...item }));
    }
    const parsed = items.flatMap((item, index): LetterNodeItem[] => (
      item && typeof item.clue === 'string' && typeof item.answer === 'string'
        ? [{
            id: typeof item.id === 'string'
              ? item.id
              : `letter-item-${index + 1}`,
            clue: item.clue,
            answer: item.answer,
          }]
        : []
    ));
    return parsed.length
      ? parsed
      : DEFAULT_LETTER_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_LETTER_ITEMS.map((item) => ({ ...item }));
  }
}

function LetterCell({
  character,
  alphabet,
  helpers,
  example = false,
}: {
  character: string;
  alphabet: string[];
  helpers: Set<string>;
  example?: boolean;
}) {
  if (/\s/.test(character)) {
    return <span aria-hidden="true" className="letter-node__space" />;
  }
  const alphabetIndex = alphabet.indexOf(character);
  if (alphabetIndex < 0) {
    return (
      <span className="letter-node__literal">
        {character}
      </span>
    );
  }
  const isHelper = helpers.has(character);
  return (
    <span
      className="letter-node__cell"
      data-example={example}
      data-helper={isHelper}
      data-letter={character}
    >
      <span className="letter-node__code">
        {String(alphabetIndex + 1).padStart(2, '0')}
      </span>
      <strong className="letter-node__answer-letter">
        {character}
      </strong>
    </span>
  );
}

function LetterNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as LetterNodeAttrs;
  const cellGapRem = 0.35;
  const cellWidth = `calc(${100 / attrs.keyColumns}cqi - ${
    ((attrs.keyColumns - 1) * cellGapRem) / attrs.keyColumns
  }rem)`;
  const alphabet = uniqueAlphabet(
    attrs.alphabetChoice === 'english'
      ? ENGLISH_LETTER_ALPHABET
      : GERMAN_LETTER_ALPHABET,
  );
  const helpers = new Set(normalizeCharacters(attrs.helperLetters));
  const exampleLetters = new Set(
    attrs.showFirstAsExample && attrs.items[0]
      ? normalizeCharacters(attrs.items[0].answer)
      : [],
  );

  return (
    <CustomBlockRoot selected={selected} className="letter-node">
      <BlockInstruction>
        {attrs.instruction || DEFAULT_LETTER_INSTRUCTION}
      </BlockInstruction>
      <div
        className="letter-node__content"
        style={{
          '--letter-cell-width': cellWidth,
        } as React.CSSProperties}
      >
        {attrs.showKey && (
          <div
            className="letter-node__key"
            style={{
              gridTemplateColumns: `repeat(${attrs.keyColumns}, minmax(0, 1fr))`,
            }}
          >
            {alphabet.map((character, index) => (
              <span
                className="letter-node__key-cell"
                data-example={exampleLetters.has(character)}
                data-helper={helpers.has(character)}
                key={`${character}-${index}`}
              >
                <span className="letter-node__code">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong className="letter-node__answer-letter">
                  {character}
                </strong>
              </span>
            ))}
          </div>
        )}
        <div className="letter-node__items">
          {attrs.items.map((item, index) => (
            <div
              className="letter-node__item"
              data-item-numbers={attrs.showItemNumbers}
              key={item.id}
            >
              <div className="letter-node__item-heading">
                {attrs.showItemNumbers && (
                  <span className="custom-block__row-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                <BlockRowLabel>{item.clue}</BlockRowLabel>
              </div>
              <div className="letter-node__answer">
                {normalizeCharacters(item.answer).map((character, charIndex) => (
                  <LetterCell
                    alphabet={alphabet}
                    character={character}
                    example={attrs.showFirstAsExample && index === 0}
                    helpers={helpers}
                    key={`${item.id}-${charIndex}-${character}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    letterNode: {
      insertLetterNode: (attrs?: Partial<LetterNodeAttrs>) => ReturnType;
    };
  }
}

export const LetterNode = Node.create({
  name: 'letterNode',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_LETTER_INSTRUCTION,
        parseHTML: (element) => (
          element.getAttribute('data-letter-instruction')
          ?? DEFAULT_LETTER_INSTRUCTION
        ),
        renderHTML: (attributes) => ({
          'data-letter-instruction': attributes.instruction,
        }),
      },
      alphabetChoice: {
        default: 'german',
        parseHTML: (element) => {
          const choice = element.getAttribute('data-letter-alphabet-choice');
          if (choice === 'english' || choice === 'german') return choice;
          return element.getAttribute('data-letter-alphabet')
            === ENGLISH_LETTER_ALPHABET
            ? 'english'
            : 'german';
        },
        renderHTML: (attributes) => ({
          'data-letter-alphabet-choice': attributes.alphabetChoice,
        }),
      },
      alphabet: {
        default: DEFAULT_LETTER_ALPHABET,
        parseHTML: (element) => (
          element.getAttribute('data-letter-alphabet')
          ?? DEFAULT_LETTER_ALPHABET
        ),
        renderHTML: (attributes) => ({
          'data-letter-alphabet': attributes.alphabet,
        }),
      },
      helperLetters: {
        default: 'U',
        parseHTML: (element) => (
          element.getAttribute('data-letter-helpers') ?? 'U'
        ),
        renderHTML: (attributes) => ({
          'data-letter-helpers': attributes.helperLetters,
        }),
      },
      keyColumns: {
        default: 15,
        parseHTML: (element) => Math.min(20, Math.max(5, Number(
          element.getAttribute('data-letter-key-columns') ?? 15,
        ))),
        renderHTML: (attributes) => ({
          'data-letter-key-columns': attributes.keyColumns,
        }),
      },
      cellHeight: {
        default: 52,
        parseHTML: (element) => Math.min(90, Math.max(36, Number(
          element.getAttribute('data-letter-cell-height') ?? 52,
        ))),
        renderHTML: (attributes) => ({
          'data-letter-cell-height': attributes.cellHeight,
        }),
      },
      showKey: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-letter-show-key') !== 'false',
        renderHTML: (attributes) => ({
          'data-letter-show-key': String(attributes.showKey),
        }),
      },
      showItemNumbers: {
        default: true,
        parseHTML: (element) => element.getAttribute('data-letter-item-numbers') !== 'false',
        renderHTML: (attributes) => ({
          'data-letter-item-numbers': String(attributes.showItemNumbers),
        }),
      },
      showFirstAsExample: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-letter-show-example') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-letter-show-example': String(attributes.showFirstAsExample),
        }),
      },
      items: {
        default: DEFAULT_LETTER_ITEMS,
        parseHTML: (element) => parseItems(element.getAttribute('data-letter-items')),
        renderHTML: (attributes) => ({
          'data-letter-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="letter-node"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'letter-node' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LetterNodeView);
  },

  addCommands() {
    return {
      insertLetterNode:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            instruction: attrs.instruction ?? DEFAULT_LETTER_INSTRUCTION,
            alphabetChoice: attrs.alphabetChoice ?? 'german',
            alphabet: attrs.alphabet ?? DEFAULT_LETTER_ALPHABET,
            helperLetters: attrs.helperLetters ?? 'U',
            keyColumns: attrs.keyColumns ?? 15,
            cellHeight: attrs.cellHeight ?? 52,
            showKey: attrs.showKey ?? true,
            showItemNumbers: attrs.showItemNumbers ?? true,
            showFirstAsExample: attrs.showFirstAsExample ?? true,
            items: attrs.items
              ?? DEFAULT_LETTER_ITEMS.map((item) => ({ ...item })),
          },
        }),
    };
  },
});
