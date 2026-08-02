'use client';

import { useEffect, useRef } from 'react';

export function CountUp({ value }: { value: number }) {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const counter = counterRef.current;
    if (!counter || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const duration = 900;
    const start = performance.now();
    let frame = 0;
    const animate = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      counter.textContent = String(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    counter.textContent = '0';
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="count-up" ref={counterRef}>{value}</span>;
}
