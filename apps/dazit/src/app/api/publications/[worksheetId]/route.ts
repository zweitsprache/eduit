import { neon } from '@neondatabase/serverless';
import { del, get, list, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCurrentDazitUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ worksheetId: string }> };

const documentTypes = ['Arbeitsblatt', 'Merkblatt', 'Verbtabelle', 'Deklinationstabelle', 'Kommunikationskarten', 'Lernkarten', 'Wechselspiel', 'Domino', 'Dialog', 'Wörterliste', 'Leseverstehen'];
const levels = ['A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2'];
const actionCompetencies = ['Lesen', 'Hören', 'Monologisches Sprechen', 'Dialogisches Sprechen', 'Monologisches Schreiben', 'Dialogisches Schreiben'];
const languageCompetencies = ['Wortschatz', 'Grammatik', 'Aussprache', 'Intonation', 'Orthografie'];
const actionFields = ['Deutschkurs', 'Gesundheit', 'Sicherheit und Notfälle', 'Familie und Partnerschaft', 'Kinder und Schule', 'Soziales Netz', 'Beratung und Unterstützung', 'Einkaufen', 'Ernährung', 'Wohnen', 'Mobilität', 'Finanzen und Versicherungen', 'Behörden', 'Freizeit und Hobbys', 'Kultur und Identität', 'Arbeit', 'Arbeitssuche', 'Umwelt und Klima', 'Technologie', 'Weiterbildung'];

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanHtml(value: unknown) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(?:iframe|object|embed|style|link|meta)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed|style)>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '')
    .slice(0, 30_000);
}

function cleanList(value: unknown, allowed?: string[]) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => cleanText(item, 60)).filter(Boolean))]
    .filter((item) => !allowed || allowed.includes(item))
    .slice(0, 10);
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const currentUser = await getCurrentDazitUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }
    const { worksheetId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(worksheetId)) {
      return NextResponse.json({ error: 'Invalid worksheet ID.' }, { status: 400 });
    }
    const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!payload) return NextResponse.json({ error: 'Invalid metadata.' }, { status: 400 });
    const title = cleanText(payload.title, 200);
    const excerpt = cleanText(payload.excerpt, 280);
    const searchSnippet = cleanText(payload.searchSnippet, 180);
    const documentType = cleanText(payload.documentType, 50);
    const level = cleanText(payload.level, 10);
    const actionField = cleanText(payload.actionField, 100);
    if (!title || !excerpt || !documentTypes.includes(documentType) || !levels.includes(level)) {
      return NextResponse.json({ error: 'Required metadata is invalid.' }, { status: 400 });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const databaseUrl = process.env.DATABASE_URL;
    if (!token || !databaseUrl) return NextResponse.json({ error: 'Dazit storage is not configured.' }, { status: 500 });
    const sql = neon(databaseUrl);
    const rows = await sql`
      update dazit_publications set
        title = ${title}, document_type = ${documentType}, excerpt = ${excerpt},
        search_snippet = ${searchSnippet || null},
        description_html = ${cleanHtml(payload.descriptionHtml)}, level = ${level},
        tags = ${JSON.stringify(cleanList(payload.tags))}::jsonb,
        action_competencies = ${JSON.stringify(cleanList(payload.actionCompetencies, actionCompetencies))}::jsonb,
        language_competencies = ${JSON.stringify(cleanList(payload.languageCompetencies, languageCompetencies))}::jsonb,
        action_competency_contribution_html = ${cleanHtml(payload.actionCompetencyContributionHtml)},
        action_field = ${actionFields.includes(actionField) ? actionField : null}, updated_at = now()
      where worksheet_id = ${worksheetId}
      returning slug
    ` as Array<{ slug: string }>;
    if (!rows[0]) return NextResponse.json({ error: 'Publication not found.' }, { status: 404 });
    const manifestPath = `library/${worksheetId}.json`;
    const manifestResult = await get(manifestPath, { access: 'private', token, useCache: false });
    if (manifestResult?.stream) {
      const manifest = await new Response(manifestResult.stream).json() as Record<string, unknown>;
      await put(manifestPath, JSON.stringify({
        ...manifest, title, description: excerpt, searchSnippet: searchSnippet || undefined, documentType, subject: level,
        grade: level, tags: cleanList(payload.tags),
      }, null, 2), {
        access: 'private', addRandomSuffix: false, allowOverwrite: true,
        contentType: 'application/json', token,
      });
    }
    return NextResponse.json({ ok: true, slug: rows[0].slug });
  } catch (error) {
    console.error('Could not update Dazit metadata.', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Update failed.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const currentUser = await getCurrentDazitUser();
    if (!currentUser?.isAdmin) {
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    }
    const { worksheetId } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(worksheetId)) {
      return NextResponse.json({ error: 'Invalid worksheet ID.' }, { status: 400 });
    }
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const databaseUrl = process.env.DATABASE_URL;
    if (!token || !databaseUrl) {
      return NextResponse.json(
        { error: 'Dazit storage is not configured.' },
        { status: 500 },
      );
    }

    const sql = neon(databaseUrl);
    const rows = await sql`
      select worksheet_id
      from dazit_publications
      where worksheet_id = ${worksheetId}
    `;
    if (!rows[0]) {
      return NextResponse.json({ error: 'Publication not found.' }, { status: 404 });
    }

    const publicationBlobs = await list({
      prefix: `worksheets/${worksheetId}/`,
      limit: 1000,
      token,
    });
    const blobPaths = [
      ...publicationBlobs.blobs.map(({ pathname }) => pathname),
      `library/${worksheetId}.json`,
    ];
    if (blobPaths.length) await del(blobPaths, { token });

    await sql`
      delete from dazit_publications
      where worksheet_id = ${worksheetId}
    `;
    await sql`
      update worksheets
      set status = 'draft', updated_at = now()
      where id = ${worksheetId}
    `;

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Could not delete Dazit publication.', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Deletion failed.' },
      { status: 500 },
    );
  }
}
