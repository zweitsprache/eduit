"use client";

import { Node, mergeAttributes } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { List, MessageSquare } from 'lucide-react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { LearningCardContent, type LearningCardTextSize } from '@/components/editor/learning-cards-node';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { InlineFormattedText } from '@/components/editor/custom-blocks/inline-formatting';

export type CommunicationCardItem = {
  id: string;
  pairTitle: string;
  situation: string;
  task: string;
  intro: string;
  listType: 'informationen' | 'sprechhilfen';
  listItems: string;
  content: string;
};

export type CommunicationCardsAttrs = {
  title: string;
  format: 'a4-landscape';
  sidedness: 'single';
  items: CommunicationCardItem[];
  textSize: LearningCardTextSize;
  groupIndex: number;
};

const CARDS_PER_GROUP = 4;
const CARD_BADGE_LABELS = ['1A', '1B', '2A', '2B'] as const;

export const DEFAULT_COMMUNICATION_CARD_ITEMS: CommunicationCardItem[] = Array.from(
  { length: CARDS_PER_GROUP },
  (_, index) => ({
    id: `communication-card-${index + 1}`,
    pairTitle: '',
    situation: '',
    task: '',
    intro: '',
    listType: 'informationen',
    listItems: '',
    content: '',
  }),
);

export const DEFAULT_COMMUNICATION_CARDS_ATTRS: CommunicationCardsAttrs = {
  title: 'Communication Cards',
  format: 'a4-landscape',
  sidedness: 'single',
  items: DEFAULT_COMMUNICATION_CARD_ITEMS,
  textSize: 'm',
  groupIndex: 0,
};

function parseItems(value: string | null, fallbackPairTitle = ''): CommunicationCardItem[] {
  if (!value) {
    return DEFAULT_COMMUNICATION_CARD_ITEMS.map((item) => ({ ...item }));
  }
  try {
    const parsed = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(parsed)) throw new Error('Invalid communication-card items');
    const items = parsed.flatMap((item, index): CommunicationCardItem[] => (
      item && typeof item === 'object'
        ? [{
          id: typeof item.id === 'string' ? item.id : `communication-card-${index + 1}`,
          pairTitle: typeof item.pairTitle === 'string'
            ? item.pairTitle
            : (typeof item.cardTitle === 'string' ? item.cardTitle : fallbackPairTitle),
          situation: typeof item.situation === 'string' ? item.situation : '',
          task: typeof item.task === 'string' ? item.task : '',
          intro: typeof item.intro === 'string' ? item.intro : '',
          listType: item.listType === 'sprechhilfen' ? 'sprechhilfen' : 'informationen',
          listItems: typeof item.listItems === 'string'
            ? item.listItems
            : (typeof item.items === 'string' ? item.items : ''),
          content: typeof item.content === 'string'
            ? item.content
            : (typeof item.front === 'string' ? item.front : ''),
        }]
        : []
    ));
    return items.length
      ? items
      : DEFAULT_COMMUNICATION_CARD_ITEMS.map((item) => ({ ...item }));
  } catch {
    return DEFAULT_COMMUNICATION_CARD_ITEMS.map((item) => ({ ...item }));
  }
}

function groupsOfFour(items: CommunicationCardItem[]) {
  const safeItems = items.length ? items : DEFAULT_COMMUNICATION_CARD_ITEMS;
  return Array.from(
    { length: Math.ceil(safeItems.length / CARDS_PER_GROUP) },
    (_, index) => safeItems.slice(index * CARDS_PER_GROUP, (index + 1) * CARDS_PER_GROUP),
  );
}

function splitListItems(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function CommunicationCardsGrid({
  title,
  textSize,
  items,
}: {
  title: string;
  textSize: LearningCardTextSize;
  items: CommunicationCardItem[];
}) {
  const cells = Array.from({ length: CARDS_PER_GROUP }, (_, index) => items[index] ?? null);
  return (
    <div className="communication-cards-node__grid">
      {cells.map((item, index) => {
        const variant = index % 2 === 0 ? 'a' : 'b';
        return (
        <div
          className={`communication-cards-node__card communication-cards-node__card--${variant}`}
          key={item?.id ?? `empty-${index}`}
        >
          <div className="communication-cards-node__badge-row">
            <span className="custom-block__row-index communication-cards-node__badge">
              <span className="custom-block__compact-label">
                {CARD_BADGE_LABELS[index] ?? `${index + 1}`}
              </span>
            </span>
          </div>
          {(title.trim() || item?.pairTitle.trim()) && (
            <div className="communication-cards-node__titles">
              {title.trim() && (
                <p className="communication-cards-node__node-title">{title}</p>
              )}
              {item?.pairTitle.trim() && (
                <h2 className="communication-cards-node__card-title">{item.pairTitle}</h2>
              )}
            </div>
          )}
          {item ? (
            <div className="communication-cards-node__content-wrapper">
              {item.situation.trim() && (
                <div className="communication-cards-node__situation">
                  <InlineFormattedText text={item.situation} />
                </div>
              )}
              {item.task.trim() && (
                <div className="communication-cards-node__task">
                  <InlineFormattedText text={item.task} />
                </div>
              )}
              {item.intro.trim() && (
                <div className="communication-cards-node__intro">
                  <p className="communication-cards-node__intro-start">Start</p>
                  <div className="communication-cards-node__intro-row">
                    <MessageSquare aria-hidden="true" className="communication-cards-node__intro-icon" />
                    <InlineFormattedText text={item.intro} />
                  </div>
                </div>
              )}
              {splitListItems(item.listItems).length > 0 && (
                <div className="communication-cards-node__list-group">
                  <p className="communication-cards-node__list-title">
                    {item.listType === 'sprechhilfen' ? 'Sprechhilfen' : 'Informationen'}
                  </p>
                  <ul className="communication-cards-node__icon-list">
                    {splitListItems(item.listItems).map((line, lineIndex) => (
                      <li className="communication-cards-node__icon-list-item" key={`${item.id}-line-${lineIndex}`}>
                        <List aria-hidden="true" className="communication-cards-node__list-icon" />
                        <InlineFormattedText text={line} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <LearningCardContent
                fallback={undefined}
                text={item.content}
                textSize={textSize}
              />
            </div>
          ) : null}
        </div>
        );
      })}
    </div>
  );
}

function CommunicationCardsNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as CommunicationCardsAttrs;
  const groups = groupsOfFour(attrs.items);
  const items = groups[attrs.groupIndex] ?? [];
  const isFollowUpGroup = attrs.groupIndex > 0;
  return (
    <CustomBlockRoot selected={selected} className="communication-cards-node">
      <section className="communication-cards-node__sheet">
        <h1
          className="communication-cards-node__title"
          data-hidden={isFollowUpGroup ? 'true' : 'false'}
        >
          {attrs.title}
        </h1>
        <CommunicationCardsGrid items={items} textSize={attrs.textSize} title={attrs.title} />
      </section>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    communicationCards: {
      insertCommunicationCards: (attrs?: Partial<CommunicationCardsAttrs>) => ReturnType;
    };
  }
}

export const CommunicationCards = Node.create({
  name: 'communicationCards',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      title: {
        default: DEFAULT_COMMUNICATION_CARDS_ATTRS.title,
        parseHTML: (element) => element.getAttribute('data-title') ?? DEFAULT_COMMUNICATION_CARDS_ATTRS.title,
        renderHTML: ({ title }) => ({ 'data-title': title }),
      },
      format: {
        default: DEFAULT_COMMUNICATION_CARDS_ATTRS.format,
        parseHTML: () => 'a4-landscape',
        renderHTML: () => ({ 'data-format': 'a4-landscape' }),
      },
      sidedness: {
        default: DEFAULT_COMMUNICATION_CARDS_ATTRS.sidedness,
        parseHTML: () => 'single',
        renderHTML: () => ({ 'data-sidedness': 'single' }),
      },
      textSize: {
        default: DEFAULT_COMMUNICATION_CARDS_ATTRS.textSize,
        parseHTML: (element) => {
          const value = element.getAttribute('data-text-size');
          return value === 'xs'
            || value === 's'
            || value === 'm'
            || value === 'l'
            || value === 'xl'
            ? value
            : DEFAULT_COMMUNICATION_CARDS_ATTRS.textSize;
        },
        renderHTML: ({ textSize }) => ({ 'data-text-size': textSize }),
      },
      items: {
        default: DEFAULT_COMMUNICATION_CARD_ITEMS,
        parseHTML: (element) => parseItems(
          element.getAttribute('data-items'),
          element.getAttribute('data-card-title') ?? '',
        ),
        renderHTML: ({ items }) => ({
          'data-items': encodeURIComponent(JSON.stringify(items)),
        }),
      },
      groupIndex: {
        default: 0,
        parseHTML: (element) => Number(element.getAttribute('data-group-index')) || 0,
        renderHTML: ({ groupIndex }) => ({ 'data-group-index': groupIndex }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="communication-cards"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'communication-cards' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CommunicationCardsNodeView);
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      filterTransaction: (transaction) => {
        if (!transaction.docChanged) return true;
        let communicationCardsCount = 0;
        let containsForeignNode = false;
        transaction.doc.forEach((child) => {
          if (child.type.name === this.name) communicationCardsCount += 1;
          else if (child.type.name !== 'pageBreak') containsForeignNode = true;
        });
        return communicationCardsCount === 0 || !containsForeignNode;
      },
    })];
  },

  addCommands() {
    return {
      insertCommunicationCards: (attrs = {}) => ({ state, dispatch }) => {
        const docIsEmpty = state.doc.childCount === 0 || (
          state.doc.childCount === 1
          && state.doc.firstChild?.isTextblock
          && state.doc.firstChild.content.size === 0
        );
        if (!docIsEmpty) return false;
        const baseAttrs = {
          ...DEFAULT_COMMUNICATION_CARDS_ATTRS,
          ...attrs,
          items: attrs.items ?? DEFAULT_COMMUNICATION_CARD_ITEMS.map((item) => ({ ...item })),
        };
        const pageBreakType = state.schema.nodes.pageBreak;
        const groups = groupsOfFour(baseAttrs.items);
        const sheets = groups.map((_, groupIndex) => this.type.create({
          ...baseAttrs,
          groupIndex,
        }));
        const nodes = sheets.flatMap((sheet, index) => (
          index < sheets.length - 1 && pageBreakType
            ? [sheet, pageBreakType.create({ restartPagination: false })]
            : [sheet]
        ));
        if (dispatch) dispatch(state.tr.replaceWith(0, state.doc.content.size, nodes));
        return true;
      },
    };
  },
});
