import { NextResponse } from 'next/server';
import { del, list } from '@vercel/blob';
import {
  createWorksheet,
  deleteWorksheet,
  getWorksheet,
  listWorksheets,
  updateWorksheet,
  validateWorksheetPatch,
} from '@/lib/worksheets';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { sql } from '@/lib/neon';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Worksheet request failed.';
  return NextResponse.json({ error: message }, {
    status: /not found/i.test(message) ? 404 : 400,
  });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { worksheets: await listWorksheets(user.id, user.isAdmin) },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const aliases = await sql`
      select worksheet_id as id from worksheet_aliases where alias_id = ${id}
    ` as Array<{ id: string }>;
    const worksheet = await getWorksheet(
      aliases[0]?.id ?? id,
      user.id,
      user.isAdmin,
    );
    if (!worksheet) return NextResponse.json({ error: 'Worksheet not found.' }, { status: 404 });
    return NextResponse.json(
      { worksheet },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const payload = await request.json().catch(() => ({}));
    const input = validateWorksheetPatch(payload);
    return NextResponse.json(
      { worksheet: await createWorksheet(user.id, input) },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const payload = await request.json() as { id?: string; worksheet?: unknown };
    if (!payload.id) throw new Error('Worksheet ID is required.');
    const patch = validateWorksheetPatch(payload.worksheet);
    return NextResponse.json({
      worksheet: await updateWorksheet(payload.id, user.id, patch, user.isAdmin),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new Error('Worksheet ID is required.');
    const deleteFromDazit = new URL(request.url).searchParams.get('deleteFromDazit') === 'true';
    const worksheet = await getWorksheet(id, user.id, user.isAdmin);
    if (!worksheet) throw new Error('Worksheet not found.');
    if (deleteFromDazit) {
      const token = process.env.BLOB_READ_WRITE_TOKEN;
      if (!token) throw new Error('Dazit storage is not configured.');
      const publicationBlobs = await list({
        prefix: `worksheets/${id}/`,
        limit: 1000,
        token,
      });
      await del([
        ...publicationBlobs.blobs.map(({ pathname }) => pathname),
        `library/${id}.json`,
      ], { token });
      await sql`delete from dazit_publications where worksheet_id = ${id}`;
    }
    await deleteWorksheet(id, user.id, user.isAdmin);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
