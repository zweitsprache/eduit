"use client";

import { useEffect, useState } from 'react';
import type { Editor } from '@tiptap/core';
import { NodeSelection } from '@tiptap/pm/state';
import { createPortal } from 'react-dom';

type OverlayRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export function BlockSelectionOverlay({ editor }: { editor: Editor }) {
  const [rect, setRect] = useState<OverlayRect | null>(null);

  useEffect(() => {
    let frame = 0;
    let observedElement: HTMLElement | null = null;
    const resizeObserver = new ResizeObserver(() => schedule());

    const measure = () => {
      frame = 0;
      const { selection } = editor.state;
      if (!(selection instanceof NodeSelection)) {
        resizeObserver.disconnect();
        observedElement = null;
        setRect(null);
        return;
      }
      const nodeDom = editor.view.nodeDOM(selection.from);
      const element = nodeDom instanceof HTMLElement
        ? nodeDom
        : nodeDom?.parentElement ?? null;
      if (
        !element
        || !element.isConnected
        || element.classList.contains('rich-text-node')
      ) {
        resizeObserver.disconnect();
        observedElement = null;
        setRect(null);
        return;
      }
      if (observedElement !== element) {
        resizeObserver.disconnect();
        resizeObserver.observe(element);
        observedElement = element;
      }
      const next = element.getBoundingClientRect();
      setRect((current) => {
        const measured = {
          top: next.top,
          left: next.left,
          width: next.width,
          height: next.height,
        };
        return current
          && Math.abs(current.top - measured.top) < 0.25
          && Math.abs(current.left - measured.left) < 0.25
          && Math.abs(current.width - measured.width) < 0.25
          && Math.abs(current.height - measured.height) < 0.25
          ? current
          : measured;
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    editor.on('selectionUpdate', schedule);
    editor.on('transaction', schedule);
    document.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      editor.off('selectionUpdate', schedule);
      editor.off('transaction', schedule);
      document.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
    };
  }, [editor]);

  if (!rect || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[44] rounded-md border border-dashed border-[#cc6600]"
      style={rect}
    />,
    document.body,
  );
}
