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

const fillInTheBlankSchema = z.object({
  type: z.literal('fillInTheBlank'),
  instruction: z.string().trim().min(1).max(1000),
  title: z.string().trim().max(500).default(''),
  items: z.array(z.string().trim().min(1).max(5000)).min(1).max(500),
  distractors: z.array(z.string().trim().min(1).max(500)).max(500).default([]),
  widthFactor: z.number().min(1).max(5).default(1),
  hideBlankNumbers: z.boolean().default(false),
  hideItemNumbers: z.boolean().default(false),
  showLineNumbers: z.boolean().default(false),
  showWordBank: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
});

const pageBreakSchema = z.object({
  type: z.literal('pageBreak'),
  restartPagination: z.boolean().default(false),
});

const dialogueSchema = z.object({
  type: z.literal('dialogue'),
  instruction: z.string().trim().min(1).max(1000),
  context: z.string().trim().max(2000).default(''),
  speakerNames: z.object({
    1: z.string().trim().max(100).default('Speaker 1'),
    2: z.string().trim().max(100).default('Speaker 2'),
    3: z.string().trim().max(100).default('Speaker 3'),
    4: z.string().trim().max(100).default('Speaker 4'),
  }),
  showSpeakerNames: z.boolean().default(false),
  showOriginal: z.boolean().default(false),
  showWordBank: z.boolean().default(false),
  hideBlankNumbers: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
  items: z.array(z.object({
    speaker: z.number().int().min(1).max(4),
    text: z.string().trim().min(1).max(5000),
  })).min(2).max(500),
});

const mcqOptionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(1000),
  correct: z.boolean().default(false),
});

const mcqQuestionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  question: z.string().trim().min(1).max(2000),
  options: z.array(mcqOptionSchema).min(2).max(10),
  answerMode: z.enum(['single', 'multiple']).default('single'),
});

const mcqSchema = z.object({
  type: z.literal('mcq'),
  instruction: z.string().trim().max(1000).default('Choose the correct answer.'),
  blockQuestion: z.string().trim().max(2000).default(''),
  questions: z.array(mcqQuestionSchema).min(1).max(50),
  columns: z.number().int().min(1).max(3).default(1),
  shuffleAnswers: z.boolean().default(false),
  showInstruction: z.boolean().default(true),
});

const trueFalseRowSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(2000),
  correctValue: z.enum(['true', 'false', 'na']).nullable().default(null),
});

const trueFalseSchema = z.object({
  type: z.literal('trueFalse'),
  instruction: z.string().trim().max(1000).default('Mark each statement as true or false.'),
  question: z.string().trim().max(2000).default(''),
  trueLabel: z.string().trim().max(100).default('True'),
  falseLabel: z.string().trim().max(100).default('False'),
  showNa: z.boolean().default(false),
  naLabel: z.string().trim().max(100).default('N/A'),
  rows: z.array(trueFalseRowSchema).min(1).max(100),
  showFirstAsExample: z.boolean().default(false),
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
  blocks: z.array(z.discriminatedUnion('type', [
    headingSchema,
    glossarySchema,
    fillInTheBlankSchema,
    pageBreakSchema,
    dialogueSchema,
    mcqSchema,
    trueFalseSchema,
  ])).min(1).max(1000),
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
  if (block.type === 'pageBreak') {
    return `<div data-restart-pagination="${block.restartPagination}" data-type="pageBreak"></div>`;
  }
  if (block.type === 'fillInTheBlank') {
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-fill-blank-title="${escapeAttribute(block.title)}" data-fill-blank-text="${escapeAttribute(block.items.join('\n'))}" data-fill-blank-distractors="${escapeAttribute(JSON.stringify(block.distractors))}" data-fill-blank-width-factor="${block.widthFactor}" data-fill-blank-hide-numbers="${block.hideBlankNumbers}" data-fill-blank-hide-item-numbers="${block.hideItemNumbers}" data-fill-blank-show-line-numbers="${block.showLineNumbers}" data-fill-blank-show-word-bank="${block.showWordBank}" data-fill-blank-show-first-example="${block.showFirstAsExample}" data-type="fill-in-the-blank"></div>`;
  }
  if (block.type === 'dialogue') {
    const items = block.items.map((item, index) => ({
      id: `dialogue-${index + 1}`,
      speaker: item.speaker,
      text: item.text,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-dialogue-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-dialogue-speaker-names="${escapeAttribute(encodeURIComponent(JSON.stringify(block.speakerNames)))}" data-dialogue-show-speaker-names="${block.showSpeakerNames}" data-dialogue-show-original="${block.showOriginal}" data-dialogue-show-word-bank="${block.showWordBank}" data-dialogue-hide-blank-numbers="${block.hideBlankNumbers}" data-dialogue-show-first-example="${block.showFirstAsExample}" data-dialogue-context="${escapeAttribute(encodeURIComponent(block.context))}" data-type="dialogue"></div>`;
  }
  if (block.type === 'mcq') {
    const questions = block.questions.map((question, index) => ({
      id: question.id ?? `mcq-question-${index + 1}`,
      question: question.question,
      options: question.options.map((option, optionIndex) => ({
        id: option.id ?? `option-${String.fromCharCode(65 + optionIndex)}`,
        text: option.text,
        correct: option.correct,
      })),
      answerMode: question.answerMode,
    }));
    return `<div data-mcq-instruction="${escapeAttribute(block.instruction)}" data-mcq-block-question="${escapeAttribute(encodeURIComponent(block.blockQuestion))}" data-mcq-questions="${escapeAttribute(encodeURIComponent(JSON.stringify(questions)))}" data-mcq-columns="${block.columns}" data-mcq-shuffle-answers="${block.shuffleAnswers}" data-mcq-show-instruction="${block.showInstruction}" data-type="mcq"></div>`;
  }
  if (block.type === 'trueFalse') {
    const rows = block.rows.map((row, index) => ({
      id: row.id ?? `row-${index + 1}`,
      text: row.text,
      correctValue: row.correctValue,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-true-false-question="${escapeAttribute(block.question)}" data-true-label="${escapeAttribute(block.trueLabel)}" data-false-label="${escapeAttribute(block.falseLabel)}" data-show-na="${block.showNa}" data-na-label="${escapeAttribute(block.naLabel)}" data-true-false-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(rows)))}" data-true-false-show-first-example="${block.showFirstAsExample}" data-type="true-false"></div>`;
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
