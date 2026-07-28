"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

export type GeneratedCrosswordEntry = {
  answer: string;
  clue: string;
};

function gridWord(value: string) {
  return (value.toLocaleUpperCase('de-CH').match(/[\p{L}\p{N}]/gu) ?? [])
    .join('');
}

export function CrosswordAIModal({
  context,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (entries: GeneratedCrosswordEntry[]) => void;
  open: boolean;
}) {
  const [wordList, setWordList] = useState('');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setWordList('');
    setGenerationContext({ ...EMPTY_WORKSHEET_CONTEXT, ...context });
    setPending(false);
    setError('');
  }, [context, open]);

  async function generate() {
    const words = wordList
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter(Boolean);
    if (words.length < 2 || words.length > 20) {
      setError('Enter between 2 and 20 words, one per line.');
      return;
    }
    if (
      words.some((word) => gridWord(word).length < 2)
      || new Set(words.map(gridWord)).size !== words.length
    ) {
      setError('Remove invalid or duplicate crossword answers.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/crossword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ words, context: generationContext }),
      });
      const result = await response.json() as {
        entries?: GeneratedCrosswordEntry[];
        error?: string;
      };
      if (!response.ok || !result.entries) {
        throw new Error(result.error ?? 'Could not generate the crossword.');
      }
      onGenerated(result.entries);
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the crossword.');
      setPending(false);
    }
  }

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      title="Generate Crossword with Eduit AI"
    >
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">
          Crossword settings
        </h3>
        <label className="mt-4 block text-sm font-semibold text-primary">
          Words
          <textarea
            autoFocus
            rows={8}
            value={wordList}
            onChange={(event) => setWordList(event.target.value)}
            placeholder={'One word per line\nSPRACHE\nSCHULE\nBUCH'}
            className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm leading-6 text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <p className="mt-2 text-xs leading-5 text-quaternary">
          Add 2–20 words. Eduit AI writes one clue for each word and builds the grid.
        </p>
      </section>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-primary">
          Generation context
        </h3>
        <div className="mt-4">
          <DocumentContextFields
            context={generationContext}
            expandMoreContext
            twoColumns
            onChange={(patch) => setGenerationContext({
              ...generationContext,
              ...patch,
            })}
          />
        </div>
      </div>
    </AIGenerationModal>
  );
}
