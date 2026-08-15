"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import { CustomBlockRoot } from '@/components/editor/custom-blocks/primitives';

export type RichTextAttrs = {
  html: string;
  bypassGap: boolean;
};

export const DEFAULT_RICH_TEXT_HTML =
  '<p>Add your text here. Use the content editor to format it.</p>';

function RichTextNodeView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as RichTextAttrs;
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectionFragments, setSelectionFragments] = useState<Array<{
    top: number;
    height: number;
  }>>([]);
  const measureSelectionFragments = useCallback(() => {
    const root = rootRef.current;
    if (!root || !selected) {
      setSelectionFragments([]);
      return;
    }
    const editor = root.closest('.ProseMirror');
    if (!editor) return;
    const rootRect = root.getBoundingClientRect();
    const headers = Array.from(
      editor.querySelectorAll<HTMLElement>('.tiptap-page-header'),
    );
    const footers = Array.from(
      editor.querySelectorAll<HTMLElement>('.tiptap-page-footer'),
    );
    const next = headers.flatMap((header, index) => {
      const footer = footers[index];
      if (!footer) return [];
      const headerRect = header.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const top = Math.max(rootRect.top, headerRect.bottom);
      const bottom = Math.min(rootRect.bottom, footerRect.top);
      return bottom > top
        ? [{ top: top - rootRect.top, height: bottom - top }]
        : [];
    });
    setSelectionFragments((current) => (
      current.length === next.length
      && current.every((fragment, index) => (
        Math.abs(fragment.top - next[index].top) < 0.5
        && Math.abs(fragment.height - next[index].height) < 0.5
      ))
        ? current
        : next
    ));
  }, [selected]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !selected) return;
    const editor = root.closest('.ProseMirror');
    let frame = requestAnimationFrame(measureSelectionFragments);
    const scheduleMeasure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measureSelectionFragments);
    };
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(root);
    const mutationObserver = editor
      ? new MutationObserver((mutations) => {
        const onlySelectionFrameChanges = mutations.every((mutation) => {
          if (
            mutation.type === 'attributes'
            && mutation.target instanceof HTMLElement
            && mutation.target.classList.contains(
              'rich-text-node__selection-fragment',
            )
          ) {
            return true;
          }
          const changedNodes = [
            ...Array.from(mutation.addedNodes),
            ...Array.from(mutation.removedNodes),
          ];
          return mutation.type === 'childList'
            && changedNodes.length > 0
            && changedNodes.every((changedNode) => (
              changedNode instanceof HTMLElement
              && changedNode.classList.contains(
                'rich-text-node__selection-fragment',
              )
            ));
        });
        if (!onlySelectionFrameChanges) scheduleMeasure();
      })
      : null;
    mutationObserver?.observe(editor!, {
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener('resize', scheduleMeasure);
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
    };
  }, [measureSelectionFragments, selected]);

  return (
    <CustomBlockRoot
      selected={selected}
      className={`rich-text-node${attrs.bypassGap ? ' rich-text-node--bypass-gap' : ''}`}
      rootRef={rootRef}
    >
      <div
        className="rich-text-node__content"
        dangerouslySetInnerHTML={{ __html: attrs.html }}
      />
      {selected && selectionFragments.map((fragment, index) => (
        <span
          aria-hidden="true"
          className="rich-text-node__selection-fragment"
          data-first={index === 0}
          data-last={index === selectionFragments.length - 1}
          key={`${index}-${fragment.top}`}
          style={{
            top: fragment.top,
            height: fragment.height,
          }}
        />
      ))}
    </CustomBlockRoot>
  );
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    richText: {
      insertRichText: (attrs?: Partial<RichTextAttrs>) => ReturnType;
    };
  }
}

export const RichText = Node.create({
  name: 'richText',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      html: {
        default: DEFAULT_RICH_TEXT_HTML,
        parseHTML: (element) => {
          const value = element.getAttribute('data-rich-text-html');
          if (!value) return DEFAULT_RICH_TEXT_HTML;
          try {
            return decodeURIComponent(value);
          } catch {
            return DEFAULT_RICH_TEXT_HTML;
          }
        },
        renderHTML: (attributes) => ({
          'data-rich-text-html': encodeURIComponent(attributes.html),
        }),
      },
      bypassGap: {
        default: false,
        parseHTML: (element) => (
          element.getAttribute('data-rich-text-bypass-gap') === 'true'
        ),
        renderHTML: (attributes) => ({
          'data-rich-text-bypass-gap': String(attributes.bypassGap),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="rich-text"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'rich-text',
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(RichTextNodeView);
  },

  addCommands() {
    return {
      insertRichText:
        (attrs = {}) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              html: attrs.html ?? DEFAULT_RICH_TEXT_HTML,
              bypassGap: attrs.bypassGap ?? false,
            },
          }),
    };
  },
});
