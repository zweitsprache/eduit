const TECHNICAL_KEYS = new Set([
  'id',
  'continuation',
  'rowNumberOffset',
  'shuffleSeed',
  'generation',
  'groupId',
  'groupIndex',
  'sheetIndex',
  'sheetSide',
]);

const MAX_ARRAY_ITEMS = 300;
const MAX_SOURCE_ITEMS = 1000;
const MAX_STRING_LENGTH = 4000;
const MAX_DEPTH = 8;
const MAX_PROPERTIES = 100;

const SEMANTIC_CONTEXT_KEYS = [
  'contentLanguage',
  'worksheetLanguage',
  'worksheetType',
  'subject',
  'customSubject',
  'languageLevel',
  'localLevel',
  'curriculum',
  'actionField',
  'actionCompetencies',
  'languageCompetencies',
  'learnerContext',
  'country',
] as const;

type JsonRecord = Record<string, unknown>;

export type WorksheetSemanticManifest = {
  title: string;
  context: unknown;
  logicalTasks: JsonRecord[];
};

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function sanitizeSemanticValue(value: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return undefined;
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, MAX_ARRAY_ITEMS).map((item) => sanitizeSemanticValue(item, depth + 1));
  }
  if (!isRecord(value)) return undefined;
  return Object.fromEntries(
    Object.entries(value).slice(0, MAX_PROPERTIES).flatMap(([key, item]) => {
      if (TECHNICAL_KEYS.has(key)) return [];
      const sanitized = sanitizeSemanticValue(item, depth + 1);
      return sanitized === undefined ? [] : [[key, sanitized]];
    }),
  );
}

function sanitizeContext(value: unknown) {
  if (!isRecord(value)) return {};
  return Object.fromEntries(SEMANTIC_CONTEXT_KEYS.flatMap((key) => {
    const sanitized = sanitizeSemanticValue(value[key]);
    return sanitized === undefined ? [] : [[key, sanitized]];
  }));
}

function normalizedArticleRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, MAX_SOURCE_ITEMS).flatMap((row): JsonRecord[] => {
    if (!isRecord(row) || typeof row.term !== 'string') return [];
    return [{
      term: row.term.slice(0, MAX_STRING_LENGTH),
      articles: Array.isArray(row.articles)
        ? row.articles.filter((article) => (
          article === 'der' || article === 'das' || article === 'die'
        ))
        : [],
      plural: typeof row.plural === 'string'
        ? row.plural.slice(0, MAX_STRING_LENGTH)
        : '',
    }];
  });
}

function itemCount(block: JsonRecord) {
  for (const key of ['rows', 'items', 'questions', 'pairs', 'words', 'times']) {
    if (Array.isArray(block[key])) return block[key].length;
  }
  return undefined;
}

export function worksheetSemanticManifestFromJson(
  worksheetJson: string | unknown,
): WorksheetSemanticManifest | null {
  let parsed: unknown;
  try {
    parsed = typeof worksheetJson === 'string' ? JSON.parse(worksheetJson) : worksheetJson;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (Array.isArray(parsed.logicalTasks)) {
    return {
      title: typeof parsed.title === 'string' ? parsed.title.slice(0, MAX_STRING_LENGTH) : '',
      context: sanitizeContext(parsed.context),
      logicalTasks: parsed.logicalTasks.slice(0, 1000).flatMap((task): JsonRecord[] => {
        const sanitized = sanitizeSemanticValue(task);
        return isRecord(sanitized) && typeof sanitized.type === 'string' ? [sanitized] : [];
      }),
    };
  }
  if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.worksheets)) return null;
  const worksheet = parsed.worksheets.find(isRecord);
  if (!isRecord(worksheet) || !Array.isArray(worksheet.blocks)) return null;

  const logicalTasks: JsonRecord[] = [];
  const blocks = worksheet.blocks;
  blocks.slice(0, MAX_SOURCE_ITEMS).forEach((value) => {
    if (!isRecord(value) || typeof value.type !== 'string' || value.type === 'pageBreak') return;

    if (value.type === 'articlePlural') {
      const rows = normalizedArticleRows(value.rows);
      const continuation = value.continuation === true;
      const previous = logicalTasks.at(-1);
      if (continuation && previous?.type === 'articlePlural') {
        const previousItems = Array.isArray(previous.items) ? previous.items : [];
        const combinedItems = [...previousItems, ...rows];
        previous.items = combinedItems.slice(0, MAX_ARRAY_ITEMS);
        previous.itemCount = Number(previous.itemCount ?? previousItems.length) + rows.length;
        previous.physicalBlockCount = Number(previous.physicalBlockCount ?? 1) + 1;
        previous.itemsTruncated = combinedItems.length > MAX_ARRAY_ITEMS;
        previous.hasOwnEntrySubtask = rows.length <= 19;
        return;
      }
      logicalTasks.push({
        type: 'articlePlural',
        instruction: typeof value.instruction === 'string' ? value.instruction : undefined,
        itemCount: rows.length,
        items: rows.slice(0, MAX_ARRAY_ITEMS),
        itemsTruncated: rows.length > MAX_ARRAY_ITEMS,
        physicalBlockCount: 1,
        logicalTaskCount: 1,
        hasOwnEntrySubtask: rows.length <= 19,
      });
      return;
    }

    const sanitized = sanitizeSemanticValue(value);
    if (!isRecord(sanitized)) return;
    const count = itemCount(value);
    logicalTasks.push({
      ...sanitized,
      ...(count === undefined ? {} : { itemCount: count }),
      logicalTaskCount: 1,
    });
  });

  return {
    title: typeof worksheet.title === 'string' ? worksheet.title : '',
    context: sanitizeContext(worksheet.context),
    logicalTasks,
  };
}