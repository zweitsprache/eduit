import { sql } from '@/lib/neon';
import type { WorksheetFolder } from '@/lib/worksheet-types';

type FolderRow = {
  id: string;
  owner_user_id: string;
  parent_id: string | null;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapFolder(row: FolderRow): WorksheetFolder {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    parentId: row.parent_id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listWorksheetFolders(ownerUserId: string) {
  const rows = await sql`
    select *
    from worksheet_folders
    where owner_user_id = ${ownerUserId}
    order by lower(name), created_at
  ` as FolderRow[];
  return rows.map(mapFolder);
}

async function requireOwnedParent(
  parentId: string | null,
  ownerUserId: string,
) {
  if (!parentId) return;
  const rows = await sql`
    select id
    from worksheet_folders
    where id = ${parentId}
      and owner_user_id = ${ownerUserId}
  `;
  if (!rows[0]) throw new Error('Parent folder not found.');
}

export async function requireOwnedWorksheetFolder(
  folderId: string | null,
  ownerUserId: string,
) {
  await requireOwnedParent(folderId, ownerUserId);
}

export function validateFolderName(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Folder name is required.');
  }
  return value.trim().slice(0, 120);
}

export function validateFolderId(value: unknown, label = 'Folder') {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value !== 'string') throw new Error(`${label} is invalid.`);
  return value;
}

export async function createWorksheetFolder(
  ownerUserId: string,
  name: string,
  parentId: string | null,
) {
  await requireOwnedParent(parentId, ownerUserId);
  const rows = await sql`
    insert into worksheet_folders (owner_user_id, parent_id, name)
    values (${ownerUserId}, ${parentId}::uuid, ${name})
    returning *
  ` as FolderRow[];
  return mapFolder(rows[0]);
}

export async function updateWorksheetFolder(
  id: string,
  ownerUserId: string,
  input: { name?: string; parentId?: string | null },
) {
  const currentRows = await sql`
    select *
    from worksheet_folders
    where id = ${id}
      and owner_user_id = ${ownerUserId}
  ` as FolderRow[];
  const current = currentRows[0];
  if (!current) throw new Error('Folder not found.');
  const parentId = input.parentId === undefined
    ? current.parent_id
    : input.parentId;
  if (parentId === id) throw new Error('A folder cannot contain itself.');
  await requireOwnedParent(parentId, ownerUserId);
  if (parentId) {
    const descendants = await sql`
      with recursive folder_tree as (
        select id
        from worksheet_folders
        where parent_id = ${id}
          and owner_user_id = ${ownerUserId}
        union all
        select child.id
        from worksheet_folders child
        join folder_tree tree on child.parent_id = tree.id
        where child.owner_user_id = ${ownerUserId}
      )
      select id from folder_tree where id = ${parentId}
    `;
    if (descendants[0]) {
      throw new Error('A folder cannot be moved into one of its subfolders.');
    }
  }
  const rows = await sql`
    update worksheet_folders
    set name = ${input.name ?? current.name},
        parent_id = ${parentId}::uuid,
        updated_at = now()
    where id = ${id}
      and owner_user_id = ${ownerUserId}
    returning *
  ` as FolderRow[];
  return mapFolder(rows[0]);
}

export async function deleteWorksheetFolder(
  id: string,
  ownerUserId: string,
) {
  const rows = await sql`
    delete from worksheet_folders
    where id = ${id}
      and owner_user_id = ${ownerUserId}
    returning id
  `;
  if (!rows[0]) throw new Error('Folder not found.');
}
