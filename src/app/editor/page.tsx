"use client";

import {
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
  Bold01,
  Italic01,
  Strikethrough01,
  Heading01,
  List,
  Code01,
  MessageChatSquare,
  ReverseLeft,
  ReverseRight,
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
  ChevronUp,
  ChevronDown,
} from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import {
  MCQ,
  type MCQAnswerMode,
  type MCQAttrs,
  type MCQColumns,
  type MCQOption,
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
  CustomHeading,
  type CustomHeadingAttrs,
  type CustomHeadingLevel,
} from '@/components/editor/heading-node';
import {
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
import { CustomBlockNumbering } from '@/components/editor/custom-blocks/numbering';
import { InsertBlockPalette } from '@/components/editor/custom-blocks/insert-block-palette';
import { MediaLibraryModal } from '@/components/editor/media-library-modal';
import {
  stripInlineFormatting,
} from '@/components/editor/custom-blocks/inline-formatting';
import {
  InlineFormattedInput,
} from '@/components/editor/custom-blocks/inline-formatted-input';

const STORAGE_KEY = 'eduit-editor-content';
const SelectablePageBreak = PageBreak.extend({
  selectable: true,
});
const DOCUMENT_HEADER = '<p></p>';
const DOCUMENT_CREATOR = 'Creator name';
const DOCUMENT_ID = 'Document ID';

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

const DEFAULT_DOCUMENT_BRAND = {
  name: ACTIVE_CUSTOM_BLOCK_BRAND.name,
  primaryColor: ACTIVE_CUSTOM_BLOCK_BRAND.primaryColor,
  accentColor: ACTIVE_CUSTOM_BLOCK_BRAND.accentColor,
  customColor1: ACTIVE_CUSTOM_BLOCK_BRAND.customColor1,
  customColor2: ACTIVE_CUSTOM_BLOCK_BRAND.customColor2,
  fontFamily: ACTIVE_CUSTOM_BLOCK_BRAND.fontFamily,
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

function documentFooter(brand: Pick<BrandProfile, 'dateFormat' | 'name'>) {
  return [
    `<p>${brand.name}<br>${DOCUMENT_CREATOR}</p>`,
    '<p>{page}/{total}</p>',
    `<p>${DOCUMENT_ID}<br>${formatBrandDate(new Date(), brand.dateFormat)}</p>`,
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

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={cx(
        'flex size-9 items-center justify-center rounded-md text-sm font-semibold transition',
        active
          ? 'bg-brand-primary text-brand-secondary'
          : 'text-fg-quaternary hover:bg-primary_hover hover:text-fg-secondary',
      )}
    >
      {children}
    </button>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard', Icon: Grid01, href: '#' },
  { label: 'Documents', Icon: File02, href: '/worksheets', active: true },
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
    left: mmToPixels(25),
    right: mmToPixels(20),
  },
});

const DOC_SIZES: { id: string; label: string; format: () => PageFormat }[] = [
  { id: 'a4-portrait', label: 'DIN A4 Portrait', format: () => documentFormat(PAGE_FORMATS.A4) },
  { id: 'a4-landscape', label: 'DIN A4 Landscape', format: () => documentFormat(PAGE_FORMATS.A4, 'landscape') },
  { id: 'letter-portrait', label: 'US Letter Portrait', format: () => documentFormat(PAGE_FORMATS.Letter) },
  { id: 'letter-landscape', label: 'US Letter Landscape', format: () => documentFormat(PAGE_FORMATS.Letter, 'landscape') },
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
  const [saved, setSaved] = useState(true);
  const [docSize, setDocSize] = useState('a4-portrait');
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [brandProfileId, setBrandProfileId] = useState<string | null>(null);
  const [showSolutions, setShowSolutions] = useState(false);
  const [worksheetTitle, setWorksheetTitle] = useState('Untitled Document');
  const worksheetIdRef = useRef<string | null>(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('worksheet')
      : null,
  );
  const worksheetSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worksheetInitializationStartedRef = useRef(false);
  const [selectedMCQPos, setSelectedMCQPos] = useState<number | null>(null);
  const [selectedMCMPos, setSelectedMCMPos] = useState<number | null>(null);
  const [selectedMCHPos, setSelectedMCHPos] = useState<number | null>(null);
  const [selectedMatchingPairsPos, setSelectedMatchingPairsPos] = useState<number | null>(null);
  const [selectedTrueFalsePos, setSelectedTrueFalsePos] = useState<number | null>(null);
  const [selectedFillInTheBlankPos, setSelectedFillInTheBlankPos] = useState<number | null>(null);
  const [selectedGlossaryTermsPos, setSelectedGlossaryTermsPos] = useState<number | null>(null);
  const [selectedCustomHeadingPos, setSelectedCustomHeadingPos] = useState<number | null>(null);
  const [selectedDialoguePos, setSelectedDialoguePos] = useState<number | null>(null);
  const [selectedRewriteSentencesPos, setSelectedRewriteSentencesPos] = useState<number | null>(null);
  const [selectedSortingCategoriesPos, setSelectedSortingCategoriesPos] = useState<number | null>(null);
  const [selectedWordGridPos, setSelectedWordGridPos] = useState<number | null>(null);
  const [selectedChooseCorrectWordsPos, setSelectedChooseCorrectWordsPos] = useState<number | null>(null);
  const [selectedInlineChoicePos, setSelectedInlineChoicePos] = useState<number | null>(null);
  const [selectedMiniFormPos, setSelectedMiniFormPos] = useState<number | null>(null);
  const [selectedWorksheetTablePos, setSelectedWorksheetTablePos] = useState<number | null>(null);
  const [selectedPageBreakPos, setSelectedPageBreakPos] = useState<number | null>(null);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [insertPaletteOpen, setInsertPaletteOpen] = useState(false);
  const [rewriteImageItemId, setRewriteImageItemId] = useState<string | null>(null);
  const [miniFormImageItemId, setMiniFormImageItemId] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      ConvertKit.configure({ table: false }),
      TableKit,
      CustomBlockNumbering,
      MCQ,
      MCM,
      MCH,
      MatchingPairs,
      TrueFalse,
      FillInTheBlank,
      GlossaryTerms,
      CustomHeading,
      Dialogue,
      RewriteSentences,
      SortingCategories,
      WordGrid,
      ChooseCorrectWords,
      InlineChoice,
      MiniForm,
      WorksheetTable,
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
        style: `--custom-block-font-family: ${ACTIVE_CUSTOM_BLOCK_BRAND.fontFamily}`,
      },
    },
  });

  const selectedMCQAttrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!currentEditor || selectedMCQPos === null) return null;
      const node = currentEditor.state.doc.nodeAt(selectedMCQPos);
      return node?.type.name === 'mcq' ? node.attrs as MCQAttrs : null;
    },
  });

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

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/admin/brand-profiles', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json() as {
          profiles?: BrandProfile[];
          error?: string;
        };
        if (!response.ok) {
          throw new Error(result.error ?? 'Could not load brand profiles.');
        }
        if (!cancelled) {
          setBrandProfiles(
            (result.profiles ?? []).filter(({ isActive }) => isActive),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setBrandProfiles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedBrandProfile = brandProfiles.find(
    ({ id }) => id === brandProfileId,
  );
  const activeBrand = selectedBrandProfile ?? DEFAULT_DOCUMENT_BRAND;

  useEffect(() => {
    if (!editor) return;
    const editorElement = editor.view.dom;
    // Eduit supplies the structural defaults; profiles override brand tokens.
    editorElement.setAttribute('data-brand', 'eduit');
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
      '--custom-block-example-font-family',
      activeBrand.exampleFontFamily,
    );
    editorElement.style.setProperty(
      '--custom-block-example-font-size',
      `${activeBrand.exampleFontSize}px`,
    );
    editorElement.style.setProperty(
      '--custom-block-example-solution-color',
      activeBrand.exampleColor,
    );
    editorElement.style.setProperty(
      '--custom-block-solution-font-family',
      activeBrand.solutionFontFamily,
    );
    editorElement.style.setProperty(
      '--custom-block-solution-font-size',
      `${activeBrand.solutionFontSize}px`,
    );
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
          '0.875rem',
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
            '1.5rem',
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
    editor.commands.setFooter(documentFooter(activeBrand));
    return () => {
      measurementCancelled = true;
    };
  }, [activeBrand, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.view.dom.setAttribute(
      'data-show-solutions',
      String(showSolutions),
    );
  }, [editor, showSolutions]);

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
            showSolutions: boolean;
          };
          error?: string;
        };
        if (!response.ok || !result.worksheet) {
          throw new Error(result.error ?? 'Could not load worksheet.');
        }

        if (!existingWorksheetId) {
          worksheetIdRef.current = result.worksheet.id;
          const url = new URL(window.location.href);
          url.searchParams.set('worksheet', result.worksheet.id);
          window.history.replaceState({}, '', url);
          localStorage.removeItem(STORAGE_KEY);
        }
        setWorksheetTitle(result.worksheet.title);
        setDocSize(result.worksheet.documentSize);
        setBrandProfileId(result.worksheet.brandProfileId);
        setShowSolutions(result.worksheet.showSolutions);
        if (existingWorksheetId) {
          editor.commands.setContent(result.worksheet.contentHtml || '');
        }
        const size = DOC_SIZES.find(({ id }) => id === result.worksheet?.documentSize);
        if (size) editor.commands.setPageFormat(size.format());
        setSaved(true);
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
    };
  }, [docSize, editor]);

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
    if (selectedMCQPos === null || !selectedMCQAttrs) return;
    const options = patch.correct && selectedMCQAttrs.answerMode === 'single'
      ? selectedMCQAttrs.options.map((option) => ({
          ...option,
          correct: option.id === id,
          ...(option.id === id ? patch : {}),
        }))
      : selectedMCQAttrs.options.map((option) => option.id === id ? { ...option, ...patch } : option);
    setNodeAttr(
      editor,
      selectedMCQPos,
      'options',
      options,
    );
  };

  const updateMCQAnswerMode = (answerMode: MCQAnswerMode) => {
    if (selectedMCQPos === null || !selectedMCQAttrs) return;
    setNodeAttr(editor, selectedMCQPos, 'answerMode', answerMode);
    if (answerMode === 'single') {
      let foundCorrect = false;
      setNodeAttr(
        editor,
        selectedMCQPos,
        'options',
        selectedMCQAttrs.options.map((option) => {
          if (!option.correct || foundCorrect) return { ...option, correct: false };
          foundCorrect = true;
          return option;
        }),
      );
    }
  };

  const addMCQOption = () => {
    if (selectedMCQPos === null || !selectedMCQAttrs) return;
    const index = selectedMCQAttrs.options.length;
    setNodeAttr(editor, selectedMCQPos, 'options', [
      ...selectedMCQAttrs.options,
      {
        id: `option-${Date.now()}`,
        text: `Option ${String.fromCharCode(65 + index)}`,
        correct: false,
      },
    ]);
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
        text: `Answer row ${rowNumber}`,
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
    setDocSize(id);
    const size = DOC_SIZES.find((s) => s.id === id);
    if (size) editor.commands.setPageFormat(size.format());
    if (worksheetIdRef.current) {
      void fetch('/api/worksheets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: worksheetIdRef.current,
          worksheet: { documentSize: id },
        }),
      });
    }
  };

  const handleBrandProfile = async (id: string) => {
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
      if (!response.ok) throw new Error('Could not save brand profile.');
      setSaved(true);
    } catch {
      setBrandProfileId(previousBrandProfileId);
      setSaved(false);
    }
  };

  const handleShowSolutions = async (value: boolean) => {
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

  const exportPDF = async () => {
    const editorElement = document.querySelector<HTMLElement>('.editor-content .tiptap');
    const appElement = document.querySelector<HTMLElement>('.editor-app');
    if (!editorElement || !appElement) return;

    setExportingPDF(true);
    setExportError(null);
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
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editorElement.outerHTML,
          head,
          docSize,
        }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(result?.error ?? 'PDF export failed.');
      }

      const blob = await response.blob();
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
      appElement.classList.remove('pdf-exporting');
      setExportingPDF(false);
    }
  };

  return (
    <div className="editor-app flex h-screen flex-col overflow-hidden bg-secondary text-primary">

      {/* Top header (sticky) */}
      <header className="editor-topbar relative flex h-16 shrink-0 items-center justify-between border-b border-secondary bg-primary px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo/eduit_logo.svg"
            alt="Eduit"
            className="h-6 w-auto"
          />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 left-0 flex items-center justify-center md:left-64 lg:right-72">
          <span className="text-sm font-semibold text-secondary">{worksheetTitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-quaternary">{saved ? 'All changes saved' : 'Saving…'}</span>
          <Button color="secondary" size="md" iconLeading={<Home03 className="size-4.5" />} onPress={() => { window.location.href = '/'; }}>
            Home
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
            {exportingPDF ? 'Exporting…' : 'Export PDF'}
          </Button>
          <Button color="primary" size="md">Publish</Button>
        </div>
      </header>

      {/* Body: left sidebar + editor + right sidebar */}
      <div className="editor-body flex min-h-0 flex-1 overflow-hidden">

        {/* Left dashboard sidebar (sticky) */}
        <aside className="editor-left-sidebar hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-secondary bg-primary p-4 md:flex">
          <p className="px-3 pb-2 text-xs font-semibold text-quaternary">Workspace</p>
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ label, Icon, href, active }) => (
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
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-5 border-t border-secondary pt-4">
            <p className="px-3 pb-2 text-xs font-semibold text-quaternary">Admin</p>
            <nav>
              <a
                href="/admin/brands"
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-secondary transition hover:bg-primary_hover"
              >
                <Settings01 className="size-5 text-fg-quaternary" />
                Brand Profiles
              </a>
            </nav>
          </div>
          <div className="mt-auto rounded-xl border border-secondary bg-secondary p-4">
            <p className="text-sm font-semibold text-secondary">Storage</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-quaternary">
              <div className="h-full w-1/3 rounded-full bg-brand-solid" />
            </div>
            <p className="mt-2 text-xs text-tertiary">2.1 GB of 6 GB used</p>
          </div>
        </aside>

        {/* Editor column */}
        <main className="editor-column flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="editor-toolbar sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b border-secondary bg-primary/90 px-4 py-2 backdrop-blur">
            <ToolbarButton title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold01 className="size-4.5" /></ToolbarButton>
            <ToolbarButton title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic01 className="size-4.5" /></ToolbarButton>
            <ToolbarButton title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough01 className="size-4.5" /></ToolbarButton>
            <div className="mx-1 h-5 w-px bg-secondary" />
            <ToolbarButton title="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><span className="flex items-center"><Heading01 className="size-4.5" /><span className="text-xs">1</span></span></ToolbarButton>
            <ToolbarButton title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><span className="flex items-center"><Heading01 className="size-4.5" /><span className="text-xs">2</span></span></ToolbarButton>
            <div className="mx-1 h-5 w-px bg-secondary" />
            <ToolbarButton title="Bullet list" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4.5" /></ToolbarButton>
            <ToolbarButton title="Code block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code01 className="size-4.5" /></ToolbarButton>
            <ToolbarButton title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><MessageChatSquare className="size-4.5" /></ToolbarButton>
            <div className="mx-1 h-5 w-px bg-secondary" />
            <ToolbarButton title="Insert custom block" onClick={() => setInsertPaletteOpen(true)}><PlusSquare className="size-4.5" /></ToolbarButton>
            <div className="ml-auto flex gap-1">
              <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}><ReverseLeft className="size-4.5" /></ToolbarButton>
              <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}><ReverseRight className="size-4.5" /></ToolbarButton>
            </div>
          </div>

          {/* Editable area — Pages renders A4 pages on this backdrop */}
          <div className="editor-workspace min-h-0 flex-1 overflow-auto bg-tertiary px-4 py-8">
            <EditorContent editor={editor} className="editor-content mx-auto w-fit" />
          </div>
        </main>

        {/* Right sidebar (sticky) */}
        <aside className="editor-right-sidebar hidden w-72 shrink-0 flex-col gap-5 overflow-y-auto border-l border-secondary bg-primary p-5 lg:flex">
          {exportError && (
            <div role="alert" className="rounded-lg border border-error-primary bg-error-primary p-3 text-xs text-error-primary">
              {exportError}
            </div>
          )}

          {selectedMCQAttrs && selectedMCQPos !== null && (
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-quaternary">Multiple choice</p>
                <span className="rounded bg-brand-primary px-2 py-0.5 text-[10px] font-bold text-brand-secondary">MCQ</span>
              </div>

              <label htmlFor="mcq-question" className="mt-4 block text-xs font-semibold text-tertiary">Question</label>
              <textarea
                id="mcq-question"
                rows={3}
                value={selectedMCQAttrs.question}
                onChange={(event) => setNodeAttr(editor, selectedMCQPos, 'question', event.target.value)}
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
                value={selectedMCQAttrs.answerMode}
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
                {selectedMCQAttrs.options.map((option, index) => (
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
                      disabled={selectedMCQAttrs.options.length <= 2}
                      onClick={() => setNodeAttr(
                        editor,
                        selectedMCQPos,
                        'options',
                        selectedMCQAttrs.options.filter(({ id }) => id !== option.id),
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

          {selectedMCMAttrs && selectedMCMPos !== null && (
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
                <span className="text-xs font-semibold text-tertiary">Answer rows</span>
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
                        aria-label={`Answer row ${rowIndex + 1}`}
                        value={row.text}
                        onChange={(event) => updateMCMRow(row.id, { text: event.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-primary bg-primary px-2.5 py-2 text-sm text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
                      />
                      <button
                        type="button"
                        aria-label={`Delete answer row ${rowIndex + 1}`}
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

          {selectedMCHAttrs && selectedMCHPos !== null && (
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

          {selectedMatchingPairsAttrs && selectedMatchingPairsPos !== null && (
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

          {selectedTrueFalseAttrs && selectedTrueFalsePos !== null && (
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

          {selectedSortingCategoriesAttrs && selectedSortingCategoriesPos !== null && (
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

          {selectedWordGridAttrs && selectedWordGridPos !== null && (
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

          {selectedChooseCorrectWordsAttrs && selectedChooseCorrectWordsPos !== null && (
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

          {selectedInlineChoiceAttrs && selectedInlineChoicePos !== null && (
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

          {selectedMiniFormAttrs && selectedMiniFormPos !== null && (
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

          {selectedWorksheetTableAttrs
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
                  <span>Show header row</span>
                  <input
                    type="checkbox"
                    checked={selectedWorksheetTableAttrs.showHeader}
                    onChange={(event) => setWorksheetTableAttr(
                      editor,
                      selectedWorksheetTablePos,
                      'showHeader',
                      event.target.checked,
                    )}
                  />
                </label>
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
                          <InlineFormattedInput
                            ariaLabel={`Table column ${columnIndex + 1} label`}
                            value={column.label}
                            onChange={(value) => updateWorksheetTableColumns(
                              selectedWorksheetTableAttrs.columns.map(
                                (currentColumn) => (
                                  currentColumn.id === column.id
                                    ? { ...currentColumn, label: value }
                                    : currentColumn
                                ),
                              ),
                            )}
                            className="custom-block__inline-formatted-input min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                          />
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
                        <label className="mt-2 ml-7 flex items-center gap-2 text-[10px] font-medium text-quaternary">
                          <span>Span</span>
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
                            className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                          />
                          <span>/12</span>
                        </label>
                        <label className="mt-2 ml-7 flex items-center gap-2 text-[10px] font-medium text-quaternary">
                          <span>Align</span>
                          <select
                            aria-label={`Horizontal alignment of table column ${columnIndex + 1}`}
                            value={column.align ?? 'left'}
                            onChange={(event) => updateWorksheetTableColumns(
                              selectedWorksheetTableAttrs.columns.map(
                                (currentColumn) => (
                                  currentColumn.id === column.id
                                    ? {
                                        ...currentColumn,
                                        align: event.target.value as
                                          WorksheetTableColumn['align'],
                                      }
                                    : currentColumn
                                ),
                              ),
                            )}
                            className="min-w-0 flex-1 border border-primary bg-primary px-2.5 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </label>
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

                      <div className="mt-2 space-y-2">
                        {selectedWorksheetTableAttrs.columns.map(
                          (column, columnIndex) => (
                            <label
                              className="block text-[10px] font-medium text-quaternary"
                              key={column.id}
                            >
                              <span className="block truncate">
                                {stripInlineFormatting(column.label)
                                  || `Column ${columnIndex + 1}`}
                              </span>
                              <InlineFormattedInput
                                ariaLabel={`Table row ${rowIndex + 1}, column ${columnIndex + 1}`}
                                multiline
                                value={row.cells[column.id] ?? ''}
                                onChange={(value) => updateWorksheetTableCell(
                                  row.id,
                                  column.id,
                                  value,
                                )}
                                className="custom-block__inline-formatted-input mt-1 min-h-16 w-full whitespace-pre-wrap border border-primary bg-primary px-2.5 py-2 text-sm leading-5 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                              />
                            </label>
                          ),
                        )}
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

          {selectedRewriteSentencesAttrs && selectedRewriteSentencesPos !== null && (
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

          {selectedDialogueAttrs && selectedDialoguePos !== null && (
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

          {selectedGlossaryTermsAttrs && selectedGlossaryTermsPos !== null && (
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

          {selectedFillInTheBlankAttrs && selectedFillInTheBlankPos !== null && (
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

          {(selectedMCQAttrs
            || selectedMCMAttrs
            || selectedMCHAttrs
            || selectedMatchingPairsAttrs
            || selectedTrueFalseAttrs
            || selectedFillInTheBlankAttrs
            || selectedGlossaryTermsAttrs
            || selectedCustomHeadingAttrs
            || selectedDialogueAttrs
            || selectedRewriteSentencesAttrs
            || selectedSortingCategoriesAttrs
            || selectedWordGridAttrs
            || selectedChooseCorrectWordsAttrs
            || selectedInlineChoiceAttrs
            || selectedMiniFormAttrs
            || selectedWorksheetTableAttrs
            || selectedPageBreakPos !== null) && (
            <div className="border-t border-secondary" />
          )}

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

          <div>
            <label htmlFor="doc-brand" className="text-xs font-semibold text-quaternary">
              Brand
            </label>
            <select
              id="doc-brand"
              value={brandProfileId ?? ''}
              onChange={(event) => {
                void handleBrandProfile(event.target.value);
              }}
              className="mt-2 w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm font-medium text-secondary shadow-xs outline-none transition focus:border-brand focus:ring-2 focus:ring-brand"
            >
              <option value="">Default brand (Eduit)</option>
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
        </aside>
      </div>

      <InsertBlockPalette
        editor={editor}
        open={insertPaletteOpen}
        onClose={() => setInsertPaletteOpen(false)}
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
    </div>
  );
}
