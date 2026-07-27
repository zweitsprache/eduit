import { sql } from '@/lib/neon';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';
import { validateWorksheetPatch } from '@/lib/worksheets';

export type ContextProfile = {
  id: string;
  ownerUserId: string | null;
  name: string;
  description: string;
  isSystemTemplate: boolean;
  context: WorksheetContext;
  createdAt: string;
  updatedAt: string;
};

type ContextProfileRow = {
  id: string;
  owner_user_id: string | null;
  name: string;
  description: string;
  is_system_template: boolean;
  context: Partial<WorksheetContext> | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapRow(row: ContextProfileRow): ContextProfile {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    name: row.name,
    description: row.description,
    isSystemTemplate: row.is_system_template,
    context: {
      ...EMPTY_WORKSHEET_CONTEXT,
      ...(row.context ?? {}),
      sourceProfileId: null,
    },
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function validateInput(value: unknown) {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid context profile.');
  }
  const input = value as Record<string, unknown>;
  if (typeof input.name !== 'string' || !input.name.trim()) {
    throw new Error('Profile name is required.');
  }
  const context = validateWorksheetPatch({ context: input.context }).context;
  if (!context) throw new Error('Profile context is required.');
  return {
    name: input.name.trim().slice(0, 150),
    description: typeof input.description === 'string'
      ? input.description.trim().slice(0, 500)
      : '',
    context: { ...context, sourceProfileId: null },
  };
}

export async function listContextProfiles(ownerUserId: string) {
  const rows = await sql`
    select *
    from context_profiles
    where owner_user_id = ${ownerUserId}
      or is_system_template = true
    order by is_system_template desc, name asc
  ` as ContextProfileRow[];
  return rows.map(mapRow);
}

export async function createContextProfile(
  ownerUserId: string,
  value: unknown,
) {
  const input = validateInput(value);
  const rows = await sql`
    insert into context_profiles (
      owner_user_id,
      name,
      description,
      is_system_template,
      context
    )
    values (
      ${ownerUserId},
      ${input.name},
      ${input.description},
      false,
      ${JSON.stringify(input.context)}::jsonb
    )
    returning *
  ` as ContextProfileRow[];
  return mapRow(rows[0]);
}

export async function updateContextProfile(
  id: string,
  ownerUserId: string,
  value: unknown,
) {
  const input = validateInput(value);
  const rows = await sql`
    update context_profiles
    set name = ${input.name},
        description = ${input.description},
        context = ${JSON.stringify(input.context)}::jsonb,
        updated_at = now()
    where id = ${id}
      and owner_user_id = ${ownerUserId}
      and is_system_template = false
    returning *
  ` as ContextProfileRow[];
  if (!rows[0]) throw new Error('Context profile not found.');
  return mapRow(rows[0]);
}

export async function deleteContextProfile(id: string, ownerUserId: string) {
  const rows = await sql`
    delete from context_profiles
    where id = ${id}
      and owner_user_id = ${ownerUserId}
      and is_system_template = false
    returning id
  `;
  if (!rows[0]) throw new Error('Context profile not found.');
}
