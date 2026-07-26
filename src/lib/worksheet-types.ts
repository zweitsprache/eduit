export const WORKSHEET_STATUSES = ['draft', 'published'] as const;
export const WORKSHEET_DOCUMENT_SIZES = [
  'a4-portrait',
  'a4-landscape',
  'letter-portrait',
  'letter-landscape',
] as const;

export type WorksheetStatus = typeof WORKSHEET_STATUSES[number];
export type WorksheetDocumentSize = typeof WORKSHEET_DOCUMENT_SIZES[number];

export type Worksheet = {
  id: string;
  ownerUserId: string | null;
  brandProfileId: string | null;
  brandProfileName: string | null;
  title: string;
  contentHtml: string;
  documentSize: WorksheetDocumentSize;
  showSolutions: boolean;
  status: WorksheetStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorksheetPatch = Partial<Pick<
  Worksheet,
  | 'title'
  | 'contentHtml'
  | 'documentSize'
  | 'showSolutions'
  | 'status'
  | 'brandProfileId'
>>;
