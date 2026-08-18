import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, type MotionValue } from 'framer-motion';
import { ArrowUpRight, FlaskConical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Mark } from '@/components/site/exploded/Marks';
import { markImage } from '@/components/site/exploded/markImage';
import { Figure } from '@/components/site/exploded/Figures';
import type { SceneData, Satellite, Tint } from '@/components/site/exploded/types';

/* ---------------------------------------------------------------------------
 * One exploded scene: label on the left, figure on the right
 * ---------------------------------------------------------------------------
 * The figure comes apart and its satellites lift out of it and take labelled
 * places around it. Everything is driven by a single `progress` value, and
 * every animated property is transform or opacity.
 *
 * Two things worth knowing before editing:
 *
 * · Satellites are laid out at their final seat and *pulled back* toward the
 *   centre. An earlier version scaled the whole ring and counter-scaled each
 *   medallion — no measurement needed — but scaling a box of live text forces
 *   a full re-rasterise every frame, and it was the single biggest frame cost
 *   on the page. Translating promoted layers is pure compositing.
 *
 * · Colours come from `--rx-*` on `.exploded-light` / `.exploded-dark` (see
 *   site-theme.css). Tailwind silently drops the `/60` alpha modifier when it
 *   is applied to an arbitrary `hsl(...)` value, so every translucent colour
 *   here carries its own alpha inside the value.
 * ------------------------------------------------------------------------- */

/** Where satellites settle, as a percentage of the stage's half-size. */
export const RING_X = 38;
export const RING_Y = 36;

const TINT_VAR: Record<Tint, string> = {
  leaf: '--rx-leaf',
  amber: '--rx-amber',
  clay: '--rx-clay',
  stone: '--rx-stone',
};

/**
 * Satellites are dealt alternately right and left of the figure and spread
 * across a ±52° arc on each side — never straight above or below it. A ring
 * that runs the full 360° puts one exactly where the lid travels, and every
 * figure here is taller than it is wide.
 */
/**
 * Overshoot, gently. A satellite that travels out on a straight ramp and stops
 * dead reads as a value being interpolated; letting it pass its seat by a few
 * per cent and settle back reads as a thing being placed.
 */
const settle = (t: number) => {
  const c = 1.02;
  const p = t - 1;
  return 1 + (c + 1) * p * p * p + c * p * p;
};

/** Standard decelerate, for anything that should not overshoot. */
const decelerate = (t: number) => 1 - (1 - t) ** 3;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export const angleFor = (index: number, count: number) => {
  const right = Math.ceil(count / 2);
  const left = count - right;
  const onRight = index % 2 === 0;
  const seat = Math.floor(index / 2);
  const seats = onRight ? right : left;
  const spread = seats === 1 ? 0 : -52 + (104 * seat) / (seats - 1);
  return (onRight ? spread : 180 - spread) * (Math.PI / 180);
};

const Medallion = React.memo(
  ({
    satellite,
    index,
    count,
    travel,
    size,
    still,
  }: {
    satellite: Satellite;
    index: number;
    count: number;
    /** 0 = inside the figure, 1 = settled in its seat. */
    travel: MotionValue<number>;
    /** Live width of the square stage, in px. */
    size: MotionValue<number>;
    still: boolean;
  }) => {
    const angle = angleFor(index, count);
    const left = 50 + RING_X * Math.cos(angle);
    const top = 50 + RING_Y * Math.sin(angle);
    /** Satellites above the figure caption upward, so nothing crosses the middle. */
    const above = Math.sin(angle) < -0.3;

    const from = 0.16 + index * 0.045;
    const eased = useTransform(travel, (v) => settle(clamp01((v - from) / 0.46)));
    const opacity = useTransform(travel, (v) => clamp01((v - from) / 0.16));
    // A few degrees of counter-rotation on the way out, unwound by the same
    // curve, so the medallion turns into place rather than sliding into it.
    const rotate = useTransform(eased, (e) => (1 - e) * -7);

    const dx = (RING_X / 100) * Math.cos(angle);
    const dy = (RING_Y / 100) * Math.sin(angle);
    const x = useTransform([eased, size] as const, ([e, s]: number[]) => -(1 - e) * dx * s);
    const y = useTransform([eased, size] as const, ([e, s]: number[]) => -(1 - e) * dy * s);

    const tint = `var(${TINT_VAR[satellite.tint]})`;
    const art = markImage(satellite.mark);

    return (
      <li
        className="absolute w-[6rem] sm:w-[7rem]"
        style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
      >
        <motion.div
          className={cn('group flex items-center', above ? 'flex-col-reverse' : 'flex-col')}
          style={still ? undefined : { x, y, rotate, opacity, willChange: 'transform' }}
        >
          {/* A lit plate carrying the artwork built by `npm run marks`. The
              inline <Mark> is only a fallback for a subject with no file. */}
          <span
            className="relative grid h-16 w-16 place-items-center rounded-full sm:h-[4.75rem] sm:w-[4.75rem]"
            style={{
              background: `radial-gradient(circle at 32% 26%, hsl(${tint} / 0.3), hsl(${tint} / 0.09) 62%, hsl(${tint} / 0.03) 100%)`,
              boxShadow: `inset 0 0 0 1px hsl(${tint} / 0.4)`,
              ['--rx-fill' as string]: `hsl(${tint} / 0.32)`,
              color: `hsl(${tint})`,
            }}
          >
            {art ? (
              <img
                src={art}
                alt=""
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="h-[3.1rem] w-[3.1rem] sm:h-[3.6rem] sm:w-[3.6rem]"
              />
            ) : (
              <Mark id={satellite.mark} className="h-8 w-8 sm:h-9 sm:w-9" />
            )}
          </span>

          <span className={cn('flex flex-col items-center', above ? 'mb-2' : 'mt-2')}>
            <span className="text-center text-[0.68rem] font-semibold uppercase leading-tight tracking-[0.1em] text-[hsl(var(--rx-ink)/0.95)] sm:text-[0.72rem]">
              {satellite.name}
            </span>
            {satellite.sub && (
              <span className="text-center font-display text-[0.63rem] italic leading-tight text-[hsl(var(--rx-ink)/0.5)]">
                {satellite.sub}
              </span>
            )}
            <span className="mt-1 hidden w-[7.5rem] text-center text-[0.63rem] leading-snug text-[hsl(var(--rx-ink)/0.42)] transition-colors duration-300 group-hover:text-[hsl(var(--rx-gold)/0.9)] sm:block">
              {satellite.note}
            </span>
          </span>
        </motion.div>
      </li>
    );
  }
);
Medallion.displayName = 'Medallion';

/** The figure and its satellites. Exported so a section can use it on its own. */
export const ExplodedFigure = ({
  scene,
  progress,
  still,
}: {
  scene: SceneData;
  /** 0 = sealed, 1 = fully open and settled. */
  progress: MotionValue<number>;
  still: boolean;
}) => {
  // The figure opens on a decelerating curve: fast off the mark, slow into the
  // last few per cent, which is how a lid actually comes off. It no longer
  // scales as it opens — an A/B against the previous build showed the scale
  // cost nothing either way, and the split is what carries the scene.
  const open = useTransform(progress, (v) => decelerate(clamp01((v - 0.1) / 0.48)));
  const glow = useTransform(progress, [0.1, 0.7], [0, 1]);
  /** Connector lines grow with the satellites; no per-item stagger needed. */
  const spokes = useTransform(progress, (v) => 0.05 + 0.95 * decelerate(clamp01((v - 0.16) / 0.64)));

  // Satellites need the stage's pixel width to turn a polar seat into a
  // translation. One observer per scene, firing only on resize.
  const stageRef = useRef<HTMLDivElement>(null);
  const size = useMotionValue(0);
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    size.set(el.clientWidth);
    const observer = new ResizeObserver(([entry]) => size.set(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, [size]);

  return (
    <div
      ref={stageRef}
      className="relative aspect-square w-[min(82vw,25rem)] lg:w-[min(46vw,34rem)]"
      style={{ ['--rx-accent' as string]: `hsl(${scene.accent})` }}
    >
      <span aria-hidden className="absolute inset-[7%] rounded-full border border-dashed border-[hsl(var(--rx-ink)/0.12)]" />

      <motion.span
        aria-hidden
        className="absolute inset-[18%] rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(${scene.accent} / 0.3), transparent 68%)`,
          ...(still ? {} : { opacity: glow }),
        }}
      />

      <motion.div
        className="absolute inset-0 grid place-items-center"
        style={still ? undefined : { willChange: 'transform' }}
      >
        <Figure id={scene.figure} open={open} className="h-[54%] w-auto text-[hsl(var(--rx-ink)/0.88)]" />
      </motion.div>

      <ul className="absolute inset-0 list-none">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <motion.g
            style={still ? undefined : { scale: spokes, transformBox: 'fill-box', transformOrigin: 'center' }}
          >
            {scene.satellites.map((satellite, i) => {
              const a = angleFor(i, scene.satellites.length);
              return (
                <line
                  key={satellite.name}
                  x1="50"
                  y1="50"
                  x2={50 + RING_X * Math.cos(a)}
                  y2={50 + RING_Y * Math.sin(a)}
                  stroke="hsl(var(--rx-ink) / 0.16)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </motion.g>
        </svg>

        {scene.satellites.map((satellite, i) => (
          <Medallion
            key={satellite.name}
            satellite={satellite}
            index={i}
            count={scene.satellites.length}
            travel={progress}
            size={size}
            still={still}
          />
        ))}
      </ul>
    </div>
  );
};

/** Label on the left, figure on the right. */
export const ExplodedScene = React.memo(
  ({
    scene,
    index,
    progress,
    still,
    fade,
  }: {
    scene: SceneData;
    /** Shown as the outlined numeral; pass -1 to hide it. */
    index: number;
    /** Local progress for this scene, 0 → 1. */
    progress: MotionValue<number>;
    still: boolean;
    /** Cross-fade of the whole scene, when several share one stage. */
    fade?: { opacity: MotionValue<number>; y: MotionValue<number>; pointerEvents: MotionValue<string> };
  }) => (
    <motion.article
      className={cn(
        'grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.78fr)] lg:gap-10',
        fade && 'absolute inset-0 content-center'
      )}
      style={fade ? { opacity: fade.opacity, y: fade.y, pointerEvents: fade.pointerEvents } : undefined}
    >
      <div className="text-center lg:order-2 lg:text-left">
        <p className="flex items-center justify-center gap-3 lg:justify-start">
          {index >= 0 && (
            <span className="rx-numeral font-display text-[2.6rem] font-extrabold leading-none">
              {String(index + 1).padStart(2, '0')}
            </span>
          )}
          <span className="h-px w-9 bg-[hsl(var(--rx-ink)/0.22)]" aria-hidden />
          <span className="text-[0.66rem] font-semibold uppercase tracking-[0.22em] text-[hsl(var(--rx-gold))]">
            {scene.kicker}
          </span>
        </p>

        <h3 className="mt-3 font-display text-[1.7rem] font-extrabold leading-[1.1] text-[hsl(var(--rx-ink))] sm:text-[2.3rem]">
          {scene.title}
        </h3>

        <p className="mt-2 font-display text-base italic text-[hsl(var(--rx-gold)/0.9)] sm:text-lg">
          {scene.tagline}
        </p>

        <p className="mx-auto mt-4 hidden max-w-xl text-sm leading-relaxed text-[hsl(var(--rx-ink)/0.66)] sm:block lg:mx-0">
          {scene.body}
        </p>

        <p className="mt-4 flex items-start justify-center gap-2 text-xs leading-relaxed text-[hsl(var(--rx-ink)/0.5)] lg:justify-start">
          <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--rx-gold)/0.8)]" aria-hidden />
          <span>
            {scene.footnote}
            {scene.footnoteSource && (
              <span className="font-display italic text-[hsl(var(--rx-ink)/0.38)]"> — {scene.footnoteSource}</span>
            )}
          </span>
        </p>

        {scene.links && scene.links.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2 lg:justify-start">
            <span className="sr-only">Related therapies:</span>
            {scene.links.map((link) => (
              <Link
                key={link.slug}
                to={`/treatments#therapy-${link.slug}`}
                className="group inline-flex items-center gap-1 rounded-full border border-[hsl(var(--rx-ink)/0.16)] px-3 py-1.5 text-[0.72rem] font-semibold text-[hsl(var(--rx-ink)/0.78)] transition-colors hover:border-[hsl(var(--rx-gold)/0.5)] hover:text-[hsl(var(--rx-gold))]"
              >
                {link.name}
                <ArrowUpRight className="h-3 w-3 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center lg:order-1">
        <ExplodedFigure scene={scene} progress={progress} still={still} />
        <p className="-mt-2 text-center text-[0.66rem] font-semibold uppercase tracking-[0.2em] text-[hsl(var(--rx-ink)/0.42)]">
          {scene.figureCaption}
        </p>
      </div>
    </motion.article>
  )
);
ExplodedScene.displayName = 'ExplodedScene';
