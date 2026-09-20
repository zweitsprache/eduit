"use client";

import { useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { BlockInstruction, CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';
import { CUSTOM_BLOCK_NODE_GROUP } from '@/components/editor/custom-blocks/numbering';
import { getEditorPageAreas } from '@/components/editor/page-layout';

export type TelephoneNumbersItem = { id: string; number: string };

export type TelephoneNumbersAttrs = {
  instruction: string;
  hideInstructionBadge: boolean;
  showItemNumbers: boolean;
  showFirstAsExample: boolean;
  items: TelephoneNumbersItem[];
};

export const DEFAULT_TELEPHONE_NUMBERS_INSTRUCTION = 'Write the telephone numbers.';
export const DEFAULT_TELEPHONE_NUMBERS_ITEMS: TelephoneNumbersItem[] = [
  { id: 'telephone-number-1', number: '1234567890' },
  { id: 'telephone-number-2', number: '9876543210' },
];

function defaultItems() {
  return DEFAULT_TELEPHONE_NUMBERS_ITEMS.map((item) => ({ ...item }));
}

function normalizedNumber(value: string) {
  let digitCount = 0;
  return Array.from(value).flatMap((character) => {
    if (character === '*') return character;
    if (/\d/.test(character) && digitCount < 10) {
      digitCount += 1;
      return character;
    }
    return [];
  }).join('');
}

function numberDigits(value: string) {
  let prefilled = false;
  return Array.from(normalizedNumber(value)).flatMap((character) => {
    if (character === '*') {
      prefilled = true;
      return [];
    }
    const digit = { digit: character, prefilled };
    prefilled = false;
    return [digit];
  });
}

function parseItems(value: string | null): TelephoneNumbersItem[] {
  if (!value) return defaultItems();
  try {
    const items = JSON.parse(decodeURIComponent(value));
    if (!Array.isArray(items)) return defaultItems();
    const parsed = items.flatMap((item, index): TelephoneNumbersItem[] => (
      item && typeof item.number === 'string'
        ? [{
            id: typeof item.id === 'string' ? item.id : `telephone-number-${index + 1}`,
            number: normalizedNumber(item.number),
          }]
        : []
    ));
    return parsed.length ? parsed : defaultItems();
  } catch {
    return defaultItems();
  }
}

function TelephoneNumberBoxes({ example, number }: { example: boolean; number: string }) {
  const digits = numberDigits(number);
  return (
    <span className="telephone-numbers-node__boxes" data-example={example}>
      {Array.from({ length: 10 }, (_, index) => (
        <span className="telephone-numbers-node__cell" data-group-end={index === 2 || index === 5 || index === 7} key={index}>
          <strong className="telephone-numbers-node__digit" data-prefilled={digits[index]?.prefilled || undefined}>
            {digits[index]?.digit ?? ''}
          </strong>
        </span>
      ))}
    </span>
  );
}

function TelephoneNumbersPageBreakSpacer({ editor }: Pick<NodeViewProps, 'editor'>) {
  const spacerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const spacer = spacerRef.current;
    const pagesStorage = editor.storage?.pages;
    if (
      !spacer
      || !pagesStorage
      || typeof pagesStorage !== 'object'
      || !(pagesStorage.onAfterPageLayoutCallbacks instanceof Map)
    ) return;

    let appliedHeight = 0;
    const updateSpacer = () => {
      const root = spacer.parentElement;
      const editorRoot = spacer.closest('.ProseMirror');
      if (!(root instanceof HTMLElement) || !(editorRoot instanceof HTMLElement)) return;
      const rootRect = root.getBoundingClientRect();
      const overflowingArea = getEditorPageAreas(editorRoot).find((area) => (
        rootRect.top < area.bottom && rootRect.bottom > area.bottom
      ));
      if (!overflowingArea) return;

      const zoom = editorRoot.getBoundingClientRect().width / editorRoot.offsetWidth || 1;
      const nextHeight = Math.max(0, overflowingArea.bottom - spacer.getBoundingClientRect().top + 1) / zoom;
      if (Math.abs(appliedHeight - nextHeight) < 1) return;
      appliedHeight = nextHeight;
      spacer.style.height = `${nextHeight}px`;
    };

    pagesStorage.onAfterPageLayoutCallbacks.set(spacer, updateSpacer);
    const animationFrame = requestAnimationFrame(updateSpacer);
    return () => {
      cancelAnimationFrame(animationFrame);
      pagesStorage.onAfterPageLayoutCallbacks.delete(spacer);
    };
  }, [editor]);

  return <div ref={spacerRef} aria-hidden="true" className="telephone-numbers-node__page-break-spacer" />;
}

function TelephoneNumbersNodeView({ editor, node, selected }: NodeViewProps) {
  const attrs = node.attrs as TelephoneNumbersAttrs;
  return (
    <CustomBlockRoot selected={selected} className="telephone-numbers-node">
      <TelephoneNumbersPageBreakSpacer editor={editor} />
      <BlockInstruction hideBadge={attrs.hideInstructionBadge}>
        {attrs.instruction || DEFAULT_TELEPHONE_NUMBERS_INSTRUCTION}
      </BlockInstruction>
      <div className="telephone-numbers-node__items">
        {attrs.items.map((item, index) => (
          <div className="telephone-numbers-node__item" key={item.id}>
            {attrs.showItemNumbers && <span className="custom-block__row-index">{String(index + 1).padStart(2, '0')}</span>}
            <TelephoneNumberBoxes example={attrs.showFirstAsExample && index === 0} number={item.number} />
          </div>
        ))}
      </div>
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    telephoneNumbers: {
      insertTelephoneNumbers: (attrs?: Partial<TelephoneNumbersAttrs>) => ReturnType;
    };
  }
}

export const TelephoneNumbers = Node.create({
  name: 'telephoneNumbers',
  group: CUSTOM_BLOCK_NODE_GROUP,
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      instruction: {
        default: DEFAULT_TELEPHONE_NUMBERS_INSTRUCTION,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-telephone-numbers-instruction') ?? DEFAULT_TELEPHONE_NUMBERS_INSTRUCTION,
        renderHTML: (attributes: TelephoneNumbersAttrs) => ({ 'data-telephone-numbers-instruction': attributes.instruction }),
      },
      hideInstructionBadge: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-telephone-numbers-hide-instruction-badge') === 'true',
        renderHTML: (attributes: TelephoneNumbersAttrs) => ({ 'data-telephone-numbers-hide-instruction-badge': String(attributes.hideInstructionBadge) }),
      },
      showItemNumbers: {
        default: true,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-telephone-numbers-item-numbers') !== 'false',
        renderHTML: (attributes: TelephoneNumbersAttrs) => ({ 'data-telephone-numbers-item-numbers': String(attributes.showItemNumbers) }),
      },
      showFirstAsExample: {
        default: false,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-telephone-numbers-show-first-as-example') === 'true',
        renderHTML: (attributes: TelephoneNumbersAttrs) => ({ 'data-telephone-numbers-show-first-as-example': String(attributes.showFirstAsExample) }),
      },
      items: {
        default: DEFAULT_TELEPHONE_NUMBERS_ITEMS,
        parseHTML: (element: HTMLElement) => parseItems(element.getAttribute('data-telephone-numbers-items')),
        renderHTML: (attributes: TelephoneNumbersAttrs) => ({ 'data-telephone-numbers-items': encodeURIComponent(JSON.stringify(attributes.items)) }),
      },
    };
  },

  parseHTML() { return [{ tag: 'div[data-type="telephone-numbers"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'telephone-numbers' })]; },
  addNodeView() { return ReactNodeViewRenderer(TelephoneNumbersNodeView); },

  addCommands() {
    return {
      insertTelephoneNumbers: (attrs = {}) => ({ commands }) => commands.insertContent({
        type: this.name,
        attrs: {
          instruction: attrs.instruction ?? DEFAULT_TELEPHONE_NUMBERS_INSTRUCTION,
          hideInstructionBadge: attrs.hideInstructionBadge ?? false,
          showItemNumbers: attrs.showItemNumbers ?? true,
          showFirstAsExample: attrs.showFirstAsExample ?? false,
          items: attrs.items ?? defaultItems(),
        },
      }),
    };
  },
});