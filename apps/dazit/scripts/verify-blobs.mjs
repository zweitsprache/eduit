import * as blob from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

const appEnv = fs.readFileSync(new URL('../../app/.env.local', import.meta.url), 'utf8');
const token = appEnv.match(/^BLOB_READ_WRITE_TOKEN="?([^"\n]+)"?/m)[1].trim();
const dbUrl = fs
  .readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
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

const rows = await sql`select worksheet_id, slug, thumbnail_paths, published_at from dazit_publications order by published_at asc`;
const missing = rows.filter((r) => inStore.has(r.worksheet_id) === false);
console.log('publications:', rows.length, 'with thumbs in store:', rows.length - missing.length, 'MISSING:', missing.length);
for (const r of rows.slice(0, 3))
  console.log('OLDEST', r.published_at, r.worksheet_id, r.slug, JSON.stringify(r.thumbnail_paths?.[0]));
for (const r of missing.slice(0, 10)) console.log('STILL MISSING', r.worksheet_id, r.slug);
