import archiver from 'archiver';
import { PassThrough, Readable } from 'node:stream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safePdfFilename(value: string, fallbackIndex: number) {
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const base = normalized || `worksheet-${fallbackIndex}`;
  return base.endsWith('.pdf') ? base : `${base}.pdf`;
}

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const files = formData.getAll('files').filter(
    (entry): entry is File => entry instanceof File,
  );
  if (files.length === 0) {
    return Response.json({ error: 'No files provided.' }, { status: 400 });
  }

  const archiveNameRaw = String(formData.get('archiveName') ?? 'worksheet-translations').trim();
  const archiveName = archiveNameRaw
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'worksheet-translations';

  const output = new PassThrough();
  const archive = archiver('zip', { zlib: { level: 0 } });
  archive.on('error', (error) => output.destroy(error));
  archive.pipe(output);

  void (async () => {
    const usedNames = new Set<string>();
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const baseName = safePdfFilename(file.name, index + 1);
        let name = baseName;
        let suffix = 2;
        while (usedNames.has(name)) {
          const withoutExt = baseName.replace(/\.pdf$/i, '');
          name = `${withoutExt}-${suffix}.pdf`;
          suffix += 1;
        }
        usedNames.add(name);
        const bytes = Buffer.from(await file.arrayBuffer());
        archive.append(
          bytes,
          { name },
        );
      }
      await archive.finalize();
    } catch (error) {
      archive.abort();
      output.destroy(error instanceof Error ? error : new Error('ZIP creation failed.'));
    }
  })();

  return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
    headers: {
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `attachment; filename="${archiveName}.zip"`,
      'Content-Type': 'application/zip',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
