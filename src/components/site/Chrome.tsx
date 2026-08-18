import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { EASE } from '@/components/site/motion';
import { useScrollProgress, useScrolledPast, useScrollToSection } from '@/components/site/scroll';
import { logoPath } from '@/components/Logo';

/* ===========================================================================
 * SCROLL RAIL
 * ========================================================================= */

interface RailSection {
  id: string;
  label: string;
}

/**
 * Right-hand rail: a progress line plus one dot per section. Dots reflect the
 * section currently in view and jump to it through the smooth-scroll engine.
 */
export const ScrollRail = ({ sections }: { sections: RailSection[] }) => {
  const progress = useScrollProgress();
  const reduce = useReducedMotion();
  const scrollTo = useScrollToSection();
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const visible = useScrolledPast(400);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visibleEntry?.target.id) setActiveId(visibleEntry.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5, 1] }
    );
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <motion.aside
      aria-label="Section navigation"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 16 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex"
    >
      <span className="relative h-24 w-[2px] overflow-hidden rounded-full bg-border">
        <motion.span
          className="absolute inset-x-0 top-0 origin-top bg-primary"
          style={{ height: '100%', scaleY: reduce ? 1 : progress }}
        />
      </span>

      <ul className="flex flex-col items-center gap-3">
        {sections.map((section) => {
          const active = activeId === section.id;
          return (
            <li key={section.id}>
              <button
                type="button"
                onClick={() => scrollTo(`#${section.id}`)}
                aria-current={active ? 'true' : undefined}
                className="group relative flex items-center"
              >
                <span
                  className={cn(
                    'block rounded-full transition-all duration-300',
                    active ? 'h-2.5 w-2.5 bg-primary' : 'h-1.5 w-1.5 bg-border group-hover:bg-primary/60'
                  )}
                />
                <span className="pointer-events-none absolute right-6 whitespace-nowrap rounded-full bg-foreground px-2.5 py-1 text-[0.7rem] font-medium text-background opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {section.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.aside>
  );
};

/* ===========================================================================
 * ROUTE TRANSITION
 * ========================================================================= */

/**
 * Wipes a panel across the viewport whenever the public route changes, then
 * scrolls the new route to the top. Deep-link scrolling in SectionPage runs
 * after the wipe clears.
 */
export const RouteTransition = () => {
  const location = useLocation();
  const reduce = useReducedMotion();
  const first = useRef(true);
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setKey(location.pathname);
    const timer = window.setTimeout(() => setKey(null), 900);
    return () => window.clearTimeout(timer);
  }, [location.pathname]);

  if (reduce) return null;

  return (
    <AnimatePresence>
      {key && (
        <motion.div
          key={key}
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-foreground"
          initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          exit={{ clipPath: 'inset(100% 0% 0% 0%)' }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <img src={logoPath} alt="" width={40} height={60} className="h-10 w-auto opacity-90" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
