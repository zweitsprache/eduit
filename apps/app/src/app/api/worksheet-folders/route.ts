import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import {
  createWorksheetFolder,
  deleteWorksheetFolder,
  listWorksheetFolders,
  updateWorksheetFolder,
  validateFolderId,
  validateFolderName,
} from '@/lib/worksheet-folders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : 'Folder request failed.';
  return NextResponse.json({ error: message }, {
    status: /not found/i.test(message) ? 404 : 400,
  });
}

export async function GET() {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    return NextResponse.json(
      { folders: await listWorksheetFolders(user.id) },
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
    const payload = await request.json() as {
      name?: unknown;
      parentId?: unknown;
    };
    const folder = await createWorksheetFolder(
      user.id,
      validateFolderName(payload.name),
      validateFolderId(payload.parentId, 'Parent folder'),
    );
    return NextResponse.json({ folder }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const payload = await request.json() as {
      id?: unknown;
      name?: unknown;
      parentId?: unknown;
    };
    const id = validateFolderId(payload.id, 'Folder');
    if (!id) throw new Error('Folder ID is required.');
    const folder = await updateWorksheetFolder(id, user.id, {
      ...('name' in payload
        ? { name: validateFolderName(payload.name) }
        : {}),
      ...('parentId' in payload
        ? { parentId: validateFolderId(payload.parentId, 'Parent folder') }
        : {}),
    });
    return NextResponse.json({ folder });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    const id = validateFolderId(
      new URL(request.url).searchParams.get('id'),
      'Folder',
    );
    if (!id) throw new Error('Folder ID is required.');
    await deleteWorksheetFolder(id, user.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
