import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { educationalContentModel } from '@/lib/ai';
import {
  languageProficiencyInstruction,
  localeSpellingInstruction,
  normalizeLocaleSpelling,
  worksheetContextPrompt,
} from '@/lib/ai-generation';
import { validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  words: z.array(z.string().trim().min(1).max(80)).min(2).max(20),
  context: z.unknown(),
});

const resultSchema = z.object({
  entries: z.array(z.object({
    answer: z.string().trim().min(1),
    clue: z.string().trim().min(1).max(300),
  })).min(2).max(20),
});

function gridWord(value: string) {
  return (value.toLocaleUpperCase('de-CH').match(/[\p{L}\p{N}]/gu) ?? [])
    .join('');
}

function clueRevealsAnswer(clue: string, answer: string) {
  const answerWord = gridWord(answer);
  const clueWords = clue.match(/[\p{L}\p{N}]+/gu) ?? [];
  return clueWords.some((word) => gridWord(word) === answerWord);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const words = input.words.map((word) => word.trim());
    const requestedByGridWord = new Map<string, string>();
    for (const word of words) {
      const normalized = gridWord(word);
      if (normalized.length < 2) {
        throw new Error(`“${word}” needs at least two letters or numbers.`);
      }
      if (requestedByGridWord.has(normalized)) {
        throw new Error('The word list contains duplicate crossword answers.');
      }
      requestedByGridWord.set(normalized, word);
    }

    const contentLanguage = context?.contentLanguage ?? '';
    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.35,
      prompt: `Write clues for an educational crossword.

The learner or teacher supplied these exact answers:
${words.map((word, index) => `${index + 1}. ${word}`).join('\n')}

Worksheet context:
${worksheetContextPrompt(context, words.join(', '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Mandatory requirements:
- Return exactly one entry for every supplied answer and no additional entries.
- Copy every answer exactly as supplied. Do not translate, correct, inflect, or replace it.
- Write each clue in the worksheet content language.
- Make every clue concise, unambiguous, learner-appropriate, and solvable from the worksheet context.
- Do not include the answer itself, a trivial spelling variant, blanks matching its letters, or its first-letter hint in the clue.
- Prefer a short definition, description, or contextual prompt. Do not number clues.
- Do not use or mention real brands, company names, commercial products, or trademarks.
- Never include identifying personal information about a real person. Use fictional, non-identifying details only.
${localeSpellingInstruction(contentLanguage)}`,
    });

    if (output.entries.length !== words.length) {
      throw new Error('The model did not return one clue for every word. Please generate again.');
    }

    const generatedByGridWord = new Map<string, string>();
    for (const entry of output.entries) {
      const normalizedAnswer = gridWord(entry.answer);
      if (
        !requestedByGridWord.has(normalizedAnswer)
        || generatedByGridWord.has(normalizedAnswer)
      ) {
        throw new Error('The model changed the supplied word list. Please generate again.');
      }
      generatedByGridWord.set(
        normalizedAnswer,
        normalizeLocaleSpelling(entry.clue.trim(), contentLanguage),
      );
    }

    const entries = words.map((answer) => {
      const clue = generatedByGridWord.get(gridWord(answer));
      if (!clue) {
        throw new Error('The model did not return one clue for every word. Please generate again.');
      }
      if (clueRevealsAnswer(clue, answer)) {
        throw new Error(`The clue for “${answer}” reveals the answer. Please generate again.`);
      }
      return { answer, clue };
    });

    return Response.json({ entries });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Enter between 2 and 20 valid words.'
      : error instanceof Error
        ? error.message
        : 'Crossword generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
