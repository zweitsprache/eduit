import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const worksheetId = new URL(request.url).searchParams.get('worksheetId');
  if (!worksheetId) {
    return NextResponse.json({ error: 'Worksheet ID is required.' }, { status: 400 });
  }
  const rows = await sql`
    select
      w.source_revision as "sourceRevision",
      p.published_revision as "publishedRevision"
    from worksheets w
    left join dazit_publications p on p.worksheet_id = w.id
    where w.id = ${worksheetId}
      and (${user.isAdmin} or w.owner_user_id = ${user.id})
  ` as Array<{ sourceRevision: string | number; publishedRevision: string | number | null }>;
  if (!rows[0]) return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
  const sourceRevision = Number(rows[0].sourceRevision);
  const publishedRevision = rows[0].publishedRevision === null
    ? null
    : Number(rows[0].publishedRevision);
  return NextResponse.json({
    status: publishedRevision === null
      ? 'unpublished'
      : publishedRevision === sourceRevision
        ? 'current'
        : 'outdated',
    sourceRevision,
    publishedRevision,
  });
}
