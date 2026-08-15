#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function usage() {
  console.error('Usage: node scripts/convert-adjektivdeklination-learning-cards.mjs <input.json|input-dir> [output.json]');
  process.exit(1);
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
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
  if (doc && typeof doc === 'object' && doc.title && Array.isArray(doc.blocks)) return [doc];
  return [];
}

function backFromFront(front) {
  return front.replace(/\{\{blank:([^{}|]+)(?:\|[^{}]+)?\}\}/g, (_m, answer) => `[${String(answer).trim()}]`);
}

function toLearningWorksheet(ws) {
  const title = String(ws?.title ?? '').trim();
  if (!title.startsWith('Adjektivdeklination | ')) return null;

  const fillBlocks = Array.isArray(ws.blocks)
    ? ws.blocks.filter((block) => block?.type === 'fillInTheBlank' && Array.isArray(block.items))
    : [];

  const fronts = fillBlocks.flatMap((block) => block.items)
    .map((item) => String(item).trim())
    .filter(Boolean);

  if (!fronts.length) return null;

  const widthFromSource = fillBlocks.find((block) => typeof block.widthFactor === 'number')?.widthFactor;
  const blankWidthFactor = Number.isFinite(widthFromSource)
    ? Math.max(0.25, Math.min(5, Number(widthFromSource)))
    : 0.25;

  const items = fronts.map((front, index) => ({
    id: `learning-card-${index + 1}`,
    front,
    back: backFromFront(front),
  }));

  return {
    title,
    documentSize: ws.documentSize ?? 'a4-portrait',
    showSolutions: ws.showSolutions ?? true,
    status: ws.status ?? 'draft',
    ...(ws.brandProfileId ? { brandProfileId: ws.brandProfileId } : {}),
    context: {
      ...(ws.context ?? {}),
      worksheetType: 'learning-cards',
    },
    blocks: [
      {
        type: 'learningCards',
        title,
        sidedness: 'single-solution',
        blankWidthFactor,
        frontTextSize: 'm',
        backTextSize: 'm',
        items,
      },
    ],
  };
}

function main() {
  const inputPath = process.argv[2];
  const outputPath = process.argv[3] ?? 'adjektivdeklination-learning-cards.json';
  if (!inputPath) usage();

  const files = collectJsonFiles(inputPath);
  const converted = [];

  for (const file of files) {
    try {
      const data = readJson(file);
      const worksheets = extractWorksheets(data);
      for (const ws of worksheets) {
        const next = toLearningWorksheet(ws);
        if (next) converted.push(next);
      }
    } catch {
      // Ignore invalid JSON files in bulk directory mode.
    }
  }

  const output = {
    schemaVersion: 1,
    worksheets: converted,
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Converted ${converted.length} worksheet(s) -> ${outputPath}`);
}

main();
