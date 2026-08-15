#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/check-missing-adjektiv-learning-cards.mjs <input.json|input-dir>');
  process.exit(1);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function collectJsonFiles(inputPath) {
  const stats = fs.statSync(inputPath);
  if (stats.isFile()) return [inputPath];

  const files = [];
  const stack = [inputPath];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.isFile() && full.endsWith('.json')) files.push(full);
    }
  }
  return files.sort();
}

function extractWorksheets(doc) {
  if (doc && Array.isArray(doc.worksheets)) return doc.worksheets;
  if (doc && typeof doc === 'object' && typeof doc.title === 'string' && Array.isArray(doc.blocks)) {
    return [doc];
  }
  return [];
}

function isLearningCardsWorksheet(ws) {
  const type = ws?.context?.worksheetType;
  if (type === 'learning-cards') return true;
  if (!Array.isArray(ws?.blocks)) return false;
  return ws.blocks.some((block) => block?.type === 'learningCards');
}

function main() {
  const inputPath = process.argv[2];
  if (!inputPath) usage();

  const files = collectJsonFiles(inputPath);
  const byTitle = new Map();

  for (const file of files) {
    let doc;
    try {
      doc = readJson(file);
    } catch {
      continue;
    }

    for (const ws of extractWorksheets(doc)) {
      const title = typeof ws?.title === 'string' ? ws.title.trim() : '';
      if (!title.startsWith('Adjektivdeklination |')) continue;

      const row = byTitle.get(title) ?? {
        title,
        hasWorksheet: false,
        hasLearningCards: false,
        sources: new Set(),
      };

      row.hasWorksheet = true;
      row.hasLearningCards = row.hasLearningCards || isLearningCardsWorksheet(ws);
      row.sources.add(file);
      byTitle.set(title, row);
    }
  }

  const missing = [...byTitle.values()]
    .filter((row) => row.hasWorksheet && !row.hasLearningCards)
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));

  const present = [...byTitle.values()]
    .filter((row) => row.hasWorksheet && row.hasLearningCards)
    .sort((a, b) => a.title.localeCompare(b.title, 'de'));

  console.log(`Adjektivdeklination worksheets found: ${byTitle.size}`);
  console.log(`With learning-cards counterpart: ${present.length}`);
  console.log(`Missing learning-cards counterpart: ${missing.length}`);

  if (missing.length) {
    console.log('\nMissing:');
    for (const row of missing) {
      console.log(`- ${row.title}`);
      for (const source of [...row.sources].sort()) {
        console.log(`  source: ${source}`);
      }
    }
  }
}

main();
