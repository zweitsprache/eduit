import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { getUserMediaLocation } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const { id } = await context.params;
  const media = await getUserMediaLocation(id, user.id);
  if (!media) {
    return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  }
  const result = await get(media.blob_path, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
  });
  if (!result) {
    return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  }
  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: { ETag: result.blob.etag },
    });
  }
  if (result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: 'Media not found.' }, { status: 404 });
  }
  return new Response(result.stream, {
    headers: {
      'Content-Type': media.content_type,
      'Content-Length': String(media.byte_size),
      'Content-Disposition': `inline; filename="${encodeURIComponent(media.filename)}"`,
      'X-Content-Type-Options': 'nosniff',
      ETag: result.blob.etag,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
