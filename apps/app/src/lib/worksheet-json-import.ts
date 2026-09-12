import { z } from 'zod';
import { EMPTY_WORKSHEET_CONTEXT, type WorksheetPatch } from './worksheet-types';
import { GRAMMAR_TAG_ID_SET, normalizeGrammarTagId } from './grammar-tags';

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

const glossaryWidthSchema = z.union([
  z.number().int().min(0).max(100),
  z.string().trim().regex(/^\d+$/).transform((value) => Number(value)),
]);

const glossarySchema = z.object({
  type: z.literal('glossary'),
  preset: z.enum(['default', 'verbs', 'nouns', 'adjectives']).default('default'),
  showInstruction: z.boolean().default(false),
  hideInstructionBadge: z.boolean().default(false),
  showColumnHeaders: z.boolean().default(true),
  showDefinitionColumn: z.boolean().default(true),
  showExample: z.boolean().default(true),
  showAdditionalColumn: z.boolean().default(false),
  instruction: z.string().trim().max(1000).nullable().optional(),
  headerLabels: z.array(z.string().trim().max(200)).max(4).default([]),
  termWidth: glossaryWidthSchema.optional(),
  definitionWidth: glossaryWidthSchema.optional(),
  additionalWidth: glossaryWidthSchema.optional(),
  entries: z.array(glossaryEntrySchema).min(1).max(500),
});

const fillInTheBlankSchema = z.object({
  type: z.literal('fillInTheBlank'),
  instruction: z.string().trim().min(1).max(1000),
  title: z.string().trim().max(500).default(''),
  items: z.array(z.string().trim().max(5000)).min(1).max(500),
  distractors: z.array(z.string().trim().min(1).max(500)).max(500).default([]),
  widthFactor: z.number().min(0.25).max(5).default(1),
  showInstruction: z.boolean().default(true),
  hideInstructionBadge: z.boolean().default(false),
  hideBlankNumbers: z.boolean().default(false),
  hideItemNumbers: z.boolean().default(false),
  showLineNumbers: z.boolean().default(false),
  renderEmptyLinesAsSpacerRows: z.boolean().default(false),
  showWordBank: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
});

const richTextSchema = z.object({
  type: z.literal('richText'),
  html: z.string().min(1).max(100_000),
  bypassGap: z.boolean().default(false),
});

const lesetrainingSchema = z.object({
  type: z.literal('lesetraining'),
  html: z.string().min(1).max(100_000),
  bypassGap: z.boolean().default(false),
  audio: z.object({
    url: z.string().url(),
    voices: z.record(z.string(), z.string()).default({}),
    instruction: z.string().max(1000).default(''),
    language: z.string().max(100).default(''),
    speakingRate: z.number().min(0.5).max(1.5).default(1),
    scriptItems: z.array(z.object({
      speaker: z.number().int().min(1).max(4),
      text: z.string().max(5000),
    })).default([]),
    durationSeconds: z.number().min(0).default(0),
    updatedAt: z.string().max(100).default(''),
  }).nullable().default(null),
});

const pageBreakSchema = z.object({
  type: z.literal('pageBreak'),
  restartPagination: z.boolean().default(false),
});

const spacerSchema = z.object({
  type: z.literal('spacer'),
  height: z.number().int().min(0).max(400).default(32),
});

const writingLinesSchema = z.object({
  type: z.literal('writingLines'),
  lineCount: z.number().int().min(1).max(30).default(4),
  lineHeight: z.number().int().min(16).max(120).default(40),
  showLineNumbers: z.boolean().default(false),
});

const instructionSchema = z.object({
  type: z.literal('instruction'),
  instruction: z.string().trim().min(1).max(1000),
  bypassGap: z.boolean().default(false),
});

const learningObjectiveSchema = z.object({
  type: z.literal('learningObjective'),
  title: z.string().trim().min(1).max(500).default('Learning objective'),
  curriculumCode: z.string().trim().max(200).default(''),
  objective: z.string().trim().min(1).max(5000),
  successCriteria: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    text: z.string().trim().min(1).max(2000),
  })).min(1).max(20),
});

const orderingSchema = z.object({
  type: z.literal('ordering'),
  instruction: z.string().trim().min(1).max(1000),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    text: z.string().trim().min(1).max(2000),
  })).min(2).max(100),
  shuffleItems: z.boolean().default(true),
  generation: z.number().int().min(0).default(0),
  showRandomAsExample: z.boolean().default(true),
});

const frayerModelSchema = z.object({
  type: z.literal('frayerModel'),
  instruction: z.string().trim().max(1000).default(
    'Complete the Frayer model for the concept.',
  ),
  concept: z.string().trim().max(500).default('Key concept'),
  quadrants: z.array(z.object({
    id: z.enum(['definition', 'characteristics', 'examples', 'nonExamples']),
    label: z.string().trim().max(500),
    answer: z.string().max(5000).default(''),
  })).length(4),
  responseLines: z.number().int().min(1).max(6).default(3),
  showModelAnswers: z.boolean().default(false),
});

const occupationPortraitSchema = z.object({
  type: z.literal('occupationPortrait'),
  profession: z.string().trim().max(500).default(''),
  title: z.string().trim().max(500).default(''),
  paragraphs: z.array(z.string().max(10_000)).max(100).default([]),
  sourceUrl: z.string().trim().max(2000).default(''),
  proficiencyLevel: z.string().trim().max(100).default('A2.1'),
  proficiencyPhase: z.string().trim().max(100).default('beginning'),
  textType: z.enum(['self-portrait', 'portrait']).default('self-portrait'),
});

const errorCorrectionSchema = z.object({
  type: z.literal('errorCorrection'),
  instruction: z.string().trim().min(1).max(1000),
  language: z.enum(['german', 'english']).default('german'),
  markup: z.string().max(100_000),
  incorrectText: z.string().max(100_000),
  correctText: z.string().max(100_000),
  errors: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    typeId: z.string().trim().max(100).default(''),
    incorrect: z.string().max(5000),
    correct: z.string().max(5000),
    explanation: z.string().max(5000).default(''),
    start: z.number().int(),
    end: z.number().int(),
  })).max(500),
  markErrorPositions: z.boolean().default(true),
  correctionLines: z.number().int().min(0).max(8).default(2),
});

const letterNodeSchema = z.object({
  type: z.literal('letterNode'),
  instruction: z.string().trim().min(1).max(1000),
  alphabetChoice: z.enum(['english', 'german']).default('german'),
  alphabet: z.string().trim().min(1).max(100),
  helperLetters: z.string().max(100).default('U'),
  keyColumns: z.number().int().min(5).max(20).default(15),
  cellHeight: z.number().int().min(36).max(90).default(52),
  showKey: z.boolean().default(true),
  showItemNumbers: z.boolean().default(true),
  showFirstAsExample: z.boolean().default(true),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    clue: z.string().max(2000),
    answer: z.string().trim().min(1).max(500),
  })).min(1).max(100),
});

const dateMatchingSchema = z.object({
  type: z.literal('dateMatching'),
  instruction: z.string().trim().min(1).max(1000),
  leftRepresentation: z.enum(['calendar', 'numeric', 'written']),
  rightRepresentation: z.enum(['calendar', 'numeric', 'written']),
  dates: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })).min(1).max(100),
  rightOrder: z.array(z.string().trim().min(1).max(100)).max(100),
});

const choiceOptionSchema = z.object({
  id: z.string().trim().min(1).max(100),
  text: z.string().max(5000),
  correct: z.boolean(),
});

const twoWayPrepositionsSchema = z.object({
  type: z.literal('twoWayPrepositions'),
  instruction: z.string().trim().min(1).max(1000),
  mode: z.enum(['mcq', 'trueFalse']),
  showVocabulary: z.boolean().default(true),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    preposition: z.enum([
      'an', 'auf', 'hinter', 'in', 'neben', 'über', 'unter', 'vor', 'zwischen',
    ]),
    grammaticalCase: z.enum(['accusative', 'dative']),
    subjectShape: z.enum(['square', 'circle', 'ellipse']),
    referenceShape: z.enum(['square', 'circle', 'ellipse']),
    secondReferenceShape: z.enum(['square', 'circle', 'ellipse']).nullable(),
    subjectPlural: z.boolean(),
    referencePlural: z.boolean(),
    statement: z.string().max(5000),
    statementCorrect: z.boolean(),
    options: z.array(choiceOptionSchema).max(10),
  })).min(1).max(100),
});

const weatherKindSchema = z.enum([
  'cloudy', 'rain', 'snow', 'snowStorm', 'sunSnow', 'sunny', 'storm', 'windy',
]);

const weatherSchema = z.object({
  type: z.literal('weather'),
  instruction: z.string().trim().min(1).max(1000),
  mode: z.enum(['mcq', 'trueFalse']),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    weekday: z.string().trim().max(100),
    city: z.string().trim().max(200),
    temperature: z.number().min(-100).max(100),
    weather: weatherKindSchema,
    statement: z.string().max(5000),
    statementCorrect: z.boolean(),
    options: z.array(choiceOptionSchema).max(10),
  })).min(1).max(100),
  questionOrder: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  showInstruction: z.boolean().default(true),
  weatherKinds: z.array(weatherKindSchema).max(8).nullable().default(null),
  minTemperature: z.number().min(-100).max(100).nullable().default(null),
  maxTemperature: z.number().min(-100).max(100).nullable().default(null),
  shuffleQuestions: z.boolean().nullable().default(null),
  varyWeekdayAndCity: z.boolean().default(true),
});

const familyKinshipSchema = z.object({
  type: z.literal('familyKinship'),
  instruction: z.string().trim().max(1000).optional(),
  riddles: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    prompt: z.string().max(5000),
    answerMode: z.enum(['mcq', 'open', 'trueFalse']),
    answer: z.string().max(5000).default(''),
    options: z.array(z.object({
      id: z.string().trim().min(1).max(100).optional(),
      text: z.string().max(2000),
    })).max(20).default([]),
    trueFalseValue: z.boolean().default(true),
  })).min(1).max(100),
  showFirstAsExample: z.boolean().default(false),
});

const inlineChoiceSchema = z.object({
  type: z.literal('inlineChoice'),
  instruction: z.string().trim().min(1).max(1000),
  shuffleChoices: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
  items: z.array(z.discriminatedUnion('type', [
    z.object({
      id: z.string().trim().min(1).max(100).optional(),
      type: z.literal('sentence'),
      text: z.string().max(10_000),
    }),
    z.object({
      id: z.string().trim().min(1).max(100).optional(),
      type: z.literal('divider'),
    }),
    z.object({
      id: z.string().trim().min(1).max(100).optional(),
      type: z.literal('subtitle'),
      text: z.string().max(2000),
    }),
  ])).min(1).max(500),
});

const miniFormSchema = z.object({
  type: z.literal('miniForm'),
  instruction: z.string().trim().min(1).max(1000),
  fields: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    label: z.string().max(500),
  })).min(1).max(20),
  columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).default(3),
  fillRemainingRow: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(true),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    prompt: z.string().max(10_000),
    values: z.record(z.string(), z.string().max(5000)).default({}),
    image: z.object({
      src: z.string().max(2000),
      alt: z.string().max(500).default(''),
    }).optional(),
  })).min(1).max(100),
});

const mchSchema = z.object({
  type: z.literal('mch'),
  instruction: z.string().trim().max(1000).optional(),
  question: z.string().max(5000).default(''),
  options: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    text: z.string().max(2000),
  })).min(1).max(4),
  rows: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    text: z.string().max(5000),
    correctOptionId: z.string().trim().min(1).max(100).nullable(),
  })).min(1).max(500),
  showFirstAsExample: z.boolean().default(false),
});

const mediaLayoutSchema = z.object({
  type: z.literal('mediaLayout'),
  layout: z.enum(['full', 'image-left', 'image-right', 'grid']).default('full'),
  columns: z.union([
    z.literal(1), z.literal(2), z.literal(3), z.literal(4),
  ]).default(2),
  imageWidth: z.number().min(1).max(99).default(50),
  gap: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
  aspectRatio: z.enum([
    'auto', 'square', 'four-three', 'three-two', 'wide',
  ]).default('wide'),
  fit: z.enum(['cover', 'contain']).default('cover'),
  radius: z.enum(['none', 'small', 'medium', 'large']).default('small'),
  border: z.enum(['none', 'light', 'medium']).default('none'),
  maximize: z.boolean().default(false),
  showCaptions: z.boolean().default(true),
  captionSize: z.enum(['small', 'medium', 'large']).default('small'),
  captionStyle: z.enum(['normal', 'italic', 'bold']).default('normal'),
  text: z.string().max(100_000).default(''),
  textVertical: z.enum(['start', 'center', 'end']).default('start'),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    src: z.string().max(2000),
    alt: z.string().max(500).default(''),
    caption: z.string().max(10_000).default(''),
    credit: z.string().max(2000).default(''),
    href: z.string().max(2000).default(''),
    focalX: z.number().min(0).max(100).default(50),
    focalY: z.number().min(0).max(100).default(50),
  })).min(1).max(100),
});

const colorFurnitureSchema = z.object({
  type: z.literal('colorFurniture'),
  instruction: z.string().trim().min(1).max(1000),
  mode: z.enum(['mcq', 'trueFalse']),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    furniture: z.enum([
      'sofaSingle',
      'sofaDouble',
      'table',
      'chair',
      'desk',
      'bed',
      'wardrobe',
      'cupboard',
      'bookshelf',
    ]),
    color: z.enum([
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'pink',
      'brown',
      'grey',
      'black',
    ]),
    statement: z.string().max(5000),
    statementCorrect: z.boolean(),
    options: z.array(choiceOptionSchema).max(10),
  })).min(1).max(100),
});

const dictationLinesSchema = z.object({
  type: z.literal('dictationLines'),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    text: z.string().max(5000).default(''),
  })).min(1).max(30).default([{ text: '' }]),
  variant: z.enum(['itemized', 'ongoingText']).default('itemized'),
  twoColumns: z.boolean().default(false),
  linesPerItem: z.number().int().min(1).max(20).default(1),
  lineHeight: z.number().int().min(16).max(120).default(40),
  showLineNumbers: z.boolean().default(false),
  audioTracks: z.array(z.object({
    itemId: z.string().trim().min(1).max(100),
    url: z.string().trim().max(2000),
    durationSeconds: z.number().nonnegative().default(0),
    updatedAt: z.string().max(100).default(''),
  })).default([]),
  audioPlaylistUrl: z.string().trim().max(2000).nullable().default(null),
});

const alpharamaTermSchema = z.object({
  type: z.literal('alpharamaTerm'),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    image: z.string().trim().max(2000).default(''),
    alt: z.string().trim().max(500).default(''),
    term: z.string().trim().max(200).default(''),
  })).min(1).max(100),
  pageBreakBetweenItems: z.boolean().default(false),
});

const letterCloudSchema = z.object({
  type: z.literal('letterCloud'),
  instruction: z.string().trim().max(1000).default(
    'Unscramble the letters and write the word on the line.',
  ),
  hideInstructionBadge: z.boolean().default(false),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    word: z.string().trim().min(1).max(100),
  })).min(1).max(100),
  showItemNumbers: z.boolean().default(true),
  columns: z.number().int().min(1).max(4).default(2),
});

const anagramSchema = z.object({
  type: z.literal('anagram'),
  instruction: z.string().trim().max(1000).default(
    'Put the letters in the correct order and write the word.',
  ),
  hideInstructionBadge: z.boolean().default(false),
  showClues: z.boolean().default(true),
  items: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    clue: z.string().max(1000).default(''),
    answer: z.string().trim().min(1).max(100),
  })).min(1).max(100),
  showItemNumbers: z.boolean().default(true),
  showFirstAsExample: z.boolean().default(false),
  pageBreakBetweenItems: z.boolean().default(false),
});

const crosswordSchema = z.object({
  type: z.literal('crossword'),
  instruction: z.string().trim().min(1).max(1000).default('Complete the crossword using the clues.'),
  entries: z.array(z.object({
    id: z.string().trim().min(1).max(100),
    answer: z.string().trim().min(1).max(100),
    clue: z.string().max(1000),
  })).min(1).max(100),
  layoutSeed: z.number().int().min(0).default(1),
  cellSize: z.number().min(22).max(40).default(30),
  cellAspectRatio: z.enum(['1:1', '1.25:1']).default('1.25:1'),
  showWordBank: z.boolean().default(false),
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
  hideInstructionBadge: z.boolean().default(false),
  columns: z.array(worksheetTableColumnSchema).min(1).max(6),
  rows: z.array(worksheetTableRowSchema).min(1).max(1000),
  showHeader: z.boolean().default(false),
  hideBlankNumbers: z.boolean().default(false),
  blankWidthFactor: z.number().min(1).max(5).default(1),
  showFirstAsExample: z.boolean().default(false),
});

const informationGapActivitySchema = z.object({
  type: z.literal('informationGapActivity'),
  title: z.string().trim().min(1).max(200).default('Information gap activity'),
  columns: z.array(worksheetTableColumnSchema).min(1).max(6),
  rows: z.array(worksheetTableRowSchema).min(1).max(1000),
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
  hideInstructionBadge: z.boolean().default(false),
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

const messengerSchema = z.object({
  type: z.literal('messenger'),
  contactName: z.string().trim().max(200).default(''),
  status: z.string().trim().max(200).default(''),
  messages: z.array(z.object({
    side: z.enum(['incoming', 'outgoing']).default('incoming'),
    text: z.string().max(5000),
    time: z.string().trim().max(100).default(''),
  })).min(1).max(500),
});

const emailSchema = z.object({
  type: z.literal('email'),
  fromName: z.string().trim().max(200).default(''),
  fromAddress: z.string().trim().max(500).default(''),
  to: z.string().trim().max(1000).default(''),
  date: z.string().trim().max(200).default(''),
  subject: z.string().max(1000).default(''),
  body: z.string().max(20_000).default(''),
  attachmentType: z.enum([
    'none',
    'document',
    'image',
    'video',
    'audio',
  ]).default('none'),
  attachmentName: z.string().max(1000).default(''),
});

const timetableSchema = z.object({
  type: z.literal('timetable'),
  instruction: z.string().max(1000).default(
    'Read the timetable and answer the questions.',
  ),
  showInstruction: z.boolean().default(true),
  hideInstructionBadge: z.boolean().default(false),
  destinationLabel: z.string().max(100).default('Nach'),
  platformLabel: z.string().max(100).default('Gleis'),
  noticeLabel: z.string().max(100).default('Hinweis'),
  footer: z.string().max(2000).default(''),
  rows: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    service: z.string().max(200).default(''),
    time: z.string().max(100).default(''),
    destination: z.string().max(2000).default(''),
    platform: z.string().max(100).default(''),
    notice: z.string().max(500).default(''),
  })).min(1).max(100),
});

const openingHoursSchema = z.object({
  type: z.literal('openingHours'),
  instruction: z.string().max(1000).default(
    'Read the opening hours and answer the questions.',
  ),
  showInstruction: z.boolean().default(true),
  hideInstructionBadge: z.boolean().default(false),
  signs: z.array(z.object({
    id: z.string().trim().min(1).max(100).optional(),
    title: z.string().trim().min(1).max(200),
    abbreviateWeekdays: z.boolean().default(false),
    rows: z.array(z.object({
      id: z.string().trim().min(1).max(100).optional(),
      days: z.string().max(500).default(''),
      hours: z.string().max(500).default(''),
    })).min(1).max(50),
  })).min(1).max(20),
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
  questionNumber: z.number().int().positive().nullable().default(null),
  columns: z.number().int().min(1).max(3).default(1),
  shuffleAnswers: z.boolean().default(false),
  showInstruction: z.boolean().default(true),
  hideInstructionBadge: z.boolean().default(false),
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
  instruction: z.string().trim().max(1000)
    .default('Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.'),
  hideInstructionBadge: z.boolean().default(false),
  rows: z.array(articlePluralRowSchema).min(1).max(1000),
  order: z.enum(['alphabetical', 'shuffle']).default('alphabetical'),
  shuffleSeed: z.number().int().min(0).max(1_000_000).default(0),
  showAdditionalBlankItems: z.boolean().default(true),
  showPluralColumn: z.boolean().default(true),
  continuation: z.boolean().default(false),
  rowNumberOffset: z.number().int().min(0).max(1_000_000).default(0),
});

const trueFalseRowSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(2000),
  correctValue: z.union([
    z.enum(['true', 'false', 'na']),
    z.boolean().transform((value) => (value ? 'true' : 'false')),
  ]).nullable().default(null),
});

const trueFalseSchema = z.object({
  type: z.literal('trueFalse'),
  instruction: z.string().trim().max(1000).default('Mark each statement as true or false.'),
  hideInstructionBadge: z.boolean().default(false),
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

const articlePluralCardSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  article: z.string().trim().max(100).default(''),
  singular: z.string().trim().max(500).default(''),
  plural: z.string().trim().max(500).default(''),
});

const articlePluralCardsSchema = z.object({
  type: z.literal('articlePluralCards'),
  title: z.string().trim().max(200).default('Article/Plural Cards'),
  format: z.literal('a8-landscape').default('a8-landscape'),
  sidedness: z.literal('double').default('double'),
  items: z.array(articlePluralCardSchema).min(1).max(450),
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
  hideInstructionBadge: z.boolean().default(false),
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

const rewriteSentenceItemSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  input: z.string().trim().min(1).max(5000),
  solution: z.string().trim().min(1).max(5000),
  image: z.object({
    src: z.string().trim().min(1).max(5000),
    alt: z.string().trim().max(5000).default(''),
  }).optional(),
});

const rewriteSentencesSchema = z.object({
  type: z.literal('rewriteSentences'),
  instruction: z.string().trim().max(1000).default('Rewrite the sentences correctly.'),
  items: z.array(rewriteSentenceItemSchema).min(1).max(200),
  showInstruction: z.boolean().default(true),
  showFirstAsExample: z.boolean().default(false),
});

const sortingCategorySchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  title: z.string().trim().max(200).default(''),
});

const sortingCategoryItemSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  text: z.string().trim().min(1).max(2000),
  categoryId: z.string().trim().min(1).max(100),
});

const sortingCategoriesSchema = z.object({
  type: z.literal('sortingCategories'),
  instruction: z.string().trim().max(1000).default('Sort the items into the correct categories.'),
  categories: z.array(sortingCategorySchema).min(1).max(4),
  items: z.array(sortingCategoryItemSchema).min(1).max(500),
  colorCoding: z.boolean().default(false),
  showFirstAsExample: z.boolean().default(false),
});

const chooseCorrectWordItemSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  word: z.string().trim().min(1).max(2000),
  optionCount: z.number().int().min(2).max(12).default(8),
});

const chooseCorrectWordsSchema = z.object({
  type: z.literal('chooseCorrectWords'),
  instruction: z.string().trim().max(1000).default('Choose the correctly written words.'),
  keepLeft: z.number().int().min(0).max(10).default(1),
  keepRight: z.number().int().min(0).max(10).default(1),
  showFirstAsExample: z.boolean().default(false),
  items: z.array(chooseCorrectWordItemSchema).min(1).max(100),
  generation: z.number().int().min(0).max(1_000_000).default(0),
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
    'information-gap',
    'domino',
    'dialog',
    'lesetraining',
    'word-list',
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
  grammarTags: z.array(
    z.string().max(150)
      .transform((value) => normalizeGrammarTagId(value))
      .refine((value) => GRAMMAR_TAG_ID_SET.has(value), {
        message: 'Unknown grammar tag ID.',
      }),
  ).max(80).default([]),
  learnerContext: z.string().max(1000).default(''),
  hinweis: z.string().max(2000).default(''),
  contextPdfName: z.string().max(250).default(''),
  contextPdfText: z.string().max(1_000_000).default(''),
  contextPdfPageCount: z.number().int().positive().nullable().default(null),
}).partial();

function normalizeGeneratedBlockType(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  const rawType = typeof record.type === 'string' ? record.type.trim() : '';
  if (!rawType) return value;
  const compactType = rawType.replaceAll('-', '').toLowerCase();
  if (compactType === 'articlepluralcards') {
    return { ...record, type: 'articlePluralCards' };
  }
  return { ...record, type: rawType };
}

export const generatedWorksheetBlockSchema = z.discriminatedUnion('type', [
  headingSchema,
  glossarySchema,
  fillInTheBlankSchema,
  pageBreakSchema,
  spacerSchema,
  writingLinesSchema,
  instructionSchema,
  learningObjectiveSchema,
  orderingSchema,
  frayerModelSchema,
  occupationPortraitSchema,
  errorCorrectionSchema,
  letterNodeSchema,
  dateMatchingSchema,
  twoWayPrepositionsSchema,
  weatherSchema,
  familyKinshipSchema,
  inlineChoiceSchema,
  miniFormSchema,
  mchSchema,
  mediaLayoutSchema,
  colorFurnitureSchema,
  dictationLinesSchema,
  alpharamaTermSchema,
  letterCloudSchema,
  anagramSchema,
  crosswordSchema,
  dialogueSchema,
  messengerSchema,
  emailSchema,
  timetableSchema,
  openingHoursSchema,
  mcqSchema,
  mcmSchema,
  articlePluralSchema,
  trueFalseSchema,
  matchingPairsSchema,
  timeMatchingSchema,
  communicationCardsSchema,
  learningCardsSchema,
  articlePluralCardsSchema,
  richTextSchema,
  lesetrainingSchema,
  wordGridSchema,
  wordBankSchema,
  rewriteSentencesSchema,
  sortingCategoriesSchema,
  chooseCorrectWordsSchema,
  dominoSchema,
  germanVerbTableSchema,
  declinationTableSchema,
  worksheetTableSchema,
  informationGapActivitySchema,
]);

export const generatedWorksheetSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  documentSize: z.enum(['a4-portrait', 'a4-landscape', 'a5-landscape', 'a5-fotokarten', 'letter-portrait', 'letter-landscape']).default('a4-portrait'),
  showSolutions: z.boolean().default(false),
  status: z.enum(['draft', 'published']).default('draft'),
  brandProfileId: z.string().uuid().nullable().optional(),
  folderId: z.string().uuid().nullable().optional(),
  sourceWorksheetId: z.string().uuid().nullable().optional(),
  context: contextSchema.default({}),
  blocks: z.preprocess((raw) => {
    if (!Array.isArray(raw)) return raw;
    return raw.map((entry) => normalizeGeneratedBlockType(entry));
  }, z.array(generatedWorksheetBlockSchema).max(1000)).default([]),
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
}).refine((value) => {
  const cards = value.blocks.filter((block) => block.type === 'articlePluralCards').length;
  return cards === 0 || (cards === 1 && value.blocks.length === 1);
}, {
  message: 'An articlePluralCards block must be the only block of its worksheet.',
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
  if (block.type === 'spacer') {
    return `<div data-spacer-height="${block.height}" data-type="spacer"></div>`;
  }
  if (block.type === 'writingLines') {
    return `<div data-writing-lines-count="${block.lineCount}" data-writing-lines-height="${block.lineHeight}" data-writing-lines-show-line-numbers="${block.showLineNumbers}" data-type="writing-lines"></div>`;
  }
  if (block.type === 'instruction') {
    return `<div data-instruction-text="${escapeAttribute(block.instruction)}" data-instruction-bypass-gap="${block.bypassGap}" data-type="instruction-block"></div>`;
  }
  if (block.type === 'learningObjective') {
    const successCriteria = block.successCriteria.map((criterion, index) => ({
      id: criterion.id ?? `criterion-${index + 1}`,
      text: criterion.text,
    }));
    return `<div data-learning-objective-title="${escapeAttribute(block.title)}" data-learning-objective-code="${escapeAttribute(block.curriculumCode)}" data-learning-objective-text="${escapeAttribute(block.objective)}" data-learning-objective-criteria="${escapeAttribute(encodeURIComponent(JSON.stringify(successCriteria)))}" data-type="learning-objective"></div>`;
  }
  if (block.type === 'ordering') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `ordering-${index + 1}`,
      text: item.text,
    }));
    return `<div data-ordering-instruction="${escapeAttribute(block.instruction)}" data-ordering-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-ordering-shuffle="${block.shuffleItems}" data-ordering-generation="${block.generation}" data-ordering-show-random-example="${block.showRandomAsExample}" data-type="ordering"></div>`;
  }
  if (block.type === 'frayerModel') {
    const quadrants = escapeAttribute(
      encodeURIComponent(JSON.stringify(block.quadrants)),
    );
    return `<div data-frayer-instruction="${escapeAttribute(block.instruction)}" data-frayer-concept="${escapeAttribute(block.concept)}" data-frayer-quadrants="${quadrants}" data-frayer-response-lines="${block.responseLines}" data-frayer-show-model-answers="${block.showModelAnswers}" data-type="frayer-model"></div>`;
  }
  if (block.type === 'occupationPortrait') {
    const paragraphs = escapeAttribute(
      encodeURIComponent(JSON.stringify(block.paragraphs)),
    );
    return `<div data-profession="${escapeAttribute(block.profession)}" data-title="${escapeAttribute(block.title)}" data-paragraphs="${paragraphs}" data-source-url="${escapeAttribute(block.sourceUrl)}" data-proficiency-level="${escapeAttribute(block.proficiencyLevel)}" data-proficiency-phase="${escapeAttribute(block.proficiencyPhase)}" data-text-type="${block.textType}" data-type="occupation-portrait"></div>`;
  }
  if (block.type === 'errorCorrection') {
    const markup = escapeAttribute(encodeURIComponent(block.markup));
    const errors = escapeAttribute(encodeURIComponent(JSON.stringify(
      block.errors.map((error, index) => ({
        ...error,
        id: error.id ?? `error-correction-${index + 1}`,
      })),
    )));
    return `<div data-error-correction-instruction="${escapeAttribute(block.instruction)}" data-error-correction-language="${block.language}" data-error-correction-markup="${markup}" data-error-correction-incorrect="${escapeAttribute(block.incorrectText)}" data-error-correction-correct="${escapeAttribute(block.correctText)}" data-error-correction-errors="${errors}" data-error-correction-mark-errors="${block.markErrorPositions}" data-error-correction-lines="${block.correctionLines}" data-type="error-correction"></div>`;
  }
  if (block.type === 'letterNode') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `letter-item-${index + 1}`,
      clue: item.clue,
      answer: item.answer,
    }));
    return `<div data-letter-instruction="${escapeAttribute(block.instruction)}" data-letter-alphabet-choice="${block.alphabetChoice}" data-letter-alphabet="${escapeAttribute(block.alphabet)}" data-letter-helpers="${escapeAttribute(block.helperLetters)}" data-letter-key-columns="${block.keyColumns}" data-letter-cell-height="${block.cellHeight}" data-letter-show-key="${block.showKey}" data-letter-item-numbers="${block.showItemNumbers}" data-letter-show-example="${block.showFirstAsExample}" data-letter-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-type="letter-node"></div>`;
  }
  if (block.type === 'dateMatching') {
    const dates = escapeAttribute(encodeURIComponent(JSON.stringify(block.dates)));
    const rightOrder = escapeAttribute(encodeURIComponent(JSON.stringify(block.rightOrder)));
    return `<div data-instruction="${escapeAttribute(block.instruction)}" data-left-representation="${block.leftRepresentation}" data-right-representation="${block.rightRepresentation}" data-dates="${dates}" data-right-order="${rightOrder}" data-type="date-matching"></div>`;
  }
  if (block.type === 'twoWayPrepositions') {
    const items = escapeAttribute(encodeURIComponent(JSON.stringify(block.items)));
    return `<div data-instruction="${escapeAttribute(block.instruction)}" data-mode="${block.mode}" data-show-vocabulary="${block.showVocabulary}" data-items="${items}" data-type="two-way-prepositions"></div>`;
  }
  if (block.type === 'weather') {
    const items = escapeAttribute(encodeURIComponent(JSON.stringify(block.items)));
    const questionOrder = escapeAttribute(encodeURIComponent(JSON.stringify(block.questionOrder)));
    const weatherKinds = block.weatherKinds == null
      ? ''
      : ` data-weather-kinds="${escapeAttribute(encodeURIComponent(JSON.stringify(block.weatherKinds)))}"`;
    const minTemperature = block.minTemperature == null
      ? ''
      : ` data-min-temperature="${block.minTemperature}"`;
    const maxTemperature = block.maxTemperature == null
      ? ''
      : ` data-max-temperature="${block.maxTemperature}"`;
    const shuffleQuestions = block.shuffleQuestions == null
      ? ''
      : ` data-shuffle-questions="${block.shuffleQuestions}"`;
    return `<div data-instruction="${escapeAttribute(block.instruction)}" data-mode="${block.mode}" data-items="${items}" data-question-order="${questionOrder}" data-show-instruction="${block.showInstruction}"${weatherKinds}${minTemperature}${maxTemperature}${shuffleQuestions} data-vary-weekday-city="${block.varyWeekdayAndCity}" data-type="weather"></div>`;
  }
  if (block.type === 'familyKinship') {
    const riddles = block.riddles.map((riddle, riddleIndex) => ({
      ...riddle,
      id: riddle.id ?? `kinship-${riddleIndex + 1}`,
      options: riddle.options.map((option, optionIndex) => ({
        ...option,
        id: option.id ?? `kinship-${riddleIndex + 1}-option-${optionIndex + 1}`,
      })),
    }));
    const instruction = block.instruction
      ? ` data-block-instruction="${escapeAttribute(block.instruction)}"`
      : '';
    return `<div${instruction} data-family-kinship-riddles="${escapeAttribute(encodeURIComponent(JSON.stringify(riddles)))}" data-family-kinship-show-first-example="${block.showFirstAsExample}" data-type="family-kinship"></div>`;
  }
  if (block.type === 'inlineChoice') {
    const items = block.items.map((item, index) => ({
      ...item,
      id: item.id ?? `inline-choice-${item.type}-${index + 1}`,
    }));
    return `<div data-inline-choice-instruction="${escapeAttribute(block.instruction)}" data-inline-choice-shuffle="${block.shuffleChoices}" data-inline-choice-show-example="${block.showFirstAsExample}" data-inline-choice-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-type="inline-choice"></div>`;
  }
  if (block.type === 'miniForm') {
    const items = block.items.map((item, index) => ({
      ...item,
      id: item.id ?? `mini-form-item-${index + 1}`,
    }));
    const fields = escapeAttribute(encodeURIComponent(JSON.stringify(block.fields)));
    const encodedItems = escapeAttribute(encodeURIComponent(JSON.stringify(items)));
    return `<div data-mini-form-instruction="${escapeAttribute(block.instruction)}" data-mini-form-fields="${fields}" data-mini-form-columns="${block.columns}" data-mini-form-fill-remaining-row="${block.fillRemainingRow}" data-mini-form-show-example="${block.showFirstAsExample}" data-mini-form-items="${encodedItems}" data-type="mini-form"></div>`;
  }
  if (block.type === 'mch') {
    const instruction = block.instruction
      ? ` data-block-instruction="${escapeAttribute(block.instruction)}"`
      : '';
    const options = escapeAttribute(encodeURIComponent(JSON.stringify(block.options)));
    const rows = escapeAttribute(encodeURIComponent(JSON.stringify(block.rows)));
    return `<div${instruction} data-mch-question="${escapeAttribute(block.question)}" data-mch-options="${options}" data-mch-rows="${rows}" data-mch-show-first-example="${block.showFirstAsExample}" data-type="mch"></div>`;
  }
  if (block.type === 'mediaLayout') {
    const items = block.items.map((item, index) => ({
      ...item,
      id: item.id ?? `media-item-${index + 1}`,
    }));
    return `<div data-media-layout="${block.layout}" data-media-columns="${block.columns}" data-media-image-width="${block.imageWidth}" data-media-gap="${block.gap}" data-media-aspect="${block.aspectRatio}" data-media-fit="${block.fit}" data-media-radius="${block.radius}" data-media-border="${block.border}" data-media-maximize="${block.maximize}" data-media-captions="${block.showCaptions}" data-media-caption-size="${block.captionSize}" data-media-caption-style="${block.captionStyle}" data-media-text="${escapeAttribute(encodeURIComponent(block.text))}" data-media-text-vertical="${block.textVertical}" data-media-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-type="media-layout"></div>`;
  }
  if (block.type === 'colorFurniture') {
    const items = escapeAttribute(encodeURIComponent(JSON.stringify(block.items)));
    return `<div data-instruction="${escapeAttribute(block.instruction)}" data-mode="${block.mode}" data-items="${items}" data-item-start="0" data-show-instruction="true" data-show-cards="true" data-show-tasks="true" data-pagination-part="combined" data-type="color-furniture"></div>`;
  }
  if (block.type === 'dictationLines') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `dictation-line-${index + 1}`,
      text: item.text,
    }));
    return `<div data-dictation-lines-items="${escapeAttribute(JSON.stringify(items))}" data-dictation-lines-variant="${block.variant}" data-dictation-lines-two-columns="${block.twoColumns}" data-dictation-lines-per-item="${block.linesPerItem}" data-dictation-lines-height="${block.lineHeight}" data-dictation-lines-show-line-numbers="${block.showLineNumbers}" data-dictation-lines-audio="${escapeAttribute(JSON.stringify(block.audioTracks))}" data-dictation-lines-audio-playlist="${block.audioPlaylistUrl ? escapeAttribute(block.audioPlaylistUrl) : ''}" data-type="dictation-lines"></div>`;
  }
  if (block.type === 'alpharamaTerm') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `alpharama-term-${index + 1}`,
      image: item.image,
      alt: item.alt,
      term: item.term,
    }));
    return `<div data-alpharama-term-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-alpharama-term-page-break-between-items="${block.pageBreakBetweenItems}" data-type="alpharama-term"></div>`;
  }
  if (block.type === 'letterCloud') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `letter-cloud-item-${index + 1}`,
      word: item.word,
    }));
    return `<div data-letter-cloud-instruction="${escapeAttribute(block.instruction)}" data-letter-cloud-hide-instruction-badge="${block.hideInstructionBadge}" data-letter-cloud-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-letter-cloud-item-numbers="${block.showItemNumbers}" data-letter-cloud-columns="${block.columns}" data-type="letter-cloud"></div>`;
  }
  if (block.type === 'anagram') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `anagram-item-${index + 1}`,
      clue: item.clue,
      answer: item.answer,
    }));
    return `<div data-anagram-instruction="${escapeAttribute(block.instruction)}" data-anagram-hide-instruction-badge="${block.hideInstructionBadge}" data-anagram-show-clues="${block.showClues}" data-anagram-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-anagram-item-numbers="${block.showItemNumbers}" data-anagram-show-first-as-example="${block.showFirstAsExample}" data-anagram-page-break-between-items="${block.pageBreakBetweenItems}" data-type="anagram-node"></div>`;
  }
  if (block.type === 'crossword') {
    return `<div data-crossword-instruction="${escapeAttribute(block.instruction)}" data-crossword-entries="${escapeAttribute(encodeURIComponent(JSON.stringify(block.entries)))}" data-crossword-layout-seed="${block.layoutSeed}" data-crossword-cell-size="${block.cellSize}" data-crossword-cell-aspect-ratio="${block.cellAspectRatio}" data-crossword-show-word-bank="${block.showWordBank}" data-type="crossword"></div>`;
  }
  if (block.type === 'richText') {
    // The node stores its markup URI-encoded; encodeURIComponent also escapes the
    // characters that would break out of the attribute.
    return `<div data-rich-text-html="${encodeURIComponent(block.html)}" data-rich-text-bypass-gap="${block.bypassGap}" data-type="rich-text"></div>`;
  }
  if (block.type === 'lesetraining') {
    const audio = block.audio ? encodeURIComponent(JSON.stringify(block.audio)) : '';
    return `<div data-lesetraining-html="${encodeURIComponent(block.html)}" data-lesetraining-bypass-gap="${block.bypassGap}" data-lesetraining-audio="${escapeAttribute(audio)}" data-type="lesetraining"></div>`;
  }
  if (block.type === 'worksheetTable') {
    const columns = escapeAttribute(encodeURIComponent(JSON.stringify(block.columns)));
    const rows = escapeAttribute(encodeURIComponent(JSON.stringify(block.rows)));
    return `<div data-type="worksheet-table" data-worksheet-table-instruction="${escapeAttribute(block.instruction)}" data-worksheet-table-show-instruction="${block.showInstruction}" data-worksheet-table-hide-instruction-badge="${block.hideInstructionBadge}" data-worksheet-table-columns="${columns}" data-worksheet-table-rows="${rows}" data-worksheet-table-show-header="${block.showHeader}" data-worksheet-table-hide-blank-numbers="${block.hideBlankNumbers}" data-worksheet-table-blank-width="${block.blankWidthFactor}" data-worksheet-table-show-first-example="${block.showFirstAsExample}"></div>`;
  }
  if (block.type === 'informationGapActivity') {
    const activityId = crypto.randomUUID();
    const columns = escapeAttribute(encodeURIComponent(JSON.stringify(block.columns)));
    const rows = escapeAttribute(encodeURIComponent(JSON.stringify(block.rows)));
    const sheet = (partner: 'A' | 'B') => `<div data-type="information-gap-activity" data-activity-id="${activityId}" data-title="${escapeAttribute(block.title)}" data-partner="${partner}" data-columns="${columns}" data-rows="${rows}"></div>`;
    return `${sheet('A')}<div data-restart-pagination="false" data-type="pageBreak"></div>${sheet('B')}`;
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
      hideInstructionBadge: block.hideInstructionBadge,
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
  if (block.type === 'rewriteSentences') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `rewrite-${index + 1}`,
      input: item.input,
      solution: item.solution,
      image: item.image,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-rewrite-sentence-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-rewrite-show-instruction="${block.showInstruction}" data-rewrite-show-first-example="${block.showFirstAsExample}" data-type="rewrite-sentences"></div>`;
  }
  if (block.type === 'sortingCategories') {
    const categories = block.categories.map((category, index) => ({
      id: category.id ?? `category-${index + 1}`,
      title: category.title,
    }));
    const items = block.items.map((item, index) => ({
      id: item.id ?? `sorting-item-${index + 1}`,
      text: item.text,
      categoryId: item.categoryId,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-sorting-categories="${escapeAttribute(encodeURIComponent(JSON.stringify(categories)))}" data-sorting-category-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-sorting-color-coding="${block.colorCoding}" data-sorting-show-first-example="${block.showFirstAsExample}" data-type="sorting-categories"></div>`;
  }
  if (block.type === 'chooseCorrectWords') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `correct-word-${index + 1}`,
      word: item.word,
      optionCount: item.optionCount,
    }));
    return `<div data-choose-correct-instruction="${escapeAttribute(block.instruction)}" data-choose-correct-keep-left="${block.keepLeft}" data-choose-correct-keep-right="${block.keepRight}" data-choose-correct-show-example="${block.showFirstAsExample}" data-choose-correct-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-choose-correct-generation="${block.generation}" data-type="choose-correct-words"></div>`;
  }
  if (block.type === 'fillInTheBlank') {
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-fill-blank-title="${escapeAttribute(block.title)}" data-fill-blank-text="${escapeAttribute(block.items.join('\n'))}" data-fill-blank-distractors="${escapeAttribute(JSON.stringify(block.distractors))}" data-fill-blank-width-factor="${block.widthFactor}" data-fill-blank-show-instruction="${block.showInstruction}" data-fill-blank-hide-instruction-badge="${block.hideInstructionBadge}" data-fill-blank-hide-numbers="${block.hideBlankNumbers}" data-fill-blank-hide-item-numbers="${block.hideItemNumbers}" data-fill-blank-show-line-numbers="${block.showLineNumbers}" data-fill-blank-empty-line-spacers="${block.renderEmptyLinesAsSpacerRows}" data-fill-blank-show-word-bank="${block.showWordBank}" data-fill-blank-show-first-example="${block.showFirstAsExample}" data-type="fill-in-the-blank"></div>`;
  }
  if (block.type === 'dialogue') {
    const items = block.items.map((item, index) => ({
      id: `dialogue-${index + 1}`,
      speaker: item.speaker,
      text: item.text,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-dialogue-items="${escapeAttribute(encodeURIComponent(JSON.stringify(items)))}" data-dialogue-speaker-names="${escapeAttribute(encodeURIComponent(JSON.stringify(block.speakerNames)))}" data-dialogue-show-instruction="${block.showInstruction}" data-dialogue-hide-instruction-badge="${block.hideInstructionBadge}" data-dialogue-show-speaker-names="${block.showSpeakerNames}" data-dialogue-show-original="${block.showOriginal}" data-dialogue-show-word-bank="${block.showWordBank}" data-dialogue-hide-blank-numbers="${block.hideBlankNumbers}" data-dialogue-show-first-example="${block.showFirstAsExample}" data-dialogue-context="${escapeAttribute(encodeURIComponent(block.context))}" data-type="dialogue"></div>`;
  }
  if (block.type === 'messenger') {
    const messages = block.messages.map((message, index) => ({
      id: `messenger-message-${index + 1}`,
      ...message,
    }));
    return `<div data-contact-name="${escapeAttribute(encodeURIComponent(block.contactName))}" data-status="${escapeAttribute(encodeURIComponent(block.status))}" data-messages="${escapeAttribute(encodeURIComponent(JSON.stringify(messages)))}" data-type="messenger"></div>`;
  }
  if (block.type === 'email') {
    return `<div data-from-name="${escapeAttribute(encodeURIComponent(block.fromName))}" data-from-address="${escapeAttribute(encodeURIComponent(block.fromAddress))}" data-to="${escapeAttribute(encodeURIComponent(block.to))}" data-date="${escapeAttribute(encodeURIComponent(block.date))}" data-subject="${escapeAttribute(encodeURIComponent(block.subject))}" data-body="${escapeAttribute(encodeURIComponent(block.body))}" data-attachment-type="${block.attachmentType}" data-attachment-name="${escapeAttribute(encodeURIComponent(block.attachmentName))}" data-type="email"></div>`;
  }
  if (block.type === 'timetable') {
    const rows = block.rows.map((row, index) => ({
      ...row,
      id: row.id ?? `timetable-row-${index + 1}`,
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-show-instruction="${block.showInstruction}" data-hide-instruction-badge="${block.hideInstructionBadge}" data-destination-label="${escapeAttribute(encodeURIComponent(block.destinationLabel))}" data-platform-label="${escapeAttribute(encodeURIComponent(block.platformLabel))}" data-notice-label="${escapeAttribute(encodeURIComponent(block.noticeLabel))}" data-footer="${escapeAttribute(encodeURIComponent(block.footer))}" data-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(rows)))}" data-type="timetable"></div>`;
  }
  if (block.type === 'openingHours') {
    const signs = block.signs.map((sign, signIndex) => ({
      ...sign,
      id: sign.id ?? `opening-hours-sign-${signIndex + 1}`,
      rows: sign.rows.map((row, rowIndex) => ({
        ...row,
        id: row.id ?? `opening-hours-row-${signIndex + 1}-${rowIndex + 1}`,
      })),
    }));
    return `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-show-instruction="${block.showInstruction}" data-hide-instruction-badge="${block.hideInstructionBadge}" data-signs="${escapeAttribute(encodeURIComponent(JSON.stringify(signs)))}" data-type="opening-hours"></div>`;
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
    const questionNumber = block.questionNumber === null
      ? ''
      : ` data-mcq-question-number="${block.questionNumber}"`;
    return `<div data-mcq-instruction="${escapeAttribute(block.instruction)}" data-mcq-block-question="${escapeAttribute(encodeURIComponent(block.blockQuestion))}" data-mcq-questions="${escapeAttribute(encodeURIComponent(JSON.stringify(questions)))}" data-mcq-columns="${block.columns}" data-mcq-shuffle-answers="${block.shuffleAnswers}" data-mcq-show-instruction="${block.showInstruction}" data-mcq-hide-instruction-badge="${block.hideInstructionBadge}"${questionNumber} data-type="mcq"></div>`;
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
      `<div data-block-instruction="${escapeAttribute(block.instruction)}" data-article-plural-hide-instruction-badge="${block.hideInstructionBadge}" data-article-plural-rows="${escapeAttribute(encodeURIComponent(JSON.stringify(chunk)))}" data-article-plural-order="${block.order}" data-article-plural-shuffle-seed="${block.shuffleSeed}" data-article-plural-show-additional-blank-items="${block.showAdditionalBlankItems}" data-article-plural-show-plural-column="${block.showPluralColumn}" data-article-plural-continuation="${block.continuation || index > 0}" data-article-plural-row-number-offset="${block.rowNumberOffset + index * 22}" data-type="article-plural"></div>`
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
  if (block.type === 'articlePluralCards') {
    const items = block.items.map((item, index) => ({
      id: item.id ?? `article-plural-card-${index + 1}`,
      article: item.article,
      singular: item.singular,
      plural: item.plural,
    }));
    const groupCount = Math.ceil(items.length / LEARNING_CARDS_PER_GROUP);
    const encodedItems = escapeAttribute(encodeURIComponent(JSON.stringify(items)));
    const sheets = Array.from({ length: groupCount }, (_, groupIndex) => (
      ([
        `<div data-title="${escapeAttribute(block.title)}" data-format="a8-landscape" data-sidedness="double" data-items="${encodedItems}" data-group-index="${groupIndex}" data-sheet-side="front" data-type="article-plural-cards"></div>`,
        `<div data-title="${escapeAttribute(block.title)}" data-format="a8-landscape" data-sidedness="double" data-items="${encodedItems}" data-group-index="${groupIndex}" data-sheet-side="back" data-type="article-plural-cards"></div>`,
      ])
    )).flat();
    return sheets.join('<div data-restart-pagination="false" data-type="pageBreak"></div>');
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
  return `<div data-glossary-terms="${escapeAttribute(encodeURIComponent(JSON.stringify(terms)))}" data-glossary-term-width="${widths.term}" data-glossary-definition-width="${widths.definition}" data-glossary-additional-width="${additionalWidth}" data-glossary-preset="${block.preset}" data-glossary-header-labels="${escapeAttribute(encodeURIComponent(JSON.stringify(headerLabels)))}" data-glossary-show-instruction="${block.showInstruction}" data-glossary-hide-instruction-badge="${block.hideInstructionBadge}" data-glossary-show-column-headers="${block.showColumnHeaders}" data-glossary-show-definition-column="${block.showDefinitionColumn}" data-glossary-show-example="${block.showExample}" data-glossary-show-additional-column="${block.showAdditionalColumn}"${instruction} data-type="glossary-terms"></div>`;
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
