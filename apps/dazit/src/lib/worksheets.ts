import { get, list } from '@vercel/blob';
import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getPublicationMetadata } from '@/lib/db';
import type { DazitPublicationRelationship } from '@/lib/db';

export type Subject = 'A1.1' | 'Language' | 'Science' | 'Humanities' | 'Arts' | 'PE & health';

export type Worksheet = {
  slug: string;
  title: string;
  description: string;
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
    | 'Lernkarten';
  pages: number;
  language: 'German' | 'French' | 'Italian' | 'English';
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  downloads: string;
  hasAnswerKey: boolean;
  size: string;
  added: string;
  color: 'lavender' | 'peach' | 'blue' | 'mint' | 'yellow' | 'pink';
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

type PublishedManifest = {
  worksheetId?: string;
  slug: string;
  title: string;
  description?: string;
  subject?: string;
  grade?: string;
  documentType?: string;
  pages?: number;
  language?: string;
  difficulty?: string;
  downloads?: number;
  hasAnswerKey?: boolean;
  sizeBytes?: number;
  tags?: string[];
  pdfPath?: string;
  pdfUrl?: string;
  thumbnailPaths?: string[];
  publishedAt: string;
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

function publishedWorksheet(manifest: PublishedManifest): Worksheet | null {
  const blobPath = manifest.pdfPath || manifest.pdfUrl;
  if (!manifest.slug || !manifest.title || !blobPath) return null;
  const subjects: Subject[] = ['A1.1', 'Language', 'Science', 'Humanities', 'Arts', 'PE & health'];
  const languages: Worksheet['language'][] = ['German', 'French', 'Italian', 'English'];
  const difficulties: Worksheet['difficulty'][] = ['Basic', 'Intermediate', 'Advanced'];
  const documentTypes: Worksheet['documentType'][] = [
    'Worksheet',
    'Game',
    'Card set',
    'Arbeitsblatt',
    'Merkblatt',
    'Verbtabelle',
    'Deklinationstabelle',
    'Lernkarten',
  ];
  const subject = subjects.includes(manifest.subject as Subject)
    ? manifest.subject as Subject
    : 'Language';
  const publishedAt = new Date(manifest.publishedAt);
  return {
    slug: manifest.slug,
    title: manifest.title,
    description: manifest.description || 'Druckfertiges Arbeitsblatt für den DaZ-Kurs.',
    subject,
    grade: manifest.grade || '—',
    documentType: documentTypes.includes(manifest.documentType as Worksheet['documentType'])
      ? manifest.documentType as Worksheet['documentType']
      : 'Worksheet',
    pages: Math.max(1, manifest.pages || 1),
    language: languages.includes(manifest.language as Worksheet['language'])
      ? manifest.language as Worksheet['language']
      : 'German',
    difficulty: difficulties.includes(manifest.difficulty as Worksheet['difficulty'])
      ? manifest.difficulty as Worksheet['difficulty']
      : 'Basic',
    downloads: String(manifest.downloads || 0),
    hasAnswerKey: Boolean(manifest.hasAnswerKey),
    size: formatSize(manifest.sizeBytes),
    added: Number.isNaN(publishedAt.getTime())
      ? '—'
      : formatPublishedDate(publishedAt),
    color: subject === 'Science' ? 'mint'
      : subject === 'Humanities' ? 'peach'
        : subject === 'Arts' ? 'pink'
          : subject === 'PE & health' ? 'yellow'
            : subject === 'A1.1' ? 'blue'
              : 'lavender',
    tags: Array.isArray(manifest.tags) ? manifest.tags : [],
    pdfUrl: `/api/download/${encodeURIComponent(manifest.slug)}`,
    blobPath,
    thumbnailPaths: manifest.thumbnailPaths || [],
    thumbnailUrls: manifest.worksheetId
      ? (manifest.thumbnailPaths || []).map(
        (_, index) => `/api/thumbnail/${encodeURIComponent(manifest.worksheetId!)}/${index + 1}`,
      )
      : [],
    publishedAt: manifest.publishedAt,
    worksheetId: manifest.worksheetId,
  };
}

async function loadWorksheets() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return [];
  try {
    const result = await list({ prefix: 'library/', limit: 1000, token });
    const manifests = result.blobs.filter(({ pathname }) => pathname.endsWith('.json'));
    const published: Worksheet[] = [];

    // Keep private Blob requests bounded. Fetching the whole library concurrently can
    // exhaust local sockets, and one rejected request used to hide every worksheet.
    for (let index = 0; index < manifests.length; index += 12) {
      const batch = manifests.slice(index, index + 12);
      const worksheets = await Promise.all(batch.map(async ({ pathname }) => {
        try {
          const result = await get(pathname, {
            access: 'private',
            token,
            useCache: false,
          });
          if (!result || result.statusCode !== 200 || !result.stream) return null;
          const manifest = await new Response(result.stream).json() as PublishedManifest;
          return publishedWorksheet(manifest);
        } catch (error) {
          console.error(`Could not load Dazit manifest ${pathname}.`, error);
          return null;
        }
      }));
      published.push(...worksheets.filter((item): item is Worksheet => item !== null));
    }

    published.sort((a, b) => (b.publishedAt || '').localeCompare(a.publishedAt || ''));
    try {
      const metadata = await getPublicationMetadata();
      published.forEach((worksheet) => {
        if (!worksheet.worksheetId) return;
        const record = metadata.get(worksheet.worksheetId);
        if (!record) return;
        worksheet.title = record.title;
        worksheet.documentType = record.documentType;
        worksheet.description = record.excerpt || worksheet.description;
        worksheet.descriptionHtml = record.descriptionHtml || undefined;
        worksheet.tags = Array.isArray(record.tags) ? record.tags.slice(0, 10) : worksheet.tags;
        worksheet.level = record.level || undefined;
        worksheet.actionCompetencies = Array.isArray(record.actionCompetencies)
          ? record.actionCompetencies
          : [];
        worksheet.languageCompetencies = Array.isArray(record.languageCompetencies)
          ? record.languageCompetencies
          : [];
        worksheet.actionCompetencyContributionHtml =
          record.actionCompetencyContributionHtml || undefined;
        worksheet.actionField = record.actionField || undefined;
        worksheet.relationships = record.relationships;
      });
    } catch (error) {
      console.error('Could not load Dazit publication metadata.', error);
    }
    return published;
  } catch (error) {
    console.error('Could not load Dazit library manifests.', error);
    return [];
  }
}

const getCachedWorksheets = unstable_cache(
  loadWorksheets,
  ['dazit-library'],
  { revalidate: 30 },
);

export const getWorksheets = cache(getCachedWorksheets);

export async function worksheetBySlug(slug: string) {
  return (await getWorksheets()).find((worksheet) => worksheet.slug === slug);
}
