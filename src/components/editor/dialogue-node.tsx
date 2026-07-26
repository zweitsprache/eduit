"use client";

import { Fragment, type CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { MessageChatSquare } from '@untitledui/icons';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';
import {
  parseFillInTheBlankText,
  isSingleLetterBlankAnswer,
  type FillInTheBlankPart,
} from '@/components/editor/fill-in-the-blank-node';

export type DialogueSpeaker = 1 | 2 | 3 | 4;

export type DialogueItem = {
  id: string;
  speaker: DialogueSpeaker;
  text: string;
};

export type DialogueAttrs = {
  items: DialogueItem[];
  showOriginal: boolean;
  showWordBank: boolean;
  hideBlankNumbers: boolean;
  showFirstAsExample: boolean;
};

export const DEFAULT_DIALOGUE_ITEMS: DialogueItem[] = [
  {
    id: 'dialogue-1',
    speaker: 1,
    text: 'Good {{blank:morn}}ing.',
  },
  {
    id: 'dialogue-2',
    speaker: 2,
    text: 'Good morning. How {{blank:are}} you?',
  },
];

function defaultItems() {
  return DEFAULT_DIALOGUE_ITEMS.map((item) => ({ ...item }));
}

function parseItems(value: string | null): DialogueItem[] {
  if (!value) return defaultItems();
  try {
    const items = JSON.parse(decodeURIComponent(value));
    return Array.isArray(items) ? items : defaultItems();
  } catch {
    return defaultItems();
  }
}

function originalText(parts: FillInTheBlankPart[]) {
  return parts.map((part) => (
    part.type === 'text' ? part.value : part.answer
  )).join('');
}

function DialogueNodeView({ node, selected }: NodeViewProps) {
  const {
    items,
    showOriginal,
    showWordBank,
    hideBlankNumbers,
    showFirstAsExample,
  } = node.attrs as DialogueAttrs;
  let blankOffset = 0;
  let speakerOrdinal = 0;
  let previousSpeaker: DialogueSpeaker | null = null;
  const parsedItems = items.map((item) => {
    const startsSpeakerTurn = item.speaker !== previousSpeaker;
    if (startsSpeakerTurn) speakerOrdinal += 1;
    previousSpeaker = item.speaker;
    const parts = parseFillInTheBlankText(item.text).map((part) => {
      if (part.type === 'text') return part;
      blankOffset += 1;
      return { ...part, index: blankOffset };
    });
    return { item, parts, speakerOrdinal, startsSpeakerTurn };
  });
  const wordBankItems = parsedItems.flatMap(({ item, parts }) => (
    parts.flatMap((part) => (
      part.type === 'blank' && part.answer.trim()
        ? [{
            id: `${item.id}-blank-${part.index}`,
            text: part.answer.trim(),
          }]
        : []
    ))
  ));

  return (
    <CustomBlockRoot
      selected={selected}
      className={showOriginal ? 'dialogue-node dialogue-node--with-original' : 'dialogue-node'}
    >
      <BlockInstruction>Complete the dialogue.</BlockInstruction>
      {showWordBank && wordBankItems.length > 0 && (
        <div className="custom-block__word-bank dialogue-node__word-bank">
          {wordBankItems.map((item) => (
            <span className="custom-block__word-bank-item" key={item.id}>
              {item.text}
              {showFirstAsExample && item === wordBankItems[0] && (
                <RoughExampleStrike seed={item.id} />
              )}
            </span>
          ))}
        </div>
      )}
      <div className="dialogue-node__rows">
        {parsedItems.map(({ item, parts, speakerOrdinal: itemOrdinal, startsSpeakerTurn }) => (
          <div className="dialogue-node__row" key={item.id}>
            {!startsSpeakerTurn ? (
              <>
                <span aria-hidden="true" />
                <span aria-hidden="true" />
              </>
            ) : (
              <>
                <span className="custom-block__row-index">
                  {String(itemOrdinal).padStart(2, '0')}
                </span>
                <MessageChatSquare
                  aria-label={`Speaker ${item.speaker}`}
                  className="dialogue-node__speaker-icon"
                  data-speaker={item.speaker}
                />
              </>
            )}
            <p className="dialogue-node__text">
              {parts.map((part, partIndex) => (
                <Fragment key={`${part.type}-${partIndex}`}>
                  {part.type === 'text' ? part.value : (
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
            </p>
            {showOriginal && (
              <p className="dialogue-node__original">{originalText(parts)}</p>
            )}
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dialogue: {
      insertDialogue: (attrs?: Partial<DialogueAttrs>) => ReturnType;
    };
  }
}

export const Dialogue = Node.create({
  name: 'dialogue',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: DEFAULT_DIALOGUE_ITEMS,
        parseHTML: (element) => parseItems(element.getAttribute('data-dialogue-items')),
        renderHTML: (attributes) => ({
          'data-dialogue-items': encodeURIComponent(JSON.stringify(attributes.items)),
        }),
      },
      showOriginal: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-dialogue-show-original') === 'true',
        renderHTML: (attributes) => ({
          'data-dialogue-show-original': String(attributes.showOriginal),
        }),
      },
      showWordBank: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-show-word-bank') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-show-word-bank': String(attributes.showWordBank),
        }),
      },
      hideBlankNumbers: {
        default: false,
        parseHTML: (element) => element.getAttribute('data-dialogue-hide-blank-numbers') === 'true',
        renderHTML: (attributes) => ({
          'data-dialogue-hide-blank-numbers': String(attributes.hideBlankNumbers),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="dialogue"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'dialogue' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DialogueNodeView);
  },

  addCommands() {
    return {
      insertDialogue:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              items: attrs.items ?? defaultItems(),
              showOriginal: attrs.showOriginal ?? false,
              showWordBank: attrs.showWordBank ?? false,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
