import { cache } from 'react';
import { getDazitHomepageStatsFromDb, getPublishedWorksheetCardsFromDb, getPublishedWorksheetsFromDb } from '@/lib/db';
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
    | 'Lernkarten'
    | 'Domino'
    | 'Dialog'
    | 'Leseverstehen';
  pages: number;
  language: 'German' | 'French' | 'Italian' | 'English';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  downloads: string;
  hasAnswerKey: boolean;
  size: string;
  added: string;
  color: 'lavender' | 'peach' | 'blue' | 'blue-light' | 'green' | 'green-light' | 'orange' | 'orange-light' | 'mint' | 'yellow' | 'pink';
  tags: string[];
  pdfUrl?: string;
  blobPath?: string;
  thumbnailPaths?: string[];
  thumbnailUrls?: string[];
  publishedAt?: string;
  worksheetId?: string;
  descriptionHtml?: string;
  level?: string;
  actionCompetencies?: string[];
  languageCompetencies?: string[];
  actionCompetencyContributionHtml?: string;
  actionField?: string;
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

function rowLanguage(context: Record<string, unknown> | null): Worksheet['language'] {
  const raw = typeof context?.contentLanguage === 'string'
    ? context.contentLanguage
    : typeof context?.worksheetLanguage === 'string'
      ? context.worksheetLanguage
      : 'German';
  if (/fr/i.test(raw)) return 'French';
  if (/it/i.test(raw)) return 'Italian';
  if (/en/i.test(raw)) return 'English';
  return 'German';
}

function rowDifficulty(level: string | null): Worksheet['difficulty'] {
  if (level && /b1|b2|intermediate/i.test(level)) return 'Intermediate';
  if (level && /c1|c2|advanced/i.test(level)) return 'Advanced';
  return 'Basic';
}

function baseWorksheet(row: DazitPublicationCardRow | DazitPublicationRow): Worksheet | null {
  if (!row.slug || !row.title || !row.pdfPath) return null;
  const subjects: Subject[] = ['A1.1', 'Language', 'Science', 'Humanities', 'Arts', 'PE & health'];
  const documentTypes: Worksheet['documentType'][] = [
    'Worksheet',
    'Game',
    'Card set',
    'Arbeitsblatt',
    'Merkblatt',
    'Verbtabelle',
    'Deklinationstabelle',
    'Lernkarten',
    'Domino',
    'Dialog',
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
    hasAnswerKey: Boolean(row.showSolutions),
    size: formatSize(row.sizeBytes),
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
    blobPath: row.pdfPath,
    thumbnailPaths: row.thumbnailPaths || [],
    thumbnailUrls: row.worksheetId
      ? (row.thumbnailPaths || []).map(
        (_, index) => `/api/thumbnail/${encodeURIComponent(row.worksheetId)}/${index + 1}?v=${row.updatedAt ? new Date(row.updatedAt).getTime() : 0}`,
      )
      : [],
    publishedAt: row.publishedAt,
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
    actionCompetencies: Array.isArray(row.actionCompetencies) ? row.actionCompetencies : [],
    languageCompetencies: Array.isArray(row.languageCompetencies) ? row.languageCompetencies : [],
    actionCompetencyContributionHtml: row.actionCompetencyContributionHtml || undefined,
    actionField: row.actionField || undefined,
  };
}

function publishedWorksheetCard(row: DazitPublicationCardRow): Worksheet | null {
  return baseWorksheet(row);
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

export const getWorksheetCards = cache(loadWorksheetCards);
export const getWorksheets = cache(loadWorksheets);
export const getHomepageStats = cache(loadHomepageStats);

export async function worksheetBySlug(slug: string) {
  return (await getWorksheets()).find((worksheet) => worksheet.slug === slug);
}
