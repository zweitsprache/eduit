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

const speakerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().min(1).max(120),
  demeanor: z.string().trim().max(160),
});

const requestSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  speakers: z.array(speakerSchema).min(2).max(4),
  includeBlanks: z.boolean(),
  blankFocus: z.string().trim().max(300),
  context: z.unknown(),
});

const resultSchema = z.object({
  lines: z.array(z.object({
    speaker: z.number().int().min(1).max(4),
    text: z.string().trim().min(1).max(500),
    blankAnswer: z.string().trim().max(80).nullable(),
  })).min(4).max(20),
});

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const speakerPrompt = input.speakers.map((speaker, index) => (
      `${index + 1}. ${speaker.name} — role: ${speaker.role}${
        speaker.demeanor ? `; demeanor: ${speaker.demeanor}` : ''
      }`
    )).join('\n');
    const contentLanguage = context?.contentLanguage ?? '';
    const spellingInstruction = localeSpellingInstruction(contentLanguage);
    const blankInstruction = input.includeBlanks
      ? `For selected learner-relevant content, replace one word or short phrase in a line with the exact token [[BLANK]] and return the removed content in blankAnswer.
Use at most one blank per line and blanks in roughly one third of the lines.
Blank focus: ${input.blankFocus || 'Important vocabulary and language structures appropriate to the learners'}.
For lines without a blank, return null for blankAnswer.`
      : `Create a complete dialogue without gaps. Do not use [[BLANK]] and always return null for blankAnswer.`;
    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.55,
      prompt: `Create a short educational dialogue exercise.

Topic: ${input.topic}

Speakers:
${speakerPrompt}

Worksheet context:
${worksheetContextPrompt(context, [
  input.topic,
  input.blankFocus,
  speakerPrompt,
].join(' '))}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Write a coherent, natural dialogue in the requested content language.
Use every speaker and keep each speaker consistent with their role and demeanor.
Choose an appropriate length between 6 and 16 lines.
Match vocabulary, sentence length, register, spelling, and cultural context to the learners.
${spellingInstruction}

${blankInstruction}
The speaker number is the one-based number from the speaker list.`,
    });

    const usedSpeakers = new Set<number>();
    let blankCount = 0;
    const lines = output.lines.map((line) => {
      if (line.speaker > input.speakers.length) {
        throw new Error('The model returned an unknown speaker.');
      }
      usedSpeakers.add(line.speaker);
      const sourceText = normalizeLocaleSpelling(line.text, contentLanguage);
      const answer = normalizeLocaleSpelling(
        line.blankAnswer?.trim() ?? '',
        contentLanguage,
      );
      const validAnswer = /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u
        .test(answer)
        ? answer
        : '';
      if (validAnswer && sourceText.includes('[[BLANK]]')) blankCount += 1;
      const blankWidth = Math.min(
        5,
        Math.max(1, Math.ceil(Array.from(validAnswer).length / 8)),
      );
      const text = input.includeBlanks
        && validAnswer
        && sourceText.includes('[[BLANK]]')
        ? sourceText.replace(
          '[[BLANK]]',
          `{{blank:${validAnswer}|${blankWidth}}}`,
        )
        : sourceText.replaceAll('[[BLANK]]', answer);
      return { speaker: line.speaker, text };
    });
    if (usedSpeakers.size !== input.speakers.length) {
      throw new Error('The model did not use every speaker. Please generate again.');
    }
    if (input.includeBlanks && blankCount === 0) {
      throw new Error('The model did not create any dialogue blanks. Please generate again.');
    }

    return Response.json({
      items: lines,
      speakerNames: input.speakers.map(({ name }) => name),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the topic and complete every speaker name and role.'
      : error instanceof Error
        ? error.message
        : 'Dialogue generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
