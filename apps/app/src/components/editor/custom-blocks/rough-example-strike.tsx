"use client";

import { useLayoutEffect, useRef } from 'react';
import rough from 'roughjs';

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function RoughExampleStrike({ seed }: { seed: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const target = svg?.parentElement;
    if (!svg || !target) return;

    const draw = () => {
      const { width, height } = target.getBoundingClientRect();
      if (!width || !height) return;

      svg.replaceChildren();
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      const line = rough.svg(svg).line(
        3,
        height - 3,
        width - 3,
        3,
        {
          bowing: 1.4,
          disableMultiStroke: true,
          roughness: 1.15,
          seed: stableHash(seed) || 1,
          stroke: 'var(--custom-block-example-solution-color)',
          strokeWidth: 1.5,
        },
      );
      svg.appendChild(line);
    };

    draw();
    const resizeObserver = new ResizeObserver(draw);
    resizeObserver.observe(target);
    void document.fonts.ready.then(draw);
    return () => resizeObserver.disconnect();
  }, [seed]);

  return (
    <svg
      aria-hidden="true"
      className="custom-block__rough-example-strike"
      preserveAspectRatio="none"
      ref={svgRef}
    />
  );
}
