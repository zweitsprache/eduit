import { NextResponse } from 'next/server';
import {
  createWorksheet,
  deleteWorksheet,
  getWorksheet,
  listWorksheets,
  updateWorksheet,
  validateWorksheetPatch,
} from '@/lib/worksheets';

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
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { worksheets: await listWorksheets() },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    }
    const worksheet = await getWorksheet(id);
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
    const payload = await request.json().catch(() => ({}));
    const input = validateWorksheetPatch(payload);
    return NextResponse.json({ worksheet: await createWorksheet(input) }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json() as { id?: string; worksheet?: unknown };
    if (!payload.id) throw new Error('Worksheet ID is required.');
    const patch = validateWorksheetPatch(payload.worksheet);
    return NextResponse.json({
      worksheet: await updateWorksheet(payload.id, patch),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new Error('Worksheet ID is required.');
    await deleteWorksheet(id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
