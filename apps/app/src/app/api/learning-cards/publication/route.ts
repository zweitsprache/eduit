import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { createLearningLinkToken } from '@/lib/learning-card-publication';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID_PATTERN = /^[0-9a-f-]{36}$/i;

type PublicationRow = {
  worksheetId: string;
  token: string;
  title: string;
  snapshot: unknown;
  isPublished: boolean;
  publishedAt: string;
  updatedAt: string;
};

function snapshotCardCount(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 0;
  const items = (snapshot as { items?: unknown }).items;
  return Array.isArray(items) ? items.length : 0;
}

async function requireWorksheetAccess(worksheetId: string) {
  const user = await getCurrentAppUser();
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized.' }, { status: 401 }) };
  }

  const rows = await sql`
    select id
    from worksheets
    where id = ${worksheetId}
      and (${user.isAdmin} or owner_user_id = ${user.id})
    limit 1
  ` as Array<{ id: string }>;

  if (!rows[0]) {
    return { error: NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 }) };
  }

  return { user };
}

export async function GET(request: Request) {
  try {
    const worksheetId = new URL(request.url).searchParams.get('worksheetId') || '';
    if (!UUID_PATTERN.test(worksheetId)) {
      return NextResponse.json({ error: 'Valid worksheet ID is required.' }, { status: 400 });
    }

    const access = await requireWorksheetAccess(worksheetId);
    if (access.error) return access.error;

    const rows = await sql`
      select
        worksheet_id as "worksheetId",
        token,
        title,
        snapshot,
        is_published as "isPublished",
        published_at as "publishedAt",
        updated_at as "updatedAt"
      from learning_card_publications
      where worksheet_id = ${worksheetId}
      limit 1
    ` as PublicationRow[];

    const publication = rows[0];
    if (!publication) {
      return NextResponse.json({ publication: null }, { headers: { 'Cache-Control': 'no-store' } });
    }

    return NextResponse.json({
      publication: {
        worksheetId: publication.worksheetId,
        title: publication.title,
        token: publication.token,
        url: `${new URL(request.url).origin}/learn/${publication.token}`,
        isPublished: publication.isPublished,
        cardCount: snapshotCardCount(publication.snapshot),
        publishedAt: publication.publishedAt,
        updatedAt: publication.updatedAt,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load learning-card publication.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => null) as {
      worksheetId?: unknown;
      action?: unknown;
    } | null;
    const worksheetId = typeof payload?.worksheetId === 'string' ? payload.worksheetId : '';
    const action = payload?.action;
    if (!UUID_PATTERN.test(worksheetId)) {
      return NextResponse.json({ error: 'Valid worksheet ID is required.' }, { status: 400 });
    }
    if (action !== 'unpublish' && action !== 'regenerate') {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }

    const access = await requireWorksheetAccess(worksheetId);
    if (access.error) return access.error;

    const rows = await sql`
      select
        worksheet_id as "worksheetId",
        token,
        title,
        snapshot,
        is_published as "isPublished",
        published_at as "publishedAt",
        updated_at as "updatedAt"
      from learning_card_publications
      where worksheet_id = ${worksheetId}
      limit 1
    ` as PublicationRow[];
    const publication = rows[0];
    if (!publication) {
      return NextResponse.json({ error: 'No published learning-card link found for this worksheet.' }, { status: 404 });
    }

    if (action === 'unpublish') {
      await sql`
        update learning_card_publications
        set is_published = false,
            updated_at = now()
        where worksheet_id = ${worksheetId}
      `;
      publication.isPublished = false;
    }

    if (action === 'regenerate') {
      const nextToken = createLearningLinkToken();
      await sql`
        update learning_card_publications
        set token = ${nextToken},
            is_published = true,
            updated_at = now()
        where worksheet_id = ${worksheetId}
      `;
      publication.token = nextToken;
      publication.isPublished = true;
    }

    return NextResponse.json({
      publication: {
        worksheetId: publication.worksheetId,
        title: publication.title,
        token: publication.token,
        url: `${new URL(request.url).origin}/learn/${publication.token}`,
        isPublished: publication.isPublished,
        cardCount: snapshotCardCount(publication.snapshot),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not update learning-card publication.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}