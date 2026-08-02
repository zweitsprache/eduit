"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useEditor, useEditorState, EditorContent, type Editor } from '@tiptap/react';
import { NodeSelection } from '@tiptap/pm/state';
import Placeholder from '@tiptap/extension-placeholder';
import { ConvertKit } from '@tiptap-pro/extension-convert-kit';
import { TableKit } from '@tiptap-pro/extension-pages-tablekit';
import { Pages, PAGE_FORMATS, type PageFormat } from '@tiptap-pro/extension-pages';
import { PageBreak } from '@tiptap-pro/extension-pagebreak';
import {
  Trash01,
  Copy01,
  Home03,
  File02,
  GraduationHat01,
  Image01,
  Settings01,
  Grid01,
  Download01,
  Loading01,
  PlusSquare,
  Edit05,
  ChevronUp,
  ChevronDown,
} from '@untitledui/icons';
import {
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  FileUp,
  WandSparkles,
} from 'lucide-react';
import { Button } from '@/components/base/buttons/button';
import { SearchSelect, Select } from '@/components/base/select/select';
import { Toggle } from '@/components/base/toggle/toggle';
import { cx } from '@/utils/cx';
import { SidebarAccountCard } from '@/components/app/sidebar-account-card';
import { LanguageSwitcher } from '@/components/i18n/language-switcher';
import { useI18n } from '@/components/i18n/locale-provider';
import { EduitLogo } from '@eduit/ui';
import { CustomBlockInstructions } from '@/components/editor/custom-blocks/instructions';
import {
  getMCQQuestions,
  MCQ,
  type MCQAnswerMode,
  type MCQAttrs,
  type MCQColumns,
  type MCQOption,
  type MCQQuestion,
} from '@/components/editor/mcq-node';
import {
  MCM,
  type MCMAttrs,
  type MCMOption,
  type MCMRow,
} from '@/components/editor/mcm-node';
import {
  MCH,
  type MCHAttrs,
  type MCHOption,
  type MCHRow,
} from '@/components/editor/mch-node';
import {
  MatchingPairs,
  type MatchingPair,
  type MatchingPairsAttrs,
} from '@/components/editor/matching-pairs-node';
import {
  DEFAULT_TIME_MATCHING_ATTRS,
  TimeMatching,
  type TimeMatchingAttrs,
} from '@/components/editor/time-matching-node';
import {
  DateMatching,
  type DateMatchingAttrs,
} from '@/components/editor/date-matching-node';
import {
  TwoWayPrepositions,
  type TwoWayPrepositionsAttrs,
} from '@/components/editor/two-way-prepositions-node';
import {
  Weather,
  type WeatherAttrs,
} from '@/components/editor/weather-node';
import {
  ColorFurniture,
  type ColorFurnitureAttrs,
} from '@/components/editor/color-furniture-node';
import {
  FamilyKinship,
} from '@/components/editor/family-kinship-node';
import {
  DEFAULT_GERMAN_VERB_TABLE_ATTRS,
  GermanVerbTable,
  type GermanVerbTableAttrs,
  type GermanVerbTableForms,
} from '@/components/editor/german-verb-table-node';
import {
  OccupationPortrait,
  DEFAULT_OCCUPATION_PORTRAIT_ATTRS,
  type OccupationPortraitAttrs,
} from '@/components/editor/occupation-portrait-node';
import {
  TrueFalse,
  type TrueFalseAttrs,
  type TrueFalseRow,
  type TrueFalseValue,
} from '@/components/editor/true-false-node';
import {
  FillInTheBlank,
  parseFillInTheBlankText,
  type FillInTheBlankAttrs,
} from '@/components/editor/fill-in-the-blank-node';
import {
  GlossaryTerms,
  type GlossaryTerm,
  type GlossaryTermsAttrs,
  type GlossaryTermWidth,
} from '@/components/editor/glossary-terms-node';
import {
  FrayerModel,
  type FrayerModelAttrs,
  type FrayerQuadrant,
} from '@/components/editor/frayer-model-node';
import {
  LearningObjective,
  type LearningObjectiveAttrs,
  type SuccessCriterion,
} from '@/components/editor/learning-objective-node';
import {
  DEFAULT_LEARNING_CARDS_ATTRS,
  LearningCards,
} from '@/components/editor/learning-cards-node';
import { LearningCardsAIModal } from '@/components/editor/learning-cards-ai-modal';
import {
  CustomHeading,
  type CustomHeadingAttrs,
  type CustomHeadingGapAfter,
  type CustomHeadingLevel,
} from '@/components/editor/heading-node';
import {
  DEFAULT_DIALOGUE_SPEAKER_NAMES,
  Dialogue,
  type DialogueAttrs,
  type DialogueItem,
  type DialogueSpeaker,
} from '@/components/editor/dialogue-node';
import {
  RewriteSentences,
  rewriteWordBankMode,
  type RewriteSentenceItem,
  type RewriteSentencesAttrs,
} from '@/components/editor/rewrite-sentences-node';
import {
  SortingCategories,
  type SortingCategoriesAttrs,
  type SortingCategory,
  type SortingCategoryItem,
} from '@/components/editor/sorting-categories-node';
import {
  Ordering,
  type OrderingAttrs,
  type OrderingItem,
} from '@/components/editor/ordering-node';
import {
  DEFAULT_WORD_GRID_DIRECTIONS,
  WordGrid,
  type WordGridAttrs,
  type WordGridDirection,
} from '@/components/editor/word-grid-node';
import {
  ChooseCorrectWords,
  type ChooseCorrectWordItem,
  type ChooseCorrectWordsAttrs,
} from '@/components/editor/choose-correct-words-node';
import {
  InlineChoice,
  type InlineChoiceAttrs,
  type InlineChoiceItem,
} from '@/components/editor/inline-choice-node';
import {
  MiniForm,
  type MiniFormAttrs,
  type MiniFormColumns,
  type MiniFormField,
  type MiniFormItem,
} from '@/components/editor/mini-form-node';
import {
  WorksheetTable,
  type WorksheetTableAttrs,
  type WorksheetTableColumn,
  type WorksheetTableRow,
} from '@/components/editor/worksheet-table-node';
import {
  ACTIVE_CUSTOM_BLOCK_BRAND,
  formatBrandDate,
} from '@/components/editor/custom-blocks/brand';
import type { BrandProfile } from '@/lib/brand-profile-types';
import {
  EMPTY_WORKSHEET_CONTEXT,
  type WorksheetContext,
} from '@/lib/worksheet-types';
import type { ContextProfile } from '@/lib/context-profiles';
import { CustomBlockNumbering } from '@/components/editor/custom-blocks/numbering';
import { InsertBlockPalette } from '@/components/editor/custom-blocks/insert-block-palette';
import { MediaLibraryModal } from '@/components/editor/media-library-modal';
import {
  stripInlineFormatting,
} from '@/components/editor/custom-blocks/inline-formatting';
import {
  InlineFormattedInput,
} from '@/components/editor/custom-blocks/inline-formatted-input';
import { CUSTOM_BLOCK_REGISTRY } from '@/components/editor/custom-blocks/registry';
import {
  BlockContentEditorModal,
  type ContentEditorBlock,
} from '@/components/editor/block-content-editor-modal';
import { WordGridAIModal } from '@/components/editor/word-grid-ai-modal';
import { CrosswordAIModal } from '@/components/editor/crossword-ai-modal';
import {
  VocabularyOneAIModal,
} from '@/components/editor/vocabulary-one-ai-modal';
import {
  OccupationPortraitAIModal,
} from '@/components/editor/occupation-portrait-ai-modal';
import { WordGridCSVImportModal } from '@/components/editor/word-grid-csv-import-modal';
import { DialogueAIModal } from '@/components/editor/dialogue-ai-modal';
import { MiniFormAIModal } from '@/components/editor/mini-form-ai-modal';
import {
  FillInTheBlankAIModal,
} from '@/components/editor/fill-in-the-blank-ai-modal';
import { RichText } from '@/components/editor/rich-text-node';
import { InstructionBlock } from '@/components/editor/instruction-node';
import { MediaLayout } from '@/components/editor/media-layout-node';
import { MediaLayoutEditorModal } from '@/components/editor/media-layout-editor-modal';
import { BlockHoverToolbar } from '@/components/editor/block-hover-toolbar';
import { LetterNode } from '@/components/editor/letter-node';
import {
  Crossword,
  type CrosswordAttrs,
} from '@/components/editor/crossword-node';
import {
  createErrorCorrectionMarkup,
  ErrorCorrection,
} from '@/components/editor/error-correction-node';
import {
  ErrorCorrectionAIModal,
} from '@/components/editor/error-correction-ai-modal';
import {
  TrueFalseAIModal,
  type RichTextSource,
} from '@/components/editor/true-false-ai-modal';
import { RichTextAIModal } from '@/components/editor/rich-text-ai-modal';
import { MCQAIModal } from '@/components/editor/mcq-ai-modal';
import { TimeMatchingAIModal } from '@/components/editor/time-matching-ai-modal';
import { DateMatchingAIModal } from '@/components/editor/date-matching-ai-modal';
import {
  TwoWayPrepositionsAIModal,
} from '@/components/editor/two-way-prepositions-ai-modal';
import {
  TwoWayPrepositionsEditorModal,
} from '@/components/editor/two-way-prepositions-editor-modal';
import { WeatherAIModal } from '@/components/editor/weather-ai-modal';
import {
  ColorFurnitureAIModal,
} from '@/components/editor/color-furniture-ai-modal';
import {
  GermanVerbTableEditorModal,
} from '@/components/editor/german-verb-table-editor-modal';
import {
  GermanVerbTableAIModal,
} from '@/components/editor/german-verb-table-ai-modal';

const STORAGE_KEY = 'eduit-editor-content';
const BRAND_PROFILES_UPDATED_KEY = 'eduit-brand-profiles-updated';
const BRAND_PROFILES_UPDATED_EVENT = 'eduit:brand-profiles-updated';
const ADDITIONAL_WORKSHEET_LEVELS = [
  'A1.1', 'A1.2', 'A2.1', 'A2.2', 'B1.1', 'B1.2',
] as const;
const ADDITIONAL_WORKSHEET_PHASES = [
  'beginning', 'middle', 'towards-end', 'completed',
] as const;

function plainTextToRichTextHtml(value: string) {
  const escapeHtml = (text: string) => text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
  return value
    .trim()
    .split(/\n{2,}/)
    .filter((paragraph) => paragraph.trim())
    .map((paragraph) => (
      `<p>${escapeHtml(paragraph.trim()).replaceAll('\n', '<br>')}</p>`
    ))
    .join('');
}

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function generatedHeadingHtml(title: string) {
  return `<div data-heading-text="${escapeAttribute(title)}" data-heading-level="1" data-heading-numbered="false" data-heading-gap-after="2" data-type="custom-heading"></div>`;
}

function generatedWordGridHtml(
  words: string[],
  showWordList: boolean,
  generation: number,
) {
  const longestWord = Math.max(...words.map((word) => Array.from(word).length));
  const size = Math.min(20, Math.max(10, longestWord, Math.ceil(Math.sqrt(
    words.reduce((total, word) => total + Array.from(word).length, 0) * 2,
  ))));
  const attrs: WordGridAttrs = {
    instruction: 'Finden Sie die Verben im Wortgitter.',
    columns: size,
    rows: size,
    rowHeight: 1,
    showWordList,
    showFirstAsExample: false,
    directions: {
      leftToRight: true,
      rightToLeft: false,
      topToBottom: true,
      bottomToTop: false,
      northWestToSouthEast: false,
      southWestToNorthEast: false,
      northEastToSouthWest: false,
      southEastToNorthWest: false,
    },
    words,
    generation,
  };
  return `<div data-type="word-grid" data-word-grid-attrs="${encodeURIComponent(JSON.stringify(attrs))}"></div>`;
}

function generatedFillInTheBlankHtml(sentences: string[]) {
  return `<div data-block-instruction="Schreiben Sie die korrekte Verbform in die Lücke." data-fill-blank-title="" data-fill-blank-text="${escapeAttribute(sentences.join('\n'))}" data-fill-blank-distractors="[]" data-fill-blank-width-factor="1" data-fill-blank-hide-numbers="false" data-fill-blank-hide-item-numbers="false" data-fill-blank-show-line-numbers="false" data-fill-blank-show-word-bank="false" data-fill-blank-show-first-example="false" data-type="fill-in-the-blank"></div>`;
}

const SelectablePageBreak = PageBreak.extend({
  selectable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      restartPagination: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-restart-pagination') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-restart-pagination': String(attributes.restartPagination),
        }),
      },
    };
  },
});
const DOCUMENT_HEADER = '<p></p>';
const DOCUMENT_CREATOR = 'Creator name';
const DOCUMENT_ID = 'Document ID';
const FOOTER_BLOCK_TAG_PATTERN =
  /<\/?(?:address|article|aside|blockquote|div|footer|h[1-6]|header|li|main|nav|ol|p|section|table|tbody|td|tfoot|th|thead|tr|ul)(?:\s[^>]*)?>/gi;
const CUSTOM_BLOCK_TYPES = new Set(
  CUSTOM_BLOCK_REGISTRY.map(({ type }) => type),
);
const CONTENT_EDITOR_BLOCK_TYPES = new Set([
  'mcq',
  'mcm',
  'mch',
  'trueFalse',
  'ordering',
  'matchingPairs',
  'fillInTheBlank',
  'glossaryTerms',
  'frayerModel',
  'learningObjective',
  'learningCards',
  'dialogue',
  'rewriteSentences',
  'sortingCategories',
  'wordGrid',
  'chooseCorrectWords',
  'inlineChoice',
  'miniForm',
  'worksheetTable',
  'richText',
  'instructionBlock',
  'mediaLayout',
  'letterNode',
  'crossword',
  'errorCorrection',
  'familyKinship',
]);

function richTextToPlainText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|h[1-6]|li|div)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function fillInTheBlankToSolvedText(text: string) {
  return parseFillInTheBlankText(text)
    .map((part) => (part.type === 'blank' ? part.answer : part.value))
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function serializeStyleSheet(
  styleSheet: CSSStyleSheet,
  visited: Set<CSSStyleSheet>,
): string {
  if (visited.has(styleSheet)) return '';
  visited.add(styleSheet);

  return Array.from(styleSheet.cssRules).map((rule) => {
    if (rule.type !== CSSRule.IMPORT_RULE) return rule.cssText;

    const importRule = rule as CSSImportRule;
    if (!importRule.styleSheet) return rule.cssText;

    try {
      const importedCss = serializeStyleSheet(importRule.styleSheet, visited);
      const media = importRule.media.mediaText;
      return media ? `@media ${media}{${importedCss}}` : importedCss;
    } catch {
      return rule.cssText;
    }
  }).join('\n');
}

function serializedDocumentHead() {
  const visitedStyleSheets = new Set<CSSStyleSheet>();
  return Array.from(document.styleSheets).map((styleSheet) => {
    try {
      const css = serializeStyleSheet(styleSheet, visitedStyleSheets)
        .replace(/<\/style/gi, '<\\/style');
      return `<style>${css}</style>`;
    } catch {
      return styleSheet.ownerNode instanceof HTMLElement
        ? styleSheet.ownerNode.outerHTML
        : '';
    }
  }).join('\n');
}

async function inlinePrivateMediaImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('img'))
    .filter((image) => {
      const src = image.getAttribute('src') ?? '';
      return src.startsWith('/api/media/')
        || src.startsWith(`${window.location.origin}/api/media/`);
    });
  await Promise.all(images.map(async (image) => {
    const response = await fetch(image.src);
    if (!response.ok) throw new Error('A media-library image could not be loaded.');
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result)));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(blob);
    });
    image.setAttribute('src', dataUrl);
  }));
}

async function generateWorksheetPreview(
  editor: Editor,
  worksheetId: string,
  requireSuccess = false,
) {
  if (editor.isDestroyed) {
    if (requireSuccess) throw new Error('Worksheet editor is unavailable.');
    return;
  }
  const editorElement = editor.view.dom;
  const sourceWidth = Math.ceil(editorElement.getBoundingClientRect().width);
  if (sourceWidth < 300) {
    if (requireSuccess) throw new Error('Worksheet preview is not ready yet.');
    return;
  }
  const clone = editorElement.cloneNode(true) as HTMLElement;
  clone.removeAttribute('contenteditable');
  clone.classList.remove('ProseMirror-focused');
  clone.querySelectorAll<HTMLElement>('[contenteditable]').forEach((element) => {
    element.removeAttribute('contenteditable');
  });
  clone.querySelectorAll<HTMLElement>(
    '.ProseMirror-selectednode, .custom-block--selected, .heading-node--selected',
  ).forEach((element) => {
    element.classList.remove(
      'ProseMirror-selectednode',
      'custom-block--selected',
      'heading-node--selected',
    );
  });
  clone.querySelectorAll('.rich-text-node__selection-fragment').forEach(
    (element) => element.remove(),
  );
  await inlinePrivateMediaImages(clone);
  const response = await fetch('/api/worksheets/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: worksheetId,
      content: clone.outerHTML,
      head: serializedDocumentHead(),
      sourceWidth,
    }),
  });
  if (requireSuccess && !response.ok) {
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? 'Worksheet preview generation failed.');
  }
}

const DEFAULT_DOCUMENT_BRAND = {
  name: ACTIVE_CUSTOM_BLOCK_BRAND.name,
  primaryColor: ACTIVE_CUSTOM_BLOCK_BRAND.primaryColor,
  accentColor: ACTIVE_CUSTOM_BLOCK_BRAND.accentColor,
  customColor1: ACTIVE_CUSTOM_BLOCK_BRAND.customColor1,
  customColor2: ACTIVE_CUSTOM_BLOCK_BRAND.customColor2,
  fontFamily: ACTIVE_CUSTOM_BLOCK_BRAND.fontFamily,
  stylePreset: ACTIVE_CUSTOM_BLOCK_BRAND.stylePreset,
  exampleFontFamily: ACTIVE_CUSTOM_BLOCK_BRAND.exampleFontFamily,
  exampleFontSize: ACTIVE_CUSTOM_BLOCK_BRAND.exampleFontSize,
  exampleColor: ACTIVE_CUSTOM_BLOCK_BRAND.exampleColor,
  solutionFontFamily: ACTIVE_CUSTOM_BLOCK_BRAND.solutionFontFamily,
  solutionFontSize: ACTIVE_CUSTOM_BLOCK_BRAND.solutionFontSize,
  solutionColor: ACTIVE_CUSTOM_BLOCK_BRAND.solutionColor,
  logoUrl: '/logo/eduit_logo.svg',
  logoScale: 1,
  instructionNumberFormat:
    ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberFormat,
  instructionNumberColor: ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberColor,
  instructionNumberFontWeight:
    ACTIVE_CUSTOM_BLOCK_BRAND.instructionNumberFontWeight,
  instructionBadgeStyle: ACTIVE_CUSTOM_BLOCK_BRAND.instructionBadgeStyle,
  headingNumberFormats: ACTIVE_CUSTOM_BLOCK_BRAND.headingNumberFormats,
  headingStyles: ACTIVE_CUSTOM_BLOCK_BRAND.headingStyles,
  fixedHeadingNumberWidth:
    ACTIVE_CUSTOM_BLOCK_BRAND.fixedHeadingNumberWidth,
  contentIndentation: ACTIVE_CUSTOM_BLOCK_BRAND.contentIndentation,
  dateFormat: ACTIVE_CUSTOM_BLOCK_BRAND.dateFormat,
};

function inlineFooterHtml(value: string) {
  return value
    .replace(/<(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(FOOTER_BLOCK_TAG_PATTERN, (tag) => (
      tag.startsWith('</') ? '<br>' : ''
    ))
    .replace(/(?:<br\s*\/?>\s*)+$/gi, '')
    .replace(/^(?:\s*<br\s*\/?>)+/gi, '');
}

function documentFooter(
  brand: Pick<BrandProfile, 'dateFormat' | 'name'> & Partial<
    Pick<BrandProfile, 'footer1Html' | 'footer2Html'>
  >,
  worksheetId?: string | null,
) {
  const footer1 = inlineFooterHtml(brand.footer1Html ?? brand.name);
  const footer2 = inlineFooterHtml(
    brand.footer2Html ?? DOCUMENT_CREATOR,
  );
  return [
    `<p>${footer1}<br>${footer2}</p>`,
    '<p>{page}/{total}</p>',
    `<p>${worksheetId ?? DOCUMENT_ID}<br>${formatBrandDate(new Date(), brand.dateFormat)}</p>`,
  ].join('');
}

function setNodeAttr(editor: Editor, pos: number, key: keyof MCQAttrs, value: MCQAttrs[keyof MCQAttrs]) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'mcq') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function getCrosswordWordList(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'crossword') return '';
  return (node.attrs as CrosswordAttrs).entries
    .map(({ answer }) => answer.trim())
    .filter(Boolean)
    .join('\n');
}

function getTimeMatchingGenerationSettings(editor: Editor, pos: number) {
  const defaults = {
    leftRepresentation: DEFAULT_TIME_MATCHING_ATTRS.leftRepresentation,
    rightRepresentation: DEFAULT_TIME_MATCHING_ATTRS.rightRepresentation,
    allowedMinutes: DEFAULT_TIME_MATCHING_ATTRS.allowedMinutes,
    rangeStart: DEFAULT_TIME_MATCHING_ATTRS.rangeStart,
    rangeEnd: DEFAULT_TIME_MATCHING_ATTRS.rangeEnd,
    count: DEFAULT_TIME_MATCHING_ATTRS.times.length,
    shuffleLeft: DEFAULT_TIME_MATCHING_ATTRS.shuffleLeft,
    shuffleRight: DEFAULT_TIME_MATCHING_ATTRS.shuffleRight,
    showFirstAsExample: DEFAULT_TIME_MATCHING_ATTRS.showFirstAsExample,
  };
  if (pos < 0 || pos > editor.state.doc.content.size) return defaults;
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'timeMatching') {
    return defaults;
  }
  const attrs = node.attrs as TimeMatchingAttrs;
  return {
    leftRepresentation: attrs.leftRepresentation,
    rightRepresentation: attrs.rightRepresentation,
    allowedMinutes: attrs.allowedMinutes,
    rangeStart: attrs.rangeStart,
    rangeEnd: attrs.rangeEnd,
    count: attrs.times.length || 6,
    shuffleLeft: attrs.shuffleLeft,
    shuffleRight: attrs.shuffleRight,
    showFirstAsExample: attrs.showFirstAsExample,
  };
}

function getDateMatchingItemCount(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'dateMatching') return 6;
  return (node.attrs as DateMatchingAttrs).dates.length || 6;
}

function getTwoWayPrepositionsItemCount(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'twoWayPrepositions') return 6;
  return (node.attrs as TwoWayPrepositionsAttrs).items.length || 6;
}

function getWeatherItemCount(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'weather') return 4;
  return (node.attrs as WeatherAttrs).items.length || 4;
}

function getColorFurnitureItemCount(editor: Editor, pos: number) {
  const node = editor.state.doc.nodeAt(pos);
  if (node?.type.name !== 'colorFurniture') return 4;
  return (node.attrs as ColorFurnitureAttrs).items.length || 4;
}

function setMCMAttr(editor: Editor, pos: number, key: keyof MCMAttrs, value: MCMAttrs[keyof MCMAttrs]) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'mcm') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setMCHAttr(editor: Editor, pos: number, key: keyof MCHAttrs, value: MCHAttrs[keyof MCHAttrs]) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'mch') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setMatchingPairsAttr(
  editor: Editor,
  pos: number,
  key: keyof MatchingPairsAttrs,
  value: MatchingPairsAttrs[keyof MatchingPairsAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'matchingPairs') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setTrueFalseAttr(
  editor: Editor,
  pos: number,
  key: keyof TrueFalseAttrs,
  value: TrueFalseAttrs[keyof TrueFalseAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'trueFalse') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setFillInTheBlankAttr(
  editor: Editor,
  pos: number,
  key: keyof FillInTheBlankAttrs,
  value: FillInTheBlankAttrs[keyof FillInTheBlankAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'fillInTheBlank') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setGlossaryTermsAttr(
  editor: Editor,
  pos: number,
  key: keyof GlossaryTermsAttrs,
  value: GlossaryTermsAttrs[keyof GlossaryTermsAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'glossaryTerms') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setFrayerModelAttr(
  editor: Editor,
  pos: number,
  key: keyof FrayerModelAttrs,
  value: FrayerModelAttrs[keyof FrayerModelAttrs],
) {
  editor
    .chain()
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'frayerModel') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setOrderingAttr(
  editor: Editor,
  pos: number,
  key: keyof OrderingAttrs,
  value: OrderingAttrs[keyof OrderingAttrs],
) {
  editor
    .chain()
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'ordering') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setLearningObjectiveAttr(
  editor: Editor,
  pos: number,
  key: keyof LearningObjectiveAttrs,
  value: LearningObjectiveAttrs[keyof LearningObjectiveAttrs],
) {
  editor
    .chain()
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'learningObjective') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setCustomHeadingAttr(
  editor: Editor,
  pos: number,
  key: keyof CustomHeadingAttrs,
  value: CustomHeadingAttrs[keyof CustomHeadingAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'customHeading') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setDialogueAttr(
  editor: Editor,
  pos: number,
  key: keyof DialogueAttrs,
  value: DialogueAttrs[keyof DialogueAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'dialogue') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setRewriteSentencesAttr(
  editor: Editor,
  pos: number,
  key: keyof RewriteSentencesAttrs,
  value: RewriteSentencesAttrs[keyof RewriteSentencesAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'rewriteSentences') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setSortingCategoriesAttr(
  editor: Editor,
  pos: number,
  key: keyof SortingCategoriesAttrs,
  value: SortingCategoriesAttrs[keyof SortingCategoriesAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'sortingCategories') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setWordGridAttr(
  editor: Editor,
  pos: number,
  key: keyof WordGridAttrs,
  value: WordGridAttrs[keyof WordGridAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'wordGrid') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setChooseCorrectWordsAttr(
  editor: Editor,
  pos: number,
  key: keyof ChooseCorrectWordsAttrs,
  value: ChooseCorrectWordsAttrs[keyof ChooseCorrectWordsAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'chooseCorrectWords') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setInlineChoiceAttr(
  editor: Editor,
  pos: number,
  key: keyof InlineChoiceAttrs,
  value: InlineChoiceAttrs[keyof InlineChoiceAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'inlineChoice') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setMiniFormAttr(
  editor: Editor,
  pos: number,
  key: keyof MiniFormAttrs,
  value: MiniFormAttrs[keyof MiniFormAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'miniForm') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function setWorksheetTableAttr(
  editor: Editor,
  pos: number,
  key: keyof WorksheetTableAttrs,
  value: WorksheetTableAttrs[keyof WorksheetTableAttrs],
) {
  editor
    .chain()
    // Deliberately no .focus(): sidebar inputs must retain DOM focus.
    .command(({ tr }) => {
      if (tr.doc.nodeAt(pos)?.type.name !== 'worksheetTable') return false;
      tr.setNodeAttribute(pos, key, value);
      return true;
    })
    .run();
}

function worksheetTableColumnSpan(column: WorksheetTableColumn) {
  const span = Number(column.span);
  const legacyWidth = Number(
    (column as WorksheetTableColumn & { width?: number }).width,
  );
  if (Number.isFinite(span)) {
    return Math.max(1, Math.min(12, Math.round(span)));
  }
  if (Number.isFinite(legacyWidth)) {
    return Math.max(1, Math.min(12, Math.round(legacyWidth * 0.12)));
  }
  return 1;
}

function normalizedTableColumns(columns: WorksheetTableColumn[]) {
  if (!columns.length) return [];
  const weights = columns.map(worksheetTableColumnSpan);
  const total = weights.reduce((sum, span) => sum + span, 0);
  if (total === 12) {
    return columns.map((column, index) => ({
      ...column,
      span: weights[index],
    }));
  }

  const quotas = weights.map((span) => (span / total) * 12);
  const spans = quotas.map((quota) => Math.max(1, Math.floor(quota)));
  let difference = 12 - spans.reduce((sum, span) => sum + span, 0);
  while (difference > 0) {
    const candidates = quotas
      .map((quota, index) => ({ index, remainder: quota - spans[index] }))
      .sort((a, b) => b.remainder - a.remainder);
    for (const { index } of candidates) {
      if (difference <= 0) break;
      spans[index] += 1;
      difference -= 1;
    }
  }
  while (difference < 0) {
    const index = spans.reduce(
      (largestIndex, span, currentIndex) => (
        span > spans[largestIndex] ? currentIndex : largestIndex
      ),
      0,
    );
    if (spans[index] <= 1) break;
    spans[index] -= 1;
    difference += 1;
  }
  return columns.map((column, index) => ({
    ...column,
    span: spans[index],
  }));
}

const NAV_ITEMS = [
  { label: 'Dashboard', Icon: Grid01, href: '#' },
  { label: 'Documents', Icon: File02, href: '/documents', active: true },
  { label: 'Automationen', Icon: WandSparkles, href: '/automations' },
  { label: 'Lessons', Icon: GraduationHat01, href: '#' },
  { label: 'Media', Icon: Image01, href: '#' },
  { label: 'Settings', Icon: Settings01, href: '#' },
];

const mmToPixels = (millimeters: number) => millimeters * (96 / 25.4);

const documentFormat = (
  fmt: (typeof PAGE_FORMATS)[keyof typeof PAGE_FORMATS],
  orientation: 'portrait' | 'landscape' = 'portrait',
): PageFormat => ({
  id: `${fmt.id}-${orientation}-eduit`,
  width: orientation === 'landscape' ? fmt.height : fmt.width,
  height: orientation === 'landscape' ? fmt.width : fmt.height,
  margins: {
    ...fmt.margins,
    bottom: fmt.id === PAGE_FORMATS.A4.id && orientation === 'landscape'
      ? mmToPixels(20)
      : fmt.margins.bottom,
    left: mmToPixels(
      fmt.id === PAGE_FORMATS.A4.id && orientation === 'portrait' ? 25 : 20,
    ),
    right: mmToPixels(
      fmt.id === PAGE_FORMATS.A4.id && orientation === 'portrait' ? 15 : 20,
    ),
  },
});

const DOC_SIZES: { id: string; label: string; format: () => PageFormat }[] = [
  { id: 'a4-portrait', label: 'DIN A4 Portrait', format: () => documentFormat(PAGE_FORMATS.A4) },
  { id: 'a4-landscape', label: 'DIN A4 Landscape', format: () => documentFormat(PAGE_FORMATS.A4, 'landscape') },
  { id: 'letter-portrait', label: 'US Letter Portrait', format: () => documentFormat(PAGE_FORMATS.Letter) },
  { id: 'letter-landscape', label: 'US Letter Landscape', format: () => documentFormat(PAGE_FORMATS.Letter, 'landscape') },
];

const LEARNER_STAGE_OPTIONS = [
  ['early-childhood', 'Early childhood'],
  ['primary', 'Primary education'],
  ['lower-secondary', 'Lower secondary'],
  ['upper-secondary', 'Upper secondary'],
  ['vocational', 'Vocational education'],
  ['higher-education', 'Higher education'],
  ['adult-education', 'Adult education'],
  ['professional-training', 'Professional training'],
  ['mixed', 'Mixed ages'],
  ['not-education-specific', 'Not education-specific'],
] as const;

const SUBJECT_OPTIONS = [
  { value: 'additional-languages', label: 'Languages' },
  { value: 'arts', label: 'Arts' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'civics', label: 'Civics' },
  { value: 'computer-science', label: 'Computer science' },
  { value: 'economics', label: 'Economics' },
  { value: 'general-science', label: 'General science' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
  { value: 'language-arts', label: 'Language arts / Literacy' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'music', label: 'Music' },
  { value: 'physical-education', label: 'Physical education' },
  { value: 'physics', label: 'Physics' },
  { value: 'social-studies', label: 'Social studies' },
  { value: 'vocational', label: 'Vocational studies' },
  { value: 'other', label: 'Other' },
];

const WORD_GRID_DIRECTION_OPTIONS: {
  value: WordGridDirection;
  label: string;
}[] = [
  { value: 'leftToRight', label: 'Left to right' },
  { value: 'rightToLeft', label: 'Right to left' },
  { value: 'topToBottom', label: 'Top to bottom' },
  { value: 'bottomToTop', label: 'Bottom to top' },
  { value: 'northWestToSouthEast', label: 'NW to SE' },
  { value: 'southWestToNorthEast', label: 'SW to NE' },
  { value: 'northEastToSouthWest', label: 'NE to SW' },
  { value: 'southEastToNorthWest', label: 'SE to NW' },
];



export default function EditorPage() {
  const { t } = useI18n();
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const [docSize, setDocSize] = useState('a4-portrait');
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [brandProfilesLoaded, setBrandProfilesLoaded] = useState(false);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [documentContext, setDocumentContext] = useState<WorksheetContext>({
    ...EMPTY_WORKSHEET_CONTEXT,
  });
  const contextPdfInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingContextPdf, setUploadingContextPdf] = useState(false);
  const [contextPdfError, setContextPdfError] = useState('');
  const [contextPdfDragActive, setContextPdfDragActive] = useState(false);
  const [contextProfiles, setContextProfiles] = useState<ContextProfile[]>([]);
  const [worksheetTitle, setWorksheetTitle] = useState('Untitled Document');
  const [worksheetFolderId, setWorksheetFolderId] = useState<string | null>(null);
  const [duplicatingWorksheet, setDuplicatingWorksheet] = useState(false);
  const [additionalWorksheetDialogOpen, setAdditionalWorksheetDialogOpen] =
    useState(false);
  const [creatingAdditionalWorksheet, setCreatingAdditionalWorksheet] =
    useState<'word-grid' | 'fill-in-the-blank' | null>(null);
  const [additionalWorksheetLevel, setAdditionalWorksheetLevel] =
    useState<typeof ADDITIONAL_WORKSHEET_LEVELS[number]>('A1.1');
  const [additionalWorksheetPhase, setAdditionalWorksheetPhase] =
    useState<typeof ADDITIONAL_WORKSHEET_PHASES[number]>('beginning');
  const worksheetIdRef = useRef<string | null>(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('worksheet')
      : null,
  );
  const [worksheetId, setWorksheetId] = useState<string | null>(null);
  const worksheetSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worksheetTitleSaveTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const worksheetPreviewTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worksheetInitializationStartedRef = useRef(false);
  const automationPublishStartedRef = useRef(false);
  const automationPublishErrorRef = useRef<string | null>(null);
  const [selectedMCQPos, setSelectedMCQPos] = useState<number | null>(null);
  const [selectedMCMPos, setSelectedMCMPos] = useState<number | null>(null);
  const [selectedMCHPos, setSelectedMCHPos] = useState<number | null>(null);
  const [selectedMatchingPairsPos, setSelectedMatchingPairsPos] = useState<number | null>(null);
  const [selectedTrueFalsePos, setSelectedTrueFalsePos] = useState<number | null>(null);
  const [selectedFillInTheBlankPos, setSelectedFillInTheBlankPos] = useState<number | null>(null);
  const [selectedGlossaryTermsPos, setSelectedGlossaryTermsPos] = useState<number | null>(null);
  const [selectedFrayerModelPos, setSelectedFrayerModelPos] = useState<number | null>(null);
  const [selectedLearningObjectivePos, setSelectedLearningObjectivePos] = useState<number | null>(null);
  const [selectedCustomHeadingPos, setSelectedCustomHeadingPos] = useState<number | null>(null);
  const [selectedDialoguePos, setSelectedDialoguePos] = useState<number | null>(null);
  const [selectedRewriteSentencesPos, setSelectedRewriteSentencesPos] = useState<number | null>(null);
  const [selectedSortingCategoriesPos, setSelectedSortingCategoriesPos] = useState<number | null>(null);
  const [selectedOrderingPos, setSelectedOrderingPos] = useState<number | null>(null);
  const [selectedWordGridPos, setSelectedWordGridPos] = useState<number | null>(null);
  const [selectedChooseCorrectWordsPos, setSelectedChooseCorrectWordsPos] = useState<number | null>(null);
  const [selectedInlineChoicePos, setSelectedInlineChoicePos] = useState<number | null>(null);
  const [selectedMiniFormPos, setSelectedMiniFormPos] = useState<number | null>(null);
  const [selectedWorksheetTablePos, setSelectedWorksheetTablePos] = useState<number | null>(null);
  const [selectedPageBreakPos, setSelectedPageBreakPos] = useState<number | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [publishingPDF, setPublishingPDF] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [dazitDocumentType, setDazitDocumentType] = useState('Arbeitsblatt');
  const [publicationStatus, setPublicationStatus] = useState<
    'unpublished' | 'current' | 'outdated'
  >('unpublished');
  const [republishScope, setRepublishScope] = useState<'pdf-only' | 'full'>('pdf-only');
  const [exportingBlockPNG, setExportingBlockPNG] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [blockExportError, setBlockExportError] = useState<string | null>(null);
  const [contentEditorBlock, setContentEditorBlock] =
    useState<ContentEditorBlock | null>(null);
  const [wordGridAIBlock, setWordGridAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [crosswordAIBlock, setCrosswordAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [vocabularyOneInsertAt, setVocabularyOneInsertAt] =
    useState<number | null>(null);
  const [occupationPortraitInsertAt, setOccupationPortraitInsertAt] =
    useState<number | null>(null);
  const [mcqAIBlock, setMCQAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [wordGridCSVBlock, setWordGridCSVBlock] =
    useState<ContentEditorBlock | null>(null);
  const [dialogueAIBlock, setDialogueAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [miniFormAIBlock, setMiniFormAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [fillInTheBlankAIBlock, setFillInTheBlankAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [trueFalseAIBlock, setTrueFalseAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [timeMatchingAIBlock, setTimeMatchingAIBlock] =
    useState<{ pos: number; type: 'timeMatching' } | null>(null);
  const [dateMatchingAIBlock, setDateMatchingAIBlock] =
    useState<{ pos: number; type: 'dateMatching' } | null>(null);
  const [twoWayPrepositionsAIBlock, setTwoWayPrepositionsAIBlock] =
    useState<{ pos: number; type: 'twoWayPrepositions' } | null>(null);
  const [twoWayPrepositionsEditorBlock, setTwoWayPrepositionsEditorBlock] =
    useState<{ pos: number; type: 'twoWayPrepositions' } | null>(null);
  const [weatherAIBlock, setWeatherAIBlock] =
    useState<{ pos: number; type: 'weather' } | null>(null);
  const [colorFurnitureAIBlock, setColorFurnitureAIBlock] =
    useState<{ pos: number; type: 'colorFurniture' } | null>(null);
  const [germanVerbTableEditorBlock, setGermanVerbTableEditorBlock] =
    useState<{ pos: number; type: 'germanVerbTable' } | null>(null);
  const [germanVerbTableAIBlock, setGermanVerbTableAIBlock] =
    useState<{ pos: number; type: 'germanVerbTable' } | null>(null);
  const [learningCardsAIBlock, setLearningCardsAIBlock] =
    useState<{ pos: number; type: 'learningCards' } | null>(null);
  const [richTextAIBlock, setRichTextAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [errorCorrectionAIBlock, setErrorCorrectionAIBlock] =
    useState<ContentEditorBlock | null>(null);
  const [mediaLayoutEditorBlock, setMediaLayoutEditorBlock] = useState<{
    pos: number;
    type: 'mediaLayout';
  } | null>(null);
  const [selectedCustomBlock, setSelectedCustomBlock] = useState<{
    pos: number;
    type: string;
  } | null>(null);
  const [insertPaletteOpen, setInsertPaletteOpen] = useState(false);
  const [insertBlockAt, setInsertBlockAt] = useState<number | null>(null);
  const [rewriteImageItemId, setRewriteImageItemId] = useState<string | null>(null);
  const [miniFormImageItemId, setMiniFormImageItemId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      ConvertKit.configure({
        table: false,
        gapcursor: {},
      }),
      TableKit,
      CustomBlockNumbering,
      MCQ,
      CustomBlockInstructions,
      MCM,
      MCH,
      MatchingPairs,
      TimeMatching,
      DateMatching,
      TwoWayPrepositions,
      Weather,
      ColorFurniture,
      FamilyKinship,
      GermanVerbTable,
      OccupationPortrait,
      TrueFalse,
      FillInTheBlank,
      GlossaryTerms,
      FrayerModel,
      LearningObjective,
      LearningCards,
      CustomHeading,
      Dialogue,
      RewriteSentences,
      SortingCategories,
      Ordering,
      WordGrid,
      ChooseCorrectWords,
      InlineChoice,
      MiniForm,
      WorksheetTable,
      RichText,
      InstructionBlock,
      MediaLayout,
      LetterNode,
      Crossword,
      ErrorCorrection,
      SelectablePageBreak.configure({
        label: 'Page break',
      }),
      Pages.configure({
        pageFormat: documentFormat(PAGE_FORMATS.A4),
        header: DOCUMENT_HEADER,
        headerTopMargin: mmToPixels(10),
        footer: documentFooter(DEFAULT_DOCUMENT_BRAND),
        editableFooter: false,
        pageGapBackground: 'var(--color-bg-tertiary)',
      }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
    ],
    immediatelyRender: false,
    content: typeof window !== 'undefined'
      ? (localStorage.getItem(STORAGE_KEY) ?? '')
      : '',
    onUpdate({ editor }) {
      localStorage.setItem(STORAGE_KEY, editor.getHTML());
      setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
      const worksheetId = worksheetIdRef.current;
      if (!worksheetId) {
        setSaved(true);
        return;
      }
      setSaved(false);
      if (worksheetSaveTimerRef.current) clearTimeout(worksheetSaveTimerRef.current);
      worksheetSaveTimerRef.current = setTimeout(async () => {
        try {
          const response = await fetch('/api/worksheets', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: worksheetId,
              worksheet: { contentHtml: editor.getHTML() },
            }),
          });
          setSaved(response.ok);
          if (response.ok) {
            if (worksheetPreviewTimerRef.current) {
              clearTimeout(worksheetPreviewTimerRef.current);
            }
            worksheetPreviewTimerRef.current = setTimeout(() => {
              void generateWorksheetPreview(editor, worksheetId);
            }, 1600);
          }
        } catch {
          setSaved(false);
        }
      }, 600);
    },
    onSelectionUpdate({ editor }) {
      const { selection } = editor.state;
      const selectedNodeName = selection instanceof NodeSelection
        ? selection.node.type.name
        : null;
      setSelectedCustomBlock(
        selectedNodeName && CUSTOM_BLOCK_TYPES.has(selectedNodeName)
          ? { pos: selection.from, type: selectedNodeName }
          : null,
      );
      setSelectedMCQPos(selectedNodeName === 'mcq' ? selection.from : null);
      setSelectedMCMPos(selectedNodeName === 'mcm' ? selection.from : null);
      setSelectedMCHPos(selectedNodeName === 'mch' ? selection.from : null);
      setSelectedMatchingPairsPos(
        selectedNodeName === 'matchingPairs' ? selection.from : null,
      );
      setSelectedTrueFalsePos(
        selectedNodeName === 'trueFalse' ? selection.from : null,
      );
      setSelectedFillInTheBlankPos(
        selectedNodeName === 'fillInTheBlank' ? selection.from : null,
      );
      setSelectedGlossaryTermsPos(
        selectedNodeName === 'glossaryTerms' ? selection.from : null,
      );
      setSelectedFrayerModelPos(
        selectedNodeName === 'frayerModel' ? selection.from : null,
      );
      setSelectedLearningObjectivePos(
        selectedNodeName === 'learningObjective' ? selection.from : null,
      );
      setSelectedCustomHeadingPos(
        selectedNodeName === 'customHeading' ? selection.from : null,
      );
      setSelectedDialoguePos(
        selectedNodeName === 'dialogue' ? selection.from : null,
      );
      setSelectedRewriteSentencesPos(
        selectedNodeName === 'rewriteSentences' ? selection.from : null,
      );
      setSelectedSortingCategoriesPos(
        selectedNodeName === 'sortingCategories' ? selection.from : null,
      );
      setSelectedOrderingPos(
        selectedNodeName === 'ordering' ? selection.from : null,
      );
      setSelectedWordGridPos(
        selectedNodeName === 'wordGrid' ? selection.from : null,
      );
      setSelectedChooseCorrectWordsPos(
        selectedNodeName === 'chooseCorrectWords' ? selection.from : null,
      );
      setSelectedInlineChoicePos(
        selectedNodeName === 'inlineChoice' ? selection.from : null,
      );
      setSelectedMiniFormPos(
        selectedNodeName === 'miniForm' ? selection.from : null,
      );
      setSelectedWorksheetTablePos(
        selectedNodeName === 'worksheetTable' ? selection.from : null,
      );
      setSelectedPageBreakPos(
        selectedNodeName === 'pageBreak' ? selection.from : null,
      );
    },
    editorProps: {
      attributes: {
        class: 'outline-none',
        'data-brand': ACTIVE_CUSTOM_BLOCK_BRAND.id,
        'data-style-preset': ACTIVE_CUSTOM_BLOCK_BRAND.stylePreset,
        style: `--custom-block-font-family: ${ACTIVE_CUSTOM_BLOCK_BRAND.fontFamily}`,
      },
      // Keep ProseMirror's selection scrolling inside the editor scrollport.
      //
      // The browser's default scrollIntoView implementation can scroll more
      // than one ancestor. With Pages, that creates a feedback loop:
      // scroll -> pagination layout -> selection scroll -> pagination layout.
      // It is especially visible for node selections and clicks in page
      // margins, where the scrollbar appears to jump between two positions.
      handleScrollToSelection(view) {
        const workspace = view.dom.closest<HTMLElement>('.editor-workspace');
        if (!workspace) return false;

        const selection = view.state.selection;
        const selectedDom = selection instanceof NodeSelection
          ? view.nodeDOM(selection.from)
          : null;
        const selectedElement = selectedDom instanceof HTMLElement
          ? selectedDom
          : selectedDom?.parentElement ?? null;
        const selectionRect = selectedElement?.isConnected
          ? selectedElement.getBoundingClientRect()
          : view.coordsAtPos(selection.head);
        const workspaceRect = workspace.getBoundingClientRect();
        const verticalPadding = 24;
        const horizontalPadding = 16;

        let topDelta = 0;
        if (selectionRect.top < workspaceRect.top + verticalPadding) {
          topDelta = selectionRect.top - workspaceRect.top - verticalPadding;
        } else if (
          selectionRect.bottom
          > workspaceRect.bottom - verticalPadding
        ) {
          topDelta =
            selectionRect.bottom - workspaceRect.bottom + verticalPadding;
        }

        let leftDelta = 0;
        if (selectionRect.left < workspaceRect.left + horizontalPadding) {
          leftDelta =
            selectionRect.left - workspaceRect.left - horizontalPadding;
        } else if (
          selectionRect.right
          > workspaceRect.right - horizontalPadding
        ) {
          leftDelta =
            selectionRect.right - workspaceRect.right + horizontalPadding;
        }

        if (topDelta !== 0 || leftDelta !== 0) {
          workspace.scrollBy({
            top: topDelta,
            left: leftDelta,
            behavior: 'auto',
          });
        }

        // We handled the request even when no movement was necessary. This is
        // what prevents the browser from scrolling an outer ancestor.
        return true;
      },
      // Native drop handler for block reordering.
      //
      // The pagination extension keeps the document flat and stacks pages
      // vertically with large gaps (page footers + next-page headers). The
      // browser maps that entire empty band to the *last* block of the
      // previous page, so ProseMirror's default drop (which resolves a single
      // caret position from the pointer coordinates) can never place a block
      // at the visual top of a follow-up page — it always lands at the end of
      // the previous page.
      //
      // We only take over for single-block drags: resolve the top-level node
      // under the pointer, then decide before/after it by comparing the
      // pointer against that node's vertical midpoint. This yields the correct
      // document position, which pagination then flows to the top of the page.
      handleDrop(view, event, slice, moved) {
        // Only correct single top-level block drags (our custom blocks and
        // headings). Let ProseMirror handle inline/text and multi-node drops.
        const isSingleBlock =
          slice.openStart === 0 &&
          slice.openEnd === 0 &&
          slice.content.childCount === 1 &&
          !!slice.content.firstChild &&
          slice.content.firstChild.isBlock;
        if (!isSingleBlock) return false;

        const dragEvent = event as DragEvent;
        const at = view.posAtCoords({
          left: dragEvent.clientX,
          top: dragEvent.clientY,
        });
        if (!at) return false;

        const { doc } = view.state;
        let target: { pos: number; size: number } | null = null;
        doc.forEach((node, pos) => {
          if (
            target === null &&
            at.pos >= pos &&
            at.pos < pos + node.nodeSize
          ) {
            target = { pos, size: node.nodeSize };
          }
        });
        if (target === null) return false;
        const resolved: { pos: number; size: number } = target;

        const dom = view.nodeDOM(resolved.pos);
        if (!(dom instanceof HTMLElement)) return false;
        const rect = dom.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const insertPos =
          dragEvent.clientY > midpoint ? resolved.pos + resolved.size : resolved.pos;

        const droppedNode = slice.content.firstChild;
        if (!droppedNode) return false;

        event.preventDefault();
        const tr = view.state.tr;
        if (moved) {
          tr.deleteSelection();
        }
        const mapped = tr.mapping.map(insertPos);
        tr.insert(mapped, droppedNode);
        tr.setSelection(NodeSelection.create(tr.doc, mapped));
        view.dispatch(tr.scrollIntoView());
        return true;
      },
    },
  });

  useEffect(() => {
    let active = true;
    void fetch('/api/current-user')
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ role?: string }>;
      })
      .then((result) => {
        if (active) setCurrentUserRole(result?.role ?? 'user');
      })
      .catch(() => {
        if (active) setCurrentUserRole('user');
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedMCQAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMCQPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMCQPos);
      return node?.type.name === 'mcq' ? node.attrs as MCQAttrs : null;
    },
  });
  const selectedMCQQuestions = selectedMCQAttrs
    ? getMCQQuestions(selectedMCQAttrs)
    : [];
  const selectedMCQQuestion = selectedMCQQuestions[0] ?? null;

  const selectedPageBreakRestartPagination = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedPageBreakPos === null) return false;
      const node = currentEditor.state.doc.nodeAt(selectedPageBreakPos);
      return node?.type.name === 'pageBreak'
        && node.attrs.restartPagination === true;
    },
  });

  const containsLearningCards = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor) return false;
      let found = false;
      currentEditor.state.doc.forEach((node) => {
        if (node.type.name === 'learningCards') found = true;
      });
      return found;
    },
  });

  const verbTableVerbs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const verbs: Array<{
        infinitive: string;
        forms: GermanVerbTableForms;
        separablePrefix: string;
      }> = [];
      currentEditor?.state.doc.descendants((node) => {
        if (node.type.name !== 'germanVerbTable') return;
        const attrs = node.attrs as GermanVerbTableAttrs;
        if (attrs.tableStyle === 'multiple') {
          attrs.multipleVerbs.forEach((verb) => {
            if (verb.verb.trim()) verbs.push({
              infinitive: verb.verb.trim(),
              forms: verb.forms,
              separablePrefix: verb.separablePrefix.trim(),
            });
          });
        } else if (attrs.leftVerb.trim()) {
          verbs.push({
            infinitive: attrs.leftVerb.trim(),
            forms: attrs.leftForms,
            separablePrefix: attrs.separablePrefix.trim(),
          });
        }
      });
      return verbs.filter((verb, index) => (
        verbs.findIndex((candidate) => (
          candidate.infinitive.localeCompare(verb.infinitive, 'de', {
            sensitivity: 'base',
          }) === 0
        )) === index
      ));
    },
  });
  const availableVerbTableVerbs = verbTableVerbs ?? [];

  const selectedMCMAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMCMPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMCMPos);
      return node?.type.name === 'mcm' ? node.attrs as MCMAttrs : null;
    },
  });

  const selectedMCHAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMCHPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMCHPos);
      return node?.type.name === 'mch' ? node.attrs as MCHAttrs : null;
    },
  });

  const selectedMatchingPairsAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMatchingPairsPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMatchingPairsPos);
      return node?.type.name === 'matchingPairs'
        ? node.attrs as MatchingPairsAttrs
        : null;
    },
  });

  const selectedTrueFalseAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedTrueFalsePos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedTrueFalsePos);
      return node?.type.name === 'trueFalse'
        ? node.attrs as TrueFalseAttrs
        : null;
    },
  });

  const richTextSources = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const sources: RichTextSource[] = [];
      currentEditor?.state.doc.descendants((node, pos) => {
        if (node.type.name !== 'richText') return;
        const text = richTextToPlainText(String(node.attrs.html ?? ''));
        if (!text) return;
        const preview = text.replace(/\s+/g, ' ').slice(0, 72);
        sources.push({
          pos,
          text,
          label: `Rich Text ${sources.length + 1} — ${preview}${
            text.length > 72 ? '…' : ''
          }`,
        });
      });
      return sources;
    },
  });

  const mcqSources = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      const sources: RichTextSource[] = [];
      let richTextCount = 0;
      let fillInTheBlankCount = 0;
      let occupationPortraitCount = 0;
      currentEditor?.state.doc.descendants((node, pos) => {
        if (node.type.name === 'richText') {
          const text = richTextToPlainText(String(node.attrs.html ?? ''));
          if (!text) return;
          richTextCount += 1;
          const preview = text.replace(/\s+/g, ' ').slice(0, 72);
          sources.push({
            pos,
            text,
            label: `Rich Text ${richTextCount} — ${preview}${
              text.length > 72 ? '…' : ''
            }`,
          });
        } else if (node.type.name === 'fillInTheBlank') {
          const text = fillInTheBlankToSolvedText(String(node.attrs.text ?? ''));
          if (!text) return;
          fillInTheBlankCount += 1;
          const preview = text.replace(/\s+/g, ' ').slice(0, 72);
          sources.push({
            pos,
            text,
            label: `Fill in the Blank ${fillInTheBlankCount} — ${preview}${
              text.length > 72 ? '…' : ''
            }`,
          });
        } else if (node.type.name === 'occupationPortrait') {
          const paragraphs = Array.isArray(node.attrs.paragraphs)
            ? node.attrs.paragraphs.filter(
              (paragraph): paragraph is string => typeof paragraph === 'string',
            )
            : [];
          const text = [
            String(node.attrs.title ?? '').trim(),
            ...paragraphs,
          ].filter(Boolean).join('\n\n');
          if (!text) return;
          occupationPortraitCount += 1;
          const profession = String(node.attrs.profession ?? '').trim();
          const preview = text.replace(/\s+/g, ' ').slice(0, 72);
          sources.push({
            pos,
            text,
            label: `Berufsporträt ${occupationPortraitCount}${
              profession ? ` — ${profession}` : ''
            } — ${preview}${text.length > 72 ? '…' : ''}`,
          });
        }
      });
      return sources;
    },
  });

  const selectedFillInTheBlankAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedFillInTheBlankPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedFillInTheBlankPos);
      return node?.type.name === 'fillInTheBlank'
        ? node.attrs as FillInTheBlankAttrs
        : null;
    },
  });

  const selectedGlossaryTermsAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedGlossaryTermsPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedGlossaryTermsPos);
      return node?.type.name === 'glossaryTerms'
        ? node.attrs as GlossaryTermsAttrs
        : null;
    },
  });

  const selectedFrayerModelAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedFrayerModelPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedFrayerModelPos);
      return node?.type.name === 'frayerModel'
        ? node.attrs as FrayerModelAttrs
        : null;
    },
  });

  const selectedLearningObjectiveAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedLearningObjectivePos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedLearningObjectivePos);
      return node?.type.name === 'learningObjective'
        ? node.attrs as LearningObjectiveAttrs
        : null;
    },
  });

  const selectedCustomHeadingAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedCustomHeadingPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedCustomHeadingPos);
      return node?.type.name === 'customHeading'
        ? node.attrs as CustomHeadingAttrs
        : null;
    },
  });

  const selectedDialogueAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedDialoguePos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedDialoguePos);
      return node?.type.name === 'dialogue'
        ? node.attrs as DialogueAttrs
        : null;
    },
  });

  const selectedRewriteSentencesAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedRewriteSentencesPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedRewriteSentencesPos);
      return node?.type.name === 'rewriteSentences'
        ? node.attrs as RewriteSentencesAttrs
        : null;
    },
  });

  const selectedSortingCategoriesAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedSortingCategoriesPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedSortingCategoriesPos);
      return node?.type.name === 'sortingCategories'
        ? node.attrs as SortingCategoriesAttrs
        : null;
    },
  });

  const selectedOrderingAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedOrderingPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedOrderingPos);
      return node?.type.name === 'ordering'
        ? node.attrs as OrderingAttrs
        : null;
    },
  });

  const selectedWordGridAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedWordGridPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedWordGridPos);
      return node?.type.name === 'wordGrid'
        ? node.attrs as WordGridAttrs
        : null;
    },
  });

  const selectedChooseCorrectWordsAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedChooseCorrectWordsPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedChooseCorrectWordsPos);
      return node?.type.name === 'chooseCorrectWords'
        ? node.attrs as ChooseCorrectWordsAttrs
        : null;
    },
  });

  const selectedInlineChoiceAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedInlineChoicePos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedInlineChoicePos);
      return node?.type.name === 'inlineChoice'
        ? node.attrs as InlineChoiceAttrs
        : null;
    },
  });

  const selectedMiniFormAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMiniFormPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMiniFormPos);
      return node?.type.name === 'miniForm'
        ? node.attrs as MiniFormAttrs
        : null;
    },
  });

  const selectedWorksheetTableAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedWorksheetTablePos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedWorksheetTablePos);
      return node?.type.name === 'worksheetTable'
        ? node.attrs as WorksheetTableAttrs
        : null;
    },
  });

  const loadBrandProfiles = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/brand-profiles', {
        cache: 'no-store',
      });
      const result = await response.json() as {
        profiles?: BrandProfile[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error ?? 'Could not load brand profiles.');
      }
      setBrandProfiles(
        (result.profiles ?? []).filter(({ isActive }) => isActive),
      );
    } catch {
      setBrandProfiles([]);
    } finally {
      setBrandProfilesLoaded(true);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) void loadBrandProfiles();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    const refreshFromStorage = (event: StorageEvent) => {
      if (event.key === BRAND_PROFILES_UPDATED_KEY) refresh();
    };

    refresh();
    window.addEventListener('focus', refresh);
    window.addEventListener(BRAND_PROFILES_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refreshFromStorage);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refresh);
      window.removeEventListener(BRAND_PROFILES_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refreshFromStorage);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [loadBrandProfiles]);

  const selectedBrandProfile = brandProfiles.find(
    ({ id }) => id === brandProfileId,
  );
  const defaultBrandProfile = brandProfiles.find(({ isDefault }) => isDefault);
  const activeBrand = selectedBrandProfile
    ?? defaultBrandProfile
    ?? DEFAULT_DOCUMENT_BRAND;

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.toggleAttribute(
      'data-learning-cards-print',
      Boolean(containsLearningCards),
    );
  }, [containsLearningCards, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.style.setProperty(
      '--document-logo-top',
      docSize.startsWith('a4-') ? '15mm' : '10mm',
    );
    if (docSize === 'a4-landscape') {
      editor.commands.setFooterBottomMargin(mmToPixels(7.5));
    } else {
      editor.commands.resetFooterBottomMargin();
    }
  }, [docSize, editor]);

  useEffect(() => {
    if (!editor) return;
    if (brandProfileId && !selectedBrandProfile) return;
    const editorElement = editor.view.dom;
    // Eduit supplies the structural defaults; profiles override brand tokens.
    editorElement.setAttribute('data-brand', 'eduit');
    editorElement.setAttribute('data-style-preset', activeBrand.stylePreset);
    editorElement.style.setProperty('--eduit-primary', activeBrand.primaryColor);
    editorElement.style.setProperty('--eduit-accent', activeBrand.accentColor);
    editorElement.style.setProperty(
      '--brand-custom-1',
      activeBrand.customColor1,
    );
    editorElement.style.setProperty(
      '--brand-custom-2',
      activeBrand.customColor2,
    );
    editorElement.style.setProperty(
      '--custom-block-font-family',
      activeBrand.fontFamily,
    );
    editorElement.style.setProperty(
      '--brand-example-font-family',
      activeBrand.exampleFontFamily,
    );
    editorElement.style.setProperty(
      '--brand-example-font-size',
      `${activeBrand.exampleFontSize}px`,
    );
    editorElement.style.setProperty(
      '--custom-block-example-solution-color',
      activeBrand.exampleColor,
    );
    editorElement.style.setProperty(
      '--brand-solution-font-family',
      activeBrand.solutionFontFamily,
    );
    editorElement.style.removeProperty('--custom-block-solution-font-family');
    editorElement.style.setProperty(
      '--brand-solution-font-size',
      `${activeBrand.solutionFontSize}px`,
    );
    editorElement.style.removeProperty('--custom-block-solution-font-size');
    editorElement.style.setProperty(
      '--custom-block-solution-color',
      activeBrand.solutionColor,
    );
    editorElement.style.setProperty(
      '--document-brand-logo',
      activeBrand.logoUrl
        ? `url("${activeBrand.logoUrl.replaceAll('"', '\\"')}")`
        : 'none',
    );
    editorElement.style.setProperty(
      '--document-brand-logo-scale',
      String(activeBrand.logoScale),
    );
    editorElement.setAttribute(
      'data-instruction-badge-style',
      activeBrand.instructionBadgeStyle,
    );
    editorElement.setAttribute(
      'data-fixed-heading-number-width',
      String(activeBrand.fixedHeadingNumberWidth),
    );
    editorElement.setAttribute(
      'data-content-indentation',
      String(activeBrand.contentIndentation),
    );
    const brandColors = {
      defaultText: 'var(--color-text-primary)',
      primary: activeBrand.primaryColor,
      accent: activeBrand.accentColor,
      custom1: activeBrand.customColor1,
      custom2: activeBrand.customColor2,
    };
    editorElement.style.setProperty(
      '--brand-task-number-color',
      activeBrand.instructionNumberColor === 'inverse'
        ? '#ffffff'
        : brandColors[activeBrand.instructionNumberColor],
    );
    editorElement.style.setProperty(
      '--brand-task-number-weight',
      String(activeBrand.instructionNumberFontWeight),
    );
    ([1, 2, 3, 4, 5] as const).forEach((level) => {
      const style = activeBrand.headingStyles[level];
      editorElement.style.setProperty(
        `--brand-heading-h${level}-number-color`,
        brandColors[style.numberColor],
      );
      editorElement.style.setProperty(
        `--brand-heading-h${level}-number-weight`,
        String(style.numberFontWeight),
      );
      editorElement.style.setProperty(
        `--brand-heading-h${level}-text-color`,
        brandColors[style.textColor],
      );
      editorElement.style.setProperty(
        `--brand-heading-h${level}-text-weight`,
        String(style.textFontWeight),
      );
    });
    let measurementCancelled = false;
    const measureNumberWidths = () => {
      if (measurementCancelled) return;
      const measure = (
        sample: string,
        fontSize: string,
        fontWeight: number,
      ) => {
        const probe = document.createElement('span');
        probe.textContent = sample;
        probe.style.position = 'fixed';
        probe.style.visibility = 'hidden';
        probe.style.pointerEvents = 'none';
        probe.style.whiteSpace = 'nowrap';
        probe.style.fontFamily = activeBrand.fontFamily;
        probe.style.fontSize = fontSize;
        probe.style.fontWeight = String(fontWeight);
        document.body.appendChild(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return Math.max(1, width);
      };
      const taskFormat = activeBrand.instructionNumberFormat;
      const editorStyles = getComputedStyle(editorElement);
      const bodyFontSize = editorStyles
        .getPropertyValue('--custom-block-body-font-size')
        .trim() || '0.875rem';
      const headingOneFontSize = editorStyles
        .getPropertyValue('--custom-block-heading-h1-font-size')
        .trim() || '1.5rem';
      const taskSample = taskFormat === 'upper-alpha'
        ? 'A'
        : taskFormat === 'lower-alpha'
          ? 'a'
          : taskFormat === 'decimal-leading-zero'
            ? '00'
            : '0';
      editorElement.style.setProperty(
        '--brand-task-number-measured-width',
        `${measure(
          taskSample,
          bodyFontSize,
          activeBrand.instructionNumberFontWeight,
        )}px`,
      );
      if (activeBrand.fixedHeadingNumberWidth) {
        const levelOneFormat = activeBrand.headingNumberFormats[1];
        const headingSample = levelOneFormat === 'upper-alpha'
          ? 'A'
          : levelOneFormat === 'lower-alpha'
            ? 'a'
            : '0';
        editorElement.style.setProperty(
          '--brand-heading-fixed-number-width',
          `${measure(
            headingSample,
            headingOneFontSize,
            activeBrand.headingStyles[1].numberFontWeight,
          )}px`,
        );
      }
    };
    measureNumberWidths();
    void document.fonts.ready.then(measureNumberWidths);
    editor.commands.setCustomBlockNumberingBrand({
      instructionNumberFormat: activeBrand.instructionNumberFormat,
      headingNumberFormats: activeBrand.headingNumberFormats,
    });
    editor.commands.setFooter(documentFooter(activeBrand, worksheetId));
    return () => {
      measurementCancelled = true;
    };
  }, [activeBrand, brandProfileId, editor, selectedBrandProfile, worksheetId]);

  useEffect(() => {
    if (!editor) return;
    const editorElement = editor.view.dom;
    let outerFrame = 0;
    let innerFrame = 0;

    const applySectionPageNumbers = () => {
      const footers = Array.from(
        editorElement.querySelectorAll<HTMLElement>('.tiptap-page-footer'),
      );
      if (!footers.length) return;

      const pagesStorage = editor.storage.pages as {
        getPageForPosition?: (pos: number) => number;
      };
      const restartPages: number[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (
          node.type.name === 'pageBreak'
          && node.attrs.restartPagination === true
        ) {
          const nextPosition = Math.min(
            editor.state.doc.content.size,
            pos + node.nodeSize,
          );
          const page = pagesStorage.getPageForPosition?.(nextPosition);
          if (page && page > 1 && page <= footers.length) {
            restartPages.push(page);
          }
          return false;
        }
        return true;
      });

      const sectionStarts = Array.from(new Set([1, ...restartPages]))
        .sort((left, right) => left - right);
      footers.forEach((footer, index) => {
        const physicalPage = index + 1;
        const sectionIndex = sectionStarts.findLastIndex(
          (start) => start <= physicalPage,
        );
        const sectionStart = sectionStarts[Math.max(0, sectionIndex)] ?? 1;
        const nextSectionStart = sectionStarts[sectionIndex + 1];
        const sectionEnd = nextSectionStart
          ? nextSectionStart - 1
          : footers.length;
        const displayedPage = physicalPage - sectionStart + 1;
        const sectionTotal = sectionEnd - sectionStart + 1;
        const pageLabel = footer.querySelector<HTMLElement>('p:nth-child(2)');
        const label = `${displayedPage}/${sectionTotal}`;
        if (pageLabel && pageLabel.textContent !== label) {
          pageLabel.textContent = label;
        }
      });
    };

    const schedulePageNumbers = () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
      outerFrame = requestAnimationFrame(() => {
        innerFrame = requestAnimationFrame(applySectionPageNumbers);
      });
    };
    const observer = new MutationObserver(schedulePageNumbers);
    observer.observe(editorElement, { childList: true, subtree: true });
    editor.on('update', schedulePageNumbers);
    schedulePageNumbers();

    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
      observer.disconnect();
      editor.off('update', schedulePageNumbers);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute(
      'data-show-solutions',
      String(showSolutions),
    );
  }, [editor, showSolutions]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute(
      'data-worksheet-language',
      documentContext.worksheetLanguage,
    );
  }, [documentContext.worksheetLanguage, editor]);

  useEffect(() => {
    const loadContextProfiles = async () => {
      try {
        const response = await fetch('/api/context-profiles', {
          cache: 'no-store',
        });
        const result = await response.json() as {
          profiles?: ContextProfile[];
        };
        if (response.ok) setContextProfiles(result.profiles ?? []);
      } catch {
        // Context profiles are optional; worksheet editing remains available.
      }
    };
    void loadContextProfiles();
  }, []);

  useEffect(() => {
    if (!editor || worksheetInitializationStartedRef.current) return;
    worksheetInitializationStartedRef.current = true;

    const initializeWorksheet = async () => {
      try {
        const existingWorksheetId = worksheetIdRef.current;
        const legacyContent = localStorage.getItem(STORAGE_KEY) ?? editor.getHTML();
        const response = existingWorksheetId
          ? await fetch(
              `/api/worksheets?id=${encodeURIComponent(existingWorksheetId)}`,
            )
          : await fetch('/api/worksheets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: 'Untitled Worksheet',
                contentHtml: legacyContent,
                documentSize: docSize,
                status: 'draft',
              }),
            });
        const result = await response.json() as {
          worksheet?: {
            id: string;
            title: string;
            contentHtml: string;
            documentSize: string;
            brandProfileId: string | null;
            folderId: string | null;
            showSolutions: boolean;
            context?: Partial<WorksheetContext>;
          };
          error?: string;
        };
        if (!response.ok || !result.worksheet) {
          throw new Error(result.error ?? 'Could not load worksheet.');
        }

        setWorksheetId(result.worksheet.id);
        if (!existingWorksheetId || existingWorksheetId !== result.worksheet.id) {
          worksheetIdRef.current = result.worksheet.id;
          const url = new URL(window.location.href);
          url.searchParams.set('worksheet', result.worksheet.id);
          window.history.replaceState({}, '', url);
          localStorage.removeItem(STORAGE_KEY);
        }
        setWorksheetTitle(result.worksheet.title);
        setDocSize(result.worksheet.documentSize);
        setBrandProfileId(result.worksheet.brandProfileId);
        setWorksheetFolderId(result.worksheet.folderId);
        setShowSolutions(result.worksheet.showSolutions);
        setDocumentContext({
          ...EMPTY_WORKSHEET_CONTEXT,
          ...result.worksheet.context,
        });
        if (existingWorksheetId) {
          editor.commands.setContent(result.worksheet.contentHtml || '');
        }
        const size = DOC_SIZES.find(({ id }) => id === result.worksheet?.documentSize);
        if (size) editor.commands.setPageFormat(size.format());
        setSaved(true);
        const publicationResponse = await fetch(
          `/api/dazit/status?worksheetId=${encodeURIComponent(result.worksheet.id)}`,
        );
        if (publicationResponse.ok) {
          const publicationResult = await publicationResponse.json() as {
            status?: 'unpublished' | 'current' | 'outdated';
          };
          if (publicationResult.status) {
            setPublicationStatus(publicationResult.status);
          }
        }
      } catch (loadError) {
        worksheetInitializationStartedRef.current = false;
        setExportError(loadError instanceof Error
          ? loadError.message
          : 'Could not load worksheet.');
      }
    };

    void initializeWorksheet();
    return () => {
      if (worksheetSaveTimerRef.current) clearTimeout(worksheetSaveTimerRef.current);
      if (worksheetTitleSaveTimerRef.current) {
        clearTimeout(worksheetTitleSaveTimerRef.current);
      }
      if (worksheetPreviewTimerRef.current) {
        clearTimeout(worksheetPreviewTimerRef.current);
      }
      if (contextSaveTimerRef.current) clearTimeout(contextSaveTimerRef.current);
    };
  }, [docSize, editor]);

  useEffect(() => {
    const worksheetId = worksheetIdRef.current;
    if (!editor || !worksheetId || !worksheetInitializationStartedRef.current) {
      return;
    }
    if (worksheetPreviewTimerRef.current) {
      clearTimeout(worksheetPreviewTimerRef.current);
    }
    worksheetPreviewTimerRef.current = setTimeout(() => {
      void generateWorksheetPreview(editor, worksheetId);
    }, 1600);
    return () => {
      if (worksheetPreviewTimerRef.current) {
        clearTimeout(worksheetPreviewTimerRef.current);
      }
    };
  }, [brandProfileId, docSize, editor, showSolutions]);

  useEffect(() => {
    const automationMode = typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('automation');
    if (
      (
        automationMode !== 'batch-publish'
        && automationMode !== 'batch-full-publish'
        && automationMode !== 'batch-preview'
      )
      || automationPublishStartedRef.current
      || !editor
      || !worksheetId
      || !saved
      || !brandProfilesLoaded
      || publishingPDF
    ) return;
    automationPublishStartedRef.current = true;
    const timer = window.setTimeout(async () => {
      try {
        await generateWorksheetPreview(editor, worksheetId, true);
      } catch (error) {
        const message = error instanceof Error
          ? error.message
          : 'Worksheet preview generation failed.';
        setExportError(message);
        if (window.parent !== window) {
          window.parent.postMessage({ type: 'eduit-automation-item-complete', worksheetId, success: false, error: message }, window.location.origin);
        }
        automationPublishStartedRef.current = false;
        return;
      }
      if (
        automationMode === 'batch-publish'
        || automationMode === 'batch-full-publish'
      ) {
        const published = await publishPDF(
          automationMode === 'batch-full-publish' ? 'full' : undefined,
        );
        if (!published) {
          if (window.parent !== window) {
            window.parent.postMessage({
              type: 'eduit-automation-item-complete',
              worksheetId,
              success: false,
              error: automationPublishErrorRef.current || 'Dazit publishing failed.',
            }, window.location.origin);
          }
          automationPublishStartedRef.current = false;
          return;
        }
      }
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'eduit-automation-item-complete', worksheetId, success: true }, window.location.origin);
        return;
      }
      const queue = JSON.parse(
        sessionStorage.getItem('eduit-automation-publish-queue') || '[]',
      ) as string[];
      const remaining = queue.filter((id) => id !== worksheetId);
      sessionStorage.setItem('eduit-automation-publish-queue', JSON.stringify(remaining));
      window.location.href = remaining.length
        ? `/editor?worksheet=${encodeURIComponent(remaining[0])}&automation=${automationMode}`
        : '/automations?completed=1';
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [brandProfilesLoaded, editor, publishingPDF, saved, worksheetId]);

  if (!editor) return null;

  const fillInTheBlankAnswers = selectedFillInTheBlankAttrs
    ? parseFillInTheBlankText(
        selectedFillInTheBlankAttrs.text,
        selectedFillInTheBlankAttrs.widthFactor,
      ).filter(
        (part) => part.type === 'blank',
      )
    : [];

  const updateGlossaryTerms = (terms: GlossaryTerm[]) => {
    if (selectedGlossaryTermsPos === null) return;
    setGlossaryTermsAttr(editor, selectedGlossaryTermsPos, 'terms', terms);
  };

  const updateGlossaryTerm = (id: string, patch: Partial<GlossaryTerm>) => {
    if (!selectedGlossaryTermsAttrs) return;
    updateGlossaryTerms(
      selectedGlossaryTermsAttrs.terms.map((term) => (
        term.id === id ? { ...term, ...patch } : term
      )),
    );
  };

  const addGlossaryTerm = () => {
    if (!selectedGlossaryTermsAttrs) return;
    const index = selectedGlossaryTermsAttrs.terms.length + 1;
    updateGlossaryTerms([
      ...selectedGlossaryTermsAttrs.terms,
      {
        id: `term-${Date.now()}`,
        term: `Term ${index}`,
        definition: 'Definition',
        example: 'Example',
      },
    ]);
  };

  const updateFrayerQuadrant = (
    id: FrayerQuadrant['id'],
    patch: Partial<FrayerQuadrant>,
  ) => {
    if (!selectedFrayerModelAttrs || selectedFrayerModelPos === null) return;
    setFrayerModelAttr(
      editor,
      selectedFrayerModelPos,
      'quadrants',
      selectedFrayerModelAttrs.quadrants.map((quadrant) => (
        quadrant.id === id ? { ...quadrant, ...patch } : quadrant
      )),
    );
  };

  const updateOrderingItems = (items: OrderingItem[]) => {
    if (selectedOrderingPos === null) return;
    setOrderingAttr(editor, selectedOrderingPos, 'items', items);
  };

  const updateOrderingItem = (id: string, text: string) => {
    if (!selectedOrderingAttrs) return;
    updateOrderingItems(selectedOrderingAttrs.items.map((item) => (
      item.id === id ? { ...item, text } : item
    )));
  };

  const moveOrderingItem = (index: number, direction: -1 | 1) => {
    if (!selectedOrderingAttrs) return;
    const target = index + direction;
    if (target < 0 || target >= selectedOrderingAttrs.items.length) return;
    const items = [...selectedOrderingAttrs.items];
    [items[index], items[target]] = [items[target], items[index]];
    updateOrderingItems(items);
  };

  const updateSuccessCriteria = (criteria: SuccessCriterion[]) => {
    if (selectedLearningObjectivePos === null) return;
    setLearningObjectiveAttr(
      editor,
      selectedLearningObjectivePos,
      'successCriteria',
      criteria,
    );
  };

  const updateSuccessCriterion = (id: string, text: string) => {
    if (!selectedLearningObjectiveAttrs) return;
    updateSuccessCriteria(
      selectedLearningObjectiveAttrs.successCriteria.map((criterion) => (
        criterion.id === id ? { ...criterion, text } : criterion
      )),
    );
  };

  const moveSuccessCriterion = (index: number, direction: -1 | 1) => {
    if (!selectedLearningObjectiveAttrs) return;
    const target = index + direction;
    if (
      target < 0
      || target >= selectedLearningObjectiveAttrs.successCriteria.length
    ) return;
    const criteria = [...selectedLearningObjectiveAttrs.successCriteria];
    [criteria[index], criteria[target]] = [criteria[target], criteria[index]];
    updateSuccessCriteria(criteria);
  };

  const updateDialogueItems = (items: DialogueItem[]) => {
    if (selectedDialoguePos === null) return;
    setDialogueAttr(editor, selectedDialoguePos, 'items', items);
  };

  const updateDialogueItem = (id: string, patch: Partial<DialogueItem>) => {
    if (!selectedDialogueAttrs) return;
    updateDialogueItems(
      selectedDialogueAttrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    );
  };

  const addDialogueItem = () => {
    if (!selectedDialogueAttrs) return;
    const index = selectedDialogueAttrs.items.length;
    updateDialogueItems([
      ...selectedDialogueAttrs.items,
      {
        id: `dialogue-${Date.now()}`,
        speaker: ((index % 4) + 1) as DialogueSpeaker,
        text: 'Enter dialogue text',
      },
    ]);
  };

  const updateRewriteSentenceItems = (items: RewriteSentenceItem[]) => {
    if (selectedRewriteSentencesPos === null) return;
    setRewriteSentencesAttr(editor, selectedRewriteSentencesPos, 'items', items);
  };

  const updateRewriteSentenceItem = (
    id: string,
    patch: Partial<RewriteSentenceItem>,
  ) => {
    if (!selectedRewriteSentencesAttrs) return;
    updateRewriteSentenceItems(
      selectedRewriteSentencesAttrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    );
  };

  const addRewriteSentenceItem = () => {
    if (!selectedRewriteSentencesAttrs) return;
    updateRewriteSentenceItems([
      ...selectedRewriteSentencesAttrs.items,
      {
        id: `rewrite-${Date.now()}`,
        input: 'Enter the sentence to rewrite',
        solution: 'Enter the correct sentence',
      },
    ]);
  };

  const selectRewriteSentenceImage = (image: { src: string; alt: string }) => {
    if (!rewriteImageItemId) return;
    updateRewriteSentenceItem(rewriteImageItemId, { image });
    setRewriteImageItemId(null);
  };

  const updateSortingCategories = (categories: SortingCategory[]) => {
    if (selectedSortingCategoriesPos === null || !selectedSortingCategoriesAttrs) return;
    setSortingCategoriesAttr(
      editor,
      selectedSortingCategoriesPos,
      'categories',
      categories,
    );
    const categoryIds = new Set(categories.map(({ id }) => id));
    if (selectedSortingCategoriesAttrs.items.some(
      ({ categoryId }) => !categoryIds.has(categoryId),
    )) {
      setSortingCategoriesAttr(
        editor,
        selectedSortingCategoriesPos,
        'items',
        selectedSortingCategoriesAttrs.items.map((item) => ({
          ...item,
          categoryId: categoryIds.has(item.categoryId)
            ? item.categoryId
            : categories[0]?.id ?? '',
        })),
      );
    }
  };

  const updateSortingCategory = (id: string, patch: Partial<SortingCategory>) => {
    if (!selectedSortingCategoriesAttrs) return;
    updateSortingCategories(
      selectedSortingCategoriesAttrs.categories.map((category) => (
        category.id === id ? { ...category, ...patch } : category
      )),
    );
  };

  const addSortingCategory = () => {
    if (
      !selectedSortingCategoriesAttrs
      || selectedSortingCategoriesAttrs.categories.length >= 4
    ) return;
    const index = selectedSortingCategoriesAttrs.categories.length + 1;
    updateSortingCategories([
      ...selectedSortingCategoriesAttrs.categories,
      { id: `category-${Date.now()}`, title: `Category ${index}` },
    ]);
  };

  const updateSortingCategoryItems = (items: SortingCategoryItem[]) => {
    if (selectedSortingCategoriesPos === null) return;
    setSortingCategoriesAttr(editor, selectedSortingCategoriesPos, 'items', items);
  };

  const updateSortingCategoryItem = (
    id: string,
    patch: Partial<SortingCategoryItem>,
  ) => {
    if (!selectedSortingCategoriesAttrs) return;
    updateSortingCategoryItems(
      selectedSortingCategoriesAttrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    );
  };

  const addSortingCategoryItem = (categoryId: string) => {
    if (!selectedSortingCategoriesAttrs) return;
    const index = selectedSortingCategoriesAttrs.items.length + 1;
    updateSortingCategoryItems([
      ...selectedSortingCategoriesAttrs.items,
      {
        id: `sorting-item-${Date.now()}`,
        text: `Item ${index}`,
        categoryId,
      },
    ]);
  };

  const updateWordGridWords = (words: string[]) => {
    if (selectedWordGridPos === null) return;
    setWordGridAttr(editor, selectedWordGridPos, 'words', words);
  };

  const updateWordGridWord = (index: number, word: string) => {
    if (!selectedWordGridAttrs) return;
    updateWordGridWords(
      selectedWordGridAttrs.words.map((currentWord, wordIndex) => (
        wordIndex === index ? word : currentWord
      )),
    );
  };

  const updateWordGridDirection = (
    direction: WordGridDirection,
    enabled: boolean,
  ) => {
    if (!selectedWordGridAttrs || selectedWordGridPos === null) return;
    const directions = {
      ...selectedWordGridAttrs.directions,
      [direction]: enabled,
    };
    if (!Object.values(directions).some(Boolean)) return;
    setWordGridAttr(editor, selectedWordGridPos, 'directions', directions);
  };

  const updateChooseCorrectWordItems = (items: ChooseCorrectWordItem[]) => {
    if (selectedChooseCorrectWordsPos === null) return;
    setChooseCorrectWordsAttr(
      editor,
      selectedChooseCorrectWordsPos,
      'items',
      items,
    );
  };

  const updateChooseCorrectWordItem = (
    id: string,
    patch: Partial<ChooseCorrectWordItem>,
  ) => {
    if (!selectedChooseCorrectWordsAttrs) return;
    updateChooseCorrectWordItems(
      selectedChooseCorrectWordsAttrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    );
  };

  const updateInlineChoiceItems = (items: InlineChoiceItem[]) => {
    if (selectedInlineChoicePos === null) return;
    setInlineChoiceAttr(editor, selectedInlineChoicePos, 'items', items);
  };

  const updateInlineChoiceSentence = (id: string, text: string) => {
    if (!selectedInlineChoiceAttrs) return;
    updateInlineChoiceItems(
      selectedInlineChoiceAttrs.items.map((item) => (
        item.id === id && item.type === 'sentence'
          ? { ...item, text }
          : item
      )),
    );
  };

  const moveInlineChoiceItem = (itemIndex: number, direction: -1 | 1) => {
    if (!selectedInlineChoiceAttrs) return;
    const targetIndex = itemIndex + direction;
    if (
      targetIndex < 0
      || targetIndex >= selectedInlineChoiceAttrs.items.length
    ) return;
    const items = [...selectedInlineChoiceAttrs.items];
    [items[itemIndex], items[targetIndex]] = [
      items[targetIndex],
      items[itemIndex],
    ];
    updateInlineChoiceItems(items);
  };

  const updateMiniFormFields = (fields: MiniFormField[]) => {
    if (selectedMiniFormPos === null) return;
    setMiniFormAttr(editor, selectedMiniFormPos, 'fields', fields);
  };

  const updateMiniFormItems = (items: MiniFormItem[]) => {
    if (selectedMiniFormPos === null) return;
    setMiniFormAttr(editor, selectedMiniFormPos, 'items', items);
  };

  const updateMiniFormItem = (
    id: string,
    patch: Partial<MiniFormItem>,
  ) => {
    if (!selectedMiniFormAttrs) return;
    updateMiniFormItems(
      selectedMiniFormAttrs.items.map((item) => (
        item.id === id ? { ...item, ...patch } : item
      )),
    );
  };

  const updateMiniFormValue = (
    itemId: string,
    fieldId: string,
    value: string,
  ) => {
    if (!selectedMiniFormAttrs) return;
    updateMiniFormItems(
      selectedMiniFormAttrs.items.map((item) => (
        item.id === itemId
          ? {
              ...item,
              values: { ...item.values, [fieldId]: value },
            }
          : item
      )),
    );
  };

  const moveMiniFormItem = (itemIndex: number, direction: -1 | 1) => {
    if (!selectedMiniFormAttrs) return;
    const targetIndex = itemIndex + direction;
    if (targetIndex < 0 || targetIndex >= selectedMiniFormAttrs.items.length) {
      return;
    }
    const items = [...selectedMiniFormAttrs.items];
    [items[itemIndex], items[targetIndex]] = [
      items[targetIndex],
      items[itemIndex],
    ];
    updateMiniFormItems(items);
  };

  const selectMiniFormImage = (image: { src: string; alt: string }) => {
    if (!miniFormImageItemId) return;
    updateMiniFormItem(miniFormImageItemId, { image });
    setMiniFormImageItemId(null);
  };

  const updateWorksheetTableColumns = (columns: WorksheetTableColumn[]) => {
    if (selectedWorksheetTablePos === null) return;
    setWorksheetTableAttr(
      editor,
      selectedWorksheetTablePos,
      'columns',
      normalizedTableColumns(columns),
    );
  };

  const updateWorksheetTableColumnSpan = (
    columnId: string,
    requestedSpan: number,
  ) => {
    if (!selectedWorksheetTableAttrs) return;
    const columns = selectedWorksheetTableAttrs.columns;
    if (columns.length === 1) {
      updateWorksheetTableColumns([{ ...columns[0], span: 12 }]);
      return;
    }

    const columnIndex = columns.findIndex(({ id }) => id === columnId);
    if (columnIndex < 0) return;
    const neighbourIndex = columnIndex < columns.length - 1
      ? columnIndex + 1
      : columnIndex - 1;
    const currentSpan = worksheetTableColumnSpan(columns[columnIndex]);
    const neighbourSpan = worksheetTableColumnSpan(columns[neighbourIndex]);
    const span = Math.min(
      currentSpan + neighbourSpan - 1,
      Math.max(1, Math.round(requestedSpan)),
    );
    const spanDelta = span - currentSpan;

    updateWorksheetTableColumns(columns.map((column, index) => {
      if (index === columnIndex) return { ...column, span };
      if (index === neighbourIndex) {
        return { ...column, span: neighbourSpan - spanDelta };
      }
      return column;
    }));
  };

  const updateWorksheetTableRows = (rows: WorksheetTableRow[]) => {
    if (selectedWorksheetTablePos === null) return;
    setWorksheetTableAttr(editor, selectedWorksheetTablePos, 'rows', rows);
  };

  const updateWorksheetTableCell = (
    rowId: string,
    columnId: string,
    value: string,
  ) => {
    if (!selectedWorksheetTableAttrs) return;
    updateWorksheetTableRows(
      selectedWorksheetTableAttrs.rows.map((row) => (
        row.id === rowId
          ? { ...row, cells: { ...row.cells, [columnId]: value } }
          : row
      )),
    );
  };

  const moveWorksheetTableRow = (rowIndex: number, direction: -1 | 1) => {
    if (!selectedWorksheetTableAttrs) return;
    const targetIndex = rowIndex + direction;
    if (
      targetIndex < 0
      || targetIndex >= selectedWorksheetTableAttrs.rows.length
    ) return;
    const rows = [...selectedWorksheetTableAttrs.rows];
    [rows[rowIndex], rows[targetIndex]] = [rows[targetIndex], rows[rowIndex]];
    updateWorksheetTableRows(rows);
  };

  const updateMCQOption = (id: string, patch: Partial<MCQOption>) => {
    if (selectedMCQPos === null || !selectedMCQQuestion) return;
    const options = patch.correct && selectedMCQQuestion.answerMode === 'single'
      ? selectedMCQQuestion.options.map((option) => ({
          ...option,
          correct: option.id === id,
          ...(option.id === id ? patch : {}),
        }))
      : selectedMCQQuestion.options.map((option) => option.id === id ? { ...option, ...patch } : option);
    setNodeAttr(
      editor,
      selectedMCQPos,
      'questions',
      selectedMCQQuestions.map((question, index) => (
        index === 0 ? { ...question, options } : question
      )),
    );
  };

  const updateMCQAnswerMode = (answerMode: MCQAnswerMode) => {
    if (selectedMCQPos === null || !selectedMCQQuestion) return;
    let foundCorrect = false;
    const options = answerMode === 'single'
      ? selectedMCQQuestion.options.map((option) => {
          if (!option.correct || foundCorrect) return { ...option, correct: false };
          foundCorrect = true;
          return option;
        })
      : selectedMCQQuestion.options;
    setNodeAttr(editor, selectedMCQPos, 'questions', selectedMCQQuestions.map(
      (question, index) => index === 0
        ? { ...question, answerMode, options }
        : question,
    ));
  };

  const addMCQOption = () => {
    if (selectedMCQPos === null || !selectedMCQQuestion) return;
    const index = selectedMCQQuestion.options.length;
    setNodeAttr(editor, selectedMCQPos, 'questions', selectedMCQQuestions.map(
      (question, questionIndex) => questionIndex === 0 ? {
        ...question,
        options: [...question.options, {
          id: `option-${Date.now()}`,
          text: `Option ${String.fromCharCode(65 + index)}`,
          correct: false,
        }],
      } : question,
    ));
  };

  const updateMCMRows = (rows: MCMRow[]) => {
    if (selectedMCMPos === null) return;
    setMCMAttr(editor, selectedMCMPos, 'rows', rows);
  };

  const updateMCMRow = (rowId: string, patch: Partial<MCMRow>) => {
    if (!selectedMCMAttrs) return;
    updateMCMRows(
      selectedMCMAttrs.rows.map((row) => row.id === rowId ? { ...row, ...patch } : row),
    );
  };

  const updateMCMOption = (
    rowId: string,
    optionId: string,
    patch: Partial<MCMOption>,
  ) => {
    if (!selectedMCMAttrs) return;
    updateMCMRows(selectedMCMAttrs.rows.map((row) => {
      if (row.id !== rowId) return row;
      return {
        ...row,
        options: patch.correct
          ? row.options.map((option) => ({
              ...option,
              correct: option.id === optionId,
              ...(option.id === optionId ? patch : {}),
            }))
          : row.options.map((option) => (
              option.id === optionId ? { ...option, ...patch } : option
            )),
      };
    }));
  };

  const addMCMRow = () => {
    if (!selectedMCMAttrs) return;
    const rowNumber = selectedMCMAttrs.rows.length + 1;
    const rowId = `row-${Date.now()}`;
    updateMCMRows([
      ...selectedMCMAttrs.rows,
      {
        id: rowId,
        text: `Statement / Question row ${String.fromCharCode(64 + rowNumber)}`,
        options: Array.from({ length: 3 }, (_, index) => ({
          id: `${rowId}-option-${index + 1}`,
          text: `Option ${String.fromCharCode(65 + index)}`,
          correct: false,
        })),
      },
    ]);
  };

  const updateMCHRows = (rows: MCHRow[]) => {
    if (selectedMCHPos === null) return;
    setMCHAttr(editor, selectedMCHPos, 'rows', rows);
  };

  const updateMCHOptions = (options: MCHOption[]) => {
    if (selectedMCHPos === null || !selectedMCHAttrs) return;
    const optionIds = new Set(options.map(({ id }) => id));
    setMCHAttr(editor, selectedMCHPos, 'options', options);
    const hasRemovedCorrectOption = selectedMCHAttrs.rows.some(
      (row) => row.correctOptionId && !optionIds.has(row.correctOptionId),
    );
    if (hasRemovedCorrectOption) {
      setMCHAttr(
        editor,
        selectedMCHPos,
        'rows',
        selectedMCHAttrs.rows.map((row) => ({
          ...row,
          correctOptionId: row.correctOptionId && optionIds.has(row.correctOptionId)
            ? row.correctOptionId
            : null,
        })),
      );
    }
  };

  const updateMCHRow = (rowId: string, patch: Partial<MCHRow>) => {
    if (!selectedMCHAttrs) return;
    updateMCHRows(
      selectedMCHAttrs.rows.map((row) => row.id === rowId ? { ...row, ...patch } : row),
    );
  };

  const addMCHRow = () => {
    if (!selectedMCHAttrs) return;
    const rowNumber = selectedMCHAttrs.rows.length + 1;
    updateMCHRows([
      ...selectedMCHAttrs.rows,
      {
        id: `row-${Date.now()}`,
        text: `Answer row ${rowNumber}`,
        correctOptionId: null,
      },
    ]);
  };

  const updateMatchingPairs = (pairs: MatchingPair[]) => {
    if (selectedMatchingPairsPos === null || !selectedMatchingPairsAttrs) return;
    setMatchingPairsAttr(editor, selectedMatchingPairsPos, 'pairs', pairs);
    const pairIds = new Set(pairs.map(({ id }) => id));
    const nextRightOrder = [
      ...selectedMatchingPairsAttrs.rightOrder.filter((id) => pairIds.has(id)),
      ...pairs.map(({ id }) => id).filter(
        (id) => !selectedMatchingPairsAttrs.rightOrder.includes(id),
      ),
    ];
    if (
      nextRightOrder.length !== selectedMatchingPairsAttrs.rightOrder.length
      || nextRightOrder.some(
        (id, index) => id !== selectedMatchingPairsAttrs.rightOrder[index],
      )
    ) {
      setMatchingPairsAttr(
        editor,
        selectedMatchingPairsPos,
        'rightOrder',
        nextRightOrder,
      );
    }
  };

  const updateMatchingPair = (pairId: string, patch: Partial<MatchingPair>) => {
    if (!selectedMatchingPairsAttrs) return;
    updateMatchingPairs(
      selectedMatchingPairsAttrs.pairs.map((pair) => (
        pair.id === pairId ? { ...pair, ...patch } : pair
      )),
    );
  };

  const addMatchingPair = () => {
    if (!selectedMatchingPairsAttrs) return;
    const pairNumber = selectedMatchingPairsAttrs.pairs.length + 1;
    updateMatchingPairs([
      ...selectedMatchingPairsAttrs.pairs,
      {
        id: `pair-${Date.now()}`,
        left: `Item ${pairNumber}`,
        right: `Match ${pairNumber}`,
      },
    ]);
  };

  const shuffleMatchingPairs = () => {
    if (selectedMatchingPairsPos === null || !selectedMatchingPairsAttrs) return;
    const nextOrder = [...selectedMatchingPairsAttrs.rightOrder];
    for (let index = nextOrder.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [nextOrder[index], nextOrder[target]] = [nextOrder[target], nextOrder[index]];
    }
    setMatchingPairsAttr(
      editor,
      selectedMatchingPairsPos,
      'rightOrder',
      nextOrder,
    );
  };

  const updateTrueFalseRows = (rows: TrueFalseRow[]) => {
    if (selectedTrueFalsePos === null) return;
    setTrueFalseAttr(editor, selectedTrueFalsePos, 'rows', rows);
  };

  const updateTrueFalseRow = (
    rowId: string,
    patch: Partial<TrueFalseRow>,
  ) => {
    if (!selectedTrueFalseAttrs) return;
    updateTrueFalseRows(
      selectedTrueFalseAttrs.rows.map((row) => (
        row.id === rowId ? { ...row, ...patch } : row
      )),
    );
  };

  const addTrueFalseRow = () => {
    if (!selectedTrueFalseAttrs) return;
    const rowNumber = selectedTrueFalseAttrs.rows.length + 1;
    updateTrueFalseRows([
      ...selectedTrueFalseAttrs.rows,
      {
        id: `row-${Date.now()}`,
        text: `Statement ${rowNumber}`,
        correctValue: null,
      },
    ]);
  };

  const updateTrueFalseShowNa = (showNa: boolean) => {
    if (selectedTrueFalsePos === null || !selectedTrueFalseAttrs) return;
    setTrueFalseAttr(editor, selectedTrueFalsePos, 'showNa', showNa);
    if (!showNa && selectedTrueFalseAttrs.rows.some(
      ({ correctValue }) => correctValue === 'na',
    )) {
      setTrueFalseAttr(
        editor,
        selectedTrueFalsePos,
        'rows',
        selectedTrueFalseAttrs.rows.map((row) => ({
          ...row,
          correctValue: row.correctValue === 'na' ? null : row.correctValue,
        })),
      );
    }
  };

  const handleDocSize = (id: string) => {
    setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
    setDocSize(id);
    const size = DOC_SIZES.find((s) => s.id === id);
    if (size) editor.commands.setPageFormat(size.format());
    if (worksheetIdRef.current) {
      setSaved(false);
      void fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheetIdRef.current,
          worksheet: { documentSize: id },
        }),
      }).then((response) => setSaved(response.ok)).catch(() => setSaved(false));
    }
  };

  const handleWorksheetTitleChange = (value: string) => {
    setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
    setWorksheetTitle(value);
    const worksheetId = worksheetIdRef.current;
    if (!worksheetId) return;

    setSaved(false);
    if (worksheetTitleSaveTimerRef.current) {
      clearTimeout(worksheetTitleSaveTimerRef.current);
    }
    const title = value.trim();
    if (!title) return;

    worksheetTitleSaveTimerRef.current = setTimeout(async () => {
      try {
        const response = await fetch('/api/worksheets', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: worksheetId,
            worksheet: { title },
          }),
        });
        setSaved(response.ok);
      } catch {
        setSaved(false);
      }
    }, 500);
  };

  const updateDocumentContext = (patch: Partial<WorksheetContext>) => {
    setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
    setDocumentContext((current) => {
      const next = { ...current, ...patch };
      const worksheetId = worksheetIdRef.current;
      if (worksheetId) {
        setSaved(false);
        if (contextSaveTimerRef.current) {
          clearTimeout(contextSaveTimerRef.current);
        }
        contextSaveTimerRef.current = setTimeout(async () => {
          try {
            const response = await fetch('/api/worksheets', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: worksheetId,
                worksheet: { context: next },
              }),
            });
            setSaved(response.ok);
          } catch {
            setSaved(false);
          }
        }, 500);
      }
      return next;
    });
  };

  const uploadContextPdf = async (file: File) => {
    if (!file.name.toLocaleLowerCase().endsWith('.pdf')) {
      setContextPdfError('Choose a PDF file.');
      return;
    }
    setUploadingContextPdf(true);
    setContextPdfError('');
    try {
      const formData = new FormData();
      formData.set('file', file);
      const response = await fetch('/api/ai/context-pdf', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json() as {
        name?: string;
        pageCount?: number;
        text?: string;
        truncated?: boolean;
        error?: string;
      };
      if (!response.ok || !result.name || !result.text) {
        throw new Error(result.error ?? 'Could not read the PDF.');
      }
      updateDocumentContext({
        contextPdfName: result.name,
        contextPdfText: result.text,
        contextPdfPageCount: result.pageCount ?? null,
      });
      if (result.truncated) {
        setContextPdfError(
          'The PDF was attached. Its extracted text exceeded the 1,000,000-character storage limit.',
        );
      }
    } catch (error) {
      setContextPdfError(
        error instanceof Error ? error.message : 'Could not read the PDF.',
      );
    } finally {
      setUploadingContextPdf(false);
      if (contextPdfInputRef.current) contextPdfInputRef.current.value = '';
    }
  };

  const removeContextPdf = () => {
    updateDocumentContext({
      contextPdfName: '',
      contextPdfText: '',
      contextPdfPageCount: null,
    });
    setContextPdfError('');
  };

  const loadDocumentContextProfile = (profileId: string) => {
    const profile = contextProfiles.find(({ id }) => id === profileId);
    if (!profile) return;
    const hasValues = Object.entries(documentContext).some(([key, value]) => (
      key !== 'sourceProfileId'
      && value !== ''
      && value !== null
    ));
    if (
      hasValues
      && !window.confirm(
        'Load this profile and replace the current worksheet context?',
      )
    ) return;
    updateDocumentContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...profile.context,
      sourceProfileId: profile.id,
      contextPdfName: documentContext.contextPdfName,
      contextPdfText: documentContext.contextPdfText,
      contextPdfPageCount: documentContext.contextPdfPageCount,
    });
  };

  const resetDocumentContextProfile = () => {
    const profile = contextProfiles.find(
      ({ id }) => id === documentContext.sourceProfileId,
    );
    if (!profile) return;
    if (!window.confirm('Discard worksheet overrides and reset this context?')) {
      return;
    }
    updateDocumentContext({
      ...EMPTY_WORKSHEET_CONTEXT,
      ...profile.context,
      sourceProfileId: profile.id,
      contextPdfName: documentContext.contextPdfName,
      contextPdfText: documentContext.contextPdfText,
      contextPdfPageCount: documentContext.contextPdfPageCount,
    });
  };

  const saveDocumentContextAsProfile = async () => {
    const name = window.prompt('Name this context profile:')?.trim();
    if (!name) return;
    const response = await fetch('/api/context-profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: `Created from worksheet “${worksheetTitle}”.`,
        context: {
          ...documentContext,
          sourceProfileId: null,
          contextPdfName: '',
          contextPdfText: '',
          contextPdfPageCount: null,
        },
      }),
    });
    const result = await response.json() as {
      profile?: ContextProfile;
      error?: string;
    };
    if (!response.ok || !result.profile) {
      setExportError(result.error ?? 'Could not save context profile.');
      return;
    }
    setContextProfiles((profiles) => [...profiles, result.profile!]);
    updateDocumentContext({ sourceProfileId: result.profile.id });
  };

  const clearDocumentContext = () => {
    if (!window.confirm('Clear all worksheet context values?')) return;
    updateDocumentContext({ ...EMPTY_WORKSHEET_CONTEXT });
  };

  const handleBrandProfile = async (id: string) => {
    setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
    const previousBrandProfileId = brandProfileId;
    const nextBrandProfileId = id || null;
    setBrandProfileId(nextBrandProfileId);
    const worksheetId = worksheetIdRef.current;
    if (!worksheetId) return;

    setSaved(false);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheetId,
          worksheet: { brandProfileId: nextBrandProfileId },
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? 'Could not save brand profile.');
      }
      setSaved(true);
    } catch (error) {
      setBrandProfileId(previousBrandProfileId);
      setSaved(false);
      setExportError(error instanceof Error ? error.message : 'Could not save brand profile.');
    }
  };

  const handleShowSolutions = async (value: boolean) => {
    setPublicationStatus((status) => status === 'current' ? 'outdated' : status);
    const previousValue = showSolutions;
    setShowSolutions(value);
    const worksheetId = worksheetIdRef.current;
    if (!worksheetId) return;

    setSaved(false);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheetId,
          worksheet: { showSolutions: value },
        }),
      });
      if (!response.ok) throw new Error('Could not save solution setting.');
      setSaved(true);
    } catch {
      setShowSolutions(previousValue);
      setSaved(false);
    }
  };

  const deleteSelectedPageBreak = () => {
    if (selectedPageBreakPos === null) return;
    editor
      .chain()
      .command(({ tr }) => {
        const node = tr.doc.nodeAt(selectedPageBreakPos);
        if (node?.type.name !== 'pageBreak') return false;
        tr.delete(
          selectedPageBreakPos,
          selectedPageBreakPos + node.nodeSize,
        );
        return true;
      })
      .run();
    setSelectedPageBreakPos(null);
  };

  const updateSelectedPageBreakRestartPagination = (value: boolean) => {
    if (selectedPageBreakPos === null) return;
    editor
      .chain()
      .command(({ tr }) => {
        const node = tr.doc.nodeAt(selectedPageBreakPos);
        if (node?.type.name !== 'pageBreak') return false;
        tr.setNodeAttribute(
          selectedPageBreakPos,
          'restartPagination',
          value,
        );
        return true;
      })
      .run();
  };

  const renderPDF = async () => {
    const editorElement = document.querySelector<HTMLElement>('.editor-content .tiptap');
    const appElement = document.querySelector<HTMLElement>('.editor-app');
    if (!editorElement || !appElement) throw new Error('The worksheet is not ready.');
    appElement.classList.add('pdf-exporting');

    try {
      await document.fonts.ready;
      const visitedStyleSheets = new Set<CSSStyleSheet>();
      const head = Array.from(document.styleSheets).map((styleSheet) => {
        try {
          const css = serializeStyleSheet(styleSheet, visitedStyleSheets)
            .replace(/<\/style/gi, '<\\/style');
          return `<style>${css}</style>`;
        } catch {
          return styleSheet.ownerNode instanceof HTMLElement
            ? styleSheet.ownerNode.outerHTML
            : '';
        }
      }).join('\n');
      const exportContent = editorElement.cloneNode(true) as HTMLElement;
      exportContent.querySelectorAll<HTMLElement>(
        '.ProseMirror-selectednode, .custom-block--selected, .heading-node--selected',
      ).forEach((element) => {
        element.classList.remove(
          'ProseMirror-selectednode',
          'custom-block--selected',
          'heading-node--selected',
        );
      });
      exportContent.querySelectorAll(
        '.rich-text-node__selection-fragment',
      ).forEach((element) => element.remove());
      await inlinePrivateMediaImages(exportContent);
      const pageCount = Math.max(
        1,
        exportContent.querySelectorAll('.tiptap-page-footer').length,
      );
      const exportPayload = {
        content: exportContent.outerHTML,
        head,
        docSize,
        pageCount,
      };
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? 'PDF export failed.');
      }

      return { pdf: await response.blob(), exportPayload };
    } finally {
      appElement.classList.remove('pdf-exporting');
    }
  };

  const exportPDF = async () => {
    setExportingPDF(true);
    setExportError(null);
    try {
      const { pdf: blob } = await renderPDF();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'eduit-document.pdf';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF export failed.');
    } finally {
      setExportingPDF(false);
    }
  };

  const publishPDF = async (modeOverride?: 'full' | 'pdf-only') => {
    const id = worksheetIdRef.current;
    if (!id || publishingPDF) return false;
    setPublishingPDF(true);
    automationPublishErrorRef.current = null;
    setExportError(null);
    setPublishSuccess(false);
    try {
      const { pdf, exportPayload } = await renderPDF();
      const thumbnailResponse = await fetch('/api/export/thumbnails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportPayload),
      });
      const thumbnailResult = await thumbnailResponse.json().catch(() => null) as {
        error?: string;
        thumbnails?: string[];
      } | null;
      if (!thumbnailResponse.ok || !thumbnailResult?.thumbnails?.length) {
        throw new Error(thumbnailResult?.error ?? 'Thumbnail generation failed.');
      }
      const slugBase = worksheetTitle.trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'worksheet';
      const rawLanguage = documentContext.contentLanguage
        || documentContext.worksheetLanguage
        || 'German';
      const language = /fr/i.test(rawLanguage) ? 'French'
        : /it/i.test(rawLanguage) ? 'Italian'
          : /en/i.test(rawLanguage) ? 'English'
            : 'German';
      const level = documentContext.languageLevel || documentContext.localLevel || 'Basic';
      const difficulty = /c1|c2|advanced/i.test(level) ? 'Advanced'
        : /b1|b2|intermediate/i.test(level) ? 'Intermediate'
          : 'Basic';
      const subject = documentContext.customSubject || documentContext.subject || 'Language';
      const metadata = {
        worksheetId: id,
        slug: `${slugBase}-${id.slice(0, 8)}`,
        title: worksheetTitle.trim() || 'Untitled Worksheet',
        description: documentContext.learnerContext
          || 'Druckfertiges Arbeitsblatt für den Unterricht.',
        subject,
        grade: documentContext.learnerStage || level,
        documentType: containsLearningCards ? 'Lernkarten' : dazitDocumentType,
        pages: exportPayload.pageCount,
        language,
        difficulty,
        hasAnswerKey: showSolutions,
        tags: [subject, language, level].filter(Boolean),
      };
      const formData = new FormData();
      formData.set('pdf', pdf, `${metadata.slug}.pdf`);
      formData.set(
        'mode',
        modeOverride
          ?? (publicationStatus === 'unpublished' ? 'full' : republishScope),
      );
      thumbnailResult.thumbnails.forEach((base64, index) => {
        const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
        formData.append(
          'thumbnails',
          new Blob([bytes], { type: 'image/webp' }),
          `page-${index + 1}.webp`,
        );
      });
      formData.set('metadata', JSON.stringify(metadata));
      const response = await fetch('/api/dazit/publish', { method: 'POST', body: formData });
      const result = await response.json().catch(() => null) as {
        error?: string;
        publicationStatus?: 'current' | 'outdated';
      } | null;
      if (!response.ok) throw new Error(result?.error ?? 'Publishing failed.');
      setExportError('Published to Dazit.');
      setPublishSuccess(true);
      setPublicationStatus(result?.publicationStatus ?? 'current');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Publishing failed.';
      automationPublishErrorRef.current = message;
      setExportError(message);
      return false;
    } finally {
      setPublishingPDF(false);
    }
  };

  const exportSelectedBlockPNG = async () => {
    if (!selectedCustomBlock || exportingBlockPNG) return;
    setExportingBlockPNG(true);
    setBlockExportError(null);

    try {
      const nodeDom = editor.view.nodeDOM(selectedCustomBlock.pos);
      if (!(nodeDom instanceof HTMLElement)) {
        throw new Error('The selected block could not be rendered.');
      }

      const clone = nodeDom.cloneNode(true) as HTMLElement;
      clone.classList.remove(
        'ProseMirror-selectednode',
        'custom-block--selected',
        'heading-node--selected',
      );
      clone.style.setProperty('margin', '0', 'important');
      clone.style.setProperty('margin-block', '0', 'important');
      const editorShell = editor.view.dom.cloneNode(false) as HTMLElement;
      editorShell.removeAttribute('contenteditable');
      editorShell.appendChild(clone);
      await inlinePrivateMediaImages(editorShell);

      const visitedStyleSheets = new Set<CSSStyleSheet>();
      const head = Array.from(document.styleSheets).map((styleSheet) => {
        try {
          const css = serializeStyleSheet(styleSheet, visitedStyleSheets)
            .replace(/<\/style/gi, '<\\/style');
          return `<style>${css}</style>`;
        } catch {
          return styleSheet.ownerNode instanceof HTMLElement
            ? styleSheet.ownerNode.outerHTML
            : '';
        }
      }).join('\n');
      const response = await fetch('/api/export/png', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editorShell.outerHTML,
          head,
          width: Math.ceil(nodeDom.getBoundingClientRect().width),
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as {
          error?: string;
        } | null;
        throw new Error(result?.error ?? 'PNG export failed.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const safeTitle = worksheetTitle
        .trim()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'worksheet';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${safeTitle}-${selectedCustomBlock.type}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setBlockExportError(
        error instanceof Error ? error.message : 'PNG export failed.',
      );
    } finally {
      setExportingBlockPNG(false);
    }
  };

  const duplicateCurrentWorksheet = async () => {
    if (!worksheetIdRef.current || duplicatingWorksheet) return;
    setDuplicatingWorksheet(true);
    setExportError(null);
    try {
      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t('documents.copyTitle', { title: worksheetTitle }),
          contentHtml: editor.getHTML(),
          documentSize: docSize,
          showSolutions,
          context: documentContext,
          status: 'draft',
          brandProfileId,
          folderId: worksheetFolderId,
        }),
      });
      const result = await response.json() as {
        worksheet?: { id: string };
        error?: string;
      };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? t('documents.duplicateError'));
      }
      window.location.href =
        `/editor?worksheet=${encodeURIComponent(result.worksheet.id)}`;
    } catch (error) {
      setExportError(error instanceof Error
        ? error.message
        : t('documents.duplicateError'));
      setDuplicatingWorksheet(false);
    }
  };

  const createAdditionalWorksheet = async (
    kind: 'word-grid' | 'fill-in-the-blank',
  ) => {
    if (!availableVerbTableVerbs.length || creatingAdditionalWorksheet) return;
    setCreatingAdditionalWorksheet(kind);
    setExportError(null);
    try {
      let contentHtml: string;
      if (kind === 'word-grid') {
        const words = availableVerbTableVerbs.map(({ infinitive }) => infinitive);
        const generation = Date.now();
        contentHtml = [
          generatedHeadingHtml(worksheetTitle),
          generatedWordGridHtml(words, true, generation),
          '<div data-restart-pagination="true" data-type="pageBreak"></div>',
          generatedHeadingHtml(worksheetTitle),
          generatedWordGridHtml(words, false, generation),
        ].join('');
      } else {
        const generationResponse = await fetch(
          '/api/ai/verb-conjugation-worksheet',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: worksheetTitle,
              context: documentContext,
              level: additionalWorksheetLevel,
              phase: additionalWorksheetPhase,
              verbs: availableVerbTableVerbs.map(({
                infinitive,
                forms,
                separablePrefix,
              }) => ({
                infinitive,
                separablePrefix,
                forms: {
                  ich: forms.ich,
                  du: forms.du,
                  formalSingular: forms.formalSingular,
                  thirdSingular: forms.thirdSingular,
                  wir: forms.wir,
                  ihr: forms.ihr,
                  formalPlural: forms.formalPlural,
                  thirdPlural: forms.thirdPlural,
                },
              })),
            }),
          },
        );
        const generationResult = await generationResponse.json() as {
          sentences?: string[];
          error?: string;
        };
        if (!generationResponse.ok || !generationResult.sentences?.length) {
          throw new Error(generationResult.error ?? 'Konjugationsübung konnte nicht erstellt werden.');
        }
        contentHtml = [
          generatedHeadingHtml(worksheetTitle),
          generatedFillInTheBlankHtml(generationResult.sentences),
        ].join('');
      }

      const response = await fetch('/api/worksheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: worksheetTitle,
          contentHtml,
          documentSize: 'a4-portrait',
          showSolutions: false,
          context: documentContext,
          status: 'draft',
          brandProfileId,
          folderId: worksheetFolderId,
        }),
      });
      const result = await response.json() as {
        worksheet?: { id: string };
        error?: string;
      };
      if (!response.ok || !result.worksheet) {
        throw new Error(result.error ?? 'Zusätzliches Arbeitsblatt konnte nicht erstellt werden.');
      }
      const relationshipResponse = await fetch('/api/worksheet-relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceWorksheetId: worksheetIdRef.current,
          relatedWorksheetId: result.worksheet.id,
          relationshipType: kind === 'word-grid'
            ? 'word_grid_from_verb_table'
            : 'conjugation_exercise_from_verb_table',
        }),
      });
      const relationshipResult = await relationshipResponse.json().catch(() => null) as {
        error?: string;
      } | null;
      if (!relationshipResponse.ok) {
        throw new Error(
          relationshipResult?.error ?? 'Die Arbeitsblatt-Verknüpfung konnte nicht gespeichert werden.',
        );
      }
      window.location.href = `/editor?worksheet=${encodeURIComponent(result.worksheet.id)}`;
    } catch (error) {
      setExportError(error instanceof Error
        ? error.message
        : 'Zusätzliches Arbeitsblatt konnte nicht erstellt werden.');
      setCreatingAdditionalWorksheet(null);
    }
  };

  return (
    <div className="editor-app flex h-screen flex-col overflow-hidden bg-secondary text-primary">

      {/* Top header (sticky) */}
      <header className="editor-topbar relative flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <EduitLogo className="h-6 w-auto" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 left-0 flex items-center justify-center md:left-64 lg:right-72">
          <input
            aria-label="Worksheet title"
            maxLength={200}
            value={worksheetTitle}
            onChange={(event) => handleWorksheetTitleChange(event.target.value)}
            onBlur={() => {
              if (!worksheetTitle.trim()) {
                handleWorksheetTitleChange('Untitled Worksheet');
              } else if (worksheetTitle !== worksheetTitle.trim()) {
                handleWorksheetTitleChange(worksheetTitle.trim());
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="pointer-events-auto w-full max-w-80 rounded-md border border-transparent bg-transparent px-2 py-1 text-center text-sm font-semibold text-secondary outline-none transition hover:border-primary focus:border-brand focus:bg-primary focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-quaternary">
            {saved ? t('editor.allChangesSaved') : t('editor.saving')}
          </span>
          <LanguageSwitcher compact />
          <Button color="secondary" size="md" iconLeading={<Home03 className="size-4.5" />} onPress={() => { window.location.href = '/'; }}>
            {t('editor.home')}
          </Button>
          <Button
            color="secondary"
            size="md"
            isDisabled={!worksheetId || duplicatingWorksheet}
            iconLeading={duplicatingWorksheet
              ? <Loading01 className="size-4.5 animate-spin" />
              : <Copy01 className="size-4.5" />}
            onPress={() => void duplicateCurrentWorksheet()}
          >
            {duplicatingWorksheet
              ? `${t('documents.duplicate')}…`
              : t('documents.duplicate')}
          </Button>
          <Button
            color="secondary"
            size="md"
            isDisabled={exportingPDF}
            iconLeading={exportingPDF
              ? <Loading01 className="size-4.5 animate-spin" />
              : <Download01 className="size-4.5" />}
            onPress={exportPDF}
          >
            {exportingPDF ? t('editor.exporting') : t('editor.exportPdf')}
          </Button>
          <Button
            color="primary"
            size="md"
            isDisabled={
              publishingPDF
              || exportingPDF
              || !saved
              || !worksheetId
              || !currentUserRole?.split(',').map((role) => role.trim()).includes('admin')
            }
            iconLeading={publishingPDF ? <Loading01 className="size-4.5 animate-spin" /> : undefined}
            onPress={() => {
              let containsLearningCards = false;
              editor?.state.doc.descendants((node) => {
                if (node.type.name === 'learningCards') containsLearningCards = true;
              });
              if (containsLearningCards) setDazitDocumentType('Lernkarten');
              setRepublishScope(
                publicationStatus === 'unpublished' ? 'full' : 'pdf-only',
              );
              setPublishDialogOpen(true);
            }}
          >
            {publishingPDF
              ? 'Publishing…'
              : publicationStatus === 'outdated'
                ? 'Republish'
                : t('editor.publish')}
          </Button>
        </div>
      </header>

      {/* Body: left sidebar + editor + right sidebar */}
      <div className="editor-body flex min-h-0 flex-1 overflow-hidden">

        {/* Left dashboard sidebar (sticky) */}
        <aside className="editor-left-sidebar hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-secondary bg-primary p-4 md:flex">
          <p className="px-3 pb-2 text-xs font-semibold text-quaternary">{t('common.workspace')}</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.filter(({ label }) => (
              !['Lessons', 'Media', 'Settings'].includes(label)
              || (
                currentUserRole !== null
                && currentUserRole !== 'user'
              )
            )).map(({ label, Icon, href, active }) => (
              <a
                key={label}
                href={href}
                className={cx(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition',
                  active
                    ? 'bg-brand-primary text-brand-secondary'
                    : 'text-secondary hover:bg-primary_hover',
                )}
              >
                <Icon className={cx('size-5', active ? 'text-fg-brand-primary' : 'text-fg-quaternary')} />
                {label === 'Documents'
                  ? t('navigation.documents')
                  : label === 'Lessons'
                    ? t('navigation.lessons')
                    : label === 'Media'
                      ? t('navigation.media')
                      : label === 'Settings'
                        ? t('navigation.settings')
                        : label}
              </a>
            ))}
          </nav>
          {currentUserRole
            ?.split(',')
            .map((role) => role.trim())
            .includes('admin') && (
            <div className="mt-5 border-t border-secondary pt-4">
              <p className="px-3 pb-2 text-xs font-semibold text-quaternary">Admin</p>
              <nav>
                <a
                  href="/brands"
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <Settings01 className="size-5 text-fg-quaternary" />
                  {t('navigation.brandProfiles')}
                </a>
              </nav>
            </div>
          )}
          <SidebarAccountCard />
        </aside>

        {/* Editor column */}
        <main className="editor-column flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="editor-toolbar sticky top-0 z-10 flex items-center border-b border-secondary bg-primary/90 px-4 py-2 backdrop-blur">
            <button
              type="button"
              onClick={() => {
                setInsertBlockAt(null);
                setInsertPaletteOpen(true);
              }}
              className="flex h-9 items-center gap-2 rounded-md bg-brand-solid px-3 text-sm font-semibold text-white transition hover:bg-brand-solid_hover"
            >
              <PlusSquare className="size-4.5" />
              Block einfügen
            </button>
          </div>

          {/* Editable area — Pages renders A4 pages on this backdrop */}
          <div
            className="editor-workspace min-h-0 flex-1 overflow-auto bg-tertiary px-4 py-8"
            data-i18n-content
            onMouseDown={(event) => {
              if (event.target !== event.currentTarget) return;
              editor.commands.setTextSelection(editor.state.doc.content.size);
              editor.commands.blur();
            }}
          >
            <EditorContent editor={editor} className="editor-content mx-auto w-fit" />
          </div>
        </main>

        {/* Right sidebar (sticky) */}
        <aside className="editor-right-sidebar hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-secondary bg-primary p-5 lg:flex">
          {exportError && (
            <div
              role={publishSuccess ? 'status' : 'alert'}
              className={cx(
                'rounded-lg border p-3 text-xs',
                publishSuccess
                  ? 'border-success-primary bg-success-primary text-success-primary'
                  : 'border-error-primary bg-error-primary text-error-primary',
              )}
            >
              {exportError}
            </div>
          )}
          {publicationStatus === 'outdated' && (
            <div
              role="status"
              className="rounded-lg border border-warning-primary bg-warning-primary p-3 text-xs text-warning-primary"
            >
              Dieses Arbeitsblatt wurde seit der Veröffentlichung geändert.
              Veröffentlichen Sie es erneut, um die PDF-Version in der
              Dazit-Bibliothek zu aktualisieren.
            </div>
          )}

          {selectedCustomBlock
            && (
              CONTENT_EDITOR_BLOCK_TYPES.has(selectedCustomBlock.type)
              || selectedCustomBlock.type === 'timeMatching'
              || selectedCustomBlock.type === 'dateMatching'
              || selectedCustomBlock.type === 'twoWayPrepositions'
              || selectedCustomBlock.type === 'weather'
              || selectedCustomBlock.type === 'colorFurniture'
              || selectedCustomBlock.type === 'germanVerbTable'
            ) && (
            <div className="flex flex-col gap-2">
              {CONTENT_EDITOR_BLOCK_TYPES.has(selectedCustomBlock.type) && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCustomBlock.type === 'mediaLayout') {
                      setMediaLayoutEditorBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'mediaLayout',
                      });
                      return;
                    }
                    setContentEditorBlock({
                      pos: selectedCustomBlock.pos,
                      type: selectedCustomBlock.type as ContentEditorBlock['type'],
                    });
                  }}
                  className="flex w-full items-center justify-start gap-2 rounded-lg bg-brand-solid px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-solid_hover"
                >
                  <Edit05 className="size-4" />
                  Edit content
                </button>
              )}
              {selectedCustomBlock.type === 'twoWayPrepositions' && (
                <button
                  type="button"
                  onClick={() => setTwoWayPrepositionsEditorBlock({
                    pos: selectedCustomBlock.pos,
                    type: 'twoWayPrepositions',
                  })}
                  className="flex w-full items-center justify-start gap-2 rounded-lg bg-brand-solid px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-solid_hover"
                >
                  <Edit05 className="size-4" />
                  Edit content
                </button>
              )}
              {selectedCustomBlock.type === 'germanVerbTable' && (
                <button
                  type="button"
                  onClick={() => setGermanVerbTableEditorBlock({
                    pos: selectedCustomBlock.pos,
                    type: 'germanVerbTable',
                  })}
                  className="flex w-full items-center justify-start gap-2 rounded-lg bg-brand-solid px-3 py-2 text-xs font-semibold text-white transition hover:bg-brand-solid_hover"
                >
                  <Edit05 className="size-4" />
                  Edit content
                </button>
              )}
              {(selectedCustomBlock.type === 'mcq'
                || selectedCustomBlock.type === 'wordGrid'
                || selectedCustomBlock.type === 'dialogue'
                || selectedCustomBlock.type === 'miniForm'
                || selectedCustomBlock.type === 'fillInTheBlank'
                || selectedCustomBlock.type === 'trueFalse'
                || selectedCustomBlock.type === 'richText'
                || selectedCustomBlock.type === 'errorCorrection'
                || selectedCustomBlock.type === 'crossword'
                || selectedCustomBlock.type === 'timeMatching'
                || selectedCustomBlock.type === 'dateMatching'
                || selectedCustomBlock.type === 'twoWayPrepositions'
                || selectedCustomBlock.type === 'weather'
                || selectedCustomBlock.type === 'colorFurniture'
                || selectedCustomBlock.type === 'learningCards'
                || selectedCustomBlock.type === 'germanVerbTable') && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCustomBlock.type === 'mcq') {
                      setMCQAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'mcq',
                      });
                    } else if (selectedCustomBlock.type === 'wordGrid') {
                      setWordGridAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'wordGrid',
                      });
                    } else if (selectedCustomBlock.type === 'dialogue') {
                      setDialogueAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'dialogue',
                      });
                    } else if (selectedCustomBlock.type === 'miniForm') {
                      setMiniFormAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'miniForm',
                      });
                    } else if (selectedCustomBlock.type === 'fillInTheBlank') {
                      setFillInTheBlankAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'fillInTheBlank',
                      });
                    } else if (selectedCustomBlock.type === 'trueFalse') {
                      setTrueFalseAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'trueFalse',
                      });
                    } else if (selectedCustomBlock.type === 'crossword') {
                      setCrosswordAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'crossword',
                      });
                    } else if (selectedCustomBlock.type === 'errorCorrection') {
                      setErrorCorrectionAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'errorCorrection',
                      });
                    } else if (selectedCustomBlock.type === 'timeMatching') {
                      setTimeMatchingAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'timeMatching',
                      });
                    } else if (selectedCustomBlock.type === 'dateMatching') {
                      setDateMatchingAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'dateMatching',
                      });
                    } else if (selectedCustomBlock.type === 'twoWayPrepositions') {
                      setTwoWayPrepositionsAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'twoWayPrepositions',
                      });
                    } else if (selectedCustomBlock.type === 'weather') {
                      setWeatherAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'weather',
                      });
                    } else if (selectedCustomBlock.type === 'colorFurniture') {
                      setColorFurnitureAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'colorFurniture',
                      });
                    } else if (selectedCustomBlock.type === 'germanVerbTable') {
                      setGermanVerbTableAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'germanVerbTable',
                      });
                    } else if (selectedCustomBlock.type === 'learningCards') {
                      setLearningCardsAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'learningCards',
                      });
                    } else {
                      setRichTextAIBlock({
                        pos: selectedCustomBlock.pos,
                        type: 'richText',
                      });
                    }
                  }}
                  className="flex w-full items-center justify-start gap-2 rounded-lg border border-brand-secondary bg-primary px-3 py-2 text-xs font-semibold text-brand-secondary transition hover:bg-brand-primary"
                >
                  <WandSparkles className="size-4" />
                  Eduit AI
                </button>
              )}
              {selectedCustomBlock.type === 'wordGrid' && (
                <>
                  <button
                    type="button"
                    onClick={() => setWordGridCSVBlock({
                      pos: selectedCustomBlock.pos,
                      type: 'wordGrid',
                    })}
                    className="flex w-full items-center justify-start gap-2 rounded-lg border border-primary bg-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                  >
                    <FileUp className="size-4" />
                    CSV Import
                  </button>
                </>
              )}
            </div>
          )}

          {!selectedCustomBlock
            && selectedMCQAttrs && selectedMCQQuestion && selectedMCQPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Multiple choice</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">MCQ</span>
              </div>

              <label htmlFor="mcq-question" className="mt-4 block text-xs font-semibold text-tertiary">Question</label>
              <textarea
                id="mcq-question"
                rows={3}
                value={selectedMCQQuestion.question}
                onChange={(event) => setNodeAttr(
                  editor,
                  selectedMCQPos,
                  'questions',
                  selectedMCQQuestions.map((question, index) => (
                    index === 0 ? { ...question, question: event.target.value } : question
                  )),
                )}
                className="mt-2 w-full resize-none rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label htmlFor="mcq-columns" className="mt-4 block text-xs font-semibold text-tertiary">Option columns</label>
              <select
                id="mcq-columns"
                value={selectedMCQAttrs.columns}
                onChange={(event) => setNodeAttr(
                  editor,
                  selectedMCQPos,
                  'columns',
                  Number(event.target.value) as MCQColumns,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value={1}>1 column</option>
                <option value={2}>2 columns</option>
                <option value={3}>3 columns</option>
              </select>

              <label htmlFor="mcq-answer-mode" className="mt-4 block text-xs font-semibold text-tertiary">Correct answers</label>
              <select
                id="mcq-answer-mode"
                value={selectedMCQQuestion.answerMode}
                onChange={(event) => updateMCQAnswerMode(event.target.value as MCQAnswerMode)}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value="single">Single answer</option>
                <option value="multiple">Multiple answers</option>
              </select>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Answers</span>
                <span className="text-[10px] text-quaternary">Mark correct</span>
              </div>
              <div className="mt-2 space-y-2">
                {selectedMCQQuestion.options.map((option, index) => (
                  <div className="flex items-center gap-2" key={option.id}>
                    <span className="w-5 text-xs tabular-nums text-quaternary">{String(index + 1).padStart(2, '0')}</span>
                    <input
                      aria-label={`Mark answer ${index + 1} correct`}
                      type="checkbox"
                      checked={option.correct}
                      onChange={(event) => updateMCQOption(option.id, { correct: event.target.checked })}
                      className="size-4 shrink-0 appearance-auto accent-[var(--color-bg-brand-solid)]"
                    />
                    <input
                      aria-label={`Answer ${index + 1}`}
                      value={option.text}
                      onChange={(event) => updateMCQOption(option.id, { text: event.target.value })}
                      className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <button
                      type="button"
                      aria-label={`Delete answer ${index + 1}`}
                      disabled={selectedMCQQuestion.options.length <= 2}
                      onClick={() => setNodeAttr(
                        editor,
                        selectedMCQPos,
                        'questions',
                        selectedMCQQuestions.map((question, questionIndex) => (
                          questionIndex === 0
                            ? { ...question, options: question.options.filter(({ id }) => id !== option.id) }
                            : question
                        )),
                      )}
                      className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash01 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMCQOption}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add answer
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedMCMAttrs && selectedMCMPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Multiple-choice matrix</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">MCM</span>
              </div>

              <label htmlFor="mcm-question" className="mt-4 block text-xs font-semibold text-tertiary">Question</label>
              <textarea
                id="mcm-question"
                rows={3}
                value={selectedMCMAttrs.question}
                onChange={(event) => setMCMAttr(editor, selectedMCMPos, 'question', event.target.value)}
                className="mt-2 w-full resize-none rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedMCMAttrs.showFirstAsExample}
                  onChange={(event) => setMCMAttr(
                    editor,
                    selectedMCMPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Statement / Question rows</span>
                <span className="text-[10px] text-quaternary">Max. 3 options each</span>
              </div>

              <div className="mt-2 space-y-3">
                {selectedMCMAttrs.rows.map((row, rowIndex) => (
                  <div className="rounded-lg border border-secondary p-3" key={row.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs tabular-nums text-quaternary">
                        {String(rowIndex + 1).padStart(2, '0')}
                      </span>
                      <input
                        aria-label={`Statement / Question row ${rowIndex + 1}`}
                        value={row.text}
                        onChange={(event) => updateMCMRow(row.id, { text: event.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete statement / question row ${rowIndex + 1}`}
                        disabled={selectedMCMAttrs.rows.length <= 1}
                        onClick={() => updateMCMRows(
                          selectedMCMAttrs.rows.filter(({ id }) => id !== row.id),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-2 space-y-2 pl-7">
                      {row.options.map((option, optionIndex) => (
                        <div className="flex items-center gap-2" key={option.id}>
                          <input
                            aria-label={`Mark row ${rowIndex + 1}, option ${optionIndex + 1} correct`}
                            type="checkbox"
                            checked={option.correct}
                            onChange={(event) => updateMCMOption(
                              row.id,
                              option.id,
                              { correct: event.target.checked },
                            )}
                            className="size-4 shrink-0 appearance-auto accent-[var(--color-bg-brand-solid)]"
                          />
                          <input
                            aria-label={`Row ${rowIndex + 1}, option ${optionIndex + 1}`}
                            value={option.text}
                            onChange={(event) => updateMCMOption(
                              row.id,
                              option.id,
                              { text: event.target.value },
                            )}
                            className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                          />
                          <button
                            type="button"
                            aria-label={`Delete row ${rowIndex + 1}, option ${optionIndex + 1}`}
                            disabled={row.options.length <= 1}
                            onClick={() => updateMCMRow(row.id, {
                              options: row.options.filter(({ id }) => id !== option.id),
                            })}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={row.options.length >= 3}
                      onClick={() => {
                        const optionIndex = row.options.length;
                        updateMCMRow(row.id, {
                          options: [
                            ...row.options,
                            {
                              id: `${row.id}-option-${Date.now()}`,
                              text: `Option ${String.fromCharCode(65 + optionIndex)}`,
                              correct: false,
                            },
                          ],
                        });
                      }}
                      className="mt-2 ml-7 text-xs font-semibold text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      + Add option
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMCMRow}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add answer row
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedMCHAttrs && selectedMCHPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Header matrix</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">MCH</span>
              </div>

              <span className="mt-4 block text-xs font-semibold text-tertiary">Question</span>
              <InlineFormattedInput
                ariaLabel="MCH question"
                multiline
                value={selectedMCHAttrs.question}
                onChange={(value) => setMCHAttr(
                  editor,
                  selectedMCHPos,
                  'question',
                  value,
                )}
                className="custom-block__inline-formatted-input mt-2 min-h-20 w-full whitespace-pre-wrap rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedMCHAttrs.showFirstAsExample}
                  onChange={(event) => setMCHAttr(
                    editor,
                    selectedMCHPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Header options</span>
                <span className="text-[10px] text-quaternary">Max. 4</span>
              </div>
              <div className="mt-2 space-y-2">
                {selectedMCHAttrs.options.map((option, optionIndex) => (
                  <div className="flex items-center gap-2" key={option.id}>
                    <span className="w-5 text-xs tabular-nums text-quaternary">
                      {String(optionIndex + 1).padStart(2, '0')}
                    </span>
                    <InlineFormattedInput
                      ariaLabel={`Header option ${optionIndex + 1}`}
                      value={option.text}
                      onChange={(value) => updateMCHOptions(
                        selectedMCHAttrs.options.map((current) => (
                          current.id === option.id
                            ? { ...current, text: value }
                            : current
                        )),
                      )}
                      className="custom-block__inline-formatted-input min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <button
                      type="button"
                      aria-label={`Delete header option ${optionIndex + 1}`}
                      disabled={selectedMCHAttrs.options.length <= 1}
                      onClick={() => updateMCHOptions(
                        selectedMCHAttrs.options.filter(({ id }) => id !== option.id),
                      )}
                      className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash01 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedMCHAttrs.options.length >= 4}
                onClick={() => {
                  const optionIndex = selectedMCHAttrs.options.length;
                  updateMCHOptions([
                    ...selectedMCHAttrs.options,
                    {
                      id: `option-${Date.now()}`,
                      text: `Option ${String.fromCharCode(65 + optionIndex)}`,
                    },
                  ]);
                }}
                className="mt-2 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-30"
              >
                + Add header option
              </button>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Answer rows</span>
                <span className="text-[10px] text-quaternary">Correct option</span>
              </div>
              <div className="mt-2 space-y-3">
                {selectedMCHAttrs.rows.map((row, rowIndex) => (
                  <div className="rounded-lg border border-secondary p-3" key={row.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs tabular-nums text-quaternary">
                        {String(rowIndex + 1).padStart(2, '0')}
                      </span>
                      <InlineFormattedInput
                        ariaLabel={`Answer row ${rowIndex + 1}`}
                        value={row.text}
                        onChange={(value) => updateMCHRow(row.id, { text: value })}
                        className="custom-block__inline-formatted-input min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete answer row ${rowIndex + 1}`}
                        disabled={selectedMCHAttrs.rows.length <= 1}
                        onClick={() => updateMCHRows(
                          selectedMCHAttrs.rows.filter(({ id }) => id !== row.id),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <select
                      aria-label={`Correct option for row ${rowIndex + 1}`}
                      value={row.correctOptionId ?? ''}
                      onChange={(event) => updateMCHRow(row.id, {
                        correctOptionId: event.target.value || null,
                      })}
                      className="mt-2 ml-7 w-[calc(100%_-_1.75rem)] rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    >
                      <option value="">No correct option</option>
                      {selectedMCHAttrs.options.map((option, optionIndex) => (
                        <option key={option.id} value={option.id}>
                          {stripInlineFormatting(option.text)
                            || `Option ${String.fromCharCode(65 + optionIndex)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addMCHRow}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add answer row
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedMatchingPairsAttrs
            && selectedMatchingPairsPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Matching pairs</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Pairs</span>
              </div>

              <label htmlFor="matching-pairs-question" className="mt-4 block text-xs font-semibold text-tertiary">
                Question
              </label>
              <textarea
                id="matching-pairs-question"
                rows={3}
                value={selectedMatchingPairsAttrs.question}
                onChange={(event) => setMatchingPairsAttr(
                  editor,
                  selectedMatchingPairsPos,
                  'question',
                  event.target.value,
                )}
                className="mt-2 w-full resize-none border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show first as example</span>
                  <input
                    type="checkbox"
                    checked={selectedMatchingPairsAttrs.showFirstAsExample}
                    onChange={(event) => setMatchingPairsAttr(
                      editor,
                      selectedMatchingPairsPos,
                      'showFirstAsExample',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show word bank</span>
                  <input
                    type="checkbox"
                    checked={selectedMatchingPairsAttrs.showWordBank}
                    onChange={(event) => setMatchingPairsAttr(
                      editor,
                      selectedMatchingPairsPos,
                      'showWordBank',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className={cx(
                  'flex items-center justify-between gap-3 text-xs font-semibold',
                  selectedMatchingPairsAttrs.showWordBank
                    ? 'text-tertiary'
                    : 'text-disabled',
                )}>
                  <span>Shuffle word bank</span>
                  <input
                    type="checkbox"
                    disabled={!selectedMatchingPairsAttrs.showWordBank}
                    checked={selectedMatchingPairsAttrs.shuffleWordBank}
                    onChange={(event) => setMatchingPairsAttr(
                      editor,
                      selectedMatchingPairsPos,
                      'shuffleWordBank',
                      event.target.checked,
                    )}
                  />
                </label>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Pairs</span>
                <span className="text-[10px] text-quaternary">Left and matching right</span>
              </div>

              <div className="mt-2 space-y-3">
                {selectedMatchingPairsAttrs.pairs.map((pair, pairIndex) => (
                  <div className="rounded-lg border border-secondary p-3" key={pair.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tabular-nums text-quaternary">
                        Pair {String(pairIndex + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete pair ${pairIndex + 1}`}
                        disabled={selectedMatchingPairsAttrs.pairs.length <= 2}
                        onClick={() => updateMatchingPairs(
                          selectedMatchingPairsAttrs.pairs.filter(
                            ({ id }) => id !== pair.id,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                      Left item
                    </label>
                    <input
                      aria-label={`Left item ${pairIndex + 1}`}
                      value={pair.left}
                      onChange={(event) => updateMatchingPair(
                        pair.id,
                        { left: event.target.value },
                      )}
                      className="mt-1 w-full rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                      Matching right item
                    </label>
                    <input
                      aria-label={`Right item ${pairIndex + 1}`}
                      value={pair.right}
                      onChange={(event) => updateMatchingPair(
                        pair.id,
                        { right: event.target.value },
                      )}
                      className="mt-1 w-full rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={addMatchingPair}
                  className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  + Add pair
                </button>
                <button
                  type="button"
                  onClick={shuffleMatchingPairs}
                  className="rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  Shuffle right
                </button>
              </div>
            </div>
          )}

          {!selectedCustomBlock
            && selectedTrueFalseAttrs && selectedTrueFalsePos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">True or false</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">T/F</span>
              </div>

              <label htmlFor="true-false-question" className="mt-4 block text-xs font-semibold text-tertiary">Question</label>
              <textarea
                id="true-false-question"
                rows={3}
                value={selectedTrueFalseAttrs.question}
                onChange={(event) => setTrueFalseAttr(
                  editor,
                  selectedTrueFalsePos,
                  'question',
                  event.target.value,
                )}
                className="mt-2 w-full resize-none rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedTrueFalseAttrs.showFirstAsExample}
                  onChange={(event) => setTrueFalseAttr(
                    editor,
                    selectedTrueFalsePos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4">
                <span className="text-xs font-semibold text-tertiary">Answer labels</span>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="true-label" className="block text-[10px] font-medium uppercase tracking-wide text-quaternary">True</label>
                    <input
                      id="true-label"
                      value={selectedTrueFalseAttrs.trueLabel}
                      onChange={(event) => setTrueFalseAttr(
                        editor,
                        selectedTrueFalsePos,
                        'trueLabel',
                        event.target.value,
                      )}
                      className="mt-1 w-full rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                  <div>
                    <label htmlFor="false-label" className="block text-[10px] font-medium uppercase tracking-wide text-quaternary">False</label>
                    <input
                      id="false-label"
                      value={selectedTrueFalseAttrs.falseLabel}
                      onChange={(event) => setTrueFalseAttr(
                        editor,
                        selectedTrueFalsePos,
                        'falseLabel',
                        event.target.value,
                      )}
                      className="mt-1 w-full rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-secondary">
                  <input
                    type="checkbox"
                    checked={selectedTrueFalseAttrs.showNa}
                    onChange={(event) => updateTrueFalseShowNa(event.target.checked)}
                    className="size-4 shrink-0 appearance-auto accent-[var(--color-bg-brand-solid)]"
                  />
                  Include N/A column
                </label>
                {selectedTrueFalseAttrs.showNa && (
                  <div className="mt-2">
                    <label htmlFor="na-label" className="block text-[10px] font-medium uppercase tracking-wide text-quaternary">N/A</label>
                    <input
                      id="na-label"
                      value={selectedTrueFalseAttrs.naLabel}
                      onChange={(event) => setTrueFalseAttr(
                        editor,
                        selectedTrueFalsePos,
                        'naLabel',
                        event.target.value,
                      )}
                      className="mt-1 w-full rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-tertiary">Statements</span>
                <span className="text-[10px] text-quaternary">Correct value</span>
              </div>
              <div className="mt-2 space-y-3">
                {selectedTrueFalseAttrs.rows.map((row, rowIndex) => (
                  <div className="rounded-lg border border-secondary p-3" key={row.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-xs tabular-nums text-quaternary">
                        {String(rowIndex + 1).padStart(2, '0')}
                      </span>
                      <input
                        aria-label={`Statement ${rowIndex + 1}`}
                        value={row.text}
                        onChange={(event) => updateTrueFalseRow(
                          row.id,
                          { text: event.target.value },
                        )}
                        className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete statement ${rowIndex + 1}`}
                        disabled={selectedTrueFalseAttrs.rows.length <= 1}
                        onClick={() => updateTrueFalseRows(
                          selectedTrueFalseAttrs.rows.filter(({ id }) => id !== row.id),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <select
                      aria-label={`Correct value for statement ${rowIndex + 1}`}
                      value={row.correctValue ?? ''}
                      onChange={(event) => updateTrueFalseRow(row.id, {
                        correctValue: (event.target.value || null) as TrueFalseValue | null,
                      })}
                      className="mt-2 ml-7 w-[calc(100%_-_1.75rem)] rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                    >
                      <option value="">No correct value</option>
                      <option value="true">{selectedTrueFalseAttrs.trueLabel}</option>
                      <option value="false">{selectedTrueFalseAttrs.falseLabel}</option>
                      {selectedTrueFalseAttrs.showNa && (
                        <option value="na">{selectedTrueFalseAttrs.naLabel}</option>
                      )}
                    </select>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addTrueFalseRow}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add statement
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedSortingCategoriesAttrs
            && selectedSortingCategoriesPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Sorting Categories</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Sorting</span>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Color coding</span>
                <input
                  type="checkbox"
                  checked={selectedSortingCategoriesAttrs.colorCoding}
                  onChange={(event) => setSortingCategoriesAttr(
                    editor,
                    selectedSortingCategoriesPos,
                    'colorCoding',
                    event.target.checked,
                  )}
                />
              </label>
              <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedSortingCategoriesAttrs.showFirstAsExample}
                  onChange={(event) => setSortingCategoriesAttr(
                    editor,
                    selectedSortingCategoriesPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-5 space-y-4">
                {selectedSortingCategoriesAttrs.categories.map((category, categoryIndex) => (
                  <div className="border-b border-secondary pb-4" key={category.id}>
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`Category ${categoryIndex + 1} title`}
                        value={category.title}
                        onChange={(event) => updateSortingCategory(category.id, {
                          title: event.target.value,
                        })}
                        className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm font-semibold text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete category ${categoryIndex + 1}`}
                        disabled={selectedSortingCategoriesAttrs.categories.length <= 2}
                        onClick={() => updateSortingCategories(
                          selectedSortingCategoriesAttrs.categories.filter(
                            ({ id }) => id !== category.id,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-2 space-y-2">
                      {selectedSortingCategoriesAttrs.items
                        .filter(({ categoryId }) => categoryId === category.id)
                        .map((item, itemIndex) => (
                          <div className="flex items-center gap-2" key={item.id}>
                            <span
                              aria-hidden="true"
                              className="w-3 shrink-0 text-center text-xs text-quaternary"
                            >
                              •
                            </span>
                            <input
                              aria-label={`Item ${itemIndex + 1} in ${category.title}`}
                              value={item.text}
                              onChange={(event) => updateSortingCategoryItem(item.id, {
                                text: event.target.value,
                              })}
                              className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                            />
                            <button
                              type="button"
                              aria-label={`Delete ${item.text}`}
                              disabled={selectedSortingCategoriesAttrs.items.length <= 1}
                              onClick={() => updateSortingCategoryItems(
                                selectedSortingCategoriesAttrs.items.filter(
                                  ({ id }) => id !== item.id,
                                ),
                              )}
                              className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Trash01 className="size-4" />
                            </button>
                          </div>
                        ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addSortingCategoryItem(category.id)}
                      className="mt-3 flex w-full items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                    >
                      <PlusSquare className="size-4" />
                      Add element
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedSortingCategoriesAttrs.categories.length >= 4}
                onClick={addSortingCategory}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                + Add category
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedWordGridAttrs && selectedWordGridPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Word Grid</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Grid
                </span>
              </div>

              <label htmlFor="word-grid-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="word-grid-instruction"
                rows={2}
                value={selectedWordGridAttrs.instruction}
                onChange={(event) => setWordGridAttr(
                  editor,
                  selectedWordGridPos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-tertiary">
                  Columns
                  <input
                    type="number"
                    min="3"
                    max="20"
                    step="1"
                    value={selectedWordGridAttrs.columns}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (!Number.isFinite(value)) return;
                      setWordGridAttr(
                        editor,
                        selectedWordGridPos,
                        'columns',
                        Math.min(20, Math.max(3, Math.round(value))),
                      );
                    }}
                    className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
                <label className="text-xs font-semibold text-tertiary">
                  Rows
                  <input
                    type="number"
                    min="3"
                    max="20"
                    step="1"
                    value={selectedWordGridAttrs.rows}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (!Number.isFinite(value)) return;
                      setWordGridAttr(
                        editor,
                        selectedWordGridPos,
                        'rows',
                        Math.min(20, Math.max(3, Math.round(value))),
                      );
                    }}
                    className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
              </div>

              <label htmlFor="word-grid-row-height" className="mt-4 block text-xs font-semibold text-tertiary">
                Row height
              </label>
              <input
                id="word-grid-row-height"
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                value={selectedWordGridAttrs.rowHeight}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (!Number.isFinite(value)) return;
                  setWordGridAttr(
                    editor,
                    selectedWordGridPos,
                    'rowHeight',
                    Math.round(Math.min(3, Math.max(0.5, value)) * 10) / 10,
                  );
                }}
                className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <p className="mt-1.5 text-xs leading-5 text-quaternary">
                Multiplies the design-system row height in 0.1 steps.
              </p>

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show word list</span>
                  <input
                    type="checkbox"
                    checked={selectedWordGridAttrs.showWordList}
                    onChange={(event) => setWordGridAttr(
                      editor,
                      selectedWordGridPos,
                      'showWordList',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show first as example</span>
                  <input
                    type="checkbox"
                    checked={selectedWordGridAttrs.showFirstAsExample}
                    onChange={(event) => setWordGridAttr(
                      editor,
                      selectedWordGridPos,
                      'showFirstAsExample',
                      event.target.checked,
                    )}
                  />
                </label>
              </div>

              <div className="mt-5 border-t border-secondary pt-4">
                <p className="text-xs font-semibold text-tertiary">Letter directions</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {WORD_GRID_DIRECTION_OPTIONS.map((direction) => (
                    <label
                      className="flex min-w-0 items-center justify-between gap-2 border border-primary bg-primary px-2.5 py-2 text-xs text-secondary"
                      key={direction.value}
                    >
                      <span className="truncate">{direction.label}</span>
                      <input
                        type="checkbox"
                        checked={selectedWordGridAttrs.directions[direction.value]}
                        onChange={(event) => updateWordGridDirection(
                          direction.value,
                          event.target.checked,
                        )}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">Words</p>
                  <span className="text-[10px] tabular-nums text-quaternary">
                    {selectedWordGridAttrs.words.length}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {selectedWordGridAttrs.words.map((word, wordIndex) => (
                    <div className="flex items-center gap-2" key={wordIndex}>
                      <input
                        aria-label={`Word ${wordIndex + 1}`}
                        value={word}
                        onChange={(event) => updateWordGridWord(
                          wordIndex,
                          event.target.value,
                        )}
                        className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete word ${wordIndex + 1}`}
                        disabled={selectedWordGridAttrs.words.length <= 1}
                        onClick={() => updateWordGridWords(
                          selectedWordGridAttrs.words.filter(
                            (_, index) => index !== wordIndex,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => updateWordGridWords([
                    ...selectedWordGridAttrs.words,
                    'New word',
                  ])}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add word
                </button>
              </div>

              <button
                type="button"
                onClick={() => setWordGridAttr(
                  editor,
                  selectedWordGridPos,
                  'generation',
                  selectedWordGridAttrs.generation + 1,
                )}
                className="mt-4 w-full border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                Regenerate grid
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedChooseCorrectWordsAttrs
            && selectedChooseCorrectWordsPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">
                  Choose Correct Words
                </p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Words
                </span>
              </div>

              <label htmlFor="choose-correct-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="choose-correct-instruction"
                rows={2}
                value={selectedChooseCorrectWordsAttrs.instruction}
                onChange={(event) => setChooseCorrectWordsAttr(
                  editor,
                  selectedChooseCorrectWordsPos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 grid grid-cols-2 gap-2">
                <label className="text-xs font-semibold text-tertiary">
                  Keep from left
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={selectedChooseCorrectWordsAttrs.keepLeft}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (!Number.isFinite(value)) return;
                      setChooseCorrectWordsAttr(
                        editor,
                        selectedChooseCorrectWordsPos,
                        'keepLeft',
                        Math.min(10, Math.max(0, Math.round(value))),
                      );
                    }}
                    className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
                <label className="text-xs font-semibold text-tertiary">
                  Keep from right
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    value={selectedChooseCorrectWordsAttrs.keepRight}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (!Number.isFinite(value)) return;
                      setChooseCorrectWordsAttr(
                        editor,
                        selectedChooseCorrectWordsPos,
                        'keepRight',
                        Math.min(10, Math.max(0, Math.round(value))),
                      );
                    }}
                    className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedChooseCorrectWordsAttrs.showFirstAsExample}
                  onChange={(event) => setChooseCorrectWordsAttr(
                    editor,
                    selectedChooseCorrectWordsPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">Words</p>
                  <span className="text-[10px] tabular-nums text-quaternary">
                    {selectedChooseCorrectWordsAttrs.items.length}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {selectedChooseCorrectWordsAttrs.items.map((item, itemIndex) => (
                    <div className="flex items-center gap-2" key={item.id}>
                      <input
                        aria-label={`Correct word ${itemIndex + 1}`}
                        value={item.word}
                        onChange={(event) => updateChooseCorrectWordItem(
                          item.id,
                          { word: event.target.value },
                        )}
                        className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <input
                        aria-label={`Option count for ${item.word}`}
                        type="number"
                        min="2"
                        max="12"
                        step="1"
                        value={item.optionCount}
                        onChange={(event) => {
                          const value = event.currentTarget.valueAsNumber;
                          if (!Number.isFinite(value)) return;
                          updateChooseCorrectWordItem(item.id, {
                            optionCount: Math.min(
                              12,
                              Math.max(2, Math.round(value)),
                            ),
                          });
                        }}
                        className="w-16 border border-primary bg-primary px-2.5 py-2 text-sm tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete word ${itemIndex + 1}`}
                        disabled={selectedChooseCorrectWordsAttrs.items.length <= 1}
                        onClick={() => updateChooseCorrectWordItems(
                          selectedChooseCorrectWordsAttrs.items.filter(
                            ({ id }) => id !== item.id,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateChooseCorrectWordItems([
                    ...selectedChooseCorrectWordsAttrs.items,
                    {
                      id: `correct-word-${Date.now()}`,
                      word: 'New word',
                      optionCount: 8,
                    },
                  ])}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add word
                </button>
              </div>

              <button
                type="button"
                onClick={() => setChooseCorrectWordsAttr(
                  editor,
                  selectedChooseCorrectWordsPos,
                  'generation',
                  selectedChooseCorrectWordsAttrs.generation + 1,
                )}
                className="mt-4 w-full border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                Shuffle items
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedInlineChoiceAttrs && selectedInlineChoicePos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">
                  Inline Choice
                </p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Choice
                </span>
              </div>

              <label htmlFor="inline-choice-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="inline-choice-instruction"
                rows={2}
                value={selectedInlineChoiceAttrs.instruction}
                onChange={(event) => setInlineChoiceAttr(
                  editor,
                  selectedInlineChoicePos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Shuffle choices</span>
                  <input
                    type="checkbox"
                    checked={selectedInlineChoiceAttrs.shuffleChoices}
                    onChange={(event) => setInlineChoiceAttr(
                      editor,
                      selectedInlineChoicePos,
                      'shuffleChoices',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show first as example</span>
                  <input
                    type="checkbox"
                    checked={selectedInlineChoiceAttrs.showFirstAsExample}
                    onChange={(event) => setInlineChoiceAttr(
                      editor,
                      selectedInlineChoicePos,
                      'showFirstAsExample',
                      event.target.checked,
                    )}
                  />
                </label>
              </div>

              <div className="mt-5 space-y-2">
                {selectedInlineChoiceAttrs.items.map((item, itemIndex) => {
                  const sentenceNumber = selectedInlineChoiceAttrs.items
                    .slice(0, itemIndex + 1)
                    .filter((currentItem) => currentItem.type === 'sentence')
                    .length;
                  const sentenceCount = selectedInlineChoiceAttrs.items
                    .filter((currentItem) => currentItem.type === 'sentence')
                    .length;

                  return (
                    <div
                      className="border border-secondary bg-secondary p-3"
                      key={item.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                          {item.type === 'sentence'
                            ? String(sentenceNumber).padStart(2, '0')
                            : 'ROW'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Move item ${itemIndex + 1} up`}
                            disabled={itemIndex === 0}
                            onClick={() => moveInlineChoiceItem(itemIndex, -1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move item ${itemIndex + 1} down`}
                            disabled={
                              itemIndex
                              === selectedInlineChoiceAttrs.items.length - 1
                            }
                            onClick={() => moveInlineChoiceItem(itemIndex, 1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete item ${itemIndex + 1}`}
                            disabled={
                              item.type === 'sentence' && sentenceCount <= 1
                            }
                            onClick={() => updateInlineChoiceItems(
                              selectedInlineChoiceAttrs.items.filter(
                                ({ id }) => id !== item.id,
                              ),
                            )}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {item.type === 'sentence' ? (
                        <textarea
                          aria-label={`Inline choice sentence ${sentenceNumber}`}
                          rows={3}
                          value={item.text}
                          onChange={(event) => updateInlineChoiceSentence(
                            item.id,
                            event.target.value,
                          )}
                          className="mt-2 w-full resize-y bg-transparent text-sm leading-5 text-secondary outline-none"
                        />
                      ) : (
                        <p className="mt-2 text-xs text-quaternary">
                          Blank divider row
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateInlineChoiceItems([
                    ...selectedInlineChoiceAttrs.items,
                    {
                      id: `inline-choice-${Date.now()}`,
                      type: 'sentence',
                      text: '{{choice:*Correct|Wrong 1|Wrong 2}} Enter sentence text.',
                    },
                  ])}
                  className="flex items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add sentence
                </button>
                <button
                  type="button"
                  onClick={() => updateInlineChoiceItems([
                    ...selectedInlineChoiceAttrs.items,
                    {
                      id: `inline-choice-divider-${Date.now()}`,
                      type: 'divider',
                    },
                  ])}
                  className="flex items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add row
                </button>
              </div>
            </div>
          )}

          {!selectedCustomBlock
            && selectedMiniFormAttrs && selectedMiniFormPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">
                  Mini Form
                </p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Form
                </span>
              </div>

              <label htmlFor="mini-form-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="mini-form-instruction"
                rows={2}
                value={selectedMiniFormAttrs.instruction}
                onChange={(event) => setMiniFormAttr(
                  editor,
                  selectedMiniFormPos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">
                    Form field labels
                  </p>
                  <span className="text-[10px] tabular-nums text-quaternary">
                    {selectedMiniFormAttrs.fields.length}
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {selectedMiniFormAttrs.fields.map((field, fieldIndex) => (
                    <div className="flex items-center gap-2" key={field.id}>
                      <input
                        aria-label={`Form field ${fieldIndex + 1}`}
                        value={field.label}
                        onChange={(event) => updateMiniFormFields(
                          selectedMiniFormAttrs.fields.map((currentField) => (
                            currentField.id === field.id
                              ? { ...currentField, label: event.target.value }
                              : currentField
                          )),
                        )}
                        className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete form field ${fieldIndex + 1}`}
                        disabled={selectedMiniFormAttrs.fields.length <= 1}
                        onClick={() => updateMiniFormFields(
                          selectedMiniFormAttrs.fields.filter(
                            ({ id }) => id !== field.id,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fieldNumber = selectedMiniFormAttrs.fields.length + 1;
                    updateMiniFormFields([
                      ...selectedMiniFormAttrs.fields,
                      {
                        id: `mini-form-field-${Date.now()}`,
                        label: `Field ${fieldNumber}`,
                      },
                    ]);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add field
                </button>
              </div>

              <label htmlFor="mini-form-columns" className="mt-4 block text-xs font-semibold text-tertiary">
                Columns
              </label>
              <select
                id="mini-form-columns"
                value={selectedMiniFormAttrs.columns}
                onChange={(event) => setMiniFormAttr(
                  editor,
                  selectedMiniFormPos,
                  'columns',
                  Number(event.target.value) as MiniFormColumns,
                )}
                className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                {[1, 2, 3].map((columns) => (
                  <option key={columns} value={columns}>{columns}</option>
                ))}
              </select>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Fill remaining row</span>
                <input
                  type="checkbox"
                  checked={selectedMiniFormAttrs.fillRemainingRow}
                  onChange={(event) => setMiniFormAttr(
                    editor,
                    selectedMiniFormPos,
                    'fillRemainingRow',
                    event.target.checked,
                  )}
                />
              </label>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedMiniFormAttrs.showFirstAsExample}
                  onChange={(event) => setMiniFormAttr(
                    editor,
                    selectedMiniFormPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">
                    Sentences
                  </p>
                  <span className="text-[10px] tabular-nums text-quaternary">
                    {selectedMiniFormAttrs.items.length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-quaternary">
                  Enter a prompt and one expected value for every field.
                </p>

                <div className="mt-3 space-y-3">
                  {selectedMiniFormAttrs.items.map((item, itemIndex) => (
                    <div
                      className="border border-secondary bg-secondary p-3"
                      key={item.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                          {String(itemIndex + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Move mini form item ${itemIndex + 1} up`}
                            disabled={itemIndex === 0}
                            onClick={() => moveMiniFormItem(itemIndex, -1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move mini form item ${itemIndex + 1} down`}
                            disabled={
                              itemIndex === selectedMiniFormAttrs.items.length - 1
                            }
                            onClick={() => moveMiniFormItem(itemIndex, 1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete mini form item ${itemIndex + 1}`}
                            disabled={selectedMiniFormAttrs.items.length <= 1}
                            onClick={() => updateMiniFormItems(
                              selectedMiniFormAttrs.items.filter(
                                ({ id }) => id !== item.id,
                              ),
                            )}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </div>

                      <textarea
                        aria-label={`Mini form prompt ${itemIndex + 1}`}
                        rows={3}
                        value={item.prompt}
                        onChange={(event) => updateMiniFormItem(item.id, {
                          prompt: event.target.value,
                        })}
                        className="mt-2 w-full resize-y border border-primary bg-primary px-2.5 py-2 text-sm leading-5 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />

                      <div
                        className="mt-2 grid gap-2"
                        style={{
                          gridTemplateColumns: `repeat(${Math.min(
                            selectedMiniFormAttrs.columns,
                            selectedMiniFormAttrs.fields.length,
                          )}, minmax(0, 1fr))`,
                        }}
                      >
                        {selectedMiniFormAttrs.fields.map((field) => (
                          <label
                            className="min-w-0 text-[10px] font-medium text-quaternary"
                            key={field.id}
                          >
                            <span className="block truncate">{field.label}</span>
                            <input
                              value={item.values[field.id] ?? ''}
                              onChange={(event) => updateMiniFormValue(
                                item.id,
                                field.id,
                                event.target.value,
                              )}
                              className="mt-1 w-full min-w-0 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                            />
                          </label>
                        ))}
                      </div>

                      <div className="mt-3">
                        <span className="block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                          Image
                        </span>
                        {item.image && (
                          <div className="mt-1.5 flex items-center gap-2 border border-primary bg-primary p-2">
                            <img
                              alt={item.image.alt}
                              className="size-12 rounded object-cover"
                              src={item.image.src}
                            />
                            <p className="min-w-0 flex-1 truncate text-xs font-medium text-secondary">
                              {item.image.alt || 'Worksheet image'}
                            </p>
                            <button
                              aria-label={`Remove image from mini form item ${itemIndex + 1}`}
                              className="text-quaternary transition hover:text-error-primary"
                              onClick={() => updateMiniFormItem(item.id, {
                                image: undefined,
                              })}
                              type="button"
                            >
                              <Trash01 className="size-4" />
                            </button>
                          </div>
                        )}
                        <button
                          className="mt-1.5 flex w-full items-center justify-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                          onClick={() => setMiniFormImageItemId(item.id)}
                          type="button"
                        >
                          <Image01 className="size-4 text-quaternary" />
                          {item.image ? 'Replace image' : 'Browse media'}
                        </button>
                        <input
                          aria-label={`Image URL for mini form item ${itemIndex + 1}`}
                          placeholder="https://example.com/image.jpg"
                          value={item.image?.src ?? ''}
                          onChange={(event) => updateMiniFormItem(item.id, {
                            image: event.target.value
                              ? {
                                  src: event.target.value,
                                  alt: item.image?.alt ?? '',
                                }
                              : undefined,
                          })}
                          className="mt-2 w-full border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateMiniFormItems([
                    ...selectedMiniFormAttrs.items,
                    {
                      id: `mini-form-item-${Date.now()}`,
                      prompt: 'Enter the sentence or question.',
                      values: Object.fromEntries(
                        selectedMiniFormAttrs.fields.map(({ id }) => [id, '']),
                      ),
                    },
                  ])}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add sentence
                </button>
              </div>
            </div>
          )}

          {!selectedCustomBlock
            && selectedWorksheetTableAttrs
            && selectedWorksheetTablePos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">
                  Table
                </p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Table
                </span>
              </div>

              <label htmlFor="worksheet-table-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="worksheet-table-instruction"
                rows={2}
                value={selectedWorksheetTableAttrs.instruction}
                onChange={(event) => setWorksheetTableAttr(
                  editor,
                  selectedWorksheetTablePos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Hide blank numbers</span>
                  <input
                    type="checkbox"
                    checked={selectedWorksheetTableAttrs.hideBlankNumbers}
                    onChange={(event) => setWorksheetTableAttr(
                      editor,
                      selectedWorksheetTablePos,
                      'hideBlankNumbers',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show first as example</span>
                  <input
                    type="checkbox"
                    checked={selectedWorksheetTableAttrs.showFirstAsExample}
                    onChange={(event) => setWorksheetTableAttr(
                      editor,
                      selectedWorksheetTablePos,
                      'showFirstAsExample',
                      event.target.checked,
                    )}
                  />
                </label>
              </div>

              <label htmlFor="worksheet-table-blank-width" className="mt-4 block text-xs font-semibold text-tertiary">
                Default blank width
              </label>
              <input
                id="worksheet-table-blank-width"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={selectedWorksheetTableAttrs.blankWidthFactor}
                onChange={(event) => {
                  const width = event.currentTarget.valueAsNumber;
                  if (!Number.isFinite(width)) return;
                  setWorksheetTableAttr(
                    editor,
                    selectedWorksheetTablePos,
                    'blankWidthFactor',
                    Math.min(5, Math.max(1, width)),
                  );
                }}
                className="mt-2 w-full border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">
                    Columns
                  </p>
                  <span className="text-[10px] text-quaternary">
                    12-column grid
                  </span>
                </div>
                <div className="mt-2 space-y-2">
                  {selectedWorksheetTableAttrs.columns.map(
                    (column, columnIndex) => (
                      <div
                        className="border border-secondary bg-secondary p-3"
                        key={column.id}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-[10px] tabular-nums text-quaternary">
                            {String(columnIndex + 1).padStart(2, '0')}
                          </span>
                          <label className="flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold text-secondary">
                            <span>Grid Span</span>
                            <input
                              aria-label={`Grid span of table column ${columnIndex + 1}`}
                              type="number"
                              min="1"
                              max="12"
                              step="1"
                              value={worksheetTableColumnSpan(column)}
                              onChange={(event) => {
                                const span = event.currentTarget.valueAsNumber;
                                if (!Number.isFinite(span)) return;
                                updateWorksheetTableColumnSpan(column.id, span);
                              }}
                              className="h-8 w-11 min-w-0 border border-primary bg-primary px-2 text-sm font-normal tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                            />
                          </label>
                          <div
                            aria-label={`Alignment of table column ${columnIndex + 1}`}
                            className="flex items-center gap-0.5"
                            role="group"
                          >
                            {([
                              ['left', TextAlignStart],
                              ['center', TextAlignCenter],
                              ['right', TextAlignEnd],
                            ] as const).map(([alignment, Icon]) => (
                              <button
                                type="button"
                                aria-label={`${alignment} align table column ${columnIndex + 1}`}
                                aria-pressed={(column.align ?? 'left') === alignment}
                                key={alignment}
                                onClick={() => updateWorksheetTableColumns(
                                  selectedWorksheetTableAttrs.columns.map(
                                    (currentColumn) => (
                                      currentColumn.id === column.id
                                        ? { ...currentColumn, align: alignment }
                                        : currentColumn
                                    ),
                                  ),
                                )}
                                className={`flex size-8 items-center justify-center border text-secondary transition ${
                                  (column.align ?? 'left') === alignment
                                    ? 'border-primary bg-active ring-1 ring-inset ring-primary'
                                    : 'border-primary bg-primary hover:bg-primary_hover'
                                }`}
                              >
                                <Icon className="size-4" />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            aria-label={`Delete table column ${columnIndex + 1}`}
                            disabled={
                              selectedWorksheetTableAttrs.columns.length <= 1
                            }
                            onClick={() => updateWorksheetTableColumns(
                              selectedWorksheetTableAttrs.columns.filter(
                                ({ id }) => id !== column.id,
                              ),
                            )}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
                <button
                  type="button"
                  disabled={selectedWorksheetTableAttrs.columns.length >= 6}
                  onClick={() => {
                    const nextIndex = selectedWorksheetTableAttrs.columns.length + 1;
                    const newColumnId = `table-column-${Date.now()}`;
                    const donorIndex = selectedWorksheetTableAttrs.columns
                      .reduce((largestIndex, column, index, columns) => (
                        worksheetTableColumnSpan(column)
                          > worksheetTableColumnSpan(columns[largestIndex])
                          ? index
                          : largestIndex
                      ), 0);
                    updateWorksheetTableColumns([
                      ...selectedWorksheetTableAttrs.columns.map((column, index) => ({
                        ...column,
                        span: index === donorIndex
                          ? Math.max(
                              1,
                              worksheetTableColumnSpan(column) - 1,
                            )
                          : worksheetTableColumnSpan(column),
                      })),
                      {
                        id: newColumnId,
                        label: `Column ${nextIndex}`,
                        span: 1,
                        align: 'left',
                      },
                    ]);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <PlusSquare className="size-4" />
                  Add column
                </button>
              </div>

              <div className="mt-5 border-t border-secondary pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-tertiary">Rows</p>
                  <span className="text-[10px] tabular-nums text-quaternary">
                    {selectedWorksheetTableAttrs.rows.length}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5 text-quaternary">
                  Use Cmd+B or Ctrl+B for bold and
                  {' '}<code className="bg-secondary px-1 py-0.5">
                    {'{{blank:answer}}'}
                  </code>{' '}for blanks.
                </p>

                <div className="mt-3 space-y-3">
                  {selectedWorksheetTableAttrs.rows.map((row, rowIndex) => (
                    <div
                      className="border border-secondary bg-secondary p-3"
                      key={row.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                          {String(rowIndex + 1).padStart(2, '0')}
                        </span>
                        {selectedWorksheetTableAttrs.columns[0] && (
                          <InlineFormattedInput
                            ariaLabel={`Table row ${rowIndex + 1}, column 1`}
                            value={
                              row.cells[
                                selectedWorksheetTableAttrs.columns[0].id
                              ] ?? ''
                            }
                            onChange={(value) => updateWorksheetTableCell(
                              row.id,
                              selectedWorksheetTableAttrs.columns[0].id,
                              value,
                            )}
                            className="custom-block__inline-formatted-input min-h-9 min-w-0 flex-1 border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                          />
                        )}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Move table row ${rowIndex + 1} up`}
                            disabled={rowIndex === 0}
                            onClick={() => moveWorksheetTableRow(rowIndex, -1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move table row ${rowIndex + 1} down`}
                            disabled={
                              rowIndex
                              === selectedWorksheetTableAttrs.rows.length - 1
                            }
                            onClick={() => moveWorksheetTableRow(rowIndex, 1)}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete table row ${rowIndex + 1}`}
                            disabled={
                              selectedWorksheetTableAttrs.rows.length <= 1
                            }
                            onClick={() => updateWorksheetTableRows(
                              selectedWorksheetTableAttrs.rows.filter(
                                ({ id }) => id !== row.id,
                              ),
                            )}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2">
                        <span
                          aria-hidden="true"
                          className="invisible w-5 bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums"
                        >
                          00
                        </span>
                        <div className="min-w-0 space-y-2">
                          {selectedWorksheetTableAttrs.columns.slice(1).map(
                            (column, columnIndex) => (
                              <label
                                className="block text-[10px] font-medium text-quaternary"
                                key={column.id}
                              >
                                <span className="block truncate">
                                  {stripInlineFormatting(column.label)
                                    || `Column ${columnIndex + 2}`}
                                </span>
                                <InlineFormattedInput
                                  ariaLabel={`Table row ${rowIndex + 1}, column ${columnIndex + 2}`}
                                  value={row.cells[column.id] ?? ''}
                                  onChange={(value) => updateWorksheetTableCell(
                                    row.id,
                                    column.id,
                                    value,
                                  )}
                                  className="custom-block__inline-formatted-input mt-1 min-h-9 w-full border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                                />
                              </label>
                            ),
                          )}
                        </div>
                        <label className="mb-2 flex shrink-0 items-center gap-1.5 text-xs font-semibold text-tertiary">
                          <input
                            type="checkbox"
                            checked={row.isHeader}
                            onChange={(event) => updateWorksheetTableRows(
                              selectedWorksheetTableAttrs.rows.map(
                                (currentRow) => currentRow.id === row.id
                                  ? {
                                      ...currentRow,
                                      isHeader: event.target.checked,
                                    }
                                  : currentRow,
                              ),
                            )}
                          />
                          <span>Header</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => updateWorksheetTableRows([
                    ...selectedWorksheetTableAttrs.rows,
                    {
                      id: `table-row-${Date.now()}`,
                      isHeader: false,
                      cells: Object.fromEntries(
                        selectedWorksheetTableAttrs.columns.map(
                          ({ id }) => [id, ''],
                        ),
                      ),
                    },
                  ])}
                  className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                >
                  <PlusSquare className="size-4" />
                  Add row
                </button>
              </div>
            </div>
          )}

          {!selectedCustomBlock
            && selectedRewriteSentencesAttrs
            && selectedRewriteSentencesPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Rewrite Sentences</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Rewrite</span>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedRewriteSentencesAttrs.showFirstAsExample}
                  onChange={(event) => setRewriteSentencesAttr(
                    editor,
                    selectedRewriteSentencesPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4 space-y-3">
                {selectedRewriteSentencesAttrs.items.map((item, itemIndex) => (
                  <div className="rounded-lg border border-secondary bg-secondary p-3" key={item.id}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tabular-nums text-quaternary">
                        Item {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <button
                        type="button"
                        aria-label={`Delete sentence ${itemIndex + 1}`}
                        disabled={selectedRewriteSentencesAttrs.items.length <= 1}
                        onClick={() => updateRewriteSentenceItems(
                          selectedRewriteSentencesAttrs.items.filter(
                            ({ id }) => id !== item.id,
                          ),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                      Input
                    </label>
                    <textarea
                      aria-label={`Input sentence ${itemIndex + 1}`}
                      rows={2}
                      value={item.input}
                      onChange={(event) => updateRewriteSentenceItem(item.id, {
                        input: event.target.value,
                      })}
                      className="mt-1 w-full resize-y border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    {rewriteWordBankMode(item.input) !== 'automatic' && (
                      <>
                        <label className="mt-2 block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                          Solution
                        </label>
                        <textarea
                          aria-label={`Solution ${itemIndex + 1}`}
                          rows={2}
                          value={item.solution}
                          onChange={(event) => updateRewriteSentenceItem(item.id, {
                            solution: event.target.value,
                          })}
                          className="mt-1 w-full resize-y border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                        />
                      </>
                    )}
                    <div className="mt-3">
                      <span className="block text-[10px] font-medium uppercase tracking-wide text-quaternary">
                        Image
                      </span>
                      {item.image ? (
                        <div className="mt-1.5 flex items-center gap-2 border border-primary bg-primary p-2">
                          <img
                            alt={item.image.alt}
                            className="size-12 rounded object-cover"
                            src={item.image.src}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-secondary">
                              {item.image.alt || 'Worksheet image'}
                            </p>
                            <button
                              className="mt-1 text-xs font-semibold text-brand-secondary hover:text-brand-secondary_hover"
                              onClick={() => setRewriteImageItemId(item.id)}
                              type="button"
                            >
                              Replace
                            </button>
                          </div>
                          <button
                            aria-label={`Remove image from sentence ${itemIndex + 1}`}
                            className="text-quaternary transition hover:text-error-primary"
                            onClick={() => updateRewriteSentenceItem(item.id, {
                              image: undefined,
                            })}
                            type="button"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="mt-1.5 flex w-full items-center justify-center gap-2 border border-primary bg-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
                          onClick={() => setRewriteImageItemId(item.id)}
                          type="button"
                        >
                          <Image01 className="size-4 text-quaternary" />
                          Add image
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addRewriteSentenceItem}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add sentence
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedDialogueAttrs && selectedDialoguePos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Dialogue</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Dialogue</span>
              </div>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedDialogueAttrs.showFirstAsExample}
                  onChange={(event) => setDialogueAttr(
                    editor,
                    selectedDialoguePos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show original</span>
                <input
                  type="checkbox"
                  checked={selectedDialogueAttrs.showOriginal}
                  onChange={(event) => setDialogueAttr(
                    editor,
                    selectedDialoguePos,
                    'showOriginal',
                    event.target.checked,
                  )}
                />
              </label>
              <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show word bank</span>
                <input
                  type="checkbox"
                  checked={selectedDialogueAttrs.showWordBank}
                  onChange={(event) => setDialogueAttr(
                    editor,
                    selectedDialoguePos,
                    'showWordBank',
                    event.target.checked,
                  )}
                />
              </label>
              <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Hide blank numbers</span>
                <input
                  type="checkbox"
                  checked={selectedDialogueAttrs.hideBlankNumbers}
                  onChange={(event) => setDialogueAttr(
                    editor,
                    selectedDialoguePos,
                    'hideBlankNumbers',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4 space-y-3">
                {selectedDialogueAttrs.items.map((item, itemIndex) => (
                  <div className="rounded-lg border border-secondary bg-secondary p-3" key={item.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-[10px] tabular-nums text-quaternary">
                        {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <select
                        aria-label={`Speaker for dialogue row ${itemIndex + 1}`}
                        value={item.speaker}
                        onChange={(event) => updateDialogueItem(item.id, {
                          speaker: Number(event.target.value) as DialogueSpeaker,
                        })}
                        className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm font-medium text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      >
                        {[1, 2, 3, 4].map((speaker) => (
                          <option key={speaker} value={speaker}>Speaker {speaker}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        aria-label={`Delete dialogue row ${itemIndex + 1}`}
                        disabled={selectedDialogueAttrs.items.length <= 1}
                        onClick={() => updateDialogueItems(
                          selectedDialogueAttrs.items.filter(({ id }) => id !== item.id),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <textarea
                      aria-label={`Dialogue text ${itemIndex + 1}`}
                      rows={3}
                      value={item.text}
                      onChange={(event) => updateDialogueItem(item.id, {
                        text: event.target.value,
                      })}
                      className="mt-2 ml-7 w-[calc(100%_-_1.75rem)] resize-y border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addDialogueItem}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add dialogue row
              </button>
            </div>
          )}

          {selectedCustomHeadingAttrs && selectedCustomHeadingPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Heading</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  H{selectedCustomHeadingAttrs.level}
                </span>
              </div>

              <label htmlFor="custom-heading-text" className="mt-4 block text-xs font-semibold text-tertiary">
                Text
              </label>
              <input
                id="custom-heading-text"
                value={selectedCustomHeadingAttrs.text}
                onChange={(event) => setCustomHeadingAttr(
                  editor,
                  selectedCustomHeadingPos,
                  'text',
                  event.target.value,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label htmlFor="custom-heading-level" className="mt-4 block text-xs font-semibold text-tertiary">
                Level
              </label>
              <select
                id="custom-heading-level"
                value={selectedCustomHeadingAttrs.level}
                onChange={(event) => setCustomHeadingAttr(
                  editor,
                  selectedCustomHeadingPos,
                  'level',
                  Number(event.target.value) as CustomHeadingLevel,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <option key={level} value={level}>H{level}</option>
                ))}
              </select>

              <label htmlFor="custom-heading-gap-after" className="mt-4 block text-xs font-semibold text-tertiary">
                Gap after
              </label>
              <select
                id="custom-heading-gap-after"
                value={selectedCustomHeadingAttrs.gapAfter}
                onChange={(event) => setCustomHeadingAttr(
                  editor,
                  selectedCustomHeadingPos,
                  'gapAfter',
                  Number(event.target.value) as CustomHeadingGapAfter,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value={1}>1×</option>
                <option value={2}>2×</option>
                <option value={3}>3×</option>
              </select>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-tertiary">Numbered</p>
                  <p className="mt-0.5 text-xs text-quaternary">Uses the active brand format.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedCustomHeadingAttrs.numbered}
                  onClick={() => setCustomHeadingAttr(
                    editor,
                    selectedCustomHeadingPos,
                    'numbered',
                    !selectedCustomHeadingAttrs.numbered,
                  )}
                  className={cx(
                    'relative h-6 w-11 shrink-0 border transition',
                    selectedCustomHeadingAttrs.numbered
                      ? 'border-brand bg-brand-solid'
                      : 'border-primary bg-quaternary',
                  )}
                >
                  <span
                    className={cx(
                      'absolute top-0.5 size-4.5 bg-primary shadow-xs transition-transform',
                      selectedCustomHeadingAttrs.numbered
                        ? 'translate-x-4.5'
                        : 'translate-x-0.5',
                    )}
                  />
                </button>
              </div>
            </div>
          )}

          {!selectedCustomBlock
            && selectedGlossaryTermsAttrs
            && selectedGlossaryTermsPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Glossary terms</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Glossary</span>
              </div>

              <label htmlFor="glossary-term-width" className="mt-4 block text-xs font-semibold text-tertiary">
                Term column width
              </label>
              <select
                id="glossary-term-width"
                value={selectedGlossaryTermsAttrs.termWidth}
                onChange={(event) => setGlossaryTermsAttr(
                  editor,
                  selectedGlossaryTermsPos,
                  'termWidth',
                  Number(event.target.value) as GlossaryTermWidth,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value={25}>25%</option>
                <option value={33}>33%</option>
                <option value={50}>50%</option>
                <option value={66}>66%</option>
              </select>

              <div className="mt-5 space-y-3">
                {selectedGlossaryTermsAttrs.terms.map((item, itemIndex) => (
                  <div className="rounded-lg border border-secondary bg-secondary p-3" key={item.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 shrink-0 text-[10px] tabular-nums text-quaternary">
                        {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <input
                        aria-label={`Term ${itemIndex + 1}`}
                        value={item.term}
                        onChange={(event) => updateGlossaryTerm(item.id, { term: event.target.value })}
                        placeholder="Term"
                        className="min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete glossary term ${itemIndex + 1}`}
                        disabled={selectedGlossaryTermsAttrs.terms.length <= 1}
                        onClick={() => updateGlossaryTerms(
                          selectedGlossaryTermsAttrs.terms.filter(({ id }) => id !== item.id),
                        )}
                        className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        <Trash01 className="size-4" />
                      </button>
                    </div>
                    <textarea
                      aria-label={`Definition ${itemIndex + 1}`}
                      rows={2}
                      value={item.definition}
                      onChange={(event) => updateGlossaryTerm(item.id, { definition: event.target.value })}
                      placeholder="Definition"
                      className="mt-2 ml-7 w-[calc(100%_-_1.75rem)] resize-y rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <textarea
                      aria-label={`Example ${itemIndex + 1}`}
                      rows={2}
                      value={item.example}
                      onChange={(event) => updateGlossaryTerm(item.id, { example: event.target.value })}
                      placeholder="Example"
                      className="mt-2 ml-7 w-[calc(100%_-_1.75rem)] resize-y rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addGlossaryTerm}
                className="mt-3 w-full rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                + Add glossary term
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedOrderingAttrs && selectedOrderingPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Ordering / sequencing</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Sequence</span>
              </div>

              <label htmlFor="ordering-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="ordering-instruction"
                rows={2}
                value={selectedOrderingAttrs.instruction}
                onChange={(event) => setOrderingAttr(
                  editor,
                  selectedOrderingPos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-4 space-y-3">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Shuffle order</span>
                  <input
                    type="checkbox"
                    checked={selectedOrderingAttrs.shuffleItems}
                    onChange={(event) => setOrderingAttr(
                      editor,
                      selectedOrderingPos,
                      'shuffleItems',
                      event.target.checked,
                    )}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                  <span>Show example</span>
                  <input
                    type="checkbox"
                    checked={selectedOrderingAttrs.showRandomAsExample}
                    onChange={(event) => setOrderingAttr(
                      editor,
                      selectedOrderingPos,
                      'showRandomAsExample',
                      event.target.checked,
                    )}
                  />
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-tertiary">
                    Correct order
                  </p>
                  <p className="mt-1 text-xs text-quaternary">
                    Arrange these as the answer sequence.
                  </p>
                </div>
                <span className="text-[10px] tabular-nums text-quaternary">
                  {selectedOrderingAttrs.items.length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {selectedOrderingAttrs.items.map((item, itemIndex) => (
                  <div
                    className="rounded-lg border border-secondary bg-secondary p-3"
                    key={item.id}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                        {String(itemIndex + 1).padStart(2, '0')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`Move ordering item ${itemIndex + 1} up`}
                          disabled={itemIndex === 0}
                          onClick={() => moveOrderingItem(itemIndex, -1)}
                          className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronUp className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Move ordering item ${itemIndex + 1} down`}
                          disabled={itemIndex === selectedOrderingAttrs.items.length - 1}
                          onClick={() => moveOrderingItem(itemIndex, 1)}
                          className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronDown className="size-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ordering item ${itemIndex + 1}`}
                          disabled={selectedOrderingAttrs.items.length <= 2}
                          onClick={() => updateOrderingItems(
                            selectedOrderingAttrs.items.filter(
                              ({ id }) => id !== item.id,
                            ),
                          )}
                          className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash01 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <InlineFormattedInput
                      ariaLabel={`Ordering item ${itemIndex + 1}`}
                      multiline
                      value={item.text}
                      onChange={(value) => updateOrderingItem(item.id, value)}
                      placeholder="Enter a step, event, or sentence"
                      className="mt-2 min-h-16 w-full whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none empty:before:pointer-events-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => updateOrderingItems([
                  ...selectedOrderingAttrs.items,
                  {
                    id: `ordering-${Date.now()}`,
                    text: `Step ${selectedOrderingAttrs.items.length + 1}`,
                  },
                ])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                <PlusSquare className="size-4" />
                Add item
              </button>

              <button
                type="button"
                disabled={!selectedOrderingAttrs.shuffleItems}
                onClick={() => setOrderingAttr(
                  editor,
                  selectedOrderingPos,
                  'generation',
                  selectedOrderingAttrs.generation + 1,
                )}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reshuffle learner view
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedLearningObjectiveAttrs
            && selectedLearningObjectivePos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">
                  Learning objective box
                </p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">
                  Objective
                </span>
              </div>

              <label htmlFor="learning-objective-title" className="mt-4 block text-xs font-semibold text-tertiary">
                Heading
              </label>
              <input
                id="learning-objective-title"
                value={selectedLearningObjectiveAttrs.title}
                onChange={(event) => setLearningObjectiveAttr(
                  editor,
                  selectedLearningObjectivePos,
                  'title',
                  event.target.value,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label htmlFor="learning-objective-code" className="mt-4 block text-xs font-semibold text-tertiary">
                Curriculum code
              </label>
              <input
                id="learning-objective-code"
                value={selectedLearningObjectiveAttrs.curriculumCode}
                onChange={(event) => setLearningObjectiveAttr(
                  editor,
                  selectedLearningObjectivePos,
                  'curriculumCode',
                  event.target.value,
                )}
                placeholder="Optional code"
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label className="mt-4 block text-xs font-semibold text-tertiary">
                Objective
              </label>
              <InlineFormattedInput
                ariaLabel="Learning objective"
                multiline
                value={selectedLearningObjectiveAttrs.objective}
                onChange={(value) => setLearningObjectiveAttr(
                  editor,
                  selectedLearningObjectivePos,
                  'objective',
                  value,
                )}
                placeholder="What should learners know or be able to do?"
                className="mt-2 min-h-20 w-full whitespace-pre-wrap rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:pointer-events-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <div className="mt-5 flex items-center justify-between">
                <p className="text-xs font-semibold text-tertiary">
                  Success criteria
                </p>
                <span className="text-[10px] tabular-nums text-quaternary">
                  {selectedLearningObjectiveAttrs.successCriteria.length}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {selectedLearningObjectiveAttrs.successCriteria.map(
                  (criterion, criterionIndex) => (
                    <div
                      className="rounded-lg border border-secondary bg-secondary p-3"
                      key={criterion.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                          {String(criterionIndex + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            aria-label={`Move success criterion ${criterionIndex + 1} up`}
                            disabled={criterionIndex === 0}
                            onClick={() => moveSuccessCriterion(
                              criterionIndex,
                              -1,
                            )}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronUp className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Move success criterion ${criterionIndex + 1} down`}
                            disabled={
                              criterionIndex
                              === selectedLearningObjectiveAttrs
                                .successCriteria.length - 1
                            }
                            onClick={() => moveSuccessCriterion(
                              criterionIndex,
                              1,
                            )}
                            className="text-quaternary transition hover:text-secondary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <ChevronDown className="size-4" />
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete success criterion ${criterionIndex + 1}`}
                            disabled={
                              selectedLearningObjectiveAttrs
                                .successCriteria.length <= 1
                            }
                            onClick={() => updateSuccessCriteria(
                              selectedLearningObjectiveAttrs.successCriteria
                                .filter(({ id }) => id !== criterion.id),
                            )}
                            className="text-quaternary transition hover:text-error-primary disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash01 className="size-4" />
                          </button>
                        </div>
                      </div>
                      <InlineFormattedInput
                        ariaLabel={`Success criterion ${criterionIndex + 1}`}
                        multiline
                        value={criterion.text}
                        onChange={(value) => updateSuccessCriterion(
                          criterion.id,
                          value,
                        )}
                        placeholder="Learners can…"
                        className="mt-2 min-h-16 w-full whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none empty:before:pointer-events-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                    </div>
                  ),
                )}
              </div>

              <button
                type="button"
                onClick={() => updateSuccessCriteria([
                  ...selectedLearningObjectiveAttrs.successCriteria,
                  {
                    id: `criterion-${Date.now()}`,
                    text: 'I can…',
                  },
                ])}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover"
              >
                <PlusSquare className="size-4" />
                Add success criterion
              </button>
            </div>
          )}

          {!selectedCustomBlock
            && selectedFrayerModelAttrs && selectedFrayerModelPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Frayer model</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Organizer</span>
              </div>

              <label htmlFor="frayer-instruction" className="mt-4 block text-xs font-semibold text-tertiary">
                Instruction
              </label>
              <textarea
                id="frayer-instruction"
                rows={2}
                value={selectedFrayerModelAttrs.instruction}
                onChange={(event) => setFrayerModelAttr(
                  editor,
                  selectedFrayerModelPos,
                  'instruction',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label htmlFor="frayer-concept" className="mt-4 block text-xs font-semibold text-tertiary">
                Central concept
              </label>
              <input
                id="frayer-concept"
                value={selectedFrayerModelAttrs.concept}
                onChange={(event) => setFrayerModelAttr(
                  editor,
                  selectedFrayerModelPos,
                  'concept',
                  event.target.value,
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />

              <label htmlFor="frayer-response-lines" className="mt-4 block text-xs font-semibold text-tertiary">
                Response space
              </label>
              <select
                id="frayer-response-lines"
                value={selectedFrayerModelAttrs.responseLines}
                onChange={(event) => setFrayerModelAttr(
                  editor,
                  selectedFrayerModelPos,
                  'responseLines',
                  Number(event.target.value),
                )}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                <option value={1}>Compact</option>
                <option value={2}>Small</option>
                <option value={3}>Medium</option>
                <option value={4}>Large</option>
                <option value={5}>Extra large</option>
                <option value={6}>Maximum</option>
              </select>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show model answers</span>
                <input
                  type="checkbox"
                  checked={selectedFrayerModelAttrs.showModelAnswers}
                  onChange={(event) => setFrayerModelAttr(
                    editor,
                    selectedFrayerModelPos,
                    'showModelAnswers',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-5 space-y-3">
                {selectedFrayerModelAttrs.quadrants.map((quadrant) => (
                  <div className="rounded-lg border border-secondary bg-secondary p-3" key={quadrant.id}>
                    <input
                      aria-label={`${quadrant.label} heading`}
                      value={quadrant.label}
                      onChange={(event) => updateFrayerQuadrant(
                        quadrant.id,
                        { label: event.target.value },
                      )}
                      className="w-full rounded-md border border-primary bg-primary px-2.5 py-2 text-sm font-semibold text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <InlineFormattedInput
                      ariaLabel={`${quadrant.label} model answer`}
                      multiline
                      value={quadrant.answer}
                      onChange={(value) => updateFrayerQuadrant(
                        quadrant.id,
                        { answer: value },
                      )}
                      placeholder="Optional model answer"
                      className="mt-2 min-h-24 w-full whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none empty:before:pointer-events-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-5 text-quaternary">
                Model answers appear when worksheet solutions are enabled.
              </p>
            </div>
          )}

          {!selectedCustomBlock
            && selectedFillInTheBlankAttrs
            && selectedFillInTheBlankPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Fill in the blank</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">Blank</span>
              </div>

              <label htmlFor="fill-blank-text" className="mt-4 block text-xs font-semibold text-tertiary">Text</label>
              <textarea
                id="fill-blank-text"
                rows={7}
                value={selectedFillInTheBlankAttrs.text}
                onChange={(event) => setFillInTheBlankAttr(
                  editor,
                  selectedFillInTheBlankPos,
                  'text',
                  event.target.value,
                )}
                className="mt-2 w-full resize-y rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <p className="mt-2 text-xs leading-5 text-quaternary">
                Insert a blank with <code className="rounded bg-secondary px-1 py-0.5">{'{{blank:answer}}'}</code>.
                Add a width factor with <code className="rounded bg-secondary px-1 py-0.5">{'{{blank:answer|1.5}}'}</code>.
              </p>

              <label htmlFor="fill-blank-width-factor" className="mt-4 block text-xs font-semibold text-tertiary">
                General width
              </label>
              <input
                id="fill-blank-width-factor"
                type="number"
                min="1"
                max="5"
                step="0.1"
                value={selectedFillInTheBlankAttrs.widthFactor}
                onChange={(event) => {
                  const value = event.currentTarget.valueAsNumber;
                  if (!Number.isFinite(value)) return;
                  setFillInTheBlankAttr(
                    editor,
                    selectedFillInTheBlankPos,
                    'widthFactor',
                    Math.min(Math.max(value, 1), 5),
                  );
                }}
                className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <p className="mt-1.5 text-xs leading-5 text-quaternary">
                Applies to all blanks without an explicit <code className="rounded bg-secondary px-1 py-0.5">|X.Y</code> factor.
              </p>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show first as example</span>
                <input
                  type="checkbox"
                  checked={selectedFillInTheBlankAttrs.showFirstAsExample}
                  onChange={(event) => setFillInTheBlankAttr(
                    editor,
                    selectedFillInTheBlankPos,
                    'showFirstAsExample',
                    event.target.checked,
                  )}
                />
              </label>

              <label className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Show word bank</span>
                <input
                  type="checkbox"
                  checked={selectedFillInTheBlankAttrs.showWordBank}
                  onChange={(event) => setFillInTheBlankAttr(
                    editor,
                    selectedFillInTheBlankPos,
                    'showWordBank',
                    event.target.checked,
                  )}
                />
              </label>

              <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-tertiary">
                <span>Hide blank numbers</span>
                <input
                  type="checkbox"
                  checked={selectedFillInTheBlankAttrs.hideBlankNumbers}
                  onChange={(event) => setFillInTheBlankAttr(
                    editor,
                    selectedFillInTheBlankPos,
                    'hideBlankNumbers',
                    event.target.checked,
                  )}
                />
              </label>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-tertiary">Detected answers</span>
                  <span className="text-[10px] text-quaternary">
                    {fillInTheBlankAnswers.length}
                  </span>
                </div>
                {fillInTheBlankAnswers.length ? (
                  <div className="mt-2 space-y-1.5">
                    {fillInTheBlankAnswers.map((part) => (
                      <div
                        className="flex items-center gap-2 rounded-md bg-secondary px-2.5 py-2"
                        key={`${part.index}-${part.answer}`}
                      >
                        <span className="text-[10px] tabular-nums text-quaternary">
                          {String(part.index).padStart(2, '0')}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-medium text-secondary">
                          {part.answer}
                        </span>
                        {part.widthFactor !== 1 && (
                          <span className="text-[10px] tabular-nums text-quaternary">
                            ×{part.widthFactor}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-quaternary">No valid blank markers found.</p>
                )}
              </div>
            </div>
          )}

          {selectedPageBreakPos !== null && (
            <div>
              <p className="text-xs font-semibold text-quaternary">
                Page break
              </p>
              <Toggle
                className="mt-3"
                label="Restart pagination"
                isSelected={Boolean(selectedPageBreakRestartPagination)}
                onChange={updateSelectedPageBreakRestartPagination}
              />
              <button
                type="button"
                onClick={deleteSelectedPageBreak}
                className="mt-3 flex w-full items-center justify-center gap-2 border border-primary px-3 py-2 text-xs font-semibold text-error-primary transition hover:bg-error-primary"
              >
                <Trash01 className="size-4" />
                Delete page break
              </button>
            </div>
          )}

          {selectedCustomBlock && currentUserRole !== null && currentUserRole !== 'user' && (
            <div className="border-t border-secondary pt-5">
              <button
                type="button"
                disabled={exportingBlockPNG}
                onClick={() => void exportSelectedBlockPNG()}
                className="flex w-full items-center justify-start gap-2 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-primary_hover disabled:cursor-wait disabled:opacity-50"
              >
                {exportingBlockPNG
                  ? <Loading01 className="size-4 animate-spin" />
                  : <Download01 className="size-4" />}
                {exportingBlockPNG ? 'Exporting PNG…' : 'Export PNG'}
              </button>
              <p className="mt-2 text-xs leading-5 text-quaternary">
                Exports this block at 3× resolution with surrounding space.
              </p>
              {blockExportError && (
                <p role="alert" className="mt-2 text-xs text-error-primary">
                  {blockExportError}
                </p>
              )}
            </div>
          )}

          {!selectedCustomBlock && (
            <>
            <div>
              <p className="text-xs font-semibold text-quaternary">
                Document context
              </p>
              <div className="mt-3 rounded-lg border border-secondary bg-secondary p-2.5">
                <label className="block text-xs font-semibold text-tertiary">
                  Context profile
                  <select
                    value={documentContext.sourceProfileId ?? ''}
                    onChange={(event) => {
                      if (event.target.value) {
                        loadDocumentContextProfile(event.target.value);
                      }
                    }}
                    className="mt-1.5 w-full rounded-md border border-primary bg-primary px-2.5 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  >
                    <option value="">No profile loaded</option>
                    {contextProfiles.some(({ isSystemTemplate }) => (
                      isSystemTemplate
                    )) && (
                      <optgroup label="Templates">
                        {contextProfiles
                          .filter(({ isSystemTemplate }) => isSystemTemplate)
                          .map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                    {contextProfiles.some(({ isSystemTemplate }) => (
                      !isSystemTemplate
                    )) && (
                      <optgroup label="Your profiles">
                        {contextProfiles
                          .filter(({ isSystemTemplate }) => !isSystemTemplate)
                          .map((profile) => (
                            <option key={profile.id} value={profile.id}>
                              {profile.name}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!documentContext.sourceProfileId}
                    onClick={resetDocumentContextProfile}
                    className="rounded-md border border-primary px-2 py-1.5 text-xs font-semibold text-secondary hover:bg-primary_hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Reset profile
                  </button>
                  <button
                    type="button"
                    onClick={() => void saveDocumentContextAsProfile()}
                    className="rounded-md border border-primary px-2 py-1.5 text-xs font-semibold text-secondary hover:bg-primary_hover"
                  >
                    Save as profile
                  </button>
                  <button
                    type="button"
                    onClick={clearDocumentContext}
                    className="col-span-2 rounded-md px-2 py-1 text-xs font-semibold text-error-primary hover:bg-error-primary"
                  >
                    Clear context
                  </button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-tertiary">
                    Context PDF
                  </p>
                  {documentContext.contextPdfName && (
                    <button
                      type="button"
                      onClick={removeContextPdf}
                      className="text-xs font-semibold text-error-primary hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <input
                  ref={contextPdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void uploadContextPdf(file);
                  }}
                />
                <button
                  type="button"
                  disabled={uploadingContextPdf}
                  onClick={() => contextPdfInputRef.current?.click()}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setContextPdfDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'copy';
                    setContextPdfDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                      setContextPdfDragActive(false);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    setContextPdfDragActive(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) void uploadContextPdf(file);
                  }}
                  className={cx(
                    'mt-1.5 flex w-full items-center gap-3 rounded-md border border-dashed px-3 py-3 text-left transition',
                    contextPdfDragActive
                      ? 'border-brand bg-brand-primary'
                      : 'border-primary bg-primary hover:bg-primary_hover',
                    uploadingContextPdf && 'cursor-wait opacity-60',
                  )}
                >
                  {uploadingContextPdf
                    ? <Loading01 className="size-5 shrink-0 animate-spin text-brand-secondary" />
                    : <FileUp className="size-5 shrink-0 text-brand-secondary" />}
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-secondary">
                      {uploadingContextPdf
                        ? 'Reading PDF…'
                        : documentContext.contextPdfName || 'Upload or drop a PDF'}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-4 text-quaternary">
                      {documentContext.contextPdfName
                        ? documentContext.contextPdfText.length === 40_000
                          ? 'Re-upload once to index the complete PDF'
                          : `${
                            documentContext.contextPdfPageCount
                              ? `${documentContext.contextPdfPageCount} pages · `
                              : ''
                          }Click or drop to replace`
                        : 'PDF up to 10 MB · extracted text is used by AI'}
                    </span>
                  </span>
                </button>
                {contextPdfError && (
                  <p
                    role="status"
                    className="mt-1.5 text-xs leading-5 text-error-primary"
                  >
                    {contextPdfError}
                  </p>
                )}
              </div>
              <div className="mt-3 space-y-3">
                <fieldset>
                  <legend className="text-xs font-semibold text-tertiary">
                    Worksheet language
                  </legend>
                  <select
                    value={documentContext.worksheetLanguage}
                    onChange={(event) => updateDocumentContext({
                      worksheetLanguage: event.target.value as
                        WorksheetContext['worksheetLanguage'],
                    })}
                    className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  >
                    <option value="en">EN</option>
                    <option value="de-formal">DE formell</option>
                    <option value="de-informal">DE informell</option>
                  </select>
                </fieldset>

                <label className="block text-xs font-semibold text-tertiary">
                  Subject
                  <span className="mt-1.5 block font-normal">
                    <SearchSelect
                      ariaLabel="Subject"
                      value={documentContext.subject}
                      placeholder="Select a subject"
                      options={SUBJECT_OPTIONS}
                      onChange={(subject) => updateDocumentContext({
                        subject,
                        customSubject: subject === 'other'
                          ? documentContext.customSubject
                          : '',
                      })}
                    />
                  </span>
                </label>
                {documentContext.subject === 'other' && (
                  <label className="block text-xs font-semibold text-tertiary">
                    Other subject
                    <input
                      type="text"
                      value={documentContext.customSubject}
                      placeholder="Enter the subject"
                      onChange={(event) => updateDocumentContext({
                        customSubject: event.target.value,
                      })}
                      className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </label>
                )}

                <label className="block text-xs font-semibold text-tertiary">
                  Learner stage
                  <select
                    value={documentContext.learnerStage}
                    onChange={(event) => updateDocumentContext({
                      learnerStage: event.target.value,
                    })}
                    className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  >
                    <option value="">Not specified</option>
                    {LEARNER_STAGE_OPTIONS.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>

                <fieldset>
                  <legend className="text-xs font-semibold text-tertiary">
                    Typical age range
                  </legend>
                  <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                    <input
                      aria-label="Minimum learner age"
                      type="number"
                      min={0}
                      max={120}
                      value={documentContext.ageMin ?? ''}
                      placeholder="Min"
                      onChange={(event) => updateDocumentContext({
                        ageMin: event.target.value === ''
                          ? null
                          : Math.min(120, Math.max(0, Number(event.target.value))),
                      })}
                      className="min-w-0 rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                    <span className="text-xs text-quaternary">to</span>
                    <input
                      aria-label="Maximum learner age"
                      type="number"
                      min={0}
                      max={120}
                      value={documentContext.ageMax ?? ''}
                      placeholder="Max"
                      onChange={(event) => updateDocumentContext({
                        ageMax: event.target.value === ''
                          ? null
                          : Math.min(120, Math.max(0, Number(event.target.value))),
                      })}
                      className="min-w-0 rounded-md border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </div>
                </fieldset>

                <label className="block text-xs font-semibold text-tertiary">
                  Content language
                  <input
                    type="text"
                    value={documentContext.contentLanguage}
                    placeholder="e.g. German (de-CH)"
                    onChange={(event) => updateDocumentContext({
                      contentLanguage: event.target.value,
                    })}
                    className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>

                <details className="border-t border-secondary pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-secondary">
                    More context
                  </summary>
                  <div className="mt-3 space-y-3">
                    {([
                      ['country', 'Country / education system', 'e.g. Switzerland'],
                      ['localLevel', 'Local level', 'e.g. Sekundarstufe I'],
                      ['curriculum', 'Curriculum', 'Name or curriculum code'],
                      ['languageLevel', 'Language proficiency', 'e.g. CEFR A2'],
                    ] as const).map(([key, label, placeholder]) => (
                      <label
                        className="block text-xs font-semibold text-tertiary"
                        key={key}
                      >
                        {label}
                        <input
                          type="text"
                          value={documentContext[key]}
                          placeholder={placeholder}
                          onChange={(event) => updateDocumentContext({
                            [key]: event.target.value,
                          })}
                          className="mt-1.5 w-full rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                        />
                      </label>
                    ))}
                    <label className="block text-xs font-semibold text-tertiary">
                      Learner context
                      <textarea
                        rows={3}
                        value={documentContext.learnerContext}
                        placeholder="Relevant needs, prior knowledge, or learning situation"
                        onChange={(event) => updateDocumentContext({
                          learnerContext: event.target.value,
                        })}
                        className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                    </label>
                  </div>
                </details>
              </div>
            </div>

            <div className="border-t border-secondary pt-5">
            <div>
            <label htmlFor="doc-size" className="text-xs font-semibold text-quaternary">Document size</label>
            <select
              id="doc-size"
              value={docSize}
              onChange={(e) => handleDocSize(e.target.value)}
              className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
            >
              {DOC_SIZES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          </div>

          <div>
            <label htmlFor="doc-brand" className="text-xs font-semibold text-quaternary">
              Brand
            </label>
            <select
              id="doc-brand"
              disabled={!brandProfilesLoaded}
              value={brandProfileId ?? ''}
              onChange={(event) => {
                void handleBrandProfile(event.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
            >
              <option value="">{brandProfilesLoaded ? 'Default brand (Eduit)' : 'Loading brand…'}</option>
              {brandProfilesLoaded && brandProfileId
                && !brandProfiles.some(({ id }) => id === brandProfileId) && (
                <option value={brandProfileId}>Saved brand unavailable</option>
              )}
              {brandProfiles.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}{brand.isDefault ? ' · Default' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-quaternary">
                Show solutions
              </p>
            </div>
            <input
              type="checkbox"
              checked={showSolutions}
              onChange={(event) => {
                void handleShowSolutions(event.target.checked);
              }}
            />
          </div>

          <div className="border-t border-secondary pt-5">
            <p className="text-xs font-semibold text-quaternary">Status</p>
            <div className="mt-3 flex items-center gap-2 text-sm text-tertiary">
              <span className="size-2 rounded-full bg-fg-success-primary" />
              Draft · autosaved locally
            </div>
          </div>

          <div className="border-t border-secondary pt-5">
            <p className="text-xs font-semibold text-quaternary">Actions</p>
            <div className="mt-3 flex flex-col gap-2">
              {availableVerbTableVerbs.length > 0 && (
                <Button
                  color="primary"
                  size="md"
                  iconLeading={<PlusSquare className="size-4.5" />}
                  onPress={() => {
                    if (ADDITIONAL_WORKSHEET_LEVELS.includes(
                      documentContext.languageLevel as typeof ADDITIONAL_WORKSHEET_LEVELS[number],
                    )) {
                      setAdditionalWorksheetLevel(
                        documentContext.languageLevel as typeof ADDITIONAL_WORKSHEET_LEVELS[number],
                      );
                    }
                    const normalizedProgression = documentContext.languageLevel
                      .toLocaleLowerCase();
                    setAdditionalWorksheetPhase(
                      normalizedProgression.includes('abgeschlossen')
                        || normalizedProgression.includes('completed')
                        ? 'completed'
                        : normalizedProgression.includes('gegen ende')
                          || normalizedProgression.includes('towards end')
                          ? 'towards-end'
                          : normalizedProgression.includes('mitte')
                            || normalizedProgression.includes('middle')
                            ? 'middle'
                            : 'beginning',
                    );
                    setAdditionalWorksheetDialogOpen(true);
                  }}
                  className="justify-start"
                >
                  Zusätzliches Arbeitsblatt
                </Button>
              )}
              <Button
                color="secondary"
                size="md"
                iconLeading={<Trash01 className="size-4.5" />}
                onPress={() => { editor.commands.clearContent(true); localStorage.removeItem(STORAGE_KEY); }}
                className="justify-start"
              >
                Clear document
              </Button>
              <Button
                color="secondary"
                size="md"
                iconLeading={<Copy01 className="size-4.5" />}
                onPress={() => navigator.clipboard?.writeText(editor.getHTML())}
                className="justify-start"
              >
                Copy as HTML
              </Button>
            </div>
          </div>
            </>
          )}
        </aside>
      </div>

      {publishDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !publishingPDF) setPublishDialogOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dazit-publish-title"
            className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-xl"
          >
            <h2 id="dazit-publish-title" className="text-lg font-semibold text-primary">
              {publicationStatus === 'outdated'
                ? 'Auf Dazit erneut veröffentlichen'
                : 'Auf Dazit veröffentlichen'}
            </h2>
            <p className="mt-1 text-sm text-tertiary">{worksheetTitle}</p>
            {publicationStatus !== 'unpublished' && (
              <fieldset className="mt-5">
                <legend className="text-sm font-medium text-secondary">
                  Umfang der erneuten Veröffentlichung
                </legend>
                <div className="mt-2 grid gap-2">
                  {([
                    [
                      'pdf-only',
                      'Nur PDF',
                      'PDF und Vorschaubilder aktualisieren; bestehende Metadaten beibehalten.',
                    ],
                    [
                      'full',
                      'PDF und Metadaten',
                      'Zusätzlich Beschreibung, Tags, Niveau und Kompetenzen neu generieren.',
                    ],
                  ] as const).map(([value, label, description]) => (
                    <label
                      className="flex cursor-pointer gap-3 rounded-lg border border-secondary p-3"
                      key={value}
                    >
                      <input
                        checked={republishScope === value}
                        className="mt-0.5 size-4 accent-brand"
                        name="republish-scope"
                        onChange={() => setRepublishScope(value)}
                        type="radio"
                      />
                      <span>
                        <strong className="block text-sm text-primary">{label}</strong>
                        <span className="mt-0.5 block text-xs leading-5 text-tertiary">
                          {description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {(publicationStatus === 'unpublished' || republishScope === 'full') && (
              <div className="mt-5">
                <label className="mb-1.5 block text-sm font-medium text-secondary">Typ</label>
                <Select
                  ariaLabel="Dokumenttyp"
                  value={dazitDocumentType}
                  onChange={setDazitDocumentType}
                  options={[
                    { value: 'Arbeitsblatt', label: 'Arbeitsblatt' },
                    { value: 'Merkblatt', label: 'Merkblatt' },
                    { value: 'Verbtabelle', label: 'Verbtabelle' },
                    { value: 'Deklinationstabelle', label: 'Deklinationstabelle' },
                    { value: 'Lernkarten', label: 'Lernkarten' },
                  ]}
                />
              </div>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button
                color="secondary"
                size="md"
                isDisabled={publishingPDF}
                onPress={() => setPublishDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                color="primary"
                size="md"
                isDisabled={publishingPDF}
                iconLeading={publishingPDF ? <Loading01 className="size-4.5 animate-spin" /> : undefined}
                onPress={async () => {
                  if (await publishPDF()) setPublishDialogOpen(false);
                }}
              >
                {publishingPDF ? 'Publishing…' : 'Veröffentlichen'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {additionalWorksheetDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creatingAdditionalWorksheet) {
              setAdditionalWorksheetDialogOpen(false);
            }
          }}
        >
          <div
            aria-labelledby="additional-worksheet-title"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-secondary bg-primary p-6 shadow-xl"
            role="dialog"
          >
            <h2 id="additional-worksheet-title" className="text-lg font-semibold text-primary">
              Zusätzliches Arbeitsblatt erstellen
            </h2>
            <p className="mt-1 text-sm text-tertiary">
              {availableVerbTableVerbs.length} {availableVerbTableVerbs.length === 1 ? 'Verb' : 'Verben'} aus der Verbtabelle
            </p>
            <div className="mt-5 grid gap-3">
              <Button
                className="justify-start"
                color="secondary"
                isDisabled={creatingAdditionalWorksheet !== null}
                iconLeading={creatingAdditionalWorksheet === 'word-grid'
                  ? <Loading01 className="size-4.5 animate-spin" />
                  : <Grid01 className="size-4.5" />}
                onPress={() => void createAdditionalWorksheet('word-grid')}
                size="lg"
              >
                Wortgitter
              </Button>
              <div className="grid grid-cols-2 gap-4">
                <label className="text-xs font-semibold text-tertiary">
                  Sprachniveau
                  <select
                    className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    disabled={creatingAdditionalWorksheet !== null}
                    onChange={(event) => setAdditionalWorksheetLevel(
                      event.target.value as typeof ADDITIONAL_WORKSHEET_LEVELS[number],
                    )}
                    value={additionalWorksheetLevel}
                  >
                    {ADDITIONAL_WORKSHEET_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-tertiary">
                  Position im Teilniveau
                  <select
                    className="mt-1.5 h-10 w-full rounded-md border border-primary bg-primary px-3 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    disabled={creatingAdditionalWorksheet !== null}
                    onChange={(event) => setAdditionalWorksheetPhase(
                      event.target.value as typeof ADDITIONAL_WORKSHEET_PHASES[number],
                    )}
                    value={additionalWorksheetPhase}
                  >
                    <option value="beginning">Anfang</option>
                    <option value="middle">Mitte</option>
                    <option value="towards-end">Gegen Ende</option>
                    <option value="completed">Abgeschlossen</option>
                  </select>
                </label>
              </div>
              <Button
                className="justify-start"
                color="secondary"
                isDisabled={creatingAdditionalWorksheet !== null}
                iconLeading={creatingAdditionalWorksheet === 'fill-in-the-blank'
                  ? <Loading01 className="size-4.5 animate-spin" />
                  : <Edit05 className="size-4.5" />}
                onPress={() => void createAdditionalWorksheet('fill-in-the-blank')}
                size="lg"
              >
                Lückentext – Konjugation
              </Button>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                color="secondary"
                isDisabled={creatingAdditionalWorksheet !== null}
                onPress={() => setAdditionalWorksheetDialogOpen(false)}
                size="md"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        </div>
      )}

      <InsertBlockPalette
        editor={editor}
        insertAt={insertBlockAt}
        open={insertPaletteOpen}
        onStartOccupationPortrait={(insertAt) => {
          setInsertPaletteOpen(false);
          setInsertBlockAt(null);
          setOccupationPortraitInsertAt(insertAt);
        }}
        onStartVocabularyOne={(insertAt) => {
          setInsertPaletteOpen(false);
          setInsertBlockAt(null);
          setVocabularyOneInsertAt(insertAt);
        }}
        onClose={() => {
          setInsertPaletteOpen(false);
          setInsertBlockAt(null);
        }}
      />
      <VocabularyOneAIModal
        context={documentContext}
        open={vocabularyOneInsertAt !== null}
        onClose={() => setVocabularyOneInsertAt(null)}
        onGenerated={(result) => {
          if (vocabularyOneInsertAt === null) return false;
          const generatedAt = Date.now();
          const applied = editor.chain().command(({ tr }) => {
            const schema = tr.doc.type.schema;
            const headingType = schema.nodes.customHeading;
            const crosswordType = schema.nodes.crossword;
            const pageBreakType = schema.nodes.pageBreak;
            const fillType = schema.nodes.fillInTheBlank;
            const mcqType = schema.nodes.mcq;
            if (
              !headingType
              || !crosswordType
              || !pageBreakType
              || !fillType
              || !mcqType
            ) return false;

            const questions: MCQQuestion[] = result.mcq.map(
              (question, questionIndex) => ({
                id: `vocabulary-one-mcq-${generatedAt}-${questionIndex}`,
                question: question.question,
                answerMode: 'single',
                options: question.options.map((option, optionIndex) => ({
                  id: `vocabulary-one-option-${generatedAt}-${questionIndex}-${optionIndex}`,
                  text: option.text,
                  correct: option.correct,
                })),
              }),
            );
            const nodes = [
              headingType.create({
                text: result.heading,
                level: 1,
                numbered: false,
              }),
              crosswordType.create({
                entries: result.crosswordEntries,
                layoutSeed: result.crosswordLayoutSeed,
              }),
              pageBreakType.create({ restartPagination: false }),
              fillType.create({
                title: result.fillTitle,
                text: result.fillText,
                distractors: result.fillDistractors,
                showWordBank: true,
              }),
              mcqType.create({
                questions,
                showInstruction: true,
              }),
              pageBreakType.create({ restartPagination: false }),
            ];
            const safePosition = Math.min(
              tr.doc.content.size,
              Math.max(0, vocabularyOneInsertAt),
            );
            tr.insert(safePosition, nodes);
            tr.setSelection(NodeSelection.create(tr.doc, safePosition));
            return true;
          }).run();
          if (!applied) return false;
          setVocabularyOneInsertAt(null);
          return true;
        }}
      />
      <OccupationPortraitAIModal
        context={documentContext}
        open={occupationPortraitInsertAt !== null}
        onClose={() => setOccupationPortraitInsertAt(null)}
        onGenerated={(result: OccupationPortraitAttrs) => {
          if (occupationPortraitInsertAt === null) return false;
          const applied = editor.chain().command(({ tr }) => {
            const schema = tr.doc.type.schema;
            const nodeType = schema.nodes.occupationPortrait;
            if (!nodeType) return false;
            const safePosition = Math.min(
              tr.doc.content.size,
              Math.max(0, occupationPortraitInsertAt),
            );
            tr.insert(safePosition, nodeType.create({
              ...DEFAULT_OCCUPATION_PORTRAIT_ATTRS,
              ...result,
            }));
            tr.setSelection(NodeSelection.create(tr.doc, safePosition));
            return true;
          }).run();
          if (!applied) return false;
          setOccupationPortraitInsertAt(null);
          return true;
        }}
      />
      <BlockContentEditorModal
        block={contentEditorBlock}
        editor={editor}
        onClose={() => setContentEditorBlock(null)}
      />
      <LearningCardsAIModal
        onClose={() => setLearningCardsAIBlock(null)}
        onGenerated={(result) => {
          if (!learningCardsAIBlock) return;
          editor.chain().command(({ tr }) => {
            const selectedNode = tr.doc.nodeAt(learningCardsAIBlock.pos);
            if (selectedNode?.type.name !== 'learningCards') return false;
            const cardType = tr.doc.type.schema.nodes.learningCards;
            const pageBreakType = tr.doc.type.schema.nodes.pageBreak;
            if (!cardType) return false;
            const baseAttrs = {
              ...DEFAULT_LEARNING_CARDS_ATTRS,
              ...selectedNode.attrs,
              ...result,
              groupIndex: 0,
              sheetSide: 'front',
            };
            const nodes = [cardType.create(baseAttrs)];
            if (baseAttrs.sidedness === 'double') {
              if (pageBreakType) nodes.push(pageBreakType.create());
              nodes.push(cardType.create({
                ...baseAttrs,
                sheetSide: 'back',
              }));
            }
            tr.replaceWith(0, tr.doc.content.size, nodes);
            tr.setSelection(NodeSelection.create(tr.doc, 0));
            return true;
          }).run();
          setLearningCardsAIBlock(null);
        }}
        open={learningCardsAIBlock !== null}
      />
      <GermanVerbTableEditorModal
        block={germanVerbTableEditorBlock}
        documentSize={docSize}
        editor={editor}
        onClose={() => setGermanVerbTableEditorBlock(null)}
      />
      <GermanVerbTableAIModal
        initialSettings={(() => {
          if (!germanVerbTableAIBlock) {
            return DEFAULT_GERMAN_VERB_TABLE_ATTRS;
          }
          const node = editor.state.doc.nodeAt(germanVerbTableAIBlock.pos);
          if (node?.type.name !== 'germanVerbTable') {
            return DEFAULT_GERMAN_VERB_TABLE_ATTRS;
          }
          const attrs = node.attrs as GermanVerbTableAttrs;
          return {
            ...DEFAULT_GERMAN_VERB_TABLE_ATTRS,
            ...attrs,
            multipleVerbs: DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs.map(
              (fallback, index) => ({
                ...fallback,
                ...attrs.multipleVerbs?.[index],
                forms: {
                  ...fallback.forms,
                  ...attrs.multipleVerbs?.[index]?.forms,
                },
              }),
            ),
          };
        })()}
        open={germanVerbTableAIBlock !== null}
        onClose={() => setGermanVerbTableAIBlock(null)}
        onGenerated={(result) => {
          if (!germanVerbTableAIBlock) return;
          const { pos } = germanVerbTableAIBlock;
          editor.chain().command(({ tr }) => {
            const currentNode = tr.doc.nodeAt(pos);
            if (currentNode?.type.name !== 'germanVerbTable') {
              return false;
            }
            if ('multipleVerbs' in result) {
              const currentAttrs = currentNode.attrs as GermanVerbTableAttrs;
              const verbCount = currentAttrs.multipleVerbCount === 4 ? 4 : 5;
              const chunks = Array.from(
                { length: Math.ceil(result.multipleVerbs.length / verbCount) },
                (_, index) => result.multipleVerbs.slice(
                  index * verbCount,
                  index * verbCount + verbCount,
                ),
              );
              const groupId = currentAttrs.groupId
                || globalThis.crypto?.randomUUID?.()
                || `verb-group-${Date.now()}`;
              const nodes = chunks.map((chunk, groupIndex) => (
                currentNode.type.create({
                  ...currentAttrs,
                  ...result,
                  groupId,
                  groupIndex,
                  groupSize: chunks.length,
                  multipleVerbs: Array.from(
                    { length: verbCount },
                    (_, index) => chunk[index] ?? {
                      ...DEFAULT_GERMAN_VERB_TABLE_ATTRS.multipleVerbs[index],
                      verb: '',
                    },
                  ),
                })
              ));
              tr.replaceWith(pos, pos + currentNode.nodeSize, nodes);
              tr.setSelection(NodeSelection.create(tr.doc, pos));
              return true;
            }
            Object.entries(result).forEach(([key, value]) => {
              tr.setNodeAttribute(pos, key, value);
            });
            return true;
          }).run();
          setGermanVerbTableAIBlock(null);
        }}
      />
      <TimeMatchingAIModal
        initialSettings={timeMatchingAIBlock
          ? getTimeMatchingGenerationSettings(editor, timeMatchingAIBlock.pos)
          : getTimeMatchingGenerationSettings(editor, -1)}
        open={timeMatchingAIBlock !== null}
        onClose={() => setTimeMatchingAIBlock(null)}
        onGenerated={(result) => {
          if (!timeMatchingAIBlock) return;
          const { pos } = timeMatchingAIBlock;
          editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(pos)?.type.name !== 'timeMatching') return false;
            tr.setNodeAttribute(pos, 'leftRepresentation', result.leftRepresentation);
            tr.setNodeAttribute(pos, 'rightRepresentation', result.rightRepresentation);
            tr.setNodeAttribute(pos, 'times', result.times);
            tr.setNodeAttribute(pos, 'rightOrder', result.rightOrder);
            tr.setNodeAttribute(pos, 'allowedMinutes', result.allowedMinutes);
            tr.setNodeAttribute(pos, 'rangeStart', result.rangeStart);
            tr.setNodeAttribute(pos, 'rangeEnd', result.rangeEnd);
            tr.setNodeAttribute(pos, 'shuffleLeft', result.shuffleLeft);
            tr.setNodeAttribute(pos, 'shuffleRight', result.shuffleRight);
            tr.setNodeAttribute(
              pos,
              'showFirstAsExample',
              result.showFirstAsExample,
            );
            return true;
          }).run();
          setTimeMatchingAIBlock(null);
        }}
      />
      <DateMatchingAIModal
        initialCount={dateMatchingAIBlock
          ? getDateMatchingItemCount(editor, dateMatchingAIBlock.pos)
          : 6}
        open={dateMatchingAIBlock !== null}
        onClose={() => setDateMatchingAIBlock(null)}
        onGenerated={(result) => {
          if (!dateMatchingAIBlock) return;
          const { pos } = dateMatchingAIBlock;
          editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(pos)?.type.name !== 'dateMatching') return false;
            tr.setNodeAttribute(pos, 'leftRepresentation', result.leftRepresentation);
            tr.setNodeAttribute(pos, 'rightRepresentation', result.rightRepresentation);
            tr.setNodeAttribute(pos, 'dates', result.dates);
            tr.setNodeAttribute(pos, 'rightOrder', result.rightOrder);
            return true;
          }).run();
          setDateMatchingAIBlock(null);
        }}
      />
      <TwoWayPrepositionsAIModal
        initialCount={twoWayPrepositionsAIBlock
          ? getTwoWayPrepositionsItemCount(
              editor,
              twoWayPrepositionsAIBlock.pos,
            )
          : 6}
        open={twoWayPrepositionsAIBlock !== null}
        onClose={() => setTwoWayPrepositionsAIBlock(null)}
        onGenerated={(result) => {
          if (!twoWayPrepositionsAIBlock) return;
          const { pos } = twoWayPrepositionsAIBlock;
          editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(pos)?.type.name !== 'twoWayPrepositions') {
              return false;
            }
            tr.setNodeAttribute(pos, 'instruction', result.instruction);
            tr.setNodeAttribute(pos, 'mode', result.mode);
            tr.setNodeAttribute(pos, 'items', result.items);
            return true;
          }).run();
          setTwoWayPrepositionsAIBlock(null);
        }}
      />
      <WeatherAIModal
        initialCount={weatherAIBlock
          ? getWeatherItemCount(editor, weatherAIBlock.pos)
          : 4}
        open={weatherAIBlock !== null}
        onClose={() => setWeatherAIBlock(null)}
        onGenerated={(result) => {
          if (!weatherAIBlock) return;
          const { pos } = weatherAIBlock;
          editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(pos)?.type.name !== 'weather') return false;
            tr.setNodeAttribute(pos, 'instruction', result.instruction);
            tr.setNodeAttribute(pos, 'mode', result.mode);
            tr.setNodeAttribute(pos, 'items', result.items);
            tr.setNodeAttribute(pos, 'questionOrder', result.questionOrder);
            return true;
          }).run();
          setWeatherAIBlock(null);
        }}
      />
      <ColorFurnitureAIModal
        initialCount={colorFurnitureAIBlock
          ? getColorFurnitureItemCount(editor, colorFurnitureAIBlock.pos)
          : 4}
        open={colorFurnitureAIBlock !== null}
        onClose={() => setColorFurnitureAIBlock(null)}
        onGenerated={(result) => {
          if (!colorFurnitureAIBlock) return;
          const { pos } = colorFurnitureAIBlock;
          editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(pos)?.type.name !== 'colorFurniture') return false;
            tr.setNodeAttribute(pos, 'instruction', result.instruction);
            tr.setNodeAttribute(pos, 'mode', result.mode);
            tr.setNodeAttribute(pos, 'items', result.items);
            return true;
          }).run();
          setColorFurnitureAIBlock(null);
        }}
      />
      <MCQAIModal
        context={documentContext}
        open={mcqAIBlock?.type === 'mcq'}
        sources={mcqSources ?? []}
        onClose={() => setMCQAIBlock(null)}
        onGenerated={({
          questions,
          sourceText,
          sourceWasGenerated,
        }) => {
          if (!mcqAIBlock) return false;
          const block = mcqAIBlock;
          let resolvedPos: number | null = null;
          const generatedAt = Date.now();
          const applied = editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(block.pos)?.type.name === 'mcq') {
              resolvedPos = block.pos;
            } else {
              let nearestDistance = Number.POSITIVE_INFINITY;
              tr.doc.descendants((node, pos) => {
                if (node.type.name !== 'mcq') return;
                const distance = Math.abs(pos - block.pos);
                if (distance < nearestDistance) {
                  nearestDistance = distance;
                  resolvedPos = pos;
                }
              });
            }
            if (resolvedPos === null) return false;
            const originalNode = tr.doc.nodeAt(resolvedPos);
            if (originalNode?.type.name !== 'mcq') return false;
            const schema = tr.doc.type.schema;
            const replacementNodes = [];
            if (sourceWasGenerated) {
              const richTextType = schema.nodes.richText;
              if (!richTextType) return false;
              replacementNodes.push(richTextType.create({
                html: plainTextToRichTextHtml(sourceText),
              }));
            }
            const generatedQuestions: MCQQuestion[] = questions.map(
              (generatedQuestion, questionIndex) => ({
                id: `mcq-ai-question-${generatedAt}-${questionIndex}`,
                question: generatedQuestion.question,
                answerMode: 'single',
                options: generatedQuestion.options.map((option, optionIndex) => ({
                  id: `mcq-ai-${generatedAt}-${questionIndex}-${optionIndex}`,
                  text: option.text,
                  correct: option.correct,
                })),
              }),
            );
            replacementNodes.push(originalNode.type.create({
              ...originalNode.attrs,
              questions: generatedQuestions,
              shuffleAnswers: false,
              questionNumber: null,
              showInstruction: true,
            }));
            tr.replaceWith(
              resolvedPos,
              resolvedPos + originalNode.nodeSize,
              replacementNodes,
            );
            let firstMCQPos = resolvedPos;
            if (sourceWasGenerated) {
              firstMCQPos += replacementNodes[0].nodeSize;
            }
            tr.setSelection(NodeSelection.create(tr.doc, firstMCQPos));
            resolvedPos = firstMCQPos;
            return true;
          }).run();
          if (!applied || resolvedPos === null) return false;
          const updatedBlock: ContentEditorBlock = {
            ...block,
            pos: resolvedPos,
          };
          setMCQAIBlock(null);
          setContentEditorBlock(updatedBlock);
          setSelectedCustomBlock(updatedBlock);
          return true;
        }}
      />
      <WordGridAIModal
        context={documentContext}
        columns={selectedWordGridAttrs?.columns ?? 10}
        open={wordGridAIBlock?.type === 'wordGrid'}
        rows={selectedWordGridAttrs?.rows ?? 10}
        onClose={() => setWordGridAIBlock(null)}
        onManualEntry={() => {
          if (!wordGridAIBlock) return;
          const block = wordGridAIBlock;
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'wordGrid') return false;
            tr.setNodeAttribute(block.pos, 'words', []);
            return true;
          }).run();
          setWordGridAIBlock(null);
          setContentEditorBlock(block);
        }}
        onGenerated={(words) => {
          if (!wordGridAIBlock) return;
          const block = wordGridAIBlock;
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'wordGrid') return false;
            tr.setNodeAttribute(block.pos, 'words', words);
            tr.setNodeAttribute(
              block.pos,
              'generation',
              Math.max(0, Number(node.attrs.generation) || 0) + 1,
            );
            return true;
          }).run();
          setWordGridAIBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <CrosswordAIModal
        context={documentContext}
        initialWordList={crosswordAIBlock
          ? getCrosswordWordList(editor, crosswordAIBlock.pos)
          : ''}
        open={crosswordAIBlock?.type === 'crossword'}
        onClose={() => setCrosswordAIBlock(null)}
        onGenerated={(entries, layoutSeed) => {
          if (!crosswordAIBlock) return;
          const block = crosswordAIBlock;
          const generatedAt = Date.now();
          const applied = editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'crossword') return false;
            tr.setNodeAttribute(
              block.pos,
              'entries',
              entries.map((entry, index) => ({
                id: entry.id || `crossword-ai-${generatedAt}-${index}`,
                answer: entry.answer,
                clue: entry.clue,
              })),
            );
            tr.setNodeAttribute(
              block.pos,
              'layoutSeed',
              layoutSeed,
            );
            tr.setSelection(NodeSelection.create(tr.doc, block.pos));
            return true;
          }).run();
          if (!applied) return;
          setCrosswordAIBlock(null);
          setContentEditorBlock(block);
          setSelectedCustomBlock(block);
        }}
      />
      <WordGridCSVImportModal
        columns={selectedWordGridAttrs?.columns ?? 10}
        directions={selectedWordGridAttrs?.directions ?? DEFAULT_WORD_GRID_DIRECTIONS}
        open={wordGridCSVBlock?.type === 'wordGrid'}
        rows={selectedWordGridAttrs?.rows ?? 10}
        onClose={() => setWordGridCSVBlock(null)}
        onImport={({ columns, rows, words }) => {
          if (!wordGridCSVBlock) return;
          const block = wordGridCSVBlock;
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'wordGrid') return false;
            tr.setNodeAttribute(block.pos, 'columns', columns);
            tr.setNodeAttribute(block.pos, 'rows', rows);
            tr.setNodeAttribute(block.pos, 'words', words);
            tr.setNodeAttribute(
              block.pos,
              'generation',
              Math.max(0, Number(node.attrs.generation) || 0) + 1,
            );
            return true;
          }).run();
          setWordGridCSVBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <DialogueAIModal
        context={documentContext}
        initialSpeakerCount={Math.max(
          2,
          ...(selectedDialogueAttrs?.items.map(({ speaker }) => speaker) ?? []),
        )}
        open={dialogueAIBlock?.type === 'dialogue'}
        speakerNames={
          selectedDialogueAttrs?.speakerNames
          ?? DEFAULT_DIALOGUE_SPEAKER_NAMES
        }
        onClose={() => setDialogueAIBlock(null)}
        onGenerated={({ items, speakerNames }) => {
          if (!dialogueAIBlock) return;
          const block = dialogueAIBlock;
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'dialogue') return false;
            tr.setNodeAttribute(block.pos, 'items', items.map((item, index) => ({
              id: `dialogue-ai-${Date.now()}-${index}`,
              speaker: item.speaker,
              text: item.text,
            })));
            tr.setNodeAttribute(block.pos, 'speakerNames', {
              ...DEFAULT_DIALOGUE_SPEAKER_NAMES,
              ...Object.fromEntries(
                speakerNames.map((name, index) => [index + 1, name]),
              ),
            });
            tr.setNodeAttribute(block.pos, 'showSpeakerNames', true);
            tr.setNodeAttribute(block.pos, 'showOriginal', false);
            return true;
          }).run();
          setDialogueAIBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <MiniFormAIModal
        context={documentContext}
        fields={selectedMiniFormAttrs?.fields ?? []}
        initialItemCount={selectedMiniFormAttrs?.items.length ?? 3}
        open={miniFormAIBlock?.type === 'miniForm'}
        onClose={() => setMiniFormAIBlock(null)}
        onGenerated={({ fields, items }) => {
          if (!miniFormAIBlock) return;
          const block = miniFormAIBlock;
          const generatedAt = Date.now();
          const generatedFields = fields.map(({ id, label }, index) => ({
            id: id || `mini-form-ai-field-${generatedAt}-${index}`,
            label,
          }));
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'miniForm') return false;
            tr.setNodeAttribute(block.pos, 'fields', generatedFields);
            tr.setNodeAttribute(block.pos, 'items', items.map((item, index) => ({
              id: `mini-form-ai-item-${generatedAt}-${index}`,
              prompt: item.prompt,
              values: Object.fromEntries(generatedFields.map((field, fieldIndex) => [
                field.id,
                item.values[fieldIndex] ?? '',
              ])),
            })));
            return true;
          }).run();
          setMiniFormAIBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <FillInTheBlankAIModal
        context={documentContext}
        open={fillInTheBlankAIBlock?.type === 'fillInTheBlank'}
        sources={richTextSources ?? []}
        onClose={() => setFillInTheBlankAIBlock(null)}
        onGenerated={({ text, distractors }) => {
          if (!fillInTheBlankAIBlock) return false;
          const block = fillInTheBlankAIBlock;
          let resolvedPos: number | null = null;
          const applied = editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(block.pos)?.type.name === 'fillInTheBlank') {
              resolvedPos = block.pos;
            } else {
              let nearestDistance = Number.POSITIVE_INFINITY;
              tr.doc.descendants((node, pos) => {
                if (node.type.name !== 'fillInTheBlank') return;
                const distance = Math.abs(pos - block.pos);
                if (distance < nearestDistance) {
                  nearestDistance = distance;
                  resolvedPos = pos;
                }
              });
            }
            if (resolvedPos === null) return false;
            tr.setNodeAttribute(resolvedPos, 'text', text);
            tr.setNodeAttribute(resolvedPos, 'distractors', distractors);
            if (distractors.length > 0) {
              tr.setNodeAttribute(resolvedPos, 'showWordBank', true);
            }
            return true;
          }).run();
          if (!applied || resolvedPos === null) return false;
          const updatedBlock = {
            ...block,
            pos: resolvedPos,
          };
          setFillInTheBlankAIBlock(null);
          setContentEditorBlock(updatedBlock);
          setSelectedCustomBlock(updatedBlock);
          return true;
        }}
      />
      <TrueFalseAIModal
        context={documentContext}
        initialStatementCount={selectedTrueFalseAttrs?.rows.length ?? 6}
        open={trueFalseAIBlock?.type === 'trueFalse'}
        sources={richTextSources ?? []}
        onClose={() => setTrueFalseAIBlock(null)}
        onGenerated={({
          includeNotGiven,
          notGivenLabel,
          question,
          rows,
        }) => {
          if (!trueFalseAIBlock) return;
          const block = trueFalseAIBlock;
          const generatedAt = Date.now();
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'trueFalse') return false;
            tr.setNodeAttribute(block.pos, 'question', question);
            tr.setNodeAttribute(block.pos, 'showNa', includeNotGiven);
            if (includeNotGiven) {
              tr.setNodeAttribute(block.pos, 'naLabel', notGivenLabel);
            }
            tr.setNodeAttribute(block.pos, 'rows', rows.map((row, index) => ({
              id: `true-false-ai-${generatedAt}-${index}`,
              text: row.text,
              correctValue: row.correctValue,
            })));
            return true;
          }).run();
          setTrueFalseAIBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <RichTextAIModal
        context={documentContext}
        open={richTextAIBlock?.type === 'richText'}
        onClose={() => setRichTextAIBlock(null)}
        onGenerated={(html) => {
          if (!richTextAIBlock) return;
          const block = richTextAIBlock;
          editor.chain().command(({ tr }) => {
            const node = tr.doc.nodeAt(block.pos);
            if (node?.type.name !== 'richText') return false;
            tr.setNodeAttribute(block.pos, 'html', html);
            return true;
          }).run();
          setRichTextAIBlock(null);
          setContentEditorBlock(block);
        }}
      />
      <ErrorCorrectionAIModal
        context={documentContext}
        open={errorCorrectionAIBlock?.type === 'errorCorrection'}
        sources={richTextSources ?? []}
        onClose={() => setErrorCorrectionAIBlock(null)}
        onGenerated={(result) => {
          if (!errorCorrectionAIBlock) return false;
          const block = errorCorrectionAIBlock;
          let resolvedPos: number | null = null;
          const applied = editor.chain().command(({ tr }) => {
            if (tr.doc.nodeAt(block.pos)?.type.name === 'errorCorrection') {
              resolvedPos = block.pos;
            } else {
              let nearestDistance = Number.POSITIVE_INFINITY;
              tr.doc.descendants((node, pos) => {
                if (node.type.name !== 'errorCorrection') return;
                const distance = Math.abs(pos - block.pos);
                if (distance < nearestDistance) {
                  nearestDistance = distance;
                  resolvedPos = pos;
                }
              });
            }
            if (resolvedPos === null) return false;
            tr.setNodeAttribute(resolvedPos, 'language', result.language);
            tr.setNodeAttribute(
              resolvedPos,
              'incorrectText',
              result.incorrectText,
            );
            tr.setNodeAttribute(resolvedPos, 'correctText', result.correctText);
            tr.setNodeAttribute(resolvedPos, 'errors', result.errors);
            tr.setNodeAttribute(
              resolvedPos,
              'markup',
              createErrorCorrectionMarkup(result.incorrectText, result.errors),
            );
            tr.setNodeAttribute(
              resolvedPos,
              'markErrorPositions',
              result.markErrorPositions,
            );
            return true;
          }).run();
          if (!applied || resolvedPos === null) return false;
          const updatedBlock = {
            ...block,
            pos: resolvedPos,
          };
          setErrorCorrectionAIBlock(null);
          setContentEditorBlock(updatedBlock);
          setSelectedCustomBlock(updatedBlock);
          return true;
        }}
      />
      <MediaLibraryModal
        onClose={() => setRewriteImageItemId(null)}
        onSelect={selectRewriteSentenceImage}
        open={rewriteImageItemId !== null}
      />
      <MediaLibraryModal
        onClose={() => setMiniFormImageItemId(null)}
        onSelect={selectMiniFormImage}
        open={miniFormImageItemId !== null}
      />
      <MediaLayoutEditorModal
        block={mediaLayoutEditorBlock}
        editor={editor}
        onClose={() => setMediaLayoutEditorBlock(null)}
      />
      <TwoWayPrepositionsEditorModal
        block={twoWayPrepositionsEditorBlock}
        editor={editor}
        onClose={() => setTwoWayPrepositionsEditorBlock(null)}
      />
      <BlockHoverToolbar
        editor={editor}
        onInsertAbove={(pos) => {
          setInsertBlockAt(pos);
          setInsertPaletteOpen(true);
        }}
        onInsertBelow={(pos) => {
          setInsertBlockAt(pos);
          setInsertPaletteOpen(true);
        }}
      />
    </div>
  );
}
