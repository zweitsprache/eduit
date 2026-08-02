import { NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ ok: true });
  try {
    const body = await request.json() as { query?: unknown; resultCount?: unknown; filters?: unknown; anonymousSessionId?: unknown };
    const query = typeof body.query === 'string' ? body.query.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
    if (query.length < 2) return NextResponse.json({ ok: true });
    const resultCount = typeof body.resultCount === 'number' && Number.isFinite(body.resultCount)
      ? Math.max(0, Math.round(body.resultCount)) : 0;
    const filters = body.filters && typeof body.filters === 'object' ? body.filters : {};
    const session = typeof body.anonymousSessionId === 'string' ? body.anonymousSessionId.slice(0, 80) : null;
    const sql = neon(process.env.DATABASE_URL);
    await sql`insert into dazit_search_events (query, result_count, filters, anonymous_session_id)
      values (${query.toLocaleLowerCase('de-CH')}, ${resultCount}, ${JSON.stringify(filters)}::jsonb, ${session})`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
