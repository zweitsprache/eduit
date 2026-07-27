"use client";

import { useEffect, useState } from 'react';
import { DocumentContextFields } from '@/components/context/document-context-fields';
import { Toggle } from '@/components/base/toggle/toggle';
import { AIGenerationModal } from '@/components/editor/ai-generation-modal-ui';
import type { TrueFalseValue } from '@/components/editor/true-false-node';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

export type RichTextSource = {
  pos: number;
  label: string;
  text: string;
};

export type GeneratedTrueFalse = {
  question: string;
  includeNotGiven: boolean;
  notGivenLabel: string;
  rows: Array<{
    text: string;
    correctValue: TrueFalseValue;
  }>;
};

type CognitiveLevel =
  | 'literal'
  | 'paraphrase'
  | 'combining'
  | 'inference'
  | 'global';

const COGNITIVE_LEVELS: Array<{
  value: CognitiveLevel;
  label: string;
  description: string;
}> = [
  {
    value: 'literal',
    label: 'Literal / verbatim match',
    description: 'Statements closely repeat information from the source.',
  },
  {
    value: 'paraphrase',
    label: 'Paraphrase',
    description: 'The same information is expressed with different wording.',
  },
  {
    value: 'combining',
    label: 'Combining information',
    description: 'Learners connect information from multiple parts of the text.',
  },
  {
    value: 'inference',
    label: 'Inference',
    description: 'Learners deduce answers from clues rather than explicit statements.',
  },
  {
    value: 'global',
    label: 'Global / evaluative',
    description: 'Items assess the main idea, intention, tone, or complete text.',
  },
];

export function TrueFalseAIModal({
  context,
  initialStatementCount,
  onClose,
  onGenerated,
  open,
  sources,
}: {
  context: WorksheetContext;
  initialStatementCount: number;
  onClose: () => void;
  onGenerated: (result: GeneratedTrueFalse) => void;
  open: boolean;
  sources: RichTextSource[];
}) {
  const [statementCount, setStatementCount] = useState(6);
  const [autoStatementCount, setAutoStatementCount] = useState(false);
  const [sourcePos, setSourcePos] = useState('');
  const [cognitiveLevel, setCognitiveLevel] =
    useState<CognitiveLevel>('paraphrase');
  const [plausibleDistractors, setPlausibleDistractors] = useState(true);
  const [differentWording, setDifferentWording] = useState(true);
  const [includeNegation, setIncludeNegation] = useState(false);
  const [includeNotGiven, setIncludeNotGiven] = useState(false);
  const [scatteredAnswers, setScatteredAnswers] = useState(false);
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setStatementCount(Math.min(15, Math.max(2, initialStatementCount)));
    setAutoStatementCount(false);
    setSourcePos('');
    setCognitiveLevel('paraphrase');
    setPlausibleDistractors(true);
    setDifferentWording(true);
    setIncludeNegation(false);
    setIncludeNotGiven(false);
    setScatteredAnswers(false);
    setGenerationContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...context,
    });
    setPending(false);
    setError('');
  }, [context, initialStatementCount, open]);

  async function generate() {
    const source = sources.find(({ pos }) => String(pos) === sourcePos);
    if (!source) {
      setError('Select a Rich Text source from this worksheet.');
      return;
    }
    if (!autoStatementCount && includeNotGiven && statementCount < 3) {
      setError('Use at least three statements when Not given is enabled.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const response = await fetch('/api/ai/true-false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementCount: autoStatementCount ? null : statementCount,
          sourceText: source.text,
          cognitiveLevel,
          difficultyFactors: {
            plausibleDistractors,
            differentWording,
            includeNegation,
            includeNotGiven,
            scatteredAnswers,
          },
          context: generationContext,
        }),
      });
      const result = await response.json() as {
        question?: string;
        includeNotGiven?: boolean;
        notGivenLabel?: string;
        rows?: GeneratedTrueFalse['rows'];
        error?: string;
      };
      if (
        !response.ok
        || !result.question
        || !result.rows
        || typeof result.includeNotGiven !== 'boolean'
        || !result.notGivenLabel
      ) {
        throw new Error(result.error ?? 'Could not generate the activity.');
      }
      onGenerated({
        question: result.question,
        includeNotGiven: result.includeNotGiven,
        notGivenLabel: result.notGivenLabel,
        rows: result.rows,
      });
    } catch (generationError) {
      setError(generationError instanceof Error
        ? generationError.message
        : 'Could not generate the activity.');
      setPending(false);
    }
  }

  const selectedSource = sources.find(({ pos }) => String(pos) === sourcePos);

  return (
    <AIGenerationModal
      error={error}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      title="Generate True / False with Eduit AI"
    >
      <h3 className="mb-3 text-sm font-semibold text-primary">
        Activity settings
      </h3>
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <label className="block text-sm font-semibold text-primary">
            Source text
            <select
              autoFocus
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
          <div>
            <p className="text-sm font-semibold text-primary">
              Number of statements
            </p>
            <div className="mt-2 flex h-10 items-center gap-4">
              <Toggle
                label="Auto"
                isSelected={autoStatementCount}
                onChange={setAutoStatementCount}
              />
              <input
                aria-label="Number of statements"
                type="number"
                min={2}
                max={15}
                disabled={autoStatementCount}
                value={statementCount}
                onChange={(event) => setStatementCount(
                  Math.min(15, Math.max(2, Number(event.target.value) || 2)),
                )}
                className="h-10 w-24 rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand disabled:cursor-not-allowed disabled:bg-disabled_subtle disabled:text-disabled"
              />
            </div>
          </div>
        </div>

        <label className="mt-4 block border-t border-secondary pt-4 text-xs font-semibold text-tertiary">
          Cognitive processing
          <select
            value={cognitiveLevel}
            onChange={(event) => setCognitiveLevel(
              event.target.value as CognitiveLevel,
            )}
            className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          >
            {COGNITIVE_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-xs leading-5 text-quaternary">
          {COGNITIVE_LEVELS.find(({ value }) => value === cognitiveLevel)
            ?.description}
        </p>
        {selectedSource && (
          <div className="mt-3 max-h-28 overflow-y-auto rounded-md border border-secondary bg-primary px-3 py-2 text-xs leading-5 text-tertiary">
            {selectedSource.text}
          </div>
        )}
        {!sources.length && (
          <p className="mt-2 text-xs text-quaternary">
            Add a Rich Text block to the worksheet to use it as a source.
          </p>
        )}
      </section>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-primary">
          Additional difficulty
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
          {[
            {
              label: 'Plausible distractors',
              selected: plausibleDistractors,
              change: setPlausibleDistractors,
            },
            {
              label: 'Different wording',
              selected: differentWording,
              change: setDifferentWording,
            },
            {
              label: 'Include negation',
              selected: includeNegation,
              change: setIncludeNegation,
            },
            {
              label: 'Add Not given',
              selected: includeNotGiven,
              change: (selected: boolean) => {
                setIncludeNotGiven(selected);
                if (selected) setStatementCount((count) => Math.max(3, count));
              },
            },
            {
              label: 'Scatter answer locations',
              selected: scatteredAnswers,
              change: setScatteredAnswers,
            },
          ].map((factor) => (
            <div
              className="flex items-center gap-2 text-left text-sm font-semibold text-secondary"
              key={factor.label}
            >
              <Toggle
                aria-label={factor.label}
                size="md"
                isSelected={factor.selected}
                onChange={factor.change}
              />
              <span>{factor.label}</span>
            </div>
          ))}
        </div>
      </div>

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
