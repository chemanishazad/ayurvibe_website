import React from 'react';
import type { GlyphId } from '@/data/remedies';

/* ---------------------------------------------------------------------------
 * Ink botanicals
 * ---------------------------------------------------------------------------
 * Every ingredient in the dispensary scene is drawn, not photographed. There is
 * no ingredient photography in the asset set, and stock herb photos would look
 * exactly like the stock herb photos on every other Ayurveda site — the point
 * of this section is that it could not have come from a template.
 *
 * House rules so twenty drawings read as one set:
 *   · 48×48 box, everything inside a 6px margin
 *   · one weight (1.6), round caps, round joins
 *   · outline is `currentColor`; the single flat fill is `--rx-fill`, set by
 *     the medallion, so a drawing takes the tint of its ingredient
 *   · no gradients, no filters — these are inlined into the page and must cost
 *     nothing to paint
 * ------------------------------------------------------------------------- */

const S = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const FILL = 'var(--rx-fill, transparent)';

const glyphs: Record<GlyphId, React.ReactNode> = {
  /* Tap root with hairs — Bala, Jatamansi, Shatavari tuber */
  root: (
    <>
      <path d="M20 7c2.4 1.6 5.2 1.6 8 0" />
      <path d="M24 7c0 6-3 9-3 15 0 7 2 11 3 19 1-8 3-12 3-19 0-6-3-9-3-15Z" fill={FILL} />
      <path d="M21.4 17c-3 .6-5 2.4-6.4 5.2M26.6 20c3.2.4 5.4 2.2 6.8 5M22 28c-2.6 1.2-4 3-4.8 5.8M26.4 31c2.6 1 4 2.6 5 5.4" />
    </>
  ),

  /* Single pointed leaf with a midrib — Brahmi, Nirgundi */
  leaf: (
    <>
      <path d="M24 41c-9-4-13-11-12-21 10-2 17 2 21 11 3 7 1 12-3 14-3 1.6-4.6.4-6-4Z" fill={FILL} />
      <path d="M12 20c6 3 10 8 14 21" />
      <path d="M16 22.5l4.2-2M19.5 27l4.6-2.4M22.8 32l4.6-2.6" />
    </>
  ),

  /* Sprig of paired leaflets — Rasna, Shatavari frond */
  sprig: (
    <>
      <path d="M24 43V10" />
      <path d="M24 16c-2.6-4-6-5.4-9.6-4.6.4 4 3 6.4 7 6.8M24 16c2.6-4 6-5.4 9.6-4.6-.4 4-3 6.4-7 6.8" fill={FILL} />
      <path d="M24 26c-2.4-3.6-5.4-5-8.8-4.2.4 3.6 2.8 5.8 6.4 6.2M24 26c2.4-3.6 5.4-5 8.8-4.2-.4 3.6-2.8 5.8-6.4 6.2" fill={FILL} />
      <path d="M24 35.4c-2-3-4.6-4.2-7.4-3.6.4 3 2.4 4.8 5.4 5.2M24 35.4c2-3 4.6-4.2 7.4-3.6-.4 3-2.4 4.8-5.4 5.2" fill={FILL} />
    </>
  ),

  /* Lobed round fruit — Amla */
  berry: (
    <>
      <path d="M24 12v-5M24 7c-2.6-2-5-2.2-7.4-.6 1 2.6 3 3.8 5.8 3.6" />
      <circle cx="24" cy="27" r="14" fill={FILL} />
      <path d="M18 14.4c-2 3.6-3 7.8-3 12.6s1 9 3 12.6M30 14.4c2 3.6 3 7.8 3 12.6s-1 9-3 12.6M24 13v28" />
    </>
  ),

  /* Ridged ovoid drupe — Haritaki */
  fruit: (
    <>
      <path d="M24 9c-1.6-2-3.6-2.8-6-2.4" />
      <path d="M24 9c7 0 11.6 6 11.6 15.4C35.6 34.6 30.6 42 24 42s-11.6-7.4-11.6-17.6C12.4 15 17 9 24 9Z" fill={FILL} />
      <path d="M19.4 11.6c-1.6 4-2.4 8.2-2.4 12.8 0 5.4 1 10.2 2.8 14M28.6 11.6c1.6 4 2.4 8.2 2.4 12.8 0 5.4-1 10.2-2.8 14M24 9.4v32" />
    </>
  ),

  /* Seed with a seam — Bibhitaki, Ajamoda */
  seed: (
    <>
      <path d="M24 7c8 5.4 12 11.6 12 18.6C36 34.4 30.6 41 24 41s-12-6.6-12-15.4C12 18.6 16 12.4 24 7Z" fill={FILL} />
      <path d="M24 8.6v30" />
      <path d="M19.6 16.8c-1.8 3.4-2.6 6.8-2.6 10.4M28.4 16.8c1.8 3.4 2.6 6.8 2.6 10.4" />
    </>
  ),

  /* Knobbed rhizome — Haridra (turmeric) */
  rhizome: (
    <>
      <path d="M13 30.6c-1.6-5 .6-9.4 5-10.6 4.6-1.2 6.4 1.4 10.6.4 4.4-1 8 .8 9 4.6 1 4-1.4 7.6-6 8.8-4.4 1.2-6.6-1-10.8-.2-4.2.8-7-.4-7.8-3Z" fill={FILL} />
      <path d="M17.4 20.4c-.6-3.4.4-6 3-7.6M28.6 20.4c1-3 3.2-4.6 6.4-4.8M22.8 34.6c-.8 3-2.8 4.8-5.8 5.4" />
      <path d="M20 25.6c1.4 1 3 1.4 4.8 1.2M27.6 28.8c1.6.2 3-.2 4.2-1.2" />
    </>
  ),

  /* Five petals with stigma threads — Kumkuma (saffron) */
  flower: (
    <>
      <path d="M24 24 24 9.6M24 24 37.6 19.4M24 24 33.4 35.6M24 24 14.6 35.6M24 24 10.4 19.4" />
      <path d="M24 9.6c3.6 0 5.6 2 5.6 5.6M24 9.6c-3.6 0-5.6 2-5.6 5.6" fill={FILL} />
      <circle cx="24" cy="24" r="4.6" fill={FILL} />
      <path d="M24 24c-4 3.4-6 7.6-6 12.8M24 24c0 4.4 1 8.6 3 12.6M24 24c4 3.4 6 7.6 6 12.8" />
    </>
  ),

  /* Rolled bark quill — Twak */
  bark: (
    <>
      <path d="M17 10.6c6-2 10.4-2 14 .4v26.4c-3.6-2.4-8-2.4-14-.4Z" fill={FILL} />
      <path d="M17 10.6c-2.6 1-4 3.4-4 7v20c0 3.6 1.4 6 4 7" />
      <ellipse cx="17" cy="13.6" rx="2.6" ry="3" />
      <path d="M23 13.8v22M27 13.4v22.6" />
    </>
  ),

  /* Irregular gum with a drip — Guggulu */
  resin: (
    <>
      <path d="M16.4 15.4c3-4.4 8.4-5.4 12.6-2.6 4.4 3 6 8.6 4.4 13.8-1.6 5.2-5.6 9-10.2 9.6-4.6.6-8.2-2.4-9-7.4-.8-5 .2-9.6 2.2-13.4Z" fill={FILL} />
      <path d="M20.2 19.6c1.8-1.6 4-1.8 6.2-.6M28.8 26.4c.6 2-.2 3.8-2 5" />
      <path d="M22.6 36.6c-.4 2.4.2 4.2 1.8 5.4 1.6-1.4 2.2-3.2 1.8-5.6" fill={FILL} />
    </>
  ),

  /* Droplet — Tila taila, Ksheerabala */
  oil: (
    <>
      <path d="M24 7c6.6 8 10 14.2 10 18.8C34 33 29.6 38 24 38s-10-5-10-12.2C14 21.2 17.4 15 24 7Z" fill={FILL} />
      <path d="M19.4 27.4c.2 3 1.6 5 4.2 5.8" />
    </>
  ),

  /* Drop falling into a bowl — Go ksheera */
  milk: (
    <>
      <path d="M24 8c3.2 4 4.8 6.8 4.8 8.6 0 2.8-2.2 4.8-4.8 4.8s-4.8-2-4.8-4.8c0-1.8 1.6-4.6 4.8-8.6Z" fill={FILL} />
      <path d="M11 27h26c-.8 8-6 12.6-13 12.6S11.8 35 11 27Z" fill={FILL} />
      <path d="M15.6 31.4c.8 2.6 2.4 4.4 4.8 5.4" />
    </>
  ),

  /* Comb cells with a drip — Madhu */
  honey: (
    <>
      <path d="M24 9l6.4 3.6v7.2L24 23.4l-6.4-3.6v-7.2Z" fill={FILL} />
      <path d="M14.6 22.6l5.6 3.2v6.4l-5.6 3.2L9 32.2v-6.4ZM33.4 22.6l5.6 3.2v6.4l-5.6 3.2-5.6-3.2v-6.4Z" />
      <path d="M24 27c1.4 3.4 2 6 2 8 0 1.6-1 2.6-2 2.6s-2-1-2-2.6c0-2 .6-4.6 2-8Z" fill={FILL} />
    </>
  ),

  /* Small pot with a swirl — Go ghrita */
  ghee: (
    <>
      <path d="M13 19h22v3.4c0 10-4 16.6-11 16.6s-11-6.6-11-16.6Z" fill={FILL} />
      <path d="M11 19c2.6-2.6 6.8-4 13-4s10.4 1.4 13 4" />
      <path d="M20 10.6c1.4 1.6 1.4 3 0 4.4M27 9.6c1.6 1.8 1.6 3.4 0 5" />
      <path d="M18.4 25c2.6 2 5.4 2.4 8.4 1.2" />
    </>
  ),

  /* Crystal cluster — Saindhava lavana */
  salt: (
    <>
      <path d="M22 8.6l9.6 5v11l-9.6 5-9.6-5v-11Z" fill={FILL} />
      <path d="M12.4 13.6 22 18.6l9.6-5M22 18.6v11" />
      <path d="M31 27.4l7.4 3.8v8.4l-7.4 3.8-7.4-3.8v-8.4Z" />
      <path d="M23.6 31.2 31 35l7.4-3.8M31 35v8.4" />
    </>
  ),

  /* Three pulses — Kulattha (horse gram) */
  grain: (
    <>
      <ellipse cx="17" cy="17.4" rx="7.4" ry="5.6" transform="rotate(-20 17 17.4)" fill={FILL} />
      <ellipse cx="31" cy="23" rx="7.4" ry="5.6" transform="rotate(16 31 23)" fill={FILL} />
      <ellipse cx="20" cy="32.6" rx="7.4" ry="5.6" transform="rotate(-8 20 32.6)" fill={FILL} />
      <path d="M12.4 15.6c1.4-1 3-1.4 4.8-1.2M27 21.4c1.4-1 3-1.2 4.8-.8M15.6 30.6c1.4-1 3-1.4 4.8-1.2" />
    </>
  ),

  /* Ridged pod, split at the tip — Ela (cardamom) */
  pod: (
    <>
      <path d="M24 8c5 4.6 7.6 10 7.6 16.2 0 8-3.4 13.4-7.6 16.6-4.2-3.2-7.6-8.6-7.6-16.6C16.4 18 19 12.6 24 8Z" fill={FILL} />
      <path d="M24 9.4v29.6M20.4 14.4c-1.4 3.4-2 6.8-2 10.2M27.6 14.4c1.4 3.4 2 6.8 2 10.2" />
      <path d="M24 8c-1.6-1.6-2.4-3.2-2.4-5M24 8c1.6-1.6 2.4-3.2 2.4-5" />
    </>
  ),

  /* Bound threads — Ushira (vetiver) */
  thread: (
    <>
      <path d="M18 8c-2.6 5-3 9.4-1.2 13.2M24 6.6c-1.4 5.4-1.4 10 0 14M30 8c2.6 5 3 9.4 1.2 13.2" />
      <path d="M14.6 21h18.8v4.4H14.6z" fill={FILL} />
      <path d="M17.6 25.4c-1.4 6-2 11-1.8 15M24 25.4c-.6 6-.6 11 0 15M30.4 25.4c1.4 6 2 11 1.8 15" />
    </>
  ),

  /* Cut billets with grain — Chandana, Dashamoola */
  wood: (
    <>
      <path d="M10 15.6h20v9.6H10z" fill={FILL} transform="rotate(-9 20 20.4)" />
      <ellipse cx="30.4" cy="18.8" rx="2.4" ry="4.8" transform="rotate(-9 30.4 18.8)" />
      <path d="M18 26.6h20v9.6H18z" fill={FILL} transform="rotate(7 28 31.4)" />
      <ellipse cx="17.6" cy="30" rx="2.4" ry="4.8" transform="rotate(7 17.6 30)" />
      <path d="M13.6 17.6c1.6 2.4 1.6 4.8 0 7.2M21.4 29.2c1.6 2.4 1.6 4.8 0 7.2" />
    </>
  ),

  /* Corns and a catkin — Trikatu, Pippali */
  pepper: (
    <>
      <path d="M30.6 7.6c2.6 0 4 2.4 4 7.2s-1.4 8.4-4 10.6c-2.6-2.2-4-5.8-4-10.6s1.4-7.2 4-7.2Z" fill={FILL} />
      <path d="M27 12.4h7.2M26.8 16.4h7.6M27.2 20.4h6.8" />
      <circle cx="15.6" cy="18.6" r="5.2" fill={FILL} />
      <circle cx="14.4" cy="31.6" r="5.6" fill={FILL} />
      <circle cx="26.6" cy="34" r="4.8" fill={FILL} />
      <path d="M13 16.4c1-.8 2.2-1.2 3.6-1M11.6 29.6c1-1 2.2-1.4 3.6-1.4M24.4 32.4c1-.8 2-1 3.2-.8" />
    </>
  ),
};

/** One ink drawing. Colour comes from `currentColor` + the `--rx-fill` var. */
export const Botanical = ({ id, className }: { id: GlyphId; className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false" {...S}>
    {glyphs[id]}
  </svg>
);

export default Botanical;
