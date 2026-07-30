"use client";

import { useEffect, useState } from 'react';
import { Toggle } from '@/components/base/toggle/toggle';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  generateBestCrosswordLayout,
  type CrosswordEntry,
} from '@/components/editor/crossword-node';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

export type GeneratedCrosswordEntry = {
  answer: string;
  clue: string;
};

export async function generateCrosswordEntries({
  clueFormats,
  context,
  progression,
  words,
}: {
  clueFormats: Array<'definition' | 'blank'>;
  context: WorksheetContext;
  progression?: {
    level: 'A1.1' | 'A1.2' | 'A2.1' | 'A2.2' | 'B1.1' | 'B1.2';
    phase: 'beginning' | 'middle' | 'towards-end' | 'completed';
  };
  words: string[];
}) {
  let lastError = 'Could not generate the crossword.';
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch('/api/ai/crossword', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ words, clueFormats, context, progression }),
    });
    const result = await response.json() as {
      entries?: GeneratedCrosswordEntry[];
      error?: string;
    };
    if (response.ok && result.entries) return result.entries;
    lastError = result.error ?? lastError;
  }
  throw new Error(lastError);
}

function gridWord(value: string) {
  return (value.toLocaleUpperCase('de-CH').match(/[\p{L}\p{N}]/gu) ?? [])
    .join('');
}

export function CrosswordAIModal({
  context,
  initialWordList,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  initialWordList: string;
  onClose: () => void;
  onGenerated: (entries: CrosswordEntry[], layoutSeed: number) => void;
  open: boolean;
}) {
  const [wordList, setWordList] = useState('');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [definitionClues, setDefinitionClues] = useState(true);
  const [blankClues, setBlankClues] = useState(true);
  const [bestResult, setBestResult] = useState<{
    entries: CrosswordEntry[];
    layoutSeed: number;
    unplaced: CrosswordEntry[];
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setWordList(initialWordList);
    setGenerationContext({ ...EMPTY_WORKSHEET_CONTEXT, ...context });
    setPending(false);
    setError('');
    setDefinitionClues(true);
    setBlankClues(true);
    setBestResult(null);
  }, [context, initialWordList, open]);

  async function generate() {
    if (bestResult) {
      onGenerated(bestResult.entries, bestResult.layoutSeed);
      return;
    }
    if (!definitionClues && !blankClues) {
      setError('Enable at least one clue format.');
      return;
    }
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
      const generatedEntries = await generateCrosswordEntries({
        words,
        clueFormats: [
          ...(definitionClues ? ['definition'] as const : []),
          ...(blankClues ? ['blank'] as const : []),
        ],
        context: generationContext,
      });
      const entries = generatedEntries.map((entry, index) => ({
        id: `crossword-ai-${index}-${gridWord(entry.answer)}`,
        answer: entry.answer,
        clue: entry.clue,
      }));
      const best = generateBestCrosswordLayout(entries);
      if (best.layout.unplaced.length > 0) {
        setBestResult({
          entries,
          layoutSeed: best.seed,
          unplaced: best.layout.unplaced,
        });
        setPending(false);
        return;
      }
      onGenerated(entries, best.seed);
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
      generateLabel={bestResult ? 'Insert best version' : 'Generate'}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      title="Generate Crossword with Eduit AI"
    >
      {bestResult && (
        <section className="mb-6 rounded-xl border border-warning-primary bg-warning-primary p-5">
          <h3 className="text-sm font-semibold text-primary">
            Some words could not be placed
          </h3>
          <p className="mt-2 text-xs leading-5 text-secondary">
            The best 20 × 12 layout will be inserted without these words:
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {bestResult.unplaced.map((entry) => (
              <li
                className="rounded-md border border-warning-primary bg-primary px-2.5 py-1 text-xs font-semibold text-secondary"
                key={entry.id}
              >
                {entry.answer}
              </li>
            ))}
          </ul>
        </section>
      )}
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
            onChange={(event) => {
              setWordList(event.target.value);
              setBestResult(null);
            }}
            placeholder={'One word per line\nSPRACHE\nSCHULE\nBUCH'}
            className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm leading-6 text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <p className="mt-2 text-xs leading-5 text-quaternary">
          Add 2–20 words. Eduit AI writes one clue for each word and builds the grid.
        </p>
        <div className="mt-4 border-t border-secondary pt-4">
          <p className="text-sm font-semibold text-primary">Clue formats</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex items-start gap-3 rounded-lg border border-primary bg-primary p-3 text-sm text-secondary">
              <Toggle
                aria-label="Use definition clues"
                size="md"
                isSelected={definitionClues}
                onChange={(selected) => {
                  setDefinitionClues(selected);
                  setBestResult(null);
                  setError('');
                }}
              />
              <span>
                <strong className="block text-primary">Definition or paraphrase</strong>
                <span className="mt-1 block text-xs leading-5 text-quaternary">
                  Example: A piece of furniture people sit at.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-primary bg-primary p-3 text-sm text-secondary">
              <Toggle
                aria-label="Use blank sentence clues"
                size="md"
                isSelected={blankClues}
                onChange={(selected) => {
                  setBlankClues(selected);
                  setBestResult(null);
                  setError('');
                }}
              />
              <span>
                <strong className="block text-primary">Blank sentence</strong>
                <span className="mt-1 block text-xs leading-5 text-quaternary">
                  Example: When we eat, we all sit at the ________.
                </span>
              </span>
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-quaternary">
            When both are enabled, AI chooses the best format per word and uses
            approximately 40–60% of each format.
          </p>
        </div>
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
