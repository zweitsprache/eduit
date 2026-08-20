import { get } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Public, unauthenticated: reached from a printed worksheet's QR code, so no
// user session exists. The private blob store's addRandomSuffix path segment
// is the de facto access token — only the `dialogue-audio-public/` prefix and
// `.mp3` suffix are enforced to reject unrelated paths.
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') ?? '';
  if (!path.startsWith('dialogue-audio-public/') || !path.endsWith('.mp3')) {
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
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
