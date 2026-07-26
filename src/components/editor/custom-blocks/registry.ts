import type { ComponentType } from 'react';
import type { Editor } from '@tiptap/core';
import {
  CheckSquare,
  LayoutGrid01,
  Rows01,
  SwitchHorizontal01,
  Toggle01Left,
  TypeSquare,
  Heading01,
  MessageChatSquare,
  Edit05,
  File02,
} from '@untitledui/icons';

export type CustomBlockDefinition = {
  type: string;
  label: string;
  description: string;
  category: string;
  keywords: string[];
  Icon: ComponentType<{ className?: string }>;
  insert: (editor: Editor) => boolean;
};

export const CUSTOM_BLOCK_REGISTRY: CustomBlockDefinition[] = [
  {
    type: 'pageBreak',
    label: 'Page break',
    description: 'Continue the following content on a new page.',
    category: 'Layout',
    keywords: ['page', 'break', 'new page', 'layout', 'print'],
    Icon: File02,
    insert: (editor) => editor.chain().focus().insertPageBreak().run(),
  },
  {
    type: 'customHeading',
    label: 'Heading',
    description: 'A branded heading with optional document numbering.',
    category: 'Content',
    keywords: ['heading', 'title', 'section', 'h1', 'h2', 'numbered'],
    Icon: Heading01,
    insert: (editor) => editor.chain().focus().insertCustomHeading().run(),
  },
  {
    type: 'mcq',
    label: 'Multiple-choice question',
    description: 'A question with individually editable answer options.',
    category: 'Assessment',
    keywords: ['mcq', 'question', 'quiz', 'answers', 'single', 'multiple'],
    Icon: CheckSquare,
    insert: (editor) => editor.chain().focus().insertMCQ().run(),
  },
  {
    type: 'mcm',
    label: 'Multiple-choice matrix',
    description: 'Rows with independently configurable answer options.',
    category: 'Assessment',
    keywords: ['mcm', 'matrix', 'rows', 'individual options'],
    Icon: LayoutGrid01,
    insert: (editor) => editor.chain().focus().insertMCM().run(),
  },
  {
    type: 'mch',
    label: 'Header matrix',
    description: 'Rows that share up to four answer options in a header.',
    category: 'Assessment',
    keywords: ['mch', 'matrix', 'header', 'shared options', 'scale'],
    Icon: Rows01,
    insert: (editor) => editor.chain().focus().insertMCH().run(),
  },
  {
    type: 'matchingPairs',
    label: 'Matching pairs',
    description: 'Two independent lists whose items are matched as pairs.',
    category: 'Assessment',
    keywords: ['matching', 'pairs', 'connect', 'left', 'right', 'assignment'],
    Icon: SwitchHorizontal01,
    insert: (editor) => editor.chain().focus().insertMatchingPairs().run(),
  },
  {
    type: 'trueFalse',
    label: 'True or false',
    description: 'Statements evaluated against two editable answer labels.',
    category: 'Assessment',
    keywords: ['true', 'false', 'boolean', 'statements', 'yes', 'no'],
    Icon: Toggle01Left,
    insert: (editor) => editor.chain().focus().insertTrueFalse().run(),
  },
  {
    type: 'fillInTheBlank',
    label: 'Fill in the blank',
    description: 'Text containing one or more answer placeholders.',
    category: 'Assessment',
    keywords: ['fill', 'blank', 'cloze', 'text', 'word', 'gap'],
    Icon: TypeSquare,
    insert: (editor) => editor.chain().focus().insertFillInTheBlank().run(),
  },
  {
    type: 'glossaryTerms',
    label: 'Glossary terms',
    description: 'Terms with a definition and an example.',
    category: 'Content',
    keywords: ['glossary', 'terms', 'definition', 'example', 'vocabulary'],
    Icon: Rows01,
    insert: (editor) => editor.chain().focus().insertGlossaryTerms().run(),
  },
  {
    type: 'dialogue',
    label: 'Dialogue',
    description: 'Speaker-based dialogue rows with optional answer blanks.',
    category: 'Assessment',
    keywords: ['dialogue', 'conversation', 'speaker', 'chat', 'blank', 'original'],
    Icon: MessageChatSquare,
    insert: (editor) => editor.chain().focus().insertDialogue().run(),
  },
  {
    type: 'rewriteSentences',
    label: 'Rewrite Sentences',
    description: 'Incorrect sentences with space to write corrected versions.',
    category: 'Assessment',
    keywords: ['rewrite', 'sentence', 'correct', 'writing', 'solution'],
    Icon: Edit05,
    insert: (editor) => editor.chain().focus().insertRewriteSentences().run(),
  },
  {
    type: 'sortingCategories',
    label: 'Sorting Categories',
    description: 'Sort word-bank items into up to four categories.',
    category: 'Assessment',
    keywords: ['sorting', 'categories', 'classify', 'word bank', 'groups'],
    Icon: LayoutGrid01,
    insert: (editor) => editor.chain().focus().insertSortingCategories().run(),
  },
];
