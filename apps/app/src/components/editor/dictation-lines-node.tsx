"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import QRCode from 'react-qr-code';

export type DictationLineItem = {
  id: string;
  text: string;
};

export type DictationLinesVariant = 'itemized' | 'ongoingText';

export type DictationAudioTrack = {
  itemId: string;
  url: string;
  durationSeconds: number;
  updatedAt: string;
};

export type DictationLinesAttrs = {
  items: DictationLineItem[];
  variant: DictationLinesVariant;
  twoColumns: boolean;
  linesPerItem: number;
  lineHeight: number;
  showLineNumbers: boolean;
  audioTracks: DictationAudioTrack[];
  audioPlaylistUrl: string | null;
};

export const MIN_DICTATION_LINES_COUNT = 1;
export const MAX_DICTATION_LINES_COUNT = 30;
export const DEFAULT_DICTATION_LINES_PER_ITEM = 1;
export const MIN_DICTATION_LINES_PER_ITEM = 1;
export const MAX_DICTATION_LINES_PER_ITEM = 20;
export const DEFAULT_DICTATION_LINES_VARIANT: DictationLinesVariant = 'itemized';
export const DEFAULT_DICTATION_LINE_HEIGHT = 40;
export const MIN_DICTATION_LINE_HEIGHT = 16;
export const MAX_DICTATION_LINE_HEIGHT = 120;

function createDefaultItem(index: number): DictationLineItem {
  return { id: `dictation-line-${index + 1}`, text: '' };
}

function parseItems(value: unknown) {
  if (!Array.isArray(value)) return [createDefaultItem(0)];
  const items = value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      return {
        id: typeof record.id === 'string' && record.id.trim()
          ? record.id
          : `dictation-line-${index + 1}`,
        text: typeof record.text === 'string' ? record.text : '',
      };
    })
    .filter((item): item is DictationLineItem => item !== null)
    .slice(0, MAX_DICTATION_LINES_COUNT);
  return items.length ? items : [createDefaultItem(0)];
}

function parseLineHeight(value: unknown) {
  const height = Number(value);
  if (!Number.isFinite(height)) return DEFAULT_DICTATION_LINE_HEIGHT;
  return Math.min(
    MAX_DICTATION_LINE_HEIGHT,
    Math.max(MIN_DICTATION_LINE_HEIGHT, Math.round(height)),
  );
}

function parseLinesPerItem(value: unknown) {
  const count = Number(value);
  if (!Number.isFinite(count)) return DEFAULT_DICTATION_LINES_PER_ITEM;
  return Math.min(
    MAX_DICTATION_LINES_PER_ITEM,
    Math.max(MIN_DICTATION_LINES_PER_ITEM, Math.round(count)),
  );
}

function parseVariant(value: unknown): DictationLinesVariant {
  return value === 'ongoingText' ? 'ongoingText' : DEFAULT_DICTATION_LINES_VARIANT;
}

function parseItemsAttribute(value: string | null) {
  if (!value) return [createDefaultItem(0)];
  try {
    return parseItems(JSON.parse(value));
  } catch {
    return [createDefaultItem(0)];
  }
}

function parseAudioTracks(value: string | null): DictationAudioTrack[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((track: unknown) => {
      if (!track || typeof track !== 'object') return [];
      const candidate = track as Record<string, unknown>;
      return typeof candidate.itemId === 'string' && typeof candidate.url === 'string'
        ? [{
            itemId: candidate.itemId,
            url: candidate.url,
            durationSeconds: Number(candidate.durationSeconds) || 0,
            updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : '',
          }]
        : [];
    });
  } catch {
    return [];
  }
}

function buildListenUrl(audioUrl: string): string | null {
  if (typeof window === 'undefined') return null;
  const base = window.location.origin;
  try {
    const parsed = new URL(audioUrl, base);
    if (parsed.pathname === '/api/public/dialogue-audio') {
      const path = parsed.searchParams.get('path');
      if (path) return `${base}/listen?path=${encodeURIComponent(path)}`;
    }
  } catch {
    return null;
  }
  return null;
}

function DictationLinesNodeView({ editor, getPos, node, selected }: NodeViewProps) {
  const attrs = node.attrs as DictationLinesAttrs;
  const items = parseItems(attrs.items);
  const variant = parseVariant(attrs.variant);
  const twoColumns = attrs.twoColumns === true && variant === 'itemized';
  const linesPerItem = parseLinesPerItem(attrs.linesPerItem);
  const lineHeight = parseLineHeight(attrs.lineHeight);
  const showLineNumbers = attrs.showLineNumbers === true;
  const playlistUrl = buildListenUrl(attrs.audioPlaylistUrl ?? '');

  return (
    <NodeViewWrapper
      className={`dictation-lines-node dictation-lines-node--${variant}${selected ? ' dictation-lines-node--selected' : ''}`}
      data-drag-handle
      onClick={() => {
        const pos = getPos();
        if (typeof pos === 'number') editor.commands.setNodeSelection(pos);
      }}
    >
      <div className={`dictation-lines-node__writing-area${twoColumns ? ' dictation-lines-node__writing-area--two-columns' : ''}`}>
        {items.map((item, index) => (
          <div className="dictation-lines-node__item" key={item.id}>
            {Array.from({ length: linesPerItem }, (_, lineIndex) => (
              <div className="writing-lines-node__row" key={`${item.id}-${lineIndex}`}>
                {showLineNumbers && lineIndex === 0 && (
                  <span className="custom-block__row-index" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                )}
                {showLineNumbers && lineIndex > 0 && (
                  <span className="dictation-lines-node__number-spacer" aria-hidden="true" />
                )}
                <div
                  className="writing-lines-node__line dictation-lines-node__line"
                  style={{ height: `${lineHeight}px` }}
                >
                  {variant === 'itemized' && lineIndex === 0 && (
                    <span
                      className="dictation-lines-node__solution"
                      style={{ lineHeight: `${lineHeight}px` }}
                    >
                      {item.text}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
        {variant === 'ongoingText' && (
          <div
            className="dictation-lines-node__ongoing-solution"
            style={{ lineHeight: `${lineHeight}px` }}
          >
            {items.map((item) => item.text.trim()).filter(Boolean).join(' ')}
          </div>
        )}
      </div>
      {playlistUrl && (
        <div className="dictation-lines-node__audio-qr">
          <a
            href={playlistUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Open dictation audio playlist"
          >
            <QRCode value={playlistUrl} size={64} className="dictation-lines-node__audio-qr-code" />
          </a>
        </div>
      )}
    </NodeViewWrapper>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    dictationLines: {
      insertDictationLines: (attrs?: Partial<DictationLinesAttrs>) => ReturnType;
    };
  }
}

export const DictationLines = Node.create({
  name: 'dictationLines',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      items: {
        default: [createDefaultItem(0)],
        parseHTML: (element) => parseItemsAttribute(
          element.getAttribute('data-dictation-lines-items'),
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-items': JSON.stringify(parseItems(attributes.items)),
        }),
      },
            variant: {
              default: DEFAULT_DICTATION_LINES_VARIANT,
              parseHTML: (element) => parseVariant(
                element.getAttribute('data-dictation-lines-variant'),
              ),
              renderHTML: (attributes) => ({
                'data-dictation-lines-variant': parseVariant(attributes.variant),
              }),
            },
      linesPerItem: {
        default: DEFAULT_DICTATION_LINES_PER_ITEM,
        parseHTML: (element) => parseLinesPerItem(
          element.getAttribute('data-dictation-lines-per-item'),
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-per-item': parseLinesPerItem(attributes.linesPerItem),
        }),
      },
      twoColumns: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dictation-lines-two-columns') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-two-columns': String(attributes.twoColumns),
        }),
      },
      lineHeight: {
        default: DEFAULT_DICTATION_LINE_HEIGHT,
        parseHTML: (element) => parseLineHeight(
          element.getAttribute('data-dictation-lines-height'),
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-height': parseLineHeight(attributes.lineHeight),
        }),
      },
      showLineNumbers: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-dictation-lines-show-line-numbers') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-show-line-numbers': String(
            attributes.showLineNumbers,
          ),
        }),
      },
      audioTracks: {
        default: [],
        parseHTML: (element) => parseAudioTracks(
          element.getAttribute('data-dictation-lines-audio'),
        ),
        renderHTML: (attributes) => ({
          'data-dictation-lines-audio': encodeURIComponent(
            JSON.stringify(Array.isArray(attributes.audioTracks) ? attributes.audioTracks : []),
          ),
        }),
      },
      audioPlaylistUrl: {
        default: null,
        parseHTML: (element) => {
          const value = element.getAttribute('data-dictation-lines-audio-playlist');
          return value ? decodeURIComponent(value) : null;
        },
        renderHTML: (attributes) => attributes.audioPlaylistUrl ? {
          'data-dictation-lines-audio-playlist': encodeURIComponent(attributes.audioPlaylistUrl),
        } : {},
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="dictation-lines"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'dictation-lines' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DictationLinesNodeView);
  },

  addCommands() {
    return {
      insertDictationLines:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              items: parseItems(attrs.items),
                            variant: parseVariant(attrs.variant),
                            twoColumns: attrs.twoColumns ?? false,
              linesPerItem: parseLinesPerItem(attrs.linesPerItem),
              lineHeight: parseLineHeight(attrs.lineHeight),
              showLineNumbers: attrs.showLineNumbers ?? false,
              audioTracks: attrs.audioTracks ?? [],
              audioPlaylistUrl: attrs.audioPlaylistUrl ?? null,
            },
          }),
    };
  },
});

