import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import { GLOSSARY_COLUMN_WIDTHS } from '@/components/editor/glossary-terms-node';
import { getMCQQuestions, type MCQAttrs } from '@/components/editor/mcq-node';
import type { CustomHeadingAttrs } from '@/components/editor/heading-node';
import type { GlossaryTermsAttrs } from '@/components/editor/glossary-terms-node';
import type { FillInTheBlankAttrs } from '@/components/editor/fill-in-the-blank-node';
import type { DialogueAttrs } from '@/components/editor/dialogue-node';
import type { TrueFalseAttrs } from '@/components/editor/true-false-node';
import type { MatchingPairsAttrs } from '@/components/editor/matching-pairs-node';
import type { TimeMatchingAttrs } from '@/components/editor/time-matching-node';
import type { LearningCardsAttrs } from '@/components/editor/learning-cards-node';
import type { RichTextAttrs } from '@/components/editor/rich-text-node';
import type { WordGridAttrs } from '@/components/editor/word-grid-node';
import type { DominoAttrs } from '@/components/editor/domino-node';
import type { WorksheetContext } from '@/lib/worksheet-types';

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
  'mcq',
  'trueFalse',
  'matchingPairs',
  'timeMatching',
  'wordGrid',
  'learningCards',
  'domino',
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
