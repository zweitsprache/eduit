"use client";

import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/core';
import { useEditorState } from '@tiptap/react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  PlusSquare,
  Trash01,
  XClose,
} from '@untitledui/icons';
import {
  Bold,
  BookOpen,
  Heading2,
  Heading3,
  Italic,
  Link,
  List as ListIcon,
  ListOrdered,
  RotateCcw,
  TextAlignCenter,
  TextAlignEnd,
  TextAlignStart,
  User,
} from 'lucide-react';
import {
  DEFAULT_MCQ_INSTRUCTION,
  type MCQAttrs,
  type MCQOption,
} from '@/components/editor/mcq-node';
import {
  DEFAULT_MATCHING_INSTRUCTION,
  type MatchingPair,
  type MatchingPairsAttrs,
} from '@/components/editor/matching-pairs-node';
import {
  normalizeMCMRowText,
  type MCMAttrs,
  type MCMOption,
  type MCMRow,
} from '@/components/editor/mcm-node';
import type {
  MCHAttrs,
  MCHOption,
  MCHRow,
} from '@/components/editor/mch-node';
import type {
  TrueFalseAttrs,
  TrueFalseRow,
  TrueFalseValue,
} from '@/components/editor/true-false-node';
import type {
  OrderingAttrs,
  OrderingItem,
} from '@/components/editor/ordering-node';
import type { FillInTheBlankAttrs } from '@/components/editor/fill-in-the-blank-node';
import type {
  GlossaryTerm,
  GlossaryTermsAttrs,
  GlossaryTermWidth,
} from '@/components/editor/glossary-terms-node';
import type {
  FrayerModelAttrs,
  FrayerQuadrant,
} from '@/components/editor/frayer-model-node';
import type {
  LearningObjectiveAttrs,
  SuccessCriterion,
} from '@/components/editor/learning-objective-node';
import type {
  DialogueAttrs,
  DialogueItem,
  DialogueSpeaker,
} from '@/components/editor/dialogue-node';
import type {
  RewriteSentenceItem,
  RewriteSentencesAttrs,
} from '@/components/editor/rewrite-sentences-node';
import type {
  SortingCategoriesAttrs,
  SortingCategory,
  SortingCategoryItem,
} from '@/components/editor/sorting-categories-node';
import type {
  WordGridAttrs,
  WordGridDirection,
} from '@/components/editor/word-grid-node';
import type {
  ChooseCorrectWordItem,
  ChooseCorrectWordsAttrs,
} from '@/components/editor/choose-correct-words-node';
import type {
  InlineChoiceAttrs,
  InlineChoiceItem,
} from '@/components/editor/inline-choice-node';
import type {
  MiniFormAttrs,
  MiniFormColumns,
  MiniFormField,
  MiniFormItem,
} from '@/components/editor/mini-form-node';
import type {
  WorksheetTableAttrs,
  WorksheetTableColumn,
  WorksheetTableRow,
} from '@/components/editor/worksheet-table-node';
import type { RichTextAttrs } from '@/components/editor/rich-text-node';
import {
  DEFAULT_STANDALONE_INSTRUCTION,
  type InstructionBlockAttrs,
} from '@/components/editor/instruction-node';
import type {
  LetterNodeAttrs,
  LetterNodeItem,
} from '@/components/editor/letter-node';
import {
  DEFAULT_LETTER_INSTRUCTION,
  ENGLISH_LETTER_ALPHABET,
  GERMAN_LETTER_ALPHABET,
} from '@/components/editor/letter-node';
import {
  DEFAULT_CROSSWORD_INSTRUCTION,
  generateCrosswordLayout,
  type CrosswordAttrs,
  type CrosswordEntry,
} from '@/components/editor/crossword-node';
import {
  createErrorCorrectionMarkup,
  DEFAULT_ERROR_CORRECTION_INSTRUCTION,
  parseErrorCorrectionMarkup,
  type ErrorCorrectionAttrs,
  type ErrorCorrectionError,
} from '@/components/editor/error-correction-node';
import { errorTypeById } from '@/lib/error-correction-types';
import { InlineFormattedInput } from '@/components/editor/custom-blocks/inline-formatted-input';
import { Toggle } from '@/components/base/toggle/toggle';
import {
  ContentCard,
  ContentAddButton,
  ContentFieldLabel,
  ContentInlineAddButton,
  ContentItemActions,
  ContentItemGrid,
  ContentItemNumber,
  ContentManual,
  ContentManualItem,
  ContentOptionButtonGroup,
  ContentSecondaryButton,
  ContentSectionHeader,
  ContentSwitch,
  ContentSwitchGrid,
  CorrectState,
} from '@/components/editor/content-modal-ui';
import {
  DEFAULT_BLOCK_INSTRUCTIONS,
  type InstructionOverrideBlock,
} from '@/components/editor/custom-blocks/instructions';

export type ContentEditorBlock = {
  pos: number;
  type:
    | 'mcq'
    | 'ordering'
    | 'matchingPairs'
    | 'mcm'
    | 'mch'
    | 'trueFalse'
    | 'fillInTheBlank'
    | 'glossaryTerms'
    | 'frayerModel'
    | 'learningObjective'
    | 'dialogue'
    | 'rewriteSentences'
    | 'sortingCategories'
    | 'wordGrid'
    | 'chooseCorrectWords'
    | 'inlineChoice'
    | 'miniForm'
    | 'worksheetTable'
    | 'richText'
    | 'instructionBlock'
    | 'letterNode'
    | 'crossword'
    | 'errorCorrection';
};

const TITLES: Record<ContentEditorBlock['type'], string> = {
  mcq: 'Multiple-choice content',
  ordering: 'Ordering / sequencing content',
  matchingPairs: 'Matching-pairs content',
  mcm: 'Multiple-choice matrix content',
  mch: 'Header matrix content',
  trueFalse: 'True / false content',
  fillInTheBlank: 'Fill in the blank content',
  glossaryTerms: 'Glossary terms content',
  frayerModel: 'Frayer model content',
  learningObjective: 'Learning objective content',
  dialogue: 'Dialogue content',
  rewriteSentences: 'Rewrite sentences content',
  sortingCategories: 'Sorting categories content',
  wordGrid: 'Word grid content',
  chooseCorrectWords: 'Choose correct words content',
  inlineChoice: 'Inline choice content',
  miniForm: 'Mini form content',
  worksheetTable: 'Table content',
  richText: 'Rich Text content',
  instructionBlock: 'Instruction content',
  letterNode: 'Letter Node content',
  crossword: 'Crossword content',
  errorCorrection: 'Error correction text content',
};

function updateAttrs(
  editor: Editor,
  block: ContentEditorBlock,
  patch: Record<string, unknown>,
) {
  editor.chain().command(({ tr }) => {
    const node = tr.doc.nodeAt(block.pos);
    if (node?.type.name !== block.type) return false;
    Object.entries(patch).forEach(([key, value]) => {
      tr.setNodeAttribute(block.pos, key, value);
    });
    return true;
  }).run();
}

function InstructionOverrideEditor({
  attrs,
  block,
  editor,
}: {
  attrs: Record<string, unknown>;
  block: ContentEditorBlock & { type: InstructionOverrideBlock };
  editor: Editor;
}) {
  const defaultInstruction = DEFAULT_BLOCK_INSTRUCTIONS[block.type];
  const instruction = typeof attrs.instruction === 'string'
    ? attrs.instruction
    : defaultInstruction;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3">
        <ContentFieldLabel>Instruction</ContentFieldLabel>
        <button
          type="button"
          aria-label="Reset instruction"
          title="Reset instruction"
          disabled={!attrs.instruction}
          onClick={() => updateAttrs(editor, block, { instruction: null })}
          className="flex size-8 items-center justify-center rounded-md text-quaternary hover:bg-primary_hover hover:text-secondary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      <input
        type="text"
        aria-label={`${TITLES[block.type]} instruction`}
        value={instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 h-9 w-full rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
    </div>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}

function StandaloneInstructionEditor({
  attrs,
  block,
  editor,
}: {
  attrs: InstructionBlockAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  return (
    <>
      <ContentFieldLabel
        action={(
          <button
            type="button"
            aria-label="Reset instruction"
            title="Reset instruction"
            disabled={attrs.instruction === DEFAULT_STANDALONE_INSTRUCTION}
            onClick={() => updateAttrs(editor, block, {
              instruction: DEFAULT_STANDALONE_INSTRUCTION,
            })}
            className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      >
        Instruction
      </ContentFieldLabel>
      <input
        type="text"
        aria-label="Instruction text"
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 h-9 w-full rounded-md border border-primary bg-primary px-3 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
    </>
  );
}

function RichTextEditor({
  attrs,
  block,
  editor,
}: {
  attrs: RichTextAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const inputRef = useRef<HTMLDivElement>(null);

  function saveContent() {
    const input = inputRef.current;
    if (!input) return;
    updateAttrs(editor, block, {
      html: input.innerHTML || '<p><br></p>',
    });
  }

  function runCommand(command: string, value?: string) {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    document.execCommand(command, false, value);
    saveContent();
  }

  function addLink() {
    const url = window.prompt('Link URL', 'https://');
    if (!url?.trim()) return;
    runCommand('createLink', url.trim());
  }

  const tools = [
    {
      label: 'Bold',
      icon: <Bold className="size-4" />,
      action: () => runCommand('bold'),
    },
    {
      label: 'Italic',
      icon: <Italic className="size-4" />,
      action: () => runCommand('italic'),
    },
    {
      label: 'Heading 2',
      icon: <Heading2 className="size-4" />,
      action: () => runCommand('formatBlock', 'h2'),
    },
    {
      label: 'Heading 3',
      icon: <Heading3 className="size-4" />,
      action: () => runCommand('formatBlock', 'h3'),
    },
    {
      label: 'Bulleted list',
      icon: <ListIcon className="size-4" />,
      action: () => runCommand('insertUnorderedList'),
    },
    {
      label: 'Numbered list',
      icon: <ListOrdered className="size-4" />,
      action: () => runCommand('insertOrderedList'),
    },
    {
      label: 'Add link',
      icon: <Link className="size-4" />,
      action: addLink,
    },
  ];

  return (
    <>
      <ContentFieldLabel>Text</ContentFieldLabel>
      <div className="mt-2 overflow-hidden rounded-md border border-primary bg-primary focus-within:border-brand focus-within:ring-2 focus-within:ring-brand">
        <div className="flex flex-wrap gap-1 border-b border-secondary bg-secondary p-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              title={tool.label}
              aria-label={tool.label}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.action}
              className="flex size-8 items-center justify-center rounded text-quaternary transition hover:bg-primary hover:text-secondary"
            >
              {tool.icon}
            </button>
          ))}
        </div>
        <div
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={saveContent}
          className="rich-text-modal-input min-h-72 px-4 py-3 text-sm text-secondary outline-none"
          dangerouslySetInnerHTML={{ __html: attrs.html }}
        />
      </div>
      <ContentManual>
        <ContentManualItem icon="T" title="Structure the text">
          Use paragraphs and subheadings to organize explanations, source
          texts, or reading passages.
        </ContentManualItem>
        <ContentManualItem icon="B" title="Emphasize information">
          Select text, then apply bold or italic formatting.
        </ContentManualItem>
        <ContentManualItem icon="≡" title="Add lists and links">
          Create bulleted or numbered lists, or attach a web link to selected
          text.
        </ContentManualItem>
      </ContentManual>
    </>
  );
}

function Preview({
  attrs,
  block,
  editor,
}: {
  attrs: Record<string, unknown>;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    let innerFrame = 0;
    const outerFrame = requestAnimationFrame(() => {
      innerFrame = requestAnimationFrame(() => {
        const nodeDom = editor.view.nodeDOM(block.pos);
        if (!(nodeDom instanceof HTMLElement)) return;
        const clone = nodeDom.cloneNode(true) as HTMLElement;
        clone.classList.remove(
          'ProseMirror-selectednode',
          'custom-block--selected',
          'heading-node--selected',
        );
        clone.style.setProperty('margin', '0', 'important');
        preview.replaceChildren(clone);
      });
    });
    return () => {
      cancelAnimationFrame(outerFrame);
      cancelAnimationFrame(innerFrame);
    };
  }, [attrs, block.pos, editor]);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;
    const source = editor.view.dom;
    Array.from(source.attributes).forEach((attribute) => {
      if (
        attribute.name !== 'class'
        && attribute.name !== 'contenteditable'
        && attribute.name !== 'role'
        && attribute.name !== 'style'
      ) {
        preview.setAttribute(attribute.name, attribute.value);
      }
    });
    Array.from(source.style).forEach((property) => {
      if (property.startsWith('--')) {
        preview.style.setProperty(
          property,
          source.style.getPropertyValue(property),
          source.style.getPropertyPriority(property),
        );
      }
    });
    const nodeDom = editor.view.nodeDOM(block.pos);
    const blockWidth = nodeDom instanceof HTMLElement
      ? nodeDom.getBoundingClientRect().width
      : 576;
    preview.style.setProperty('height', 'auto', 'important');
    preview.style.setProperty('min-height', '0', 'important');
    preview.style.setProperty('max-height', 'none', 'important');
    preview.style.setProperty('width', `${blockWidth}px`, 'important');
    preview.style.setProperty('min-width', `${blockWidth}px`, 'important');
    preview.style.setProperty('max-width', `${blockWidth}px`, 'important');
    preview.style.setProperty('overflow', 'visible', 'important');
    preview.style.setProperty('margin', '0', 'important');
    preview.style.setProperty('padding', '0', 'important');
    preview.style.setProperty('border', '0', 'important');
    preview.style.setProperty('outline', '0', 'important');
    preview.style.setProperty('box-shadow', 'none', 'important');
  }, [block.pos, editor]);

  return (
    <div className="sticky top-0">
      <div className="overflow-auto bg-primary">
        <div
          className={`${editor.view.dom.className} block-content-editor-preview bg-primary`}
          ref={previewRef}
        />
      </div>
      {block.type === 'mcq' && (
        <div className="mt-6 border-t border-secondary pt-5">
          <BookOpen
            aria-label="Editing guide"
            className="size-5 text-secondary"
          />
          <div className="mt-4 space-y-4 text-sm leading-6 text-tertiary">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded border border-primary bg-primary">
                <span className="size-2.5 rounded-xs bg-brand-solid" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Mark correct answers
                </strong>
                Select the checkbox beside every correct answer. In
                single-answer mode, selecting a new answer replaces the
                previous selection; multiple-answer mode allows several.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex shrink-0 items-center gap-1 text-secondary">
                <PlusSquare className="size-5" />
                <Trash01 className="size-5" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Add or delete answers
                </strong>
                Use <strong className="font-semibold text-secondary">+ Add answer</strong>{' '}
                to create another option. Select the{' '}
                <Trash01
                  aria-label="trash"
                  className="inline size-4 -translate-y-px"
                />{' '}
                button to remove an answer. Every question keeps at least two
                answer options.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex shrink-0 items-center text-secondary">
                <ChevronUp className="size-5" />
                <ChevronDown className="size-5 -ml-1" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Change answer order
                </strong>
                Use the up and down arrows to move an answer. The number and
                worksheet preview update immediately.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 min-w-9 shrink-0 rounded border border-primary bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold text-secondary">
                ⌘B
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Format answer text
                </strong>
                Select text and press <strong className="font-semibold text-secondary">⌘B</strong>{' '}
                on macOS or <strong className="font-semibold text-secondary">Ctrl+B</strong>{' '}
                elsewhere to make it bold. Press Enter to add a line break.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center font-semibold text-[var(--custom-block-solution-color)]">
                ×
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Preview solutions
                </strong>
                Correct choices use the worksheet’s hand-drawn solution mark.
                Turn on <strong className="font-semibold text-secondary">Show solutions</strong>{' '}
                in document settings to display them.
              </p>
            </div>
          </div>
        </div>
      )}
      {block.type === 'ordering' && (
        <div className="mt-6 border-t border-secondary pt-5">
          <BookOpen
            aria-label="Editing guide"
            className="size-5 text-secondary"
          />
          <div className="mt-4 space-y-4 text-sm leading-6 text-tertiary">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 rounded bg-secondary px-1.5 py-0.5 text-center text-xs font-bold tabular-nums text-secondary">
                01
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Enter the correct sequence
                </strong>
                Add the steps in their correct answer order. The numbered
                authoring list represents the solution, even when learners see
                the items shuffled.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex shrink-0 items-center gap-1 text-secondary">
                <PlusSquare className="size-5" />
                <Trash01 className="size-5" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Add or delete steps
                </strong>
                Use <strong className="font-semibold text-secondary">+ Add step</strong>{' '}
                to extend the sequence. Select the{' '}
                <Trash01
                  aria-label="trash"
                  className="inline size-4 -translate-y-px"
                />{' '}
                button to remove a step. Every activity keeps at least two
                items.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex shrink-0 items-center text-secondary">
                <ChevronUp className="size-5" />
                <ChevronDown className="size-5 -ml-1" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Change the correct order
                </strong>
                Use the up and down arrows to move a step. Its answer number
                and the learner preview update immediately.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex size-6 items-center justify-center text-lg text-secondary">
                ↝
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Shuffle the learner view
                </strong>
                Enable <strong className="font-semibold text-secondary">Shuffle learner view</strong>{' '}
                in block properties. Use{' '}
                <strong className="font-semibold text-secondary">Reshuffle learner view</strong>{' '}
                to generate another stable arrangement.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 min-w-9 shrink-0 rounded border border-primary bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold text-secondary">
                ⌘B
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Format step text
                </strong>
                Select text and press <strong className="font-semibold text-secondary">⌘B</strong>{' '}
                on macOS or <strong className="font-semibold text-secondary">Ctrl+B</strong>{' '}
                elsewhere to make it bold. Line breaks are preserved.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex size-5 shrink-0 items-center justify-center font-semibold text-secondary">
                1
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Examples and solutions
                </strong>
                A random item may be completed as an example. When worksheet
                solutions are enabled, every remaining box displays its
                correct sequence number.
              </p>
            </div>
          </div>
        </div>
      )}
      {block.type === 'matchingPairs' && (
        <div className="mt-6 border-t border-secondary pt-5">
          <BookOpen
            aria-label="Editing guide"
            className="size-5 text-secondary"
          />
          <div className="mt-4 space-y-4 text-sm leading-6 text-tertiary">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 text-center text-lg text-secondary">↔</span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Build correct pairs
                </strong>
                Enter related content in the Left and Right fields of each
                card. The two values in one card form the correct match.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex items-center gap-1 text-secondary">
                <PlusSquare className="size-5" />
                <Trash01 className="size-5" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Add or delete pairs
                </strong>
                Use <strong className="font-semibold text-secondary">+ Add pair</strong>{' '}
                to create another match. Select the{' '}
                <Trash01
                  aria-label="trash"
                  className="inline size-4 -translate-y-px"
                />{' '}
                button to remove one. Every activity keeps at least two pairs.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 flex items-center text-secondary">
                <ChevronUp className="size-5" />
                <ChevronDown className="size-5 -ml-1" />
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Reorder pairs
                </strong>
                Use the arrow buttons to change the left-column order without
                breaking the relationship between paired values.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 text-center text-lg text-secondary">⌘</span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Configure learner support
                </strong>
                Show a word bank, shuffle its contents, or reveal the first
                pair as an example using the toggles above.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 min-w-9 rounded border border-primary bg-secondary px-1.5 py-0.5 text-center text-xs font-semibold text-secondary">
                ⌘B
              </span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Format pair text
                </strong>
                Select text and press <strong className="font-semibold text-secondary">⌘B</strong>{' '}
                on macOS or <strong className="font-semibold text-secondary">Ctrl+B</strong>{' '}
                elsewhere to make it bold. Line breaks are preserved.
              </p>
            </div>

            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-start gap-3">
              <span className="mt-1 text-center font-semibold text-secondary">╱</span>
              <p>
                <strong className="block font-semibold text-secondary">
                  Preview solutions
                </strong>
                When worksheet solutions are enabled, the preview draws the
                correct connections between both columns.
              </p>
            </div>
          </div>
        </div>
      )}
      {block.type === 'mcm' && (
        <ContentManual>
          <ContentManualItem icon="✓" title="Mark correct options">
            Use the green state square beside every valid option. Each row can
            have one or several correct answers.
          </ContentManualItem>
          <ContentManualItem icon="↕" title="Build and reorder rows">
            Add rows, edit their labels and choices, then use the arrow controls
            to change worksheet order.
          </ContentManualItem>
          <ContentManualItem icon="×" title="Preview solutions">
            Correct options use the worksheet’s hand-drawn solution marks.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'mch' && (
        <ContentManual>
          <ContentManualItem icon="A" title="Define shared header options">
            Header options are reused by every statement. Each row selects one
            option as its correct answer.
          </ContentManualItem>
          <ContentManualItem icon="↕" title="Manage statements">
            Add, remove, and reorder statements without changing their selected
            answer.
          </ContentManualItem>
          <ContentManualItem icon="×" title="Examples and solutions">
            Example mode reveals the first row; document solutions reveal the
            remaining rows.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'trueFalse' && (
        <ContentManual>
          <ContentManualItem icon="T/F" title="Set answer labels">
            Rename True and False for the activity language. Enable N/A when a
            third response is useful.
          </ContentManualItem>
          <ContentManualItem icon="↕" title="Manage statements">
            Add, remove, and reorder statements, then choose the correct value
            for each one.
          </ContentManualItem>
          <ContentManualItem icon="×" title="Examples and solutions">
            Example mode reveals the first statement; worksheet solutions
            reveal all remaining answers.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'fillInTheBlank' && (
        <ContentManual>
          <ContentManualItem icon="{{ }}" title="Create blanks">
            Wrap each correct answer in <strong>{'{{blank:answer}}'}</strong>.
            Add <strong>|2</strong> after an answer to make that blank wider.
          </ContentManualItem>
          <ContentManualItem icon="≡" title="Create several rows">
            Start a new line for each separate sentence or question.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Control learner support">
            Use the switches to show a word bank, hide blank numbers, or reveal
            the first answer as an example.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'glossaryTerms' && (
        <ContentManual>
          <ContentManualItem icon="T" title="Build each glossary entry">
            Add a term, its definition, and an optional example in each card.
          </ContentManualItem>
          <ContentManualItem icon="↕" title="Organize the glossary">
            Reorder entries with the arrow controls or remove them with the
            trash action.
          </ContentManualItem>
          <ContentManualItem icon="↔" title="Balance the columns">
            Adjust the term-column width to give short or long terms the right
            amount of space.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'frayerModel' && (
        <ContentManual>
          <ContentManualItem icon="◇" title="Set the key concept">
            Enter the vocabulary word or central concept shown in the middle.
          </ContentManualItem>
          <ContentManualItem icon="4" title="Customize the quadrants">
            Rename every quadrant and add model answers. Answers accept line
            breaks and bold formatting with ⌘B or Ctrl+B.
          </ContentManualItem>
          <ContentManualItem icon="↕" title="Size the response areas">
            Increase response height when learners need more writing space, and
            enable model answers when preparing a completed version.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'learningObjective' && (
        <ContentManual>
          <ContentManualItem icon="◎" title="State the objective">
            Describe the knowledge or skill learners should demonstrate in
            clear, observable language.
          </ContentManualItem>
          <ContentManualItem icon="#" title="Connect the curriculum">
            Add an optional curriculum code so the objective can be traced back
            to the relevant standard.
          </ContentManualItem>
          <ContentManualItem icon="✓" title="Define success">
            Add concise criteria learners can use to check whether they have
            achieved the objective. Criteria support line breaks and bold text.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'dialogue' && (
        <ContentManual>
          <ContentManualItem icon="1–4" title="Assign speakers">
            Choose a speaker number for each line. Consecutive lines from the
            same speaker are grouped into one turn.
          </ContentManualItem>
          <ContentManualItem icon="{{ }}" title="Add answer blanks">
            Wrap an answer in <strong>{'{{blank:answer}}'}</strong>. Add
            <strong>|2</strong> to make an individual blank wider.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Support learners">
            Show the original dialogue, provide a word bank, hide blank numbers,
            or reveal the first answer as an example.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'rewriteSentences' && (
        <ContentManual>
          <ContentManualItem icon="→" title="Provide input and solution">
            Enter the learner-facing sentence and the corrected version shown
            in examples or worksheet solutions.
          </ContentManualItem>
          <ContentManualItem icon="|" title="Create a word bank">
            Separate words with <strong>|</strong> to generate and solve a
            shuffled word bank automatically. Use <strong>||</strong> when the
            solution should be entered manually.
          </ContentManualItem>
          <ContentManualItem icon="▧" title="Add optional visual context">
            Supply an image URL and concise alternative text when a sentence
            benefits from a visual prompt.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'sortingCategories' && (
        <ContentManual>
          <ContentManualItem icon="▦" title="Define the categories">
            Add up to four category headings before assigning each item to its
            correct destination.
          </ContentManualItem>
          <ContentManualItem icon="↳" title="Assign every item">
            Enter the learner-facing text and choose its answer category from
            the selector below it.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Support learners">
            Color coding links items to categories visually, while example mode
            demonstrates one completed placement.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'wordGrid' && (
        <ContentManual>
          <ContentManualItem icon="▦" title="Size and regenerate the grid">
            Choose the row and column count, then regenerate to create a new
            deterministic arrangement of the same words.
          </ContentManualItem>
          <ContentManualItem icon="↗" title="Choose directions">
            Enable one or several reading directions. At least one direction
            must remain active.
          </ContentManualItem>
          <ContentManualItem icon="+" title="Manage the word list">
            Add, remove, and reorder words. Keep words short enough to fit the
            selected grid dimensions.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'chooseCorrectWords' && (
        <ContentManual>
          <ContentManualItem icon="Aa" title="Enter correct words">
            Each source word generates one or more correct spellings alongside
            shuffled distractors.
          </ContentManualItem>
          <ContentManualItem icon="↔" title="Protect word edges">
            Keep characters on the left or right unchanged while the middle
            characters are varied.
          </ContentManualItem>
          <ContentManualItem icon="⌘" title="Regenerate choices">
            Regenerate to produce another stable set and order of distractors
            without changing the source words.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'inlineChoice' && (
        <ContentManual>
          <ContentManualItem icon="{{ }}" title="Create a choice group">
            Write choices inside double braces and separate them with a vertical
            bar, for example <strong>{'{{*correct|wrong}}'}</strong>. Prefix
            every correct choice with an asterisk.
          </ContentManualItem>
          <ContentManualItem icon="—" title="Add visual spacing">
            Add a blank row between groups of sentences when the activity
            contains several short exchanges.
          </ContentManualItem>
          <ContentManualItem icon="T" title="Add an unnumbered subtitle">
            Use a subtitle to introduce a new group. Subtitle text is not
            numbered and double-brace choice syntax is treated as plain text.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Support learners">
            Shuffle the displayed choices or reveal the first sentence as a
            worked example.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'miniForm' && (
        <ContentManual>
          <ContentManualItem icon="▤" title="Define reusable fields">
            Field labels are shared by every item. Choose one, two, or three
            columns to control their worksheet layout. Fill the remaining row
            when the final field should use otherwise empty grid space.
          </ContentManualItem>
          <ContentManualItem icon="→" title="Connect prompts and answers">
            Enter a source prompt, then provide its answer for every field below
            it. Worksheet solutions use these stored values.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Show an example">
            Example mode completes the first field of the first item to
            demonstrate the expected response.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'worksheetTable' && (
        <ContentManual>
          <ContentManualItem icon="12" title="Build the column grid">
            Column spans share a twelve-unit grid. Their alignment applies to
            every corresponding cell.
          </ContentManualItem>
          <ContentManualItem icon="H" title="Create headers with rows">
            Enable <strong>Header</strong> on any row. Header rows can appear
            at the top or between groups of regular rows.
          </ContentManualItem>
          <ContentManualItem icon="{{ }}" title="Create answer blanks">
            Use <strong>{'{{blank:answer}}'}</strong> inside any cell. Add
            <strong>|2</strong> to make an individual blank wider.
          </ContentManualItem>
          <ContentManualItem icon="◉" title="Support learners">
            Show or hide the header, hide blank numbers, and reveal the first
            blank as an example.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'crossword' && (
        <ContentManual>
          <ContentManualItem icon="✣" title="Build the puzzle">
            Add an answer and its learner-facing clue. The layout connects
            matching letters automatically.
          </ContentManualItem>
          <ContentManualItem icon="↻" title="Try another layout">
            Regenerate the grid to choose a different valid arrangement without
            changing answers or clues.
          </ContentManualItem>
          <ContentManualItem icon="✓" title="Show solutions">
            Worksheet solutions reveal the letters in every crossword cell.
            The optional word bank can provide additional learner support.
          </ContentManualItem>
        </ContentManual>
      )}
      {block.type === 'errorCorrection' && (
        <ContentManual>
          <ContentManualItem icon="✎" title="Create controlled errors">
            The learner sees the error text. Every stored correction connects
            an exact incorrect form to its correct replacement.
          </ContentManualItem>
          <ContentManualItem icon="◌" title="Control visibility">
            Mark error positions when learners should focus on correction, or
            hide them when learners should also locate the errors.
          </ContentManualItem>
          <ContentManualItem icon="✓" title="Use the correction key">
            Worksheet solutions reveal the complete corrected text, individual
            replacements, and their short explanations.
          </ContentManualItem>
        </ContentManual>
      )}
    </div>
  );
}

function ItemActions({
  canDelete,
  canMoveDown,
  canMoveUp,
  label,
  onDelete,
  onMoveDown,
  onMoveUp,
}: {
  canDelete: boolean;
  canMoveDown: boolean;
  canMoveUp: boolean;
  label: string;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
}) {
  const buttonClass = 'flex size-8 items-center justify-center rounded-md text-quaternary transition hover:bg-primary_hover hover:text-secondary disabled:cursor-not-allowed disabled:opacity-25';
  return (
    <div className="flex self-start items-center">
      <button type="button" aria-label={`Move ${label} up`} disabled={!canMoveUp} onClick={onMoveUp} className={buttonClass}>
        <ChevronUp className="size-4" />
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={!canMoveDown} onClick={onMoveDown} className={buttonClass}>
        <ChevronDown className="size-4" />
      </button>
      <button type="button" aria-label={`Delete ${label}`} disabled={!canDelete} onClick={onDelete} className={`${buttonClass} hover:text-error-primary`}>
        <Trash01 className="size-4" />
      </button>
    </div>
  );
}

function MCQEditor({
  attrs,
  block,
  editor,
}: {
  attrs: MCQAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setOptions = (options: MCQOption[]) => updateAttrs(
    editor,
    block,
    { options },
  );
  const updateOption = (id: string, patch: Partial<MCQOption>) => {
    const options = attrs.options.map((option) => (
      option.id === id ? { ...option, ...patch } : option
    ));
    if (patch.correct && attrs.answerMode === 'single') {
      options.forEach((option) => {
        option.correct = option.id === id;
      });
    }
    setOptions(options);
  };

  return (
    <>
      {attrs.showInstruction && (
        <>
          <div className="flex items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-secondary">
              Instruction
            </label>
            <button
              type="button"
              aria-label="Reset instruction"
              title="Reset instruction"
              disabled={attrs.instruction === DEFAULT_MCQ_INSTRUCTION}
              onClick={() => updateAttrs(editor, block, {
                instruction: DEFAULT_MCQ_INSTRUCTION,
              })}
              className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
            >
              <RotateCcw className="size-4" />
            </button>
          </div>
          <textarea
            rows={1}
            value={attrs.instruction || DEFAULT_MCQ_INSTRUCTION}
            placeholder={DEFAULT_MCQ_INSTRUCTION}
            onChange={(event) => updateAttrs(editor, block, {
              instruction: event.target.value,
            })}
            className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </>
      )}

      <label className={`${attrs.showInstruction ? 'mt-6' : ''} block text-sm font-semibold text-secondary`}>Question</label>
      <InlineFormattedInput
        ariaLabel="Multiple-choice question"
        multiline
        value={attrs.question}
        onChange={(question) => updateAttrs(editor, block, { question })}
        placeholder="Enter the question"
        className="mt-2 min-h-20 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Shuffle answers"
            size="md"
            isSelected={attrs.shuffleAnswers}
            onChange={(shuffleAnswers) => updateAttrs(editor, block, {
              shuffleAnswers,
            })}
          />
          <span>Shuffle answers</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-secondary">Answers</p>
        <span className="text-xs text-quaternary">{attrs.options.length} items</span>
      </div>
      <div className="mt-3 space-y-2">
        {attrs.options.map((option, index) => (
          <div className="rounded-lg border border-secondary bg-secondary p-2.5" key={option.id}>
            <div className="flex items-center gap-3">
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <button
                type="button"
                role="checkbox"
                aria-checked={option.correct}
                aria-label={`Mark answer ${index + 1} correct`}
                onClick={() => updateOption(option.id, {
                  correct: !option.correct,
                })}
                className={`size-4 shrink-0 rounded-[3px] border transition ${
                  option.correct
                    ? 'border-fg-success-primary bg-fg-success-primary'
                    : 'border-primary bg-primary hover:border-secondary'
                }`}
              />
              <div className="ml-auto">
                <ItemActions
                  label={`answer ${index + 1}`}
                  canDelete={attrs.options.length > 2}
                  canMoveUp={index > 0}
                  canMoveDown={index < attrs.options.length - 1}
                  onDelete={() => setOptions(attrs.options.filter(({ id }) => id !== option.id))}
                  onMoveUp={() => setOptions(moveItem(attrs.options, index, -1))}
                  onMoveDown={() => setOptions(moveItem(attrs.options, index, 1))}
                />
              </div>
            </div>
            <InlineFormattedInput
              ariaLabel={`Answer ${index + 1}`}
              multiline
              value={option.text}
              onChange={(text) => updateOption(option.id, { text })}
              placeholder="Enter answer text"
              className="mt-1.5 min-h-12 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setOptions([...attrs.options, {
        id: `option-${Date.now()}`,
        text: `Option ${String.fromCharCode(65 + attrs.options.length)}`,
        correct: false,
      }])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover">
        <PlusSquare className="size-4" /> Add answer
      </button>
    </>
  );
}

function OrderingEditor({
  attrs,
  block,
  editor,
}: {
  attrs: OrderingAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: OrderingItem[]) => updateAttrs(editor, block, { items });
  return (
    <>
      <label className="block text-sm font-semibold text-secondary">Instruction</label>
      <textarea
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, { instruction: event.target.value })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Shuffle order"
            size="md"
            isSelected={attrs.shuffleItems}
            onChange={(shuffleItems) => updateAttrs(editor, block, {
              shuffleItems,
            })}
          />
          <span>Shuffle order</span>
        </div>
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Show example"
            size="md"
            isSelected={attrs.showRandomAsExample}
            onChange={(showRandomAsExample) => updateAttrs(editor, block, {
              showRandomAsExample,
            })}
          />
          <span>Show example</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-secondary">Correct sequence</p>
        </div>
        <span className="text-xs text-quaternary">{attrs.items.length} items</span>
      </div>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <div className="rounded-lg border border-secondary bg-secondary p-2.5" key={item.id}>
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ItemActions
                label={`step ${index + 1}`}
                canDelete={attrs.items.length > 2}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
            </div>
            <InlineFormattedInput
              ariaLabel={`Step ${index + 1}`}
              multiline
              value={item.text}
              onChange={(text) => setItems(attrs.items.map((current) => current.id === item.id ? { ...current, text } : current))}
              placeholder="Enter a step, event, or sentence"
              className="mt-1.5 min-h-14 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setItems([...attrs.items, {
        id: `ordering-${Date.now()}`,
        text: `Step ${attrs.items.length + 1}`,
      }])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover">
        <PlusSquare className="size-4" /> Add step
      </button>
    </>
  );
}

function MCMEditor({
  attrs,
  block,
  editor,
}: {
  attrs: MCMAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setRows = (rows: MCMRow[]) => updateAttrs(editor, block, { rows });
  useEffect(() => {
    const rows = attrs.rows.map((row) => ({
      ...row,
      text: normalizeMCMRowText(row.text),
    }));
    if (rows.some((row, index) => row.text !== attrs.rows[index].text)) {
      setRows(rows);
    }
  }, [attrs.rows]);

  const updateRow = (id: string, patch: Partial<MCMRow>) => setRows(
    attrs.rows.map((row) => row.id === id ? { ...row, ...patch } : row),
  );
  const updateOption = (
    rowId: string,
    optionId: string,
    patch: Partial<MCMOption>,
  ) => setRows(attrs.rows.map((row) => row.id === rowId
    ? {
        ...row,
        options: row.options.map((option) => (
          option.id === optionId ? { ...option, ...patch } : option
        )),
      }
    : row));

  return (
    <>
      <ContentFieldLabel>Question / Text</ContentFieldLabel>
      <InlineFormattedInput
        ariaLabel="Matrix question"
        multiline
        value={attrs.question}
        onChange={(question) => updateAttrs(editor, block, { question })}
        placeholder="Enter the question"
        className="mt-2 min-h-20 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.rows.length} rows`}>
        Statement / Question rows
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.rows.map((row, rowIndex) => (
          <ContentCard key={row.id}>
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(rowIndex + 1).padStart(2, '0')}
              </span>
              <ContentItemActions
                label={`row ${rowIndex + 1}`}
                canDelete={attrs.rows.length > 1}
                canMoveUp={rowIndex > 0}
                canMoveDown={rowIndex < attrs.rows.length - 1}
                onDelete={() => setRows(attrs.rows.filter(({ id }) => id !== row.id))}
                onMoveUp={() => setRows(moveItem(attrs.rows, rowIndex, -1))}
                onMoveDown={() => setRows(moveItem(attrs.rows, rowIndex, 1))}
              />
            </div>
            <InlineFormattedInput
              ariaLabel={`Row ${rowIndex + 1}`}
              value={row.text}
              onChange={(text) => updateRow(row.id, { text })}
              placeholder="Statement / Question row"
              className="mt-1.5 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
            />
            <div className="mt-2 grid grid-cols-1 gap-2">
              {row.options.map((option, optionIndex) => (
                <div className="flex items-center gap-2" key={option.id}>
                  <CorrectState
                    checked={option.correct}
                    label={`Mark row ${rowIndex + 1}, option ${optionIndex + 1} correct`}
                    onChange={(correct) => updateOption(
                      row.id,
                      option.id,
                      { correct },
                    )}
                  />
                  <input
                    value={option.text}
                    aria-label={`Row ${rowIndex + 1}, option ${optionIndex + 1}`}
                    onChange={(event) => updateOption(
                      row.id,
                      option.id,
                      { text: event.target.value },
                    )}
                    className="min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                  <button
                    type="button"
                    aria-label={`Delete option ${optionIndex + 1}`}
                    disabled={row.options.length <= 1}
                    onClick={() => updateRow(row.id, {
                      options: row.options.filter(({ id }) => id !== option.id),
                    })}
                    className="text-quaternary hover:text-error-primary disabled:opacity-25"
                  >
                    <Trash01 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
            <ContentInlineAddButton
              disabled={row.options.length >= 3}
              onClick={() => updateRow(row.id, {
                options: [...row.options, {
                  id: `${row.id}-option-${Date.now()}`,
                  text: `Option ${String.fromCharCode(65 + row.options.length)}`,
                  correct: false,
                }],
              })}
            >
              + Add option
            </ContentInlineAddButton>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows([...attrs.rows, {
          id: `row-${Date.now()}`,
          text: `Statement / Question row ${String.fromCharCode(65 + attrs.rows.length)}`,
          options: [
            { id: `option-${Date.now()}-a`, text: 'Option A', correct: false },
            { id: `option-${Date.now()}-b`, text: 'Option B', correct: false },
          ],
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add row
      </button>
    </>
  );
}

function MCHEditor({
  attrs,
  block,
  editor,
}: {
  attrs: MCHAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setOptions = (options: MCHOption[]) => {
    const ids = new Set(options.map(({ id }) => id));
    updateAttrs(editor, block, {
      options,
      rows: attrs.rows.map((row) => ({
        ...row,
        correctOptionId: row.correctOptionId
          && ids.has(row.correctOptionId)
          ? row.correctOptionId
          : null,
      })),
    });
  };
  const setRows = (rows: MCHRow[]) => updateAttrs(editor, block, { rows });
  return (
    <>
      <ContentFieldLabel>Question</ContentFieldLabel>
      <InlineFormattedInput
        ariaLabel="Header matrix question"
        multiline
        value={attrs.question}
        onChange={(question) => updateAttrs(editor, block, { question })}
        placeholder="Enter the question"
        className="mt-2 min-h-20 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.options.length} options`}>
        Header options
      </ContentSectionHeader>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {attrs.options.map((option, index) => (
          <div className="flex items-center gap-2" key={option.id}>
            <span className="text-xs font-bold text-secondary">
              {String.fromCharCode(65 + index)}
            </span>
            <input
              value={option.text}
              onChange={(event) => setOptions(attrs.options.map((current) => (
                current.id === option.id
                  ? { ...current, text: event.target.value }
                  : current
              )))}
              className="min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
            <button
              type="button"
              disabled={attrs.options.length <= 1}
              onClick={() => setOptions(attrs.options.filter(({ id }) => id !== option.id))}
              className="text-quaternary hover:text-error-primary disabled:opacity-25"
            >
              <Trash01 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <ContentInlineAddButton
        disabled={attrs.options.length >= 4}
        onClick={() => setOptions([...attrs.options, {
          id: `option-${Date.now()}`,
          text: `Option ${String.fromCharCode(65 + attrs.options.length)}`,
        }])}
      >
        + Add header option
      </ContentInlineAddButton>
      <ContentSectionHeader count={`${attrs.rows.length} rows`}>
        Statements
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.rows.map((row, index) => (
          <ContentCard key={row.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                aria-label={`Statement ${index + 1}`}
                value={row.text}
                onChange={(event) => setRows(attrs.rows.map((current) => (
                  current.id === row.id
                    ? { ...current, text: event.target.value }
                    : current
                )))}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`row ${index + 1}`}
                canDelete={attrs.rows.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.rows.length - 1}
                onDelete={() => setRows(attrs.rows.filter(({ id }) => id !== row.id))}
                onMoveUp={() => setRows(moveItem(attrs.rows, index, -1))}
                onMoveDown={() => setRows(moveItem(attrs.rows, index, 1))}
              />
              <select
                aria-label={`Correct option for row ${index + 1}`}
                value={row.correctOptionId ?? ''}
                onChange={(event) => setRows(attrs.rows.map((current) => (
                  current.id === row.id
                    ? { ...current, correctOptionId: event.target.value || null }
                    : current
                )))}
                className="col-start-2 w-full rounded-md border border-primary bg-primary px-2 py-1.5 text-sm text-secondary"
              >
                <option value="">No answer</option>
                {attrs.options.map((option, optionIndex) => (
                  <option value={option.id} key={option.id}>
                    {option.text || `Option ${String.fromCharCode(65 + optionIndex)}`}
                  </option>
                ))}
              </select>
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows([...attrs.rows, {
          id: `row-${Date.now()}`,
          text: `Answer row ${attrs.rows.length + 1}`,
          correctOptionId: null,
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add row
      </button>
    </>
  );
}

function TrueFalseEditor({
  attrs,
  block,
  editor,
}: {
  attrs: TrueFalseAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setRows = (rows: TrueFalseRow[]) => updateAttrs(editor, block, { rows });
  const answerOptions: Array<{ label: string; value: TrueFalseValue }> = [
    { label: attrs.trueLabel, value: 'true' },
    { label: attrs.falseLabel, value: 'false' },
    ...(attrs.showNa ? [{ label: attrs.naLabel, value: 'na' as const }] : []),
  ];
  return (
    <>
      <ContentFieldLabel>Question</ContentFieldLabel>
      <InlineFormattedInput
        ariaLabel="True or false question"
        multiline
        value={attrs.question}
        onChange={(question) => updateAttrs(editor, block, { question })}
        placeholder="Optional prompt"
        className="mt-2 min-h-16 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show N/A"
          isSelected={attrs.showNa}
          onChange={(showNa) => updateAttrs(editor, block, {
            showNa,
            rows: showNa
              ? attrs.rows
              : attrs.rows.map((row) => ({
                  ...row,
                  correctValue: row.correctValue === 'na'
                    ? null
                    : row.correctValue,
                })),
          })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Answer labels</ContentSectionHeader>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {([
          ['trueLabel', 'True'],
          ['falseLabel', 'False'],
          ...(attrs.showNa ? [['naLabel', 'N/A']] : []),
        ] as Array<[keyof TrueFalseAttrs, string]>).map(([key, label]) => (
          <label className="text-xs font-semibold text-tertiary" key={key}>
            {label}
            <input
              value={String(attrs[key])}
              onChange={(event) => updateAttrs(editor, block, {
                [key]: event.target.value,
              })}
              className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>
        ))}
      </div>
      <ContentSectionHeader count={`${attrs.rows.length} statements`}>
        Statements
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.rows.map((row, index) => (
          <ContentCard key={row.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                value={row.text}
                onChange={(event) => setRows(attrs.rows.map((current) => (
                  current.id === row.id
                    ? { ...current, text: event.target.value }
                    : current
                )))}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`statement ${index + 1}`}
                canDelete={attrs.rows.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.rows.length - 1}
                onDelete={() => setRows(attrs.rows.filter(({ id }) => id !== row.id))}
                onMoveUp={() => setRows(moveItem(attrs.rows, index, -1))}
                onMoveDown={() => setRows(moveItem(attrs.rows, index, 1))}
              />
              <select
                aria-label={`Correct answer for statement ${index + 1}`}
                value={row.correctValue ?? ''}
                onChange={(event) => setRows(attrs.rows.map((current) => (
                  current.id === row.id
                    ? {
                        ...current,
                        correctValue:
                          (event.target.value as TrueFalseValue) || null,
                      }
                    : current
                )))}
                className="col-start-2 w-full rounded-md border border-primary bg-primary px-2 py-1.5 text-sm text-secondary"
              >
                <option value="">No answer</option>
                {answerOptions.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows([...attrs.rows, {
          id: `row-${Date.now()}`,
          text: `Statement ${attrs.rows.length + 1}`,
          correctValue: null,
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add statement
      </button>
    </>
  );
}

function FillInTheBlankEditor({
  attrs,
  block,
  editor,
}: {
  attrs: FillInTheBlankAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  return (
    <>
      <ContentFieldLabel>Question / Text</ContentFieldLabel>
      <textarea
        aria-label="Fill in the blank text"
        rows={7}
        value={attrs.text}
        onChange={(event) => updateAttrs(editor, block, {
          text: event.target.value,
        })}
        className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Default blank width</ContentSectionHeader>
      <ContentOptionButtonGroup
        ariaLabel="Default blank width"
        value={String(attrs.widthFactor)}
        onChange={(widthFactor) => updateAttrs(editor, block, {
          widthFactor: Number(widthFactor),
        })}
        options={[1, 1.25, 1.5, 1.75, 2].map((width) => ({
          label: `${width} ×`,
          value: String(width),
        }))}
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show word bank"
          isSelected={attrs.showWordBank}
          onChange={(showWordBank) => updateAttrs(editor, block, { showWordBank })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
        <ContentSwitch
          label="Hide blank numbers"
          isSelected={attrs.hideBlankNumbers}
          onChange={(hideBlankNumbers) => updateAttrs(editor, block, {
            hideBlankNumbers,
          })}
        />
        <ContentSwitch
          label="Hide item numbers"
          isSelected={attrs.hideItemNumbers}
          onChange={(hideItemNumbers) => updateAttrs(editor, block, {
            hideItemNumbers,
          })}
        />
        {attrs.hideItemNumbers && (
          <ContentSwitch
            label="Display line numbers"
            isSelected={attrs.showLineNumbers}
            onChange={(showLineNumbers) => updateAttrs(editor, block, {
              showLineNumbers,
            })}
          />
        )}
      </ContentSwitchGrid>
      <ContentSectionHeader>Word bank distractors</ContentSectionHeader>
      <ContentFieldLabel>
        Distractors <span className="font-normal">(one per line)</span>
      </ContentFieldLabel>
      <textarea
        aria-label="Word bank distractors"
        rows={3}
        value={attrs.distractors.join('\n')}
        onChange={(event) => updateAttrs(editor, block, {
          distractors: event.target.value.split(/\r?\n/),
        })}
        placeholder="Add plausible incorrect answers…"
        className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
    </>
  );
}

function GlossaryTermsEditor({
  attrs,
  block,
  editor,
}: {
  attrs: GlossaryTermsAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setTerms = (terms: GlossaryTerm[]) => updateAttrs(editor, block, { terms });
  const updateTerm = (id: string, patch: Partial<GlossaryTerm>) => setTerms(
    attrs.terms.map((term) => term.id === id ? { ...term, ...patch } : term),
  );

  return (
    <>
      <ContentFieldLabel>Term column width</ContentFieldLabel>
      <select
        aria-label="Term column width"
        value={attrs.termWidth}
        onChange={(event) => updateAttrs(editor, block, {
          termWidth: Number(event.target.value) as GlossaryTermWidth,
        })}
        className="mt-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      >
        {[25, 33, 50, 66].map((width) => (
          <option value={width} key={width}>{width}%</option>
        ))}
      </select>
      <ContentSectionHeader count={`${attrs.terms.length} terms`}>
        Glossary entries
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.terms.map((term, index) => (
          <ContentCard key={term.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                aria-label={`Term ${index + 1}`}
                value={term.term}
                onChange={(event) => updateTerm(term.id, { term: event.target.value })}
                placeholder="Term"
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`term ${index + 1}`}
                canDelete={attrs.terms.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.terms.length - 1}
                onDelete={() => setTerms(attrs.terms.filter(({ id }) => id !== term.id))}
                onMoveUp={() => setTerms(moveItem(attrs.terms, index, -1))}
                onMoveDown={() => setTerms(moveItem(attrs.terms, index, 1))}
              />
              <textarea
                aria-label={`Definition ${index + 1}`}
                rows={2}
                value={term.definition}
                onChange={(event) => updateTerm(term.id, {
                  definition: event.target.value,
                })}
                placeholder="Definition"
                className="col-start-2 w-full resize-y rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <textarea
                aria-label={`Example ${index + 1}`}
                rows={2}
                value={term.example}
                onChange={(event) => updateTerm(term.id, {
                  example: event.target.value,
                })}
                placeholder="Example"
                className="col-start-2 w-full resize-y rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTerms([...attrs.terms, {
          id: `term-${Date.now()}`,
          term: `Term ${attrs.terms.length + 1}`,
          definition: 'Definition',
          example: 'Example',
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add term
      </button>
    </>
  );
}

function FrayerModelEditor({
  attrs,
  block,
  editor,
}: {
  attrs: FrayerModelAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setQuadrants = (quadrants: FrayerQuadrant[]) => updateAttrs(
    editor,
    block,
    { quadrants },
  );
  const updateQuadrant = (
    id: FrayerQuadrant['id'],
    patch: Partial<FrayerQuadrant>,
  ) => setQuadrants(attrs.quadrants.map((quadrant) => (
    quadrant.id === id ? { ...quadrant, ...patch } : quadrant
  )));

  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        aria-label="Frayer model instruction"
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Key concept</ContentSectionHeader>
      <input
        aria-label="Key concept"
        value={attrs.concept}
        onChange={(event) => updateAttrs(editor, block, {
          concept: event.target.value,
        })}
        className="mt-3 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show model answers"
          isSelected={attrs.showModelAnswers}
          onChange={(showModelAnswers) => updateAttrs(editor, block, {
            showModelAnswers,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Response height</ContentSectionHeader>
      <ContentOptionButtonGroup
        ariaLabel="Response height"
        value={String(attrs.responseLines)}
        onChange={(responseLines) => updateAttrs(editor, block, {
          responseLines: Number(responseLines),
        })}
        options={[1, 2, 3, 4, 5, 6].map((height) => ({
          label: `${height} ×`,
          value: String(height),
        }))}
      />
      <ContentSectionHeader count="4 quadrants">Quadrants</ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.quadrants.map((quadrant, index) => (
          <ContentCard key={quadrant.id}>
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                aria-label={`Quadrant ${index + 1} label`}
                value={quadrant.label}
                onChange={(event) => updateQuadrant(quadrant.id, {
                  label: event.target.value,
                })}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <InlineFormattedInput
                ariaLabel={`${quadrant.label} model answer`}
                multiline
                value={quadrant.answer}
                onChange={(answer) => updateQuadrant(quadrant.id, { answer })}
                placeholder="Optional model answer"
                className="col-start-2 min-h-16 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </div>
          </ContentCard>
        ))}
      </div>
    </>
  );
}

function LearningObjectiveEditor({
  attrs,
  block,
  editor,
}: {
  attrs: LearningObjectiveAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setCriteria = (successCriteria: SuccessCriterion[]) => updateAttrs(
    editor,
    block,
    { successCriteria },
  );

  return (
    <>
      <ContentFieldLabel>Curriculum code</ContentFieldLabel>
      <input
        aria-label="Curriculum code"
        value={attrs.curriculumCode}
        onChange={(event) => updateAttrs(editor, block, {
          curriculumCode: event.target.value,
        })}
        placeholder="Optional code"
        className="mt-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Objective</ContentSectionHeader>
      <InlineFormattedInput
        ariaLabel="Learning objective"
        multiline
        value={attrs.objective}
        onChange={(objective) => updateAttrs(editor, block, { objective })}
        placeholder="What should learners know or be able to do?"
        className="mt-3 min-h-20 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader count={`${attrs.successCriteria.length} criteria`}>
        Success criteria
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.successCriteria.map((criterion, index) => (
          <ContentCard key={criterion.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <InlineFormattedInput
                ariaLabel={`Success criterion ${index + 1}`}
                multiline
                value={criterion.text}
                onChange={(text) => setCriteria(attrs.successCriteria.map((item) => (
                  item.id === criterion.id ? { ...item, text } : item
                )))}
                placeholder="I can…"
                className="min-h-12 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`criterion ${index + 1}`}
                canDelete={attrs.successCriteria.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.successCriteria.length - 1}
                onDelete={() => setCriteria(attrs.successCriteria.filter(
                  ({ id }) => id !== criterion.id,
                ))}
                onMoveUp={() => setCriteria(moveItem(attrs.successCriteria, index, -1))}
                onMoveDown={() => setCriteria(moveItem(attrs.successCriteria, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setCriteria([...attrs.successCriteria, {
          id: `criterion-${Date.now()}`,
          text: 'I can…',
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add criterion
      </button>
    </>
  );
}

function DialogueEditor({
  attrs,
  block,
  editor,
}: {
  attrs: DialogueAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: DialogueItem[]) => updateAttrs(editor, block, { items });
  const updateItem = (id: string, patch: Partial<DialogueItem>) => setItems(
    attrs.items.map((item) => item.id === id ? { ...item, ...patch } : item),
  );

  return (
    <>
      <ContentSectionHeader className="mt-0">Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show original"
          isDisabled={attrs.showSpeakerNames}
          isSelected={attrs.showOriginal}
          onChange={(showOriginal) => updateAttrs(editor, block, {
            showOriginal,
            ...(showOriginal ? { showSpeakerNames: false } : {}),
          })}
        />
        <ContentSwitch
          label="Show speaker names"
          isDisabled={attrs.showOriginal}
          isSelected={attrs.showSpeakerNames}
          onChange={(showSpeakerNames) => updateAttrs(editor, block, {
            showSpeakerNames,
            ...(showSpeakerNames ? { showOriginal: false } : {}),
          })}
        />
        <ContentSwitch
          label="Show word bank"
          isSelected={attrs.showWordBank}
          onChange={(showWordBank) => updateAttrs(editor, block, { showWordBank })}
        />
        <ContentSwitch
          label="Hide blank numbers"
          isSelected={attrs.hideBlankNumbers}
          onChange={(hideBlankNumbers) => updateAttrs(editor, block, {
            hideBlankNumbers,
          })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Speaker names</ContentSectionHeader>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {([1, 2, 3, 4] as DialogueSpeaker[]).map((speaker) => (
          <label
            className="flex min-w-0 items-center gap-2 text-xs font-semibold text-tertiary"
            key={speaker}
          >
            <span className="flex shrink-0 items-center gap-1">
              <User className="size-3.5" />
              {speaker}
            </span>
            <input
              aria-label={`Name for speaker ${speaker}`}
              value={attrs.speakerNames[speaker]}
              onChange={(event) => updateAttrs(editor, block, {
                speakerNames: {
                  ...attrs.speakerNames,
                  [speaker]: event.target.value,
                },
              })}
              className="min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            />
          </label>
        ))}
      </div>
      <ContentSectionHeader count={`${attrs.items.length} lines`}>
        Lines
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <ContentCard key={item.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ContentOptionButtonGroup
                ariaLabel={`Speaker for line ${index + 1}`}
                className="mt-0"
                value={String(item.speaker)}
                onChange={(speaker) => updateItem(item.id, {
                  speaker: Number(speaker) as DialogueSpeaker,
                })}
                options={[1, 2, 3, 4].map((speaker) => ({
                  label: (
                    <>
                      <User className="mr-1.5 size-4" />
                      {speaker}
                    </>
                  ),
                  value: String(speaker),
                }))}
              />
              <ContentItemActions
                label={`dialogue line ${index + 1}`}
                canDelete={attrs.items.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
              <textarea
                aria-label={`Dialogue line ${index + 1}`}
                rows={2}
                value={item.text}
                onChange={(event) => updateItem(item.id, { text: event.target.value })}
                placeholder="Enter dialogue text"
                className="col-start-2 w-full resize-y rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setItems([...attrs.items, {
          id: `dialogue-${Date.now()}`,
          speaker: 1,
          text: 'New dialogue line',
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add line
      </button>
    </>
  );
}

function RewriteSentencesEditor({
  attrs,
  block,
  editor,
}: {
  attrs: RewriteSentencesAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: RewriteSentenceItem[]) => updateAttrs(
    editor,
    block,
    { items },
  );
  const updateItem = (
    id: string,
    patch: Partial<RewriteSentenceItem>,
  ) => setItems(attrs.items.map((item) => (
    item.id === id ? { ...item, ...patch } : item
  )));

  return (
    <>
      <ContentSectionHeader className="mt-0">Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.items.length} sentences`}>
        Sentence rows
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <ContentCard key={item.id}>
            <ContentItemGrid>
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-bold tabular-nums text-secondary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <input
                aria-label={`Sentence ${index + 1}`}
                value={item.input}
                onChange={(event) => updateItem(item.id, {
                  input: event.target.value,
                })}
                placeholder="Learner-facing sentence"
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`sentence ${index + 1}`}
                canDelete={attrs.items.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
              <input
                aria-label={`Solution ${index + 1}`}
                value={item.solution}
                onChange={(event) => updateItem(item.id, {
                  solution: event.target.value,
                })}
                placeholder="Correct solution"
                className="col-start-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <input
                aria-label={`Image URL ${index + 1}`}
                value={item.image?.src ?? ''}
                onChange={(event) => updateItem(item.id, {
                  image: event.target.value
                    ? {
                        src: event.target.value,
                        alt: item.image?.alt ?? '',
                      }
                    : undefined,
                })}
                placeholder="Optional image URL"
                className="col-start-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              {item.image && (
                <input
                  aria-label={`Image alternative text ${index + 1}`}
                  value={item.image.alt}
                  onChange={(event) => updateItem(item.id, {
                    image: {
                      ...item.image!,
                      alt: event.target.value,
                    },
                  })}
                  placeholder="Image alternative text"
                  className="col-start-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              )}
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setItems([...attrs.items, {
          id: `rewrite-${Date.now()}`,
          input: `Sentence ${attrs.items.length + 1}`,
          solution: '',
        }])}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <PlusSquare className="size-4" /> Add sentence
      </button>
    </>
  );
}

function SortingCategoriesEditor({
  attrs,
  block,
  editor,
}: {
  attrs: SortingCategoriesAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setCategories = (categories: SortingCategory[]) => {
    const categoryIds = new Set(categories.map(({ id }) => id));
    const fallbackId = categories[0]?.id ?? '';
    updateAttrs(editor, block, {
      categories,
      items: attrs.items.map((item) => ({
        ...item,
        categoryId: categoryIds.has(item.categoryId)
          ? item.categoryId
          : fallbackId,
      })),
    });
  };
  const setItems = (items: SortingCategoryItem[]) => updateAttrs(
    editor,
    block,
    { items },
  );

  return (
    <>
      <ContentSectionHeader className="mt-0">Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Color coding"
          isSelected={attrs.colorCoding}
          onChange={(colorCoding) => updateAttrs(editor, block, { colorCoding })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.categories.length} categories`}>
        Categories
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.categories.map((category, index) => (
          <ContentCard key={category.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <input
                aria-label={`Category ${index + 1}`}
                value={category.title}
                onChange={(event) => setCategories(attrs.categories.map((item) => (
                  item.id === category.id
                    ? { ...item, title: event.target.value }
                    : item
                )))}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`category ${index + 1}`}
                canDelete={attrs.categories.length > 2}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.categories.length - 1}
                onDelete={() => setCategories(attrs.categories.filter(
                  ({ id }) => id !== category.id,
                ))}
                onMoveUp={() => setCategories(moveItem(attrs.categories, index, -1))}
                onMoveDown={() => setCategories(moveItem(attrs.categories, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton
        disabled={attrs.categories.length >= 4}
        onClick={() => setCategories([...attrs.categories, {
          id: `category-${Date.now()}`,
          title: `Category ${String.fromCharCode(65 + attrs.categories.length)}`,
        }])}
      >
        Add category
      </ContentAddButton>
      <ContentSectionHeader count={`${attrs.items.length} items`}>
        Sorting items
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <ContentCard key={item.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <input
                aria-label={`Sorting item ${index + 1}`}
                value={item.text}
                onChange={(event) => setItems(attrs.items.map((current) => (
                  current.id === item.id
                    ? { ...current, text: event.target.value }
                    : current
                )))}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`sorting item ${index + 1}`}
                canDelete={attrs.items.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
              <select
                aria-label={`Category for item ${index + 1}`}
                value={item.categoryId}
                onChange={(event) => setItems(attrs.items.map((current) => (
                  current.id === item.id
                    ? { ...current, categoryId: event.target.value }
                    : current
                )))}
                className="col-start-2 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              >
                {attrs.categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton
        onClick={() => setItems([...attrs.items, {
          id: `sorting-item-${Date.now()}`,
          text: `Item ${attrs.items.length + 1}`,
          categoryId: attrs.categories[0]?.id ?? '',
        }])}
      >
        Add item
      </ContentAddButton>
    </>
  );
}

const WORD_GRID_DIRECTIONS: Array<{
  label: string;
  value: WordGridDirection;
}> = [
  { label: 'Left → right', value: 'leftToRight' },
  { label: 'Right → left', value: 'rightToLeft' },
  { label: 'Top → bottom', value: 'topToBottom' },
  { label: 'Bottom → top', value: 'bottomToTop' },
  { label: '↘ diagonal', value: 'northWestToSouthEast' },
  { label: '↗ diagonal', value: 'southWestToNorthEast' },
  { label: '↙ diagonal', value: 'northEastToSouthWest' },
  { label: '↖ diagonal', value: 'southEastToNorthWest' },
];

function WordGridEditor({
  attrs,
  block,
  editor,
}: {
  attrs: WordGridAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setWords = (words: string[]) => updateAttrs(editor, block, { words });
  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        aria-label="Word grid instruction"
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader
        count={(
          <button
            type="button"
            onClick={() => updateAttrs(editor, block, {
              generation: attrs.generation + 1,
            })}
            className="flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary"
          >
            <RotateCcw className="size-3.5" /> Regenerate grid
          </button>
        )}
      >
        Grid
      </ContentSectionHeader>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-tertiary">
          Columns
          <input
            type="number"
            min={3}
            max={20}
            value={attrs.columns}
            onChange={(event) => updateAttrs(editor, block, {
              columns: Math.min(20, Math.max(3, Number(event.target.value))),
            })}
            className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-xs font-semibold text-tertiary">
          Rows
          <input
            type="number"
            min={3}
            max={20}
            value={attrs.rows}
            onChange={(event) => updateAttrs(editor, block, {
              rows: Math.min(20, Math.max(3, Number(event.target.value))),
            })}
            className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>
      <p className="mt-4 text-xs font-semibold text-tertiary">Cell height</p>
      <ContentOptionButtonGroup
        ariaLabel="Word grid cell height"
        value={String(attrs.rowHeight)}
        onChange={(rowHeight) => updateAttrs(editor, block, {
          rowHeight: Number(rowHeight),
        })}
        options={[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((height) => ({
          label: `${height} ×`,
          value: String(height),
        }))}
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show word list"
          isSelected={attrs.showWordList}
          onChange={(showWordList) => updateAttrs(editor, block, { showWordList })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Word directions</ContentSectionHeader>
      <ContentSwitchGrid>
        {WORD_GRID_DIRECTIONS.map((direction) => (
          <ContentSwitch
            key={direction.value}
            label={direction.label}
            isSelected={attrs.directions[direction.value]}
            onChange={(selected) => {
              const directions = {
                ...attrs.directions,
                [direction.value]: selected,
              };
              if (Object.values(directions).some(Boolean)) {
                updateAttrs(editor, block, { directions });
              }
            }}
          />
        ))}
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.words.length} words`}>
        Words
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.words.map((word, index) => (
          <ContentCard key={`${index}-${word}`}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <input
                aria-label={`Word ${index + 1}`}
                value={word}
                onChange={(event) => setWords(attrs.words.map((current, currentIndex) => (
                  currentIndex === index ? event.target.value : current
                )))}
                className="w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`word ${index + 1}`}
                canDelete={attrs.words.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.words.length - 1}
                onDelete={() => setWords(attrs.words.filter((_, itemIndex) => itemIndex !== index))}
                onMoveUp={() => setWords(moveItem(attrs.words, index, -1))}
                onMoveDown={() => setWords(moveItem(attrs.words, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton onClick={() => setWords([
        ...attrs.words,
        `Word ${attrs.words.length + 1}`,
      ])}>
        Add word
      </ContentAddButton>
    </>
  );
}

function ChooseCorrectWordsEditor({
  attrs,
  block,
  editor,
}: {
  attrs: ChooseCorrectWordsAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: ChooseCorrectWordItem[]) => updateAttrs(
    editor,
    block,
    { items },
  );
  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        aria-label="Choose correct words instruction"
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Protected characters</ContentSectionHeader>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-semibold text-tertiary">
          Keep left
          <input
            type="number"
            min={0}
            max={10}
            value={attrs.keepLeft}
            onChange={(event) => updateAttrs(editor, block, {
              keepLeft: Math.min(10, Math.max(0, Number(event.target.value))),
            })}
            className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
        <label className="text-xs font-semibold text-tertiary">
          Keep right
          <input
            type="number"
            min={0}
            max={10}
            value={attrs.keepRight}
            onChange={(event) => updateAttrs(editor, block, {
              keepRight: Math.min(10, Math.max(0, Number(event.target.value))),
            })}
            className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>
      <ContentSectionHeader count={`${attrs.items.length} words`}>
        Words
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <ContentCard key={item.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <div className="flex min-w-0 items-center gap-2">
                <input
                  aria-label={`Correct word ${index + 1}`}
                  value={item.word}
                  onChange={(event) => setItems(attrs.items.map((current) => (
                    current.id === item.id
                      ? { ...current, word: event.target.value }
                      : current
                  )))}
                  className="min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
                <label className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-tertiary">
                  ×
                  <input
                    aria-label={`Choice count for word ${index + 1}`}
                    type="number"
                    min={2}
                    max={12}
                    value={item.optionCount}
                    onChange={(event) => setItems(attrs.items.map((current) => (
                      current.id === item.id
                        ? {
                            ...current,
                            optionCount: Math.min(
                              12,
                              Math.max(2, Number(event.target.value)),
                            ),
                          }
                        : current
                    )))}
                    className="w-16 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
              </div>
              <ContentItemActions
                label={`word ${index + 1}`}
                canDelete={attrs.items.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton onClick={() => setItems([...attrs.items, {
        id: `correct-word-${Date.now()}`,
        word: `Word ${attrs.items.length + 1}`,
        optionCount: 8,
      }])}>
        Add word
      </ContentAddButton>
      <button
        type="button"
        onClick={() => updateAttrs(editor, block, {
          generation: attrs.generation + 1,
        })}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover"
      >
        <RotateCcw className="size-4" /> Regenerate choices
      </button>
    </>
  );
}

function InlineChoiceEditor({
  attrs,
  block,
  editor,
}: {
  attrs: InlineChoiceAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: InlineChoiceItem[]) => updateAttrs(
    editor,
    block,
    { items },
  );
  const sentenceCount = attrs.items.filter(({ type }) => type === 'sentence').length;

  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Shuffle choices"
          isSelected={attrs.shuffleChoices}
          onChange={(shuffleChoices) => updateAttrs(editor, block, {
            shuffleChoices,
          })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${sentenceCount} sentences`}>
        Sentences
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          item.type === 'divider' ? (
            <ContentCard key={item.id}>
              <ContentItemGrid>
                <span className="w-8 text-center text-sm text-quaternary">—</span>
                <span className="text-sm font-semibold text-tertiary">Divider</span>
                <ContentItemActions
                  label={`divider ${index + 1}`}
                  canDelete
                  canMoveUp={index > 0}
                  canMoveDown={index < attrs.items.length - 1}
                  onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                  onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                  onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
                />
              </ContentItemGrid>
            </ContentCard>
          ) : item.type === 'subtitle' ? (
            <ContentCard key={item.id}>
              <ContentItemGrid>
                <span className="w-8 text-center text-sm font-semibold text-quaternary">
                  T
                </span>
                <InlineFormattedInput
                  ariaLabel={`Subtitle ${index + 1}`}
                  value={item.text}
                  onChange={(text) => setItems(attrs.items.map((current) => (
                    current.id === item.id && current.type === 'subtitle'
                      ? { ...current, text }
                      : current
                  )))}
                  placeholder="Subtitle"
                  className="min-h-9 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                />
                <ContentItemActions
                  label={`subtitle ${index + 1}`}
                  canDelete
                  canMoveUp={index > 0}
                  canMoveDown={index < attrs.items.length - 1}
                  onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                  onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                  onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
                />
              </ContentItemGrid>
            </ContentCard>
          ) : (
            <ContentCard key={item.id}>
              <ContentItemGrid>
                <ContentItemNumber>
                  {String(index + 1).padStart(2, '0')}
                </ContentItemNumber>
                <InlineFormattedInput
                  ariaLabel={`Sentence ${index + 1}`}
                  multiline
                  value={item.text}
                  onChange={(text) => setItems(attrs.items.map((current) => (
                    current.id === item.id && current.type === 'sentence'
                      ? { ...current, text }
                      : current
                  )))}
                  placeholder="{{*correct|choice}} sentence"
                  className="min-h-14 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                />
                <ContentItemActions
                  label={`sentence ${index + 1}`}
                  canDelete={sentenceCount > 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < attrs.items.length - 1}
                  onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                  onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                  onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
                />
              </ContentItemGrid>
            </ContentCard>
          )
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <ContentSecondaryButton
          onClick={() => setItems([...attrs.items, {
            id: `inline-choice-${Date.now()}`,
            type: 'sentence',
            text: '{{*correct|choice}} sentence.',
          }])}
        >
          Add sentence
        </ContentSecondaryButton>
        <ContentSecondaryButton
          onClick={() => setItems([...attrs.items, {
            id: `inline-choice-divider-${Date.now()}`,
            type: 'divider',
          }])}
        >
          Add blank row
        </ContentSecondaryButton>
        <ContentSecondaryButton
          onClick={() => setItems([...attrs.items, {
            id: `inline-choice-subtitle-${Date.now()}`,
            type: 'subtitle',
            text: 'Subtitle',
          }])}
        >
          Add subtitle
        </ContentSecondaryButton>
      </div>
    </>
  );
}

function MiniFormEditor({
  attrs,
  block,
  editor,
}: {
  attrs: MiniFormAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setFields = (fields: MiniFormField[]) => {
    const ids = new Set(fields.map(({ id }) => id));
    updateAttrs(editor, block, {
      fields,
      items: attrs.items.map((item) => ({
        ...item,
        values: Object.fromEntries(fields.map((field) => [
          field.id,
          ids.has(field.id) ? item.values[field.id] ?? '' : '',
        ])),
      })),
    });
  };
  const setItems = (items: MiniFormItem[]) => updateAttrs(editor, block, { items });

  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Form layout</ContentSectionHeader>
      <ContentOptionButtonGroup
        ariaLabel="Form columns"
        value={String(attrs.columns)}
        onChange={(columns) => updateAttrs(editor, block, {
          columns: Number(columns) as MiniFormColumns,
        })}
        options={[1, 2, 3].map((columns) => ({
          label: `${columns} column${columns === 1 ? '' : 's'}`,
          value: String(columns),
        }))}
      />
      <ContentSwitchGrid>
        <ContentSwitch
          label="Fill remaining row"
          isSelected={attrs.fillRemainingRow}
          onChange={(fillRemainingRow) => updateAttrs(editor, block, {
            fillRemainingRow,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.fields.length} fields`}>
        Fields
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.fields.map((field, index) => (
          <ContentCard key={field.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <input
                aria-label={`Field ${index + 1} label`}
                value={field.label}
                onChange={(event) => setFields(attrs.fields.map((current) => (
                  current.id === field.id
                    ? { ...current, label: event.target.value }
                    : current
                )))}
                className="min-w-0 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`field ${index + 1}`}
                canDelete={attrs.fields.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.fields.length - 1}
                onDelete={() => setFields(attrs.fields.filter(({ id }) => id !== field.id))}
                onMoveUp={() => setFields(moveItem(attrs.fields, index, -1))}
                onMoveDown={() => setFields(moveItem(attrs.fields, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton onClick={() => setFields([...attrs.fields, {
        id: `mini-form-field-${Date.now()}`,
        label: `Field ${attrs.fields.length + 1}`,
      }])}>
        Add field
      </ContentAddButton>
      <ContentSectionHeader count={`${attrs.items.length} items`}>
        Prompts and answers
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => (
          <ContentCard key={item.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <textarea
                aria-label={`Prompt ${index + 1}`}
                rows={2}
                value={item.prompt}
                onChange={(event) => setItems(attrs.items.map((current) => (
                  current.id === item.id
                    ? { ...current, prompt: event.target.value }
                    : current
                )))}
                className="min-w-0 resize-y rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`item ${index + 1}`}
                canDelete={attrs.items.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.items.length - 1}
                onDelete={() => setItems(attrs.items.filter(({ id }) => id !== item.id))}
                onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
              />
              <div />
              <div className="grid min-w-0 grid-cols-2 gap-2">
                {attrs.fields.map((field) => (
                  <label className="min-w-0 text-xs font-semibold text-tertiary" key={field.id}>
                    {field.label || 'Field'}
                    <input
                      value={item.values[field.id] ?? ''}
                      onChange={(event) => setItems(attrs.items.map((current) => (
                        current.id === item.id
                          ? {
                              ...current,
                              values: {
                                ...current.values,
                                [field.id]: event.target.value,
                              },
                            }
                          : current
                      )))}
                      className="mt-1 w-full rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm font-normal text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                    />
                  </label>
                ))}
              </div>
              <div />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton onClick={() => {
        const id = `mini-form-item-${Date.now()}`;
        setItems([...attrs.items, {
          id,
          prompt: `Prompt ${attrs.items.length + 1}`,
          values: Object.fromEntries(attrs.fields.map((field) => [field.id, ''])),
        }]);
      }}>
        Add item
      </ContentAddButton>
    </>
  );
}

function LetterNodeEditor({
  attrs,
  block,
  editor,
}: {
  attrs: LetterNodeAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setItems = (items: LetterNodeItem[]) => updateAttrs(
    editor,
    block,
    { items },
  );
  const selectedAlphabet = attrs.alphabetChoice === 'english'
    ? ENGLISH_LETTER_ALPHABET
    : GERMAN_LETTER_ALPHABET;
  const alphabet = new Set(Array.from(selectedAlphabet));

  return (
    <>
      <ContentFieldLabel
        action={(
          <button
            type="button"
            aria-label="Reset instruction"
            title="Reset instruction"
            disabled={attrs.instruction === DEFAULT_LETTER_INSTRUCTION}
            onClick={() => updateAttrs(editor, block, {
              instruction: DEFAULT_LETTER_INSTRUCTION,
            })}
            className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      >
        Instruction
      </ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction || DEFAULT_LETTER_INSTRUCTION}
        placeholder={DEFAULT_LETTER_INSTRUCTION}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Setup</ContentSectionHeader>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
        <label>
          <ContentFieldLabel>Alphabet choice</ContentFieldLabel>
          <select
            value={attrs.alphabetChoice}
            onChange={(event) => updateAttrs(editor, block, {
              alphabetChoice: event.target.value as LetterNodeAttrs['alphabetChoice'],
              alphabet: event.target.value === 'english'
                ? ENGLISH_LETTER_ALPHABET
                : GERMAN_LETTER_ALPHABET,
            })}
            className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          >
            <option value="english">English (26 letters)</option>
            <option value="german">German (29 letters)</option>
          </select>
        </label>
        <label>
          <ContentFieldLabel>Helper letters</ContentFieldLabel>
          <input
            value={attrs.helperLetters}
            onChange={(event) => updateAttrs(editor, block, {
              helperLetters: event.target.value.toLocaleUpperCase('de-CH'),
            })}
            className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm tracking-wide text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
            placeholder="e.g. U"
          />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-quaternary">
        Alphabet order defines each letter&apos;s number.
      </p>

      <ContentSectionHeader>Layout</ContentSectionHeader>
      <div className="mt-3">
        <label className="block max-w-[12rem]">
          <ContentFieldLabel>Key columns</ContentFieldLabel>
          <input
            type="number"
            min={5}
            max={20}
            value={attrs.keyColumns}
            onChange={(event) => updateAttrs(editor, block, {
              keyColumns: Math.min(20, Math.max(5, Number(event.target.value))),
            })}
            className="mt-1.5 h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
          />
        </label>
      </div>
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show alphabet key"
          isSelected={attrs.showKey}
          onChange={(showKey) => updateAttrs(editor, block, { showKey })}
        />
        <ContentSwitch
          label="Show item numbers"
          isSelected={attrs.showItemNumbers}
          onChange={(showItemNumbers) => updateAttrs(editor, block, {
            showItemNumbers,
          })}
        />
        <ContentSwitch
          label="Show first as example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>

      <ContentSectionHeader count={`${attrs.items.length} items`}>
        Items
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.items.map((item, index) => {
          const unknownCharacters = [...new Set(Array.from(
            item.answer.toLocaleUpperCase('de-CH'),
          ).filter((character) => (
            !/\s/.test(character)
            && !alphabet.has(character)
            && !/[-–—'’.,/]/.test(character)
          )))];
          return (
            <ContentCard key={item.id}>
              <ContentItemGrid>
                <ContentItemNumber>
                  {String(index + 1).padStart(2, '0')}
                </ContentItemNumber>
                <input
                  aria-label={`Clue ${index + 1}`}
                  value={item.clue}
                  onChange={(event) => setItems(attrs.items.map((current) => (
                    current.id === item.id
                      ? { ...current, clue: event.target.value }
                      : current
                  )))}
                  className="h-9 min-w-0 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  placeholder="Clue"
                />
                <ContentItemActions
                  label={`item ${index + 1}`}
                  canDelete={attrs.items.length > 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < attrs.items.length - 1}
                  onDelete={() => setItems(
                    attrs.items.filter(({ id }) => id !== item.id),
                  )}
                  onMoveUp={() => setItems(moveItem(attrs.items, index, -1))}
                  onMoveDown={() => setItems(moveItem(attrs.items, index, 1))}
                />
                <span aria-hidden="true" />
                <input
                  aria-label={`Answer ${index + 1}`}
                  value={item.answer}
                  onChange={(event) => setItems(attrs.items.map((current) => (
                    current.id === item.id
                      ? {
                          ...current,
                          answer: event.target.value.toLocaleUpperCase('de-CH'),
                        }
                      : current
                  )))}
                  className="h-9 min-w-0 w-full rounded-md border border-primary bg-primary px-2.5 text-sm tracking-wide text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  placeholder="Answer"
                />
                <span aria-hidden="true" />
              </ContentItemGrid>
              {unknownCharacters.length > 0 && (
                <p className="mt-2 pl-10 text-xs text-warning-primary">
                  Not in alphabet: {unknownCharacters.join(', ')}
                </p>
              )}
            </ContentCard>
          );
        })}
      </div>
      <ContentAddButton
        onClick={() => setItems([
          ...attrs.items,
          {
            id: `letter-item-${Date.now()}`,
            clue: '',
            answer: '',
          },
        ])}
      >
        Add item
      </ContentAddButton>
    </>
  );
}

function CrosswordEditor({
  attrs,
  block,
  editor,
}: {
  attrs: CrosswordAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setEntries = (entries: CrosswordEntry[]) => updateAttrs(
    editor,
    block,
    { entries },
  );
  const layout = generateCrosswordLayout(attrs.entries, attrs.layoutSeed);
  const connectedCount = layout.entries.length - layout.entries.filter(
    (entry) => {
      const crossingCells = layout.entries.filter((other) => (
        other.id !== entry.id
        && Array.from(entry.word).some((_, entryIndex) => {
          const x = entry.x + (entry.direction === 'across' ? entryIndex : 0);
          const y = entry.y + (entry.direction === 'down' ? entryIndex : 0);
          return Array.from(other.word).some((__, otherIndex) => (
            x === other.x + (other.direction === 'across' ? otherIndex : 0)
            && y === other.y + (other.direction === 'down' ? otherIndex : 0)
          ));
        })
      )).length;
      return crossingCells === 0;
    },
  ).length;

  return (
    <>
      <ContentFieldLabel
        action={(
          <button
            type="button"
            aria-label="Reset instruction"
            title="Reset instruction"
            disabled={attrs.instruction === DEFAULT_CROSSWORD_INSTRUCTION}
            onClick={() => updateAttrs(editor, block, {
              instruction: DEFAULT_CROSSWORD_INSTRUCTION,
            })}
            className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      >
        Instruction
      </ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction || DEFAULT_CROSSWORD_INSTRUCTION}
        placeholder={DEFAULT_CROSSWORD_INSTRUCTION}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />

      <ContentSectionHeader>Layout</ContentSectionHeader>
      <ContentOptionButtonGroup
        ariaLabel="Crossword cell size"
        value={String(attrs.cellSize)}
        onChange={(cellSize) => updateAttrs(editor, block, {
          cellSize: Number(cellSize),
        })}
        options={[
          { label: '0.75 ×', value: '24' },
          { label: '1 ×', value: '30' },
          { label: '1.25 ×', value: '36' },
        ]}
      />
      <ContentSecondaryButton
        className="mt-3 w-full"
        icon={<RotateCcw className="size-4" />}
        onClick={() => updateAttrs(editor, block, {
          layoutSeed: attrs.layoutSeed + 1,
        })}
      >
        Regenerate grid
      </ContentSecondaryButton>
      <p className="mt-2 text-xs leading-5 text-quaternary">
        {layout.entries.length} placed · {connectedCount} connected
        {layout.unplaced.length > 0
          ? ` · ${layout.unplaced.length} invalid`
          : ''}
      </p>

      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Show word bank"
          isSelected={attrs.showWordBank}
          onChange={(showWordBank) => updateAttrs(editor, block, {
            showWordBank,
          })}
        />
      </ContentSwitchGrid>

      <ContentSectionHeader count={`${attrs.entries.length} entries`}>
        Answers and clues
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.entries.map((entry, index) => (
          <ContentCard key={entry.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <input
                aria-label={`Crossword answer ${index + 1}`}
                value={entry.answer}
                onChange={(event) => setEntries(attrs.entries.map((current) => (
                  current.id === entry.id
                    ? {
                        ...current,
                        answer: event.target.value.toLocaleUpperCase('de-CH'),
                      }
                    : current
                )))}
                placeholder="Answer"
                className="h-9 min-w-0 w-full rounded-md border border-primary bg-primary px-2.5 text-sm font-semibold tracking-wide text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <ContentItemActions
                label={`crossword entry ${index + 1}`}
                canDelete={attrs.entries.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.entries.length - 1}
                onDelete={() => setEntries(
                  attrs.entries.filter(({ id }) => id !== entry.id),
                )}
                onMoveUp={() => setEntries(moveItem(attrs.entries, index, -1))}
                onMoveDown={() => setEntries(moveItem(attrs.entries, index, 1))}
              />
              <span aria-hidden="true" />
              <input
                aria-label={`Crossword clue ${index + 1}`}
                value={entry.clue}
                onChange={(event) => setEntries(attrs.entries.map((current) => (
                  current.id === entry.id
                    ? { ...current, clue: event.target.value }
                    : current
                )))}
                placeholder="Clue"
                className="h-9 min-w-0 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
              />
              <span aria-hidden="true" />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton
        disabled={attrs.entries.length >= 20}
        onClick={() => setEntries([
          ...attrs.entries,
          {
            id: `crossword-${Date.now()}`,
            answer: '',
            clue: '',
          },
        ])}
      >
        Add entry
      </ContentAddButton>
    </>
  );
}

function LegacyErrorCorrectionEditor({
  attrs,
  block,
  editor,
}: {
  attrs: ErrorCorrectionAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setErrors = (errors: ErrorCorrectionError[]) => updateAttrs(
    editor,
    block,
    { errors },
  );
  const updateError = (
    id: string,
    patch: Partial<ErrorCorrectionError>,
  ) => setErrors(attrs.errors.map((error) => (
    error.id === id ? { ...error, ...patch } : error
  )));

  return (
    <>
      <ContentFieldLabel
        action={(
          <button
            type="button"
            aria-label="Reset instruction"
            title="Reset instruction"
            disabled={attrs.instruction === DEFAULT_ERROR_CORRECTION_INSTRUCTION}
            onClick={() => updateAttrs(editor, block, {
              instruction: DEFAULT_ERROR_CORRECTION_INSTRUCTION,
            })}
            className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      >
        Instruction
      </ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction || DEFAULT_ERROR_CORRECTION_INSTRUCTION}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />

      <ContentSectionHeader>Text</ContentSectionHeader>
      <label>
        <ContentFieldLabel>Text with errors</ContentFieldLabel>
        <textarea
          rows={6}
          value={attrs.incorrectText}
          onChange={(event) => updateAttrs(editor, block, {
            incorrectText: event.target.value,
          })}
          className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm leading-6 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        />
      </label>
      <label className="mt-3 block">
        <ContentFieldLabel>Correct text</ContentFieldLabel>
        <textarea
          rows={6}
          value={attrs.correctText}
          onChange={(event) => updateAttrs(editor, block, {
            correctText: event.target.value,
          })}
          className="mt-1.5 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm leading-6 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
        />
      </label>

      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Mark error positions"
          isSelected={attrs.markErrorPositions}
          onChange={(markErrorPositions) => updateAttrs(editor, block, {
            markErrorPositions,
          })}
        />
      </ContentSwitchGrid>
      <div className="mt-4">
        <ContentFieldLabel>Correction space</ContentFieldLabel>
        <ContentOptionButtonGroup
          ariaLabel="Correction space"
          value={String(attrs.correctionLines)}
          onChange={(correctionLines) => updateAttrs(editor, block, {
            correctionLines: Number(correctionLines),
          })}
          options={[
            { label: 'None', value: '0' },
            { label: '2 lines', value: '2' },
            { label: '4 lines', value: '4' },
            { label: '6 lines', value: '6' },
          ]}
        />
      </div>

      <ContentSectionHeader count={`${attrs.errors.length} errors`}>
        Correction key
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.errors.map((error, index) => (
          <ContentCard key={error.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <div className="grid min-w-0 grid-cols-2 gap-2">
                <input
                  aria-label={`Incorrect text ${index + 1}`}
                  value={error.incorrect}
                  onChange={(event) => updateError(error.id, {
                    incorrect: event.target.value,
                    start: -1,
                    end: -1,
                  })}
                  placeholder="Incorrect"
                  className="h-9 min-w-0 rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
                <input
                  aria-label={`Correction ${index + 1}`}
                  value={error.correct}
                  onChange={(event) => updateError(error.id, {
                    correct: event.target.value,
                  })}
                  placeholder="Correct"
                  className="h-9 min-w-0 rounded-md border border-primary bg-primary px-2.5 text-sm font-semibold text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </div>
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <div className="min-w-0">
                <input
                  aria-label={`Explanation ${index + 1}`}
                  value={error.explanation}
                  onChange={(event) => updateError(error.id, {
                    explanation: event.target.value,
                  })}
                  placeholder="Short explanation"
                  className="h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
                <p className="mt-1 truncate text-xs text-quaternary">
                  {errorTypeById(error.typeId)?.label || 'Custom error'}
                </p>
              </div>
              <span aria-hidden="true" />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton
        onClick={() => setErrors([
          ...attrs.errors,
          {
            id: `error-correction-${Date.now()}`,
            typeId: '',
            incorrect: '',
            correct: '',
            explanation: '',
            start: -1,
            end: -1,
          },
        ])}
      >
        Add correction
      </ContentAddButton>
    </>
  );
}

function ErrorCorrectionEditor({
  attrs,
  block,
  editor,
}: {
  attrs: ErrorCorrectionAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setErrors = (errors: ErrorCorrectionError[]) => updateAttrs(
    editor,
    block,
    { errors },
  );
  const updateError = (
    id: string,
    patch: Partial<ErrorCorrectionError>,
  ) => setErrors(attrs.errors.map((error) => (
    error.id === id ? { ...error, ...patch, start: -1, end: -1 } : error
  )));
  const markup = attrs.markup || createErrorCorrectionMarkup(
    attrs.incorrectText,
    attrs.errors,
  );

  return (
    <>
      <ContentFieldLabel
        action={(
          <button
            type="button"
            aria-label="Reset instruction"
            title="Reset instruction"
            disabled={attrs.instruction === DEFAULT_ERROR_CORRECTION_INSTRUCTION}
            onClick={() => updateAttrs(editor, block, {
              instruction: DEFAULT_ERROR_CORRECTION_INSTRUCTION,
            })}
            className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
          >
            <RotateCcw className="size-4" />
          </button>
        )}
      >
        Instruction
      </ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction || DEFAULT_ERROR_CORRECTION_INSTRUCTION}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />

      <ContentSectionHeader>Annotated text</ContentSectionHeader>
      <ContentFieldLabel>Error text and corrections</ContentFieldLabel>
      <textarea
        rows={9}
        value={markup}
        onChange={(event) => {
          const nextMarkup = event.target.value;
          const parsed = parseErrorCorrectionMarkup(nextMarkup, attrs.errors);
          updateAttrs(editor, block, {
            markup: nextMarkup,
            incorrectText: parsed.incorrectText,
            correctText: parsed.correctText,
            errors: parsed.errors,
          });
        }}
        className="mt-2 w-full resize-y rounded-md border border-primary bg-primary px-3 py-2 text-sm leading-6 text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <p className="mt-2 text-xs leading-5 text-quaternary">
        Use <strong>{'{{error:correct text}}incorrect text{{/error}}'}</strong>.
        Multi-word corrections and line breaks are supported; nested error
        markers are not.
      </p>

      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Mark error positions"
          isSelected={attrs.markErrorPositions}
          onChange={(markErrorPositions) => updateAttrs(editor, block, {
            markErrorPositions,
          })}
        />
      </ContentSwitchGrid>
      <div className="mt-4 max-w-xs">
        <ContentFieldLabel>Correction space</ContentFieldLabel>
        <ContentOptionButtonGroup
          ariaLabel="Correction lines"
          value={String(attrs.correctionLines)}
          onChange={(correctionLines) => updateAttrs(editor, block, {
            correctionLines: Number(correctionLines),
          })}
          options={[
            { label: 'None', value: '0' },
            { label: '2 lines', value: '2' },
            { label: '4 lines', value: '4' },
            { label: '6 lines', value: '6' },
          ]}
        />
      </div>

      <ContentSectionHeader count={`${attrs.errors.length} errors`}>
        Correction key
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.errors.map((error, index) => (
          <ContentCard key={error.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                <span className="truncate text-sm text-secondary">
                  {error.incorrect}
                </span>
                <span className="text-xs text-quaternary">→</span>
                <strong className="truncate text-sm text-secondary">
                  {error.correct}
                </strong>
              </div>
              <ContentItemActions
                label={`error ${index + 1}`}
                canDelete={attrs.errors.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.errors.length - 1}
                onDelete={() => setErrors(
                  attrs.errors.filter(({ id }) => id !== error.id),
                )}
                onMoveUp={() => setErrors(moveItem(attrs.errors, index, -1))}
                onMoveDown={() => setErrors(moveItem(attrs.errors, index, 1))}
              />
              <span aria-hidden="true" />
              <div className="min-w-0">
                <p className="mb-1 text-[11px] font-semibold text-quaternary">
                  {errorTypeById(error.typeId)?.label || 'Custom error'}
                </p>
                <input
                  aria-label={`Explanation ${index + 1}`}
                  value={error.explanation}
                  onChange={(event) => updateError(error.id, {
                    explanation: event.target.value,
                  })}
                  placeholder="Short explanation"
                  className="h-9 w-full rounded-md border border-primary bg-primary px-2.5 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                />
              </div>
              <span aria-hidden="true" />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
    </>
  );
}

function WorksheetTableEditor({
  attrs,
  block,
  editor,
}: {
  attrs: WorksheetTableAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setColumns = (columns: WorksheetTableColumn[]) => {
    updateAttrs(editor, block, {
      columns,
      rows: attrs.rows.map((row) => ({
        ...row,
        cells: Object.fromEntries(columns.map((column) => [
          column.id,
          row.cells[column.id] ?? '',
        ])),
      })),
    });
  };
  const setRows = (rows: WorksheetTableRow[]) => updateAttrs(
    editor,
    block,
    { rows },
  );
  const hasExplicitHeaderRows = attrs.rows.some((row) => row.isHeader);

  useEffect(() => {
    if (!attrs.showHeader) return;
    if (hasExplicitHeaderRows) {
      updateAttrs(editor, block, { showHeader: false });
      return;
    }
    updateAttrs(editor, block, {
      showHeader: false,
      rows: [
        {
          id: `table-row-header-${Date.now()}`,
          isHeader: true,
          cells: Object.fromEntries(attrs.columns.map((column, index) => [
            column.id,
            column.label || `Column ${index + 1}`,
          ])),
        },
        ...attrs.rows.map((row) => ({ ...row, isHeader: false })),
      ],
    });
  }, [
    attrs.columns,
    attrs.rows,
    attrs.showHeader,
    block,
    editor,
    hasExplicitHeaderRows,
  ]);

  return (
    <>
      <ContentFieldLabel>Instruction</ContentFieldLabel>
      <textarea
        rows={1}
        value={attrs.instruction}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Default blank width</ContentSectionHeader>
      <ContentOptionButtonGroup
        ariaLabel="Default blank width"
        value={String(attrs.blankWidthFactor)}
        onChange={(blankWidthFactor) => updateAttrs(editor, block, {
          blankWidthFactor: Number(blankWidthFactor),
        })}
        options={[1, 2, 3, 4, 5].map((width) => ({
          label: `${width} ×`,
          value: String(width),
        }))}
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <ContentSwitchGrid>
        <ContentSwitch
          label="Hide blank numbers"
          isSelected={attrs.hideBlankNumbers}
          onChange={(hideBlankNumbers) => updateAttrs(editor, block, {
            hideBlankNumbers,
          })}
        />
        <ContentSwitch
          label="Show example"
          isSelected={attrs.showFirstAsExample}
          onChange={(showFirstAsExample) => updateAttrs(editor, block, {
            showFirstAsExample,
          })}
        />
      </ContentSwitchGrid>
      <ContentSectionHeader count={`${attrs.columns.length} columns`}>
        Column layout
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.columns.map((column, index) => (
          <ContentCard key={column.id}>
            <ContentItemGrid>
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              <div className="flex min-w-0 items-center gap-3">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-secondary">
                  <span>Grid Span</span>
                  <input
                    aria-label={`Grid span of column ${index + 1}`}
                    type="number"
                    min={1}
                    max={12}
                    value={column.span}
                    onChange={(event) => setColumns(attrs.columns.map((current) => (
                      current.id === column.id
                        ? {
                            ...current,
                            span: Math.min(12, Math.max(1, Number(event.target.value))),
                          }
                        : current
                    )))}
                    className="h-9 min-w-0 w-16 rounded-md border border-primary bg-primary px-2.5 text-sm font-normal tabular-nums text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </label>
                <div
                  aria-label={`Alignment of column ${index + 1}`}
                  className="flex items-center gap-1"
                  role="group"
                >
                  {([
                    ['left', TextAlignStart],
                    ['center', TextAlignCenter],
                    ['right', TextAlignEnd],
                  ] as const).map(([alignment, Icon]) => (
                    <button
                      type="button"
                      aria-label={`${alignment} align column ${index + 1}`}
                      aria-pressed={column.align === alignment}
                      key={alignment}
                      onClick={() => setColumns(attrs.columns.map((current) => (
                        current.id === column.id
                          ? { ...current, align: alignment }
                          : current
                      )))}
                      className={`flex size-9 items-center justify-center rounded-md border text-secondary transition ${
                        column.align === alignment
                          ? 'border-primary bg-active ring-1 ring-inset ring-primary'
                          : 'border-primary bg-primary hover:bg-primary_hover'
                      }`}
                    >
                      <Icon className="size-4" />
                    </button>
                  ))}
                </div>
              </div>
              <ContentItemActions
                label={`column ${index + 1}`}
                canDelete={attrs.columns.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.columns.length - 1}
                onDelete={() => setColumns(attrs.columns.filter(({ id }) => id !== column.id))}
                onMoveUp={() => setColumns(moveItem(attrs.columns, index, -1))}
                onMoveDown={() => setColumns(moveItem(attrs.columns, index, 1))}
              />
            </ContentItemGrid>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton
        disabled={attrs.columns.length >= 6}
        onClick={() => setColumns([...attrs.columns, {
          id: `table-column-${Date.now()}`,
          label: `Column ${attrs.columns.length + 1}`,
          span: 3,
          align: 'left',
        }])}
      >
        Add column
      </ContentAddButton>
      <ContentSectionHeader count={`${attrs.rows.length} rows`}>
        Rows
      </ContentSectionHeader>
      <div className="mt-3 space-y-2">
        {attrs.rows.map((row, index) => (
          <ContentCard key={row.id}>
            <div className="flex items-center justify-between gap-3">
              <ContentItemNumber>
                {String(index + 1).padStart(2, '0')}
              </ContentItemNumber>
              {attrs.columns[0] && (
                <InlineFormattedInput
                  ariaLabel={`Row ${index + 1}, ${attrs.columns[0].label}`}
                  value={row.cells[attrs.columns[0].id] ?? ''}
                  onChange={(value) => setRows(attrs.rows.map((current) => (
                    current.id === row.id
                      ? {
                          ...current,
                          cells: {
                            ...current.cells,
                            [attrs.columns[0].id]: value,
                          },
                        }
                      : current
                  )))}
                  placeholder={attrs.columns[0].label || 'Cell'}
                  className="min-h-9 min-w-0 flex-1 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                />
              )}
              <ContentItemActions
                label={`row ${index + 1}`}
                canDelete={attrs.rows.length > 1}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.rows.length - 1}
                onDelete={() => setRows(attrs.rows.filter(({ id }) => id !== row.id))}
                onMoveUp={() => setRows(moveItem(attrs.rows, index, -1))}
                onMoveDown={() => setRows(moveItem(attrs.rows, index, 1))}
              />
            </div>
            <div className="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-3">
              <span aria-hidden="true" className="invisible">
                <ContentItemNumber>00</ContentItemNumber>
              </span>
              <div className="grid min-w-0 gap-2">
                {attrs.columns.slice(1).map((column) => (
                  <InlineFormattedInput
                    ariaLabel={`Row ${index + 1}, ${column.label}`}
                    key={column.id}
                    value={row.cells[column.id] ?? ''}
                    onChange={(value) => setRows(attrs.rows.map((current) => (
                      current.id === row.id
                        ? {
                            ...current,
                            cells: { ...current.cells, [column.id]: value },
                          }
                        : current
                    )))}
                    placeholder={column.label || 'Cell'}
                    className="min-h-9 rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                ))}
              </div>
              <ContentSwitch
                label="Header"
                labelClassName="text-xs"
                isSelected={row.isHeader}
                onChange={(isHeader) => setRows(attrs.rows.map((current) => (
                  current.id === row.id ? { ...current, isHeader } : current
                )))}
              />
            </div>
          </ContentCard>
        ))}
      </div>
      <ContentAddButton onClick={() => setRows([...attrs.rows, {
        id: `table-row-${Date.now()}`,
        isHeader: false,
        cells: Object.fromEntries(attrs.columns.map((column) => [column.id, ''])),
      }])}>
        Add row
      </ContentAddButton>
    </>
  );
}

function MatchingEditor({
  attrs,
  block,
  editor,
}: {
  attrs: MatchingPairsAttrs;
  block: ContentEditorBlock;
  editor: Editor;
}) {
  const setPairs = (pairs: MatchingPair[]) => {
    const ids = new Set(pairs.map(({ id }) => id));
    updateAttrs(editor, block, {
      pairs,
      rightOrder: [
        ...attrs.rightOrder.filter((id) => ids.has(id)),
        ...pairs.map(({ id }) => id).filter((id) => !attrs.rightOrder.includes(id)),
      ],
    });
  };
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <label className="block text-sm font-semibold text-secondary">
          Instruction
        </label>
        <button
          type="button"
          aria-label="Reset instruction"
          title="Reset instruction"
          disabled={attrs.instruction === DEFAULT_MATCHING_INSTRUCTION}
          onClick={() => updateAttrs(editor, block, {
            instruction: DEFAULT_MATCHING_INSTRUCTION,
          })}
          className="flex size-7 items-center justify-center rounded-md text-secondary transition hover:bg-primary_hover hover:text-primary disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>
      <textarea
        rows={1}
        value={attrs.instruction || DEFAULT_MATCHING_INSTRUCTION}
        placeholder={DEFAULT_MATCHING_INSTRUCTION}
        onChange={(event) => updateAttrs(editor, block, {
          instruction: event.target.value,
        })}
        className="mt-2 w-full resize-none rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none focus:border-brand focus:ring-2 focus:ring-brand"
      />

      <label className="mt-6 block text-sm font-semibold text-secondary">Question</label>
      <InlineFormattedInput
        ariaLabel="Matching-pairs question"
        multiline
        value={attrs.question}
        onChange={(question) => updateAttrs(editor, block, { question })}
        placeholder="Optional prompt"
        className="mt-2 min-h-16 whitespace-pre-wrap rounded-md border border-primary bg-primary px-3 py-2 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
      />
      <ContentSectionHeader>Learner support</ContentSectionHeader>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3">
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Show word bank"
            size="md"
            isSelected={attrs.showWordBank}
            onChange={(showWordBank) => updateAttrs(editor, block, {
              showWordBank,
            })}
          />
          <span>Show word bank</span>
        </div>
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Shuffle word bank"
            size="md"
            isDisabled={!attrs.showWordBank}
            isSelected={attrs.shuffleWordBank}
            onChange={(shuffleWordBank) => updateAttrs(editor, block, {
              shuffleWordBank,
            })}
          />
          <span>Shuffle word bank</span>
        </div>
        <div className="flex items-center gap-2 text-left text-sm font-semibold text-secondary">
          <Toggle
            aria-label="Show example"
            size="md"
            isSelected={attrs.showFirstAsExample}
            onChange={(showFirstAsExample) => updateAttrs(editor, block, {
              showFirstAsExample,
            })}
          />
          <span>Show example</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm font-semibold text-secondary">Correct pairs</p>
        <span className="text-xs text-quaternary">{attrs.pairs.length} pairs</span>
      </div>
      <div className="mt-3 space-y-2">
        {attrs.pairs.map((pair, index) => (
          <div className="rounded-lg border border-secondary bg-secondary p-2.5" key={pair.id}>
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary px-2 py-1 text-[10px] font-semibold tabular-nums text-quaternary">
                {String(index + 1).padStart(2, '0')}
              </span>
              <ItemActions
                label={`pair ${index + 1}`}
                canDelete={attrs.pairs.length > 2}
                canMoveUp={index > 0}
                canMoveDown={index < attrs.pairs.length - 1}
                onDelete={() => setPairs(attrs.pairs.filter(({ id }) => id !== pair.id))}
                onMoveUp={() => setPairs(moveItem(attrs.pairs, index, -1))}
                onMoveDown={() => setPairs(moveItem(attrs.pairs, index, 1))}
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(['left', 'right'] as const).map((side) => (
                <div key={side}>
                  <InlineFormattedInput
                    ariaLabel={`Pair ${index + 1} ${side}`}
                    multiline
                    value={pair[side]}
                    onChange={(value) => setPairs(attrs.pairs.map((current) => current.id === pair.id ? { ...current, [side]: value } : current))}
                    placeholder={side === 'left' ? 'Item' : 'Match'}
                    className="min-h-14 whitespace-pre-wrap rounded-md border border-primary bg-primary px-2.5 py-1.5 text-sm text-secondary outline-none empty:before:text-placeholder empty:before:content-[attr(data-placeholder)] focus:border-brand focus:ring-2 focus:ring-brand"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setPairs([...attrs.pairs, {
        id: `pair-${Date.now()}`,
        left: `Item ${attrs.pairs.length + 1}`,
        right: `Match ${attrs.pairs.length + 1}`,
      }])} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-3 py-2 text-sm font-semibold text-secondary hover:bg-primary_hover">
        <PlusSquare className="size-4" /> Add pair
      </button>
    </>
  );
}

export function BlockContentEditorModal({
  block,
  editor,
  onClose,
}: {
  block: ContentEditorBlock | null;
  editor: Editor;
  onClose: () => void;
}) {
  const attrs = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) => {
      if (!block) return null;
      const node = currentEditor.state.doc.nodeAt(block.pos);
      return node?.type.name === block.type
        ? node.attrs as Record<string, unknown>
        : null;
    },
  });

  useEffect(() => {
    if (!block) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [block, onClose]);

  if (!block || !attrs || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-[2px]" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div role="dialog" aria-modal="true" aria-label={TITLES[block.type]} className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-secondary bg-primary shadow-2xl">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-secondary px-6">
          <div>
            <h2 className="text-base font-semibold text-primary">{TITLES[block.type]}</h2>
          </div>
          <button type="button" aria-label="Close content editor" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-quaternary hover:bg-primary_hover hover:text-secondary">
            <XClose className="size-5" />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(22rem,0.85fr)_minmax(30rem,1.15fr)] overflow-hidden">
          <div className="overflow-y-auto border-r border-secondary p-6">
            {block.type in DEFAULT_BLOCK_INSTRUCTIONS && (
              <InstructionOverrideEditor
                attrs={attrs}
                block={block as ContentEditorBlock & {
                  type: InstructionOverrideBlock;
                }}
                editor={editor}
              />
            )}
            {block.type === 'mcq' && <MCQEditor attrs={attrs as unknown as MCQAttrs} block={block} editor={editor} />}
            {block.type === 'ordering' && <OrderingEditor attrs={attrs as unknown as OrderingAttrs} block={block} editor={editor} />}
            {block.type === 'matchingPairs' && <MatchingEditor attrs={attrs as unknown as MatchingPairsAttrs} block={block} editor={editor} />}
            {block.type === 'mcm' && <MCMEditor attrs={attrs as unknown as MCMAttrs} block={block} editor={editor} />}
            {block.type === 'mch' && <MCHEditor attrs={attrs as unknown as MCHAttrs} block={block} editor={editor} />}
            {block.type === 'trueFalse' && <TrueFalseEditor attrs={attrs as unknown as TrueFalseAttrs} block={block} editor={editor} />}
            {block.type === 'fillInTheBlank' && <FillInTheBlankEditor attrs={attrs as unknown as FillInTheBlankAttrs} block={block} editor={editor} />}
            {block.type === 'glossaryTerms' && <GlossaryTermsEditor attrs={attrs as unknown as GlossaryTermsAttrs} block={block} editor={editor} />}
            {block.type === 'frayerModel' && <FrayerModelEditor attrs={attrs as unknown as FrayerModelAttrs} block={block} editor={editor} />}
            {block.type === 'learningObjective' && <LearningObjectiveEditor attrs={attrs as unknown as LearningObjectiveAttrs} block={block} editor={editor} />}
            {block.type === 'dialogue' && <DialogueEditor attrs={attrs as unknown as DialogueAttrs} block={block} editor={editor} />}
            {block.type === 'rewriteSentences' && <RewriteSentencesEditor attrs={attrs as unknown as RewriteSentencesAttrs} block={block} editor={editor} />}
            {block.type === 'sortingCategories' && <SortingCategoriesEditor attrs={attrs as unknown as SortingCategoriesAttrs} block={block} editor={editor} />}
            {block.type === 'wordGrid' && <WordGridEditor attrs={attrs as unknown as WordGridAttrs} block={block} editor={editor} />}
            {block.type === 'chooseCorrectWords' && <ChooseCorrectWordsEditor attrs={attrs as unknown as ChooseCorrectWordsAttrs} block={block} editor={editor} />}
            {block.type === 'inlineChoice' && <InlineChoiceEditor attrs={attrs as unknown as InlineChoiceAttrs} block={block} editor={editor} />}
            {block.type === 'miniForm' && <MiniFormEditor attrs={attrs as unknown as MiniFormAttrs} block={block} editor={editor} />}
            {block.type === 'worksheetTable' && <WorksheetTableEditor attrs={attrs as unknown as WorksheetTableAttrs} block={block} editor={editor} />}
            {block.type === 'richText' && <RichTextEditor attrs={attrs as unknown as RichTextAttrs} block={block} editor={editor} />}
            {block.type === 'instructionBlock' && <StandaloneInstructionEditor attrs={attrs as unknown as InstructionBlockAttrs} block={block} editor={editor} />}
            {block.type === 'letterNode' && <LetterNodeEditor attrs={attrs as unknown as LetterNodeAttrs} block={block} editor={editor} />}
            {block.type === 'crossword' && <CrosswordEditor attrs={attrs as unknown as CrosswordAttrs} block={block} editor={editor} />}
            {block.type === 'errorCorrection' && <ErrorCorrectionEditor attrs={attrs as unknown as ErrorCorrectionAttrs} block={block} editor={editor} />}
          </div>
          <div className="overflow-y-auto bg-primary p-6">
            <Preview attrs={attrs} block={block} editor={editor} />
          </div>
        </div>
        <footer className="flex h-16 shrink-0 items-center justify-end border-t border-secondary px-6">
          <button type="button" onClick={onClose} className="rounded-lg bg-brand-solid px-4 py-2 text-sm font-semibold text-white hover:bg-brand-solid_hover">
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
