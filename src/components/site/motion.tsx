import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/* ---------------------------------------------------------------------------
 * Motion system
 * ---------------------------------------------------------------------------
 * Everything here animates **transform and opacity only**, one shot, on entry.
 * Nothing subscribes to scroll frame-by-frame and nothing writes React state
 * from a pointer or scroll event — those are what make a page feel heavy. The
 * result is that all animation runs on the compositor and the main thread stays
 * free for scrolling.
 * ------------------------------------------------------------------------- */

export const EASE = [0.22, 1, 0.36, 1] as const;

/** Adds `site` to <html> while a public page is mounted (see site-theme.css). */
export const useSiteTheme = () => {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('site');
    return () => root.classList.remove('site');
  }, []);
};

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const offsetFor = (direction: Direction, distance: number) => {
  switch (direction) {
    case 'up': return { y: distance };
    case 'down': return { y: -distance };
    case 'left': return { x: distance };
    case 'right': return { x: -distance };
    default: return {};
  }
};

interface RevealProps {
  children: React.ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  className?: string;
  as?: 'div' | 'span' | 'section' | 'li' | 'header' | 'article';
  amount?: number;
}

/** Scroll-triggered entrance. Runs once, then the element is left alone. */
export const Reveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 20,
  className,
  as = 'div',
  amount = 0.2,
}: RevealProps) => {
  const reduce = useReducedMotion();
  const Tag = as as React.ElementType;
  const MotionTag = motion[as] as typeof motion.div;

  if (reduce) return <Tag className={className}>{children}</Tag>;

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offsetFor(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount, margin: '0px 0px -6% 0px' }}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </MotionTag>
  );
};

const groupVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } },
};

export const StaggerGroup = ({
  children,
  className,
  amount = 0.12,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
  as?: 'div' | 'ul' | 'ol';
}) => {
  const reduce = useReducedMotion();
  const Tag = as as React.ElementType;
  const MotionTag = motion[as] as typeof motion.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <MotionTag
      className={className}
      variants={groupVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  );
};

export const StaggerItem = ({
  children,
  className,
  as = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'li' | 'article';
}) => {
  const reduce = useReducedMotion();
  const Tag = as as React.ElementType;
  const MotionTag = motion[as] as typeof motion.div;
  if (reduce) return <Tag className={className}>{children}</Tag>;
  return (
    <MotionTag className={className} variants={itemVariants}>
      {children}
    </MotionTag>
  );
};

/**
 * Headline that rises word by word. Renders one clean text run — screen
 * readers and crawlers never see the per-word spans as separate content.
 */
export const AnimatedHeadline = ({
  text,
  className,
  as: Tag = 'h2',
  highlight,
  highlightClassName = 'text-primary',
  delay = 0,
  id,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
  highlight?: string;
  highlightClassName?: string;
  delay?: number;
  id?: string;
}) => {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  const highlightWords = highlight ? highlight.split(' ') : [];

  if (reduce) {
    return (
      <Tag className={className} id={id}>
        {text}
        {highlight ? <> <span className={highlightClassName}>{highlight}</span></> : null}
      </Tag>
    );
  }

  const word = {
    hidden: { opacity: 0, y: '0.35em' },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };

  return (
    <Tag className={className} id={id}>
      <motion.span
        className="inline"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.35 }}
        variants={{ show: { transition: { staggerChildren: 0.035, delayChildren: delay } } }}
      >
        {words.map((w, i) => (
          <motion.span key={`${w}-${i}`} className="inline-block" variants={word}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
        {highlightWords.map((w, i) => (
          <motion.span key={`hl-${w}-${i}`} className={cn('inline-block', highlightClassName)} variants={word}>
            {i === 0 ? ' ' : ''}
            {w}
            {i < highlightWords.length - 1 ? ' ' : ''}
          </motion.span>
        ))}
      </motion.span>
    </Tag>
  );
};

/** Counts up once when scrolled into view. */
export const CountUp = ({
  value,
  className,
  durationMs = 1400,
}: {
  value: string;
  className?: string;
  durationMs?: number;
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();

  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : null;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? 1 : 0;

  const [display, setDisplay] = useState(reduce || target === null ? value : `0${suffix}`);

  useEffect(() => {
    if (!inView || reduce || target === null) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(`${(target * eased).toFixed(decimals)}${suffix}`);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, target, suffix, decimals, durationMs]);

  return (
    <span ref={ref} className={cn('tabular', className)}>
      {display}
    </span>
  );
};

export default Reveal;
