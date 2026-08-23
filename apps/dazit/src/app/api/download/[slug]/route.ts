import { get } from '@vercel/blob';
import { revalidateTag } from 'next/cache';
import { worksheetBySlug } from '@/lib/worksheets';
import { absoluteDazitUrl } from '@/lib/site-url';
import { incrementPublicationDownload } from '@/lib/db';
import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { consumeFreeDownload } from '@/lib/download-entitlements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const currentUser = await getCurrentDazitUser();
  if (!currentUser) {
    return Response.json({ error: 'authentication_required' }, { status: 401 });
  }
  if (request.headers.has('range')) {
    return Response.json({ error: 'range_not_supported' }, { status: 416 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return new Response('Dazit Blob is not configured.', { status: 503 });

  const worksheet = await worksheetBySlug((await params).slug);
  if (!worksheet) return new Response('PDF not found.', { status: 404 });
  const isAnswerKey = new URL(request.url).searchParams.get('type') === 'answer-key';
  const blobPath = isAnswerKey
    ? worksheet.answerKeyBlobPath
    : worksheet.blobPath;
  if (isAnswerKey && (!blobPath || blobPath === worksheet.blobPath)) {
    return new Response('PDF not found.', { status: 404 });
  }
  if (!blobPath) return new Response('PDF not found.', { status: 404 });
  let result;
  try {
    result = await get(blobPath, {
      access: 'private',
      token,
      // Republishing overwrites the same path, so a cached read would serve the
      // previous PDF.
      useCache: false,
    });
  } catch (error) {
    // A store/auth error here means BLOB_READ_WRITE_TOKEN is misconfigured, not that the file is missing.
    console.error('Dazit PDF blob store request failed.', blobPath, error);
    return new Response('PDF store unavailable.', { status: 502 });
  }
  if (!result || result.statusCode !== 200) return new Response('PDF not found.', { status: 404 });
  if (!worksheet.worksheetId) {
    return Response.json({ error: 'download_unavailable' }, { status: 503 });
  }

  let remaining: number | null = null;
  if (!currentUser.isAdmin) {
    const entitlement = await consumeFreeDownload({
      assetKind: isAnswerKey ? 'answer_key' : 'worksheet',
      userId: currentUser.id,
      worksheetId: worksheet.worksheetId,
    }).catch((error) => {
      console.error('Could not determine Dazit download entitlement.', error);
      return null;
    });
    if (!entitlement) {
      return Response.json({ error: 'entitlement_unavailable' }, { status: 503 });
    }
    if (!entitlement.allowed) {
      return Response.json({
        error: 'download_limit_reached',
        remaining: entitlement.remaining,
        resetsAt: entitlement.resetsAt,
      }, { status: 429 });
    }
    remaining = entitlement.remaining;
  }

  if (worksheet.worksheetId) {
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
      ...(remaining === null ? {} : {
        'X-Download-Limit': '3',
        'X-Download-Remaining': String(remaining),
      }),
    },
  });
}
