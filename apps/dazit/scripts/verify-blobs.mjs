// Verifies that the editor and Dazit resolve the SAME publication blob store and
// that every publication row has its PDF and thumbnails in that store.
//
//   node apps/dazit/scripts/verify-blobs.mjs
import * as blob from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

const readEnv = (relativePath) => fs.readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const envValue = (env, key) => env.match(new RegExp(`^${key}="?([^"\\n]+)"?`, 'm'))?.[1]?.trim();
const storeIdOf = (token) => `store_${token.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)[1]}`;

const appEnv = readEnv('../../app/.env.local');
const dazitEnv = readEnv('../.env.local');

const configured = [['apps/app', appEnv], ['apps/dazit', dazitEnv]].map(([name, env]) => {
  const token = envValue(env, 'DAZIT_BLOB_READ_WRITE_TOKEN');
  const declaredStoreId = envValue(env, 'DAZIT_BLOB_STORE_ID');
  if (!token || !declaredStoreId) {
    throw new Error(`${name}: DAZIT_BLOB_READ_WRITE_TOKEN / DAZIT_BLOB_STORE_ID missing.`);
  }
  if (storeIdOf(token) !== declaredStoreId) {
    throw new Error(`${name}: token points at ${storeIdOf(token)} but DAZIT_BLOB_STORE_ID is ${declaredStoreId}.`);
  }
  return { name, token, storeId: declaredStoreId };
});

for (const { name, storeId } of configured) console.log(`${name} -> ${storeId}`);
if (configured[0].storeId !== configured[1].storeId) {
  console.error('MISMATCH: the editor writes publications to a different store than Dazit reads from.');
  process.exit(1);
}

const { token } = configured[0];
const inStore = new Set();
let cursor;
do {
  const page = await blob.list({ token, prefix: 'worksheets/', cursor, limit: 1000 });
  for (const item of page.blobs) inStore.add(item.pathname);
  cursor = page.hasMore ? page.cursor : undefined;
} while (cursor);

const sql = neon(envValue(dazitEnv, 'DATABASE_URL'));
const rows = await sql`
  select worksheet_id, slug, pdf_path, thumbnail_paths, published_at
  from dazit_publications
  order by published_at asc
`;
const broken = rows.flatMap((row) => {
  const missingPdf = typeof row.pdf_path === 'string' && inStore.has(row.pdf_path) === false;
  const missingThumbnails = (Array.isArray(row.thumbnail_paths) ? row.thumbnail_paths : [])
    .filter((path) => typeof path === 'string' && inStore.has(path) === false).length;
  if (!missingPdf && !missingThumbnails) return [];
  return [{ ...row, missingPdf, missingThumbnails }];
});

console.log('publications:', rows.length, 'complete:', rows.length - broken.length, 'INCOMPLETE:', broken.length);
console.log('  missing PDF:', broken.filter((row) => row.missingPdf).length);
console.log('  missing thumbnails:', broken.filter((row) => row.missingThumbnails).length);
for (const row of broken.slice(0, 20)) {
  console.log('INCOMPLETE', row.published_at, row.slug, `pdf=${row.missingPdf ? 'MISSING' : 'ok'}`, `thumbnails-missing=${row.missingThumbnails}`);
}
process.exit(broken.length ? 1 : 0);
