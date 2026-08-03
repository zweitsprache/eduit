import { readFileSync } from 'node:fs';
import { neon } from '@neondatabase/serverless';

function loadEnv(path) {
  const text = readFileSync(path, 'utf8');
  for (const line of text.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!(key in process.env)) {
      process.env[key] = value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
    }
  }
}

loadEnv('apps/app/.env.local');

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/run-migration.mjs <path-to-sql-file>');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const statements = readFileSync(file, 'utf8')
  .split(';')
  .map((s) => s.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql(`${statement};`);
}

console.log(`Applied ${statements.length} statement(s) from ${file}`);
