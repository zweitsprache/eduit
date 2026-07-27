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
import { RICH_TEXT_TYPES } from '@/lib/rich-text-types';
import { validateWorksheetPatch } from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  topic: z.string().trim().min(1).max(300),
  textType: z.string().trim().refine(
    (value) => RICH_TEXT_TYPES.includes(
      value as (typeof RICH_TEXT_TYPES)[number],
    ),
    'Unknown text type.',
  ),
  context: z.unknown(),
});

const blockSchema = z.object({
  type: z.enum([
    'heading2',
    'heading3',
    'paragraph',
    'unordered-list',
    'ordered-list',
  ]),
  text: z.string().trim().max(2_000).nullable(),
  items: z.array(z.string().trim().min(1).max(500)).max(20),
});

const resultSchema = z.object({
  blocks: z.array(blockSchema).min(1).max(30),
});

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textHtml(value: string, contentLanguage: string) {
  return escapeHtml(normalizeLocaleSpelling(value, contentLanguage))
    .replace(/\r?\n/g, '<br>');
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

    const { output } = await generateText({
      model: educationalContentModel,
      output: Output.object({ schema: resultSchema }),
      temperature: 0.55,
      system: `You write authentic educational source texts for second-language
teaching. The configured language proficiency is a mandatory maximum
difficulty. The requested text type and its real-world conventions are
mandatory, not suggestions.`,
      prompt: `Create an authentic learner-facing text.

Topic or draft title: ${input.topic}
Textsorte: ${input.textType}

Worksheet context:
${worksheetContextPrompt(context)}

Mandatory language proficiency:
${languageProficiencyInstruction(context?.languageLevel ?? '')}

Didactic and editorial requirements:
- Produce the text itself only. Do not explain the task, text type, vocabulary,
  grammar, or teaching objective.
- Follow the authentic structure, register, tone, layout, and communicative
  purpose of the selected Textsorte.
- Treat the topic as content guidance; improve a draft-like title when needed.
- Use realistic names, dates, places, details, and formatting appropriate to
  the learner context without inventing sensitive claims about real people.
- Make the text coherent and information-rich enough for later comprehension
  activities.
- Keep vocabulary, syntax, sentence length, and implied knowledge within the
  configured proficiency level.
- Choose a sensible length for the text type and proficiency. Prefer concise
  authenticity over unnecessary length.
- Use heading blocks only when the text type conventionally needs headings.
- Use list blocks only when lists are natural for the text type.
- For letters, messages, and email, preserve salutation, body paragraphs, and
  closing as separate paragraph blocks.
- For forms, instructions, menus, schedules, checklists, and advertisements,
  reflect their recognizable real-world information structure.

Block contract:
- heading2 and heading3 require text and an empty items array.
- paragraph requires text and an empty items array.
- unordered-list and ordered-list require null text and one or more items.
- Preserve intentional line breaks within a paragraph's text.

Use the requested content language.
${localeSpellingInstruction(contentLanguage)}`,
    });

    const html = output.blocks.map((block) => {
      if (block.type === 'heading2' || block.type === 'heading3') {
        if (!block.text || block.items.length) {
          throw new Error('The model returned an invalid heading block.');
        }
        const tag = block.type === 'heading2' ? 'h2' : 'h3';
        return `<${tag}>${textHtml(block.text, contentLanguage)}</${tag}>`;
      }
      if (block.type === 'paragraph') {
        if (!block.text || block.items.length) {
          throw new Error('The model returned an invalid paragraph block.');
        }
        return `<p>${textHtml(block.text, contentLanguage)}</p>`;
      }
      if (block.text || !block.items.length) {
        throw new Error('The model returned an invalid list block.');
      }
      const tag = block.type === 'ordered-list' ? 'ol' : 'ul';
      const items = block.items.map(
        (item) => `<li>${textHtml(item, contentLanguage)}</li>`,
      ).join('');
      return `<${tag}>${items}</${tag}>`;
    }).join('');

    return Response.json({ html });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? 'Check the topic and Textsorte.'
      : error instanceof Error
        ? error.message
        : 'Rich Text generation failed.';
    return Response.json({ error: message }, { status: 400 });
  }
}
