import { chromium } from 'playwright-core';
import { NextResponse } from 'next/server';
import { findServerChromium } from '@/lib/server-chromium';

export const runtime = 'nodejs';
export const maxDuration = 60;

const PAGE_FORMATS = {
  'a4-portrait': { cssSize: '210mm 297mm', pageHeight: '297mm' },
  'a4-landscape': { cssSize: '297mm 210mm', pageHeight: '210mm' },
  'letter-portrait': { cssSize: '215.9mm 279.4mm', pageHeight: '279.4mm' },
  'letter-landscape': { cssSize: '279.4mm 215.9mm', pageHeight: '215.9mm' },
};

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 5_000_000) {
    return NextResponse.json({ error: 'The document is too large to export.' }, { status: 413 });
  }

  let payload: { content?: string; head?: string; docSize?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid export request.' }, { status: 400 });
  }

  if (!payload.content || payload.content.length > 4_000_000) {
    return NextResponse.json({ error: 'The rendered document is missing or too large.' }, { status: 400 });
  }

  const chrome = await findServerChromium();
  if (!chrome) {
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
  const pageFormat = PAGE_FORMATS[payload.docSize as keyof typeof PAGE_FORMATS]
    ?? PAGE_FORMATS['a4-portrait'];
  const html = `<!doctype html>
    <html>
      <head>
        <base href="${origin}/">
        ${safeHead}
        <style>
          @page {
            size: ${pageFormat.cssSize};
            margin: 0;
          }
          html, body { margin: 0 !important; background: white !important; }
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .editor-content .tiptap {
            display: flow-root !important;
            margin: 0 auto !important;
            border: 0 !important;
          }
          .tiptap-pagination-gap {
            display: none !important;
            height: 0 !important;
            border: 0 !important;
          }
          .custom-block--selected,
          .heading-node--selected,
          .ProseMirror-selectednode {
            border-color: transparent !important;
            outline: 0 !important;
            box-shadow: none !important;
          }
          .custom-block--selected::after,
          .heading-node--selected::after,
          .ProseMirror-selectednode::after,
          .rich-text-node__selection-fragment {
            display: none !important;
          }
        </style>
      </head>
      <body><div class="editor-content">${payload.content}</div></body>
    </html>`;

  const browser = await chromium.launch({
    args: chrome.args,
    executablePath: chrome.executablePath,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const renderShellUrl = new URL('/__eduit-pdf-render-shell__', origin).href;
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
    // page.setContent() otherwise runs from an opaque `null` origin. Chrome
    // then rejects our same-origin font files for CORS, despite the document's
    // base URL. Start from a controlled same-origin shell before injecting the
    // printable document.
    await page.goto(renderShellUrl, { waitUntil: 'domcontentloaded' });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async ({ pageHeight }) => {
      await document.fonts.ready;
      await Promise.all(
        Array.from(document.images).map((image) => (
          image.complete
            ? image.decode().catch(() => undefined)
            : new Promise<void>((resolve) => {
                image.addEventListener('load', () => resolve(), { once: true });
                image.addEventListener('error', () => resolve(), { once: true });
          })
        )),
      );
      const editor = document.querySelector<HTMLElement>('.editor-content .tiptap');
      if (editor) {
        const pageCount = Math.max(
          1,
          editor.querySelectorAll('.tiptap-page-footer').length,
        );
        const exactDocumentHeight = `calc(${pageCount} * ${pageHeight})`;
        editor.style.height = exactDocumentHeight;
        editor.style.minHeight = exactDocumentHeight;
        editor.style.maxHeight = exactDocumentHeight;
        editor.style.overflow = 'hidden';
      }
    }, { pageHeight: pageFormat.pageHeight });
    const pdf = await page.pdf({
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="eduit-document.pdf"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Chrome could not render the PDF.' }, { status: 500 });
  } finally {
    await browser.close();
  }
}
