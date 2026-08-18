import React, { useRef, useState } from 'react';
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { ExplodedScene } from '@/components/site/exploded/Scene';
import type { SceneData, Tone } from '@/components/site/exploded/types';

/* ---------------------------------------------------------------------------
 * Running exploded scenes
 * ---------------------------------------------------------------------------
 * Two shapes:
 *
 *   ExplodedTrack — several scenes share one pinned stage and cross-fade
 *   through it as you scroll. Used where the section *is* a sequence: the six
 *   preparations, the three doshas, the stages of a visit.
 *
 *   ExplodedPanel — one scene in normal document flow, opening as it rises
 *   through the viewport. Used where a section only has one thing to show and
 *   pinning would cost a screen of scroll for nothing.
 *
 * Neither holds React state on scroll except the ledger index, which changes
 * once per scene. When that state lived on the track, every crossing
 * re-rendered every scene and every medallion inside them — a 50ms long task,
 * once per preparation.
 * ------------------------------------------------------------------------- */

const Ledger = ({ progress, count }: { progress: MotionValue<number>; count: number }) => {
  const [current, setCurrent] = useState(0);

  useMotionValueEvent(progress, 'change', (v) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(v * count + 0.05)));
    setCurrent((prev) => (prev === next ? prev : next));
  });

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden sm:block">
      <ol className="shell flex items-center justify-center gap-3 sm:justify-start">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-hidden
              className={cn(
                'block h-px transition-all duration-500',
                current === i ? 'w-9 bg-[hsl(var(--rx-gold))]' : 'w-4 bg-[hsl(var(--rx-ink)/0.22)]'
              )}
            />
            <span
              className={cn(
                'text-[0.6rem] font-semibold tabular-nums tracking-[0.16em] transition-colors duration-500',
                current === i ? 'text-[hsl(var(--rx-gold))]' : 'text-[hsl(var(--rx-ink)/0.28)]'
              )}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
};

/** One scene inside a pinned track: derives its own local progress and fade. */
const TrackScene = ({
  scene,
  index,
  total,
  progress,
}: {
  scene: SceneData;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) => {
  // Where this scene sits relative to the playhead: <0 not yet, >1 gone past.
  const rel = useTransform(progress, (p) => p * total - index);
  const local = useTransform(rel, (v) => Math.min(1, Math.max(0, v)));

  // The first scene starts visible, the last one stays.
  const fadeIn = index === 0 ? [-9, -8.98] : [-0.09, 0];
  const fadeOut = index === total - 1 ? [8.98, 9] : [0.91, 1];
  const opacity = useTransform(rel, [...fadeIn, ...fadeOut], [0, 1, 1, 0]);
  const y = useTransform(rel, [...fadeIn, ...fadeOut], [22, 0, 0, -22]);
  // Only the scene on stage takes a click — derived from the same scroll value
  // rather than from React state.
  const pointerEvents = useTransform(opacity, (v) => (v > 0.85 ? 'auto' : 'none'));

  return (
    <ExplodedScene
      scene={scene}
      index={index}
      progress={local}
      still={false}
      fade={{ opacity, y, pointerEvents }}
    />
  );
};

export const ExplodedTrack = ({
  scenes,
  /** Scroll distance each scene is given, in viewport heights. */
  stepVh = 80,
}: {
  scenes: SceneData[];
  stepVh?: number;
}) => {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  // Read raw, with no spring in between. On a pinned scene the scroll position
  // *is* the playhead: any smoothing means the figure keeps opening after you
  // have stopped scrolling. An earlier stiffness 280 / damping 44 spring took
  // over two seconds to catch up after a flick.
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  const idle = useMotionValue(1);
  const barScale = useTransform(scrollYProgress, [0, 1], [0.02, 1]);

  if (reduce) {
    return (
      <div className="shell relative space-y-24 py-20">
        {scenes.map((scene, i) => (
          <ExplodedScene key={scene.slug} scene={scene} index={i} progress={idle} still />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={trackRef}
      className="relative"
      style={{ height: `calc(${scenes.length} * ${stepVh}svh + 100svh)` }}
    >
      <div className="sticky top-0 flex h-[100svh] items-center [overflow:clip] pb-20 pt-16 sm:pb-10">
        {/* Ambient wash, scoped to the pinned frame. On the section itself this
            is a full-height gradient layer that Chrome re-rasterises as you
            scroll; here it is one viewport, painted once. */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[image:var(--rx-wash)]" />

        <div className="shell relative w-full">
          <div className="relative h-[min(74svh,42rem)]">
            {scenes.map((scene, i) => (
              <TrackScene
                key={scene.slug}
                scene={scene}
                index={i}
                total={scenes.length}
                progress={scrollYProgress}
              />
            ))}
          </div>
        </div>

        <Ledger progress={scrollYProgress} count={scenes.length} />

        <motion.span
          aria-hidden
          className="absolute inset-x-0 bottom-[4.25rem] h-px origin-left bg-[hsl(var(--rx-gold)/0.55)] sm:bottom-0"
          style={{ scaleX: barScale }}
        />
      </div>
    </div>
  );
};

/** A single scene in normal flow, opening as it rises through the viewport. */
export const ExplodedPanel = ({ scene, index = -1 }: { scene: SceneData; index?: number }) => {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'center 0.42'] });
  const idle = useMotionValue(1);

  return (
    <div ref={ref} className="shell relative py-14 sm:py-20">
      <span aria-hidden className="pointer-events-none absolute inset-0 bg-[image:var(--rx-wash)]" />
      <div className="relative">
        <ExplodedScene
          scene={scene}
          index={index}
          progress={reduce ? idle : scrollYProgress}
          still={!!reduce}
        />
      </div>
    </div>
  );
};

/** Section shell: tone, heading, the scenes, and a closing line. */
export const ExplodedSection = ({
  id,
  tone,
  labelledBy,
  eyebrow,
  icon: Icon,
  heading,
  highlight,
  intro,
  outro,
  children,
}: {
  id: string;
  tone: Tone;
  labelledBy: string;
  eyebrow: string;
  icon: React.ComponentType<{ className?: string }>;
  heading: string;
  highlight?: string;
  intro: string;
  outro?: string;
  children: React.ReactNode;
}) => (
  <section
    id={id}
    aria-labelledby={labelledBy}
    className={cn(
      'exploded relative [overflow:clip] bg-[hsl(var(--rx-bg))] text-[hsl(var(--rx-ink))]',
      tone === 'dark' ? 'exploded-dark' : 'exploded-light'
    )}
  >
    <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-[hsl(var(--rx-gold)/0.35)]" />

    <div className="shell relative pt-20 sm:pt-28">
      <div className="mx-auto max-w-3xl text-center">
        <span className="eyebrow !border-[hsl(var(--rx-gold)/0.25)] !bg-[hsl(var(--rx-gold)/0.1)] !text-[hsl(var(--rx-gold))]">
          <Icon className="h-3.5 w-3.5" />
          {eyebrow}
        </span>
        <h2
          id={labelledBy}
          className="mt-5 font-display text-3xl font-extrabold leading-[1.12] sm:text-4xl lg:text-[2.7rem]"
        >
          {heading}
          {highlight && <> <span className="text-[hsl(var(--rx-gold))]">{highlight}</span></>}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-[hsl(var(--rx-ink)/0.66)] sm:text-lg">{intro}</p>
      </div>
    </div>

    {children}

    {outro && (
      <div className="shell relative pb-20 pt-8 text-center sm:pb-28">
        <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[hsl(var(--rx-ink)/0.5)]">{outro}</p>
      </div>
    )}
  </section>
);
