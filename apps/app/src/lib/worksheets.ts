import { sql } from '@/lib/neon';
import {
  WORKSHEET_DOCUMENT_SIZES,
  WORKSHEET_STATUSES,
  EMPTY_WORKSHEET_CONTEXT,
  type Worksheet,
  type WorksheetContext,
  type WorksheetPatch,
} from '@/lib/worksheet-types';
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
          : 'en',
      subject: row.context?.subject || legacySubjects[0] || '',
    },
    status: row.status,
    hasPreview: row.has_preview,
    previewUpdatedAt: row.preview_updated_at
      ? new Date(row.preview_updated_at).toISOString()
      : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
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
    (w.preview_blob_path is not null) as has_preview,
    w.preview_updated_at,
    w.created_at,
    w.updated_at
  from worksheets w
  left join brand_profiles b on b.id = w.brand_profile_id
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
          : 'en',
      sourceProfileId: typeof context.sourceProfileId === 'string'
        ? context.sourceProfileId.slice(0, 100)
        : null,
      subject: text('subject', 100),
      customSubject: text('customSubject', 150),
      learnerStage: text('learnerStage', 100),
      ageMin: age('ageMin'),
      ageMax: age('ageMax'),
      contentLanguage: text('contentLanguage', 100),
      country: text('country', 100),
      localLevel: text('localLevel', 150),
      curriculum: text('curriculum', 250),
      languageLevel: text('languageLevel', 100),
      learnerContext: text('learnerContext', 1000),
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

  await sql`
    update worksheets
    set title = ${patch.title ?? current.title},
        content_html = ${patch.contentHtml ?? current.contentHtml},
        document_size = ${patch.documentSize ?? current.documentSize},
        show_solutions = ${patch.showSolutions ?? current.showSolutions},
        context = ${JSON.stringify(patch.context ?? current.context)}::jsonb,
        status = ${patch.status ?? current.status},
        brand_profile_id = ${patch.brandProfileId === undefined
          ? current.brandProfileId
          : patch.brandProfileId},
        folder_id = ${patch.folderId === undefined
          ? current.folderId
          : patch.folderId}::uuid,
        updated_at = now()
    where id = ${id}
      and (${includeAll} or owner_user_id = ${ownerUserId})
  `;
  return getWorksheet(id, ownerUserId, includeAll);
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
       preview_blob_path,
       preview_updated_at
     from worksheets
     where id = $1
       and ($2 or owner_user_id = $3)
       and preview_blob_path is not null`,
    [id, includeAll, ownerUserId],
  ) as Array<{
    preview_blob_path: string;
    preview_updated_at: Date | string | null;
  }>;
  if (!rows[0]) return null;
  return {
    blobPath: rows[0].preview_blob_path,
    updatedAt: rows[0].preview_updated_at
      ? new Date(rows[0].preview_updated_at).toISOString()
      : null,
  };
}
