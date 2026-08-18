import React from 'react';
import { motion, useTransform, type MotionValue } from 'framer-motion';
import { Vessel } from '@/components/site/apothecary/Vessels';
import { PaintDefs, paintStyle, usePaint } from '@/components/site/exploded/paint';
import type { FigureId } from '@/components/site/exploded/types';

/* ---------------------------------------------------------------------------
 * Openable figures
 * ---------------------------------------------------------------------------
 * The centrepiece of an exploded scene. Same contract as the dispensary
 * vessels: a 200×240 box, a part that comes away and a part that stays, driven
 * by one `open` value from 0 to 1.
 *
 * Two rules the drawings have to respect:
 *   · an <svg> clips at its viewBox, so anything that lifts needs its full
 *     travel of headroom — bodies sit below y≈60 and nothing rises past y≈12.
 *   · `fill` comes from the <svg> (see Vessel), never from the stroke spread,
 *     so attribute order can never knock a fill out.
 * ------------------------------------------------------------------------- */

const INK = {
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const GLASS = 'var(--rx-glass)';
const FLUID = 'var(--rx-fluid)';

const ORIGIN: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };
const BOTTOM: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'bottom' };
const LEFT: React.CSSProperties = { transformBox: 'fill-box', transformOrigin: 'left' };

interface P {
  open: MotionValue<number>;
}

/* -- Lotus: five petals fan open around the seed pod ----------------------- */
const PETALS = [-64, -32, 0, 32, 64];

const Lotus = ({ open }: P) => {
  const pod = useTransform(open, [0.35, 0.85], [0, 1]);
  const podScale = useTransform(open, [0.35, 1], [0.4, 1]);
  return (
    <>
      {PETALS.map((base, i) => {
        // Outer petals travel furthest, so the fan opens rather than shears.
        const spread = base * 1.75;
        return <Petal key={base} open={open} from={base} to={spread} dim={i === 2 ? 1 : 0.94} />;
      })}

      <motion.g style={{ opacity: pod, scale: podScale, ...ORIGIN }}>
        <ellipse cx="100" cy="168" rx="30" ry="17" {...INK} fill={FLUID} />
        <path d="M84 165h2M94 162h2M104 162h2M114 165h2M89 172h2M99 170h2M109 172h2" {...INK} strokeOpacity={0.5} />
      </motion.g>

      <path d="M100 186v34M100 206c-14 0-24-8-28-22 15-2 25 5 28 22" {...INK} strokeOpacity={0.45} fill={GLASS} />
    </>
  );
};

const Petal = ({ open, from, to, dim }: P & { from: number; to: number; dim: number }) => {
  const rotate = useTransform(open, [0, 1], [from, to]);
  return (
    <motion.g style={{ rotate, ...BOTTOM }}>
      <path
        d="M100 176C64 148 66 104 100 68c34 36 36 80 0 108Z"
        {...INK}
        fill={dim === 1 ? FLUID : GLASS}
      />
    </motion.g>
  );
};

/* -- Vata: a pot the air escapes from -------------------------------------- */
const WindPot = ({ open }: P) => {
  const lidY = useTransform(open, [0, 1], [0, -40]);
  const lidRotate = useTransform(open, [0, 1], [0, -14]);
  const gust = useTransform(open, [0.3, 0.8], [0, 1]);
  const gustY = useTransform(open, [0.3, 1], [24, 0]);
  return (
    <>
      <motion.g style={{ y: lidY, rotate: lidRotate, ...ORIGIN }}>
        <path d="M96 62c0-6 2-9 4-9s4 3 4 9" {...INK} />
        <path d="M62 84c0-14 17-22 38-22s38 8 38 22Z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ opacity: gust, y: gustY }}>
        <path d="M70 100c14-8 26-8 36 2M78 116c16-9 30-8 42 3M84 132c14-7 26-6 36 4" {...INK} stroke={FLUID} strokeOpacity={0.9} />
      </motion.g>

      <g>
        <path d="M58 88h84v10H58z" {...INK} fill={GLASS} />
        <path d="M66 98c-8 20-10 40-4 58 6 17 20 26 38 26s32-9 38-26c6-18 4-38-4-58Z" {...INK} fill={GLASS} />
        <path d="M78 128c8 6 16 7 24 3s16-3 24 2" {...INK} strokeOpacity={0.35} />
        <path d="M82 152c8 6 16 7 24 3s14-2 22 2" {...INK} strokeOpacity={0.25} />
      </g>
    </>
  );
};

/* -- Pitta: a lamp under a cover ------------------------------------------- */
const Lamp = ({ open }: P) => {
  const coverY = useTransform(open, [0, 1], [0, -46]);
  const coverX = useTransform(open, [0, 1], [0, 20]);
  const coverRotate = useTransform(open, [0, 1], [0, 16]);
  const flame = useTransform(open, [0.3, 0.8], [0, 1]);
  const flameScale = useTransform(open, [0.3, 1], [0.3, 1]);
  return (
    <>
      <motion.g style={{ x: coverX, y: coverY, rotate: coverRotate, ...ORIGIN }}>
        <path d="M62 128c0-24 17-44 38-44s38 20 38 44Z" {...INK} fill={GLASS} />
        <path d="M100 84V70" {...INK} strokeOpacity={0.5} />
      </motion.g>

      <motion.g style={{ opacity: flame, scale: flameScale, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
        <path d="M100 106c12 14 18 24 18 32 0 11-8 18-18 18s-18-7-18-18c0-8 6-18 18-32Z" {...INK} fill={FLUID} />
        <path d="M100 130c5 7 7 12 7 16 0 5-3 8-7 8s-7-3-7-8c0-4 2-9 7-16Z" fill={GLASS} stroke="none" />
      </motion.g>

      <g>
        <path d="M52 162h96c-4 22-22 34-48 34s-44-12-48-34Z" {...INK} fill={GLASS} />
        <path d="M52 162c0-8 21-14 48-14s48 6 48 14" {...INK} />
        <path d="M148 162c10-4 16-9 18-15-8-3-15-1-22 6" {...INK} fill={GLASS} />
        <path d="M74 176c10 5 20 6 30 3" {...INK} strokeOpacity={0.35} />
      </g>
    </>
  );
};

/* -- Kapha: a stone jar with something growing in it ----------------------- */
const EarthJar = ({ open }: P) => {
  const lidY = useTransform(open, [0, 1], [0, -44]);
  const lidRotate = useTransform(open, [0, 1], [0, 9]);
  const shoot = useTransform(open, [0.35, 0.85], [0, 1]);
  const shootScale = useTransform(open, [0.35, 1], [0.2, 1]);
  return (
    <>
      <motion.g style={{ y: lidY, rotate: lidRotate, ...ORIGIN }}>
        <path d="M88 62h24v10H88z" {...INK} fill={GLASS} />
        <path d="M56 72h88v16H56z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ opacity: shoot, scaleY: shootScale, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
        <path d="M100 132V96" {...INK} stroke={FLUID} />
        <path d="M100 108c-9-2-14-8-15-17 9 0 14 5 15 17M100 116c9-2 14-8 15-17-9 0-14 5-15 17" {...INK} stroke={FLUID} fill={FLUID} />
      </motion.g>

      <g>
        <path d="M60 92h80v90c0 14-11 22-30 22H90c-19 0-30-8-30-22Z" {...INK} fill={GLASS} />
        <path d="M62 134c12-6 24-6 38 0s26 5 38-2v46c0 14-11 22-30 22H92c-19 0-30-8-30-22Z" fill={FLUID} stroke="none" />
        <path d="M62 134c12-6 24-6 38 0s26 5 38-2" {...INK} strokeOpacity={0.5} />
        <path d="M64 156c12-5 24-5 36 0s26 4 38-2" {...INK} strokeOpacity={0.28} />
        <path d="M66 178c12-5 24-5 34 0s24 4 36-2" {...INK} strokeOpacity={0.2} />
      </g>
    </>
  );
};

/* -- Head: the crown lifts off --------------------------------------------- */
/**
 * Drawn in profile, facing right.
 *
 * The first version split a circle in half and added shoulders, which reads as
 * an egg in a cup and not as a person. A head is recognisable from its profile
 * — brow, nose, lip, chin, jaw — and from almost nothing else, so that is what
 * this draws. The split runs along the hairline, which is also where a crown
 * would come off.
 */
const Head = ({ open }: P) => {
  const crownY = useTransform(open, [0, 1], [0, -46]);
  const crownRotate = useTransform(open, [0, 1], [0, -9]);
  const crownX = useTransform(open, [0, 1], [0, -8]);
  const mind = useTransform(open, [0.3, 0.8], [0, 1]);
  const mindScale = useTransform(open, [0.3, 1], [0.55, 1]);

  return (
    <>
      <motion.g style={{ x: crownX, y: crownY, rotate: crownRotate, ...ORIGIN }}>
        <path d="M58 124C56 88 78 58 110 58s50 30 48 66Z" {...INK} fill={GLASS} />
        <path d="M76 108c4-18 15-30 30-33" {...INK} strokeOpacity={0.4} />
      </motion.g>

      <motion.g style={{ opacity: mind, scale: mindScale, ...ORIGIN }}>
        <path
          d="M108 100c-16 0-26 10-26 23s10 21 22 21c10 0 15-6 15-13s-6-12-13-12-10 4-10 9"
          {...INK}
          stroke={FLUID}
        />
        <circle cx="107" cy="124" r="33" {...INK} stroke={FLUID} strokeOpacity={0.2} strokeDasharray="2 9" />
      </motion.g>

      <g>
        {/* The profile itself, in one stroke: forehead, brow, nose, lip, chin,
            jaw, then back up the skull to the split line. Drawn with curves —
            the first attempt used straight segments and the face came out as a
            row of notches. */}
        <path
          d="M158 126c0 6-2 10 0 15l14 11c2 2 1 5-2 6l-15 4c2 3 2 6-1 8 2 3 3 6 1 9 7 4 7 12 1 18-5 5-13 9-21 10l-32 4c-13-1-22-8-27-18-9-16-16-38-17-71Z"
          {...INK}
          fill={GLASS}
        />
        {/* ear */}
        <path d="M100 154c-8 0-13 6-13 13s5 13 13 13" {...INK} strokeOpacity={0.5} />
        <path d="M100 161c-4 0-6 3-6 6" {...INK} strokeOpacity={0.32} />
        {/* neck and collar */}
        <path d="M106 198h28v14c0 5-5 8-14 8s-14-3-14-8Z" {...INK} fill={GLASS} />
        <path d="M38 232c12-16 33-24 62-24s50 8 62 24" {...INK} fill={GLASS} />
      </g>
    </>
  );
};

/* -- Joint: the hinge opens ------------------------------------------------ */
const Joint = ({ open }: P) => {
  const upY = useTransform(open, [0, 1], [0, -26]);
  const upRotate = useTransform(open, [0, 1], [0, -10]);
  const downRotate = useTransform(open, [0, 1], [0, 8]);
  const glow = useTransform(open, [0.3, 0.8], [0, 1]);
  const glowScale = useTransform(open, [0.3, 1], [0.4, 1]);
  return (
    <>
      <motion.g style={{ y: upY, rotate: upRotate, ...ORIGIN }}>
        <path d="M86 44h28v56c14 4 22 12 22 22 0 8-6 14-14 14H78c-8 0-14-6-14-14 0-10 8-18 22-22V44Z" {...INK} fill={GLASS} />
        <path d="M78 118c8 4 16 5 26 3" {...INK} strokeOpacity={0.35} />
      </motion.g>

      <motion.g style={{ opacity: glow, scale: glowScale, ...ORIGIN }}>
        <ellipse cx="100" cy="146" rx="34" ry="12" fill={FLUID} stroke="none" />
        <ellipse cx="100" cy="146" rx="46" ry="19" {...INK} stroke={FLUID} strokeOpacity={0.3} strokeDasharray="2 9" />
      </motion.g>

      <motion.g style={{ rotate: downRotate, transformBox: 'fill-box', transformOrigin: 'top' }}>
        <path d="M74 162c-6 0-10 5-10 12 0 9 8 16 22 20v46h28v-46c14-4 22-11 22-20 0-7-4-12-10-12Z" {...INK} fill={GLASS} />
        <path d="M88 200c8 3 16 3 24 0" {...INK} strokeOpacity={0.35} />
      </motion.g>
    </>
  );
};

/* -- Agni: the lid lifts off the pot, the fire comes up -------------------- */
const Gut = ({ open }: P) => {
  const lidY = useTransform(open, [0, 1], [0, -40]);
  const lidX = useTransform(open, [0, 1], [0, -22]);
  const lidRotate = useTransform(open, [0, 1], [0, -16]);
  const fire = useTransform(open, [0.28, 0.85], [0, 1]);
  const fireScale = useTransform(open, [0.28, 1], [0.3, 1]);
  const steam = useTransform(open, [0.45, 0.9], [0, 1]);
  return (
    <>
      <motion.g style={{ x: lidX, y: lidY, rotate: lidRotate, ...ORIGIN }}>
        <path d="M97 42c0-5 1-7 3-7s3 2 3 7" {...INK} />
        <path d="M50 74c0-16 22-28 50-28s50 12 50 28Z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ opacity: steam }}>
        <path d="M80 82c-6 10-6 17 0 24M100 76c-6 11-6 19 0 28M120 82c6 10 6 17 0 24" {...INK} stroke={FLUID} strokeOpacity={0.5} />
      </motion.g>

      <g>
        <path d="M42 90h116" {...INK} />
        <path d="M48 90h104v38c0 22-19 36-52 36s-52-14-52-36Z" {...INK} fill={GLASS} />
        <path d="M49 118c12-6 24-6 34 0s22 6 34 1 22-5 34 1v8c0 21-19 34-51 34s-51-13-51-34Z" fill={FLUID} stroke="none" />
        <path d="M49 118c12-6 24-6 34 0s22 6 34 1 22-5 34 1" {...INK} strokeOpacity={0.45} />
        <path d="M152 102c11 2 17 9 17 18s-6 16-17 18" {...INK} />
      </g>

      <motion.g style={{ opacity: fire, scaleY: fireScale, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
        <path d="M100 210c-15-6-23-15-23-25 0-8 4-15 11-19-2 8 0 13 6 16-3-13 2-23 12-30-2 13 3 20 11 26 5 4 7 9 7 15 0 9-8 15-24 17Z" {...INK} stroke={FLUID} fill={FLUID} />
        <path d="M68 212c-8-5-12-11-12-18 0-5 2-9 6-12-1 6 0 10 4 12M132 212c8-5 12-11 12-18 0-5-2-9-6-12 1 6 0 10-4 12" {...INK} stroke={FLUID} strokeOpacity={0.55} />
      </motion.g>

      <path d="M44 222c14-5 33-8 56-8s42 3 56 8" {...INK} strokeOpacity={0.28} />
    </>
  );
};

/* -- Womb: the front opens ------------------------------------------------- */
const Womb = ({ open }: P) => {
  const leftRotate = useTransform(open, [0, 1], [0, -40]);
  const rightRotate = useTransform(open, [0, 1], [0, 40]);
  const core = useTransform(open, [0.3, 0.8], [0, 1]);
  const coreScale = useTransform(open, [0.3, 1], [0.45, 1]);
  return (
    <>
      <g>
        <path d="M62 84c-10 16-8 34 6 44M138 84c10 16 8 34-6 44" {...INK} strokeOpacity={0.55} />
        <circle cx="58" cy="80" r="9" {...INK} fill={GLASS} />
        <circle cx="142" cy="80" r="9" {...INK} fill={GLASS} />
      </g>

      <motion.g style={{ opacity: core, scale: coreScale, ...ORIGIN }}>
        <path d="M100 116c12 10 18 20 18 30s-8 18-18 18-18-8-18-18 6-20 18-30Z" {...INK} stroke={FLUID} fill={FLUID} />
        <circle cx="100" cy="150" r="34" {...INK} stroke={FLUID} strokeOpacity={0.25} strokeDasharray="2 9" />
      </motion.g>

      <motion.g style={{ rotate: leftRotate, transformBox: 'fill-box', transformOrigin: '100% 10%' }}>
        <path d="M98 104c-20 6-30 24-30 48 0 22 10 38 30 44Z" {...INK} fill={GLASS} />
      </motion.g>
      <motion.g style={{ rotate: rightRotate, transformBox: 'fill-box', transformOrigin: '0% 10%' }}>
        <path d="M102 104c20 6 30 24 30 48 0 22-10 38-30 44Z" {...INK} fill={GLASS} />
      </motion.g>

      <path d="M92 198h16v22H92z" {...INK} fill={GLASS} />
    </>
  );
};

/* -- Hand: three fingers lift off the wrist -------------------------------- */
const Hand = ({ open }: P) => {
  const handY = useTransform(open, [0, 1], [0, -46]);
  const handRotate = useTransform(open, [0, 1], [0, -8]);
  const wave = useTransform(open, [0.35, 0.88], [0, 1]);
  const points = useTransform(open, [0.5, 0.9], [0, 1]);

  return (
    <>
      <motion.g style={{ y: handY, rotate: handRotate, ...ORIGIN }}>
        {/* back of the hand, with a thumb down the near side */}
        <path
          d="M62 62h72c11 0 20 9 20 20v26c0 12-9 21-21 21H68c-12 0-21-9-21-21V80c0-10 7-18 15-18Z"
          {...INK}
          fill={GLASS}
        />
        <path d="M47 92c-10 1-16 7-16 16 0 10 8 17 19 16" {...INK} fill={GLASS} />
        {/* index, middle and ring finger reaching down to the wrist */}
        <path
          d="M72 128h20v28a10 10 0 0 1-20 0ZM95 128h18v34a9 9 0 0 1-18 0ZM116 128h20v28a10 10 0 0 1-20 0Z"
          {...INK}
          fill={GLASS}
        />
        <path d="M66 78h68" {...INK} strokeOpacity={0.28} />
        <path d="M78 136h8M101 136h7M122 136h8" {...INK} strokeOpacity={0.3} />
      </motion.g>

      <motion.g style={{ opacity: wave, scaleX: wave, ...LEFT }}>
        <path d="M34 172h22l7-16 10 32 10-40 9 28 7-14h48" {...INK} stroke={FLUID} />
      </motion.g>

      <motion.g style={{ opacity: points }}>
        <circle cx="82" cy="194" r="4" fill={FLUID} stroke="none" />
        <circle cx="104" cy="194" r="4" fill={FLUID} stroke="none" />
        <circle cx="126" cy="194" r="4" fill={FLUID} stroke="none" />
      </motion.g>

      <g>
        {/* forearm and wrist */}
        <path d="M30 180h140c9 0 16 7 16 16v10c0 9-7 16-16 16H30c-9 0-16-7-16-16v-10c0-9 7-16 16-16Z" {...INK} fill={GLASS} />
        <path d="M44 208c9 4 19 5 29 3" {...INK} strokeOpacity={0.28} />
      </g>
    </>
  );
};

/* -- Scroll: the palm leaf unrolls ----------------------------------------- */
const Scroll = ({ open }: P) => {
  const leaf = useTransform(open, [0.1, 0.7], [0.1, 1]);
  const lines = useTransform(open, [0.45, 0.9], [0, 1]);
  const leftX = useTransform(open, [0, 1], [40, 0]);
  const rightX = useTransform(open, [0, 1], [-40, 0]);
  return (
    <>
      <motion.g style={{ scaleX: leaf, ...ORIGIN }}>
        <path d="M40 92h120v92H40z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ opacity: lines }}>
        <path d="M62 116h76M62 132h60M62 148h72M62 164h44" {...INK} stroke={FLUID} strokeOpacity={0.85} />
      </motion.g>

      <motion.g style={{ x: leftX }}>
        <path d="M32 84h16v108H32z" {...INK} fill={FLUID} />
        <path d="M40 78v6M40 192v6" {...INK} strokeOpacity={0.5} />
      </motion.g>
      <motion.g style={{ x: rightX }}>
        <path d="M152 84h16v108h-16z" {...INK} fill={FLUID} />
        <path d="M160 78v6M160 192v6" {...INK} strokeOpacity={0.5} />
      </motion.g>
    </>
  );
};

/* -- Droni: the cover comes off the treatment table ------------------------ */
const Droni = ({ open }: P) => {
  const sheetY = useTransform(open, [0, 1], [0, -48]);
  const sheetRotate = useTransform(open, [0, 1], [0, -4]);
  const oil = useTransform(open, [0.35, 0.85], [0, 1]);
  return (
    <>
      <motion.g style={{ y: sheetY, rotate: sheetRotate, ...ORIGIN }}>
        <path d="M28 118c24-7 48-11 72-11s48 4 72 11c-5 7-13 11-25 11H53c-12 0-20-4-25-11Z" {...INK} fill={GLASS} />
      </motion.g>

      <motion.g style={{ opacity: oil }}>
        <path d="M66 152c11-5 22-5 34 0s23 5 34 0" {...INK} stroke={FLUID} />
        <path d="M76 164c8-4 16-4 24 0s16 4 24 0" {...INK} stroke={FLUID} strokeOpacity={0.55} />
      </motion.g>

      <g>
        <path d="M40 100h30v34H40z" {...INK} fill={GLASS} />
        <path d="M24 134h152c5 0 8 4 7 9l-5 26c-1 6-6 10-12 10H34c-6 0-11-4-12-10l-5-26c-1-5 2-9 7-9Z" {...INK} fill={GLASS} />
        <path d="M24 148h152" {...INK} strokeOpacity={0.25} />
        <path d="M44 179v32M156 179v32M30 214h28M142 214h28" {...INK} strokeOpacity={0.6} />
      </g>
    </>
  );
};

/* -- Sprout: the seed splits ----------------------------------------------- */
const SproutFigure = ({ open }: P) => {
  const leftX = useTransform(open, [0, 1], [0, -34]);
  const leftRotate = useTransform(open, [0, 1], [0, -22]);
  const rightX = useTransform(open, [0, 1], [0, 34]);
  const rightRotate = useTransform(open, [0, 1], [0, 22]);
  const shoot = useTransform(open, [0.3, 0.9], [0, 1]);
  return (
    <>
      <motion.g style={{ scaleY: shoot, opacity: shoot, transformBox: 'fill-box', transformOrigin: 'bottom' }}>
        <path d="M100 176V78" {...INK} stroke={FLUID} />
        <path d="M100 106c-14-2-22-12-24-26 14 0 22 8 24 26M100 122c14-2 22-12 24-26-14 0-22 8-24 26" {...INK} stroke={FLUID} fill={FLUID} />
      </motion.g>

      <motion.g style={{ x: leftX, rotate: leftRotate, transformBox: 'fill-box', transformOrigin: '100% 50%' }}>
        <path d="M98 128c-24 0-40 14-40 32s16 30 40 30Z" {...INK} fill={GLASS} />
      </motion.g>
      <motion.g style={{ x: rightX, rotate: rightRotate, transformBox: 'fill-box', transformOrigin: '0% 50%' }}>
        <path d="M102 128c24 0 40 14 40 32s-16 30-40 30Z" {...INK} fill={GLASS} />
      </motion.g>

      <path d="M56 210c14-6 28-8 44-8s30 2 44 8" {...INK} strokeOpacity={0.35} />
    </>
  );
};

const FIGURES: Partial<Record<FigureId, (props: P) => JSX.Element>> = {
  lotus: Lotus,
  windpot: WindPot,
  lamp: Lamp,
  earthjar: EarthJar,
  head: Head,
  joint: Joint,
  gut: Gut,
  womb: Womb,
  hand: Hand,
  scroll: Scroll,
  droni: Droni,
  sprout: SproutFigure,
};

const VESSEL_IDS = ['vial', 'capsule', 'potli', 'jar', 'vati', 'dhara'] as const;
type VesselId = (typeof VESSEL_IDS)[number];
const isVessel = (id: FigureId): id is VesselId => (VESSEL_IDS as readonly string[]).includes(id);

/** One centrepiece, opened by `open`. */
export const Figure = ({
  id,
  open,
  className,
}: {
  id: FigureId;
  open: MotionValue<number>;
  className?: string;
}) => {
  const uid = usePaint();
  if (isVessel(id)) return <Vessel id={id} open={open} className={className} />;
  const Draw = FIGURES[id];
  if (!Draw) return null;
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

export default Figure;
