import { sql } from '@/lib/neon';
import {
  WORKSHEET_DOCUMENT_SIZES,
  WORKSHEET_STATUSES,
  EMPTY_WORKSHEET_CONTEXT,
  type Worksheet,
  type WorksheetContext,
  type WorksheetPatch,
} from '@/lib/worksheet-types';

type WorksheetRow = {
  id: string;
  owner_user_id: string | null;
  brand_profile_id: string | null;
  brand_profile_name: string | null;
  title: string;
  content_html: string;
  document_size: Worksheet['documentSize'];
  show_solutions: boolean;
  context: WorksheetContext | null;
  status: Worksheet['status'];
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
    brandProfileId: row.brand_profile_id,
    brandProfileName: row.brand_profile_name,
    title: row.title,
    contentHtml: row.content_html,
    documentSize: row.document_size,
    showSolutions: row.show_solutions,
    context: {
      ...EMPTY_WORKSHEET_CONTEXT,
      ...(row.context ?? {}),
      subject: row.context?.subject || legacySubjects[0] || '',
    },
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const SELECT_WORKSHEET = `
  select w.*, b.name as brand_profile_name
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
  const rows = await sql`
    insert into worksheets (
      owner_user_id,
      title,
      content_html,
      document_size,
      status,
      context,
      brand_profile_id
    )
    values (
      ${ownerUserId},
      ${input.title?.trim() || 'Untitled Worksheet'},
      ${input.contentHtml ?? ''},
      ${input.documentSize ?? 'a4-portrait'},
      ${input.status ?? 'draft'},
      ${JSON.stringify(input.context ?? EMPTY_WORKSHEET_CONTEXT)}::jsonb,
      (select id from brand_profiles where is_default = true limit 1)
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
    patch.context = {
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
    };
  }
  if ('brandProfileId' in input) {
    if (input.brandProfileId !== null && typeof input.brandProfileId !== 'string') {
      throw new Error('Invalid brand profile.');
    }
    patch.brandProfileId = input.brandProfileId as string | null;
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
