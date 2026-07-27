"use client";

import type { ReactNode, Ref } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import { cx } from '@/utils/cx';

export function CustomBlockRoot({
  selected,
  className,
  rootRef,
  children,
}: {
  selected: boolean;
  className?: string;
  rootRef?: Ref<HTMLDivElement>;
  children: ReactNode;
}) {
  return (
    <NodeViewWrapper
      ref={rootRef}
      className={cx(
        'custom-block',
        selected && 'custom-block--selected',
        className,
      )}
      data-drag-handle
    >
      {children}
    </NodeViewWrapper>
  );
}

export function BlockInstruction({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <header className="custom-block__instruction">
      <span aria-hidden="true" className="custom-block__badge" />
      <strong className="custom-block__instruction-text">{children}</strong>
    </header>
  );
}

export function BlockQuestion({
  children,
}: {
  children?: ReactNode;
}) {
  const hasContent = typeof children === 'string'
    ? children.trim().length > 0
    : children !== null && children !== undefined && children !== false;

  if (!hasContent) return null;

  return (
    <p className="custom-block__question">
      {children}
    </p>
  );
}

export function BlockRows({
  children,
  columns = 1,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className="custom-block__rows" data-columns={columns}>
      {children}
    </div>
  );
}

export function BlockRow({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  return (
    <div className="custom-block__row">
      <span className="custom-block__row-index">
        {String(index + 1).padStart(2, '0')}
      </span>
      {children}
    </div>
  );
}

export function BlockChoiceIndicator({
  checked,
  example = false,
  solutionKey,
}: {
  checked: boolean;
  example?: boolean;
  solutionKey?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'custom-block__choice-indicator',
        checked && 'custom-block__choice-indicator--checked',
      )}
      data-rough-solution-x={solutionKey ? true : undefined}
      data-solution-kind={example ? 'example' : 'solution'}
      data-solution-key={solutionKey}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

export function BlockRowLabel({ children }: { children: ReactNode }) {
  return <span className="custom-block__row-label">{children}</span>;
}
