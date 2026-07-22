import React, { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

interface AnimatedCounterProps {
  /** Display value, e.g. "100+", "4.9★", "7 Days". The numeric prefix animates. */
  value: string;
  className?: string;
  durationMs?: number;
}

/** Counts the numeric part of `value` up from zero when scrolled into view. */
export const AnimatedCounter = ({ value, className, durationMs = 1400 }: AnimatedCounterProps) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' });
  const reduce = useReducedMotion();

  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? 1 : 0;

  const [display, setDisplay] = useState(reduce || target === null ? value : `0${suffix}`);

  useEffect(() => {
    if (!inView || reduce || target === null) return;
    let frame: number;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(`${(target * eased).toFixed(decimals)}${suffix}`);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, target, suffix, decimals, durationMs]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
};

export default AnimatedCounter;
