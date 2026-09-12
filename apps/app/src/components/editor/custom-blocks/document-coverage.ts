import type { CustomBlockRegistryType } from './registry';
import type { WorksheetDocumentBlockType } from '@/lib/worksheet-document-schema';

type CanonicalBlockCoverage = {
  status: 'canonical';
  documentType: WorksheetDocumentBlockType;
};

type MissingBlockCoverage = {
  status: 'missing';
};

type UiActionCoverage = {
  status: 'ui-action';
};

export type CustomBlockDocumentCoverage =
  | CanonicalBlockCoverage
  | MissingBlockCoverage
  | UiActionCoverage;

export const CUSTOM_BLOCK_DOCUMENT_COVERAGE = {
  jsonImport: { status: 'ui-action' },
  communicationCards: { status: 'canonical', documentType: 'communicationCards' },
  learningCards: { status: 'canonical', documentType: 'learningCards' },
  articlePluralCards: { status: 'canonical', documentType: 'articlePluralCards' },
  pageBreak: { status: 'canonical', documentType: 'pageBreak' },
  spacer: { status: 'canonical', documentType: 'spacer' },
  writingLines: { status: 'canonical', documentType: 'writingLines' },
  dictationLines: { status: 'canonical', documentType: 'dictationLines' },
  alpharamaTerm: { status: 'canonical', documentType: 'alpharamaTerm' },
  customHeading: { status: 'canonical', documentType: 'heading' },
  richText: { status: 'canonical', documentType: 'richText' },
  messenger: { status: 'canonical', documentType: 'messenger' },
  email: { status: 'canonical', documentType: 'email' },
  timetable: { status: 'canonical', documentType: 'timetable' },
  openingHours: { status: 'canonical', documentType: 'openingHours' },
  wordBank: { status: 'canonical', documentType: 'wordBank' },
  instructionBlock: { status: 'canonical', documentType: 'instruction' },
  mediaLayout: { status: 'canonical', documentType: 'mediaLayout' },
  letterNode: { status: 'canonical', documentType: 'letterNode' },
  anagramNode: { status: 'canonical', documentType: 'anagram' },
  letterCloud: { status: 'canonical', documentType: 'letterCloud' },
  lesetraining: { status: 'canonical', documentType: 'lesetraining' },
  crossword: { status: 'canonical', documentType: 'crossword' },
  errorCorrection: { status: 'canonical', documentType: 'errorCorrection' },
  mcq: { status: 'canonical', documentType: 'mcq' },
  mcm: { status: 'canonical', documentType: 'mcm' },
  mch: { status: 'canonical', documentType: 'mch' },
  articlePlural: { status: 'canonical', documentType: 'articlePlural' },
  matchingPairs: { status: 'canonical', documentType: 'matchingPairs' },
  domino: { status: 'canonical', documentType: 'domino' },
  timeMatching: { status: 'canonical', documentType: 'timeMatching' },
  dateMatching: { status: 'canonical', documentType: 'dateMatching' },
  twoWayPrepositions: { status: 'canonical', documentType: 'twoWayPrepositions' },
  weather: { status: 'canonical', documentType: 'weather' },
  colorFurniture: { status: 'canonical', documentType: 'colorFurniture' },
  familyKinship: { status: 'canonical', documentType: 'familyKinship' },
  germanVerbTable: { status: 'canonical', documentType: 'germanVerbTable' },
  declinationTable: { status: 'canonical', documentType: 'declinationTable' },
  occupationPortrait: { status: 'canonical', documentType: 'occupationPortrait' },
  trueFalse: { status: 'canonical', documentType: 'trueFalse' },
  fillInTheBlank: { status: 'canonical', documentType: 'fillInTheBlank' },
  glossaryTerms: { status: 'canonical', documentType: 'glossary' },
  frayerModel: { status: 'canonical', documentType: 'frayerModel' },
  learningObjective: { status: 'canonical', documentType: 'learningObjective' },
  dialogue: { status: 'canonical', documentType: 'dialogue' },
  rewriteSentences: { status: 'canonical', documentType: 'rewriteSentences' },
  sortingCategories: { status: 'canonical', documentType: 'sortingCategories' },
  ordering: { status: 'canonical', documentType: 'ordering' },
  wordGrid: { status: 'canonical', documentType: 'wordGrid' },
  chooseCorrectWords: { status: 'canonical', documentType: 'chooseCorrectWords' },
  inlineChoice: { status: 'canonical', documentType: 'inlineChoice' },
  miniForm: { status: 'canonical', documentType: 'miniForm' },
  worksheetTable: { status: 'canonical', documentType: 'worksheetTable' },
  informationGapActivity: { status: 'canonical', documentType: 'informationGapActivity' },
} as const satisfies Record<
  CustomBlockRegistryType,
  CustomBlockDocumentCoverage
>;

export const MISSING_CANONICAL_CUSTOM_BLOCK_TYPES = (Object.entries(
  CUSTOM_BLOCK_DOCUMENT_COVERAGE,
) as Array<[
  CustomBlockRegistryType,
  CustomBlockDocumentCoverage,
]>).flatMap(([type, coverage]) => (
  coverage.status === 'missing' ? [type as CustomBlockRegistryType] : []
));