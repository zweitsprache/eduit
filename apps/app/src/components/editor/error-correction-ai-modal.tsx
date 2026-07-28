"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type { ErrorCorrectionError } from '@/components/editor/error-correction-node';
import type { RichTextSource } from '@/components/editor/true-false-ai-modal';
import {
  ERROR_CORRECTION_TYPES,
  type ErrorCorrectionLanguage,
} from '@/lib/error-correction-types';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type SourceMode = 'topic' | 'worksheet' | 'paste';

export type GeneratedErrorCorrection = {
  language: ErrorCorrectionLanguage;
  incorrectText: string;
  correctText: string;
  errors: ErrorCorrectionError[];
  markErrorPositions: boolean;
};

const DEFAULT_TYPES: Record<ErrorCorrectionLanguage, string[]> = {
  german: ['de-case', 'de-main-order', 'de-preposition', 'de-capitalization'],
  english: ['en-agreement', 'en-question', 'en-article-choice', 'en-preposition-wrong'],
};

export function ErrorCorrectionAIModal({
  context,
  onClose,
  onGenerated,
  open,
  sources,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (result: GeneratedErrorCorrection) => boolean | void;
  open: boolean;
  sources: RichTextSource[];
}) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('topic');
  const [topic, setTopic] = useState('');
  const [sourcePos, setSourcePos] = useState('');
  const [pastedSourceText, setPastedSourceText] = useState('');
  const [language, setLanguage] =
    useState<ErrorCorrectionLanguage>('german');
  const [wordCount, setWordCount] = useState(120);
  const [errorDensity, setErrorDensity] = useState(15);
  const [markErrorPositions, setMarkErrorPositions] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    DEFAULT_TYPES.german,
  );
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSourceMode('topic');
    setTopic('');
    setSourcePos('');
    setPastedSourceText('');
    setLanguage('german');
    setWordCount(120);
    setErrorDensity(15);
    setMarkErrorPositions(true);
    setSelectedTypes(DEFAULT_TYPES.german);
    setGenerationContext({ ...EMPTY_WORKSHEET_CONTEXT, ...context });
    setPending(false);
    setError('');
  }, [context, open]);

  const selectedSource = sources.find(
    ({ pos }) => String(pos) === sourcePos,
  );

  async function generate() {
    const sourceText = sourceMode === 'worksheet'
      ? selectedSource?.text.trim() ?? ''
      : sourceMode === 'paste'
        ? pastedSourceText.trim()
        : '';
    if (sourceMode === 'topic' && !topic.trim()) {
      setError('Enter a topic for the text.');
      return;
    }
    if (sourceMode === 'worksheet' && !selectedSource) {
      setError('Select a Rich Text source from this worksheet.');
      return;
    }
    if (sourceMode === 'paste' && !sourceText) {
      setError('Paste the correct source text.');
      return;
    }
    if (!selectedTypes.length) {
      setError('Select at least one error type.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/error-correction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMode,
          topic: topic.trim(),
          sourceText: sourceMode === 'topic' ? null : sourceText,
          language,
          wordCount,
          errorDensity,
          markErrorPositions,
          errorTypeIds: selectedTypes,
          context: generationContext,
        }),
      });
      const result = await response.json() as Partial<GeneratedErrorCorrection> & {
        error?: string;
      };
      if (
        !response.ok
        || !result.incorrectText
        || !result.correctText
        || !result.errors
        || !result.language
      ) {
        throw new Error(result.error ?? 'Could not generate the error text.');
      }
      const inserted = onGenerated(result as GeneratedErrorCorrection);
      if (inserted === false) {
        throw new Error(
          'The text was generated, but the selected block could not be updated.',
        );
      }
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the error text.');
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
      title="Generate Error Correction Text with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Text settings
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Text language</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([
                ['german', 'German'],
                ['english', 'English'],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={language === value}
                  key={value}
                  onClick={() => {
                    setLanguage(value);
                    setSelectedTypes(DEFAULT_TYPES[value]);
                  }}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    language === value
                      ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                      : 'border-primary bg-primary text-secondary hover:bg-primary_hover'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">Source</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                ['topic', 'Topic'],
                ['worksheet', 'Worksheet'],
                ['paste', 'Paste'],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  aria-pressed={sourceMode === value}
                  key={value}
                  onClick={() => setSourceMode(value)}
                  className={`h-10 rounded-md border px-2 text-sm font-semibold transition ${
                    sourceMode === value
                      ? 'border-primary bg-active text-primary ring-1 ring-inset ring-primary'
                      : 'border-primary bg-primary text-secondary hover:bg-primary_hover'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {sourceMode === 'topic' ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_8rem] gap-4">
            <label className="text-sm font-semibold text-primary">
              Topic
              <input
                autoFocus
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What should the text be about?"
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
            <label className="text-sm font-semibold text-primary">
              Approx. words
              <input
                type="number"
                min={40}
                max={500}
                value={wordCount}
                onChange={(event) => setWordCount(
                  Math.min(500, Math.max(40, Number(event.target.value) || 40)),
                )}
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
          </div>
        ) : sourceMode === 'worksheet' ? (
          <div className="mt-4">
            <select
              value={sourcePos}
              onChange={(event) => setSourcePos(event.target.value)}
              className="h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            >
              <option value="">Select a Rich Text block…</option>
              {sources.map((source) => (
                <option key={source.pos} value={source.pos}>{source.label}</option>
              ))}
            </select>
            {selectedSource && (
              <div className="mt-3 max-h-28 overflow-y-auto rounded-md border border-secondary bg-primary px-3 py-2 text-xs leading-5 text-tertiary">
                {selectedSource.text}
              </div>
            )}
            {!sources.length && (
              <p className="mt-2 text-xs text-quaternary">
                Add a Rich Text block or choose another source.
              </p>
            )}
          </div>
        ) : (
          <textarea
            value={pastedSourceText}
            maxLength={20_000}
            onChange={(event) => setPastedSourceText(event.target.value)}
            placeholder="Paste the correct source text…"
            className="mt-4 min-h-36 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2.5 text-sm leading-6 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        )}

        <div className="mt-4 grid grid-cols-2 gap-6 border-t border-secondary pt-4">
          <label className="text-xs font-semibold text-tertiary">
            Error density
            <span className="mt-1.5 flex h-9 items-center gap-2">
              <span className="font-normal">1 error per</span>
              <input
                aria-label="Words per error"
                type="number"
                min={5}
                max={50}
                value={errorDensity}
                onChange={(event) => setErrorDensity(
                  Math.min(50, Math.max(5, Number(event.target.value) || 5)),
                )}
                className="h-9 w-16 rounded-md border border-primary bg-primary px-2 text-sm font-normal tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <span className="font-normal">words</span>
            </span>
          </label>
          <div>
            <p className="text-xs font-semibold text-tertiary">
              Error positions
            </p>
            <div className="mt-1.5 flex h-9 items-center">
              <Toggle
                label="Mark errors"
                isSelected={markErrorPositions}
                onChange={setMarkErrorPositions}
              />
            </div>
          </div>
        </div>
      </section>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-primary">
        Error types
      </h3>
      <section className="divide-y divide-secondary rounded-xl border border-secondary bg-secondary px-4">
        {ERROR_CORRECTION_TYPES[language].map((group) => (
          <div
            className="py-4"
            key={group.label}
          >
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-sm font-semibold text-primary">
                {group.label}
              </h4>
              <button
                type="button"
                onClick={() => {
                  const ids = group.types.map(({ id }) => id);
                  const allSelected = ids.every((id) => selectedTypes.includes(id));
                  setSelectedTypes(allSelected
                    ? selectedTypes.filter((id) => !ids.includes(id))
                    : [...new Set([...selectedTypes, ...ids])]);
                }}
                className="text-xs font-semibold text-secondary hover:text-primary"
              >
                {group.types.every(({ id }) => selectedTypes.includes(id))
                  ? 'Clear'
                  : 'Select all'}
              </button>
            </div>
            <div className="mt-2 grid grid-cols-1 divide-y divide-secondary">
              {group.types.map((type) => (
                <label
                  className="grid cursor-pointer grid-cols-[auto_minmax(10rem,0.7fr)_minmax(0,1fr)] items-start gap-2 px-1.5 py-1.5 hover:bg-primary_hover"
                  key={type.id}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypes.includes(type.id)}
                    onChange={(event) => setSelectedTypes(
                      event.target.checked
                        ? [...selectedTypes, type.id]
                        : selectedTypes.filter((id) => id !== type.id),
                    )}
                    className="mt-0.5 size-4 rounded-[3px] accent-brand-solid"
                  />
                  <span className="text-sm font-semibold text-secondary">
                    {type.label}
                  </span>
                  <span className="text-xs leading-5 text-quaternary">
                    {type.description}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
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
