export const WORKSHEET_STATUSES = ['draft', 'published'] as const;
export const WORKSHEET_DOCUMENT_SIZES = [
  'a4-portrait',
  'a4-landscape',
  'a5-landscape',
  'letter-portrait',
  'letter-landscape',
] as const;

export type WorksheetStatus = typeof WORKSHEET_STATUSES[number];
export type WorksheetDocumentSize = typeof WORKSHEET_DOCUMENT_SIZES[number];

export type WorksheetContext = {
  worksheetLanguage: 'en' | 'de-formal' | 'de-informal';
  worksheetType:
    | 'worksheet'
    | 'fact-sheet'
    | 'verb-table'
    | 'declension-table'
    | 'communication-cards'
    | 'learning-cards'
    | 'domino';
  sourceProfileId: string | null;
  subject: string;
  customSubject: string;
  learnerStage: string;
  ageGroups: string[];
  ageMin: number | null;
  ageMax: number | null;
  contentLanguage: string;
  // Document-level list of translation target language codes (e.g. ['fr', 'en']).
  translationLanguages: string[];
  country: string;
  localLevel: string;
  curriculum: string;
  languageLevel: string;
  actionField: string;
  actionCompetencies: string[];
  languageCompetencies: string[];
  learnerContext: string;
  contextPdfName: string;
  contextPdfText: string;
  contextPdfPageCount: number | null;
};

export const EMPTY_WORKSHEET_CONTEXT: WorksheetContext = {
  worksheetLanguage: 'de-formal',
  worksheetType: 'worksheet',
  sourceProfileId: null,
  subject: 'daz',
  customSubject: '',
  learnerStage: 'professional-training',
  ageGroups: ['adults'],
  ageMin: null,
  ageMax: null,
  contentLanguage: 'de-CH',
  translationLanguages: [],
  country: '',
  localLevel: '',
  curriculum: '',
  languageLevel: '',
  actionField: '',
  actionCompetencies: [],
  languageCompetencies: [],
  learnerContext: '',
  contextPdfName: '',
  contextPdfText: '',
  contextPdfPageCount: null,
};

export type Worksheet = {
  id: string;
  ownerUserId: string | null;
  folderId: string | null;
  brandProfileId: string | null;
  brandProfileName: string | null;
  title: string;
  contentHtml: string;
  documentSize: WorksheetDocumentSize;
  showSolutions: boolean;
  context: WorksheetContext;
  status: WorksheetStatus;
  hasPreview: boolean;
  previewUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceRevision: number;
};

export type WorksheetPatch = Partial<Pick<
  Worksheet,
  | 'title'
  | 'contentHtml'
  | 'documentSize'
  | 'showSolutions'
  | 'context'
  | 'status'
  | 'brandProfileId'
  | 'folderId'
>>;

export type WorksheetFolder = {
  id: string;
  ownerUserId: string;
  parentId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string;
};
