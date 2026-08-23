import { NextResponse } from 'next/server';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { launchRenderingBrowser } from '@/lib/server-chromium';
import { replaceClockPlaceholders } from '@/lib/clock-placeholder';

export const runtime = 'nodejs';
export const maxDuration = 60;

// viewport width/height are the paper size in CSS pixels (mm * 96 / 25.4).
// The print viewport must match the @page width, otherwise Chromium's
// page.pdf() scales the whole document down to fit the paper width.
// `sheetCopies` > 1 imposes several identical copies of the whole document on
// one physical sheet: A5 landscape prints as A4 portrait with two stacked copies.
const PAGE_FORMATS = {
  'a4-portrait': { cssSize: '210mm 297mm', pageHeight: '297mm', viewport: { width: 794, height: 1123 }, sheetCopies: 1 },
  'a4-landscape': { cssSize: '297mm 210mm', pageHeight: '210mm', viewport: { width: 1123, height: 794 }, sheetCopies: 1 },
  'a5-landscape': { cssSize: '210mm 297mm', pageHeight: '148.4mm', viewport: { width: 794, height: 1123 }, sheetCopies: 2 },
  'letter-portrait': { cssSize: '215.9mm 279.4mm', pageHeight: '279.4mm', viewport: { width: 816, height: 1056 }, sheetCopies: 1 },
  'letter-landscape': { cssSize: '279.4mm 215.9mm', pageHeight: '215.9mm', viewport: { width: 1056, height: 816 }, sheetCopies: 1 },
};

const PDF_FONTS = [
  ['Encode Sans Semi Condensed', 'https://fonts.gstatic.com/s/encodesanssemicondensed/v13/3qT4oiKqnDuUtQUEHMoXcmspmy55SFWrXFRp9FTOG2yR.ttf', 400, 'normal', 'truetype'],
  ['Encode Sans Semi Condensed', 'https://fonts.gstatic.com/s/encodesanssemicondensed/v13/3qT7oiKqnDuUtQUEHMoXcmspmy55SFWrXFRp9FTOG1Rl1-FH.ttf', 500, 'normal', 'truetype'],
  ['Encode Sans Semi Condensed', 'https://fonts.gstatic.com/s/encodesanssemicondensed/v13/3qT7oiKqnDuUtQUEHMoXcmspmy55SFWrXFRp9FTOG1RJ0OFH.ttf', 600, 'normal', 'truetype'],
  ['Encode Sans Semi Condensed', 'https://fonts.gstatic.com/s/encodesanssemicondensed/v13/3qT7oiKqnDuUtQUEHMoXcmspmy55SFWrXFRp9FTOG1Qt0eFH.ttf', 700, 'normal', 'truetype'],
  ['Linotype Feltpen', 'feltpen/LinotypeFeltpen-Medium.ttf', 500, 'normal', 'truetype'],
  ['TheSans', 'thesans/BJVNLV+TheSans-LP4SeLig.ttf', 400, 'normal', 'truetype'],
  ['TheSans', 'thesans/BJVNLV+TheSans-LP6SeBld.ttf', 600, 'normal', 'truetype'],
  ['TheSans', 'thesans/BJVNLV+TheSans-LP7Bld.ttf', 700, 'normal', 'truetype'],
] as const;

let embeddedFontsPromise: Promise<string> | null = null;

function embeddedPdfFonts() {
  if (embeddedFontsPromise) return embeddedFontsPromise;
  embeddedFontsPromise = Promise.all(PDF_FONTS.map(async (
    [family, relativePath, weight, style, format],
  ) => {
    if (relativePath.startsWith('https://')) {
      const response = await fetch(relativePath);
      if (!response.ok) throw new Error(`PDF font could not be downloaded: ${family} ${weight}`);
      const font = Buffer.from(await response.arrayBuffer());
      return `@font-face{font-family:${JSON.stringify(family)};src:url(data:font/ttf;base64,${font.toString('base64')}) format(${JSON.stringify(format)});font-style:${style};font-weight:${weight};font-display:block;}`;
    }
    const candidates = [
      path.join(process.cwd(), 'public', 'fonts', relativePath),
      path.join(process.cwd(), 'apps', 'app', 'public', 'fonts', relativePath),
    ];
    let font: Buffer | null = null;
    for (const candidate of candidates) {
      try {
        font = await readFile(candidate);
        break;
      } catch {
        // Try the monorepo path when the server cwd is the repository root.
      }
    }
    if (!font) throw new Error(`PDF font file is missing: ${relativePath}`);
    return `@font-face{font-family:${JSON.stringify(family)};src:url(data:font/ttf;base64,${font.toString('base64')}) format(${JSON.stringify(format)});font-style:${style};font-weight:${weight};font-display:block;}`;
  })).then((rules) => rules.join('\n'));
  return embeddedFontsPromise;
}

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

  const origin = new URL(request.url).origin;
  const safeHead = (payload.head ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv=["']?refresh["']?[^>]*>/gi, '');
  const pageFormat = PAGE_FORMATS[payload.docSize as keyof typeof PAGE_FORMATS]
    ?? PAGE_FORMATS['a4-portrait'];
  let embeddedFontCss: string;
  try {
    embeddedFontCss = await embeddedPdfFonts();
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'PDF fonts could not be loaded.',
    }, { status: 500 });
  }
  const html = `<!doctype html>
    <html>
      <head>
        <base href="${origin}/">
        ${safeHead}
        <style>
          ${embeddedFontCss}
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
      <body><div class="editor-content">${replaceClockPlaceholders(payload.content)}</div></body>
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
    const page = await browser.newPage({ viewport: pageFormat.viewport });
    // Resolve the same font cascade that page.pdf() will use before waiting
    // for fonts. Otherwise print-only style changes can discover a branded
    // face after document.fonts.ready has already resolved.
    await page.emulateMedia({ media: 'print' });
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
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    await page.evaluate(async ({ pageHeight, sheetCopies }) => {
      // Force layout, then explicitly request every font descriptor used by
      // printable content. This includes body, heading, example, and solution
      // fonts selected through brand CSS variables.
      void document.body.offsetHeight;
      const fontDescriptors = new Set<string>();
      document.querySelectorAll<HTMLElement>('.editor-content .tiptap, .editor-content .tiptap *')
        .forEach((element) => {
          const style = getComputedStyle(element);
          fontDescriptors.add([
            style.fontStyle,
            style.fontWeight,
            style.fontSize,
            style.fontFamily,
          ].join(' '));
        });
      await Promise.all(
        Array.from(fontDescriptors).map((descriptor) => (
          document.fonts.load(descriptor, 'Aa ÄÖÜ äöü ß 0123456789')
        )),
      );
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
        // Keep the minimum document height for deterministic pagination,
        // but avoid hard-clamping height. In Chromium print layout a forced
        // fixed height can vertically center later fragments after page breaks.
        editor.style.minHeight = exactDocumentHeight;
        editor.style.height = 'auto';
        editor.style.maxHeight = 'none';
        editor.style.overflow = 'visible';

        // Ids are intentionally kept: duplicated SVG defs/`use` references then
        // still resolve to the (identical) first copy in the document.
        const container = editor.parentElement;
        for (let copy = 1; container && copy < sheetCopies; copy += 1) {
          container.appendChild(editor.cloneNode(true));
        }
      }
    }, { pageHeight: pageFormat.pageHeight, sheetCopies: pageFormat.sheetCopies });
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
