"use client";

import { Fragment, type CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { MessageChatSquare } from '@untitledui/icons';
import QRCode from 'react-qr-code';
import {
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { RoughExampleStrike } from '@/components/editor/custom-blocks/rough-example-strike';
import {
  parseFillInTheBlankText,
  isSingleLetterBlankAnswer,
  shouldAttachBlankToPreviousText,
  type FillInTheBlankPart,
} from '@/components/editor/fill-in-the-blank-node';

export type DialogueSpeaker = 1 | 2 | 3 | 4;
export type DialogueSpeakerNames = Record<DialogueSpeaker, string>;

export type DialogueItem = {
  id: string;
  speaker: DialogueSpeaker;
  text: string;
};

export type DialogueAudio = {
  url: string;
  voices: Partial<Record<DialogueSpeaker, string>>;
  instruction: string;
  language: string;
  speakingRate: number;
  durationSeconds: number;
  updatedAt: string;
};

export type DialogueAttrs = {
  items: DialogueItem[];
  speakerNames: DialogueSpeakerNames;
  context: string;
  showInstruction: boolean;
  showSpeakerNames: boolean;
  showOriginal: boolean;
  showWordBank: boolean;
  compactSingleLetterBlanks: boolean;
  hideBlankNumbers: boolean;
  showFirstAsExample: boolean;
  audio: DialogueAudio | null;
};

export const DEFAULT_DIALOGUE_SPEAKER_NAMES: DialogueSpeakerNames = {
  1: 'Speaker 1',
  2: 'Speaker 2',
  3: 'Speaker 3',
  4: 'Speaker 4',
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

function defaultSpeakerNames(): DialogueSpeakerNames {
  return { ...DEFAULT_DIALOGUE_SPEAKER_NAMES };
}

function buildListenUrl(audioUrl: string): string | null {
  if (typeof window === 'undefined') return null;
  return `${window.location.origin}/listen?src=${encodeURIComponent(audioUrl)}`;
}

function parseSpeakerNames(value: string | null): DialogueSpeakerNames {
  if (!value) return defaultSpeakerNames();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return {
      1: typeof parsed?.[1] === 'string' ? parsed[1] : 'Speaker 1',
      2: typeof parsed?.[2] === 'string' ? parsed[2] : 'Speaker 2',
      3: typeof parsed?.[3] === 'string' ? parsed[3] : 'Speaker 3',
      4: typeof parsed?.[4] === 'string' ? parsed[4] : 'Speaker 4',
    };
  } catch {
    return defaultSpeakerNames();
  }
}

function parseAudio(value: string | null): DialogueAudio | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return typeof parsed?.url === 'string' && parsed.url
      ? {
          url: parsed.url,
          voices: typeof parsed.voices === 'object' && parsed.voices ? parsed.voices : {},
          instruction: typeof parsed.instruction === 'string' ? parsed.instruction : '',
          language: typeof parsed.language === 'string' ? parsed.language : '',
          speakingRate: Number(parsed.speakingRate) || 1,
          durationSeconds: Number(parsed.durationSeconds) || 0,
          updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
        }
      : null;
  } catch {
    return null;
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
    speakerNames,
    context,
    showInstruction,
    showSpeakerNames,
    showOriginal,
    showWordBank,
    compactSingleLetterBlanks,
    hideBlankNumbers,
    showFirstAsExample,
    audio,
  } = node.attrs as DialogueAttrs;
  const listenUrl = audio?.url ? buildListenUrl(audio.url) : null;
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
  const speakerBadgeWidth = 15;

  return (
    <CustomBlockRoot
      selected={selected}
      className={showOriginal ? 'dialogue-node dialogue-node--with-original' : 'dialogue-node'}
    >
      {listenUrl && (
        <div className="dialogue-node__audio-qr" aria-hidden="true">
          <QRCode value={listenUrl} size={64} className="dialogue-node__audio-qr-code" />
          <span className="dialogue-node__audio-qr-label">Listen</span>
        </div>
      )}
      {showInstruction && (
        <BlockInstruction>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.dialogue}
        </BlockInstruction>
      )}
      {context && (
        <p className="dialogue-node__context">{context}</p>
      )}
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
      <div
        className={`dialogue-node__rows${
          showSpeakerNames ? ' dialogue-node__rows--speaker-names' : ''
        }`}
        style={{
          '--dialogue-speaker-badge-width': `${speakerBadgeWidth}ch`,
        } as CSSProperties}
      >
        {parsedItems.map(({ item, parts, speakerOrdinal: itemOrdinal, startsSpeakerTurn }) => (
          <div className="dialogue-node__row" key={item.id}>
            {!startsSpeakerTurn ? (
              showSpeakerNames ? (
                <span aria-hidden="true" />
              ) : (
                <>
                  <span aria-hidden="true" />
                  <span aria-hidden="true" />
                </>
              )
            ) : (
              <>
                <span className={`custom-block__row-index${
                  showSpeakerNames ? ' dialogue-node__speaker-name' : ''
                }`} data-speaker={item.speaker}>
                  {showSpeakerNames
                    ? speakerNames[item.speaker] || `Speaker ${item.speaker}`
                    : String(itemOrdinal).padStart(2, '0')}
                </span>
                <MessageChatSquare
                  aria-label={`Speaker ${item.speaker}`}
                  className="dialogue-node__speaker-icon"
                  data-speaker={item.speaker}
                />
              </>
            )}
            <p className={`dialogue-node__text${
              parts.some((part) => part.type === 'blank')
                ? ' dialogue-node__text--with-blanks'
                : ''
            }`}>
              {parts.map((part, partIndex) => (
                <Fragment key={`${part.type}-${partIndex}`}>
                  {part.type === 'text' ? (
                    <InlineFormattedText text={part.value} />
                  ) : (
                    <span
                      aria-label={`Blank ${part.index}`}
                      className={`fill-in-the-blank-node__blank${
                        compactSingleLetterBlanks
                          && isSingleLetterBlankAnswer(part.answer)
                          ? ' fill-in-the-blank-node__blank--single-letter'
                          : ''
                      }${
                        shouldAttachBlankToPreviousText(parts, partIndex)
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
            </p>
            {showOriginal && (
              <p className="dialogue-node__original">
                <InlineFormattedText text={originalText(parts)} />
              </p>
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
      speakerNames: {
        default: DEFAULT_DIALOGUE_SPEAKER_NAMES,
        parseHTML: (element) => parseSpeakerNames(
          element.getAttribute('data-dialogue-speaker-names'),
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-speaker-names': encodeURIComponent(
            JSON.stringify(attributes.speakerNames),
          ),
        }),
      },
      showSpeakerNames: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-show-speaker-names') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-show-speaker-names': String(
            attributes.showSpeakerNames,
          ),
        }),
      },
      showInstruction: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-show-instruction') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-show-instruction': String(attributes.showInstruction),
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
      compactSingleLetterBlanks: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-compact-single-letter') !== 'false'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-compact-single-letter': String(
            attributes.compactSingleLetterBlanks,
          ),
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
      context: {
        default: '',
        parseHTML: (element) => (
          decodeURIComponent(element.getAttribute('data-dialogue-context') ?? '')
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-context': encodeURIComponent(attributes.context ?? ''),
        }),
      },
      audio: {
        default: null,
        parseHTML: (element) => parseAudio(element.getAttribute('data-dialogue-audio')),
        renderHTML: (attributes) => (attributes.audio ? {
          'data-dialogue-audio': encodeURIComponent(JSON.stringify(attributes.audio)),
        } : {}),
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
              speakerNames: attrs.speakerNames ?? defaultSpeakerNames(),
              context: attrs.context ?? '',
              showInstruction: attrs.showInstruction ?? true,
              showSpeakerNames: attrs.showSpeakerNames ?? false,
              showOriginal: attrs.showOriginal ?? false,
              showWordBank: attrs.showWordBank ?? false,
              compactSingleLetterBlanks: attrs.compactSingleLetterBlanks ?? true,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
              audio: attrs.audio ?? null,
            },
          }),
    };
  },
});
