import { cache } from 'react';
import { getDazitHomepageStatsFromDb, getFamilyWorksheetCardsFromDb, getPublishedWorksheetBySlugFromDb, getPublishedWorksheetCardsFromDb, getPublishedWorksheetsFromDb, getRelatedWorksheetCardsFromDb } from '@/lib/db';
import type { DazitHomepageStatsRow, DazitPublicationCardRow, DazitPublicationRelationship, DazitPublicationRow } from '@/lib/db';

export type Subject = 'A1.1' | 'Language' | 'Science' | 'Humanities' | 'Arts' | 'PE & health';

export type Worksheet = {
  slug: string;
  title: string;
  description: string;
  searchSnippet?: string;
  subject: Subject;
  grade: string;
  documentType:
    | 'Worksheet'
    | 'Game'
    | 'Card set'
    | 'Arbeitsblatt'
    | 'Merkblatt'
    | 'Verbtabelle'
    | 'Deklinationstabelle'
    | 'Kommunikationskarten'
    | 'Lernkarten'
    | 'Wechselspiel'
    | 'Domino'
    | 'Dialog'
    | 'Wörterliste'
    | 'Leseverstehen';
  pages: number;
  language: 'Deutsch für die Schweiz' | 'Deutsch' | 'French' | 'Italian' | 'English';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  downloads: string;
  hasAnswerKey: boolean;
  size: string;
  added: string;
  color: 'lavender' | 'peach' | 'blue' | 'blue-light' | 'green' | 'green-light' | 'orange' | 'orange-light' | 'mint' | 'yellow' | 'pink';
  tags: string[];
  pdfUrl?: string;
  answerKeyPdfUrl?: string;
  blobPath?: string;
  answerKeyBlobPath?: string;
  thumbnailPaths?: string[];
  thumbnailUrls?: string[];
  publishedAt?: string;
  worksheetId?: string;
  descriptionHtml?: string;
  level?: string;
  learnerStage?: string;
  actionCompetencies?: string[];
  languageCompetencies?: string[];
  grammarTags?: string[];
  actionCompetencyContributionHtml?: string;
  actionField?: string;
  format?: string;
  ageGroups?: string[];
  relationships?: DazitPublicationRelationship[];
};

function formatSize(bytes = 0) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatPublishedDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

function buildThumbnailUrl(path: string, worksheetId: string | undefined, page: number, updatedAt: string) {
  const params = new URLSearchParams({
    path,
    v: String(new Date(updatedAt).getTime() || 0),
  });
  return `/api/thumbnail/${encodeURIComponent(worksheetId || 'unknown')}/${page}?${params.toString()}`;
}

function rowLanguage(context: Record<string, unknown> | null): Worksheet['language'] {
  const raw = typeof context?.contentLanguage === 'string'
    ? context.contentLanguage
    : typeof context?.worksheetLanguage === 'string'
      ? context.worksheetLanguage
      : 'German';
  if (/de[-_ ]?ch/i.test(raw) || /schweiz/i.test(raw)) return 'Deutsch für die Schweiz';
  if (/fr/i.test(raw)) return 'French';
  if (/it/i.test(raw)) return 'Italian';
  if (/en/i.test(raw)) return 'English';
  return 'Deutsch';
}

function rowDifficulty(level: string | null): Worksheet['difficulty'] {
  if (level && /b1|b2|intermediate/i.test(level)) return 'Intermediate';
  if (level && /c1|c2|advanced/i.test(level)) return 'Advanced';
  return 'Basic';
}

function rowFormat(documentSize: string): string | undefined {
  if (documentSize === 'a5-landscape') return 'PDF · A4 druckfertig · 2 x A5';
  if (documentSize === 'letter-portrait' || documentSize === 'letter-landscape') {
    return 'PDF · US Letter druckfertig';
  }
  if (documentSize === 'a4-portrait' || documentSize === 'a4-landscape') {
    return 'PDF · A4 druckfertig';
  }
  return undefined;
}

function baseWorksheet(row: DazitPublicationCardRow | DazitPublicationRow): Worksheet | null {
  if (!row.slug || !row.title || !row.pdfPath) return null;
  const answerKeyBlobPath = row.answerKeyPdfPath && row.answerKeyPdfPath !== row.pdfPath
    ? row.answerKeyPdfPath
    : undefined;
  const subjects: Subject[] = ['A1.1', 'Language', 'Science', 'Humanities', 'Arts', 'PE & health'];
  const documentTypes: Worksheet['documentType'][] = [
    'Worksheet',
    'Game',
    'Card set',
    'Arbeitsblatt',
    'Merkblatt',
    'Verbtabelle',
    'Deklinationstabelle',
    'Kommunikationskarten',
    'Lernkarten',
    'Wechselspiel',
    'Domino',
    'Dialog',
    'Wörterliste',
    'Leseverstehen',
  ];
  const subject = subjects.includes(row.level as Subject)
    ? row.level as Subject
    : 'Language';
  const publishedAt = new Date(row.publishedAt);
  return {
    slug: row.slug,
    title: row.title,
    description: row.excerpt || 'Druckfertiges Arbeitsblatt für den DaZ-Kurs.',
    subject,
    grade: row.level || '—',
    level: row.level || undefined,
    documentType: documentTypes.includes(row.documentType as Worksheet['documentType'])
      ? row.documentType as Worksheet['documentType']
      : 'Worksheet',
    pages: Math.max(1, row.pageCount || 1),
    language: rowLanguage(row.context),
    difficulty: rowDifficulty(row.level),
    downloads: String(row.downloads || 0),
    hasAnswerKey: Boolean(row.hasAnswerKey && answerKeyBlobPath),
    size: formatSize(row.sizeBytes),
    format: rowFormat(row.documentSize),
    added: Number.isNaN(publishedAt.getTime())
      ? '—'
      : formatPublishedDate(publishedAt),
    color: row.level === 'A1.1' ? 'blue-light'
      : row.level === 'A1.2' ? 'blue'
        : row.level === 'A2.1' ? 'green-light'
          : row.level === 'A2.2' ? 'green'
            : row.level === 'B1.1' ? 'orange-light'
              : row.level === 'B1.2' ? 'orange'
                : subject === 'Science' ? 'mint'
      : subject === 'Humanities' ? 'peach'
        : subject === 'Arts' ? 'pink'
          : subject === 'PE & health' ? 'yellow'
            : subject === 'A1.1' ? 'blue'
              : 'lavender',
    tags: Array.isArray(row.tags) ? row.tags : [],
    pdfUrl: `/api/download/${encodeURIComponent(row.slug)}`,
    answerKeyPdfUrl: answerKeyBlobPath ? `/api/download/${encodeURIComponent(row.slug)}?type=answer-key` : undefined,
    blobPath: row.pdfPath,
    answerKeyBlobPath,
    thumbnailPaths: row.thumbnailPaths || [],
    thumbnailUrls: (row.thumbnailPaths || []).map(
      (path, index) => buildThumbnailUrl(path, row.worksheetId, index + 1, row.updatedAt),
    ),
    publishedAt: Number.isNaN(publishedAt.getTime()) ? undefined : publishedAt.toISOString(),
    worksheetId: row.worksheetId,
  };
}

function publishedWorksheet(row: DazitPublicationRow): Worksheet | null {
  const base = baseWorksheet(row);
  if (!base) return null;
  return {
    ...base,
    searchSnippet: row.searchSnippet || undefined,
    descriptionHtml: row.descriptionHtml || undefined,
    level: row.level || undefined,
    learnerStage: typeof row.context?.learnerStage === 'string'
      ? row.context.learnerStage
      : undefined,
    actionCompetencies: Array.isArray(row.actionCompetencies) ? row.actionCompetencies : [],
    languageCompetencies: Array.isArray(row.languageCompetencies) ? row.languageCompetencies : [],
    grammarTags: Array.isArray(row.grammarTags) ? row.grammarTags : [],
    actionCompetencyContributionHtml: row.actionCompetencyContributionHtml || undefined,
    actionField: row.actionField || undefined,
    ageGroups: Array.isArray(row.context?.ageGroups) ? row.context.ageGroups : [],
  };
}

function publishedWorksheetCard(row: DazitPublicationCardRow): Worksheet | null {
  const base = baseWorksheet(row);
  if (!base) return null;
  return {
    ...base,
    searchSnippet: row.searchSnippet || undefined,
    actionCompetencies: Array.isArray(row.actionCompetencies) ? row.actionCompetencies : [],
    languageCompetencies: Array.isArray(row.languageCompetencies) ? row.languageCompetencies : [],
    grammarTags: Array.isArray(row.grammarTags) ? row.grammarTags : [],
    actionField: row.actionField || undefined,
  };
}

async function loadWorksheetCards() {
  try {
    const rows = await getPublishedWorksheetCardsFromDb();
    return rows
      .map((row) => publishedWorksheetCard(row))
      .filter((item): item is Worksheet => item !== null);
  } catch (error) {
    console.error('Could not load Dazit publication cards from the database.', error);
    return [];
  }
}

async function loadWorksheets() {
  try {
    const rows = await getPublishedWorksheetsFromDb();
    return rows
      .map((row) => publishedWorksheet(row))
      .filter((item): item is Worksheet => item !== null);
  } catch (error) {
    console.error('Could not load Dazit publications from the database.', error);
    return [];
  }
}

async function loadHomepageStats() {
  try {
    return await getDazitHomepageStatsFromDb();
  } catch (error) {
    console.error('Could not load Dazit homepage stats from the database.', error);
    return {
      total: 0,
      levelCounts: {},
      typeCounts: {},
    } satisfies DazitHomepageStatsRow;
  }
}

async function loadWorksheetBySlug(slug: string) {
  try {
    const row = await getPublishedWorksheetBySlugFromDb(slug);
    if (!row) return null;
    return publishedWorksheet(row);
  } catch (error) {
    console.error('Could not load Dazit publication by slug from the database.', error);
    return null;
  }
}

async function loadFamilyWorksheetCards(worksheetId: string) {
  try {
    const rows = await getFamilyWorksheetCardsFromDb(worksheetId);
    return rows
      .map((row) => publishedWorksheetCard(row))
      .filter((item): item is Worksheet => item !== null);
  } catch (error) {
    console.error('Could not load Dazit family publication cards from the database.', error);
    return [];
  }
}

async function loadRelatedWorksheetCards(
  slug: string,
  level: string | undefined,
  documentType: Worksheet['documentType'],
  limit: number,
) {
  try {
    const rows = await getRelatedWorksheetCardsFromDb(slug, level, documentType, limit);
    return rows
      .map((row) => publishedWorksheetCard(row))
      .filter((item): item is Worksheet => item !== null);
  } catch (error) {
    console.error('Could not load Dazit related publication cards from the database.', error);
    return [];
  }
}

export const getWorksheetCards = cache(loadWorksheetCards);
export const getWorksheets = cache(loadWorksheets);
export const getHomepageStats = cache(loadHomepageStats);
export const getWorksheetBySlug = cache(loadWorksheetBySlug);
export const getFamilyWorksheetCards = cache(loadFamilyWorksheetCards);
export const getRelatedWorksheetCards = cache(loadRelatedWorksheetCards);

export async function worksheetBySlug(slug: string) {
  const worksheet = await getWorksheetBySlug(slug);
  if (worksheet) return worksheet;
  return (await getWorksheets()).find((item) => item.slug === slug);
}
