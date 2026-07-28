export const WORKSHEET_STATUSES = ['draft', 'published'] as const;
export const WORKSHEET_DOCUMENT_SIZES = [
  'a4-portrait',
  'a4-landscape',
  'letter-portrait',
  'letter-landscape',
] as const;

export type WorksheetStatus = typeof WORKSHEET_STATUSES[number];
export type WorksheetDocumentSize = typeof WORKSHEET_DOCUMENT_SIZES[number];

export type WorksheetContext = {
  worksheetLanguage: 'en' | 'de-formal' | 'de-informal';
  sourceProfileId: string | null;
  subject: string;
  customSubject: string;
  learnerStage: string;
  ageMin: number | null;
  ageMax: number | null;
  contentLanguage: string;
  country: string;
  localLevel: string;
  curriculum: string;
  languageLevel: string;
  learnerContext: string;
  contextPdfName: string;
  contextPdfText: string;
  contextPdfPageCount: number | null;
};

export const EMPTY_WORKSHEET_CONTEXT: WorksheetContext = {
  worksheetLanguage: 'en',
  sourceProfileId: null,
  subject: '',
  customSubject: '',
  learnerStage: '',
  ageMin: null,
  ageMax: null,
  contentLanguage: '',
  country: '',
  localLevel: '',
  curriculum: '',
  languageLevel: '',
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
