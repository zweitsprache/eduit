"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type { RichTextSource } from '@/components/editor/true-false-ai-modal';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type TextStructure =
  | 'continuous-text'
  | 'connected-sentences'
  | 'independent-sentences';
type SourceMode = 'topic' | 'worksheet' | 'paste';

function normalizeGenerationErrorMessage(message: string) {
  if (/no output generated/i.test(message)) {
    return 'No content was returned by the AI model. Please try again with a shorter source text or fewer constraints.';
  }
  return message;
}

const TEXT_STRUCTURE_OPTIONS: Array<{
  value: TextStructure;
  label: string;
}> = [
  { value: 'continuous-text', label: 'One continuous text' },
  { value: 'connected-sentences', label: 'Connected sentences' },
  { value: 'independent-sentences', label: 'Independent sentences' },
];

export function FillInTheBlankAIModal({
  context,
  onClose,
  onGenerated,
  open,
  sources,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (
    result: { text: string; distractors: string[] },
  ) => boolean | void;
  open: boolean;
  sources: RichTextSource[];
}) {
  const [topic, setTopic] = useState('');
  const [sourceMode, setSourceMode] = useState<SourceMode>('topic');
  const [sourcePos, setSourcePos] = useState('');
  const [pastedSourceText, setPastedSourceText] = useState('');
  const [sentenceCount, setSentenceCount] = useState(6);
  const [autoSentenceCount, setAutoSentenceCount] = useState(false);
  const [blanksPerSentence, setBlanksPerSentence] = useState(1);
  const [autoBlankCount, setAutoBlankCount] = useState(false);
  const [includeDistractors, setIncludeDistractors] = useState(false);
  const [distractorCount, setDistractorCount] = useState(3);
  const [allowDuplicates, setAllowDuplicates] = useState(false);
  const [textStructure, setTextStructure] =
    useState<TextStructure>('connected-sentences');
  const [blankFocus, setBlankFocus] = useState('');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setTopic('');
    setSourceMode('topic');
    setSourcePos('');
    setPastedSourceText('');
    setSentenceCount(6);
    setAutoSentenceCount(false);
    setBlanksPerSentence(1);
    setAutoBlankCount(false);
    setIncludeDistractors(false);
    setDistractorCount(3);
    setAllowDuplicates(false);
    setTextStructure('connected-sentences');
    setBlankFocus('');
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setError('');
  }, [context, open]);

  async function generate() {
    const selectedSource = sources.find(
      ({ pos }) => String(pos) === sourcePos,
    );
    const sourceText = sourceMode === 'worksheet'
      ? selectedSource?.text.trim() ?? ''
      : sourceMode === 'paste'
        ? pastedSourceText.trim()
        : '';
    if (sourceMode === 'topic' && !topic.trim()) {
      setError('Enter a topic for the activity.');
      return;
    }
    if (sourceMode === 'paste' && !pastedSourceText.trim()) {
      setError('Paste the original text to enhance with blanks.');
      return;
    }
    if (sourceMode === 'worksheet' && !selectedSource) {
      setError('Select a Rich Text source from this worksheet.');
      return;
    }
    setPending(true);
    setError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 115_000);
    try {
      const response = await fetch('/api/ai/fill-in-the-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          topic: topic.trim(),
          sourceText: sourceMode === 'topic' ? null : sourceText,
          sentenceCount: sourceMode !== 'topic' || autoSentenceCount
            ? null
            : sentenceCount,
          blanksPerSentence: autoBlankCount ? null : blanksPerSentence,
          distractorCount: includeDistractors ? distractorCount : 0,
          allowDuplicates,
          textStructure,
          blankFocus: blankFocus.trim(),
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        text?: string;
        distractors?: string[];
        error?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(
          result.error ?? 'Could not generate the fill-in-the-blank activity.',
        );
      }
      const inserted = onGenerated({
        text: result.text,
        distractors: result.distractors ?? [],
      });
      if (inserted === false) {
        throw new Error(
          'The activity was generated, but the selected Fill in the Blank block could not be updated.',
        );
      }
    } catch (generationError) {
      setError(
        generationError instanceof DOMException
          && generationError.name === 'AbortError'
          ? 'Generation took too long. Please try again with a shorter source text.'
          : generationError instanceof Error
            ? normalizeGenerationErrorMessage(generationError.message)
            : 'Could not generate the fill-in-the-blank activity.',
      );
    } finally {
      window.clearTimeout(timeout);
      setPending(false);
    }
  }

  const selectedSource = sources.find(
    ({ pos }) => String(pos) === sourcePos,
  );

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      title="Generate Fill in the Blank with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Activity settings
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div>
          <p className="text-sm font-semibold text-primary">Source</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ['topic', 'Generate from topic'],
              ['worksheet', 'From worksheet'],
              ['paste', 'Paste original text'],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
                autoFocus={value === 'topic'}
                aria-pressed={sourceMode === value}
                onClick={() => setSourceMode(value)}
                className={`h-9 rounded-md border px-3 text-sm font-semibold transition ${
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
        {sourceMode === 'topic' ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <label className="block text-sm font-semibold text-primary">
              Topic
              <input
                type="text"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What should learners practise?"
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
            <div>
              <p className="text-sm font-semibold text-primary">
                Number of sentences
              </p>
              <div className="mt-2 flex h-10 items-center gap-4">
                <Toggle
                  label="Auto"
                  isSelected={autoSentenceCount}
                  onChange={setAutoSentenceCount}
                />
                <input
                  aria-label="Number of sentences"
                  type="number"
                  min={1}
                  max={15}
                  disabled={autoSentenceCount}
                  value={sentenceCount}
                  onChange={(event) => setSentenceCount(
                    Math.min(15, Math.max(1, Number(event.target.value) || 1)),
                  )}
                  className="h-10 w-24 rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
                />
              </div>
            </div>
          </div>
        ) : sourceMode === 'worksheet' ? (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-primary">
              Rich Text source
              <select
                value={sourcePos}
                onChange={(event) => setSourcePos(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value="">Select a Rich Text block…</option>
                {sources.map((source) => (
                  <option key={source.pos} value={source.pos}>
                    {source.label}
                  </option>
                ))}
              </select>
            </label>
            {selectedSource && (
              <div className="mt-3 max-h-32 overflow-y-auto rounded-md border border-secondary bg-primary px-3 py-2 text-xs leading-5 text-tertiary">
                {selectedSource.text}
              </div>
            )}
            {!sources.length && (
              <p className="mt-2 text-xs text-quaternary">
                Add a Rich Text block or choose another source option.
              </p>
            )}
          </div>
        ) : (
          <label className="mt-4 block text-sm font-semibold text-primary">
            Original text
            <textarea
              value={pastedSourceText}
              maxLength={20_000}
              onChange={(event) => setPastedSourceText(event.target.value)}
              placeholder="Paste the original text. AI will preserve it and add blanks…"
              className="mt-2 min-h-40 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-normal leading-6 text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
            />
            <span className="mt-1 block text-right text-xs font-normal tabular-nums text-quaternary">
              {pastedSourceText.length.toLocaleString()} / 20,000
            </span>
          </label>
        )}
        <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-4 border-t border-secondary pt-4">
          <div>
            <p className="text-xs font-semibold text-tertiary">
              Blanks per sentence
            </p>
            <div className="mt-1.5 flex h-9 items-center gap-4">
              <Toggle
                label="Auto"
                isSelected={autoBlankCount}
                onChange={setAutoBlankCount}
              />
              <input
                aria-label="Blanks per sentence"
                type="number"
                min={1}
                max={3}
                disabled={autoBlankCount}
                value={blanksPerSentence}
                onChange={(event) => setBlanksPerSentence(
                  Math.min(3, Math.max(1, Number(event.target.value) || 1)),
                )}
                className="h-9 w-20 rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
              />
            </div>
          </div>
          <label className="min-w-0 text-xs font-semibold text-tertiary">
            Blank focus <span className="font-normal">(optional)</span>
            <input
              type="text"
              value={blankFocus}
              onChange={(event) => setBlankFocus(event.target.value)}
              placeholder="e.g. modal verbs, appointment vocabulary, prepositions"
              className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>
        </div>

        {sourceMode === 'topic' && (
          <div className="mt-4 border-t border-secondary pt-4">
            <p className="text-xs font-semibold text-tertiary">
              Text structure
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {TEXT_STRUCTURE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={textStructure === option.value}
                  onClick={() => setTextStructure(option.value)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    textStructure === option.value
                      ? 'border-brand bg-brand-primary text-brand-secondary'
                      : 'border-primary bg-primary text-secondary hover:bg-primary_hover'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-secondary pt-4">
          <p className="text-xs font-semibold text-tertiary">
            Learner support
          </p>
          <div className="mt-1.5 grid grid-cols-2 gap-x-6 gap-y-3">
            <div className="flex h-9 items-center gap-4">
              <Toggle
                label="Add word-bank distractors"
                isSelected={includeDistractors}
                onChange={setIncludeDistractors}
              />
            </div>
            <label className="flex min-w-0 items-center gap-3 text-xs font-semibold text-tertiary">
              Number
              <input
                aria-label="Number of word-bank distractors"
                type="number"
                min={1}
                max={20}
                disabled={!includeDistractors}
                value={distractorCount}
                onChange={(event) => setDistractorCount(
                  Math.min(20, Math.max(1, Number(event.target.value) || 1)),
                )}
                className="h-9 w-20 rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
              />
            </label>
            <div className="flex h-9 items-center gap-4">
              <Toggle
                label="Allow duplicates"
                isSelected={allowDuplicates}
                onChange={setAllowDuplicates}
              />
            </div>
          </div>
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
