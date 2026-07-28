"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronUp,
  Copy01,
  PlusSquare,
  Trash01,
} from '@untitledui/icons';

const BLOCK_SELECTOR = [
  '.custom-block',
  '.heading-node',
  '.tiptap-page-break-node',
].join(',');

type HoveredBlock = {
  element: HTMLElement;
  pos: number;
  top: number;
  right: number;
};

function resolveNodePosition(editor: Editor, element: HTMLElement) {
  try {
    const position = editor.view.posAtDOM(element, 0);
    let resolved: number | null = null;
    editor.state.doc.forEach((node, pos) => {
      if (
        resolved === null
        && position >= pos
        && position < pos + node.nodeSize
      ) {
        resolved = pos;
      }
    });
    return resolved;
  } catch {
    return null;
  }
}

function topLevelNodes(editor: Editor) {
  const nodes: Array<{ pos: number; size: number }> = [];
  editor.state.doc.forEach((node, pos) => {
    nodes.push({ pos, size: node.nodeSize });
  });
  return nodes;
}

export function BlockHoverToolbar({
  editor,
  onInsertAbove,
  onInsertBelow,
}: {
  editor: Editor;
  onInsertAbove: (pos: number) => void;
  onInsertBelow: (pos: number) => void;
}) {
  const [hovered, setHovered] = useState<HoveredBlock | null>(null);

  useEffect(() => {
    const updateFromElement = (element: HTMLElement) => {
      const pos = resolveNodePosition(editor, element);
      if (pos === null) return;
      const rect = element.getBoundingClientRect();
      setHovered((current) => (
        current?.element === element
        && current.pos === pos
        && current.top === rect.top
        && current.right === rect.right
          ? current
          : {
              element,
              pos,
              top: rect.top,
              right: rect.right,
            }
      ));
    };
    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.closest('[data-block-hover-toolbar]')) return;
      const element = target.closest<HTMLElement>(BLOCK_SELECTOR);
      if (element && editor.view.dom.contains(element)) {
        updateFromElement(element);
      } else {
        setHovered(null);
      }
    };
    const refreshPosition = () => {
      setHovered((current) => {
        if (!current || !current.element.isConnected) return null;
        const rect = current.element.getBoundingClientRect();
        return {
          ...current,
          top: rect.top,
          right: rect.right,
        };
      });
    };
    document.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('resize', refreshPosition);
    document.addEventListener('scroll', refreshPosition, true);
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', refreshPosition);
      document.removeEventListener('scroll', refreshPosition, true);
    };
  }, [editor]);

  if (!hovered || typeof document === 'undefined') return null;

  const siblings = topLevelNodes(editor);
  const index = siblings.findIndex(({ pos }) => pos === hovered.pos);
  const canMoveUp = index > 0;
  const canMoveDown = index >= 0 && index < siblings.length - 1;

  const duplicate = () => {
    const node = editor.state.doc.nodeAt(hovered.pos);
    if (!node) return;
    editor.view.dispatch(
      editor.state.tr
        .insert(hovered.pos + node.nodeSize, node.copy(node.content))
        .scrollIntoView(),
    );
    setHovered(null);
  };

  const remove = () => {
    const node = editor.state.doc.nodeAt(hovered.pos);
    if (!node) return;
    editor.view.dispatch(
      editor.state.tr
        .delete(hovered.pos, hovered.pos + node.nodeSize)
        .scrollIntoView(),
    );
    setHovered(null);
  };

  const move = (direction: -1 | 1) => {
    const node = editor.state.doc.nodeAt(hovered.pos);
    if (!node || index < 0) return;
    const transaction = editor.state.tr;
    if (direction === -1) {
      const previous = siblings[index - 1];
      if (!previous) return;
      transaction
        .delete(hovered.pos, hovered.pos + node.nodeSize)
        .insert(previous.pos, node);
    } else {
      const next = siblings[index + 1];
      if (!next) return;
      transaction
        .delete(hovered.pos, hovered.pos + node.nodeSize)
        .insert(hovered.pos + next.size, node);
    }
    editor.view.dispatch(transaction.scrollIntoView());
    setHovered(null);
  };

  const actions = [
    {
      label: 'Insert block above',
      icon: PlusSquare,
      disabled: false,
      action: () => {
        onInsertAbove(hovered.pos);
        setHovered(null);
      },
    },
    {
      label: 'Insert block below',
      icon: PlusSquare,
      disabled: false,
      action: () => {
        const node = editor.state.doc.nodeAt(hovered.pos);
        if (!node) return;
        onInsertBelow(hovered.pos + node.nodeSize);
        setHovered(null);
      },
    },
    {
      label: 'Move block up',
      icon: ChevronUp,
      disabled: !canMoveUp,
      action: () => move(-1),
    },
    {
      label: 'Move block down',
      icon: ChevronDown,
      disabled: !canMoveDown,
      action: () => move(1),
    },
    {
      label: 'Duplicate block',
      icon: Copy01,
      disabled: false,
      action: duplicate,
    },
    {
      label: 'Delete block',
      icon: Trash01,
      disabled: false,
      action: remove,
      destructive: true,
    },
  ];

  return createPortal(
    <div
      data-block-hover-toolbar
      className="fixed z-[45] flex h-8 items-center rounded-md border border-secondary bg-primary p-0.5 shadow-lg"
      style={{
        left: hovered.right - 8,
        top: Math.max(8, hovered.top + 8),
        transform: 'translateX(-100%)',
      }}
    >
      {actions.map((action) => (
        <button
          type="button"
          key={action.label}
          title={action.label}
          aria-label={action.label}
          disabled={action.disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={action.action}
          className={[
            'flex size-7 items-center justify-center rounded text-fg-quaternary transition disabled:cursor-not-allowed disabled:opacity-30',
            action.destructive
              ? 'hover:bg-error-primary hover:text-error-primary'
              : 'hover:bg-primary_hover hover:text-fg-secondary',
          ].join(' ')}
        >
          <action.icon className="size-4" />
        </button>
      ))}
    </div>,
    document.body,
  );
}
