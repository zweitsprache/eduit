"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import QRCode from 'react-qr-code';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { getEditorPageAreas } from '@/components/editor/page-layout';
import type { DialogueAudio, DialogueSpeaker } from '@/components/editor/dialogue-node';

export type LesetrainingAttrs = {
  html: string;
  bypassGap: boolean;
  audio: DialogueAudio | null;
};

export const DEFAULT_LESETRAINING_HTML =
  '<p>Add your reading text here. Use the content editor to format it.</p>';

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
    // Fall back to the legacy source-based link below.
  }
  return `${base}/listen?src=${encodeURIComponent(audioUrl)}`;
}

function LesetrainingNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as LesetrainingAttrs;
  const startsWithParagraph = /^\s*<p(?:\s|>)/i.test(attrs.html);
	const listenUrl = attrs.audio?.url ? buildListenUrl(attrs.audio.url) : null;
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectionFragments, setSelectionFragments] = useState<Array<{ top: number; height: number }>>([]);
  const measure = useCallback(() => {
    const root = rootRef.current;
    if (!root || !selected) {
      setSelectionFragments([]);
      return;
    }
    const editor = root.closest('.ProseMirror');
    if (!(editor instanceof HTMLElement)) return;
    const rootRect = root.getBoundingClientRect();
    setSelectionFragments(getEditorPageAreas(editor).flatMap((area) => {
      const top = Math.max(rootRect.top, area.top);
      const bottom = Math.min(rootRect.bottom, area.bottom);
      return bottom > top ? [{ top: top - rootRect.top, height: bottom - top }] : [];
    }));
  }, [selected]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !selected) return;
    const frame = requestAnimationFrame(measure);
    const observer = new ResizeObserver(() => requestAnimationFrame(measure));
    observer.observe(root);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [measure, selected]);

  return (
    <CustomBlockRoot
      selected={selected}
      className={`rich-text-node lesetraining-node${attrs.bypassGap ? ' rich-text-node--bypass-gap lesetraining-node--bypass-gap' : ''}${listenUrl ? ' lesetraining-node--with-audio' : ''}`}
      rootRef={rootRef}
    >
      <div
        className={`rich-text-node__content${startsWithParagraph ? ' rich-text-node__content--starts-with-paragraph' : ''}`}
        dangerouslySetInnerHTML={{ __html: attrs.html }}
      />
      {listenUrl && (
        <div className="lesetraining-node__audio-qr" aria-hidden="true">
          <QRCode value={listenUrl} size={64} className="lesetraining-node__audio-qr-code" />
        </div>
      )}
      {selected && selectionFragments.map((fragment, index) => (
        <span
          aria-hidden="true"
          className="rich-text-node__selection-fragment"
          key={`${index}-${fragment.top}`}
          style={{ top: fragment.top, height: fragment.height }}
        />
      ))}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lesetraining: {
      insertLesetraining: (attrs?: Partial<LesetrainingAttrs>) => ReturnType;
    };
  }
}

export const Lesetraining = Node.create({
  name: 'lesetraining',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: DEFAULT_LESETRAINING_HTML,
        parseHTML: (element: HTMLElement) => {
          const value = element.getAttribute('data-lesetraining-html');
          if (!value) return DEFAULT_LESETRAINING_HTML;
          try { return decodeURIComponent(value); } catch { return DEFAULT_LESETRAINING_HTML; }
        },
        renderHTML: (attributes: LesetrainingAttrs) => ({
          'data-lesetraining-html': encodeURIComponent(attributes.html),
        }),
      },
      bypassGap: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-lesetraining-bypass-gap') === 'true',
        renderHTML: (attributes: LesetrainingAttrs) => ({
          'data-lesetraining-bypass-gap': String(attributes.bypassGap),
        }),
      },
      audio: {
        default: null,
        parseHTML: (element: HTMLElement) => parseAudio(element.getAttribute('data-lesetraining-audio')),
        renderHTML: (attributes: LesetrainingAttrs) => attributes.audio ? {
          'data-lesetraining-audio': encodeURIComponent(JSON.stringify(attributes.audio)),
        } : {},
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="lesetraining"]' }]; },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'lesetraining' })];
  },

  addNodeView() { return ReactNodeViewRenderer(LesetrainingNodeView); },

  addCommands() {
    return {
      insertLesetraining:
        (attrs = {}) =>
        ({ commands }) => commands.insertContent({
          type: this.name,
          attrs: {
            html: attrs.html ?? DEFAULT_LESETRAINING_HTML,
            bypassGap: attrs.bypassGap ?? false,
            audio: attrs.audio ?? null,
          },
        }),
    };
  },
});
