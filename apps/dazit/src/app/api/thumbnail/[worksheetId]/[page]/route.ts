import { get } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ worksheetId: string; page: string }> },
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Dazit Blob is not configured.', { status: 503 });
  const { worksheetId, page } = await params;
  const pageIndex = Number.parseInt(page, 10) - 1;
  if (
    !/^[0-9a-f-]{36}$/i.test(worksheetId)
    || !Number.isInteger(pageIndex)
    || pageIndex < 0
    || pageIndex >= 100
  ) return new Response('Thumbnail not found.', { status: 404 });
  const thumbnailPath = `worksheets/${worksheetId}/thumbnails/page-${pageIndex + 1}.webp`;

  const result = await get(thumbnailPath, { access: 'private', token });
  if (!result || result.statusCode !== 200) {
    return new Response('Thumbnail not found.', { status: 404 });
  }
  return new Response(result.stream, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Length': String(result.blob.size),
      'Content-Type': 'image/webp',
      ETag: result.blob.etag,
    },
  });
}
