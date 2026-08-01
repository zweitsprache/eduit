import { get } from '@vercel/blob';
import { worksheetBySlug } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Dazit Blob is not configured.', { status: 503 });

  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet?.blobPath) return new Response('PDF not found.', { status: 404 });
  const result = await get(worksheet.blobPath, {
    access: 'private',
    token,
  });
  if (!result) return new Response('PDF not found.', { status: 404 });
  if (result.statusCode === 304) {
    return new Response(null, { status: 304 });
  }
  return new Response(result.stream, {
    headers: {
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'Content-Disposition': `attachment; filename="${worksheet.slug}.pdf"`,
      'Content-Length': String(result.blob.size),
      'Content-Type': result.blob.contentType || 'application/pdf',
      ETag: result.blob.etag,
      Link: `<${absoluteDazitUrl(`/documents/${worksheet.slug}`)}>; rel="canonical"`,
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
