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
  generateCrosswordEntries,
} from '@/components/editor/crossword-ai-modal';
import type { GeneratedMCQ } from '@/components/editor/mcq-ai-modal';
import { readAIProgressStream } from '@/lib/ai-progress';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';

type CognitiveLevel = 'remember' | 'understand' | 'apply' | 'analyze';
type Difficulty = 'easy' | 'moderate' | 'challenging';
type LanguageDifficulty = 'default' | 'slightly-easier';
type ProficiencyLevel =
  | 'A1.1' | 'A1.2'
  | 'A2.1' | 'A2.2'
  | 'B1.1' | 'B1.2';
type ProficiencyPhase =
  | 'beginning'
  | 'middle'
  | 'towards-end'
  | 'completed';

const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  'A1.1', 'A1.2',
  'A2.1', 'A2.2',
  'B1.1', 'B1.2',
];

function initialProficiencyLevel(value: string): ProficiencyLevel {
  const exact = PROFICIENCY_LEVELS.find((level) => value.includes(level));
  if (exact) return exact;
  const broad = value.match(/\b(A1|A2|B1)\b/i)?.[1].toUpperCase();
  return broad === 'A1' || broad === 'A2' || broad === 'B1'
    ? `${broad}.1`
    : 'A2.1';
}

function initialProficiencyPhase(value: string): ProficiencyPhase {
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes('towards end') || normalized.includes('gegen ende')) {
    return 'towards-end';
  }
  if (normalized.includes('middle') || normalized.includes('mitte')) {
    return 'middle';
  }
  if (normalized.includes('completed') || normalized.includes('abgeschlossen')) {
    return 'completed';
  }
  return 'beginning';
}

function proficiencyDescription(
  level: ProficiencyLevel,
  phase: ProficiencyPhase,
) {
  const phaseLabel = {
    beginning: 'beginning of this sublevel',
    middle: 'middle of this sublevel',
    'towards-end': 'towards the end of this sublevel',
    completed: 'this sublevel has been completed',
  }[phase];
  return `CEFR ${level} — ${phaseLabel}. Calibrate all learner-facing language
to this precise point within the sublevel.`;
}

export type VocabularyOneResult = {
  heading: string;
  crosswordEntries: CrosswordEntry[];
  crosswordLayoutSeed: number;
  fillTitle: string;
  fillText: string;
  fillDistractors: string[];
  mcq: GeneratedMCQ['questions'];
};

type VocabularyExclusion = {
  term: string;
  reason:
    | 'topic-mismatch'
    | 'cannot-integrate-naturally'
    | 'ambiguous-or-invalid-term';
  explanation: string;
};

function gridWord(value: string) {
  return (value.toLocaleUpperCase('de-CH').match(/[\p{L}\p{N}]/gu) ?? [])
    .join('');
}

function completedFillText(text: string) {
  return text.replace(
    /\{\{blank:([^{}|]+)(?:\|[^{}]+)?\}\}/gi,
    (_, answer: string) => answer.trim(),
  );
}

export function VocabularyOneAIModal({
  context,
  onClose,
  onGenerated,
  open,
}: {
  context: WorksheetContext;
  onClose: () => void;
  onGenerated: (result: VocabularyOneResult) => boolean | void;
  open: boolean;
}) {
  const [heading, setHeading] = useState('');
  const [topic, setTopic] = useState('');
  const [wordList, setWordList] = useState('');
  const [sentenceCount, setSentenceCount] = useState<number | null>(null);
  const [blanksPerSentence, setBlanksPerSentence] =
    useState<number | null>(null);
  const [definitionClues, setDefinitionClues] = useState(true);
  const [blankClues, setBlankClues] = useState(true);
  const [cognitiveLevel, setCognitiveLevel] =
    useState<CognitiveLevel>('understand');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [questionLanguageDifficulty, setQuestionLanguageDifficulty] =
    useState<LanguageDifficulty>('default');
  const [optionLanguageDifficulty, setOptionLanguageDifficulty] =
    useState<LanguageDifficulty>('default');
  const [proficiencyLevel, setProficiencyLevel] =
    useState<ProficiencyLevel>('A2.1');
  const [proficiencyPhase, setProficiencyPhase] =
    useState<ProficiencyPhase>('beginning');
  const [generationContext, setGenerationContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const [pending, setPending] = useState(false);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState('');
  const [reviewResult, setReviewResult] = useState<{
    result: VocabularyOneResult;
    exclusions: VocabularyExclusion[];
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    setHeading('');
    setTopic('');
    setWordList('');
    setSentenceCount(null);
    setBlanksPerSentence(null);
    setDefinitionClues(true);
    setBlankClues(true);
    setCognitiveLevel('understand');
    setDifficulty('moderate');
    setQuestionLanguageDifficulty('default');
    setOptionLanguageDifficulty('default');
    setProficiencyLevel(initialProficiencyLevel(context.languageLevel));
    setProficiencyPhase(initialProficiencyPhase(context.languageLevel));
    setGenerationContext({ ...EMPTY_WORKSHEET_CONTEXT, ...context });
    setPending(false);
    setProgressLabel('');
    setError('');
    setReviewResult(null);
  }, [context, open]);

  async function generate() {
    if (reviewResult) {
      if (onGenerated(reviewResult.result) === false) {
        setError('The generated Vocabulary 1 flow could not be inserted.');
      }
      return;
    }
    const words = wordList
      .split(/\r?\n/)
      .map((word) => word.trim())
      .filter(Boolean);
    if (!heading.trim()) {
      setError('Enter the H1 heading.');
      return;
    }
    if (!topic.trim()) {
      setError('Enter a topic or learning focus.');
      return;
    }
    if (words.length < 2 || words.length > 20) {
      setError('Enter between 2 and 20 vocabulary words.');
      return;
    }
    if (
      words.some((word) => gridWord(word).length < 2)
      || new Set(words.map(gridWord)).size !== words.length
    ) {
      setError('Remove invalid or duplicate vocabulary words.');
      return;
    }
    if (!definitionClues && !blankClues) {
      setError('Enable at least one crossword clue format.');
      return;
    }

    setPending(true);
    setError('');
    try {
      const workflowContext: WorksheetContext = {
        ...generationContext,
        languageLevel: proficiencyDescription(
          proficiencyLevel,
          proficiencyPhase,
        ),
      };
      setProgressLabel('Generating crossword clues…');
      const generatedCrosswordEntries = await generateCrosswordEntries({
        words,
        clueFormats: [
          ...(definitionClues ? ['definition'] as const : []),
          ...(blankClues ? ['blank'] as const : []),
        ],
        context: workflowContext,
        progression: {
          level: proficiencyLevel,
          phase: proficiencyPhase,
        },
      });
      const crosswordEntries = generatedCrosswordEntries.map((entry, index) => ({
        id: `vocabulary-one-crossword-${index}-${gridWord(entry.answer)}`,
        ...entry,
      }));
      const bestCrossword = generateBestCrosswordLayout(crosswordEntries);
      if (bestCrossword.layout.unplaced.length) {
        throw new Error(
          `These words do not fit the crossword: ${
            bestCrossword.layout.unplaced.map(({ answer }) => answer).join(', ')
          }.`,
        );
      }

      setProgressLabel('Generating fill-in-the-blank text…');
      const fillTopic = topic.trim().slice(0, 300);
      const blankFocus = `Choose meaningful target-vocabulary blanks that
support this topic: ${topic.trim()}`.slice(0, 300);
      const fillResponse = await fetch('/api/ai/fill-in-the-blank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: fillTopic,
          sourceText: null,
          sentenceCount,
          blanksPerSentence,
          distractorCount: 2,
          allowDuplicates: true,
          textStructure: 'continuous-text',
          blankFocus,
          generateTitle: true,
          targetVocabulary: words,
          context: workflowContext,
          progression: {
            level: proficiencyLevel,
            phase: proficiencyPhase,
          },
        }),
      });
      const fillResult = await fillResponse.json() as {
        text?: string;
        title?: string;
        distractors?: string[];
        excludedVocabulary?: VocabularyExclusion[];
        error?: string;
      };
      if (!fillResponse.ok || !fillResult.text) {
        throw new Error(
          fillResult.error
          ?? 'Could not generate the fill-in-the-blank text.',
        );
      }

      setProgressLabel('Generating three MCQ questions…');
      let mcqResult: Omit<
        GeneratedMCQ,
        'sourceWasGenerated'
      > | null = null;
      let mcqError: unknown = null;
      for (let attempt = 0; attempt < 3 && !mcqResult; attempt += 1) {
        try {
          if (attempt > 0) {
            setProgressLabel(
              `Improving MCQ answer quality… (${attempt + 1}/3)`,
            );
          }
          const mcqResponse = await fetch('/api/ai/mcq', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceMode: 'paste',
              sourceText: completedFillText(fillResult.text),
              topic: topic.trim(),
              textType: '',
              questionCount: 3,
              optionCount: 3,
              cognitiveLevel,
              difficulty,
              questionLanguageDifficulty,
              optionLanguageDifficulty,
              context: workflowContext,
              progression: {
                level: proficiencyLevel,
                phase: proficiencyPhase,
              },
            }),
          });
          mcqResult = await readAIProgressStream<Omit<
            GeneratedMCQ,
            'sourceWasGenerated'
          >>(mcqResponse, setProgressLabel);
        } catch (error) {
          mcqError = error;
        }
      }
      if (!mcqResult) {
        throw mcqError ?? new Error('Could not generate valid MCQ questions.');
      }
      if (mcqResult.questions.length !== 3) {
        throw new Error('The AI did not return exactly three MCQ questions.');
      }

      const result: VocabularyOneResult = {
        heading: heading.trim(),
        crosswordEntries,
        crosswordLayoutSeed: bestCrossword.seed,
        fillTitle: fillResult.title?.trim() ?? '',
        fillText: fillResult.text,
        fillDistractors: fillResult.distractors ?? [],
        mcq: mcqResult.questions,
      };
      const exclusions = fillResult.excludedVocabulary ?? [];
      if (exclusions.length) {
        setReviewResult({ result, exclusions });
        setPending(false);
        setProgressLabel('');
        return;
      }

      setProgressLabel('Inserting Vocabulary 1…');
      if (onGenerated(result) === false) {
        throw new Error('The generated Vocabulary 1 flow could not be inserted.');
      }
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : 'Could not generate Vocabulary 1.',
      );
      setPending(false);
      setProgressLabel('');
    }
  }

  const selectClass = 'mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand';

  return (
    <AIGenerationModal
      error={error}
      generateLabel={reviewResult ? 'Insert best version' : 'Generate'}
      onClose={onClose}
      onGenerate={() => void generate()}
      open={open}
      pending={pending}
      progressLabel={progressLabel}
      title="Generate Vocabulary 1"
    >
      {reviewResult && (
        <section className="mb-5 rounded-xl border border-warning-primary bg-warning-primary p-5">
          <h3 className="text-sm font-semibold text-primary">
            Vocabulary excluded from the continuous text
          </h3>
          <p className="mt-2 text-xs leading-5 text-secondary">
            These terms remain in the crossword but were omitted from the
            Fill-in-the-Blank text and its MCQs to preserve a coherent text.
          </p>
          <ul className="mt-3 space-y-2">
            {reviewResult.exclusions.map((exclusion) => (
              <li
                className="rounded-md border border-warning-primary bg-primary px-3 py-2 text-xs text-secondary"
                key={exclusion.term}
              >
                <strong className="text-primary">{exclusion.term}</strong>
                <span className="ml-2">{exclusion.explanation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <section className="rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">General</h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-tertiary">
            H1 heading
            <input
              autoFocus
              value={heading}
              onChange={(event) => setHeading(event.target.value)}
              className={selectClass}
            />
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Topic / learning focus
            <input
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className={selectClass}
            />
          </label>
        </div>
        <label className="mt-4 block text-xs font-semibold text-tertiary">
          Vocabulary words
          <textarea
            rows={7}
            value={wordList}
            onChange={(event) => setWordList(event.target.value)}
            placeholder={'One word per line\nTisch\nStuhl\nKüche'}
            className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal leading-6 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">
          Language proficiency override
        </h3>
        <p className="mt-1 text-xs leading-5 text-quaternary">
          Overrides the language proficiency from the worksheet profile for
          every Vocabulary 1 generation step.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-tertiary">
            CEFR sublevel
            <select
              value={proficiencyLevel}
              onChange={(event) => setProficiencyLevel(
                event.target.value as ProficiencyLevel,
              )}
              className={selectClass}
            >
              {PROFICIENCY_LEVELS.map((level) => (
                <option value={level} key={level}>{level}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Position within sublevel
            <select
              value={proficiencyPhase}
              onChange={(event) => setProficiencyPhase(
                event.target.value as ProficiencyPhase,
              )}
              className={selectClass}
            >
              <option value="beginning">Beginning</option>
              <option value="middle">In the middle</option>
              <option value="towards-end">Towards the end</option>
              <option value="completed">Completed</option>
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">Crossword</h3>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex items-center gap-3 text-sm text-secondary">
            <Toggle
              aria-label="Definition or paraphrase clues"
              size="md"
              isSelected={definitionClues}
              onChange={setDefinitionClues}
            />
            Definition or paraphrase
          </label>
          <label className="flex items-center gap-3 text-sm text-secondary">
            <Toggle
              aria-label="Blank sentence clues"
              size="md"
              isSelected={blankClues}
              onChange={setBlankClues}
            />
            Blank sentence
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">Fill in the Blank</h3>
        <p className="mt-2 text-xs leading-5 text-quaternary">
          AI generates a title from the topic or learning focus.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-tertiary">
            Sentences
            <select
              value={sentenceCount ?? 'auto'}
              onChange={(event) => setSentenceCount(
                event.target.value === 'auto'
                  ? null
                  : Number(event.target.value),
              )}
              className={selectClass}
            >
              <option value="auto">Auto</option>
              {Array.from({ length: 13 }, (_, index) => index + 3).map(
                (count) => (
                  <option value={count} key={count}>{count}</option>
                ),
              )}
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Blanks per sentence
            <select
              value={blanksPerSentence ?? 'auto'}
              onChange={(event) => setBlanksPerSentence(
                event.target.value === 'auto'
                  ? null
                  : Number(event.target.value),
              )}
              className={selectClass}
            >
              <option value="auto">Auto</option>
              {[1, 2, 3].map((count) => (
                <option value={count} key={count}>{count}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="mt-5 rounded-xl border border-secondary bg-secondary p-5">
        <h3 className="text-sm font-semibold text-primary">
          Multiple choice · 3 questions · 3 options
        </h3>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <label className="text-xs font-semibold text-tertiary">
            Cognitive level
            <select
              value={cognitiveLevel}
              onChange={(event) => setCognitiveLevel(
                event.target.value as CognitiveLevel,
              )}
              className={selectClass}
            >
              <option value="remember">Remember</option>
              <option value="understand">Understand</option>
              <option value="apply">Apply</option>
              <option value="analyze">Analyze</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Logic difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(
                event.target.value as Difficulty,
              )}
              className={selectClass}
            >
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="challenging">Challenging</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Question language
            <select
              value={questionLanguageDifficulty}
              onChange={(event) => setQuestionLanguageDifficulty(
                event.target.value as LanguageDifficulty,
              )}
              className={selectClass}
            >
              <option value="default">Default (text level)</option>
              <option value="slightly-easier">Slightly easier than text</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-tertiary">
            Option language
            <select
              value={optionLanguageDifficulty}
              onChange={(event) => setOptionLanguageDifficulty(
                event.target.value as LanguageDifficulty,
              )}
              className={selectClass}
            >
              <option value="default">Default (text level)</option>
              <option value="slightly-easier">Slightly easier than text</option>
            </select>
          </label>
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
