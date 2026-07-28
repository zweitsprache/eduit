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
  topic: z.string().trim().min(1).max(300),
  wordCount: z.number().int().min(1).max(30).nullable(),
  columns: z.number().int().min(3).max(20),
  rows: z.number().int().min(3).max(20),
  maxWordLength: z.number().int().min(3).max(20),
  context: z.unknown(),
});

const resultSchema = z.object({
  words: z.array(z.string().trim().min(1)).min(1).max(30),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const autoWordLimit = Math.min(
      20,
      Math.max(3, Math.floor((input.columns * input.rows) / 6)),
    );
    const requestedCount = input.wordCount === null
      ? `Choose a sensible number between 3 and ${autoWordLimit}. Use fewer words for younger, beginner, or literacy learners and more only when the topic and learner level support it. Avoid overcrowding the ${input.columns} × ${input.rows} grid.`
      : `Return exactly ${input.wordCount} words.`;
    const contentLanguage = context?.contentLanguage ?? '';
    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.4,
      prompt: `Create words for an educational word-search grid.

Generation topic: ${input.topic}
Grid size: ${input.columns} columns × ${input.rows} rows
Word count: ${requestedCount}
Maximum characters per word: ${input.maxWordLength}

Worksheet context:
${worksheetContextPrompt(context, input.topic)}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Return distinct learner-appropriate words.
Use the requested content language.
Each entry must be a single grid-ready word: letters only, with no spaces, hyphens, punctuation, numbering, explanations, or translations.
Keep every word at or below ${input.maxWordLength} characters.
Match vocabulary difficulty and spelling to the learner context.
${localeSpellingInstruction(contentLanguage)}`,
    });

    const seen = new Set<string>();
    const words = output.words
      .map((word) => normalizeLocaleSpelling(word.trim(), contentLanguage))
      .filter((word) => (
        word.length <= input.maxWordLength
        && /^\p{L}+$/u.test(word)
        && !seen.has(word.toLocaleLowerCase())
        && seen.add(word.toLocaleLowerCase())
      ))
      .slice(0, input.wordCount ?? autoWordLimit);

    const hasValidCount = input.wordCount === null
      ? words.length >= 3
      : words.length === input.wordCount;
    if (!hasValidCount) {
      throw new Error('The model did not return enough valid words. Please generate again.');
    }

    return Response.json({ words });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Invalid generation request.'
      : error instanceof Error
        ? error.message
        : 'Word generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
