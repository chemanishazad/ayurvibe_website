import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface RevealProps {
  children: React.ReactNode;
  /** Entrance direction. Default 'up'. */
  direction?: Direction;
  /** Delay before the animation starts (seconds). */
  delay?: number;
  /** Animation duration (seconds). Default 0.6. */
  duration?: number;
  /** Travel distance in px for directional reveals. Default 28. */
  distance?: number;
  className?: string;
  /** Render as a different element (e.g. 'li', 'section'). Default 'div'. */
  as?: keyof typeof motion;
  /** Re-trigger every time it scrolls into view (default: once). */
  repeat?: boolean;
}

const offset = (direction: Direction, d: number) => {
  switch (direction) {
    case 'up': return { y: d };
    case 'down': return { y: -d };
    case 'left': return { x: d };
    case 'right': return { x: -d };
    default: return {};
  }
};

/**
 * Scroll-triggered entrance wrapper built on framer-motion.
 * Respects prefers-reduced-motion (renders content with no transform/opacity shift).
 * Use <Reveal> around any block, or <StaggerGroup>/<StaggerItem> for lists.
 */
export const Reveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  distance = 28,
  className,
  as = 'div',
  repeat = false,
}: RevealProps) => {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;

  if (reduce) {
    const Tag = as as React.ElementType;
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, ...offset(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: !repeat, amount: 0.2, margin: '0px 0px -10% 0px' }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
};

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const staggerChild: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

/** Wrap a list; direct <StaggerItem> children animate in sequence. */
export const StaggerGroup = ({
  children,
  className,
  amount = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  amount?: number;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
};

export default Reveal;
