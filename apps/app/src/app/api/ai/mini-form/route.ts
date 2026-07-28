import { generateText, Output } from 'ai';
import { z } from 'zod';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import {
  educationalContentModel,
  miniFormContentModel,
} from '@/lib/ai';
import {
  languageProficiencyInstruction,
  localeSpellingInstruction,
  normalizeLocaleSpelling,
  worksheetContextPrompt,
} from '@/lib/ai-generation';
import { validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const fieldSchema = z.object({
  label: z.string().trim().min(1).max(100),
  guidance: z.string().trim().max(240),
});

const requestSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  itemCount: z.number().int().min(1).max(12).nullable(),
  textType: z.enum([
    'narrative',
    'direct-formal',
    'direct-informal',
    'messenger-message',
    'email',
  ]),
  fields: z.array(fieldSchema).min(1).max(8),
  context: z.unknown(),
});

const resultSchema = z.object({
  items: z.array(z.object({
    textType: z.enum([
      'narrative',
      'direct-formal',
      'direct-informal',
      'messenger-message',
      'email',
    ]),
    caseCount: z.literal(1),
    prompt: z.string().trim().min(1).max(1500),
    answers: z.array(z.object({
      fieldNumber: z.number().int().min(1).max(8),
      value: z.string().trim().max(300),
    })).min(1).max(8),
  })).min(1).max(12),
});

function isModelAccessError(error: unknown) {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    if ((error as { statusCode?: unknown }).statusCode === 403) return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /free tier|paid credits|restricted model|no providers available/i
    .test(message);
}

async function generateMiniFormOutput(prompt: string, system: string) {
  const settings = {
    output: Output.object({ schema: resultSchema }),
    system,
    temperature: 0.55,
    prompt,
  } as const;
  try {
    return await generateText({
      model: miniFormContentModel,
      ...settings,
    });
  } catch (error) {
    if (!isModelAccessError(error)) throw error;
    return generateText({
      model: educationalContentModel,
      ...settings,
    });
  }
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
    const countInstruction = input.itemCount === null
      ? 'Choose a sensible total number of mini-form items between 3 and 8 based on learner level and task complexity.'
      : `Return exactly ${input.itemCount} mini-form items in total. This is the number of separate texts, not the number of people or information sets inside a text.`;
    const fields = input.fields.map((field, index) => (
      `${index + 1}. ${field.label}${
        field.guidance ? ` — ${field.guidance}` : ''
      }`
    )).join('\n');
    const textTypeInstruction = {
      narrative: `ERZÄHLTEXT / NARRATIVE:
- Write about a named person or situation in the third person.
- Present the relevant details as a natural short narrative.
- Do not address the learner directly.
- In German, do not use du or Sie to address the reader.
Example pattern: «Frau Keller möchte sich für einen Kurs anmelden. Sie …»`,
      'direct-formal': `DIREKTE FORMELLE ANSPRACHE / DIRECT FORMAL ADDRESS:
- Address the learner directly and assign them the scenario and details.
- In German, use Sie, Ihnen, Ihr and Ihre consistently.
- Never address the learner as du, dir, dich, dein or deine.
Example pattern: «Sie möchten sich für einen Kurs anmelden. Sie heissen … Tragen Sie … ein.»`,
      'direct-informal': `DIREKTE INFORMELLE ANSPRACHE / DIRECT INFORMAL ADDRESS:
- Address the learner directly and assign them the scenario and details.
- In German, use du, dir, dich, dein and deine consistently.
- Never address the learner with the formal Sie form.
Example pattern: «Du möchtest dich für einen Kurs anmelden. Du heisst … Trage … ein.»`,
      'messenger-message': `MESSENGER MESSAGE:
- Write the source prompt as a realistic short message sent through a messenger app.
- Use concise, natural message language and short paragraphs.
- Make the sender and recipient relationship clear through the wording.
- Do not format the text as an email or narrative.
- Use emojis only sparingly and only when appropriate for the learner context.
Example pattern: «Hoi Sara, ich habe uns für den Kurs am … angemeldet. Kannst du …?»`,
      email: `E-MAIL:
- Write the source prompt as a realistic email.
- Include a meaningful subject line, an appropriate greeting, a coherent message body, and a sign-off with the sender's name.
- Format the email in this exact order: subject line, salutation, message body, closing greeting, sender name.
- Insert a blank line between the subject line, salutation, message body, and closing greeting.
- Use newline characters in the prompt so each email section renders on separate lines.
- Choose a formal or informal register that fits the scenario and keep it consistent.
- Do not format the text as a messenger chat or narrative.
Example layout:
Betreff: Kursanmeldung

Guten Tag …

…

Freundliche Grüsse
…`,
    }[input.textType];

    const system = `You create educational selective-reading mini-form activities.
The requested Textsorte is a mandatory format constraint, not a suggestion.
The configured language proficiency is a mandatory maximum difficulty.
Apply it consistently to every generated source prompt.
Never silently substitute another text type.
Never use vocabulary or sentence structures above the configured proficiency.
Treat each output item as exactly one text about one case or person with one answer set.
Never place multiple cases or answer sets into one item.
Return the requested textType value unchanged for every item.`;
    const prompt = `Create content for an educational mini-form exercise.

Topic or scenario: ${input.topic}
${countInstruction}

MANDATORY TEXT TYPE:
Requested textType value: ${input.textType}
${textTypeInstruction}

MANDATORY LANGUAGE PROFICIENCY:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Shared form fields, in required output order:
${fields}

Worksheet context:
${worksheetContextPrompt(context, [
  input.topic,
  input.textType,
  fields,
].join(' '))}

Didactic purpose:
This activity trains functional reading comprehension, selective reading, and the transfer of information from continuous text or direct instructions into a structured form.
Learners practise identifying relevant details, distinguishing them from supporting information, and entering them accurately into the corresponding fields.

General learning objective:
The learner can locate explicitly stated information in a realistic text, associate each detail with the correct form field, and reproduce it accurately without changing its meaning.

Mandatory item structure:
- One mini-form item equals exactly one source text, one independent case or person, and one answer set.
- Set caseCount to 1 for every item.
- Never combine multiple people, registrations, cases, records, messages, or answer sets in one source text.
- The requested mini-form count is the total number of separate items to return.
- Each item's answers must refer only to the single case described in that item's prompt.

Generation principles:
- Create a natural, realistic source text rather than a disguised list of answers.
- Give every field one clear and unambiguous answer.
- Make every answer explicitly stated or directly recoverable from the text.
- Do not require outside knowledge or unsupported assumptions.
- Include a small amount of context or non-essential information when appropriate for the learner level, so the activity requires selective reading.
- Adjust sentence length, information density, vocabulary, and degree of paraphrasing to the specified learner stage and language proficiency.
- For beginning learners, keep clues close to the wording of the field labels.
- For more advanced learners, use appropriate paraphrasing while keeping each answer unambiguous.
- Ensure that generated answer values exactly match the information presented in the source text.

For each item, write one distinct, realistic source prompt containing enough information for a learner to complete every shared field.
Every item must return textType: "${input.textType}".
Return exactly one answer object for every shared field.
Use fieldNumber 1 for the first field, fieldNumber 2 for the second field, and so on.
Every answers array must contain exactly ${input.fields.length} entries with each fieldNumber from 1 to ${input.fields.length} appearing exactly once.
Vary names, details, and situations appropriately while remaining culturally respectful and internally consistent.
Match vocabulary, prompt length, register, and difficulty to the learner context.
Do not add information to values that cannot be inferred directly from the source prompt.
${localeSpellingInstruction(contentLanguage)}`;
    const { output } = await generateMiniFormOutput(prompt, system);

    const expectedCount = input.itemCount;
    if (
      expectedCount !== null
        ? output.items.length !== expectedCount
        : output.items.length < 3 || output.items.length > 8
    ) {
      throw new Error('The model returned an unexpected number of mini-forms.');
    }
    if (output.items.some(({ answers }) => (
      answers.length !== input.fields.length
      || new Set(answers.map(({ fieldNumber }) => fieldNumber)).size
        !== input.fields.length
      || answers.some(({ fieldNumber }) => (
        fieldNumber < 1 || fieldNumber > input.fields.length
      ))
    ))) {
      throw new Error('The model did not provide an answer for every field.');
    }
    if (output.items.some(({ textType }) => textType !== input.textType)) {
      throw new Error('The model did not follow the selected Textsorte.');
    }

    return Response.json({
      items: output.items.map((item) => ({
        prompt: normalizeLocaleSpelling(item.prompt, contentLanguage),
        values: [...item.answers]
          .sort((left, right) => left.fieldNumber - right.fieldNumber)
          .map(({ value }) => normalizeLocaleSpelling(
            value,
            contentLanguage,
          )),
      })),
    });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the topic and field definitions.'
      : error instanceof Error
        ? error.message
        : 'Mini-form generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
