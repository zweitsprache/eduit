// One-off migration: copy all DAZIT blobs from the OLD Vercel Blob store into
// the NEW store, preserving pathnames and content types. Idempotent and
// non-destructive (never deletes from the old store).
//
// Usage:
//   export OLD_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_<oldstore>_..."
//   node apps/dazit/scripts/migrate-blobs.mjs            # copy
//   DRY_RUN=1 node apps/dazit/scripts/migrate-blobs.mjs  # count only
//
// NEW store token is read automatically from apps/app/.env.local.
import * as blob from '@vercel/blob';
import fs from 'node:fs';

const dazitEnv = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const OLD =
  process.env.OLD_BLOB_READ_WRITE_TOKEN
  || dazitEnv.match(/^OLD_BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)?.[1]?.trim();
if (!OLD) {
  console.error('Set OLD_BLOB_READ_WRITE_TOKEN in your shell or apps/dazit/.env.local first.');
  process.exit(1);
}
const appEnv = fs.readFileSync(new URL('../../app/.env.local', import.meta.url), 'utf8');
const NEW = appEnv.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)[1].trim();
if (OLD === NEW) {
  console.error('OLD and NEW tokens are the same store. Aborting.');
  process.exit(1);
}

const DRY_RUN = process.env.DRY_RUN === '1';
const CONCURRENCY = Number(process.env.CONCURRENCY || 12);

const contentTypeFor = (pathname) => {
  if (pathname.endsWith('.pdf')) return 'application/pdf';
  if (pathname.endsWith('.webp')) return 'image/webp';
  if (pathname.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
};

const existsInNew = async (pathname) => {
  try {
    await blob.head(pathname, { token: NEW });
    return true;
  } catch {
    return false;
  }
};

const copyOne = async (item) => {
  if (await existsInNew(item.pathname)) return 'skipped';
  const src = await blob.get(item.pathname, { access: 'private', token: OLD, useCache: false });
  if (!src || src.statusCode !== 200) throw new Error(`get failed for ${item.pathname}`);
  const buf = Buffer.from(await new Response(src.stream).arrayBuffer());
  await blob.put(item.pathname, buf, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: contentTypeFor(item.pathname),
    token: NEW,
  });
  return 'copied';
};

const runPool = async (items, worker) => {
  let i = 0;
  const counts = { copied: 0, skipped: 0, failed: 0 };
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        const r = await worker(items[idx]);
        counts[r] += 1;
      } catch (e) {
        counts.failed += 1;
        console.error('FAIL', items[idx].pathname, e.message);
      }
      const done = counts.copied + counts.skipped + counts.failed;
      if (done % 200 === 0) console.log(`  progress ${done}/${items.length} (copied=${counts.copied} skipped=${counts.skipped} failed=${counts.failed})`);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  return counts;
};

const listAll = async (prefix) => {
  const all = [];
  let cursor;
  do {
    const l = await blob.list({ token: OLD, prefix, cursor, limit: 1000 });
    all.push(...l.blobs);
    cursor = l.hasMore ? l.cursor : undefined;
  } while (cursor);
  return all;
};

const worksheets = await listAll('worksheets/');
const library = await listAll('library/');
const items = [...worksheets, ...library];
console.log(`OLD store blobs: worksheets=${worksheets.length} library=${library.length} total=${items.length}`);

if (DRY_RUN) {
  let present = 0;
  const sample = items.slice(0, 500);
  for (const it of sample) if (await existsInNew(it.pathname)) present += 1;
  console.log(`DRY_RUN: of first ${sample.length}, already in NEW store: ${present}`);
  process.exit(0);
}

const counts = await runPool(items, copyOne);
console.log('DONE', counts);
