"use client";

import { useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { DEFAULT_BLOCK_INSTRUCTIONS } from '@/components/editor/custom-blocks/instructions';
import { useRoughSolutionXs } from '@/components/editor/custom-blocks/use-rough-solution-xs';

export type KinshipAnswerMode = 'mcq' | 'open' | 'trueFalse';

export type KinshipOption = {
  id: string;
  text: string;
};

export type KinshipRiddle = {
  id: string;
  prompt: string;
  answerMode: KinshipAnswerMode;
  answer: string;
  options: KinshipOption[];
  trueFalseValue: boolean;
};

export type FamilyKinshipAttrs = {
  riddles: KinshipRiddle[];
  showFirstAsExample: boolean;
};

export const DEFAULT_KINSHIP_RIDDLES: KinshipRiddle[] = [
  {
    id: 'kinship-1',
    prompt: 'Der Bruder meines Vaters ist …',
    answerMode: 'mcq',
    answer: 'mein Onkel',
    options: [
      { id: 'kinship-1-a', text: 'mein Onkel' },
      { id: 'kinship-1-b', text: 'mein Cousin' },
      { id: 'kinship-1-c', text: 'mein Grossvater' },
    ],
    trueFalseValue: true,
  },
  {
    id: 'kinship-2',
    prompt: 'Die Mutter meiner Mutter ist …',
    answerMode: 'open',
    answer: 'meine Grossmutter',
    options: [],
    trueFalseValue: true,
  },
  {
    id: 'kinship-3',
    prompt: 'Der Sohn meiner Tante ist mein Cousin.',
    answerMode: 'trueFalse',
    answer: '',
    options: [],
    trueFalseValue: true,
  },
];

function defaultRiddles() {
  return DEFAULT_KINSHIP_RIDDLES.map((riddle) => ({
    ...riddle,
    options: riddle.options.map((option) => ({ ...option })),
  }));
}

function normalizeRiddle(value: unknown, index: number): KinshipRiddle {
  const riddle = value && typeof value === 'object'
    ? value as Partial<KinshipRiddle>
    : {};
  const answerMode = riddle.answerMode === 'open'
    || riddle.answerMode === 'trueFalse'
    ? riddle.answerMode
    : 'mcq';
  const options = Array.isArray(riddle.options)
    ? riddle.options.map((option, optionIndex) => ({
        id: typeof option?.id === 'string'
          ? option.id
          : `kinship-${index + 1}-option-${optionIndex + 1}`,
        text: typeof option?.text === 'string' ? option.text : '',
      }))
    : [];

  return {
    id: typeof riddle.id === 'string' ? riddle.id : `kinship-${index + 1}`,
    prompt: typeof riddle.prompt === 'string' ? riddle.prompt : '',
    answerMode,
    answer: typeof riddle.answer === 'string' ? riddle.answer : '',
    options,
    trueFalseValue: riddle.trueFalseValue !== false,
  };
}

function parseRiddles(value: string | null): KinshipRiddle[] {
  if (!value) return defaultRiddles();
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    return Array.isArray(parsed)
      ? parsed.map(normalizeRiddle)
      : defaultRiddles();
  } catch {
    return defaultRiddles();
  }
}

function FamilyKinshipNodeView({ node, selected }: NodeViewProps) {
  const { riddles, showFirstAsExample } = node.attrs as FamilyKinshipAttrs;
  const layoutRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRoughSolutionXs(layoutRef);

  return (
    <CustomBlockRoot selected={selected} className="family-kinship-node">
      <div className="custom-block__matrix-layout" ref={layoutRef}>
        <svg
          aria-hidden="true"
          className="custom-block__rough-solution-overlay"
          preserveAspectRatio="none"
          ref={solutionsRef}
        />
        <BlockInstruction>
          {node.attrs.instruction || DEFAULT_BLOCK_INSTRUCTIONS.familyKinship}
        </BlockInstruction>
        <div className="family-kinship-node__riddles">
          {riddles.map((riddle, index) => {
            const example = showFirstAsExample && index === 0;
            return (
              <section className="family-kinship-node__riddle" key={riddle.id}>
                <span className="custom-block__row-index family-kinship-node__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="family-kinship-node__content">
                  <p className="family-kinship-node__prompt">
                    {riddle.prompt || `Verwandtschaftsrätsel ${index + 1}`}
                  </p>
                  {riddle.answerMode === 'mcq' && (
                    <div className="family-kinship-node__choices">
                      {riddle.options.map((option) => (
                        <span className="family-kinship-node__choice" key={option.id}>
                          <BlockChoiceIndicator
                            checked={false}
                            example={example}
                            solutionKey={option.text.trim() === riddle.answer.trim()
                              ? `${riddle.id}:${option.id}`
                              : undefined}
                          />
                          <span>{option.text}</span>
                        </span>
                      ))}
                    </div>
                  )}
                  {riddle.answerMode === 'open' && (
                    <span
                      className="family-kinship-node__answer-line"
                      data-example={example ? 'true' : undefined}
                    >
                      <span className="family-kinship-node__open-solution">
                        {riddle.answer}
                      </span>
                    </span>
                  )}
                  {riddle.answerMode === 'trueFalse' && (
                    <div className="family-kinship-node__choices family-kinship-node__choices--boolean">
                      {[
                        { label: 'Richtig', value: true },
                        { label: 'Falsch', value: false },
                      ].map((option) => (
                        <span className="family-kinship-node__choice" key={option.label}>
                          <BlockChoiceIndicator
                            checked={false}
                            example={example}
                            solutionKey={option.value === riddle.trueFalseValue
                              ? `${riddle.id}:${option.label}`
                              : undefined}
                          />
                          <span>{option.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    familyKinship: {
      insertFamilyKinship: (attrs?: Partial<FamilyKinshipAttrs>) => ReturnType;
    };
  }
}

export const FamilyKinship = Node.create({
  name: 'familyKinship',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      riddles: {
        default: DEFAULT_KINSHIP_RIDDLES,
        parseHTML: (element) => parseRiddles(
          element.getAttribute('data-family-kinship-riddles'),
        ),
        renderHTML: (attributes) => ({
          'data-family-kinship-riddles': encodeURIComponent(
            JSON.stringify(attributes.riddles),
          ),
        }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-family-kinship-show-first-example') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-family-kinship-show-first-example': String(
            attributes.showFirstAsExample,
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="family-kinship"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'family-kinship' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FamilyKinshipNodeView);
  },

  addCommands() {
    return {
      insertFamilyKinship:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              riddles: attrs.riddles ?? defaultRiddles(),
              showFirstAsExample: attrs.showFirstAsExample ?? false,
            },
          }),
    };
  },
});
