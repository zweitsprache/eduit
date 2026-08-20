import { get } from '@vercel/blob';
import { getCurrentAppUser } from '@/lib/auth/authorization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) return Response.json({ error: 'Unauthorized.' }, { status: 401 });

  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!path.startsWith(`dialogue-audio/${user.id}/`)) {
    return Response.json({ error: 'Audio not found.' }, { status: 404 });
  }

  const result = await get(path, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
  });
  if (!result) return Response.json({ error: 'Audio not found.' }, { status: 404 });
  if (result.statusCode === 304) {
    return new Response(null, { status: 304, headers: { ETag: result.blob.etag } });
  }
  if (result.statusCode !== 200 || !result.stream) {
    return Response.json({ error: 'Audio not found.' }, { status: 404 });
  }

  return new Response(result.stream, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': String(result.blob.size),
      'Content-Disposition': 'inline; filename="dialogue.mp3"',
      'X-Content-Type-Options': 'nosniff',
      ETag: result.blob.etag,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
