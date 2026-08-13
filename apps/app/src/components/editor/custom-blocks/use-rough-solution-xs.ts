"use client";

import { useLayoutEffect, useRef, type RefObject } from 'react';
import rough from 'roughjs';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function useRoughSolutionXs(
  containerRef: RefObject<HTMLElement | null>,
) {
  const solutionsRef = useRef<SVGSVGElement>(null);
  const drawFrameRef = useRef<number | null>(null);
  const signatureRef = useRef('');

  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = solutionsRef.current;
    if (!container || !svg) return;

    const drawSolutions = () => {
      const containerRect = container.getBoundingClientRect();
      if (!containerRect.width || !containerRect.height) return;

      const showSolutions =
        container.closest('.tiptap')?.getAttribute('data-show-solutions')
        === 'true';
      const targets = Array.from(container.querySelectorAll<HTMLElement>(
        '[data-rough-solution-x="true"]',
      ));
      const hasVisibleExample = targets.some(
        (target) => target.dataset.solutionKind === 'example',
      );

      const roundedWidth = containerRect.width.toFixed(2);
      const roundedHeight = containerRect.height.toFixed(2);
      const targetSignature = targets
        .map((target) => {
          const targetRect = target.getBoundingClientRect();
          return [
            target.dataset.solutionKey ?? '',
            target.dataset.solutionKind ?? 'solution',
            (targetRect.left - containerRect.left).toFixed(2),
            (targetRect.top - containerRect.top).toFixed(2),
            targetRect.width.toFixed(2),
            targetRect.height.toFixed(2),
          ].join(':');
        })
        .join('|');
      const signature = [
        roundedWidth,
        roundedHeight,
        showSolutions ? 'show' : 'hide',
        targetSignature,
      ].join('::');
      if (signatureRef.current === signature) return;
      signatureRef.current = signature;

      if (!showSolutions && !hasVisibleExample) {
        if (svg.firstChild) svg.replaceChildren();
        return;
      }

      svg.replaceChildren();
      svg.setAttribute(
        'viewBox',
        `0 0 ${containerRect.width} ${containerRect.height}`,
      );
      const roughSvg = rough.svg(svg);

      targets.forEach((target) => {
        const targetRect = target.getBoundingClientRect();
        const inset = 4;
        const left = targetRect.left - containerRect.left + inset;
        const top = targetRect.top - containerRect.top + inset;
        const right = targetRect.right - containerRect.left - inset;
        const bottom = targetRect.bottom - containerRect.top - inset;
        const solutionKey = target.dataset.solutionKey ?? '';
        const solutionKind = target.dataset.solutionKind === 'example'
          ? 'example'
          : 'solution';
        const options = (strokeIndex: number) => ({
          bowing: 1.4,
          disableMultiStroke: true,
          roughness: 1.15,
          seed: stableHash(`${solutionKey}:${strokeIndex}`) || strokeIndex,
          stroke: 'var(--custom-block-solution-color)',
          strokeWidth: 1.5,
        });

        const firstStroke = roughSvg.line(
          left,
          top,
          right,
          bottom,
          options(1),
        );
        const secondStroke = roughSvg.line(
          right,
          top,
          left,
          bottom,
          options(2),
        );
        [firstStroke, secondStroke].forEach((stroke) => {
          stroke.dataset.solutionKind = solutionKind;
          stroke.querySelectorAll('path').forEach((path) => {
            path.style.stroke = solutionKind === 'example'
              ? 'var(--custom-block-example-solution-color)'
              : 'var(--custom-block-solution-color)';
          });
          svg.appendChild(stroke);
        });
      });
    };

    const scheduleDraw = () => {
      if (drawFrameRef.current !== null) return;
      drawFrameRef.current = requestAnimationFrame(() => {
        drawFrameRef.current = null;
        drawSolutions();
      });
    };

    scheduleDraw();
    const resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(container);
    window.addEventListener('resize', scheduleDraw);
    void document.fonts.ready.then(scheduleDraw);

    const mutationObserver = new MutationObserver(scheduleDraw);
    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: [
        'data-rough-solution-x',
        'data-solution-kind',
        'data-solution-key',
      ],
      childList: true,
      subtree: true,
    });
    const tiptapRoot = container.closest('.tiptap');
    if (tiptapRoot) {
      mutationObserver.observe(tiptapRoot, {
        attributes: true,
        attributeFilter: ['data-show-solutions'],
      });
    }

    return () => {
      if (drawFrameRef.current !== null) {
        cancelAnimationFrame(drawFrameRef.current);
        drawFrameRef.current = null;
      }
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleDraw);
    };
  }, [containerRef]);

  return solutionsRef;
}
