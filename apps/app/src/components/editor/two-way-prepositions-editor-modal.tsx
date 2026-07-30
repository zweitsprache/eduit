"use client";

import { useEffect } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { Toggle } from '@/components/base/toggle/toggle';
import type {
  TwoWayPrepositionsAttrs,
} from '@/components/editor/two-way-prepositions-node';

type TwoWayBlock = { pos: number; type: 'twoWayPrepositions' };

export function TwoWayPrepositionsEditorModal({
  block,
  editor,
  onClose,
}: {
  block: TwoWayBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === 'twoWayPrepositions'
        ? node.attrs as TwoWayPrepositionsAttrs
        : null;
    },
  });

  useEffect(() => {
    if (!block) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [block, onClose]);

  if (!block || !attrs || typeof document === 'undefined') return null;

  const setShowVocabulary = (showVocabulary: boolean) => {
    editor.chain().command(({ tr }) => {
      if (tr.doc.nodeAt(block.pos)?.type.name !== 'twoWayPrepositions') {
        return false;
      }
      tr.setNodeAttribute(block.pos, 'showVocabulary', showVocabulary);
      return true;
    }).run();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-label="Wechselpräpositionen bearbeiten"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
      >
        <header className="flex h-16 items-center justify-between border-b border-secondary px-6">
          <h2 className="text-base font-semibold text-primary">
            Wechselpräpositionen
          </h2>
          <button
            aria-label="Schliessen"
            className="flex size-9 items-center justify-center rounded-lg text-quaternary hover:bg-primary_hover hover:text-secondary"
            onClick={onClose}
            type="button"
          >
            <XClose className="size-5" />
          </button>
        </header>
        <div className="p-6">
          <Toggle
            isSelected={attrs.showVocabulary}
            label="Wortschatzhilfe anzeigen"
            onChange={setShowVocabulary}
          />
          <p className="mt-2 text-sm leading-6 text-tertiary">
            Zeigt die Formen mit Artikel und Plural oberhalb der Abbildungen.
          </p>
        </div>
        <footer className="flex justify-end border-t border-secondary px-6 py-4">
          <button
            className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
            onClick={onClose}
            type="button"
          >
            Fertig
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
