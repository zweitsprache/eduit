import { del, get, put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { getCurrentAppUser } from '@/lib/auth/authorization';
import { launchRenderingBrowser } from '@/lib/server-chromium';
import {
  getWorksheetPreviewLocation,
  updateWorksheetPreview,
} from '@/lib/worksheets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PREVIEW_WIDTH = 960;
const PREVIEW_HEIGHT = 540;
function safeHead(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
}

function safeContent(value: string) {
  return value
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<(?:iframe|object|embed)\b[^>]*>[\s\S]*?<\/(?:iframe|object|embed)>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '');
}

export async function GET(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) {
    return NextResponse.json(
      { error: 'Worksheet ID is required.' },
      { status: 400 },
    );
  }
  const preview = await getWorksheetPreviewLocation(
    id,
    user.id,
    user.isAdmin,
  );
  if (!preview) {
    return NextResponse.json({ error: 'Preview not found.' }, { status: 404 });
  }
  const result = await get(preview.blobPath, {
    access: 'private',
    ifNoneMatch: request.headers.get('if-none-match') ?? undefined,
  });
  if (!result) {
    return NextResponse.json({ error: 'Preview not found.' }, { status: 404 });
  }
  if (result.statusCode === 304) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache',
      },
    });
  }
  if (result.statusCode !== 200 || !result.stream) {
    return NextResponse.json({ error: 'Preview not found.' }, { status: 404 });
  }
  return new Response(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType,
      'X-Content-Type-Options': 'nosniff',
      ETag: result.blob.etag,
      'Cache-Control': 'private, no-cache',
      ...(preview.updatedAt
        ? { 'Last-Modified': new Date(preview.updatedAt).toUTCString() }
        : {}),
    },
  });
}

export async function POST(request: Request) {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 8_000_000) {
    return NextResponse.json(
      { error: 'The worksheet is too large to preview.' },
      { status: 413 },
    );
  }

  let payload: {
    id?: string;
    content?: string;
    head?: string;
    sourceWidth?: number;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid preview request.' },
      { status: 400 },
    );
  }
  if (
    !payload.id
    || !payload.content
    || payload.content.length > 4_000_000
  ) {
    return NextResponse.json(
      { error: 'The rendered worksheet is missing or too large.' },
      { status: 400 },
    );
  }
  const sourceWidth = Math.round(Number(payload.sourceWidth));
  if (!Number.isFinite(sourceWidth) || sourceWidth < 300 || sourceWidth > 2400) {
    return NextResponse.json(
      { error: 'The worksheet has an invalid preview width.' },
      { status: 400 },
    );
  }

  const origin = new URL(request.url).origin;
  const scale = PREVIEW_WIDTH / sourceWidth;
  const html = `<!doctype html>
    <html>
      <head>
        <base href="${origin}/">
        ${safeHead(payload.head ?? '')}
        <style>
          html, body {
            width: ${PREVIEW_WIDTH}px !important;
            height: ${PREVIEW_HEIGHT}px !important;
            margin: 0 !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .preview-viewport {
            position: relative;
            width: ${PREVIEW_WIDTH}px;
            height: ${PREVIEW_HEIGHT}px;
            overflow: hidden;
            background: #ffffff;
          }
          .preview-document {
            position: absolute;
            top: 0;
            left: 50%;
            width: ${sourceWidth}px;
            transform: translateX(-50%) scale(${scale});
            transform-origin: top center;
          }
          .preview-document > .tiptap {
            margin-top: 0 !important;
          }
          .ProseMirror-selectednode::after,
          .custom-block--selected::after,
          .heading-node--selected::after,
          .rich-text-node__selection-fragment {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="preview-viewport">
          <div class="preview-document">${safeContent(payload.content)}</div>
        </div>
      </body>
    </html>`;

  let browser: import('playwright-core').Browser | null = null;
  try {
    const [{ default: sharp }] = await Promise.all([
      import('sharp'),
    ]);
    browser = await launchRenderingBrowser();
    const context = await browser.newContext({
      deviceScaleFactor: 1,
      viewport: { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT },
    });
    const page = await context.newPage();
    const renderShellUrl =
      new URL('/__eduit-worksheet-preview-shell__', origin).href;
    await page.route('**/*', async (route) => {
      if (route.request().url() === renderShellUrl) {
        await route.fulfill({
          contentType: 'text/html',
          body: '<!doctype html><html><head></head><body></body></html>',
        });
        return;
      }
      const url = new URL(route.request().url());
      const allowed = url.origin === origin
        || url.hostname === 'fonts.googleapis.com'
        || url.hostname === 'fonts.gstatic.com'
        || url.protocol === 'data:'
        || url.protocol === 'blob:';
      if (allowed) await route.continue();
      else await route.abort();
    });
    await page.goto(renderShellUrl, { waitUntil: 'domcontentloaded' });
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(Array.from(document.images).map((image) => (
        image.complete
          ? image.decode().catch(() => undefined)
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            })
      )));
    });
    const png = await page.locator('.preview-viewport').screenshot({
      animations: 'disabled',
      type: 'png',
    });
    const webp = await sharp(png)
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
    await context.close();
    const blob = await put(
      `worksheet-previews/${user.id}/${payload.id}/preview.webp`,
      webp,
      {
        access: 'private',
        addRandomSuffix: true,
        cacheControlMaxAge: 2_592_000,
        contentType: 'image/webp',
      },
    );
    try {
      const {
        previousBlobPath,
        previewUpdatedAt,
      } = await updateWorksheetPreview(
        payload.id,
        user.id,
        blob.pathname,
        user.isAdmin,
      );
      if (previousBlobPath && previousBlobPath !== blob.pathname) {
        await del(previousBlobPath).catch(() => undefined);
      }
      return NextResponse.json({ previewUpdatedAt });
    } catch (storageError) {
      await del(blob.pathname).catch(() => undefined);
      throw storageError;
    }
  } catch (error) {
    console.error('Worksheet preview generation failed.', error);
    return NextResponse.json(
      {
        error: error instanceof Error
          ? `Worksheet preview failed: ${error.message}`
          : 'The worksheet preview could not be generated or stored.',
      },
      { status: 500 },
    );
  } finally {
    await browser?.close();
  }
}
