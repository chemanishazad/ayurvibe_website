import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { EASE } from '@/components/site/motion';

/* ---------------------------------------------------------------------------
 * Scroll helpers
 * ---------------------------------------------------------------------------
 * Deliberately small. Native scrolling is left alone — it is smoother than any
 * JS re-implementation, it respects the OS and the trackpad, and it costs
 * nothing. What remains here is a single shared scroll-progress source and a
 * couple of cheap, transform-only interaction helpers.
 * ------------------------------------------------------------------------- */

/** Smooth-scrolls to a selector, allowing for the fixed header. */
export const useScrollToSection = () => {
  const reduce = useReducedMotion();
  return useCallback(
    (selector: string, offset = -84) => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return;
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY + offset,
        behavior: reduce ? 'auto' : 'smooth',
      });
    },
    [reduce]
  );
};

/**
 * Page scroll progress, 0..1.
 *
 * One passive listener coalesced into a single rAF, feeding one spring —
 * rather than every consumer subscribing to scroll separately.
 */
export const useScrollProgress = () => {
  const progress = useSpring(0, { stiffness: 140, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    let ticking = false;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.set(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [progress]);

  return progress;
};

/** True once the page has scrolled past `offset`px. */
export const useScrolledPast = (offset: number) => {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      setPast(window.scrollY > offset);
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [offset]);

  return past;
};

/**
 * Reveals content with a clip-path wipe, once, on entry.
 *
 * The in-view trigger sits on an unclipped wrapper: a fully clipped element can
 * report as not intersecting, and the reveal would then never fire.
 */
export const ClipReveal = ({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.95,
}: {
  children: React.ReactNode;
  className?: string;
  direction?: 'up' | 'left' | 'right';
  delay?: number;
  duration?: number;
}) => {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  const from =
    direction === 'up'
      ? 'inset(100% 0% 0% 0%)'
      : direction === 'left'
        ? 'inset(0% 0% 0% 100%)'
        : 'inset(0% 100% 0% 0%)';

  return (
    <motion.div className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }}>
      <motion.div
        variants={{
          hidden: { clipPath: from, opacity: 0.4, scale: 1.04 },
          show: {
            clipPath: 'inset(0% 0% 0% 0%)',
            opacity: 1,
            scale: 1,
            transition: { duration, delay, ease: EASE },
          },
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};

/**
 * Button wrapper that leans toward the cursor. Writes motion values straight to
 * the transform, so moving the mouse never triggers a React render.
 */
export const Magnetic = ({
  children,
  className,
  strength = 12,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 20 });
  const y = useSpring(0, { stiffness: 260, damping: 20 });

  const onMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== 'mouse') return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
    y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={reduce ? undefined : { x, y }}
      className={cn('inline-flex', className)}
    >
      {children}
    </motion.div>
  );
};

/**
 * Infinite marquee.
 *
 * Pure CSS: the track renders its children twice and slides by -50% forever, so
 * it runs on the compositor with no JavaScript per frame.
 */
export const Marquee = ({
  children,
  seconds = 48,
  reverse = false,
  className,
  pauseOnHover = true,
}: {
  children: React.ReactNode;
  seconds?: number;
  reverse?: boolean;
  className?: string;
  pauseOnHover?: boolean;
}) => (
  <div className={cn('overflow-hidden', pauseOnHover && 'marquee-host', className)}>
    <div
      className={cn('marquee-row', reverse && 'marquee-reverse')}
      style={{ ['--marquee-duration' as string]: `${seconds}s` }}
    >
      <div className="flex shrink-0 items-center">{children}</div>
      <div className="flex shrink-0 items-center" aria-hidden>
        {children}
      </div>
    </div>
  </div>
);
