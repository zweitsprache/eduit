"use client";

import { useEffect, useMemo, useState } from 'react';
import { Loading01 } from '@untitledui/icons';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { SearchSelect } from '@/components/base/select/select';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type Worksheet,
  type WorksheetContext,
} from '@/lib/worksheet-types';

export type WordGridAIRequest = {
  topic?: string | null;
  wordCount: number | null;
  context: WorksheetContext;
  sourceWorksheetId?: string | null;
};

export function WordGridAIModal({
  context,
  columns,
  onClose,
  onManualEntry,
  onGenerated,
  open,
  rows,
}: {
  context: WorksheetContext;
  columns: number;
  onClose: () => void;
  onManualEntry: () => void;
  onGenerated: (words: string[]) => void;
  open: boolean;
  rows: number;
}) {
  const [topic, setTopic] = useState('');
  const [wordCount, setWordCount] = useState(8);
  const [autoWordCount, setAutoWordCount] = useState(false);
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [sourceWorksheetId, setSourceWorksheetId] = useState('');
  const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
  const [loadingWorksheets, setLoadingWorksheets] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setWordCount(8);
    setAutoWordCount(false);
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setSourceWorksheetId('');
    setWorksheets([]);
    setError('');
    setPending(false);

    let cancelled = false;
    setLoadingWorksheets(true);
    fetch('/api/worksheets', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as {
          worksheets?: Worksheet[];
          error?: string;
        };
        if (!cancelled && response.ok && result.worksheets) {
          setWorksheets(
            [...result.worksheets].sort(
              (a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            ),
          );
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoadingWorksheets(false);
      });
    return () => {
      cancelled = true;
    };
  }, [context, open]);

  const worksheetOptions = useMemo(
    () =>
      worksheets.map((worksheet) => ({
        value: worksheet.id,
        label: worksheet.title || '(Untitled worksheet)',
      })),
    [worksheets],
  );

  const selectedWorksheet = useMemo(
    () => worksheets.find((worksheet) => worksheet.id === sourceWorksheetId),
    [worksheets, sourceWorksheetId],
  );

  function worksheetPreview(contentHtml: string) {
    const text = contentHtml
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&\w+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 220) + (text.length > 220 ? '…' : '');
  }

  async function generate() {
    if (!topic.trim() && !sourceWorksheetId) {
      setError('Enter a topic for the word grid or select a source worksheet.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/word-grid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || null,
          sourceWorksheetId: sourceWorksheetId || null,
          wordCount: autoWordCount ? null : wordCount,
          columns,
          rows,
          maxWordLength: Math.min(columns, rows),
          context: generationContext,
        } satisfies WordGridAIRequest & {
          columns: number;
          maxWordLength: number;
          rows: number;
        }),
      });
      const result = await response.json() as {
        words?: string[];
        error?: string;
      };
      if (!response.ok || !result.words) {
        throw new Error(result.error ?? 'Could not generate the word grid.');
      }
      onGenerated(result.words);
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the word grid.');
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
      title="Generate Word Grid with Eduit AI"
    >
      <section className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 rounded-xl border border-secondary bg-secondary p-5">
        <label className="block text-sm font-semibold text-primary">
          Topic
          <input
            autoFocus
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="What should the word grid be about?"
            className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <div>
          <p className="text-sm font-semibold text-primary">
            Number of words
          </p>
          <div className="mt-2 flex h-10 items-center gap-4">
            <Toggle
              label="Auto"
              isSelected={autoWordCount}
              onChange={setAutoWordCount}
            />
            <input
              aria-label="Number of words"
              type="number"
              min={1}
              max={30}
              disabled={autoWordCount}
              value={wordCount}
              onChange={(event) => setWordCount(
                Math.min(30, Math.max(1, Number(event.target.value) || 1)),
              )}
              className="h-10 w-24 rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
            />
          </div>
        </div>
      </section>
      <button
        type="button"
        disabled={pending}
        onClick={onManualEntry}
        className="mt-2 text-xs font-semibold text-[#cc6600] hover:text-[#a65300] disabled:opacity-50"
      >
        I already have a word list
      </button>

      <section className="mt-6 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">
          Source worksheet
        </h3>
        <p className="mt-1 text-xs leading-5 text-secondary">
          Optionally choose an existing worksheet. Its content is sent to the
          AI so it can extract words for the grid.
        </p>
        <div className="mt-4">
          {loadingWorksheets ? (
            <div className="flex h-10 items-center gap-2 text-sm text-secondary">
              <Loading01 className="size-4 animate-spin" />
              Loading worksheets…
            </div>
          ) : (
            <SearchSelect
              ariaLabel="Source worksheet"
              placeholder="Search worksheets"
              value={sourceWorksheetId}
              options={[
                { value: '', label: 'No source worksheet' },
                ...worksheetOptions,
              ]}
              onChange={setSourceWorksheetId}
            />
          )}
        </div>
        {selectedWorksheet && (
          <div className="mt-3 rounded-md border border-primary bg-primary p-3">
            <p className="text-xs font-semibold text-primary">
              {selectedWorksheet.title || '(Untitled worksheet)'}
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-secondary">
              {worksheetPreview(selectedWorksheet.contentHtml)}
            </p>
          </div>
        )}
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
