"use client";

import { Fragment, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';
import {
  InlineFormattedText,
} from '@/components/editor/custom-blocks/inline-formatting';

export type InlineChoiceSentence = {
  id: string;
  type: 'sentence';
  text: string;
};

export type InlineChoiceDivider = {
  id: string;
  type: 'divider';
};

export type InlineChoiceSubtitle = {
  id: string;
  type: 'subtitle';
  text: string;
};

export type InlineChoiceItem =
  | InlineChoiceSentence
  | InlineChoiceDivider
  | InlineChoiceSubtitle;

export type InlineChoiceAttrs = {
  instruction: string;
  shuffleChoices: boolean;
  showFirstAsExample: boolean;
  items: InlineChoiceItem[];
};

type InlineChoicePart =
  | { type: 'text'; value: string }
  | {
      type: 'choice';
      choices: { correct: boolean; text: string }[];
      index: number;
    };

export const DEFAULT_INLINE_CHOICE_ITEMS: InlineChoiceItem[] = [
  {
    id: 'inline-choice-1',
    type: 'sentence',
    text: '{{*I|you|she}} come from Greece. And {{I|*you|she}}?',
  },
  {
    id: 'inline-choice-2',
    type: 'sentence',
    text: '{{*I|you|she}} come from Italy.',
  },
  {
    id: 'inline-choice-3',
    type: 'sentence',
    text: 'Interesting. Which language do {{choice:I|*you|she}} speak?',
  },
];

function defaultItems() {
  return DEFAULT_INLINE_CHOICE_ITEMS.map((item) => ({ ...item }));
}

function parseItems(value: string | null): InlineChoiceItem[] {
  if (!value) return defaultItems();

  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) return defaultItems();

    const parsed = items.flatMap((item, index): InlineChoiceItem[] => {
      if (item?.type === 'divider') {
        return [{
          id: typeof item.id === 'string'
            ? item.id
            : `inline-choice-divider-${index + 1}`,
          type: 'divider',
        }];
      }
      if (item?.type === 'subtitle') {
        return [{
          id: typeof item.id === 'string'
            ? item.id
            : `inline-choice-subtitle-${index + 1}`,
          type: 'subtitle',
          text: typeof item.text === 'string' ? item.text : '',
        }];
      }
      if (item?.type === 'sentence') {
        return [{
          id: typeof item.id === 'string'
            ? item.id
            : `inline-choice-${index + 1}`,
          type: 'sentence',
          text: typeof item.text === 'string' ? item.text : '',
        }];
      }
      return [];
    });

    return parsed.length ? parsed : defaultItems();
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

function shuffleChoices(
  choices: { correct: boolean; text: string }[],
  seed: string,
) {
  const shuffled = choices
    .map((choice, index) => ({ ...choice, originalIndex: index }))
    .sort((first, second) => (
      stableHash(`${seed}:${first.originalIndex}`)
      - stableHash(`${seed}:${second.originalIndex}`)
    ));

  if (
    shuffled.length > 1
    && shuffled.every((choice, index) => choice.originalIndex === index)
  ) {
    return [...shuffled.slice(1), shuffled[0]];
  }
  return shuffled;
}

function capitalizeFirstLetter(value: string) {
  const characters = Array.from(value);
  const letterIndex = characters.findIndex((character) => (
    character.toLocaleUpperCase() !== character.toLocaleLowerCase()
  ));
  if (letterIndex < 0) return value;
  characters[letterIndex] = characters[letterIndex].toLocaleUpperCase();
  return characters.join('');
}

function parseInlineChoices(
  text: string,
  itemId: string,
  shouldShuffle: boolean,
): InlineChoicePart[] {
  const parts: InlineChoicePart[] = [];
  const pattern = /\{\{(?:choice:)?([^{}]*\|[^{}]*)\}\}/gi;
  let cursor = 0;
  let choiceIndex = 0;
  let match = pattern.exec(text);

  while (match) {
    if (match.index > cursor) {
      parts.push({ type: 'text', value: text.slice(cursor, match.index) });
    }

    const rawChoices = match[1]
      .split('|')
      .map((choice) => choice.trim())
      .filter(Boolean);
    const hasMarkedCorrectChoice = rawChoices.some((choice) => (
      choice.startsWith('*')
    ));
    const choices = rawChoices.map((choice, index) => ({
      correct: hasMarkedCorrectChoice
        ? choice.startsWith('*')
        : index === 0,
      text: choice.startsWith('*') ? choice.slice(1).trim() : choice,
    }));

    if (choices.length >= 2) {
      parts.push({
        type: 'choice',
        choices: shouldShuffle
          ? shuffleChoices(choices, `${itemId}:${choiceIndex}`)
          : choices,
        index: choiceIndex,
      });
    } else {
      parts.push({ type: 'text', value: match[0] });
    }

    choiceIndex += 1;
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    parts.push({ type: 'text', value: text.slice(cursor) });
  }

  return parts.length ? parts : [{ type: 'text', value: text }];
}

function InlineChoiceNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as InlineChoiceAttrs;
  const rowsRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(rowsRef);
  let sentenceIndex = 0;

  return (
    <CustomBlockRoot selected={selected} className="inline-choice-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      <div className="inline-choice-node__rows" ref={rowsRef}>
        <svg
          aria-hidden="true"
          className="inline-choice-node__solutions"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        {attrs.items.map((item) => {
          if (item.type === 'divider') {
            return (
              <div
                aria-hidden="true"
                className="inline-choice-node__divider-row"
                key={item.id}
              />
            );
          }
          if (item.type === 'subtitle') {
            return (
              <div className="inline-choice-node__subtitle-row" key={item.id}>
                <p className="inline-choice-node__subtitle">
                  <InlineFormattedText text={item.text} />
                </p>
              </div>
            );
          }

          const currentSentenceIndex = sentenceIndex;
          sentenceIndex += 1;
          const isExample = attrs.showFirstAsExample
            && currentSentenceIndex === 0;
          const parts = parseInlineChoices(
            item.text,
            item.id,
            attrs.shuffleChoices,
          );
          let hasSentenceContent = false;
          const renderedParts = parts.map((part) => {
            const capitalizeChoices = part.type === 'choice'
              && !hasSentenceContent;
            if (
              part.type === 'choice'
              || part.value.trim().length > 0
            ) {
              hasSentenceContent = true;
            }
            return { capitalizeChoices, part };
          });
          let exampleAssigned = false;

          return (
            <div className="inline-choice-node__row" key={item.id}>
              <span className="custom-block__row-index">
                {String(currentSentenceIndex + 1).padStart(2, '0')}
              </span>
              <p className="inline-choice-node__sentence">
                {renderedParts.map((renderedPart, partIndex) => {
                  const { capitalizeChoices, part } = renderedPart;
                  return (
                  <Fragment key={`${part.type}-${partIndex}`}>
                    {part.type === 'text' ? part.value : (
                      <span className="inline-choice-node__choice-group">
                        {part.choices.map((choice, optionIndex) => {
                          const showExample = isExample
                            && choice.correct
                            && !exampleAssigned;
                          if (showExample) exampleAssigned = true;
                          return (
                            <span
                              className="inline-choice-node__choice"
                              data-example={showExample}
                              key={`${part.index}-${optionIndex}-${choice.text}`}
                            >
                              <BlockChoiceIndicator
                                checked={showExample}
                                example={showExample}
                                solutionKey={choice.correct
                                  ? `${item.id}:${part.index}:${optionIndex}`
                                  : undefined}
                              />
                              <strong className="inline-choice-node__choice-label">
                                {capitalizeChoices
                                  ? capitalizeFirstLetter(choice.text)
                                  : choice.text}
                              </strong>
                            </span>
                          );
                        })}
                      </span>
                    )}
                  </Fragment>
                  );
                })}
              </p>
            </div>
          );
        })}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineChoice: {
      insertInlineChoice: (attrs?: Partial<InlineChoiceAttrs>) => ReturnType;
    };
  }
}

export const InlineChoice = Node.create({
  name: 'inlineChoice',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: 'Choose the correct option.',
        parseHTML: (element) => (
          element.getAttribute('data-inline-choice-instruction')
          ?? 'Choose the correct option.'
        ),
        renderHTML: (attributes) => ({
          'data-inline-choice-instruction': attributes.instruction,
        }),
      },
      shuffleChoices: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-inline-choice-shuffle') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-inline-choice-shuffle': String(attributes.shuffleChoices),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-inline-choice-show-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-inline-choice-show-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
      items: {
        default: DEFAULT_INLINE_CHOICE_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-inline-choice-items'),
        ),
        renderHTML: (attributes) => ({
          'data-inline-choice-items': encodeURIComponent(
            JSON.stringify(attributes.items),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="inline-choice"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'inline-choice' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineChoiceNodeView);
  },

  addCommands() {
    return {
      insertInlineChoice:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              instruction: attrs.instruction ?? 'Choose the correct option.',
              shuffleChoices: attrs.shuffleChoices ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
              items: attrs.items ?? defaultItems(),
            },
          }),
    };
  },
});
