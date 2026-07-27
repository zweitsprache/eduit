"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';

export type SuccessCriterion = {
  id: string;
  text: string;
};

export type LearningObjectiveAttrs = {
  title: string;
  curriculumCode: string;
  objective: string;
  successCriteria: SuccessCriterion[];
};

export const DEFAULT_SUCCESS_CRITERIA: SuccessCriterion[] = [
  { id: 'criterion-1', text: 'I can explain the key idea in my own words.' },
  { id: 'criterion-2', text: 'I can apply the idea to an example.' },
];

function defaultSuccessCriteria() {
  return DEFAULT_SUCCESS_CRITERIA.map((criterion) => ({ ...criterion }));
}

function parseSuccessCriteria(value: string | null): SuccessCriterion[] {
  if (!value) return defaultSuccessCriteria();

  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) return defaultSuccessCriteria();
    const criteria = parsed.flatMap((item, index): SuccessCriterion[] => (
      typeof item?.text === 'string'
        ? [{
            id: typeof item.id === 'string'
              ? item.id
              : `criterion-${index + 1}`,
            text: item.text,
          }]
        : []
    ));
    return criteria.length ? criteria : defaultSuccessCriteria();
  } catch {
    return defaultSuccessCriteria();
  }
}

function LearningObjectiveNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as LearningObjectiveAttrs;

  return (
    <CustomBlockRoot
      selected={selected}
      className="learning-objective-node"
    >
      <div className="learning-objective-node__header">
        <strong className="learning-objective-node__title">
          {attrs.title || 'Learning objective'}
        </strong>
        {attrs.curriculumCode.trim() && (
          <span className="learning-objective-node__code">
            {attrs.curriculumCode}
          </span>
        )}
      </div>
      <div className="learning-objective-node__body">
        <div className="learning-objective-node__objective">
          <InlineFormattedText
            fallback="Describe what learners should know or be able to do."
            text={attrs.objective}
          />
        </div>
        <div className="learning-objective-node__criteria">
          <span className="learning-objective-node__eyebrow">
            Success criteria
          </span>
          <ul>
            {attrs.successCriteria.map((criterion) => (
              <li key={criterion.id}>
                <span
                  aria-hidden="true"
                  className="learning-objective-node__check"
                />
                <InlineFormattedText text={criterion.text} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    learningObjective: {
      insertLearningObjective: (
        attrs?: Partial<LearningObjectiveAttrs>,
      ) => ReturnType;
    };
  }
}

export const LearningObjective = Node.create({
  name: 'learningObjective',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      title: {
        default: 'Learning objective',
        parseHTML: (element) => (
          element.getAttribute('data-learning-objective-title')
          ?? 'Learning objective'
        ),
        renderHTML: (attributes) => ({
          'data-learning-objective-title': attributes.title,
        }),
      },
      curriculumCode: {
        default: '',
        parseHTML: (element) => (
          element.getAttribute('data-learning-objective-code') ?? ''
        ),
        renderHTML: (attributes) => ({
          'data-learning-objective-code': attributes.curriculumCode,
        }),
      },
      objective: {
        default: 'Learners can describe and apply the key concept.',
        parseHTML: (element) => (
          element.getAttribute('data-learning-objective-text')
          ?? 'Learners can describe and apply the key concept.'
        ),
        renderHTML: (attributes) => ({
          'data-learning-objective-text': attributes.objective,
        }),
      },
      successCriteria: {
        default: DEFAULT_SUCCESS_CRITERIA,
        parseHTML: (element) => parseSuccessCriteria(
          element.getAttribute('data-learning-objective-criteria'),
        ),
        renderHTML: (attributes) => ({
          'data-learning-objective-criteria': encodeURIComponent(
            JSON.stringify(attributes.successCriteria),
          ),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="learning-objective"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'learning-objective',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LearningObjectiveNodeView);
  },

  addCommands() {
    return {
      insertLearningObjective:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              title: attrs.title ?? 'Learning objective',
              curriculumCode: attrs.curriculumCode ?? '',
              objective:
                attrs.objective
                ?? 'Learners can describe and apply the key concept.',
              successCriteria:
                attrs.successCriteria ?? defaultSuccessCriteria(),
            },
          }),
    };
  },
});
