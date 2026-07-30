"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { Hand } from '@untitledui/icons';
import {
  BlockChoiceIndicator,
  BlockInstruction,
  CustomBlockRoot,
} from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import {
  generateTwoWayItems,
  type TwoWayMode,
  type TwoWayPrepositionItem,
  type TwoWayShape,
} from '@/lib/two-way-prepositions';

export type TwoWayPrepositionsAttrs = {
  instruction: string;
  mode: TwoWayMode;
  items: TwoWayPrepositionItem[];
  showVocabulary: boolean;
};

export const DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS: TwoWayPrepositionsAttrs = {
  instruction: 'Wähle die Aussage, die zur Abbildung passt.',
  mode: 'mcq',
  showVocabulary: true,
  items: generateTwoWayItems({
    count: 4,
    mode: 'mcq',
    prepositions: ['an', 'auf', 'in', 'zwischen'],
  }),
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(decodeURIComponent(value)) as T;
  } catch {
    return fallback;
  }
}

function Shape({
  cx,
  cy,
  fill = 'none',
  shape,
  size = 22,
  stroke = 'currentColor',
  strokeDasharray,
}: {
  cx: number;
  cy: number;
  fill?: string;
  shape: TwoWayShape;
  size?: number;
  stroke?: string;
  strokeDasharray?: string;
}) {
  const common = {
    fill,
    stroke,
    strokeDasharray,
    strokeWidth: 2,
    vectorEffect: 'non-scaling-stroke' as const,
  };
  if (shape === 'square') {
    return (
      <rect
        {...common}
        height={size * 2}
        rx={2}
        width={size * 2}
        x={cx - size}
        y={cy - size}
      />
    );
  }
  if (shape === 'circle') {
    return <circle {...common} cx={cx} cy={cy} r={size} />;
  }
  return <ellipse {...common} cx={cx} cy={cy} rx={size * 1.3} ry={size * 0.88} />;
}

function horizontalShapeRadius(shape: TwoWayShape, size: number) {
  return shape === 'ellipse' ? size * 1.3 : size;
}

function Composition({ item }: { item: TwoWayPrepositionItem }) {
  let subject = { x: 48, y: 55 };
  let references = [{ x: 108, y: 55 }];
  if (item.preposition === 'auf') {
    subject = { x: 80, y: 30 };
    references = [{ x: 80, y: 75 }];
  } else if (item.preposition === 'an') {
    const referenceX = 104;
    subject = {
      x: referenceX
        - horizontalShapeRadius(item.referenceShape, 22)
        - horizontalShapeRadius(item.subjectShape, 16),
      y: 55,
    };
    references = [{ x: referenceX, y: 55 }];
  } else if (item.preposition === 'in') {
    subject = { x: 80, y: 55 };
    references = [{ x: 80, y: 55 }];
  } else if (item.preposition === 'neben') {
    subject = { x: 40, y: 55 };
    references = [{ x: 112, y: 55 }];
  } else if (item.preposition === 'über') {
    subject = { x: 80, y: 25 };
    references = [{ x: 80, y: 82 }];
  } else if (item.preposition === 'unter') {
    subject = { x: 80, y: 84 };
    references = [{ x: 80, y: 28 }];
  } else if (item.preposition === 'hinter' || item.preposition === 'vor') {
    subject = { x: 68, y: 55 };
    references = [{ x: 92, y: 55 }];
  } else if (item.preposition === 'zwischen') {
    subject = { x: 80, y: 55 };
    references = [{ x: 35, y: 55 }, { x: 125, y: 55 }];
  }
  const subjectShapes = item.subjectPlural
    ? [{ x: subject.x - 7, y: subject.y - 7 }, { x: subject.x + 7, y: subject.y + 7 }]
    : [subject];
  const referenceShapes = item.referencePlural && references.length === 1
    ? [{ x: references[0].x - 12, y: references[0].y }, { x: references[0].x + 12, y: references[0].y }]
    : references;
  const referenceFirst = item.preposition !== 'hinter';
  const subjectSize = item.preposition === 'in' ? 11 : 16;
  const motionStart = item.preposition === 'unter'
    ? { x: 24, y: 20 }
    : { x: 24, y: 80 };

  const renderReference = () => referenceShapes.map((position, index) => (
    <Shape
      cx={position.x}
      cy={position.y}
      fill="var(--color-bg-secondary)"
      key={`reference-${index}`}
      shape={
        index === 1 && item.secondReferenceShape
          ? item.secondReferenceShape
          : item.referenceShape
      }
      size={item.preposition === 'in' ? 34 : 22}
    />
  ));
  const renderSubject = (
    positions = subjectShapes,
    target = false,
  ) => positions.map((position, index) => (
    <Shape
      cx={position.x}
      cy={position.y}
      fill={target ? 'none' : 'var(--color-bg-brand-secondary)'}
      key={`${target ? 'target' : 'subject'}-${index}`}
      shape={item.subjectShape}
      size={subjectSize}
      stroke="var(--color-text-brand-secondary)"
      strokeDasharray={target ? '4 3' : undefined}
    />
  ));
  const movingSubjectShapes = item.subjectPlural
    ? [
        { x: motionStart.x - 4, y: motionStart.y - 4 },
        { x: motionStart.x + 5, y: motionStart.y + 5 },
      ]
    : [motionStart];
  const isDynamic = item.grammaticalCase === 'accusative';

  return (
    <svg
      aria-label={`${item.preposition}, ${item.grammaticalCase}`}
      className="two-way-prepositions-node__svg"
      role="img"
      viewBox="0 0 160 110"
    >
      {referenceFirst && renderReference()}
      {isDynamic ? renderSubject(subjectShapes, true) : renderSubject()}
      {!referenceFirst && renderReference()}
      {isDynamic && (
        <>
          {renderSubject(movingSubjectShapes)}
          <foreignObject
            height="26"
            width="26"
            x={motionStart.x - 23}
            y={Math.min(82, motionStart.y + 4)}
          >
            <Hand className="two-way-prepositions-node__hand" />
          </foreignObject>
        </>
      )}
    </svg>
  );
}

function TwoWayPrepositionsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as TwoWayPrepositionsAttrs;
  const vocabulary: Array<{
    shape: TwoWayShape;
    label: string;
    plural?: boolean;
  }> = [
    { shape: 'square', label: 'das Quadrat' },
    { shape: 'circle', label: 'der Kreis' },
    { shape: 'ellipse', label: 'die Ellipse' },
    { shape: 'square', label: 'die Quadrate', plural: true },
    { shape: 'circle', label: 'die Kreise', plural: true },
    { shape: 'ellipse', label: 'die Ellipsen', plural: true },
  ];
  return (
    <CustomBlockRoot selected={selected} className="two-way-prepositions-node">
      <BlockInstruction>{attrs.instruction}</BlockInstruction>
      {attrs.showVocabulary && (
        <div
          aria-label="Wortschatzhilfe"
          className="two-way-prepositions-node__vocabulary"
        >
          {vocabulary.map(({ label, plural = false, shape }) => (
            <span
              className="custom-block__word-bank-item two-way-prepositions-node__vocabulary-badge"
              key={`${shape}-${plural ? 'plural' : 'singular'}`}
            >
              <svg aria-hidden="true" viewBox="0 0 36 28">
                {(plural ? [13, 23] : [18]).map((cx, index) => (
                  <g
                    key={cx}
                    transform={
                      plural && shape !== 'circle'
                        ? `rotate(${index === 0 ? -8 : 8} ${cx} 14)`
                        : undefined
                    }
                  >
                    <Shape
                      cx={cx}
                      cy={14}
                      fill="var(--color-bg-brand-secondary)"
                      shape={shape}
                      size={plural ? 6.5 : 8}
                      stroke="var(--color-text-brand-secondary)"
                    />
                  </g>
                ))}
              </svg>
              <span>{label}</span>
            </span>
          ))}
        </div>
      )}
      <div className="two-way-prepositions-node__visuals">
        {attrs.items.map((item, index) => (
          <div className="two-way-prepositions-node__visual" key={item.id}>
            <div className="two-way-prepositions-node__number-row">
              <span className="custom-block__row-index">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <Composition item={item} />
          </div>
        ))}
      </div>
      <div className="two-way-prepositions-node__items">
        {attrs.items.map((item, index) => (
          <div
            className={[
              'two-way-prepositions-node__item',
              attrs.mode === 'trueFalse'
                ? 'two-way-prepositions-node__item--true-false'
                : '',
            ].join(' ')}
            key={item.id}
          >
            <span className="custom-block__row-index matching-pairs-node__letter">
              {String.fromCharCode(97 + index)}
            </span>
            {attrs.mode === 'mcq' ? (
              <div className="two-way-prepositions-node__options">
                {item.options.map((option) => (
                  <div className="two-way-prepositions-node__option" key={option.id}>
                    <BlockChoiceIndicator checked={false} />
                    <span>{option.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <span className="two-way-prepositions-node__statement">
                  {item.statement}
                </span>
                <span className="two-way-prepositions-node__true-false">
                  <span><BlockChoiceIndicator checked={false} /> Richtig</span>
                  <span><BlockChoiceIndicator checked={false} /> Falsch</span>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    twoWayPrepositions: {
      insertTwoWayPrepositions: (
        attrs?: Partial<TwoWayPrepositionsAttrs>,
      ) => ReturnType;
    };
  }
}

export const TwoWayPrepositions = Node.create({
  name: 'twoWayPrepositions',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS.instruction,
        parseHTML: (element) => element.getAttribute('data-instruction')
          ?? DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS.instruction,
        renderHTML: ({ instruction }) => ({ 'data-instruction': instruction }),
      },
      mode: {
        default: DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS.mode,
        parseHTML: (element) => element.getAttribute('data-mode') ?? 'mcq',
        renderHTML: ({ mode }) => ({ 'data-mode': mode }),
      },
      showVocabulary: {
        default: true,
        parseHTML: (element) => (
          element.getAttribute('data-show-vocabulary') !== 'false'
        ),
        renderHTML: ({ showVocabulary }) => ({
          'data-show-vocabulary': String(showVocabulary),
        }),
      },
      items: {
        default: DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS.items,
        parseHTML: (element) => parseJson(
          element.getAttribute('data-items'),
          DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS.items,
        ),
        renderHTML: ({ items }) => ({
          'data-items': encodeURIComponent(JSON.stringify(items)),
        }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'div[data-type="two-way-prepositions"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, {
      'data-type': 'two-way-prepositions',
    })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TwoWayPrepositionsNodeView);
  },
  addCommands() {
    return {
      insertTwoWayPrepositions: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: { ...DEFAULT_TWO_WAY_PREPOSITIONS_ATTRS, ...attrs },
      }),
    };
  },
});
