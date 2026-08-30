import archiver from 'archiver';
import { get } from '@vercel/blob';
import { PassThrough, Readable } from 'node:stream';
import { getCurrentDazitUser } from '@/lib/auth/authorization';
import { worksheetBySlug } from '@/lib/worksheets';
import { dazitBlobToken } from '@/lib/dazit-blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function pdfFilename(title: string, slug: string, usedNames: Set<string>) {
  const baseName = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 -]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .toLocaleLowerCase('de-CH') || slug;
  let filename = `${baseName}.pdf`;
  let suffix = 2;
  while (usedNames.has(filename)) {
    filename = `${baseName}-${suffix}.pdf`;
    suffix += 1;
  }
  usedNames.add(filename);
  return filename;
}

export async function POST(request: Request) {
  const currentUser = await getCurrentDazitUser();
  if (!currentUser?.isAdmin) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const payload = await request.json().catch(() => null) as { slugs?: unknown } | null;
  if (!Array.isArray(payload?.slugs) || payload.slugs.length === 0) {
    return Response.json({ error: 'no_results' }, { status: 400 });
  }

  const slugs = [...new Set(payload.slugs.filter(
    (slug): slug is string => typeof slug === 'string' && slug.length <= 200,
  ))];
  const token = dazitBlobToken();
  if (!token) return new Response('Dazit Blob is not configured.', { status: 503 });

  const output = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 0 } });
  archive.on('error', (error) => output.destroy(error));
  archive.pipe(output);

  void (async () => {
    const usedNames = new Set<string>();
    try {
      for (const slug of slugs) {
        const worksheet = await worksheetBySlug(slug);
        if (!worksheet?.blobPath) continue;
        const result = await get(worksheet.blobPath, {
          access: 'private',
          token,
          useCache: false,
        });
        if (!result || result.statusCode !== 200) continue;
        archive.append(Readable.from(result.stream as AsyncIterable<Uint8Array>), {
          name: pdfFilename(worksheet.title, worksheet.slug, usedNames),
        });
      }
      await archive.finalize();
    } catch (error) {
      archive.abort();
      output.destroy(error instanceof Error ? error : new Error('ZIP creation failed.'));
    }
  })();

  const date = new Date().toISOString().slice(0, 10);
  return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="dazit-suchergebnisse-${date}.zip"`,
      'Content-Type': 'application/zip',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}