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
import {
  germanProgressionInstruction,
} from '@/lib/german-language-progression';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  words: z.array(z.string().trim().min(1).max(80)).min(2).max(20),
  clueFormats: z.array(z.enum(['definition', 'blank'])).min(1).max(2),
  progression: z.object({
    level: z.enum(['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2']),
    phase: z.enum(['beginning', 'middle', 'towards-end', 'completed']),
  }).optional(),
  context: z.unknown(),
});

const resultSchema = z.object({
  entries: z.array(z.object({
    answer: z.string().trim().min(1),
    clue: z.string().trim().min(1).max(300),
    clueFormat: z.enum(['definition', 'blank']),
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

function mixedFormatBounds(entryCount: number) {
  const lower = Math.ceil(entryCount * 0.4);
  const upper = Math.floor(entryCount * 0.6);
  return lower <= upper
    ? { lower, upper }
    : { lower: Math.floor(entryCount / 2), upper: Math.ceil(entryCount / 2) };
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
    const progressionInstruction = germanProgressionInstruction({
      artifact: 'crossword-clue',
      contentLanguage,
      selection: input.progression,
    });
    const useDefinitions = input.clueFormats.includes('definition');
    const useBlanks = input.clueFormats.includes('blank');
    const mixedBounds = mixedFormatBounds(words.length);
    const formatInstruction = useDefinitions && useBlanks
      ? `Choose the most pedagogically useful format separately for each answer.
Use between ${mixedBounds.lower} and ${mixedBounds.upper} blank clues; use
definition/paraphrase clues for all remaining entries.`
      : useBlanks
        ? 'Use the blank format for every entry.'
        : 'Use the definition format for every entry.';
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

${progressionInstruction}

Allowed clue formats:
${formatInstruction}

Mandatory requirements:
- Return exactly one entry for every supplied answer and no additional entries.
- Copy every answer exactly as supplied. Do not translate, correct, inflect, or replace it.
- Write each clue in the worksheet content language.
- Make every clue concise, unambiguous, learner-appropriate, and solvable from the worksheet context.
- Do not include the answer itself, a trivial spelling variant, blanks matching its letters, or its first-letter hint in the clue.
- Set clueFormat to "definition" or "blank" and follow that format exactly.
- For clueFormat "definition", write a concise definition, description, or
  paraphrase without a blank.
- For clueFormat "blank", write a natural contextual sentence containing
  exactly one blank written as ________. The exact supplied answer must fit
  grammatically into that blank without translation, correction, or inflection.
  Do not show the answer anywhere else in the sentence.
- Decide the best format from the answer and worksheet context, not by
  alternating mechanically. Do not number clues.
- Do not use or mention real brands, company names, commercial products, or trademarks.
- Never include identifying personal information about a real person. Use fictional, non-identifying details only.
${localeSpellingInstruction(contentLanguage)}`,
    });

    if (output.entries.length !== words.length) {
      throw new Error('The model did not return one clue for every word. Please generate again.');
    }

    const generatedByGridWord = new Map<string, {
      clue: string;
      clueFormat: 'definition' | 'blank';
    }>();
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
        {
          clue: normalizeLocaleSpelling(entry.clue.trim(), contentLanguage),
          clueFormat: entry.clueFormat,
        },
      );
    }

    const entries = words.map((answer) => {
      const generated = generatedByGridWord.get(gridWord(answer));
      if (!generated) {
        throw new Error('The model did not return one clue for every word. Please generate again.');
      }
      const { clue, clueFormat } = generated;
      if (!input.clueFormats.includes(clueFormat)) {
        throw new Error('The model used a clue format that was not selected. Please generate again.');
      }
      const blankCount = clue.match(/_{4,}/g)?.length ?? 0;
      if (
        (clueFormat === 'blank' && blankCount !== 1)
        || (clueFormat === 'definition' && blankCount !== 0)
      ) {
        throw new Error(`The clue format for “${answer}” is invalid. Please generate again.`);
      }
      if (clueRevealsAnswer(clue, answer)) {
        throw new Error(`The clue for “${answer}” reveals the answer. Please generate again.`);
      }
      return { answer, clue, clueFormat };
    });

    const blankCount = entries.filter(({ clueFormat }) => (
      clueFormat === 'blank'
    )).length;
    if (
      useDefinitions && useBlanks
      && (blankCount < mixedBounds.lower || blankCount > mixedBounds.upper)
    ) {
      throw new Error('The model did not produce the requested clue-format mix. Please generate again.');
    }

    return Response.json({
      entries: entries.map(({ answer, clue }) => ({ answer, clue })),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Enter between 2 and 20 valid words.'
      : error instanceof Error
        ? error.message
        : 'Crossword generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
