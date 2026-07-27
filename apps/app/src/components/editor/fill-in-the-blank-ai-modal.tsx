"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type TextStructure =
  | 'continuous-text'
  | 'connected-sentences'
  | 'independent-sentences';

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
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (text: string) => void;
  open: boolean;
}) {
  const [topic, setTopic] = useState('');
  const [sentenceCount, setSentenceCount] = useState(6);
  const [autoSentenceCount, setAutoSentenceCount] = useState(false);
  const [blanksPerSentence, setBlanksPerSentence] = useState(1);
  const [autoBlankCount, setAutoBlankCount] = useState(false);
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
    setSentenceCount(6);
    setAutoSentenceCount(false);
    setBlanksPerSentence(1);
    setAutoBlankCount(false);
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
    if (!topic.trim()) {
      setError('Enter a topic for the activity.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/fill-in-the-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          sentenceCount: autoSentenceCount ? null : sentenceCount,
          blanksPerSentence: autoBlankCount ? null : blanksPerSentence,
          textStructure,
          blankFocus: blankFocus.trim(),
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        text?: string;
        error?: string;
      };
      if (!response.ok || !result.text) {
        throw new Error(
          result.error ?? 'Could not generate the fill-in-the-blank activity.',
        );
      }
      onGenerated(result.text);
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the fill-in-the-blank activity.');
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
      title="Generate Fill in the Blank with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Activity settings
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <label className="block text-sm font-semibold text-primary">
            Topic
            <input
              autoFocus
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
