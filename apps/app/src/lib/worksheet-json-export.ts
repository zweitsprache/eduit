import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import { GLOSSARY_COLUMN_WIDTHS } from '@/components/editor/glossary-terms-node';
import { getMCQQuestions, type MCQAttrs } from '@/components/editor/mcq-node';
import type { CustomHeadingAttrs } from '@/components/editor/heading-node';
import type { GlossaryTermsAttrs } from '@/components/editor/glossary-terms-node';
import type { FillInTheBlankAttrs } from '@/components/editor/fill-in-the-blank-node';
import type { DialogueAttrs } from '@/components/editor/dialogue-node';
import type { MCMAttrs } from '@/components/editor/mcm-node';
import type { ArticlePluralAttrs } from '@/components/editor/article-plural-node';
import type { TrueFalseAttrs } from '@/components/editor/true-false-node';
import type { MatchingPairsAttrs } from '@/components/editor/matching-pairs-node';
import type { TimeMatchingAttrs } from '@/components/editor/time-matching-node';
import type { CommunicationCardsAttrs } from '@/components/editor/communication-cards-node';
import type { LearningCardsAttrs } from '@/components/editor/learning-cards-node';
import type { RichTextAttrs } from '@/components/editor/rich-text-node';
import type { WordGridAttrs } from '@/components/editor/word-grid-node';
import type { DominoAttrs } from '@/components/editor/domino-node';
import type { GermanVerbTableAttrs } from '@/components/editor/german-verb-table-node';
import type { DeclinationTableAttrs } from '@/components/editor/declination-table-node';
import type { WorksheetTableAttrs } from '@/components/editor/worksheet-table-node';
import type { WorksheetContext } from '@/lib/worksheet-types';

const DECLENSION_ENDINGS = ['em', 'en', 'er', 'es', 'e'] as const;

function adjectiveBaseCandidates(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const candidates = new Set<string>([trimmed]);
  DECLENSION_ENDINGS.forEach((ending) => {
    if (trimmed.length <= ending.length || !trimmed.endsWith(ending)) return;
    const stripped = trimmed.slice(0, -ending.length);
    if (!stripped) return;
    candidates.add(stripped);
    if (stripped.endsWith('l') || stripped.endsWith('r')) {
      candidates.add(`${stripped.slice(0, -1)}e${stripped.slice(-1)}`);
    }
  });
  return [...candidates];
}

function inferAdjectiveBase(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => {
    adjectiveBaseCandidates(value).forEach((candidate) => {
      counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
    });
  });
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)[0]?.[0]
    ?? '';
}

export type WorksheetJsonExportMeta = {
  title: string;
  documentSize: string;
  showSolutions: boolean;
  brandProfileId?: string | null;
  context: WorksheetContext;
};

export type WorksheetJsonExportResult = {
  json: string;
  blockCount: number;
  skippedTypes: string[];
};

// Node types that are dropped silently when they hold nothing importable, instead
// of being reported as unsupported.
const IGNORED_NODE_TYPES = new Set(['text', 'hardBreak']);

const LEGACY_RICH_TEXT_NODE_TYPES = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'listItem',
  'blockquote',
]);

const CUSTOM_BLOCK_NODE_TYPES = new Set([
  'customHeading',
  'pageBreak',
  'richText',
  'glossaryTerms',
  'fillInTheBlank',
  'dialogue',
  'mcm',
  'articlePlural',
  'mcq',
  'trueFalse',
  'matchingPairs',
  'timeMatching',
  'communicationCards',
  'wordGrid',
  'learningCards',
  'domino',
  'germanVerbTable',
  'declinationTable',
  'worksheetTable',
]);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function withMarks(text: string, marks: readonly { type: { name: string }; attrs?: Record<string, unknown> }[]) {
  return marks.reduce((content, mark) => {
    if (mark.type.name === 'bold') return `<strong>${content}</strong>`;
    if (mark.type.name === 'italic') return `<em>${content}</em>`;
    if (mark.type.name === 'underline') return `<u>${content}</u>`;
    if (mark.type.name === 'strike') return `<s>${content}</s>`;
    if (mark.type.name === 'link') {
      const href = typeof mark.attrs?.href === 'string' ? mark.attrs.href : '';
      if (!href) return content;
      return `<a href="${escapeHtml(href)}">${content}</a>`;
    }
    return content;
  }, text);
}

function nodeHtml(node: ProseMirrorNode): string {
  switch (node.type.name) {
    case 'text': {
      const text = escapeHtml(node.text ?? '');
      return withMarks(text, node.marks as readonly { type: { name: string }; attrs?: Record<string, unknown> }[]);
    }
    case 'hardBreak':
      return '<br>';
    case 'paragraph':
      return `<p>${node.content.content.map(nodeHtml).join('')}</p>`;
    case 'heading': {
      const levelRaw = Number((node.attrs as Record<string, unknown>).level ?? 2);
      const level = [1, 2, 3, 4, 5, 6].includes(levelRaw) ? levelRaw : 2;
      return `<h${level}>${node.content.content.map(nodeHtml).join('')}</h${level}>`;
    }
    case 'bulletList':
      return `<ul>${node.content.content.map(nodeHtml).join('')}</ul>`;
    case 'orderedList':
      return `<ol>${node.content.content.map(nodeHtml).join('')}</ol>`;
    case 'listItem':
      return `<li>${node.content.content.map(nodeHtml).join('')}</li>`;
    case 'blockquote':
      return `<blockquote>${node.content.content.map(nodeHtml).join('')}</blockquote>`;
    default:
      return '';
  }
}

function legacyRichTextNode(node: ProseMirrorNode) {
  if (!LEGACY_RICH_TEXT_NODE_TYPES.has(node.type.name)) return null;
  const html = nodeHtml(node).trim();
  return html ? html : null;
}

function legacyRichTextFromSubtree(node: ProseMirrorNode): string {
  if (CUSTOM_BLOCK_NODE_TYPES.has(node.type.name)) return '';
  if (LEGACY_RICH_TEXT_NODE_TYPES.has(node.type.name)) return nodeHtml(node);
  if (!node.childCount) return '';
  return node.content.content.map((child) => legacyRichTextFromSubtree(child)).join('');
}

// `instruction` is a global attribute (custom-blocks/instructions.ts) that may be null,
// but the import schema requires a non-empty instruction for these two block types.
const instructionOr = (value: unknown, fallback: string) => {
  const instruction = typeof value === 'string' ? value.trim() : '';
  return instruction || fallback;
};

const optionalInstruction = (value: unknown) => {
  const instruction = typeof value === 'string' ? value.trim() : '';
  return instruction || undefined;
};

const glossaryWidth = (value: unknown) => (
  GLOSSARY_COLUMN_WIDTHS.includes(Number(value) as typeof GLOSSARY_COLUMN_WIDTHS[number])
    ? Number(value)
    : undefined
);

function blockJson(node: ProseMirrorNode): Record<string, unknown> | null {
  const attrs = node.attrs as Record<string, unknown>;
  switch (node.type.name) {
    case 'customHeading': {
      const { text, level, numbered, gapAfter, restartInstructionNumbering } =
        attrs as CustomHeadingAttrs;
      return {
        type: 'heading',
        text,
        level,
        numbered,
        gapAfter,
        restartInstructionNumbering,
      };
    }
    case 'pageBreak':
      return { type: 'pageBreak', restartPagination: Boolean(attrs.restartPagination) };
    case 'richText': {
      const { html } = attrs as RichTextAttrs;
      return { type: 'richText', html: html.trim() ? html : '<p><br></p>' };
    }
    case 'glossaryTerms': {
      const {
        terms,
        preset,
        showInstruction,
        showColumnHeaders,
        showExample,
        showAdditionalColumn,
        termWidth,
        definitionWidth,
        additionalWidth,
        headerLabels,
      } =
        attrs as GlossaryTermsAttrs;
      return {
        type: 'glossary',
        preset,
        showInstruction,
        showColumnHeaders,
        showExample,
        showAdditionalColumn,
        instruction: optionalInstruction(attrs.instruction),
        headerLabels: Array.isArray(headerLabels)
          ? headerLabels
            .slice(0, 4)
            .map((label) => (typeof label === 'string' ? label : ''))
          : [],
        // Presets override the widths on import, so only default keeps them.
        termWidth: preset === 'default' ? glossaryWidth(termWidth) : undefined,
        definitionWidth: preset === 'default' ? glossaryWidth(definitionWidth) : undefined,
        additionalWidth: preset === 'default' ? glossaryWidth(additionalWidth) : undefined,
        entries: terms.map(({ term, definition, additional, example }) => ({
          term,
          definition,
          additional: additional || undefined,
          example: example || undefined,
        })),
      };
    }
    case 'fillInTheBlank': {
      const {
        title, text, distractors, widthFactor, hideBlankNumbers,
        hideItemNumbers, showLineNumbers, showWordBank, showFirstAsExample,
      } = attrs as FillInTheBlankAttrs;
      return {
        type: 'fillInTheBlank',
        instruction: instructionOr(attrs.instruction, DEFAULT_BLOCK_INSTRUCTIONS.fillInTheBlank),
        title,
        items: text.split('\n').map((item) => item.trim()).filter(Boolean),
        distractors,
        widthFactor,
        hideBlankNumbers,
        hideItemNumbers,
        showLineNumbers,
        showWordBank,
        showFirstAsExample,
      };
    }
    case 'dialogue': {
      const {
        items, speakerNames, context, showSpeakerNames,
        showOriginal, showWordBank, hideBlankNumbers, showFirstAsExample,
      } = attrs as DialogueAttrs;
      return {
        type: 'dialogue',
        instruction: instructionOr(attrs.instruction, DEFAULT_BLOCK_INSTRUCTIONS.dialogue),
        context,
        speakerNames,
        showSpeakerNames,
        showOriginal,
        showWordBank,
        hideBlankNumbers,
        showFirstAsExample,
        items: items.map(({ speaker, text }) => ({ speaker, text })),
      };
    }
    case 'mcq': {
      const mcqAttrs = attrs as unknown as MCQAttrs;
      return {
        type: 'mcq',
        instruction: mcqAttrs.instruction,
        blockQuestion: mcqAttrs.blockQuestion,
        columns: mcqAttrs.columns,
        shuffleAnswers: mcqAttrs.shuffleAnswers,
        showInstruction: mcqAttrs.showInstruction,
        // Folds pre-multi-question documents into a single question.
        questions: getMCQQuestions(mcqAttrs).map(({ question, options, answerMode }) => ({
          question,
          answerMode,
          options: options.map(({ text, correct }) => ({ text, correct })),
        })),
      };
    }
    case 'mcm': {
      const mcmAttrs = attrs as MCMAttrs;
      return {
        type: 'mcm',
        instruction: optionalInstruction(attrs.instruction),
        question: mcmAttrs.question,
        showFirstAsExample: mcmAttrs.showFirstAsExample,
        hideStatement: Boolean(mcmAttrs.hideStatement),
        rows: mcmAttrs.rows.map((row) => ({
          id: row.id,
          text: row.text,
          options: row.options.map((option) => ({
            id: option.id,
            text: option.text,
            correct: option.correct,
          })),
        })),
      };
    }
    case 'articlePlural': {
      const {
        rows, order, shuffleSeed, continuation, rowNumberOffset,
      } = attrs as ArticlePluralAttrs;
      return {
        type: 'articlePlural',
        instruction: 'Kreuzen Sie den richtigen Artikel an. Schreiben Sie die Pluralform.',
        rows: rows.map(({ id, term, articles, plural }) => ({
          id,
          term,
          articles,
          plural,
        })),
        order,
        shuffleSeed,
        continuation,
        rowNumberOffset,
      };
    }
    case 'trueFalse': {
      const {
        question, trueLabel, falseLabel, showNa, naLabel, rows, showFirstAsExample,
      } = attrs as TrueFalseAttrs;
      return {
        type: 'trueFalse',
        instruction: optionalInstruction(attrs.instruction),
        question,
        trueLabel,
        falseLabel,
        showNa,
        naLabel,
        showFirstAsExample,
        rows: rows.map(({ text, correctValue }) => ({ text, correctValue })),
      };
    }
    case 'matchingPairs': {
      const {
        instruction, question, pairs, rightOrder,
        shuffleLeft, shuffleRight, shuffleSeed,
        showWordBank, shuffleWordBank, showFirstAsExample, answerStyle,
      } = attrs as MatchingPairsAttrs;
      return {
        type: 'matchingPairs',
        instruction,
        question,
        shuffleLeft,
        shuffleRight,
        shuffleSeed,
        showWordBank,
        shuffleWordBank,
        showFirstAsExample,
        answerStyle,
        pairs: pairs.map(({ id, left, right }) => ({ id, left, right })),
        rightOrder,
      };
    }
    case 'timeMatching': {
      const {
        instruction, leftRepresentation, rightRepresentation, times, rightOrder,
        allowedMinutes, rangeStart, rangeEnd, shuffleLeft, shuffleRight,
        showFirstAsExample, answerStyle,
      } = attrs as TimeMatchingAttrs;
      return {
        type: 'timeMatching',
        instruction,
        leftRepresentation,
        rightRepresentation,
        times: times.map(({ id, hour, minute }) => ({ id, hour, minute })),
        // Kept explicit so the copy reproduces the current layout; drop it to
        // let shuffleRight lay the right column out again on import.
        rightOrder,
        allowedMinutes,
        rangeStart,
        rangeEnd,
        shuffleLeft,
        shuffleRight,
        showFirstAsExample,
        answerStyle,
      };
    }
    case 'communicationCards': {
      const {
        title,
        textSize,
        items,
      } = attrs as CommunicationCardsAttrs;
      return {
        type: 'communicationCards',
        title,
        format: 'a4-landscape',
        sidedness: 'single',
        textSize,
        items: items.map(({
          id,
          pairTitle,
          situation,
          task,
          intro,
          listType,
          listItems,
          content,
        }) => ({
          id,
          pairTitle,
          situation,
          task,
          intro,
          listType,
          listItems,
          content,
        })),
      };
    }
    case 'wordGrid': {
      const {
        instruction, columns, rows, rowHeight, showWordList,
        showFirstAsExample, directions, words, generation,
      } = attrs as WordGridAttrs;
      return {
        type: 'wordGrid',
        instruction,
        columns,
        rows,
        rowHeight,
        showWordList,
        showFirstAsExample,
        directions,
        words,
        // Layout seed — keep it so the copy reproduces the same grid.
        generation,
      };
    }
    case 'learningCards': {
      const {
        title,
        sidedness,
        items,
        frontTextSize,
        backTextSize,
      } = attrs as LearningCardsAttrs;
      return {
        type: 'learningCards',
        title,
        sidedness,
        frontTextSize,
        backTextSize,
        // Ids are kept because the node view uses an `-empty` suffix to decide
        // whether a blank card renders a "Card N" placeholder.
        items: items.map(({ id, front, back }) => ({ id, front, back })),
      };
    }
    case 'domino': {
      const {
        pairs,
        showFirstAsExample,
        oddTextSize,
        evenTextSize,
        leftRepresentation,
        rightRepresentation,
      } = attrs as DominoAttrs;
      return {
        type: 'domino',
        // A multi-page domino is stored as several nodes separated by pageBreaks;
        // the export only needs the single canonical pair list from the first node.
        pairs: pairs.map(({ id, left, right }) => ({ id, left, right })),
        showFirstAsExample,
        oddTextSize,
        evenTextSize,
        leftRepresentation,
        rightRepresentation,
      };
    }
    case 'germanVerbTable': {
      const verbTableAttrs = attrs as GermanVerbTableAttrs;
      return {
        type: 'germanVerbTable',
        tableStyle: verbTableAttrs.tableStyle,
        tense: verbTableAttrs.tense,
        groupId: verbTableAttrs.groupId,
        groupIndex: verbTableAttrs.groupIndex,
        groupSize: verbTableAttrs.groupSize,
        hideInfinitiveBadge: verbTableAttrs.hideInfinitiveBadge,
        showInfinitiveHeading: verbTableAttrs.showInfinitiveHeading,
        infinitiveHeadingText: verbTableAttrs.infinitiveHeadingText,
        leftVerb: verbTableAttrs.leftVerb,
        leftForms: { ...verbTableAttrs.leftForms },
        leftAuxiliary: verbTableAttrs.leftAuxiliary,
        leftParticiple: verbTableAttrs.leftParticiple,
        comparisonAuxiliary: verbTableAttrs.comparisonAuxiliary,
        separablePrefix: verbTableAttrs.separablePrefix,
        rightVerb: verbTableAttrs.rightVerb,
        forms: { ...verbTableAttrs.forms },
        rightAuxiliary: verbTableAttrs.rightAuxiliary,
        rightParticiple: verbTableAttrs.rightParticiple,
        multipleVerbCount: verbTableAttrs.multipleVerbCount,
        multipleBadgeStyle: verbTableAttrs.multipleBadgeStyle,
        multipleVerbs: verbTableAttrs.multipleVerbs.map((verb) => ({
          verb: verb.verb,
          forms: { ...verb.forms },
          separablePrefix: verb.separablePrefix,
        })),
      };
    }
    case 'declinationTable': {
      const declinationTableAttrs = attrs as DeclinationTableAttrs;
      const nominativeRow = declinationTableAttrs.rows.find((row) => row.key === 'nom');
      const fallbackBaseNouns = {
        masculine: nominativeRow?.values.masculine.noun[0] ?? '',
        feminine: nominativeRow?.values.feminine.noun[0] ?? '',
        neuter: nominativeRow?.values.neuter.noun[0] ?? '',
        plural: nominativeRow?.values.plural.noun[0] ?? '',
      };
      const fallbackBaseAdjectives = {
        masculine: inferAdjectiveBase(
          declinationTableAttrs.rows.flatMap((row) => row.values.masculine.adjective),
        ),
        feminine: inferAdjectiveBase(
          declinationTableAttrs.rows.flatMap((row) => row.values.feminine.adjective),
        ),
        neuter: inferAdjectiveBase(
          declinationTableAttrs.rows.flatMap((row) => row.values.neuter.adjective),
        ),
        plural: inferAdjectiveBase(
          declinationTableAttrs.rows.flatMap((row) => row.values.plural.adjective),
        ),
      };
      return {
        type: 'declinationTable',
        baseAdjectives: {
          masculine: declinationTableAttrs.baseAdjectives?.masculine ?? fallbackBaseAdjectives.masculine,
          feminine: declinationTableAttrs.baseAdjectives?.feminine ?? fallbackBaseAdjectives.feminine,
          neuter: declinationTableAttrs.baseAdjectives?.neuter ?? fallbackBaseAdjectives.neuter,
          plural: declinationTableAttrs.baseAdjectives?.plural ?? fallbackBaseAdjectives.plural,
        },
        baseNouns: {
          masculine: declinationTableAttrs.baseNouns?.masculine ?? fallbackBaseNouns.masculine,
          feminine: declinationTableAttrs.baseNouns?.feminine ?? fallbackBaseNouns.feminine,
          neuter: declinationTableAttrs.baseNouns?.neuter ?? fallbackBaseNouns.neuter,
          plural: declinationTableAttrs.baseNouns?.plural ?? fallbackBaseNouns.plural,
        },
        rows: declinationTableAttrs.rows.map((row) => ({
          key: row.key,
          values: {
            masculine: {
              article: [...row.values.masculine.article],
              adjective: [...row.values.masculine.adjective],
              noun: [...row.values.masculine.noun],
            },
            feminine: {
              article: [...row.values.feminine.article],
              adjective: [...row.values.feminine.adjective],
              noun: [...row.values.feminine.noun],
            },
            neuter: {
              article: [...row.values.neuter.article],
              adjective: [...row.values.neuter.adjective],
              noun: [...row.values.neuter.noun],
            },
            plural: {
              article: [...row.values.plural.article],
              adjective: [...row.values.plural.adjective],
              noun: [...row.values.plural.noun],
            },
          },
        })),
      };
    }
    case 'worksheetTable': {
      const tableAttrs = attrs as WorksheetTableAttrs;
      return {
        type: 'worksheetTable',
        instruction: tableAttrs.instruction,
        showInstruction: tableAttrs.showInstruction,
        columns: tableAttrs.columns.map((column) => ({
          id: column.id,
          label: column.label,
          span: column.span,
          align: column.align,
          useTabularNums: column.useTabularNums === true,
        })),
        rows: tableAttrs.rows.map((row) => ({
          id: row.id,
          isHeader: row.isHeader,
          cells: { ...row.cells },
        })),
        showHeader: tableAttrs.showHeader,
        hideBlankNumbers: tableAttrs.hideBlankNumbers,
        blankWidthFactor: tableAttrs.blankWidthFactor,
        showFirstAsExample: tableAttrs.showFirstAsExample,
      };
    }
    default:
      return null;
  }
}

function contextJson(context: WorksheetContext) {
  const entries = Object.entries(context).filter(([, value]) => (
    value !== null && value !== undefined && value !== ''
  ));
  return Object.fromEntries(entries);
}

/**
 * Serializes the current document into the multi-worksheet import payload used by
 * /automations → "Arbeitsblätter aus JSON erstellen". Blocks without an import
 * counterpart are dropped and reported through `skippedTypes`.
 */
export function worksheetJsonFromDoc(
  doc: ProseMirrorNode,
  meta: WorksheetJsonExportMeta,
): WorksheetJsonExportResult {
  const blocks: Record<string, unknown>[] = [];
  const skippedTypes = new Set<string>();
  const legacyRichTextParts: string[] = [];

  const flushLegacyRichText = () => {
    if (!legacyRichTextParts.length) return;
    blocks.push({
      type: 'richText',
      html: legacyRichTextParts.join(''),
    });
    legacyRichTextParts.length = 0;
  };
  // A learning-cards document is a sequence of front/back sheets over the same item
  // list, separated by page breaks, and the node's filterTransaction keeps anything
  // else out. Collapse it back into the single block the import expands again.
  let learningCardsSeen = false;
  let communicationCardsSeen = false;

  let dominoSeen = false;

  doc.forEach((node) => {
    const legacyRichText = legacyRichTextNode(node) ?? legacyRichTextFromSubtree(node).trim();
    if (legacyRichText) {
      legacyRichTextParts.push(legacyRichText);
      return;
    }

    flushLegacyRichText();

    if (node.type.name === 'learningCards') {
      if (learningCardsSeen) return;
      learningCardsSeen = true;
      blocks.push(blockJson(node)!);
      return;
    }
    if (learningCardsSeen && node.type.name === 'pageBreak') return;
    if (node.type.name === 'communicationCards') {
      if (communicationCardsSeen) return;
      communicationCardsSeen = true;
      blocks.push(blockJson(node)!);
      return;
    }
    if (communicationCardsSeen && node.type.name === 'pageBreak') return;
    if (node.type.name === 'domino') {
      // Multi-page dominoes are stored as multiple nodes separated by page breaks.
      // Only the first node carries the canonical block in the export.
      if (!dominoSeen) {
        dominoSeen = true;
        blocks.push(blockJson(node)!);
      }
      return;
    }
    if (dominoSeen && node.type.name === 'pageBreak') return;
    const block = blockJson(node);
    if (block) {
      blocks.push(block);
      return;
    }
    if (IGNORED_NODE_TYPES.has(node.type.name) && !node.textContent.trim()) return;
    skippedTypes.add(node.type.name);
  });

  flushLegacyRichText();

  const payload = {
    schemaVersion: 1,
    worksheets: [{
      title: meta.title,
      documentSize: meta.documentSize,
      showSolutions: meta.showSolutions,
      status: 'draft',
      brandProfileId: meta.brandProfileId ?? undefined,
      context: contextJson(meta.context),
      blocks,
    }],
  };

  return {
    // JSON.stringify drops the `undefined` values used above for "omit this key".
    json: JSON.stringify(payload, null, 2),
    blockCount: blocks.length,
    skippedTypes: [...skippedTypes],
  };
}
