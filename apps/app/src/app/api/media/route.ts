import { del, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import {
  createUserMedia,
  listUserMedia,
  removeUserMedia,
  updateUserMedia,
} from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function errorResponse(error: unknown, status = 400) {
  return NextResponse.json({
    error: error instanceof Error ? error.message : 'Media request failed.',
  }, { status });
}

function safeFilename(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(-180) || 'image';
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);
  const query = new URL(request.url).searchParams.get('q') ?? '';
  return NextResponse.json({ media: await listUserMedia(user.id, query) });
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return errorResponse('Image file is required.');
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return errorResponse('Use a JPEG, PNG, WebP, or GIF image.');
  }
  if (!file.size || file.size > MAX_UPLOAD_SIZE) {
    return errorResponse('Images must be smaller than 10 MB.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(bytes, { animated: true }).metadata();
    if (!metadata.width || !metadata.height) throw new Error();
  } catch {
    return errorResponse('The uploaded file is not a valid image.');
  }

  const filename = safeFilename(file.name);
  const blob = await put(`user-media/${user.id}/${filename}`, bytes, {
    access: 'private',
    addRandomSuffix: true,
    contentType: file.type,
    cacheControlMaxAge: 31_536_000,
  });
  try {
    const rawName = typeof form?.get('name') === 'string'
      ? String(form.get('name')).trim()
      : '';
    const media = await createUserMedia(user.id, {
      blobPath: blob.pathname,
      filename: file.name.slice(0, 255),
      name: (rawName || file.name.replace(/\.[^.]+$/, '') || 'Image').slice(0, 160),
      alt: typeof form?.get('alt') === 'string'
        ? String(form.get('alt')).trim().slice(0, 500)
        : '',
      contentType: file.type,
      size: file.size,
      width: metadata.width,
      height: metadata.height,
    });
    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    await del(blob.pathname).catch(() => undefined);
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);
  const payload = await request.json().catch(() => null) as {
    id?: string;
    name?: string;
    alt?: string;
  } | null;
  if (!payload?.id || typeof payload.name !== 'string') {
    return errorResponse('Media ID and name are required.');
  }
  try {
    return NextResponse.json({
      media: await updateUserMedia(payload.id, user.id, {
        name: payload.name,
        alt: typeof payload.alt === 'string' ? payload.alt : '',
      }),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return errorResponse('Unauthorized.', 401);
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return errorResponse('Media ID is required.');
  try {
    const blobPath = await removeUserMedia(id, user.id);
    await del(blobPath).catch(() => undefined);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
