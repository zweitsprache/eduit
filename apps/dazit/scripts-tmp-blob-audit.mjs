import * as blob from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

const appEnv = fs.readFileSync(new URL('../app/.env.local', import.meta.url), 'utf8');
const token = (
  appEnv.match(/^DAZIT_BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)
  ?? appEnv.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)
)[1].trim();
const dbUrl = fs
  .readFileSync(new URL('./.env.local', import.meta.url), 'utf8')
  .match(/^DATABASE_URL=(.*)$/m)[1]
  .trim();
const sql = neon(dbUrl);

const inStore = new Set();
let cursor;
do {
  const l = await blob.list({ token, prefix: 'worksheets/', cursor, limit: 1000 });
  for (const b of l.blobs) {
    const m = b.pathname.match(/^worksheets\/([^/]+)\/thumbnails\//);
    if (m) inStore.add(m[1]);
  }
  cursor = l.hasMore ? l.cursor : undefined;
} while (cursor);

const rows = await sql`select worksheet_id, slug, published_at from dazit_publications`;
const present = rows.filter((r) => inStore.has(r.worksheet_id));
const missing = rows.filter((r) => inStore.has(r.worksheet_id) === false);
const dates = (arr) => arr.map((r) => r.published_at).filter(Boolean).sort();
const pd = dates(present);
const md = dates(missing);
console.log('PRESENT in canonical store:', present.length);
console.log('  published_at range:', pd[0], '->', pd[pd.length - 1]);
console.log('MISSING (in other store):', missing.length);
console.log('  published_at range:', md[0], '->', md[md.length - 1]);
console.log('--- present worksheets ---');
for (const r of present.sort((a, b) => String(a.published_at).localeCompare(String(b.published_at))))
  console.log('  ', r.published_at, r.slug);
