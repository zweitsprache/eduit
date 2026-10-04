"use client";

import { Fragment, type CSSProperties } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin, PluginKey, type Transaction } from '@tiptap/pm/state';
import { ReplaceStep, ReplaceAroundStep } from '@tiptap/pm/transform';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
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
  isStartOfLineBlank,
  textWithBlankBoundaryJoiners,
  type FillInTheBlankPart,
} from '@/components/editor/fill-in-the-blank-node';

export type DialogueSpeaker = 1 | 2 | 3 | 4;
export type DialogueSpeakerNames = Record<DialogueSpeaker, string>;
export type DialogueSpacerBreak = 'page' | 'line';

export type DialogueItem = {
  id: string;
  speaker: DialogueSpeaker;
  text: string;
  // A spacer row ends the current speaker group: numbering restarts after
  // it, and (when any spacer exists) a "Dialog N" heading precedes each group.
  isSpacer?: boolean;
  // Only meaningful when isSpacer is true. 'page' (default) splits the
  // dialogue into a new page/node; 'line' just adds a gap and restarts
  // numbering without a page break or heading.
  spacerBreak?: DialogueSpacerBreak;
};

export type DialogueAudio = {
  url: string;
  voices: Partial<Record<DialogueSpeaker, string>>;
  instruction: string;
  language: string;
  speakingRate: number;
  scriptItems: Array<{ speaker: DialogueSpeaker; text: string }>;
  durationSeconds: number;
  updatedAt: string;
};

export type DialogueAttrs = {
  items: DialogueItem[];
  speakerNames: DialogueSpeakerNames;
  context: string;
  showInstruction: boolean;
  hideInstructionBadge: boolean;
  showSpeakerNames: boolean;
  showOriginal: boolean;
  showWordBank: boolean;
  compactSingleLetterBlanks: boolean;
  hideBlankNumbers: boolean;
  showFirstAsExample: boolean;
  audio: DialogueAudio | null;
  // A multi-group dialogue (spacer rows present) is stored as one dialogue
  // node per group, separated by real pageBreak nodes, all sharing `items`
  // (the full combined list) + `groupId`; each node renders only its slice.
  groupIndex: number;
  groupSize: number;
  groupId: string;
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

export function newDialogueGroupId() {
  return globalThis.crypto?.randomUUID?.()
    ?? `dialogue-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Splits the full items list into page-break-delimited groups (spacers
// marked spacerBreak:'line' stay inside their group; 'page' spacers, the
// default, start a new group/node). Always returns at least one group.
export function dialogueGroups(items: DialogueItem[]): DialogueItem[][] {
  const groups: DialogueItem[][] = [[]];
  items.forEach((item) => {
    if (item.isSpacer && item.spacerBreak !== 'line') {
      groups.push([]);
      return;
    }
    groups[groups.length - 1].push(item);
  });
  const nonEmpty = groups.filter((group) => group.length > 0);
  return nonEmpty.length ? nonEmpty : [[]];
}

export function dialogueGroupSize(items: DialogueItem[]): number {
  return dialogueGroups(items).length;
}

// Rebuilds the full dialogue+pageBreak node group at `pos` so it has exactly
// one dialogue node per spacer-delimited group, all sharing the given items
// as their common source of truth. Used by both editing surfaces so adding/
// removing a spacer always keeps the on-page node count in sync.
export function rebuildDialogueGroup(
  tr: Transaction,
  pos: number,
  items: DialogueItem[],
): boolean {
  const currentNode = tr.doc.nodeAt(pos);
  if (currentNode?.type.name !== 'dialogue') return false;
  const dialogueType = tr.doc.type.schema.nodes.dialogue;
  const pageBreakType = tr.doc.type.schema.nodes.pageBreak;
  if (!dialogueType) return false;

  const groupId = (currentNode.attrs.groupId as string) || newDialogueGroupId();
  const groupNodes: Array<{ node: ProseMirrorNode; pos: number }> = [];
  tr.doc.forEach((node, offset) => {
    if (node.type.name === 'dialogue' && node.attrs.groupId === groupId) {
      groupNodes.push({ node, pos: offset });
    }
  });
  if (!groupNodes.length) groupNodes.push({ node: currentNode, pos });

  const groupSize = dialogueGroupSize(items);
  if (groupSize === groupNodes.length) {
    groupNodes.forEach(({ pos: nodePos }, index) => {
      tr.setNodeAttribute(nodePos, 'items', items);
      tr.setNodeAttribute(nodePos, 'groupId', groupId);
      tr.setNodeAttribute(nodePos, 'groupSize', groupSize);
      tr.setNodeAttribute(nodePos, 'groupIndex', index);
    });
    return true;
  }

  const baseAttrs = {
    ...groupNodes[0].node.attrs,
    items,
    groupId,
    groupSize,
  };
  const nodes = Array.from({ length: groupSize }, (_, groupIndex) => dialogueType.create({
    ...baseAttrs,
    groupIndex,
  }));
  const separatedNodes = nodes.flatMap((node, index) => (
    index < nodes.length - 1 && pageBreakType
      ? [node, pageBreakType.create()]
      : [node]
  ));
  const from = groupNodes[0].pos;
  const lastGroupNode = groupNodes[groupNodes.length - 1];
  const to = lastGroupNode.pos + lastGroupNode.node.nodeSize;
  tr.replaceWith(from, to, separatedNodes);
  return true;
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
  const base = window.location.origin;
  try {
    const parsed = new URL(audioUrl, base);
    if (parsed.pathname === '/api/public/dialogue-audio') {
      const path = parsed.searchParams.get('path');
      if (path) {
        return `${base}/listen?path=${encodeURIComponent(path)}`;
      }
    }
  } catch {
    // Fall back to legacy src-based link for malformed or unexpected values.
  }
  return `${base}/listen?src=${encodeURIComponent(audioUrl)}`;
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
    const scriptItems = Array.isArray(parsed?.scriptItems)
      ? parsed.scriptItems.flatMap((item: unknown) => {
          const candidate = item as { speaker?: unknown; text?: unknown };
          const speaker = Number(candidate?.speaker);
          const text = typeof candidate?.text === 'string' ? candidate.text : '';
          if (!Number.isFinite(speaker) || speaker < 1 || speaker > 4 || !text) return [];
          return [{ speaker: speaker as DialogueSpeaker, text }];
        })
      : [];
    return typeof parsed?.url === 'string' && parsed.url
      ? {
          url: parsed.url,
          voices: typeof parsed.voices === 'object' && parsed.voices ? parsed.voices : {},
          instruction: typeof parsed.instruction === 'string' ? parsed.instruction : '',
          language: typeof parsed.language === 'string' ? parsed.language : '',
          speakingRate: Number(parsed.speakingRate) || 1,
          scriptItems,
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

function stableWordBankOrder(items: Array<{ id: string; text: string }>) {
  const score = (value: string) => Array.from(value).reduce(
    (hash, character) => ((hash * 31) + (character.codePointAt(0) ?? 0)) | 0,
    17,
  );
  return [...items].sort((left, right) => (
    score(`${left.id}:${left.text}`) - score(`${right.id}:${right.text}`)
  ));
}

function DialogueNodeView({ node, selected }: NodeViewProps) {
  const {
    items,
    speakerNames,
    context,
    showInstruction,
    hideInstructionBadge,
    showSpeakerNames,
    showOriginal,
    showWordBank,
    compactSingleLetterBlanks,
    hideBlankNumbers,
    showFirstAsExample,
    audio,
    groupIndex,
  } = node.attrs as DialogueAttrs;
  const groups = dialogueGroups(items);
  const groupItems = groups[groupIndex] ?? groups[0] ?? [];
  const showGroupHeading = groups.length > 1;
  const isFirstGroup = groupIndex === 0;
  const listenUrl = isFirstGroup && audio?.url ? buildListenUrl(audio.url) : null;
  let blankOffset = 0;
  let speakerOrdinal = 0;
  let previousSpeaker: DialogueSpeaker | null = null;
  const parsedItems: Array<
    | { kind: 'spacer'; key: string }
    | {
        kind: 'line';
        key: string;
        item: DialogueItem;
        parts: ReturnType<typeof parseFillInTheBlankText>;
        speakerOrdinal: number;
        startsSpeakerTurn: boolean;
      }
  > = [];
  groupItems.forEach((item) => {
    if (item.isSpacer) {
      previousSpeaker = null;
      speakerOrdinal = 0;
      parsedItems.push({ kind: 'spacer', key: item.id });
      return;
    }
    const startsSpeakerTurn = item.speaker !== previousSpeaker;
    if (startsSpeakerTurn) speakerOrdinal += 1;
    previousSpeaker = item.speaker;
    const parts = parseFillInTheBlankText(item.text).map((part) => {
      if (part.type === 'text') return part;
      blankOffset += 1;
      return { ...part, index: blankOffset };
    });
    parsedItems.push({
      kind: 'line', key: item.id, item, parts, speakerOrdinal, startsSpeakerTurn,
    });
  });
  const wordBankItems = parsedItems.flatMap((entry) => (
    entry.kind !== 'line' ? [] : entry.parts.flatMap((part) => (
      part.type === 'blank' && part.answer.trim()
        ? [{
            id: `${entry.item.id}-blank-${part.index}`,
            text: part.answer.trim(),
          }]
        : []
    ))
  ));
  const orderedWordBankItems = stableWordBankOrder(wordBankItems);
  const firstExampleWordBankItemId = wordBankItems[0]?.id;
  const hasContext = isFirstGroup && context.trim().length > 0;
  const hasWordBank = isFirstGroup && showWordBank && wordBankItems.length > 0;
  const speakerBadgeWidth = 15;

  return (
    <CustomBlockRoot
      selected={selected}
      className={[
        'dialogue-node',
        showOriginal && 'dialogue-node--with-original',
      ].filter(Boolean).join(' ')}
    >
      {isFirstGroup && showInstruction && (
        <BlockInstruction hideBadge={hideInstructionBadge}>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.dialogue}
        </BlockInstruction>
      )}
      {hasContext && (
        <p className="dialogue-node__context">{context}</p>
      )}
      {hasWordBank && (
        <div className="custom-block__word-bank dialogue-node__word-bank">
          {orderedWordBankItems.map((item) => (
            <span className="custom-block__word-bank-item" key={item.id}>
              {item.text}
              {showFirstAsExample && item.id === firstExampleWordBankItemId && (
                <RoughExampleStrike seed={item.id} />
              )}
            </span>
          ))}
        </div>
      )}
      {showGroupHeading && (
        <h3 className="dialogue-node__group-heading">{`Dialog ${groupIndex + 1}`}</h3>
      )}
      <div
        className={`dialogue-node__rows${
          showSpeakerNames ? ' dialogue-node__rows--speaker-names' : ''
        }${listenUrl ? ' dialogue-node__rows--with-audio' : ''}${
          !(isFirstGroup && showInstruction) && !hasContext && !hasWordBank && !showGroupHeading
            ? ' dialogue-node__rows--no-instruction'
            : ''
        }`}
        style={{
          '--dialogue-speaker-badge-width': `${speakerBadgeWidth}ch`,
        } as CSSProperties}
      >
        {listenUrl && (
          <div className="dialogue-node__audio-qr" aria-hidden="true">
            <QRCode value={listenUrl} size={64} className="dialogue-node__audio-qr-code" />
          </div>
        )}
        {parsedItems.map((entry) => (
          entry.kind === 'spacer' ? (
            <div aria-hidden="true" className="dialogue-node__line-spacer" key={entry.key} />
          ) : (
            <div className="dialogue-node__row" key={entry.key}>
              {(() => {
                const { item, parts, speakerOrdinal: itemOrdinal, startsSpeakerTurn } = entry;
                return (
                  <>
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
                <span
                  aria-hidden="true"
                  className="dialogue-node__speaker-icon-image"
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
                    <InlineFormattedText text={textWithBlankBoundaryJoiners(part.value, parts, partIndex)} />
                  ) : (
                    <span
                      aria-label={`Blank ${part.index}`}
                      className={`fill-in-the-blank-node__blank${
                        compactSingleLetterBlanks
                          && isSingleLetterBlankAnswer(part.answer)
                          ? ' fill-in-the-blank-node__blank--single-letter'
                          : ''
                      }${
                        isStartOfLineBlank(parts, partIndex)
                          ? ' fill-in-the-blank-node__blank--start'
                          : ''
                      }`}
                      data-answer={part.answer}
                      data-example={isFirstGroup && showFirstAsExample && part.index === 1}
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
                  </>
                );
              })()}
            </div>
          )
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
      hideInstructionBadge: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-hide-instruction-badge') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-hide-instruction-badge': String(
            attributes.hideInstructionBadge,
          ),
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
      groupIndex: {
        default: 0,
        parseHTML: (element) => (
          Number(element.getAttribute('data-dialogue-group-index')) || 0
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-group-index': String(attributes.groupIndex),
        }),
      },
      groupSize: {
        default: 1,
        parseHTML: (element) => (
          Number(element.getAttribute('data-dialogue-group-size')) || 1
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-group-size': String(attributes.groupSize),
        }),
      },
      groupId: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-dialogue-group-id') ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-dialogue-group-id': attributes.groupId,
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
              speakerNames: attrs.speakerNames ?? defaultSpeakerNames(),
              context: attrs.context ?? '',
              showInstruction: attrs.showInstruction ?? true,
              hideInstructionBadge: attrs.hideInstructionBadge ?? false,
              showSpeakerNames: attrs.showSpeakerNames ?? false,
              showOriginal: attrs.showOriginal ?? false,
              showWordBank: attrs.showWordBank ?? false,
              compactSingleLetterBlanks: attrs.compactSingleLetterBlanks ?? true,
              hideBlankNumbers: attrs.hideBlankNumbers ?? false,
              showFirstAsExample: attrs.showFirstAsExample ?? false,
              audio: attrs.audio ?? null,
              groupIndex: attrs.groupIndex ?? 0,
              groupSize: attrs.groupSize ?? 1,
              groupId: attrs.groupId ?? '',
            },
          }),
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('dialogueSync'),
        filterTransaction: (tr, state) => {
          if (!tr.docChanged) return true;
          const dialogueType = state.schema.nodes.dialogue;
          if (!dialogueType) return true;

          const changedGroupIds = new Set<string>();
          tr.steps.forEach((step) => {
            if (!(step instanceof ReplaceStep || step instanceof ReplaceAroundStep)) return;
            step.getMap().forEach((oldStart, oldEnd, newStart, newEnd) => {
              tr.doc.nodesBetween(newStart, newEnd, (node) => {
                if (node.type.name === 'dialogue' && node.attrs.groupId) {
                  changedGroupIds.add(node.attrs.groupId as string);
                }
              });
            });
          });

          if (changedGroupIds.size === 0) return true;

          changedGroupIds.forEach((groupId) => {
            const nodes: { node: ProseMirrorNode; pos: number }[] = [];
            tr.doc.descendants((node, pos) => {
              if (node.type.name === 'dialogue' && node.attrs.groupId === groupId) {
                nodes.push({ node, pos });
              }
            });
            if (nodes.length <= 1) return;

            // Use the first node's items as the source of truth.
            const source = nodes[0].node;
            const items = source.attrs.items as DialogueItem[];
            const groupSize = dialogueGroupSize(items);

            nodes.forEach(({ node, pos }, index) => {
              if (
                node.attrs.items !== items
                || node.attrs.groupSize !== groupSize
                || node.attrs.groupIndex !== index
              ) {
                tr.setNodeAttribute(pos, 'items', items);
                tr.setNodeAttribute(pos, 'groupSize', groupSize);
                tr.setNodeAttribute(pos, 'groupIndex', index);
              }
            });
          });

          return true;
        },
      }),
    ];
  },
});
