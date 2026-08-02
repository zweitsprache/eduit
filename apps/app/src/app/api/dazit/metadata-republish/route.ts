import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CURRENT_METADATA_VERSION = 2;

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  const publications = await sql`
    select
      p.worksheet_id as id,
      p.title,
      p.level,
      p.metadata_version as "metadataVersion",
      p.updated_at as "updatedAt"
    from dazit_publications p
    join worksheets w on w.id = p.worksheet_id
    where p.document_type = 'Lernkarten'
      and p.metadata_version < ${CURRENT_METADATA_VERSION}
    order by p.title asc
  `;
  return NextResponse.json(
    { publications, currentMetadataVersion: CURRENT_METADATA_VERSION },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
