"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { SearchLg, XClose } from '@untitledui/icons';
import {
  CUSTOM_BLOCK_REGISTRY,
  type CustomBlockDefinition,
} from '@/components/editor/custom-blocks/registry';
import { cx } from '@/utils/cx';

const RECENT_BLOCKS_KEY = 'eduit-recent-custom-blocks';

function readRecentBlocks() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_BLOCKS_KEY) ?? '[]');
    return Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function InsertBlockPalette({
  editor,
  insertAt,
  open,
  onClose,
}: {
  editor: Editor;
  insertAt?: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [recentTypes, setRecentTypes] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActiveIndex(0);
    setRecentTypes(readRecentBlocks());
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matching = normalizedQuery
      ? CUSTOM_BLOCK_REGISTRY.filter((block) => (
          block.label.toLowerCase().includes(normalizedQuery)
          || block.description.toLowerCase().includes(normalizedQuery)
          || block.type.includes(normalizedQuery)
          || block.category.toLowerCase().includes(normalizedQuery)
          || block.keywords.some((keyword) => keyword.includes(normalizedQuery))
        ))
      : CUSTOM_BLOCK_REGISTRY;

    return [...matching].sort((left, right) => {
      const leftRecent = recentTypes.indexOf(left.type);
      const rightRecent = recentTypes.indexOf(right.type);
      if (leftRecent === -1 && rightRecent === -1) {
        return left.label.localeCompare(right.label);
      }
      if (leftRecent === -1) return 1;
      if (rightRecent === -1) return -1;
      return leftRecent - rightRecent;
    });
  }, [query, recentTypes]);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, results.length - 1)));
  }, [results.length]);

  if (!open) return null;

  const insert = (block: CustomBlockDefinition) => {
    if (insertAt !== null && insertAt !== undefined) {
      const nodeType = editor.state.schema.nodes[block.type];
      const node = nodeType?.createAndFill();
      if (!node) return;
      const safePosition = Math.min(
        editor.state.doc.content.size,
        Math.max(0, insertAt),
      );
      const transaction = editor.state.tr.insert(safePosition, node);
      transaction.setSelection(NodeSelection.create(
        transaction.doc,
        safePosition,
      ));
      editor.view.dispatch(transaction.scrollIntoView());
      editor.commands.focus();
    } else if (!block.insert(editor)) {
      return;
    }
    const nextRecent = [
      block.type,
      ...recentTypes.filter((type) => type !== block.type),
    ].slice(0, 5);
    localStorage.setItem(RECENT_BLOCKS_KEY, JSON.stringify(nextRecent));
    setRecentTypes(nextRecent);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh] backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        aria-label="Insert block"
        aria-modal="true"
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-secondary bg-primary shadow-2xl"
        role="dialog"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
          } else if (event.key === 'ArrowDown' && results.length) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % results.length);
          } else if (event.key === 'ArrowUp' && results.length) {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + results.length) % results.length);
          } else if (event.key === 'Enter' && results[activeIndex]) {
            event.preventDefault();
            insert(results[activeIndex]);
          }
        }}
      >
        <div className="flex items-center gap-3 border-b border-secondary px-4">
          <SearchLg className="size-5 shrink-0 text-quaternary" />
          <input
            ref={searchRef}
            aria-label="Search custom blocks"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search blocks…"
            className="h-14 min-w-0 flex-1 bg-transparent text-sm text-primary outline-none placeholder:text-placeholder"
          />
          <button
            type="button"
            aria-label="Close block palette"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-quaternary transition hover:bg-primary_hover hover:text-secondary"
          >
            <XClose className="size-4.5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {results.length ? results.map((block, index) => {
            const isRecent = recentTypes.includes(block.type);
            return (
              <button
                type="button"
                key={block.type}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => insert(block)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition',
                  activeIndex === index ? 'bg-primary_hover' : 'hover:bg-primary_hover',
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-secondary bg-secondary text-fg-secondary">
                  <block.Icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">{block.label}</span>
                    {isRecent && !query && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-quaternary">Recent</span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs text-tertiary">{block.description}</span>
                </span>
                <span className="shrink-0 rounded bg-secondary px-2 py-1 text-[10px] font-semibold uppercase text-quaternary">
                  {block.category}
                </span>
              </button>
            );
          }) : (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-secondary">No blocks found</p>
              <p className="mt-1 text-xs text-quaternary">Try a name, category, or keyword.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-secondary px-4 py-2 text-[10px] text-quaternary">
          <span>↑↓ Navigate</span>
          <span>↵ Insert</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
