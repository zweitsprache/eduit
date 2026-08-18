import { randomBytes } from 'node:crypto';

export type LearningCardSnapshotItem = {
  id: string;
  front: string;
  back: string;
};

export type LearningCardPublicationSnapshot = {
  title: string;
  items: LearningCardSnapshotItem[];
  frontTextSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  backTextSize: 'xs' | 's' | 'm' | 'l' | 'xl';
  blankWidthFactor: number;
  compactSingleLetterBlanks: boolean;
};

const TEXT_SIZES = ['xs', 's', 'm', 'l', 'xl'] as const;

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeTextSize(value: unknown, fallback: 'xs' | 's' | 'm' | 'l' | 'xl') {
  return typeof value === 'string' && TEXT_SIZES.includes(value as typeof TEXT_SIZES[number])
    ? value as typeof TEXT_SIZES[number]
    : fallback;
}

function normalizeCardItems(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item, index): LearningCardSnapshotItem[] => {
      const record = asRecord(item);
      if (!record) return [];
      return [{
        id: typeof record.id === 'string' && record.id.trim()
          ? record.id.trim()
          : `card-${index + 1}`,
        front: typeof record.front === 'string' ? record.front : '',
        back: typeof record.back === 'string' ? record.back : '',
      }];
    })
    .slice(0, 450);
}

export function extractLearningCardsSnapshotFromWorksheetJson(
  worksheetJson: string,
): LearningCardPublicationSnapshot | null {
  try {
    const parsed = JSON.parse(worksheetJson) as unknown;
    const root = asRecord(parsed);
    if (!root || !Array.isArray(root.worksheets) || !root.worksheets.length) return null;
    const firstWorksheet = asRecord(root.worksheets[0]);
    if (!firstWorksheet || !Array.isArray(firstWorksheet.blocks)) return null;
    const block = firstWorksheet.blocks.find((entry) => {
      const record = asRecord(entry);
      return record?.type === 'learningCards';
    });
    const learningCards = asRecord(block);
    if (!learningCards) return null;
    const items = normalizeCardItems(learningCards.items);
    if (!items.length) return null;
    const blankWidthFactorRaw = typeof learningCards.blankWidthFactor === 'number'
      ? learningCards.blankWidthFactor
      : 1;
    const blankWidthFactor = Number.isFinite(blankWidthFactorRaw)
      ? Math.min(Math.max(blankWidthFactorRaw, 0.25), 5)
      : 1;

    return {
      title: typeof learningCards.title === 'string' && learningCards.title.trim()
        ? learningCards.title.trim().slice(0, 200)
        : 'Learning cards',
      items,
      frontTextSize: normalizeTextSize(learningCards.frontTextSize, 'm'),
      backTextSize: normalizeTextSize(learningCards.backTextSize, 'm'),
      blankWidthFactor,
      compactSingleLetterBlanks: learningCards.compactSingleLetterBlanks !== false,
    };
  } catch {
    return null;
  }
}

export function createLearningLinkToken() {
  return randomBytes(18).toString('base64url');
}