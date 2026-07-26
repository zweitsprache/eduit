import { sql } from '@/lib/neon';
import {
  WORKSHEET_DOCUMENT_SIZES,
  WORKSHEET_STATUSES,
  type Worksheet,
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
  status: Worksheet['status'];
  created_at: Date | string;
  updated_at: Date | string;
};

function mapRow(row: WorksheetRow): Worksheet {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    brandProfileId: row.brand_profile_id,
    brandProfileName: row.brand_profile_name,
    title: row.title,
    contentHtml: row.content_html,
    documentSize: row.document_size,
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

export async function listWorksheets() {
  const rows = await sql(`${SELECT_WORKSHEET} order by w.updated_at desc`) as WorksheetRow[];
  return rows.map(mapRow);
}

export async function getWorksheet(id: string) {
  const rows = await sql(`${SELECT_WORKSHEET} where w.id = $1`, [id]) as WorksheetRow[];
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createWorksheet(input: WorksheetPatch = {}) {
  const rows = await sql`
    insert into worksheets (
      title,
      content_html,
      document_size,
      status,
      brand_profile_id
    )
    values (
      ${input.title?.trim() || 'Untitled Worksheet'},
      ${input.contentHtml ?? ''},
      ${input.documentSize ?? 'a4-portrait'},
      ${input.status ?? 'draft'},
      (select id from brand_profiles where is_default = true limit 1)
    )
    returning *
  ` as WorksheetRow[];
  return getWorksheet(rows[0].id);
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
  if ('brandProfileId' in input) {
    if (input.brandProfileId !== null && typeof input.brandProfileId !== 'string') {
      throw new Error('Invalid brand profile.');
    }
    patch.brandProfileId = input.brandProfileId as string | null;
  }

  return patch;
}

export async function updateWorksheet(id: string, patch: WorksheetPatch) {
  const current = await getWorksheet(id);
  if (!current) throw new Error('Worksheet not found.');

  await sql`
    update worksheets
    set title = ${patch.title ?? current.title},
        content_html = ${patch.contentHtml ?? current.contentHtml},
        document_size = ${patch.documentSize ?? current.documentSize},
        status = ${patch.status ?? current.status},
        brand_profile_id = ${patch.brandProfileId === undefined
          ? current.brandProfileId
          : patch.brandProfileId},
        updated_at = now()
    where id = ${id}
  `;
  return getWorksheet(id);
}

export async function deleteWorksheet(id: string) {
  const rows = await sql`delete from worksheets where id = ${id} returning id`;
  if (!rows[0]) throw new Error('Worksheet not found.');
}
