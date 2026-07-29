"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import { TextTypeSelect } from '@/components/editor/text-type-select';
import type { RichTextSource } from '@/components/editor/true-false-ai-modal';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';
import { readAIProgressStream } from '@/lib/ai-progress';

type SourceMode = 'generated' | 'worksheet' | 'paste';
type CognitiveLevel = 'remember' | 'understand' | 'apply' | 'analyze';
type Difficulty = 'easy' | 'moderate' | 'challenging';

export type GeneratedMCQ = {
  questions: Array<{
    question: string;
    options: Array<{ text: string; correct: boolean }>;
    explanation: string;
  }>;
  sourceText: string;
  sourceWasGenerated: boolean;
};

const COGNITIVE_LEVELS: Array<{
  value: CognitiveLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'remember',
    label: 'Remember',
    description: 'Recall an explicit fact or detail from the source.',
  },
  {
    value: 'understand',
    label: 'Understand',
    description: 'Interpret or paraphrase information from the source.',
  },
  {
    value: 'apply',
    label: 'Apply',
    description: 'Use source information in a closely related situation.',
  },
  {
    value: 'analyze',
    label: 'Analyze',
    description: 'Connect details, distinguish relationships, or draw a supported conclusion.',
  },
];

export function MCQAIModal({
  context,
  initialOptionCount,
  onClose,
  onGenerated,
  open,
  sources,
}: {
  context: WorksheetContext;
  initialOptionCount: number;
  onClose: () => void;
  onGenerated: (result: GeneratedMCQ) => boolean | void;
  open: boolean;
  sources: RichTextSource[];
}) {
  const [sourceMode, setSourceMode] = useState<SourceMode>('worksheet');
  const [sourcePos, setSourcePos] = useState('');
  const [pastedSourceText, setPastedSourceText] = useState('');
  const [topic, setTopic] = useState('');
  const [textType, setTextType] = useState('');
  const [questionCount, setQuestionCount] = useState(1);
  const [optionCount, setOptionCount] = useState(4);
  const [cognitiveLevel, setCognitiveLevel] =
    useState<CognitiveLevel>('understand');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSourceMode(sources.length ? 'worksheet' : 'generated');
    setSourcePos(sources[0] ? String(sources[0].pos) : '');
    setPastedSourceText('');
    setTopic('');
    setTextType('');
    setQuestionCount(1);
    setOptionCount(Math.min(5, Math.max(3, initialOptionCount || 4)));
    setCognitiveLevel('understand');
    setDifficulty('moderate');
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setProgressLabel('');
    setError('');
  }, [context, initialOptionCount, open, sources]);

  const selectedSource = sources.find(({ pos }) => String(pos) === sourcePos);
  const cognitiveDescription = COGNITIVE_LEVELS.find(
    ({ value }) => value === cognitiveLevel,
  )?.description;

  async function generate() {
    if (sourceMode === 'generated' && !topic.trim()) {
      setError('Enter a topic for the source text.');
      return;
    }
    if (sourceMode === 'generated' && !textType) {
      setError('Choose a Textsorte.');
      return;
    }
    if (sourceMode === 'worksheet' && !selectedSource) {
      setError('Select a source from this worksheet.');
      return;
    }
    if (sourceMode === 'paste' && !pastedSourceText.trim()) {
      setError('Paste a source text for this question.');
      return;
    }

    setPending(true);
    setProgressLabel(
      sourceMode === 'generated'
        ? 'Creating source text…'
        : 'Reading source text…',
    );
    setError('');
    try {
      const response = await fetch('/api/ai/mcq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceMode,
          sourceText: sourceMode === 'worksheet'
            ? selectedSource?.text ?? ''
            : sourceMode === 'paste'
              ? pastedSourceText
              : '',
          topic,
          textType,
          questionCount,
          optionCount,
          cognitiveLevel,
          difficulty,
          context: generationContext,
        }),
      });
      const result = await readAIProgressStream<Omit<
        GeneratedMCQ,
        'sourceWasGenerated'
      >>(response, setProgressLabel);
      if (!result.questions?.length) throw new Error('Could not generate the MCQ.');
      setProgressLabel('Inserting questions…');
      if (onGenerated({
        ...result,
        sourceWasGenerated: sourceMode === 'generated',
      }) === false) {
        throw new Error(
          'The question was generated, but the selected MCQ block could not be updated.',
        );
      }
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the MCQ.');
      setPending(false);
      setProgressLabel('');
    }
  }

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel={progressLabel}
      title="Generate MCQ with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Question settings
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div>
          <p className="text-sm font-semibold text-primary">Source</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {([
              ['worksheet', 'From worksheet'],
              ['paste', 'Paste text'],
              ['generated', 'Generate source'],
            ] as const).map(([value, label]) => (
              <button
                type="button"
                key={value}
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

        {sourceMode === 'worksheet' ? (
          <div className="mt-4">
            <label className="block text-sm font-semibold text-primary">
              Worksheet source
              <select
                autoFocus
                value={sourcePos}
                onChange={(event) => setSourcePos(event.target.value)}
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value="">Select a source block…</option>
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
                Add a Rich Text or Fill in the Blank block, or choose another source option.
              </p>
            )}
          </div>
        ) : sourceMode === 'paste' ? (
          <label className="mt-4 block text-sm font-semibold text-primary">
            Source text
            <textarea
              autoFocus
              value={pastedSourceText}
              maxLength={20_000}
              onChange={(event) => setPastedSourceText(event.target.value)}
              placeholder="Paste the source text used to generate the question…"
              className="mt-2 min-h-40 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2.5 text-sm font-normal leading-6 text-secondary outline-none placeholder:text-placeholder focus:border-brand focus:ring-2 focus:ring-brand"
            />
            <span className="mt-1 block text-right text-xs font-normal tabular-nums text-quaternary">
              {pastedSourceText.length.toLocaleString()} / 20,000
            </span>
          </label>
        ) : (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(16rem,0.55fr)] items-start gap-4">
            <label className="block text-sm font-semibold text-primary">
              Topic / learning focus
              <input
                autoFocus
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="What should the source text and question be about?"
                className="mt-2 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-medium text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </label>
            <TextTypeSelect
              value={textType}
              onChange={setTextType}
            />
          </div>
        )}

        <div className="mt-4 grid grid-cols-4 gap-4 border-t border-secondary pt-4">
          <label className="block text-xs font-semibold text-tertiary">
            Number of questions
            <input
              type="number"
              min={1}
              max={10}
              value={questionCount}
              onChange={(event) => setQuestionCount(
                Math.min(10, Math.max(1, Number(event.target.value) || 1)),
              )}
              className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>
          <label className="block text-xs font-semibold text-tertiary">
            Cognitive level
            <select
              value={cognitiveLevel}
              onChange={(event) => setCognitiveLevel(
                event.target.value as CognitiveLevel,
              )}
              className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            >
              {COGNITIVE_LEVELS.map(({ value, label }) => (
                <option value={value} key={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-tertiary">
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(
                event.target.value as Difficulty,
              )}
              className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-tertiary">
            Answer options
            <select
              value={optionCount}
              onChange={(event) => setOptionCount(Number(event.target.value))}
              className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            >
              {[3, 4, 5].map((count) => (
                <option value={count} key={count}>{count}</option>
              ))}
            </select>
          </label>
          <p className="col-span-4 -mt-1 text-xs leading-5 text-quaternary">
            {cognitiveDescription}
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
