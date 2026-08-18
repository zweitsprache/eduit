import { get } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ worksheetId: string; page: string }> },
) {
  const tokens = [
    process.env.DAZIT_BLOB_READ_WRITE_TOKEN,
    process.env.BLOB_READ_WRITE_TOKEN,
  ].filter((value): value is string => Boolean(value));
  if (!tokens.length) return new Response('Dazit Blob is not configured.', { status: 503 });
  const { worksheetId, page } = await params;
  const explicitPath = new URL(request.url).searchParams.get('path');
  const pageIndex = Number.parseInt(page, 10) - 1;
  const thumbnailPath = explicitPath
    ? decodeURIComponent(explicitPath)
    : `worksheets/${worksheetId}/thumbnails/page-${pageIndex + 1}.webp`;

  if (explicitPath) {
    // Restrict lookup to worksheet thumbnail assets only.
    if (!/^worksheets\/[^/]+\/thumbnails\/page-\d+\.webp$/i.test(thumbnailPath)) {
      return new Response('Thumbnail not found.', { status: 404 });
    }
  } else if (
    !/^[0-9a-f-]{36}$/i.test(worksheetId)
    || !Number.isInteger(pageIndex)
    || pageIndex < 0
    || pageIndex >= 100
  ) {
    return new Response('Thumbnail not found.', { status: 404 });
  }

  for (const token of tokens) {
    const result = await get(thumbnailPath, { access: 'private', token, useCache: false });
    if (!result || result.statusCode !== 200) continue;
    return new Response(result.stream, {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Length': String(result.blob.size),
        'Content-Type': 'image/webp',
        ETag: result.blob.etag,
      },
    });
  }
  return new Response('Thumbnail not found.', { status: 404 });
}
