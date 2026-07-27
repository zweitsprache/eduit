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

  useLayoutEffect(() => {
    const container = containerRef.current;
    const svg = solutionsRef.current;
    if (!container || !svg) return;

    const drawSolutions = () => {
      const containerRect = container.getBoundingClientRect();
      if (!containerRect.width || !containerRect.height) return;

      svg.replaceChildren();
      svg.setAttribute(
        'viewBox',
        `0 0 ${containerRect.width} ${containerRect.height}`,
      );
      const roughSvg = rough.svg(svg);

      container.querySelectorAll<HTMLElement>(
        '[data-rough-solution-x="true"]',
      ).forEach((target) => {
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

    drawSolutions();
    const resizeObserver = new ResizeObserver(drawSolutions);
    resizeObserver.observe(container);
    window.addEventListener('resize', drawSolutions);
    void document.fonts.ready.then(drawSolutions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', drawSolutions);
    };
  });

  return solutionsRef;
}
