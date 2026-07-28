import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';
import {
  languageProficiencyInstruction,
  localeSpellingInstruction,
  normalizeLocaleSpelling,
  usesGermanLanguage,
  worksheetContextPrompt,
} from '@/lib/ai-generation';
import {
  ERROR_CORRECTION_TYPES,
  errorTypeById,
} from '@/lib/error-correction-types';
import { validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const requestSchema = z.object({
  sourceMode: z.enum(['topic', 'worksheet', 'paste']),
  topic: z.string().trim().max(300),
  sourceText: z.string().trim().min(1).max(20_000).nullable(),
  language: z.enum(['german', 'english']),
  wordCount: z.number().int().min(40).max(500),
  errorDensity: z.number().int().min(5).max(50),
  markErrorPositions: z.boolean(),
  errorTypeIds: z.array(z.string().trim().min(1)).min(1).max(40),
  context: z.unknown(),
}).refine((input) => (
  input.sourceMode === 'topic' ? Boolean(input.topic) : Boolean(input.sourceText)
), 'A topic or source text is required.');

const resultSchema = z.object({
  correctText: z.string().trim().min(1).max(20_000),
  errors: z.array(z.object({
    typeId: z.string().trim().min(1).max(100),
    incorrect: z.string().min(1).max(300),
    correct: z.string().min(1).max(300),
    explanation: z.string().trim().min(1).max(300),
  })).min(1).max(30),
});

function wordCount(value: string) {
  return value.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const allowedTypeIds = new Set(
      ERROR_CORRECTION_TYPES[input.language]
        .flatMap(({ types }) => types.map(({ id }) => id)),
    );
    if (input.errorTypeIds.some((id) => !allowedTypeIds.has(id))) {
      throw new Error('An error type does not match the selected language.');
    }
    const sourceWordCount = input.sourceText
      ? wordCount(input.sourceText)
      : input.wordCount;
    const requestedErrorCount = Math.min(
      24,
      Math.max(1, Math.round(sourceWordCount / input.errorDensity)),
    );
    const selectedTypePrompt = input.errorTypeIds.map((id) => {
      const type = errorTypeById(id);
      return type
        ? `- ${type.id}: ${type.label}. ${type.description}. Example: ${type.example}`
        : '';
    }).filter(Boolean).join('\n');
    const contextLanguage = context?.contentLanguage ?? '';
    const generationLocale = input.language === 'german'
      ? usesGermanLanguage(contextLanguage) ? contextLanguage : 'German'
      : 'English';
    const sourceInstruction = input.sourceText
      ? `AUTHORITATIVE CORRECT SOURCE TEXT:
${input.sourceText}

Use this exact text as correctText. Do not correct, simplify, paraphrase,
reorder, expand, shorten, or otherwise edit it before introducing errors.`
      : `Generate a coherent correct text of approximately ${input.wordCount}
words about this topic: ${input.topic}`;

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      maxOutputTokens: 8_000,
      abortSignal: AbortSignal.timeout(110_000),
      temperature: 0.35,
      system: `You create controlled language-error correction activities.
You first establish one correct source text, then introduce only the requested
errors. Every change must be intentional, traceable, and reversible. Never
introduce accidental errors outside the structured error list.`,
      prompt: `Create an error-correction text in ${
        input.language === 'german' ? 'German' : 'English'
      }.

${sourceInstruction}

Create exactly ${requestedErrorCount} errors, approximately one error per
${input.errorDensity} words.

Allowed error types:
${selectedTypePrompt}

Worksheet context:
${worksheetContextPrompt(context, [
  input.topic,
  input.sourceText ?? '',
  selectedTypePrompt,
].join(' '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Strict transformation contract:
- correctText is the fully correct text.
- Each error must use exactly one allowed typeId.
- Each incorrect and correct span must be non-empty and locally replaceable.
- List errors in their exact left-to-right order in correctText.
- correct must be the exact substring appearing in correctText.
- incorrect must be the exact erroneous replacement for that correct span.
- If an error concept normally omits a word, include enough surrounding words
  in incorrect and correct to keep both spans non-empty.
- Do not create overlapping error spans.
- Do not introduce several errors into one span.
- Explanations must be short, accurate, and learner-friendly.
- The server constructs the error text deterministically from these spans.

Use the requested language and locale.
${localeSpellingInstruction(generationLocale)}`,
    });

    const correctText = input.sourceText
      ?? normalizeLocaleSpelling(output.correctText, generationLocale);
    const normalizedErrors = output.errors.map((error) => ({
      ...error,
      incorrect: input.sourceText
        ? error.incorrect
        : normalizeLocaleSpelling(error.incorrect, generationLocale),
      correct: input.sourceText
        ? error.correct
        : normalizeLocaleSpelling(error.correct, generationLocale),
      explanation: normalizeLocaleSpelling(error.explanation, generationLocale),
    }));
    if (normalizedErrors.length !== requestedErrorCount) {
      throw new Error('The model returned an unexpected number of errors.');
    }
    if (normalizedErrors.some(({ typeId }) => !input.errorTypeIds.includes(typeId))) {
      throw new Error('The model used an unselected error type.');
    }

    let sourceCursor = 0;
    let incorrectText = '';
    const errors = normalizedErrors.map((error, index) => {
      const correctStart = correctText.indexOf(error.correct, sourceCursor);
      if (correctStart < 0) {
        throw new Error('The model returned a correction not found in the source.');
      }
      incorrectText += correctText.slice(sourceCursor, correctStart);
      const start = incorrectText.length;
      incorrectText += error.incorrect;
      const end = incorrectText.length;
      sourceCursor = correctStart + error.correct.length;
      if (index === normalizedErrors.length - 1) {
        incorrectText += correctText.slice(sourceCursor);
      }
      return {
        id: `error-correction-ai-${Date.now()}-${index}`,
        ...error,
        start,
        end,
      };
    });

    return Response.json({
      language: input.language,
      incorrectText,
      correctText,
      errors,
      markErrorPositions: input.markErrorPositions,
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the source, language, density, and error-type settings.'
      : error instanceof Error
        ? error.message
        : 'Error-correction generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
