import { z } from 'zod';
import { generatedWorksheetBlockSchema } from './worksheet-json-import';

export const WORKSHEET_DOCUMENT_SCHEMA_VERSION = 1 as const;

export const WORKSHEET_DOCUMENT_BLOCK_TYPES = [
  'heading',
  'glossary',
  'fillInTheBlank',
  'richText',
  'lesetraining',
  'pageBreak',
  'spacer',
  'writingLines',
  'instruction',
  'learningObjective',
  'ordering',
  'frayerModel',
  'occupationPortrait',
  'errorCorrection',
  'letterNode',
  'dateMatching',
  'twoWayPrepositions',
  'weather',
  'familyKinship',
  'inlineChoice',
  'miniForm',
  'mch',
  'mediaLayout',
  'colorFurniture',
  'dictationLines',
  'alpharamaTerm',
  'letterCloud',
  'anagram',
  'crossword',
  'worksheetTable',
  'informationGapActivity',
  'dialogue',
  'messenger',
  'email',
  'timetable',
  'openingHours',
  'mcq',
  'mcm',
  'articlePlural',
  'trueFalse',
  'communicationCards',
  'learningCards',
  'articlePluralCards',
  'matchingPairs',
  'timeMatching',
  'wordGrid',
  'wordBank',
  'rewriteSentences',
  'sortingCategories',
  'chooseCorrectWords',
  'domino',
  'germanVerbTable',
  'declinationTable',
] as const;

export const worksheetDocumentBlockSchema = z.intersection(
  generatedWorksheetBlockSchema,
  z.object({
    blockId: z.string().uuid(),
  }),
);

export const worksheetDocumentSchema = z.object({
  schemaVersion: z.literal(WORKSHEET_DOCUMENT_SCHEMA_VERSION),
  blocks: z.array(worksheetDocumentBlockSchema).max(1000),
}).superRefine((document, context) => {
  const seenBlockIds = new Set<string>();
  document.blocks.forEach((block, index) => {
    if (!seenBlockIds.has(block.blockId)) {
      seenBlockIds.add(block.blockId);
      return;
    }
    context.addIssue({
      code: 'custom',
      message: 'Block IDs must be unique within a worksheet document.',
      path: ['blocks', index, 'blockId'],
    });
  });
});

export type WorksheetDocument = z.infer<typeof worksheetDocumentSchema>;
export type WorksheetDocumentBlock = WorksheetDocument['blocks'][number];
export type WorksheetDocumentBlockType = WorksheetDocumentBlock['type'];
export type GeneratedWorksheetBlock = z.infer<
  typeof generatedWorksheetBlockSchema
>;

export function createWorksheetDocument(
  blocks: readonly GeneratedWorksheetBlock[],
  createBlockId: () => string = () => globalThis.crypto.randomUUID(),
): WorksheetDocument {
  return worksheetDocumentSchema.parse({
    schemaVersion: WORKSHEET_DOCUMENT_SCHEMA_VERSION,
    blocks: blocks.map((block) => ({
      ...block,
      blockId: createBlockId(),
    })),
  });
}

export function reconcileWorksheetDocument(
  blocks: readonly GeneratedWorksheetBlock[],
  previousDocument: WorksheetDocument | null,
  createBlockId: () => string = () => globalThis.crypto.randomUUID(),
): WorksheetDocument {
  if (!previousDocument) return createWorksheetDocument(blocks, createBlockId);

  const previousBlocks = worksheetDocumentSchema.parse(previousDocument).blocks;
  const availableIndexes = new Set(previousBlocks.map((_, index) => index));
  const blockIds = blocks.map((block, index) => {
    const serializedBlock = JSON.stringify(block);
    const exactIndex = previousBlocks.findIndex((previousBlock, previousIndex) => (
      availableIndexes.has(previousIndex)
      && JSON.stringify(generatedWorksheetBlockSchema.parse(previousBlock)) === serializedBlock
    ));
    if (exactIndex >= 0) {
      availableIndexes.delete(exactIndex);
      return previousBlocks[exactIndex].blockId;
    }

    const samePosition = previousBlocks[index];
    if (samePosition?.type === block.type && availableIndexes.has(index)) {
      availableIndexes.delete(index);
      return samePosition.blockId;
    }

    const sameTypeIndex = previousBlocks.findIndex((previousBlock, previousIndex) => (
      availableIndexes.has(previousIndex) && previousBlock.type === block.type
    ));
    if (sameTypeIndex >= 0) {
      availableIndexes.delete(sameTypeIndex);
      return previousBlocks[sameTypeIndex].blockId;
    }
    return createBlockId();
  });

  return worksheetDocumentSchema.parse({
    schemaVersion: WORKSHEET_DOCUMENT_SCHEMA_VERSION,
    blocks: blocks.map((block, index) => ({
      ...block,
      blockId: blockIds[index],
    })),
  });
}

export function generatedBlocksFromWorksheetDocument(
  document: WorksheetDocument,
): GeneratedWorksheetBlock[] {
  return worksheetDocumentSchema.parse(document).blocks.map((block) => (
    generatedWorksheetBlockSchema.parse(block)
  ));
}

type MissingDeclaredBlockType = Exclude<
  WorksheetDocumentBlockType,
  (typeof WORKSHEET_DOCUMENT_BLOCK_TYPES)[number]
>;
type UnknownDeclaredBlockType = Exclude<
  (typeof WORKSHEET_DOCUMENT_BLOCK_TYPES)[number],
  WorksheetDocumentBlockType
>;

const completeBlockTypeList: [
  MissingDeclaredBlockType,
  UnknownDeclaredBlockType,
] extends [never, never]
  ? true
  : never = true;

void completeBlockTypeList;