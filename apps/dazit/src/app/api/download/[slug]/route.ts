import { get } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { worksheetBySlug } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { incrementPublicationDownload } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Dazit Blob is not configured.', { status: 503 });

  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) return new Response('PDF not found.', { status: 404 });
  const isAnswerKey = new URL(request.url).searchParams.get('type') === 'answer-key';
  const blobPath = isAnswerKey ? worksheet.answerKeyBlobPath : worksheet.blobPath;
  if (!blobPath) return new Response('PDF not found.', { status: 404 });
  const result = await get(blobPath, {
    access: 'private',
    token,
    // Republishing overwrites the same path, so a cached read would serve the
    // previous PDF.
    useCache: false,
  });
  if (!result) return new Response('PDF not found.', { status: 404 });
  if (result.statusCode === 304) {
    return new Response(null, { status: 304 });
  }
  if (!request.headers.has('range') && worksheet.worksheetId) {
    await incrementPublicationDownload(worksheet.worksheetId).catch((error) => {
      console.error('Could not increment Dazit download count.', error);
    });
    revalidateTag('dazit-library', { expire: 0 });
  }
  return new Response(result.stream, {
    headers: {
      'Cache-Control': 'private, max-age=0, must-revalidate',
      'Content-Disposition': `attachment; filename="${worksheet.slug}${isAnswerKey ? '-solution-key' : ''}.pdf"`,
      'Content-Length': String(result.blob.size),
      'Content-Type': result.blob.contentType || 'application/pdf',
      ETag: result.blob.etag,
      Link: `<${absoluteDazitUrl(`/documents/${worksheet.slug}`)}>; rel="canonical"`,
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
