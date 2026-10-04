import { NextResponse } from 'next/server';
import { replaceClockPlaceholders } from '@/lib/clock-placeholder';
import {
  fulfillPrivateMediaRequest,
  launchRenderingBrowser,
} from '@/lib/server-chromium';

export const runtime = 'nodejs';
export const maxDuration = 60;

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// <style> text can contain a raw "&" (e.g. Tailwind's "&_[data-foo]" nesting
// selectors), which is not a valid XML entity reference outside CDATA.
function cdataWrapStyleContents(head: string) {
  return head.replace(
    /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_match, open: string, css: string, close: string) => (
      `${open}<![CDATA[${css.replace(/\]\]>/g, ']] >')}]]>${close}`
    ),
  );
}

const FONT_MIME_TYPES: Record<string, string> = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
};

// A standalone .svg file has no "page" to keep fetching fonts for, so
// @font-face src urls (Google Fonts, self-hosted) must be baked in as data
// URIs or the embedded text silently falls back to a system font.
async function inlineFontUrls(css: string, origin: string, sessionCookie: string | null) {
  const urlPattern = /url\((['"]?)([^'")]+\.(?:woff2?|ttf|otf|eot))\1\)/gi;
  const matches = new Set<string>();
  for (const match of css.matchAll(urlPattern)) matches.add(match[2]);
  if (!matches.size) return css;

  const dataUris = new Map<string, string>();
  await Promise.all([...matches].map(async (url) => {
    try {
      const resolved = new URL(url, `${origin}/`);
      const response = await fetch(resolved, {
        headers: resolved.origin === origin && sessionCookie
          ? { cookie: sessionCookie }
          : undefined,
      });
      if (!response.ok) return;
      const extension = resolved.pathname.split('.').pop()?.toLowerCase() ?? '';
      const mime = FONT_MIME_TYPES[extension] ?? 'application/octet-stream';
      const buffer = Buffer.from(await response.arrayBuffer());
      dataUris.set(url, `data:${mime};base64,${buffer.toString('base64')}`);
    } catch {
      // Leave the original url() in place if the font can't be fetched.
    }
  }));

  return css.replace(urlPattern, (full, quote: string, url: string) => (
    dataUris.has(url) ? `url(${quote}${dataUris.get(url)}${quote})` : full
  ));
}

async function inlineFontUrlsInHead(head: string, origin: string, sessionCookie: string | null) {
  const styleTagPattern = /(<style[^>]*>)([\s\S]*?)(<\/style>)/gi;
  const matches = [...head.matchAll(styleTagPattern)];
  if (!matches.length) return head;

  let result = head;
  for (const match of matches) {
    const inlined = await inlineFontUrls(match[2], origin, sessionCookie);
    if (inlined !== match[2]) result = result.replace(match[2], inlined);
  }
  return result;
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

  const origin = new URL(request.url).origin;
  const sessionCookie = request.headers.get('cookie');
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
      <body><div class="png-stage">${replaceClockPlaceholders(payload.content)}</div></body>
    </html>`;

  let browser: import('playwright-core').Browser;
  try {
    browser = await launchRenderingBrowser({
      preferLocal: ['localhost', '127.0.0.1'].includes(new URL(origin).hostname),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Chrome is unavailable. Configure Browserless or CHROMIUM_EXECUTABLE_PATH on the server.',
      },
      { status: 503 },
    );
  }
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
      if (await fulfillPrivateMediaRequest(route, origin, sessionCookie)) return;

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
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 3000)),
        ]);
      } catch {
        // Continue if font loading fails
      }
      await Promise.race([
        Promise.all(Array.from(document.images).map((image) => (
          image.complete
            ? image.decode().catch(() => undefined)
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true });
                image.addEventListener('error', () => resolve(), { once: true });
              })
        ))),
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);
    });
    const stage = page.locator('.png-stage');
    const box = await stage.boundingBox();
    if (!box) throw new Error('Chrome could not measure the rendered block.');
    // XMLSerializer (unlike outerHTML) always self-closes void elements and
    // never emits HTML-only named entities, so the result is valid XML.
    const stageOuterHtml: string = await stage.evaluate(
      (element) => new XMLSerializer().serializeToString(element),
    );
    const stageWidth = Math.ceil(box.width);
    const stageHeight = Math.ceil(box.height);
    await context.close();

    const fontSafeHead = await inlineFontUrlsInHead(safeHead, origin, sessionCookie);

    // Embeds the fully-rendered HTML (with fonts/images resolved) in a
    // foreignObject so the file stays editable/scalable, not a raster image.
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${stageWidth}" height="${stageHeight}" viewBox="0 0 ${stageWidth} ${stageHeight}">
  <title>${escapeXml('eduit-block')}</title>
  <foreignObject x="0" y="0" width="${stageWidth}" height="${stageHeight}">
    <div xmlns="http://www.w3.org/1999/xhtml">
      ${cdataWrapStyleContents(fontSafeHead)}
      ${stageOuterHtml}
    </div>
  </foreignObject>
</svg>`;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': 'attachment; filename="eduit-block.svg"',
      },
    });
  } catch (error) {
    console.error('SVG export failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Chrome could not render the SVG.',
      },
      { status: 500 },
    );
  } finally {
    await browser.close();
  }
}
