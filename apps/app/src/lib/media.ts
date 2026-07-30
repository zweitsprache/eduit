import { sql } from '@/lib/neon';

export type UserMedia = {
  id: string;
  filename: string;
  name: string;
  alt: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  src: string;
  createdAt: string;
  updatedAt: string;
};

type UserMediaRow = {
  id: string;
  blob_path: string;
  filename: string;
  display_name: string;
  alt_text: string;
  content_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  created_at: Date | string;
  updated_at: Date | string;
};

function mapRow(row: UserMediaRow): UserMedia {
  return {
    id: row.id,
    filename: row.filename,
    name: row.display_name,
    alt: row.alt_text,
    contentType: row.content_type,
    size: row.byte_size,
    width: row.width,
    height: row.height,
    src: `/api/media/${row.id}`,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function listUserMedia(ownerUserId: string, query = '') {
  const search = query.trim().slice(0, 100);
  const rows = search
    ? await sql`
        select *
        from user_media
        where owner_user_id = ${ownerUserId}
          and (
            display_name ilike ${`%${search}%`}
            or filename ilike ${`%${search}%`}
            or alt_text ilike ${`%${search}%`}
          )
        order by created_at desc
        limit 250
      ` as UserMediaRow[]
    : await sql`
        select *
        from user_media
        where owner_user_id = ${ownerUserId}
        order by created_at desc
        limit 250
      ` as UserMediaRow[];
  return rows.map(mapRow);
}

export async function createUserMedia(
  ownerUserId: string,
  input: {
    blobPath: string;
    filename: string;
    name: string;
    alt: string;
    contentType: string;
    size: number;
    width: number | null;
    height: number | null;
  },
) {
  const rows = await sql`
    insert into user_media (
      owner_user_id,
      blob_path,
      filename,
      display_name,
      alt_text,
      content_type,
      byte_size,
      width,
      height
    )
    values (
      ${ownerUserId},
      ${input.blobPath},
      ${input.filename},
      ${input.name},
      ${input.alt},
      ${input.contentType},
      ${input.size},
      ${input.width},
      ${input.height}
    )
    returning *
  ` as UserMediaRow[];
  return mapRow(rows[0]);
}

export async function getUserMediaLocation(id: string, ownerUserId: string) {
  const rows = await sql`
    select *
    from user_media
    where id = ${id}
      and owner_user_id = ${ownerUserId}
    limit 1
  ` as UserMediaRow[];
  return rows[0] ?? null;
}

export async function updateUserMedia(
  id: string,
  ownerUserId: string,
  input: { name: string; alt: string },
) {
  const name = input.name.trim().slice(0, 160);
  if (!name) throw new Error('Media name is required.');
  const rows = await sql`
    update user_media
    set display_name = ${name},
        alt_text = ${input.alt.trim().slice(0, 500)},
        updated_at = now()
    where id = ${id}
      and owner_user_id = ${ownerUserId}
    returning *
  ` as UserMediaRow[];
  if (!rows[0]) throw new Error('Media not found.');
  return mapRow(rows[0]);
}

export async function removeUserMedia(id: string, ownerUserId: string) {
  const rows = await sql`
    delete from user_media
    where id = ${id}
      and owner_user_id = ${ownerUserId}
    returning blob_path
  ` as Array<{ blob_path: string }>;
  if (!rows[0]) throw new Error('Media not found.');
  return rows[0].blob_path;
}
