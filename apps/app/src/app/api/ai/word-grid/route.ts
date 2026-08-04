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
import { getWorksheet, validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  topic: z.string().trim().max(300).optional().nullable(),
  sourceWorksheetId: z.string().uuid().optional().nullable(),
  wordCount: z.number().int().min(1).max(30).nullable(),
  columns: z.number().int().min(3).max(20),
  rows: z.number().int().min(3).max(20),
  maxWordLength: z.number().int().min(3).max(20),
  context: z.unknown(),
});

const MAX_SOURCE_TEXT_LENGTH = 6000;

function worksheetToPlainText(contentHtml: string): string {
  return contentHtml
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

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
    if (!input.topic?.trim() && !input.sourceWorksheetId) {
      return Response.json(
        { error: 'Provide a topic or a source worksheet.' },
        { status: 400 },
      );
    }
    const context = validateWorksheetPatch({ context: input.context }).context;

    let sourceText = '';
    if (input.sourceWorksheetId) {
      const sourceWorksheet = await getWorksheet(
        input.sourceWorksheetId,
        user.id,
        user.isAdmin,
      );
      if (!sourceWorksheet) {
        return Response.json(
          { error: 'Source worksheet not found.' },
          { status: 404 },
        );
      }
      sourceText = worksheetToPlainText(sourceWorksheet.contentHtml).slice(
        0,
        MAX_SOURCE_TEXT_LENGTH,
      );
    }

    const autoWordLimit = Math.min(
      20,
      Math.max(3, Math.floor((input.columns * input.rows) / 6)),
    );
    const requestedCount = input.wordCount === null
      ? `Choose a sensible number between 3 and ${autoWordLimit}. Use fewer words for younger, beginner, or literacy learners and more only when the topic and learner level support it. Avoid overcrowding the ${input.columns} × ${input.rows} grid.`
      : `Return exactly ${input.wordCount} words.`;
    const contentLanguage = context?.contentLanguage ?? '';
    const generationTopic = input.topic?.trim()
      ?? 'Extract words from the provided source worksheet';
    const sourceSection = sourceText
      ? `Use the following source worksheet as the primary pool of words. Extract suitable single words from it. You may supplement with topic-related words only if the source does not contain enough valid options.

Source worksheet content:
${sourceText}

`
      : '';
    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.4,
      prompt: `${sourceSection}Create words for an educational word-search grid.

Generation topic: ${generationTopic}
Grid size: ${input.columns} columns × ${input.rows} rows
Word count: ${requestedCount}
Maximum characters per word: ${input.maxWordLength}

Worksheet context:
${worksheetContextPrompt(context, generationTopic)}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Return distinct learner-appropriate words.
Use the requested content language.
Each entry must be a single grid-ready word: letters only, with no spaces, hyphens, punctuation, numbering, explanations, or translations.
Keep every word at or below ${input.maxWordLength} characters.
Match vocabulary difficulty and spelling to the learner context.
${sourceText ? 'Prefer words that appear in the source worksheet when they fit the requirements above.' : ''}
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
