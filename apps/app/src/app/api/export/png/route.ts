import { access } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const CHROME_PATHS = [
  process.env.CHROMIUM_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((path): path is string => Boolean(path));

async function findChrome() {
  for (const path of CHROME_PATHS) {
    try {
      await access(path);
      return path;
    } catch {
      // Try the next supported location.
    }
  }
  return null;
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 5_000_000) {
    return NextResponse.json({ error: 'The block is too large to export.' }, { status: 413 });
  }

  let payload: { content?: string; head?: string; width?: number };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid export request.' }, { status: 400 });
  }

  if (!payload.content || payload.content.length > 4_000_000) {
    return NextResponse.json({ error: 'The rendered block is missing or too large.' }, { status: 400 });
  }
  const blockWidth = Math.round(Number(payload.width));
  if (!Number.isFinite(blockWidth) || blockWidth < 100 || blockWidth > 2400) {
    return NextResponse.json({ error: 'The rendered block has an invalid width.' }, { status: 400 });
  }

  const executablePath = await findChrome();
  if (!executablePath) {
    return NextResponse.json(
      { error: 'Chrome is unavailable. Configure CHROMIUM_EXECUTABLE_PATH on the server.' },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;
  const safeHead = (payload.head ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
  const padding = 48;
  const html = `<!doctype html>
    <html>
      <head>
        <base href="${origin}/">
        ${safeHead}
        <style>
          html, body {
            margin: 0 !important;
            background: white !important;
          }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .png-stage {
            display: flow-root;
            box-sizing: content-box;
            width: ${blockWidth}px;
            padding: ${padding}px;
            background: white;
          }
          .png-stage > .tiptap {
            width: ${blockWidth}px !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
          }
          .png-stage .custom-block,
          .png-stage .heading-node,
          .png-stage [data-type="page-break"] {
            margin-block: 0 !important;
          }
          .png-stage .ProseMirror-selectednode::after,
          .png-stage .custom-block--selected::after,
          .png-stage .heading-node--selected::after {
            display: none !important;
          }
        </style>
      </head>
      <body><div class="png-stage">${payload.content}</div></body>
    </html>`;

  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const context = await browser.newContext({
      deviceScaleFactor: 3,
      viewport: { width: blockWidth + padding * 2, height: 1200 },
    });
    const page = await context.newPage();
    const renderShellUrl = new URL('/__eduit-png-render-shell__', origin).href;
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
    await page.setContent(html, { waitUntil: 'networkidle' });
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
    const stage = page.locator('.png-stage');
    const png = await stage.screenshot({
      animations: 'disabled',
      type: 'png',
    });
    await context.close();

    return new Response(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'attachment; filename="eduit-block.png"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Chrome could not render the PNG.' }, { status: 500 });
  } finally {
    await browser.close();
  }
}
