"use client";

import { useLayoutEffect, useRef } from 'react';

function percentage(value: string, fallback: number) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed / 100 : fallback;
}

export function useMatrixOptionWidth({
  labels,
  columns,
  controlWithLabel,
}: {
  labels: string[];
  columns: number;
  controlWithLabel: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelsKey = labels.join('\u0000');

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const update = () => {
      const styles = window.getComputedStyle(root);
      const rootWidth = root.clientWidth;
      if (!rootWidth) return;

      const labelElements = Array.from(root.querySelectorAll<HTMLElement>(
        controlWithLabel
          ? '.mcm-node__option-label'
          : '.mch-node__header-option',
      ));
      const longestLabel = labelElements.reduce((maximum, label) => {
        const previousStyle = label.style.cssText;
        label.style.setProperty('position', 'fixed', 'important');
        label.style.setProperty('width', 'max-content', 'important');
        label.style.setProperty('max-width', 'none', 'important');
        label.style.setProperty('min-width', '0', 'important');
        label.style.setProperty('display', 'inline-block', 'important');
        label.style.setProperty('white-space', 'nowrap', 'important');
        const width = label.getBoundingClientRect().width;
        label.style.cssText = previousStyle;
        return Math.max(maximum, width);
      }, 0);
      const optionCell = root.querySelector<HTMLElement>('.mcm-node__option');
      const optionColumns = root.querySelector<HTMLElement>(
        controlWithLabel ? '.mcm-node__options' : '.mch-node__option-columns',
      );
      const control = root.querySelector<HTMLElement>(
        '.custom-block__choice-indicator',
      );
      const inlineGap = optionCell
        ? Number.parseFloat(window.getComputedStyle(optionCell).columnGap) || 12
        : 12;
      const columnGap = optionColumns
        ? Number.parseFloat(window.getComputedStyle(optionColumns).columnGap) || 12
        : 12;
      const controlSize = control?.getBoundingClientRect().width || 24;
      const defaultRatio = percentage(
        styles.getPropertyValue('--custom-block-matrix-options-width'),
        0.52,
      );
      const maximumRatio = percentage(
        styles.getPropertyValue('--custom-block-matrix-options-max-width'),
        0.7,
      );
      const columnContentWidth = controlWithLabel
        ? controlSize + inlineGap + longestLabel
        : Math.max(controlSize, longestLabel);
      const intrinsicWidth = (
        Math.max(1, columns) * columnContentWidth
        + Math.max(0, columns - 1) * columnGap
      );
      const resolvedWidth = Math.min(
        rootWidth * maximumRatio,
        Math.max(rootWidth * defaultRatio, intrinsicWidth),
      );

      root.style.setProperty(
        '--custom-block-matrix-options-resolved-width',
        `${resolvedWidth}px`,
      );
    };

    update();
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(root);
    void document.fonts.ready.then(update);
    return () => resizeObserver.disconnect();
  }, [columns, controlWithLabel, labelsKey]);

  return rootRef;
}
