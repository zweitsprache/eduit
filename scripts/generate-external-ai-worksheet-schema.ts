import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { generatedWorksheetEnvelopeSchema } from '../apps/app/src/lib/worksheet-json-import';

const root = process.cwd();
const docsDirectory = path.join(root, 'docs/external-ai');
const examplesDirectory = path.join(docsDirectory, 'examples');
const schemaPath = path.join(docsDirectory, 'worksheet.schema.json');

const schema = z.toJSONSchema(generatedWorksheetEnvelopeSchema, {
  target: 'draft-2020-12',
  io: 'input',
  reused: 'ref',
});

const externalSchema = {
  ...schema,
  $id: 'https://eduit.app/schemas/worksheet-generation-v1.json',
  title: 'EduIT worksheet generation envelope',
  description: 'Canonical version 1 payload for external AI systems creating EduIT worksheets.',
};

fs.mkdirSync(docsDirectory, { recursive: true });
fs.writeFileSync(schemaPath, `${JSON.stringify(externalSchema, null, 2)}\n`);

const exampleFiles = fs.readdirSync(examplesDirectory)
  .filter((file) => file.endsWith('.json'))
  .sort();

for (const file of exampleFiles) {
  const filePath = path.join(examplesDirectory, file);
  const value: unknown = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  generatedWorksheetEnvelopeSchema.parse(value);
}

console.log(`Generated ${path.relative(root, schemaPath)} and validated ${exampleFiles.length} examples.`);