"use client";

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { XClose } from '@untitledui/icons';
import { FileUp } from 'lucide-react';
import { Toggle } from '@/components/base/toggle/toggle';
import {
  currentWordGridCapacity,
  fitWordGridDimensions,
  MAX_WORD_GRID_SIZE,
} from '@/components/editor/word-grid-fit';
import type {
  WordGridDirections,
} from '@/components/editor/word-grid-node';

function parseDelimitedWords(source: string) {
  const values: string[] = [];
  let value = '';
  let quoted = false;

  const pushValue = () => {
    values.push(value.trim());
    value = '';
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && /[,\t;\r\n]/.test(character)) {
      pushValue();
      if (character === '\r' && source[index + 1] === '\n') index += 1;
    } else {
      value += character;
    }
  }
  pushValue();

  const words = values.filter(Boolean);
  if (/^(word|words|term|terms|vocabulary)$/i.test(words[0] ?? '')) {
    words.shift();
  }
  return words;
}

export function WordGridCSVImportModal({
  columns,
  directions,
  onClose,
  onImport,
  open,
  rows,
}: {
  columns: number;
  directions: WordGridDirections;
  onClose: () => void;
  onImport: (result: {
    columns: number;
    rows: number;
    words: string[];
  }) => void;
  open: boolean;
  rows: number;
}) {
  const [source, setSource] = useState('');
  const [autoFit, setAutoFit] = useState(true);
  const [error, setError] = useState('');
  const parsedWords = useMemo(() => {
    const seen = new Set<string>();
    return parseDelimitedWords(source).filter((word) => {
      const normalized = word.toLocaleLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }, [source]);
  const fittedGrid = useMemo(() => fitWordGridDimensions({
    columns,
    directions,
    rows,
    words: parsedWords,
  }), [columns, directions, parsedWords, rows]);

  useEffect(() => {
    if (!open) return;
    setSource('');
    setAutoFit(true);
    setError('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose, open]);

  function importWords() {
    const invalid = parsedWords.filter((word) => (
      !/^\p{L}+$/u.test(word)
      || Array.from(word).length > MAX_WORD_GRID_SIZE
    ));
    if (invalid.length > 0) {
      setError(
        `Use single words containing letters only, with no more than ${MAX_WORD_GRID_SIZE} characters. Check: ${invalid.slice(0, 3).join(', ')}`,
      );
      return;
    }

    if (parsedWords.length === 0) {
      setError('Paste at least one word to import.');
      return;
    }
    const currentCapacity = currentWordGridCapacity(
      columns,
      rows,
      directions,
    );
    const longestWordLength = Math.max(
      ...parsedWords.map((word) => Array.from(word).length),
    );
    if (!autoFit && longestWordLength > currentCapacity) {
      setError(
        `The current grid supports words up to ${currentCapacity} characters. Enable Auto-fit grid or shorten the highlighted words.`,
      );
      return;
    }
    if (autoFit && !fittedGrid) {
      setError('This word list cannot fit within the maximum 20 × 20 grid.');
      return;
    }

    setError('');
    onImport({
      columns: autoFit ? fittedGrid?.columns ?? columns : columns,
      rows: autoFit ? fittedGrid?.rows ?? rows : rows,
      words: parsedWords,
    });
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import Word Grid CSV"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <div className="flex items-center gap-2.5">
            <FileUp className="size-5 text-brand-secondary" />
            <h2 className="text-base font-semibold text-primary">
              Import Word Grid
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close CSV import"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-quaternary hover:bg-primary_hover hover:text-secondary"
          >
            <XClose className="size-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="rounded-lg border border-secondary bg-secondary p-4">
            <h3 className="text-sm font-semibold text-primary">
              Accepted formats
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-tertiary">
              <li>One word per line.</li>
              <li>Words separated by commas, semicolons, or tabs.</li>
              <li>A CSV column with an optional Word, Term, or Vocabulary header.</li>
            </ul>
            <p className="mt-2 text-xs leading-5 text-quaternary">
              Use single words containing letters only. Auto-fit can expand the
              grid up to {MAX_WORD_GRID_SIZE} × {MAX_WORD_GRID_SIZE}.
            </p>
          </div>

          <label className="mt-5 block text-sm font-semibold text-primary">
            Paste word list
            <textarea
              autoFocus
              rows={10}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={'word\nexample\nlearning'}
              className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 font-mono text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>

          <div className="mt-4 flex items-start justify-between gap-5 rounded-lg border border-secondary p-3">
            <div>
              <p className="text-sm font-semibold text-secondary">
                Auto-fit grid
              </p>
              <p className="mt-1 text-xs leading-5 text-tertiary">
                Adjust the grid to fit long words and the overall list.
              </p>
              {autoFit && parsedWords.length > 0 && fittedGrid && (
                <p className="mt-1 text-xs font-semibold text-[#cc6600]">
                  {fittedGrid.changed
                    ? `Grid will resize from ${columns} × ${rows} to ${fittedGrid.columns} × ${fittedGrid.rows}.`
                    : `The current ${columns} × ${rows} grid already fits this list.`}
                </p>
              )}
              {autoFit && parsedWords.length > 0 && !fittedGrid && (
                <p className="mt-1 text-xs font-semibold text-error-primary">
                  This list cannot fit within a 20 × 20 grid.
                </p>
              )}
            </div>
            <Toggle
              aria-label="Auto-fit grid"
              isSelected={autoFit}
              onChange={setAutoFit}
            />
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-error-primary bg-error-primary p-3 text-sm text-error-primary"
            >
              {error}
            </div>
          )}
        </div>

        <footer className="flex h-16 shrink-0 items-center justify-end gap-2 border-t border-secondary px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={importWords}
            className="flex items-center gap-2 rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover"
          >
            <FileUp className="size-4" />
            Import
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
