import { access } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

const CHROME_PATHS = [
  process.env.CHROMIUM_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter((path): path is string => Boolean(path));

const PAGE_FORMATS = {
  'a4-portrait': { width: 794, height: 1123 },
  'a4-landscape': { width: 1123, height: 794 },
  'letter-portrait': { width: 816, height: 1056 },
  'letter-landscape': { width: 1056, height: 816 },
};

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
  const payload = await request.json().catch(() => null) as {
    content?: string;
    head?: string;
    docSize?: string;
    pageCount?: number;
  } | null;
  if (!payload?.content || payload.content.length > 4_000_000) {
    return NextResponse.json({ error: 'The rendered document is missing or too large.' }, { status: 400 });
  }
  const executablePath = await findChrome();
  if (!executablePath) {
    return NextResponse.json({ error: 'Chrome is unavailable.' }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const format = PAGE_FORMATS[payload.docSize as keyof typeof PAGE_FORMATS]
    ?? PAGE_FORMATS['a4-portrait'];
  const pageCount = Math.min(100, Math.max(1, Math.round(payload.pageCount || 1)));
  const safeHead = (payload.head ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
  const html = `<!doctype html><html><head><base href="${origin}/">${safeHead}
    <style>
      html, body { margin: 0 !important; background: white !important; }
      *, *::before, *::after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .editor-content .tiptap {
        display: flow-root !important;
        width: ${format.width}px !important;
        margin: 0 !important;
        border: 0 !important;
      }
      .tiptap-pagination-gap { display: none !important; height: 0 !important; border: 0 !important; }
      .custom-block--selected, .heading-node--selected, .ProseMirror-selectednode {
        border-color: transparent !important; outline: 0 !important; box-shadow: none !important;
      }
      .custom-block--selected::after, .heading-node--selected::after,
      .ProseMirror-selectednode::after, .rich-text-node__selection-fragment { display: none !important; }
    </style></head><body><div class="editor-content">${payload.content}</div></body></html>`;

  const browser = await chromium.launch({ executablePath, headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: format.width, height: format.height },
      deviceScaleFactor: 1,
    });
    const renderShellUrl = new URL('/__eduit-thumbnail-render-shell__', origin).href;
    await page.route('**/*', async (route) => {
      if (route.request().url() === renderShellUrl) {
        await route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' });
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
        image.complete ? image.decode().catch(() => undefined) : Promise.resolve()
      )));
    });
    const cropHeight = Math.min(format.height, Math.round(format.width * 9 / 16));
    await page.setViewportSize({ width: format.width, height: cropHeight });
    await page.evaluate(
      ({ documentHeight }) => {
        document.documentElement.style.minHeight = `${documentHeight}px`;
        document.body.style.minHeight = `${documentHeight}px`;
      },
      { documentHeight: pageCount * format.height },
    );
    const thumbnails: string[] = [];
    for (let index = 0; index < pageCount; index += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), index * format.height);
      const image = await page.screenshot({
        type: 'webp',
        quality: 82,
      });
      thumbnails.push(Buffer.from(image).toString('base64'));
    }
    return NextResponse.json({ thumbnails });
  } catch (error) {
    console.error('Thumbnail rendering failed.', error);
    return NextResponse.json({ error: 'Chrome could not render the thumbnails.' }, { status: 500 });
  } finally {
    await browser.close();
  }
}
