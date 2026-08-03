import { z } from 'zod';
import { EMPTY_WORKSHEET_CONTEXT, type WorksheetPatch } from '@/lib/worksheet-types';

const headingSchema = z.object({
  type: z.literal('heading'),
  text: z.string().trim().min(1).max(500),
  level: z.number().int().min(1).max(5),
  numbered: z.boolean().default(false),
  gapAfter: z.number().int().min(1).max(3).default(1),
});

const glossaryEntrySchema = z.object({
  term: z.string().trim().min(1).max(500),
  definition: z.string().trim().max(2000),
  example: z.string().trim().max(3000).optional(),
});

const glossarySchema = z.object({
  type: z.literal('glossary'),
  preset: z.enum(['default', 'verbs', 'nouns', 'adjectives']).default('default'),
  showInstruction: z.boolean().default(false),
  instruction: z.string().trim().max(1000).nullable().optional(),
  termWidth: z.enum(['10', '15', '20', '25', '33', '50', '66']).or(
    z.number().int().refine((value) => [10, 15, 20, 25, 33, 50, 66].includes(value)),
  ).optional(),
  definitionWidth: z.enum(['10', '15', '20', '25', '33', '50', '66']).or(
    z.number().int().refine((value) => [10, 15, 20, 25, 33, 50, 66].includes(value)),
  ).optional(),
  entries: z.array(glossaryEntrySchema).min(1).max(500),
});

const contextSchema = z.object({
  worksheetLanguage: z.enum(['en', 'de-formal', 'de-informal']).default('en'),
  sourceProfileId: z.string().max(100).nullable().default(null),
  subject: z.string().max(100).default(''),
  customSubject: z.string().max(150).default(''),
  learnerStage: z.string().max(100).default(''),
  ageMin: z.number().int().min(0).max(120).nullable().default(null),
  ageMax: z.number().int().min(0).max(120).nullable().default(null),
  contentLanguage: z.string().max(100).default(''),
  country: z.string().max(100).default(''),
  localLevel: z.string().max(150).default(''),
  curriculum: z.string().max(250).default(''),
  languageLevel: z.string().max(100).default(''),
  learnerContext: z.string().max(1000).default(''),
  contextPdfName: z.string().max(250).default(''),
  contextPdfText: z.string().max(1_000_000).default(''),
  contextPdfPageCount: z.number().int().positive().nullable().default(null),
}).partial();

export const generatedWorksheetSchema = z.object({
  title: z.string().trim().min(1).max(200),
  documentSize: z.enum(['a4-portrait', 'a4-landscape', 'letter-portrait', 'letter-landscape']).default('a4-portrait'),
  showSolutions: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  brandProfileId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  context: contextSchema.default({}),
  blocks: z.array(z.discriminatedUnion('type', [headingSchema, glossarySchema])).min(1).max(1000),
});

const escapeAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function blockHtml(block: z.infer<typeof generatedWorksheetSchema>['blocks'][number]) {
  if (block.type === 'heading') {
    return `<div data-heading-text="${escapeAttribute(block.text)}" data-heading-level="${block.level}" data-heading-numbered="${block.numbered}" data-heading-gap-after="${block.gapAfter}" data-type="custom-heading"></div>`;
  }
  const widths = block.preset === 'verbs'
    ? { term: 20, definition: 25 }
    : block.preset === 'nouns' || block.preset === 'adjectives'
      ? { term: 50, definition: 50 }
      : { term: Number(block.termWidth ?? 33), definition: Number(block.definitionWidth ?? 33) };
  const terms = block.entries.map((entry, index) => ({
    id: `term-${index + 1}`,
    term: entry.term,
    definition: entry.definition,
    example: entry.example ?? '',
  }));
  const instruction = block.instruction
    ? ` data-block-instruction="${escapeAttribute(block.instruction)}"`
    : '';
  return `<div data-glossary-terms="${escapeAttribute(encodeURIComponent(JSON.stringify(terms)))}" data-glossary-term-width="${widths.term}" data-glossary-definition-width="${widths.definition}" data-glossary-preset="${block.preset}" data-glossary-show-instruction="${block.showInstruction}"${instruction} data-type="glossary-terms"></div>`;
}

export function worksheetPatchFromGeneratedJson(
  value: unknown,
  fallbackBrandProfileId?: string | null,
): WorksheetPatch {
  const input = generatedWorksheetSchema.parse(value);
  return {
    title: input.title,
    contentHtml: input.blocks.map(blockHtml).join(''),
    documentSize: input.documentSize,
    showSolutions: input.showSolutions,
    status: input.status,
    brandProfileId: input.brandProfileId === undefined
      ? fallbackBrandProfileId
      : input.brandProfileId,
    folderId: input.folderId ?? null,
    context: { ...EMPTY_WORKSHEET_CONTEXT, ...input.context },
  };
}
