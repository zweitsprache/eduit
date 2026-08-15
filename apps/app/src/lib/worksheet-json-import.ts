import { z } from 'zod';
import { EMPTY_WORKSHEET_CONTEXT, type WorksheetPatch } from './worksheet-types';

const headingSchema = z.object({
  type: z.literal('heading'),
  text: z.string().trim().min(1).max(500),
  level: z.number().int().min(1).max(5),
  numbered: z.boolean().default(false),
  gapAfter: z.number().int().min(1).max(3).default(1),
  restartInstructionNumbering: z.boolean().default(true),
});

const glossaryEntrySchema = z.object({
  term: z.string().trim().min(1).max(500),
  definition: z.string().trim().max(2000),
  additional: z.string().trim().max(3000).optional(),
  example: z.string().trim().max(3000).optional(),
});

const glossarySchema = z.object({
  type: z.literal('glossary'),
  preset: z.enum(['default', 'verbs', 'nouns', 'adjectives']).default('default'),
  showInstruction: z.boolean().default(false),
  showColumnHeaders: z.boolean().default(true),
  showExample: z.boolean().default(true),
  showAdditionalColumn: z.boolean().default(false),
  instruction: z.string().trim().max(1000).nullable().optional(),
  headerLabels: z.array(z.string().trim().max(200)).max(4).default([]),
  termWidth: z.enum(['10', '15', '20', '25', '33', '50', '66']).or(
    z.number().int().refine((value) => [10, 15, 20, 25, 33, 50, 66].includes(value)),
  ).optional(),
  definitionWidth: z.enum(['10', '15', '20', '25', '33', '50', '66']).or(
    z.number().int().refine((value) => [10, 15, 20, 25, 33, 50, 66].includes(value)),
  ).optional(),
  additionalWidth: z.enum(['10', '15', '20', '25', '33', '50', '66']).or(
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
  widthFactor: z.number().min(0.25).max(5).default(1),
  hideBlankNumbers: z.boolean().default(false),
  hideItemNumbers: z.boolean().default(false),
  showLineNumbers: z.boolean().default(false),
  showWordBank: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
});

const richTextSchema = z.object({
  type: z.literal('richText'),
  html: z.string().min(1).max(100_000),
  bypassGap: z.boolean().default(false),
});

const pageBreakSchema = z.object({
  type: z.literal('pageBreak'),
  restartPagination: z.boolean().default(false),
});

const worksheetTableColumnSchema = z.object({
  id: z.string().trim().min(1).max(100),
  label: z.string().max(500).default(''),
  span: z.number().min(0.5).max(24),
  align: z.enum(['left', 'center', 'right']).default('left'),
  useTabularNums: z.boolean().default(false),
});

const worksheetTableRowSchema = z.object({
  id: z.string().trim().min(1).max(100),
  isHeader: z.boolean().default(false),
  cells: z.record(z.string(), z.string().max(5000)),
});

const worksheetTableSchema = z.object({
  type: z.literal('worksheetTable'),
  instruction: z.string().max(1000).default('Complete the table.'),
  showInstruction: z.boolean().default(true),
  columns: z.array(worksheetTableColumnSchema).min(1).max(6),
  rows: z.array(worksheetTableRowSchema).min(1).max(1000),
  showHeader: z.boolean().default(false),
  hideBlankNumbers: z.boolean().default(false),
  blankWidthFactor: z.number().min(1).max(5).default(1),
  showFirstAsExample: z.boolean().default(false),
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
  showInstruction: z.boolean().default(true),
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

const mcmOptionSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(1000),
  correct: z.boolean().default(false),
});

const mcmRowSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(2000),
  options: z.array(mcmOptionSchema).min(1).max(3),
});

const mcmSchema = z.object({
  type: z.literal('mcm'),
  instruction: z.string().trim().max(1000).default('Choose the correct answer for each row.'),
  question: z.string().trim().max(2000).default(''),
  rows: z.array(mcmRowSchema).min(1).max(100),
  showFirstAsExample: z.boolean().default(false),
  hideStatement: z.boolean().default(false),
});

const germanArticleSchema = z.enum(['der', 'das', 'die']);

const articlePluralRowSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  term: z.string().trim().max(2000),
  articles: z.array(germanArticleSchema).max(3).optional(),
  article: germanArticleSchema.nullable().optional(),
  plural: z.string().trim().max(2000).default(''),
}).transform(({ article, articles, ...row }) => ({
  ...row,
  articles: (['der', 'das', 'die'] as const).filter((option) => (
    articles?.includes(option) || article === option
  )),
}));

const articlePluralSchema = z.object({
  type: z.literal('articlePlural'),
  instruction: z.literal(
    'Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.',
  ).default('Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.'),
  rows: z.array(articlePluralRowSchema).min(1).max(1000),
  order: z.enum(['alphabetical', 'shuffle']).default('alphabetical'),
  shuffleSeed: z.number().int().min(0).max(1_000_000).default(0),
  continuation: z.boolean().default(false),
  rowNumberOffset: z.number().int().min(0).max(1_000_000).default(0),
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

// Mirrors CARDS_PER_GROUP in components/editor/communication-cards-node.tsx.
const COMMUNICATION_CARDS_PER_GROUP = 4;

const communicationCardSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  pairTitle: z.string().max(500).default(''),
  situation: z.string().max(5000).default(''),
  task: z.string().max(5000).default(''),
  intro: z.string().max(5000).default(''),
  listType: z.enum(['informationen', 'sprechhilfen']).default('informationen'),
  listItems: z.string().max(5000).default(''),
  content: z.string().max(5000).default(''),
});

const communicationCardsSchema = z.object({
  type: z.literal('communicationCards'),
  title: z.string().trim().max(200).default('Communication Cards'),
  format: z.literal('a4-landscape').default('a4-landscape'),
  sidedness: z.literal('single').default('single'),
  textSize: z.enum(['xs', 's', 'm', 'l', 'xl']).default('m'),
  items: z.array(communicationCardSchema).min(1).max(400),
});

// Mirrors CARDS_PER_GROUP in components/editor/learning-cards-node.tsx.
const LEARNING_CARDS_PER_GROUP = 9;

const learningCardSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  front: z.string().max(5000).default(''),
  back: z.string().max(5000).default(''),
});

const learningCardsSchema = z.object({
  type: z.literal('learningCards'),
  title: z.string().trim().max(200).default('Learning cards'),
  sidedness: z.enum(['single', 'double', 'single-solution']).default('double'),
  blankWidthFactor: z.number().min(0.25).max(5).default(1),
  frontTextSize: z.enum(['xs', 's', 'm', 'l', 'xl']).default('m'),
  backTextSize: z.enum(['xs', 's', 'm', 'l', 'xl']).default('m'),
  items: z.array(learningCardSchema).min(1).max(450),
});

const matchingPairSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  left: z.string().trim().min(1).max(2000),
  right: z.string().trim().min(1).max(2000),
});

const matchingPairsSchema = z.object({
  type: z.literal('matchingPairs'),
  instruction: z.string().trim().max(1000).default('Match the items on the left with the items on the right.'),
  question: z.string().trim().max(2000).default(''),
  pairs: z.array(matchingPairSchema).min(2).max(100),
  rightOrder: z.array(z.string().trim().min(1).max(100)).optional(),
  shuffleLeft: z.boolean().default(false),
  shuffleRight: z.boolean().default(false),
  shuffleSeed: z.number().int().min(0).default(0),
  showWordBank: z.boolean().default(false),
  shuffleWordBank: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
  answerStyle: z.enum(['checkboxes', 'writingLines']).default('checkboxes'),
});

const timeValueSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
});

const timeMatchingSchema = z.object({
  type: z.literal('timeMatching'),
  instruction: z.string().trim().max(1000).default('Verbinden Sie die passenden Uhrzeiten.'),
  leftRepresentation: z.enum(['analog', 'digital', 'official', 'informal']).default('analog'),
  rightRepresentation: z.enum(['analog', 'digital', 'official', 'informal']).default('digital'),
  times: z.array(timeValueSchema).min(2).max(100),
  rightOrder: z.array(z.string().trim().min(1).max(100)).optional(),
  allowedMinutes: z.array(z.number().int().min(0).max(59)).max(60).default([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]),
  rangeStart: z.string().regex(/^\d{2}:\d{2}$/).default('00:00'),
  rangeEnd: z.string().regex(/^\d{2}:\d{2}$/).default('23:59'),
  shuffleLeft: z.boolean().default(false),
  shuffleRight: z.boolean().default(true),
  showFirstAsExample: z.boolean().default(false),
  answerStyle: z.enum(['checkboxes', 'writingLines']).default('checkboxes'),
});

// Key order mirrors normalizeAttrs in components/editor/word-grid-node.tsx so the
// serialized attribute blob is identical to what the editor writes.
const wordGridDirectionsSchema = z.object({
  leftToRight: z.boolean().default(true),
  rightToLeft: z.boolean().default(false),
  topToBottom: z.boolean().default(true),
  bottomToTop: z.boolean().default(false),
  northWestToSouthEast: z.boolean().default(false),
  southWestToNorthEast: z.boolean().default(false),
  northEastToSouthWest: z.boolean().default(false),
  southEastToNorthWest: z.boolean().default(false),
});

const wordGridSchema = z.object({
  type: z.literal('wordGrid'),
  instruction: z.string().trim().max(1000).default('Find the words in the grid.'),
  columns: z.number().int().min(3).max(20).default(10),
  rows: z.number().int().min(3).max(20).default(10),
  rowHeight: z.number().min(0.5).max(2).default(1),
  showWordList: z.boolean().default(true),
  showFirstAsExample: z.boolean().default(false),
  // Spelled out because zod 4's .default() returns the value unparsed, so {} would
  // stay {} instead of picking up the per-field defaults.
  directions: wordGridDirectionsSchema.default({
    leftToRight: true,
    rightToLeft: false,
    topToBottom: true,
    bottomToTop: false,
    northWestToSouthEast: false,
    southWestToNorthEast: false,
    northEastToSouthWest: false,
    southEastToNorthWest: false,
  }),
  words: z.array(z.string().trim().min(1).max(100)).min(1).max(100),
  // Part of the layout seed: the same value reproduces the same grid.
  generation: z.number().int().min(0).max(1_000_000).default(0),
});

const wordBankSchema = z.object({
  type: z.literal('wordBank'),
  items: z.array(z.string().trim().min(1).max(500)).min(1).max(500),
});

const dominoPairSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  left: z.string().trim().min(1).max(2000),
  right: z.string().trim().min(1).max(2000),
});

const DOMINO_GRID_CELLS = 24;

const dominoTextSizeSchema = z.enum(['xs', 's', 'm', 'l', 'xl']).default('m');
const dominoRepresentationSchema = z.enum(['analog', 'digital', 'official', 'informal', 'text']).default('text');

const dominoSchema = z.object({
  type: z.literal('domino'),
  pairs: z.array(dominoPairSchema).min(1).max(500),
  showFirstAsExample: z.boolean().default(false),
  oddTextSize: dominoTextSizeSchema,
  evenTextSize: dominoTextSizeSchema,
  leftRepresentation: dominoRepresentationSchema,
  rightRepresentation: dominoRepresentationSchema,
});

const germanVerbTableFormsSchema = z.object({
  ich: z.string().trim().max(200).default(''),
  du: z.string().trim().max(200).default(''),
  formalSingular: z.string().trim().max(200).default(''),
  thirdSingular: z.string().trim().max(200).default(''),
  wir: z.string().trim().max(200).default(''),
  ihr: z.string().trim().max(200).default(''),
  formalPlural: z.string().trim().max(200).default(''),
  thirdPlural: z.string().trim().max(200).default(''),
  preteriteIch: z.string().trim().max(200).default(''),
});

const germanVerbTableMultipleVerbSchema = z.object({
  verb: z.string().trim().max(200).default(''),
  forms: germanVerbTableFormsSchema,
  separablePrefix: z.string().trim().max(80).default(''),
});

const germanVerbTableSchema = z.object({
  type: z.literal('germanVerbTable'),
  tableStyle: z.enum(['extended', 'compact', 'multiple']).default('extended'),
  tense: z.enum(['present', 'preterite']).default('present'),
  groupId: z.string().trim().max(120).default(''),
  groupIndex: z.number().int().min(0).default(0),
  groupSize: z.number().int().min(1).max(100).default(1),
  hideInfinitiveBadge: z.boolean().default(false),
  showInfinitiveHeading: z.boolean().default(false),
  infinitiveHeadingText: z.string().trim().max(200).default(''),
  leftVerb: z.string().trim().max(200).default('sein'),
  leftForms: germanVerbTableFormsSchema,
  leftAuxiliary: z.string().trim().max(100).default('sein'),
  leftParticiple: z.string().trim().max(200).default('gewesen'),
  comparisonAuxiliary: z.enum(['haben', 'sein']).default('haben'),
  separablePrefix: z.string().trim().max(80).default(''),
  rightVerb: z.string().trim().max(200).default('haben'),
  forms: germanVerbTableFormsSchema,
  rightAuxiliary: z.string().trim().max(100).default('haben'),
  rightParticiple: z.string().trim().max(200).default('gehabt'),
  multipleVerbCount: z.union([z.literal(4), z.literal(5)]).default(5),
  multipleBadgeStyle: z.enum(['light', 'dark']).default('light'),
  multipleVerbs: z.array(germanVerbTableMultipleVerbSchema).min(1).max(20),
});

const declinationTripletSchema = z.object({
  article: z.tuple([
    z.string().trim().max(200),
    z.string().trim().max(200),
    z.string().trim().max(200),
  ]),
  adjective: z.tuple([
    z.string().trim().max(200),
    z.string().trim().max(200),
    z.string().trim().max(200),
  ]),
  noun: z.tuple([
    z.string().trim().max(200),
    z.string().trim().max(200),
    z.string().trim().max(200),
  ]),
});

const declinationTableSchema = z.object({
  type: z.literal('declinationTable'),
  baseAdjectives: z.object({
    masculine: z.string().trim().min(1).max(200),
    feminine: z.string().trim().min(1).max(200),
    neuter: z.string().trim().min(1).max(200),
    plural: z.string().trim().min(1).max(200),
  }),
  baseNouns: z.object({
    masculine: z.string().trim().min(1).max(200),
    feminine: z.string().trim().min(1).max(200),
    neuter: z.string().trim().min(1).max(200),
    plural: z.string().trim().min(1).max(200),
  }),
  rows: z.array(z.object({
    key: z.enum(['nom', 'akk', 'dat', 'gen']),
    values: z.object({
      masculine: declinationTripletSchema,
      feminine: declinationTripletSchema,
      neuter: declinationTripletSchema,
      plural: declinationTripletSchema,
    }),
  })).length(4),
});

const contextSchema = z.object({
  worksheetLanguage: z.enum(['en', 'de-formal', 'de-informal']).default('de-formal'),
  worksheetType: z.enum([
    'worksheet',
    'fact-sheet',
    'verb-table',
    'declension-table',
    'learning-cards',
    'domino',
  ]).default('worksheet'),
  sourceProfileId: z.string().max(100).nullable().default(null),
  subject: z.string().max(100).default('daz'),
  customSubject: z.string().max(150).default(''),
  learnerStage: z.string().max(100).default('professional-training'),
  ageGroups: z.array(z.string().max(40)).max(8).default(['adults']),
  ageMin: z.number().int().min(0).max(120).nullable().default(null),
  ageMax: z.number().int().min(0).max(120).nullable().default(null),
  contentLanguage: z.string().max(100).default('de-CH'),
  translationLanguages: z.array(z.string().max(20)).max(20).default([]),
  country: z.string().max(100).default(''),
  localLevel: z.string().max(150).default(''),
  curriculum: z.string().max(250).default(''),
  languageLevel: z.string().max(100).default(''),
  actionField: z.string().max(100).default(''),
  actionCompetencies: z.array(z.string().max(80)).max(10).default([]),
  languageCompetencies: z.array(z.string().max(80)).max(10).default([]),
  learnerContext: z.string().max(1000).default(''),
  contextPdfName: z.string().max(250).default(''),
  contextPdfText: z.string().max(1_000_000).default(''),
  contextPdfPageCount: z.number().int().positive().nullable().default(null),
}).partial();

export const generatedWorksheetSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  documentSize: z.enum(['a4-portrait', 'a4-landscape', 'a5-landscape', 'letter-portrait', 'letter-landscape']).default('a4-portrait'),
  showSolutions: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  brandProfileId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  sourceWorksheetId: z.string().uuid().nullable().optional(),
  context: contextSchema.default({}),
  blocks: z.array(z.discriminatedUnion('type', [
    headingSchema,
    glossarySchema,
    fillInTheBlankSchema,
    pageBreakSchema,
    dialogueSchema,
    mcqSchema,
    mcmSchema,
    articlePluralSchema,
    trueFalseSchema,
    matchingPairsSchema,
    timeMatchingSchema,
    communicationCardsSchema,
    learningCardsSchema,
    richTextSchema,
    wordGridSchema,
    wordBankSchema,
    dominoSchema,
    germanVerbTableSchema,
    declinationTableSchema,
    worksheetTableSchema,
  ])).max(1000).default([]),
}).refine((value) => Boolean(value.sourceWorksheetId) || value.blocks.length >= 1, {
  message: 'Provide blocks or a sourceWorksheetId.',
  path: ['blocks'],
}).refine((value) => {
  // The learningCards node rejects any transaction that mixes it with other blocks,
  // so such a document could not be opened in the editor at all.
  const cards = value.blocks.filter((block) => block.type === 'learningCards').length;
  return cards === 0 || (cards === 1 && value.blocks.length === 1);
}, {
  message: 'A learningCards block must be the only block of its worksheet.',
  path: ['blocks'],
}).refine((value) => {
  const cards = value.blocks.filter((block) => block.type === 'communicationCards').length;
  return cards === 0 || (cards === 1 && value.blocks.length === 1);
}, {
  message: 'A communicationCards block must be the only block of its worksheet.',
  path: ['blocks'],
});

export const generatedWorksheetEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  worksheets: z.array(generatedWorksheetSchema).min(1).max(100),
});

function shuffled<T>(values: T[]) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [next[index], next[target]] = [next[target], next[index]];
  }
  return next;
}

// Guarantees at least one displaced item so no row lines up with its own answer.
function shuffledAgainst(ids: string[], reference: string[]) {
  const next = shuffled(ids);
  if (next.length > 1 && next.every((id, index) => id === reference[index])) {
    return [...next.slice(1), next[0]];
  }
  return next;
}

const escapeAttribute = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

function blockHtml(block: z.infer<typeof generatedWorksheetSchema>['blocks'][number]) {
  if (block.type === 'heading') {
    return `<div data-heading-text="${escapeAttribute(block.text)}" data-heading-level="${block.level}" data-heading-numbered="${block.numbered}" data-heading-gap-after="${block.gapAfter}" data-restart-instruction-numbering="${block.restartInstructionNumbering}" data-type="custom-heading"></div>`;
  }
  if (block.type === 'pageBreak') {
    return `<div data-restart-pagination="${block.restartPagination}" data-type="pageBreak"></div>`;
  }
  if (block.type === 'richText') {
    // The node stores its markup URI-encoded; encodeURIComponent also escapes the
    // characters that would break out of the attribute.
    return `<div data-rich-text-html="${encodeURIComponent(block.html)}" data-rich-text-bypass-gap="${block.bypassGap}" data-type="rich-text"></div>`;
  }
  if (block.type === 'worksheetTable') {
    const columns = escapeAttribute(encodeURIComponent(JSON.stringify(block.columns)));
    const rows = escapeAttribute(encodeURIComponent(JSON.stringify(block.rows)));
    return `<div data-type="worksheet-table" data-worksheet-table-instruction="${escapeAttribute(block.instruction)}" data-worksheet-table-show-instruction="${block.showInstruction}" data-worksheet-table-columns="${columns}" data-worksheet-table-rows="${rows}" data-worksheet-table-show-header="${block.showHeader}" data-worksheet-table-hide-blank-numbers="${block.hideBlankNumbers}" data-worksheet-table-blank-width="${block.blankWidthFactor}" data-worksheet-table-show-first-example="${block.showFirstAsExample}"></div>`;
  }
  if (block.type === 'declinationTable') {
    const rows = escapeAttribute(encodeURIComponent(JSON.stringify(block.rows)));
    const baseAdjectives = escapeAttribute(encodeURIComponent(JSON.stringify(block.baseAdjectives)));
    const baseNouns = escapeAttribute(encodeURIComponent(JSON.stringify(block.baseNouns)));
    return `<div data-type="declination-table" data-declination-rows="${rows}" data-declination-base-adjectives="${baseAdjectives}" data-declination-base-nouns="${baseNouns}"></div>`;
  }
  if (block.type === 'wordGrid') {
    const { leftToRight, ...otherDirections } = block.directions;
    // normalizeAttrs falls back to left-to-right when nothing is selected.
    const directions = {
      leftToRight: leftToRight || !Object.values(otherDirections).some(Boolean),
      ...otherDirections,
    };
    const attrs = {
      instruction: block.instruction,
      columns: block.columns,
      rows: block.rows,
      rowHeight: block.rowHeight,
      showWordList: block.showWordList,
      showFirstAsExample: block.showFirstAsExample,
      directions,
      words: block.words,
      generation: block.generation,
    };
    return `<div data-type="word-grid" data-word-grid-attrs="${encodeURIComponent(JSON.stringify(attrs))}"></div>`;
  }
  if (block.type === 'wordBank') {
    return `<div data-type="word-bank" data-word-bank-items="${encodeURIComponent(JSON.stringify(block.items))}"></div>`;
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
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-dialogue-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-dialogue-speaker-names="${escapeAttribute(encodeURIComponent(JSON.stringify(block.speakerNames)))}" data-dialogue-show-instruction="${block.showInstruction}" data-dialogue-show-speaker-names="${block.showSpeakerNames}" data-dialogue-show-original="${block.showOriginal}" data-dialogue-show-word-bank="${block.showWordBank}" data-dialogue-hide-blank-numbers="${block.hideBlankNumbers}" data-dialogue-show-first-example="${block.showFirstAsExample}" data-dialogue-context="${escapeAttribute(encodeURIComponent(block.context))}" data-type="dialogue"></div>`;
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
  if (block.type === 'mcm') {
    const rows = block.rows.map((row, rowIndex) => ({
      id: row.id ?? `row-${rowIndex + 1}`,
      text: row.text,
      options: row.options.map((option, optionIndex) => ({
        id: option.id ?? `row-${rowIndex + 1}-option-${optionIndex + 1}`,
        text: option.text,
        correct: option.correct,
      })),
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-mcm-question="${escapeAttribute(block.question)}" data-mcm-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(rows)))}" data-mcm-show-first-example="${block.showFirstAsExample}" data-mcm-hide-statement="${block.hideStatement}" data-type="mcm"></div>`;
  }
  if (block.type === 'articlePlural') {
    const rows = block.rows.map((row, index) => ({
      id: row.id ?? `article-plural-${index + 1}`,
      term: row.term,
      articles: row.articles,
      plural: row.plural,
    })).sort((left, right) => (
      block.order === 'alphabetical'
        ? left.term.localeCompare(right.term, 'de', { sensitivity: 'base' })
        : 0
    ));
    const chunks = Array.from(
      { length: Math.ceil(rows.length / 22) },
      (_, index) => rows.slice(index * 22, (index + 1) * 22),
    );
    return chunks.map((chunk, index) => (
      `<div data-article-plural-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(chunk)))}" data-article-plural-order="${block.order}" data-article-plural-shuffle-seed="${block.shuffleSeed}" data-article-plural-continuation="${block.continuation || index > 0}" data-article-plural-row-number-offset="${block.rowNumberOffset + index * 22}" data-type="article-plural"></div>`
    )).join('');
  }
  if (block.type === 'trueFalse') {
    const rows = block.rows.map((row, index) => ({
      id: row.id ?? `row-${index + 1}`,
      text: row.text,
      correctValue: row.correctValue,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-true-false-question="${escapeAttribute(block.question)}" data-true-label="${escapeAttribute(block.trueLabel)}" data-false-label="${escapeAttribute(block.falseLabel)}" data-show-na="${block.showNa}" data-na-label="${escapeAttribute(block.naLabel)}" data-true-false-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(rows)))}" data-true-false-show-first-example="${block.showFirstAsExample}" data-type="true-false"></div>`;
  }
  if (block.type === 'matchingPairs') {
    const pairs = block.pairs.map((pair, index) => ({
      id: pair.id ?? `pair-${index + 1}`,
      left: pair.left,
      right: pair.right,
    }));
    const rightOrder = block.rightOrder ?? pairs.map((pair) => pair.id);
    return `<div data-type="matching-pairs" data-matching-instruction="${escapeAttribute(block.instruction)}" data-matching-question="${escapeAttribute(block.question)}" data-matching-pairs="${escapeAttribute(encodeURIComponent(JSON.stringify(pairs)))}" data-matching-right-order="${escapeAttribute(encodeURIComponent(JSON.stringify(rightOrder)))}" data-matching-shuffle-left="${block.shuffleLeft}" data-matching-shuffle-right="${block.shuffleRight}" data-matching-shuffle-seed="${block.shuffleSeed}" data-matching-show-word-bank="${block.showWordBank}" data-matching-shuffle-word-bank="${block.shuffleWordBank}" data-matching-show-first-example="${block.showFirstAsExample}" data-matching-answer-style="${block.answerStyle}"></div>`;
  }
  if (block.type === 'learningCards') {
    // One JSON block becomes the whole sheet sequence the editor expects: a front
    // (and optional back) sheet per group of nine cards, separated by page breaks.
    // Every sheet carries the full item list and slices it by data-group-index.
    const items = block.items.map((item, index) => ({
      id: item.id ?? `learning-card-${index + 1}`,
      front: item.front,
      back: item.back,
    }));
    const groupCount = Math.ceil(items.length / LEARNING_CARDS_PER_GROUP);
    const sides = block.sidedness === 'double'
      ? ['front', 'back'] as const
      : ['front'] as const;
    const encodedItems = escapeAttribute(encodeURIComponent(JSON.stringify(items)));
    const sheets = Array.from({ length: groupCount }, (_, groupIndex) => (
      sides.map((sheetSide) => (
        `<div data-title="${escapeAttribute(block.title)}" data-format="a8-landscape" data-sidedness="${block.sidedness}" data-learning-cards-blank-width-factor="${block.blankWidthFactor}" data-front-text-size="${block.frontTextSize}" data-back-text-size="${block.backTextSize}" data-items="${encodedItems}" data-group-index="${groupIndex}" data-sheet-side="${sheetSide}" data-solution-sheet-index="0" data-solution-sheet-count="1" data-solution-start-index="0" data-solution-end-index="0" data-type="learning-cards"></div>`
      ))
    )).flat();
    const cardBreak = '<div data-restart-pagination="false" data-type="pageBreak"></div>';
    let html = sheets.join(cardBreak);
    if (block.sidedness === 'single-solution') {
      // The break before the solution key restarts page numbering so the
      // solution section is numbered on its own. The editor's measurement pass
      // splits this single solution sheet into page-sized sheets on load.
      const solutionSheet = `<div data-title="${escapeAttribute(block.title)}" data-format="a8-landscape" data-sidedness="single-solution" data-learning-cards-blank-width-factor="${block.blankWidthFactor}" data-front-text-size="${block.frontTextSize}" data-back-text-size="${block.backTextSize}" data-items="${encodedItems}" data-group-index="${groupCount}" data-sheet-side="solutions" data-solution-sheet-index="0" data-solution-sheet-count="1" data-solution-start-index="0" data-solution-end-index="0" data-type="learning-cards"></div>`;
      html += `<div data-restart-pagination="true" data-type="pageBreak"></div>${solutionSheet}`;
    }
    return html;
  }
  if (block.type === 'communicationCards') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `communication-card-${index + 1}`,
      pairTitle: item.pairTitle,
      situation: item.situation,
      task: item.task,
      intro: item.intro,
      listType: item.listType,
      listItems: item.listItems,
      content: item.content,
    }));
    const groupCount = Math.ceil(items.length / COMMUNICATION_CARDS_PER_GROUP);
    const encodedItems = escapeAttribute(encodeURIComponent(JSON.stringify(items)));
    const sheets = Array.from({ length: groupCount }, (_, groupIndex) => (
      `<div data-title="${escapeAttribute(block.title)}" data-format="a4-landscape" data-sidedness="single" data-text-size="${block.textSize}" data-items="${encodedItems}" data-group-index="${groupIndex}" data-type="communication-cards"></div>`
    ));
    return sheets.join('<div data-restart-pagination="false" data-type="pageBreak"></div>');
  }
  if (block.type === 'timeMatching') {
    const baseTimes = block.times.map((time, index) => ({
      id: time.id ?? `time-${index + 1}`,
      hour: time.hour,
      minute: time.minute,
    }));
    const times = block.shuffleLeft ? shuffled(baseTimes) : baseTimes;
    const baseOrder = baseTimes.map((time) => time.id);
    const rightOrder = block.rightOrder
      ?? (block.shuffleRight
        ? shuffledAgainst(baseOrder, times.map((time) => time.id))
        : baseOrder);
    return `<div data-type="time-matching" data-instruction="${escapeAttribute(block.instruction)}" data-left-representation="${block.leftRepresentation}" data-right-representation="${block.rightRepresentation}" data-times="${escapeAttribute(encodeURIComponent(JSON.stringify(times)))}" data-right-order="${escapeAttribute(encodeURIComponent(JSON.stringify(rightOrder)))}" data-allowed-minutes="${escapeAttribute(encodeURIComponent(JSON.stringify(block.allowedMinutes)))}" data-range-start="${block.rangeStart}" data-range-end="${block.rangeEnd}" data-shuffle-left="${block.shuffleLeft}" data-shuffle-right="${block.shuffleRight}" data-show-first-as-example="${block.showFirstAsExample}" data-answer-style="${block.answerStyle}"></div>`;
  }
  if (block.type === 'domino') {
    const pairs = block.pairs.map((pair, index) => ({
      id: pair.id ?? `domino-${index + 1}`,
      left: pair.left,
      right: pair.right,
    }));
    const totalCells = pairs.length * 2 + 2;
    const groupSize = Math.max(1, Math.ceil(totalCells / DOMINO_GRID_CELLS));
    const groupId = `domino-${Date.now()}`;
    const encodedPairs = escapeAttribute(encodeURIComponent(JSON.stringify(pairs)));
    const oddTextSize = block.oddTextSize ?? 'm';
    const evenTextSize = block.evenTextSize ?? 'm';
    const leftRepresentation = block.leftRepresentation ?? 'text';
    const rightRepresentation = block.rightRepresentation ?? 'text';
    const sheets = Array.from({ length: groupSize }, (_, groupIndex) => (
      `<div data-type="domino" data-domino-pairs="${encodedPairs}" data-domino-show-first-example="${block.showFirstAsExample}" data-domino-group-index="${groupIndex}" data-domino-group-size="${groupSize}" data-domino-group-id="${groupId}" data-domino-odd-text-size="${oddTextSize}" data-domino-even-text-size="${evenTextSize}" data-domino-left-representation="${leftRepresentation}" data-domino-right-representation="${rightRepresentation}"></div>`
    ));
    return sheets.join('<div data-restart-pagination="false" data-type="pageBreak"></div>');
  }
  if (block.type === 'germanVerbTable') {
    return `<div data-type="german-verb-table" data-table-style="${block.tableStyle}" data-tense="${block.tense}" data-group-id="${escapeAttribute(block.groupId)}" data-group-index="${block.groupIndex}" data-group-size="${block.groupSize}" data-hide-infinitive-badge="${block.hideInfinitiveBadge}" data-show-infinitive-heading="${block.showInfinitiveHeading}" data-infinitive-heading-text="${escapeAttribute(block.infinitiveHeadingText)}" data-left-verb="${escapeAttribute(block.leftVerb)}" data-left-forms="${escapeAttribute(encodeURIComponent(JSON.stringify(block.leftForms)))}" data-left-auxiliary="${escapeAttribute(block.leftAuxiliary)}" data-left-participle="${escapeAttribute(block.leftParticiple)}" data-comparison-auxiliary="${block.comparisonAuxiliary}" data-separable-prefix="${escapeAttribute(block.separablePrefix)}" data-right-verb="${escapeAttribute(block.rightVerb)}" data-forms="${escapeAttribute(encodeURIComponent(JSON.stringify(block.forms)))}" data-right-auxiliary="${escapeAttribute(block.rightAuxiliary)}" data-right-participle="${escapeAttribute(block.rightParticiple)}" data-multiple-verb-count="${block.multipleVerbCount}" data-multiple-badge-style="${block.multipleBadgeStyle}" data-multiple-verbs="${escapeAttribute(encodeURIComponent(JSON.stringify(block.multipleVerbs)))}"></div>`;
  }
  const widths = block.preset === 'verbs'
    ? { term: 20, definition: 25 }
    : block.preset === 'nouns' || block.preset === 'adjectives'
      ? { term: 50, definition: 50 }
      : {
        term: Number(block.termWidth ?? 33),
        definition: Number(block.definitionWidth ?? 33),
      };
  const terms = block.entries.map((entry, index) => ({
    id: `term-${index + 1}`,
    term: entry.term,
    definition: entry.definition,
    additional: entry.additional ?? '',
    example: entry.example ?? '',
  }));
  const additionalWidth = Number(block.additionalWidth ?? 20);
  const headerLabels = Array.isArray(block.headerLabels)
    ? block.headerLabels.slice(0, 4).map((label) => label ?? '')
    : [];
  const instruction = block.instruction
    ? ` data-block-instruction="${escapeAttribute(block.instruction)}"`
    : '';
  return `<div data-glossary-terms="${escapeAttribute(encodeURIComponent(JSON.stringify(terms)))}" data-glossary-term-width="${widths.term}" data-glossary-definition-width="${widths.definition}" data-glossary-additional-width="${additionalWidth}" data-glossary-preset="${block.preset}" data-glossary-header-labels="${escapeAttribute(encodeURIComponent(JSON.stringify(headerLabels)))}" data-glossary-show-instruction="${block.showInstruction}" data-glossary-show-column-headers="${block.showColumnHeaders}" data-glossary-show-example="${block.showExample}" data-glossary-show-additional-column="${block.showAdditionalColumn}"${instruction} data-type="glossary-terms"></div>`;
}

function extractSingleWorksheetValue(value: unknown) {
  const container = value as {
    worksheet?: unknown;
    worksheets?: unknown;
  };
  const rawWorksheets = Array.isArray(container?.worksheets)
    ? container.worksheets
    : container?.worksheet
      ? [container.worksheet]
      : [value];
  if (rawWorksheets.length !== 1) {
    throw new Error('Provide exactly 1 worksheet.');
  }
  return rawWorksheets[0];
}

/**
 * Parses generated worksheet JSON and returns only block HTML.
 * Worksheet-level settings (title, size, context, brand, folder, status) are ignored.
 */
export function worksheetBlocksHtmlFromGeneratedJson(value: unknown) {
  const worksheetValue = extractSingleWorksheetValue(value);
  const input = generatedWorksheetSchema.parse(worksheetValue);
  if (input.sourceWorksheetId) {
    throw new Error('sourceWorksheetId is not supported for block insertion imports.');
  }
  return input.blocks.map(blockHtml).join('');
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
