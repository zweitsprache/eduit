import { sql } from '@/lib/neon';
import {
  WORKSHEET_DOCUMENT_SIZES,
  WORKSHEET_STATUSES,
  EMPTY_WORKSHEET_CONTEXT,
  type Worksheet,
  type WorksheetContext,
  type WorksheetPatch,
  type WorksheetStatus,
} from '@/lib/worksheet-types';
import { GRAMMAR_TAG_ID_SET } from '@/lib/grammar-tags';
import { requireOwnedWorksheetFolder } from '@/lib/worksheet-folders';

type WorksheetRow = {
  id: string;
  owner_user_id: string | null;
  folder_id: string | null;
  brand_profile_id: string | null;
  brand_profile_name: string | null;
  title: string;
  content_html: string;
  document_size: Worksheet['documentSize'];
  show_solutions: boolean;
  context: WorksheetContext | null;
  status: Worksheet['status'];
  has_preview: boolean;
  preview_updated_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  source_revision: number | string;
};

function mapRow(row: WorksheetRow): Worksheet {
  const legacySubjects = Array.isArray(
    (row.context as WorksheetContext & { subjects?: unknown })?.subjects,
  )
    ? (row.context as WorksheetContext & { subjects: string[] }).subjects
    : [];
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    folderId: row.folder_id,
    brandProfileId: row.brand_profile_id,
    brandProfileName: row.brand_profile_name,
    title: row.title,
    contentHtml: row.content_html,
    documentSize: row.document_size,
    showSolutions: row.show_solutions,
    context: {
      ...EMPTY_WORKSHEET_CONTEXT,
      ...(row.context ?? {}),
      worksheetLanguage: row.context?.worksheetLanguage === 'de-formal'
        ? 'de-formal'
        : row.context?.worksheetLanguage === 'de-informal'
          || (row.context?.worksheetLanguage as string | undefined) === 'de'
          ? 'de-informal'
          : 'de-formal',
      worksheetType: row.context?.worksheetType === 'verb-table'
        ? 'verb-table'
        : row.context?.worksheetType === 'fact-sheet'
          ? 'fact-sheet'
          : row.context?.worksheetType === 'declension-table'
            ? 'declension-table'
            : row.context?.worksheetType === 'communication-cards'
              ? 'communication-cards'
            : row.context?.worksheetType === 'learning-cards'
              ? 'learning-cards'
              : row.context?.worksheetType === 'information-gap'
                ? 'information-gap'
              : row.context?.worksheetType === 'domino'
                ? 'domino'
              : row.context?.worksheetType === 'dialog'
                ? 'dialog'
              : row.context?.worksheetType === 'lesetraining'
                ? 'lesetraining'
              : row.context?.worksheetType === 'word-list'
                ? 'word-list'
        : 'worksheet',
      subject: row.context?.subject || legacySubjects[0] || 'daz',
      ageGroups: Array.isArray((row.context as WorksheetContext & {
        ageGroups?: unknown;
      })?.ageGroups)
        ? ((row.context as WorksheetContext & { ageGroups: string[] }).ageGroups)
        : EMPTY_WORKSHEET_CONTEXT.ageGroups,
      actionCompetencies: Array.isArray((row.context as WorksheetContext & {
        actionCompetencies?: unknown;
      })?.actionCompetencies)
        ? ((row.context as WorksheetContext & {
          actionCompetencies: string[];
        }).actionCompetencies)
        : EMPTY_WORKSHEET_CONTEXT.actionCompetencies,
      languageCompetencies: Array.isArray((row.context as WorksheetContext & {
        languageCompetencies?: unknown;
      })?.languageCompetencies)
        ? ((row.context as WorksheetContext & {
          languageCompetencies: string[];
        }).languageCompetencies)
        : EMPTY_WORKSHEET_CONTEXT.languageCompetencies,
      grammarTags: Array.isArray((row.context as WorksheetContext & {
        grammarTags?: unknown;
      })?.grammarTags)
        ? ((row.context as WorksheetContext & {
          grammarTags: string[];
        }).grammarTags)
          .filter((value): value is string => typeof value === 'string')
          .filter((value) => GRAMMAR_TAG_ID_SET.has(value))
        : EMPTY_WORKSHEET_CONTEXT.grammarTags,
      translationLanguages: Array.isArray((row.context as WorksheetContext & {
        translationLanguages?: unknown;
      })?.translationLanguages)
        ? ((row.context as WorksheetContext & {
          translationLanguages: string[];
        }).translationLanguages).filter((code): code is string => typeof code === 'string')
        : EMPTY_WORKSHEET_CONTEXT.translationLanguages,
    },
    status: row.status,
    hasPreview: row.has_preview,
    previewUpdatedAt: row.preview_updated_at
      ? new Date(row.preview_updated_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    sourceRevision: Number(row.source_revision),
  };
}

const SELECT_WORKSHEET = `
  select
    w.id,
    w.owner_user_id,
    w.folder_id,
    w.brand_profile_id,
    b.name as brand_profile_name,
    w.title,
    w.content_html,
    w.document_size,
    w.show_solutions,
    w.context,
    w.status,
    (dp.thumbnail_paths->>0 is not null) as has_preview,
    dp.updated_at as preview_updated_at,
    w.created_at,
    w.updated_at
    , w.source_revision
  from worksheets w
  left join brand_profiles b on b.id = w.brand_profile_id
  left join dazit_publications dp on dp.worksheet_id = w.id
`;

export async function listWorksheets(ownerUserId: string, includeAll = false) {
  const rows = includeAll
    ? await sql(`${SELECT_WORKSHEET} order by w.updated_at desc`) as WorksheetRow[]
    : await sql(
      `${SELECT_WORKSHEET} where w.owner_user_id = $1 order by w.updated_at desc`,
      [ownerUserId],
    ) as WorksheetRow[];
  return rows.map(mapRow);
}

export type WorksheetAdminListItem = {
  id: string;
  title: string;
  status: Worksheet['status'];
  languageLevel: string;
  actionField: string;
  blockTypes: string[];
  headingText: string | null;
  updatedAt: string;
};

export type WorksheetAdminListResult = {
  items: WorksheetAdminListItem[];
  total: number;
};

// Structural/chrome node types that aren't a "main" exercise block for badge display.
const BADGE_EXCLUDED_BLOCK_TYPES = [
  'custom-heading',
  'spacer',
  'rich-text',
  'media-layout',
  'instruction-block',
  'pageBreak',
];

function decodeHtmlAttributeEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function encodeHtmlAttributeEntities(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Custom-heading nodes render as <div data-type="custom-heading" data-heading-text="..."
// data-heading-level="..." ...>; pull the text of the first level-1 heading, if any.
function extractFirstH1HeadingText(headingTags: string[] | null): string | null {
  if (!headingTags) return null;
  const h1Tag = headingTags.find((tag) => /data-heading-level="1"/.test(tag));
  if (!h1Tag) return null;
  const textMatch = h1Tag.match(/data-heading-text="([^"]*)"/);
  return textMatch ? decodeHtmlAttributeEntities(textMatch[1]) : '';
}

// Lightweight, paginated listing (no content_html) for the admin worksheets table.
export async function listWorksheetsForAdmin(params: {
  search?: string;
  level?: string;
  actionField?: string;
  status?: WorksheetStatus;
  page?: number;
  pageSize?: number;
}): Promise<WorksheetAdminListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.search) {
    values.push(`%${params.search.replace(/[%_]/g, (char) => `\\${char}`)}%`);
    conditions.push(`w.title ilike $${values.length}`);
  }
  if (params.level) {
    values.push(params.level);
    conditions.push(`w.context->>'languageLevel' = $${values.length}`);
  }
  if (params.actionField) {
    values.push(params.actionField);
    conditions.push(`w.context->>'actionField' = $${values.length}`);
  }
  if (params.status) {
    values.push(params.status);
    conditions.push(`w.status = $${values.length}`);
  }

  const whereClause = conditions.length ? `where ${conditions.join(' and ')}` : '';

  const countRows = await sql(
    `select count(*)::int as count from worksheets w ${whereClause}`,
    values,
  ) as Array<{ count: number }>;

  const excludedIndex = values.length + 1;
  const limitIndex = values.length + 2;
  const offsetIndex = values.length + 3;
  const rows = await sql(
    `
      select
        w.id,
        w.title,
        w.status,
        w.context,
        w.updated_at,
        (
          select coalesce(array_agg(distinct m[1]), '{}')
          from regexp_matches(w.content_html, 'data-type="([a-zA-Z0-9-]+)"', 'g') as m
          where not (m[1] = any($${excludedIndex}::text[]))
        ) as block_types,
        (
          select coalesce(array_agg(m[1]), '{}')
          from regexp_matches(w.content_html, '(<div[^>]*data-type="custom-heading"[^>]*>)', 'g') as m
        ) as heading_tags
      from worksheets w
      ${whereClause}
      order by w.updated_at desc
      limit $${limitIndex} offset $${offsetIndex}
    `,
    [...values, BADGE_EXCLUDED_BLOCK_TYPES, pageSize, offset],
  ) as Array<{
    id: string;
    title: string;
    status: Worksheet['status'];
    context: WorksheetContext | null;
    updated_at: Date | string;
    block_types: string[] | null;
    heading_tags: string[] | null;
  }>;

  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      languageLevel: row.context?.languageLevel ?? '',
      actionField: row.context?.actionField ?? '',
      blockTypes: row.block_types ?? [],
      headingText: extractFirstH1HeadingText(row.heading_tags),
      updatedAt: new Date(row.updated_at).toISOString(),
    })),
    total: countRows[0]?.count ?? 0,
  };
}

export async function getWorksheet(id: string, ownerUserId: string, includeAll = false) {
  const rows = includeAll
    ? await sql(`${SELECT_WORKSHEET} where w.id = $1`, [id]) as WorksheetRow[]
    : await sql(
      `${SELECT_WORKSHEET} where w.id = $1 and w.owner_user_id = $2`,
      [id, ownerUserId],
    ) as WorksheetRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createWorksheet(ownerUserId: string, input: WorksheetPatch = {}) {
  await requireOwnedWorksheetFolder(input.folderId ?? null, ownerUserId);
  const rows = await sql`
    insert into worksheets (
      owner_user_id,
      title,
      content_html,
      document_size,
      show_solutions,
      status,
      context,
      brand_profile_id,
      folder_id
    )
    values (
      ${ownerUserId},
      ${input.title?.trim() || 'Untitled Worksheet'},
      ${input.contentHtml ?? ''},
      ${input.documentSize ?? 'a4-portrait'},
      ${input.showSolutions ?? false},
      ${input.status ?? 'draft'},
      ${JSON.stringify(input.context ?? EMPTY_WORKSHEET_CONTEXT)}::jsonb,
      case
        when ${input.brandProfileId === undefined}
          then (select id from brand_profiles where is_default = true limit 1)
        else ${input.brandProfileId}::uuid
      end,
      ${input.folderId ?? null}::uuid
    )
    returning *
  ` as WorksheetRow[];
  return getWorksheet(rows[0].id, ownerUserId);
}

export function validateWorksheetPatch(value: unknown): WorksheetPatch {
  if (!value || typeof value !== 'object') throw new Error('Invalid worksheet.');
  const input = value as Record<string, unknown>;
  const patch: WorksheetPatch = {};

  if ('title' in input) {
    if (typeof input.title !== 'string' || !input.title.trim()) {
      throw new Error('Worksheet title is required.');
    }
    patch.title = input.title.trim().slice(0, 200);
  }
  if ('contentHtml' in input) {
    if (typeof input.contentHtml !== 'string' || input.contentHtml.length > 4_000_000) {
      throw new Error('Worksheet content is invalid or too large.');
    }
    patch.contentHtml = input.contentHtml;
  }
  if ('documentSize' in input) {
    if (!WORKSHEET_DOCUMENT_SIZES.includes(input.documentSize as never)) {
      throw new Error('Invalid worksheet document size.');
    }
    patch.documentSize = input.documentSize as Worksheet['documentSize'];
  }
  if ('status' in input) {
    if (!WORKSHEET_STATUSES.includes(input.status as never)) {
      throw new Error('Invalid worksheet status.');
    }
    patch.status = input.status as Worksheet['status'];
  }
  if ('showSolutions' in input) {
    if (typeof input.showSolutions !== 'boolean') {
      throw new Error('Invalid show-solutions setting.');
    }
    patch.showSolutions = input.showSolutions;
  }
  if ('context' in input) {
    if (!input.context || typeof input.context !== 'object') {
      throw new Error('Invalid worksheet context.');
    }
    const context = input.context as Record<string, unknown>;
    const text = (key: string, maxLength = 500) => (
      typeof context[key] === 'string'
        ? context[key].trim().slice(0, maxLength)
        : ''
    );
    const age = (key: string) => {
      const value = context[key];
      if (value === null || value === '' || value === undefined) return null;
      const number = Number(value);
      return Number.isFinite(number)
        ? Math.min(120, Math.max(0, Math.round(number)))
        : null;
    };
    const pageCount = Number(context.contextPdfPageCount);
    patch.context = {
      worksheetLanguage: context.worksheetLanguage === 'de-formal'
        ? 'de-formal'
        : context.worksheetLanguage === 'de-informal'
          || context.worksheetLanguage === 'de'
          ? 'de-informal'
          : 'de-formal',
      worksheetType: context.worksheetType === 'verb-table'
        ? 'verb-table'
        : context.worksheetType === 'fact-sheet'
          ? 'fact-sheet'
          : context.worksheetType === 'declension-table'
            ? 'declension-table'
            : context.worksheetType === 'communication-cards'
              ? 'communication-cards'
            : context.worksheetType === 'learning-cards'
              ? 'learning-cards'
              : context.worksheetType === 'information-gap'
                ? 'information-gap'
              : context.worksheetType === 'domino'
                ? 'domino'
              : context.worksheetType === 'dialog'
                ? 'dialog'
              : context.worksheetType === 'lesetraining'
                ? 'lesetraining'
              : context.worksheetType === 'word-list'
                ? 'word-list'
        : 'worksheet',
      sourceProfileId: typeof context.sourceProfileId === 'string'
        ? context.sourceProfileId.slice(0, 100)
        : null,
      subject: text('subject', 100),
      customSubject: text('customSubject', 150),
      learnerStage: text('learnerStage', 100),
      ageGroups: Array.isArray(context.ageGroups)
        ? context.ageGroups
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 8)
        : EMPTY_WORKSHEET_CONTEXT.ageGroups,
      ageMin: age('ageMin'),
      ageMax: age('ageMax'),
      contentLanguage: text('contentLanguage', 100),
      translationLanguages: Array.isArray(context.translationLanguages)
        ? context.translationLanguages
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim().slice(0, 20))
          .filter(Boolean)
          .slice(0, 20)
        : EMPTY_WORKSHEET_CONTEXT.translationLanguages,
      country: text('country', 100),
      localLevel: text('localLevel', 150),
      curriculum: text('curriculum', 250),
      languageLevel: text('languageLevel', 100),
      actionField: text('actionField', 100),
      actionCompetencies: Array.isArray(context.actionCompetencies)
        ? context.actionCompetencies
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 10)
        : EMPTY_WORKSHEET_CONTEXT.actionCompetencies,
      languageCompetencies: Array.isArray(context.languageCompetencies)
        ? context.languageCompetencies
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim().slice(0, 80))
          .filter(Boolean)
          .slice(0, 10)
        : EMPTY_WORKSHEET_CONTEXT.languageCompetencies,
      grammarTags: Array.isArray(context.grammarTags)
        ? context.grammarTags
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim().slice(0, 150))
          .filter((value) => GRAMMAR_TAG_ID_SET.has(value))
          .slice(0, 80)
        : EMPTY_WORKSHEET_CONTEXT.grammarTags,
      learnerContext: text('learnerContext', 1000),
      hinweis: text('hinweis', 2000),
      contextPdfName: text('contextPdfName', 250),
      contextPdfText: text('contextPdfText', 1_000_000),
      contextPdfPageCount: Number.isFinite(pageCount)
        ? Math.min(10_000, Math.max(1, Math.round(pageCount)))
        : null,
    };
  }
  if ('brandProfileId' in input) {
    if (input.brandProfileId !== null && typeof input.brandProfileId !== 'string') {
      throw new Error('Invalid brand profile.');
    }
    patch.brandProfileId = input.brandProfileId as string | null;
  }
  if ('folderId' in input) {
    if (input.folderId !== null && typeof input.folderId !== 'string') {
      throw new Error('Invalid worksheet folder.');
    }
    patch.folderId = input.folderId as string | null;
  }

  return patch;
}

export async function updateWorksheet(
  id: string,
  ownerUserId: string,
  patch: WorksheetPatch,
  includeAll = false,
) {
  const current = await getWorksheet(id, ownerUserId, includeAll);
  if (!current) throw new Error('Worksheet not found.');
  if (patch.folderId !== undefined) {
    await requireOwnedWorksheetFolder(patch.folderId, ownerUserId);
  }
  const affectsPublication = patch.title !== undefined
    || patch.contentHtml !== undefined
    || patch.documentSize !== undefined
    || patch.showSolutions !== undefined
    || patch.context !== undefined
    || patch.brandProfileId !== undefined;

  await sql`
    update worksheets
    set title = case when ${patch.title !== undefined}
          then ${patch.title ?? ''} else title end,
        content_html = case when ${patch.contentHtml !== undefined}
          then ${patch.contentHtml ?? ''} else content_html end,
        document_size = case when ${patch.documentSize !== undefined}
          then ${patch.documentSize ?? 'a4-portrait'} else document_size end,
        show_solutions = case when ${patch.showSolutions !== undefined}
          then ${patch.showSolutions ?? false} else show_solutions end,
        context = case when ${patch.context !== undefined}
          then ${JSON.stringify(patch.context ?? EMPTY_WORKSHEET_CONTEXT)}::jsonb else context end,
        status = case when ${patch.status !== undefined}
          then ${patch.status ?? 'draft'} else status end,
        brand_profile_id = case when ${patch.brandProfileId !== undefined}
          then ${patch.brandProfileId ?? null}::uuid else brand_profile_id end,
        folder_id = case when ${patch.folderId !== undefined}
          then ${patch.folderId ?? null}::uuid else folder_id end,
        source_revision = source_revision + ${affectsPublication ? 1 : 0},
        updated_at = now()
    where id = ${id}
      and (${includeAll} or owner_user_id = ${ownerUserId})
  `;
  return getWorksheet(id, ownerUserId, includeAll);
}

// Rewrites the first level-1 custom-heading node's text in content_html and
// persists it through the normal update path (bumps source_revision, etc.).
export async function updateWorksheetHeadingText(
  id: string,
  ownerUserId: string,
  headingText: string,
  includeAll = false,
) {
  const current = await getWorksheet(id, ownerUserId, includeAll);
  if (!current) throw new Error('Worksheet not found.');
  const headingTags = current.contentHtml.match(
    /<div[^>]*data-type="custom-heading"[^>]*>/g,
  );
  const targetTag = headingTags?.find((tag) => /data-heading-level="1"/.test(tag));
  if (!targetTag) throw new Error('This worksheet has no H1 heading to edit.');
  const updatedTag = targetTag.replace(
    /data-heading-text="[^"]*"/,
    `data-heading-text="${encodeHtmlAttributeEntities(headingText)}"`,
  );
  const updatedHtml = current.contentHtml.replace(targetTag, updatedTag);
  return updateWorksheet(id, ownerUserId, { contentHtml: updatedHtml }, includeAll);
}

export async function deleteWorksheet(id: string, ownerUserId: string, includeAll = false) {
  const rows = await sql`
    delete from worksheets
    where id = ${id}
      and (${includeAll} or owner_user_id = ${ownerUserId})
    returning id
  `;
  if (!rows[0]) throw new Error('Worksheet not found.');
}

export async function updateWorksheetPreview(
  id: string,
  ownerUserId: string,
  blobPath: string,
  includeAll = false,
) {
  const currentRows = await sql(
    `select preview_blob_path
     from worksheets
     where id = $1
       and ($2 or owner_user_id = $3)`,
    [id, includeAll, ownerUserId],
  ) as Array<{ preview_blob_path: string | null }>;
  if (!currentRows[0]) throw new Error('Worksheet not found.');
  const rows = await sql(
    `update worksheets
     set preview_blob_path = $1,
         preview_updated_at = now()
     where id = $2
       and ($3 or owner_user_id = $4)
     returning preview_updated_at`,
    [blobPath, id, includeAll, ownerUserId],
  ) as Array<{ preview_updated_at: Date | string }>;
  if (!rows[0]) throw new Error('Worksheet not found.');
  return {
    previousBlobPath: currentRows[0].preview_blob_path,
    previewUpdatedAt: new Date(rows[0].preview_updated_at).toISOString(),
  };
}

export async function getWorksheetPreviewLocation(
  id: string,
  ownerUserId: string,
  includeAll = false,
) {
  const rows = await sql(
    `select
       dp.thumbnail_paths->>0 as thumbnail_path,
       dp.updated_at
     from worksheets w
     join dazit_publications dp on dp.worksheet_id = w.id
     where w.id = $1
       and ($2 or w.owner_user_id = $3)
       and dp.thumbnail_paths->>0 is not null`,
    [id, includeAll, ownerUserId],
  ) as Array<{
    thumbnail_path: string;
    updated_at: Date | string | null;
  }>;
  if (!rows[0]) return null;
  return {
    blobPath: rows[0].thumbnail_path,
    updatedAt: rows[0].updated_at
      ? new Date(rows[0].updated_at).toISOString()
      : null,
  };
}
