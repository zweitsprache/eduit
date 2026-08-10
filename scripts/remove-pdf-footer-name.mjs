import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { get, put } from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import { extractTextItems } from 'unpdf';

const TARGET_TEXT = 'Marcel Allenspach';
const SUPPORTED_FORMATS = ['a4-portrait', 'a4-landscape', 'a5-landscape'];
const EXPECTED_MATCHES_PER_PAGE = {
  'a4-portrait': 1,
  'a4-landscape': 1,
  'a5-landscape': 2,
};
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_ROOT = path.join(ROOT, 'tmp', 'pdf-footer-redaction');
const PYTHON = path.join(ROOT, 'tmp', 'pdf-redaction-venv', 'bin', 'python');
const REDACTION_HELPER = path.join(ROOT, 'scripts', 'redact-pdf-text.py');

function loadEnv(filePath) {
  const text = readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2]
      .replace(/^"(.*)"$/, '$1')
      .replace(/^'(.*)'$/, '$1');
  }
}

function parseArgs() {
  const args = new Set(process.argv.slice(2));
  const mode = args.has('--apply') ? 'apply' : 'test';
  if (args.has('--apply') && args.has('--test')) {
    throw new Error('Choose either --test or --apply.');
  }
  if (mode === 'apply' && !args.has('--confirm-all-published-pdfs')) {
    throw new Error('Apply mode requires --confirm-all-published-pdfs.');
  }
  return { mode };
}

async function publications(sql, mode) {
  const rows = [];
  for (const documentSize of SUPPORTED_FORMATS) {
    const matchingRows = mode === 'test' ? await sql`
      select
        p.worksheet_id as "worksheetId",
        p.slug,
        p.pdf_path as "pdfPath",
        p.answer_key_pdf_path as "answerKeyPdfPath",
        w.document_size as "documentSize"
      from dazit_publications p
      join worksheets w on w.id = p.worksheet_id
      where w.document_size = ${documentSize}
      order by p.published_at desc
      limit 1
    ` : await sql`
      select
        p.worksheet_id as "worksheetId",
        p.slug,
        p.pdf_path as "pdfPath",
        p.answer_key_pdf_path as "answerKeyPdfPath",
        w.document_size as "documentSize"
      from dazit_publications p
      join worksheets w on w.id = p.worksheet_id
      where w.document_size = ${documentSize}
      order by p.published_at desc
    `;
    rows.push(...matchingRows);
  }
  return rows;
}

async function downloadBlob(pathname, token) {
  const blob = await get(pathname, { access: 'private', token, useCache: false });
  if (blob?.statusCode !== 200 || !blob.stream) {
    throw new Error(`Blob not found: ${pathname}`);
  }
  return new Uint8Array(await new Response(blob.stream).arrayBuffer());
}

async function redactFooterName(bytes, documentSize) {
  const directory = mkdtempSync(path.join(tmpdir(), 'eduit-pdf-redaction-'));
  const inputPath = path.join(directory, 'input.pdf');
  const outputPath = path.join(directory, 'output.pdf');
  try {
    writeFileSync(inputPath, bytes);
    const helperOutput = execFileSync(
      PYTHON,
      [REDACTION_HELPER, inputPath, outputPath, documentSize],
      { encoding: 'utf8' },
    );
    const result = JSON.parse(helperOutput);
    const redactedBytes = new Uint8Array(readFileSync(outputPath));
    const extracted = await extractTextItems(redactedBytes.slice());
    const remaining = extracted.items.flat()
      .filter((item) => item.str.includes(TARGET_TEXT));
    if (remaining.length > 0) {
      throw new Error(`Redaction verification failed: ${remaining.length} target text item(s) remain.`);
    }
    return { bytes: redactedBytes, ...result };
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function renderFirstPage(pdfPath, pngPath) {
  execFileSync('gs', [
    '-q', '-dSAFER', '-dBATCH', '-dNOPAUSE',
    '-sDEVICE=pngalpha', '-r144', '-dFirstPage=1', '-dLastPage=1',
    `-sOutputFile=${pngPath}`, pdfPath,
  ]);
}

async function saveTestArtifacts(publication, pathname, original, redacted, kind) {
  const directory = path.join(OUTPUT_ROOT, publication.documentSize, publication.slug, kind);
  mkdirSync(directory, { recursive: true });
  const originalPath = path.join(directory, 'before.pdf');
  const redactedPath = path.join(directory, 'after.pdf');
  writeFileSync(originalPath, original);
  writeFileSync(redactedPath, redacted.bytes);
  renderFirstPage(originalPath, path.join(directory, 'before-page-1.png'));
  renderFirstPage(redactedPath, path.join(directory, 'after-page-1.png'));
  writeFileSync(path.join(directory, 'report.json'), `${JSON.stringify({
    pathname,
    documentSize: publication.documentSize,
    pageCount: redacted.pageCount,
    matches: redacted.matches,
    note: 'PyMuPDF redaction removed the name from the page content and text extraction.',
  }, null, 2)}\n`);
}

async function applyWithBackup(pathname, original, redacted, token, runId) {
  const backupPath = `maintenance/pdf-footer-redaction/${runId}/${pathname}`;
  await put(backupPath, original, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: false,
    contentType: 'application/pdf',
    token,
  });
  await put(pathname, redacted, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/pdf',
    token,
  });
  return backupPath;
}

async function main() {
  const { mode } = parseArgs();
  loadEnv(path.join(ROOT, 'apps', 'app', '.env.local'));
  const token = process.env.DAZIT_BLOB_READ_WRITE_TOKEN;
  if (!process.env.DATABASE_URL || !token) {
    throw new Error('DATABASE_URL and DAZIT_BLOB_READ_WRITE_TOKEN are required.');
  }

  const sql = neon(process.env.DATABASE_URL);
  const rows = await publications(sql, mode);
  const runId = new Date().toISOString().replaceAll(':', '-');
  const report = [];

  for (const publication of rows) {
    const files = [
      ['main', publication.pdfPath],
      ['answer-key', publication.answerKeyPdfPath],
    ].filter((entry) => Boolean(entry[1]));
    for (const [kind, pathname] of files) {
      const original = await downloadBlob(pathname, token);
      const redacted = await redactFooterName(original, publication.documentSize);
      if (redacted.matches.length === 0) {
        report.push({ pathname, status: 'skipped-no-match' });
        continue;
      }
      if (mode === 'test') {
        await saveTestArtifacts(publication, pathname, original, redacted, kind);
        report.push({ pathname, status: 'tested', matches: redacted.matches.length });
      } else {
        const backupPath = await applyWithBackup(
          pathname,
          original,
          redacted.bytes,
          token,
          runId,
        );
        report.push({ pathname, backupPath, status: 'updated', matches: redacted.matches.length });
      }
      console.log(`${mode}: ${pathname} (${redacted.matches.length} redactions)`);
    }
  }

  mkdirSync(OUTPUT_ROOT, { recursive: true });
  const reportPath = path.join(OUTPUT_ROOT, `${mode}-${runId}.json`);
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});