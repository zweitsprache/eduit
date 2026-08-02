import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

  const worksheets = await sql`
    select
      w.id,
      w.title,
      (w.preview_blob_path is not null) as "hasPreview",
      w.created_at as "createdAt"
    from worksheets w
    join brand_profiles b on b.id = w.brand_profile_id
    left join dazit_publications p on p.worksheet_id = w.id
    where p.worksheet_id is null
      and b.name = 'dazit'
      and w.content_html like '%data-type="learning-cards"%'
    order by w.created_at asc, w.title asc
  `;

  return NextResponse.json(
    { worksheets },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
