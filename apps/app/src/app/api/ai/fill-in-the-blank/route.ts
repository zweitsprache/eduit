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
  sentenceCount: z.number().int().min(1).max(15).nullable(),
  blanksPerSentence: z.number().int().min(1).max(3).nullable(),
  textStructure: z.enum([
    'continuous-text',
    'connected-sentences',
    'independent-sentences',
  ]),
  blankFocus: z.string().trim().max(300),
  context: z.unknown(),
});

const resultSchema = z.object({
  sentences: z.array(z.object({
    text: z.string().trim().min(1).max(800),
    answers: z.array(z.string().trim().min(1).max(100)).min(1).max(3),
  })).min(1).max(15),
});

function placeholderNumbers(text: string) {
  return [...text.matchAll(/\[\[BLANK_(\d+)\]\]/g)]
    .map((match) => Number(match[1]));
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return Response.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const input = requestSchema.parse(await request.json());
    const context = validateWorksheetPatch({ context: input.context }).context;
    const contentLanguage = context?.contentLanguage ?? '';
    const sentenceCountInstruction = input.sentenceCount === null
      ? 'Choose a sensible total between 4 and 10 sentences for the learner level and topic.'
      : `Return exactly ${input.sentenceCount} separate sentences.`;
    const blankCountInstruction = input.blanksPerSentence === null
      ? 'Choose one or two blanks per sentence. Use fewer blanks for lower proficiency levels.'
      : `MANDATORY: Use exactly ${input.blanksPerSentence} ${
        input.blanksPerSentence === 1 ? 'blank' : 'blanks'
      } in every sentence—not fewer and not more.`;
    const structureInstruction = {
      'continuous-text': `Write one coherent multi-sentence text. Each returned
sentence must continue the same text, with consistent people, situation, time,
and register. Do not restart the context between sentences.`,
      'connected-sentences': `Write separate sentences that form a connected
sequence. The sentences must share a clear situation or line of thought, but
each sentence must remain understandable as a separate exercise row.`,
      'independent-sentences': `Write independent standalone sentences. They may
share the topic, but must not rely on people, facts, or context introduced in
another sentence.`,
    }[input.textStructure];

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.45,
      system: `You create educational fill-in-the-blank activities.
The configured language proficiency is a mandatory maximum difficulty.
Every blank must have one clear, contextually supported answer.
Follow the numbered placeholder contract exactly.`,
      prompt: `Create a fill-in-the-blank activity.

Topic: ${input.topic}
${sentenceCountInstruction}
${blankCountInstruction}
Text structure:
${structureInstruction}
Blank focus: ${input.blankFocus || 'Important vocabulary or language structures appropriate to the learners'}

Worksheet context:
${worksheetContextPrompt(context)}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Didactic purpose:
This activity trains contextual language comprehension, active recall, and the accurate use of vocabulary or language structures in meaningful sentences.

General learning objective:
The learner can use sentence meaning and grammatical context to identify and supply one unambiguous missing word or short phrase.

Generation principles:
- Write natural, meaningful, self-contained sentences rather than disconnected answer clues.
- Make every missing answer explicit enough to infer from context and appropriate to the requested blank focus.
- Ensure each completed sentence is grammatically correct and natural.
- Avoid blanks with several equally plausible answers.
- Do not blank obscure details, names, or arbitrary words unless requested by the blank focus.
- Do not place two blanks next to each other.
- Keep enough surrounding context for the learner to solve each blank.
- Vary sentence structure without exceeding the configured proficiency.

Placeholder contract:
- Return every sentence as its own object, even for one continuous text.
- The text field of each object must contain exactly one sentence.
- In each sentence, replace the first answer with [[BLANK_1]], the second with [[BLANK_2]], and the third with [[BLANK_3]].
- Use each required placeholder exactly once and in numerical order.
- Return answers in the same numerical order as the placeholders.
- Do not include placeholders inside answers.
- Each item is one sentence and one matching answer set.

Use the requested content language.
${localeSpellingInstruction(contentLanguage)}`,
    });

    if (
      input.sentenceCount !== null
        ? output.sentences.length !== input.sentenceCount
        : output.sentences.length < 4 || output.sentences.length > 10
    ) {
      throw new Error('The model returned an unexpected number of sentences.');
    }

    const sentences = output.sentences.map((sentence) => {
      const text = normalizeLocaleSpelling(sentence.text, contentLanguage);
      const answers = sentence.answers.map((answer) => (
        normalizeLocaleSpelling(answer, contentLanguage)
      ));
      const placeholders = placeholderNumbers(text);
      const expectedBlankCount = input.blanksPerSentence ?? answers.length;
      if (
        answers.length !== expectedBlankCount
        || placeholders.length !== expectedBlankCount
        || placeholders.some((number, index) => number !== index + 1)
      ) {
        throw new Error('The model returned an invalid blank structure.');
      }

      return answers.reduce((result, answer, index) => {
        if (
          /[{}|]/.test(answer)
          || !/^[\p{L}\p{M}\p{N}]+(?:[ '\u2019-][\p{L}\p{M}\p{N}]+)*$/u
            .test(answer)
        ) {
          throw new Error('The model returned an invalid blank answer.');
        }
        return result.replace(
          `[[BLANK_${index + 1}]]`,
          `{{blank:${answer}}}`,
        );
      }, text);
    });

    return Response.json({
      text: sentences.join(
        input.textStructure === 'continuous-text' ? ' ' : '\n',
      ),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the topic and blank settings.'
      : error instanceof Error
        ? error.message
        : 'Fill-in-the-blank generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
