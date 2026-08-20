import { NextResponse } from 'next/server';
import { Client } from '@upstash/workflow';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CURRENT_METADATA_VERSION = 4;

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

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  if (!process.env.QSTASH_TOKEN) {
    return NextResponse.json(
      { error: 'Upstash Workflow is not configured. Add the QStash environment variables.' },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => null) as { worksheetIds?: unknown } | null;
  const worksheetIds = Array.isArray(payload?.worksheetIds)
    ? [...new Set(payload.worksheetIds.filter((id): id is string => typeof id === 'string'))].slice(0, 25)
    : [];
  if (!worksheetIds.length) {
    return NextResponse.json({ error: 'Select at least one publication.' }, { status: 400 });
  }

  const eligibleRows = await sql`
    select worksheet_id as id
    from dazit_publications
    where worksheet_id = any(${worksheetIds}::uuid[])
      and document_type = 'Lernkarten'
      and metadata_version < ${CURRENT_METADATA_VERSION}
  ` as Array<{ id: string }>;
  const eligible = new Set(eligibleRows.map(({ id }) => id));
  const eligibleIds = worksheetIds.filter((id) => eligible.has(id));
  if (!eligibleIds.length) return NextResponse.json({ queued: 0, workflowRunIds: [] });
  const origin = new URL(request.url).origin;
  const client = new Client({
    baseUrl: process.env.QSTASH_URL,
    token: process.env.QSTASH_TOKEN,
  });
  const runs = await client.trigger(eligibleIds.map((worksheetId) => ({
    url: `${origin}/api/dazit/metadata-republish/workflow`,
    body: { worksheetId, origin },
    label: ['dazit-metadata', worksheetId],
    retries: 4,
    retryDelay: 'max(2000, pow(2, retried) * 1000)',
    flowControl: {
      key: 'dazit-metadata-republish',
      parallelism: 1,
      rate: 6,
      period: '1m' as const,
    },
  })));
  return NextResponse.json({ queued: runs.length, workflowRunIds: runs.map(({ workflowRunId }) => workflowRunId) });
}
