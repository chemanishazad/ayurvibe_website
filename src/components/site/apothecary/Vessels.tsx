import React from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import type { VesselId } from '@/data/remedies';
import { PaintDefs, paintStyle, usePaint } from '@/components/site/exploded/paint';

/* ---------------------------------------------------------------------------
 * The vessels
 * ---------------------------------------------------------------------------
 * Six containers the hospital's pharmacy actually uses — an oil bottle, a
 * capsule, a poultice, a dhara pot, a pressed tablet and a lehyam jar — each
 * drawn as SVG in a 200×240 box and each built in two pieces: a `lid` that
 * comes away and a `body` that stays. A single `open` value (0 → 1, driven by
 * scroll) moves both.
 *
 * Two constraints the drawings have to respect:
 *   · an <svg> clips at its viewBox, so every lid needs its full travel of
 *     headroom above it — bodies live below y≈60 and nothing lifts past y≈12.
 *   · everything animates through CSS transforms on <g> elements, so opening a
 *     vessel is compositor work: no path is regenerated, no attribute is
 *     re-parsed, nothing re-lays-out.
 * ------------------------------------------------------------------------- */

const INK = {
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Translucent shell of the container. */
const GLASS = 'var(--rx-glass)';
/** What the container holds. */
const FLUID = 'var(--rx-fluid)';

const ORIGIN: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };
const TOP: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'top' };

export interface VesselProps {
  /** 0 = sealed, 1 = fully open. */
  open: MotionValue<number>;
}

/* -- 1. Oil bottle -------------------------------------------------------- */
const Vial = ({ open }: VesselProps) => {
  const capY = useTransform(open, [0, 1], [0, -50]);
  const capX = useTransform(open, [0, 1], [0, -18]);
  const capRotate = useTransform(open, [0, 1], [0, -22]);
  const pour = useTransform(open, [0.3, 0.75], [0, 1]);

  return (
    <>
      <motion.g style={{ x: capX, y: capY, rotate: capRotate, ...ORIGIN }}>
        <path d="M84 58h32a5 5 0 0 1 5 5v21H79V63a5 5 0 0 1 5-5Z" {...INK} fill={FLUID} />
        <path d="M91 64v15M100 64v15M109 64v15" {...INK} strokeOpacity={0.4} />
        <path d="M77 82h46v13H77z" {...INK} fill={GLASS} />
      </motion.g>

      <g>
        <path
          d="M88 96v10c0 20-30 20-30 48v42c0 14 8 22 22 22h40c14 0 22-8 22-22v-42c0-28-30-28-30-48V96Z"
          fill={GLASS}
          {...INK}
        />
        <path d="M84 96h32" {...INK} />
        <path
          d="M59 162c10-6 18-6 26-1s16 6 24 1 18-5 32 1v33c0 14-8 22-22 22H81c-14 0-22-8-22-22Z"
          fill={FLUID}
          stroke="none"
        />
        <path d="M59 162c10-6 18-6 26-1s16 6 24 1 18-5 32 1" {...INK} strokeOpacity={0.55} />
        <path d="M74 182c0 12 2 21 6 27" {...INK} strokeOpacity={0.4} />
      </g>

      <motion.g style={{ opacity: pour, ...TOP }}>
        <path d="M100 96c0 12-5 18-5 30" {...INK} strokeOpacity={0.45} strokeDasharray="3 8" />
      </motion.g>
    </>
  );
};

/* -- 2. Capsule ----------------------------------------------------------- */
const Capsule = ({ open }: VesselProps) => {
  const capY = useTransform(open, [0, 1], [0, -42]);
  const capRotate = useTransform(open, [0, 1], [0, -8]);
  const bodyY = useTransform(open, [0, 1], [0, 14]);
  const bodyRotate = useTransform(open, [0, 1], [0, 5]);
  const grains = useTransform(open, [0.25, 0.7], [0, 1]);

  return (
    <>
      <motion.g style={{ y: capY, rotate: capRotate, ...ORIGIN }}>
        <path d="M69 124V84c0-17 14-31 31-31s31 14 31 31v40Z" {...INK} fill={FLUID} />
        <path d="M83 80c0-8 5-14 12-16" {...INK} strokeOpacity={0.45} />
      </motion.g>

      <motion.g style={{ opacity: grains }}>
        <circle cx="87" cy="128" r="4.2" fill={FLUID} stroke="none" />
        <circle cx="107" cy="136" r="5.2" fill={FLUID} stroke="none" />
        <circle cx="96" cy="149" r="3.4" fill={FLUID} stroke="none" />
        <circle cx="116" cy="124" r="3" fill={FLUID} stroke="none" />
      </motion.g>

      <motion.g style={{ y: bodyY, rotate: bodyRotate, ...ORIGIN }}>
        <path d="M74 114v60c0 14 12 26 26 26s26-12 26-26v-60Z" {...INK} fill={GLASS} />
        <path d="M87 170c0 8 3 13 9 16" {...INK} strokeOpacity={0.4} />
      </motion.g>
    </>
  );
};

/* -- 3. Poultice ---------------------------------------------------------- */
const Potli = ({ open }: VesselProps) => {
  const leftRotate = useTransform(open, [0, 1], [0, -52]);
  const rightRotate = useTransform(open, [0, 1], [0, 52]);
  const knotY = useTransform(open, [0, 1], [0, -16]);
  const ball = useTransform(open, [0.15, 0.8], [0.74, 1]);
  const loop = useTransform(open, [0, 1], [0, -22]);

  return (
    <>
      <motion.g style={{ y: loop, ...ORIGIN }}>
        <path d="M100 78c0-20 8-30 22-30 10 0 16 6 16 14" {...INK} strokeOpacity={0.5} />
      </motion.g>

      <motion.g style={{ rotate: leftRotate, transformBox: 'fill-box', transformOrigin: '100% 0%' }}>
        <path d="M96 88c-18 1-32 8-42 22 12 8 26 9 42 3Z" {...INK} fill={GLASS} />
      </motion.g>
      <motion.g style={{ rotate: rightRotate, transformBox: 'fill-box', transformOrigin: '0% 0%' }}>
        <path d="M104 88c18 1 32 8 42 22-12 8-26 9-42 3Z" {...INK} fill={GLASS} />
      </motion.g>
      <motion.g style={{ y: knotY, ...ORIGIN }}>
        <path d="M88 82h24l-5 16H93Z" {...INK} fill={GLASS} />
        <path d="M92 90h16" {...INK} strokeOpacity={0.5} />
      </motion.g>

      <motion.g style={{ scale: ball, ...ORIGIN }}>
        <path d="M100 100c26 0 46 20 46 46s-20 46-46 46-46-20-46-46 20-46 46-46Z" {...INK} fill={FLUID} />
        <path d="M72 132c8-8 17-10 26-6M124 162c6-6 8-14 6-22M90 174c9 4 18 3 26-3" {...INK} strokeOpacity={0.4} />
      </motion.g>
    </>
  );
};

/* -- 4. Dhara vessel ------------------------------------------------------ */
/**
 * A kindi — the spouted brass pot the dhara oil is poured from. Drawn with a
 * side spout rather than a hanging bowl and a wick: a round bowl narrowing to a
 * centred stream reads, unavoidably, as a wine glass.
 */
const Dhara = ({ open }: VesselProps) => {
  const lidY = useTransform(open, [0, 1], [0, -40]);
  const lidX = useTransform(open, [0, 1], [0, -26]);
  const lidRotate = useTransform(open, [0, 1], [0, -18]);
  const stream = useTransform(open, [0.25, 0.85], [0, 1]);
  const drops = useTransform(open, [0.7, 1], [0, 1]);

  return (
    <>
      <motion.g style={{ x: lidX, y: lidY, rotate: lidRotate, ...ORIGIN }}>
        <path d="M96 50c0-5 2-7 5-7s5 2 5 7" {...INK} />
        <path d="M76 66c0-10 11-16 25-16s25 6 25 16Z" {...INK} fill={FLUID} />
      </motion.g>

      <g>
        <path d="M72 68h58v12H72z" {...INK} fill={GLASS} />
        <path d="M82 80h38v12H82z" {...INK} fill={GLASS} />
        <path d="M101 92c-31 0-55 19-55 45s24 43 55 43 55-17 55-43-24-45-55-45Z" {...INK} fill={GLASS} />
        <path
          d="M47 130c14 8 33 10 55 5s37-1 54 5c-4 25-27 42-55 42s-50-17-54-42Z"
          fill={FLUID}
          stroke="none"
        />
        <path d="M47 130c14 8 33 10 55 5s37-1 54 6" {...INK} strokeOpacity={0.5} />
        <path d="M64 146c2 14 8 25 17 32" {...INK} strokeOpacity={0.3} />
      </g>

      {/* spout: a thick outline with the oil drawn inside it */}
      <path
        d="M150 112c14 2 21 11 21 24v14"
        stroke="currentColor"
        strokeWidth={11}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M150 112c14 2 21 11 21 24v14"
        stroke="var(--rx-bg-solid, #0a1a12)"
        strokeWidth={6.5}
        strokeLinecap="round"
        fill="none"
      />

      <motion.g style={{ scaleY: stream, ...TOP }}>
        <path d="M171 150v58" stroke={FLUID} strokeWidth={5} strokeLinecap="round" fill="none" />
      </motion.g>

      <motion.g style={{ opacity: drops }}>
        <ellipse cx="171" cy="216" rx="4" ry="5" fill={FLUID} stroke="none" />
        <ellipse cx="171" cy="230" rx="3" ry="4" fill={FLUID} stroke="none" />
      </motion.g>
    </>
  );
};

/* -- 5. Pressed tablet ---------------------------------------------------- */
const Vati = ({ open }: VesselProps) => {
  const leftX = useTransform(open, [0, 1], [0, -38]);
  const leftRotate = useTransform(open, [0, 1], [0, -13]);
  const rightX = useTransform(open, [0, 1], [0, 38]);
  const rightRotate = useTransform(open, [0, 1], [0, 13]);
  const core = useTransform(open, [0.3, 0.8], [0, 1]);
  const coreScale = useTransform(open, [0.3, 1], [0.45, 1]);

  return (
    <>
      <motion.g style={{ opacity: core, scale: coreScale, ...ORIGIN }}>
        <circle cx="100" cy="142" r="28" fill={FLUID} stroke="none" />
        <circle cx="100" cy="142" r="40" {...INK} strokeOpacity={0.28} strokeDasharray="2 9" />
      </motion.g>

      <motion.g style={{ x: leftX, rotate: leftRotate, transformBox: 'fill-box', transformOrigin: '100% 50%' }}>
        <path d="M98 88a54 54 0 0 0 0 108Z" {...INK} fill={GLASS} />
        <path d="M80 110a40 40 0 0 0-7 32" {...INK} strokeOpacity={0.4} />
      </motion.g>

      <motion.g style={{ x: rightX, rotate: rightRotate, transformBox: 'fill-box', transformOrigin: '0% 50%' }}>
        <path d="M102 88a54 54 0 0 1 0 108Z" {...INK} fill={GLASS} />
        <path d="M120 110a40 40 0 0 1 7 32" {...INK} strokeOpacity={0.4} />
      </motion.g>
    </>
  );
};

/* -- 6. Lehyam jar -------------------------------------------------------- */
const Jar = ({ open }: VesselProps) => {
  const lidY = useTransform(open, [0, 1], [0, -46]);
  const lidRotate = useTransform(open, [0, 1], [0, -10]);
  const lidX = useTransform(open, [0, 1], [0, -12]);
  const spoonY = useTransform(open, [0.35, 1], [18, -6]);
  const spoon = useTransform(open, [0.35, 0.75], [0, 1]);

  return (
    <>
      <motion.g style={{ x: lidX, y: lidY, rotate: lidRotate, ...ORIGIN }}>
        <path d="M93 62c0-6 3-9 7-9s7 3 7 9" {...INK} />
        <path d="M58 90c0-16 19-26 42-26s42 10 42 26Z" {...INK} fill={GLASS} />
        <path d="M54 90h92v13H54z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ y: spoonY, opacity: spoon, ...ORIGIN }}>
        <path d="M130 84c8-10 16-12 22-6-2 8-8 13-16 15Z" {...INK} fill={GLASS} />
        <path d="M128 92 112 112" {...INK} strokeOpacity={0.7} />
      </motion.g>

      <g>
        <path d="M60 108h80v78c0 15-10 24-30 24H90c-20 0-30-9-30-24Z" {...INK} fill={GLASS} />
        <path
          d="M64 140c10-6 20-6 30 0s21 6 31-1c4 20 2 37-5 50-6 10-12 15-30 15s-24-5-30-15c-7-13-9-30-6-49Z"
          fill={FLUID}
          stroke="none"
        />
        <path d="M64 140c10-6 20-6 30 0s21 6 31-1" {...INK} strokeOpacity={0.5} />
        <path d="M76 166c2 15 6 26 12 32" {...INK} strokeOpacity={0.32} />
      </g>
    </>
  );
};

const VESSELS: Record<VesselId, (props: VesselProps) => JSX.Element> = {
  vial: Vial,
  capsule: Capsule,
  potli: Potli,
  dhara: Dhara,
  vati: Vati,
  jar: Jar,
};

/** Renders one vessel, opened by `open`. */
export const Vessel = ({ id, open, className }: { id: VesselId; open: MotionValue<number>; className?: string }) => {
  const Draw = VESSELS[id];
  const uid = usePaint();
  return (
    <svg
      viewBox="0 0 200 240"
      className={className}
      fill="none"
      style={paintStyle(uid)}
      aria-hidden
      focusable="false"
    >
      <PaintDefs uid={uid} />
      <g stroke={`url(#${uid}-line)`}>
        <Draw open={open} />
      </g>
    </svg>
  );
};

export default Vessel;
