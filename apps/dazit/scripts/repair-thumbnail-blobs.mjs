import * as blob from '@vercel/blob';
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';

function envValue(env, key) {
  return env.match(new RegExp(`^${key}="?([^"\\n]+)"?`, 'm'))?.[1]?.trim();
}

function required(value, name) {
  if (value == null || value.length === 0) throw new Error(`${name} is missing.`);
  return value;
}

async function listedPaths(token) {
  const paths = new Set();
  let cursor;
  do {
    const page = await blob.list({ token, prefix: 'worksheets/', cursor, limit: 1000 });
    for (const item of page.blobs) paths.add(item.pathname);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return paths;
}

const apply = process.argv.includes('--apply');
const appEnv = fs.readFileSync(new URL('../../app/.env.local', import.meta.url), 'utf8');
const dazitEnv = fs.readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const sourceTokens = [
  ['current editor store', required(envValue(appEnv, 'BLOB_READ_WRITE_TOKEN'), 'source BLOB_READ_WRITE_TOKEN')],
  ['old Dazit store', envValue(dazitEnv, 'OLD_BLOB_READ_WRITE_TOKEN')],
].filter(([, token]) => typeof token === 'string' && token.length > 0);
const destinationToken = required(
  envValue(appEnv, 'DAZIT_BLOB_READ_WRITE_TOKEN') ?? envValue(dazitEnv, 'DAZIT_BLOB_READ_WRITE_TOKEN'),
  'destination DAZIT_BLOB_READ_WRITE_TOKEN',
);
const dbUrl = required(envValue(dazitEnv, 'DATABASE_URL'), 'DATABASE_URL');
const sql = neon(dbUrl);

const rows = await sql`
  select worksheet_id, slug, thumbnail_paths
  from dazit_publications
  where jsonb_typeof(thumbnail_paths) = 'array'
    and jsonb_array_length(thumbnail_paths) > 0
  order by published_at asc
`;
const [sourcePathSets, destinationPaths] = await Promise.all([
  Promise.all(sourceTokens.map(async ([label, token]) => ({
    label,
    token,
    paths: await listedPaths(token),
  }))),
  listedPaths(destinationToken),
]);
const missingPaths = rows.flatMap((row) => (
  row.thumbnail_paths
    .filter((path) => typeof path === 'string' && /^worksheets\/[^/]+\/thumbnails\/page-\d+\.webp$/i.test(path))
    .filter((path) => destinationPaths.has(path) === false)
    .map((path) => ({ path, worksheetId: row.worksheet_id, slug: row.slug }))
));
const copyablePaths = missingPaths.flatMap((item) => {
  const source = sourcePathSets.find(({ paths }) => paths.has(item.path));
  return source ? [{ ...item, sourceLabel: source.label, sourceToken: source.token }] : [];
});
const absentPaths = missingPaths.filter(({ path }) => (
  sourcePathSets.every(({ paths }) => paths.has(path) === false)
));

console.log('missing thumbnail paths in Dazit store:', missingPaths.length);
for (const source of sourcePathSets) {
  console.log(`copyable from ${source.label}:`, copyablePaths.filter((item) => item.sourceLabel === source.label).length);
}
console.log('absent in all source stores:', absentPaths.length);

if (absentPaths.length) {
  for (const item of absentPaths.slice(0, 10)) {
    console.log('absent-both', item.worksheetId, item.slug, item.path);
  }
}

if (!apply) {
  console.log('dry run only; pass --apply to copy missing thumbnails');
  process.exit(absentPaths.length ? 1 : 0);
}

let copied = 0;
for (const item of copyablePaths) {
  const source = await blob.get(item.path, {
    access: 'private',
    token: item.sourceToken,
    useCache: false,
  });
  if (source?.statusCode !== 200 || !source.stream) {
    console.log('source-missing', item.worksheetId, item.slug, item.path);
    continue;
  }
  const buffer = await new Response(source.stream).arrayBuffer();
  await blob.put(item.path, buffer, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'image/webp',
    token: destinationToken,
  });
  copied += 1;
}

console.log('copied thumbnail paths:', copied);
process.exit(absentPaths.length ? 1 : 0);