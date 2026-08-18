import React from 'react';

/* ---------------------------------------------------------------------------
 * Paint for the openable figures
 * ---------------------------------------------------------------------------
 * The medallions are painted illustrations — gradient line work, a lit
 * interior, depth. Next to them the centrepiece was a single-weight monochrome
 * outline, which is most of why a first-time visitor could not tell what they
 * were looking at. This gives the figures the same treatment.
 *
 * Gradients are referenced by id, and ids in SVG are document-scoped: with six
 * figures on one page a fixed id means every figure silently paints itself
 * with the first one's colours. Each figure therefore gets its own id prefix
 * from `useId`, and hands the paint down as CSS variables set on its own
 * <svg> — so the drawings keep saying `var(--rx-glass)` and never learn that a
 * gradient is involved.
 *
 *   --rx-shell   the shell colour   (set by the theme, per tone)
 *   --rx-accent  what is inside     (set per scene)
 *   --rx-glass   → url(#…-shell)    (set here)
 *   --rx-fluid   → url(#…-fluid)    (set here)
 */

export const usePaint = () => {
  const raw = React.useId();
  // useId returns a value containing colons, which are not valid in a URL
  // fragment reference.
  return raw.replace(/:/g, '');
};

/** Style to spread on the <svg> so its drawings pick up the gradients. */
export const paintStyle = (uid: string): React.CSSProperties =>
  ({
    ['--rx-glass' as string]: `url(#${uid}-shell)`,
    ['--rx-fluid' as string]: `url(#${uid}-fluid)`,
  }) as React.CSSProperties;

/** Gradient definitions for one figure. */
export const PaintDefs = ({ uid }: { uid: string }) => (
  <defs>
    {/* Line work: bright where the light is, falling away across the form. */}
    <linearGradient id={`${uid}-line`} x1="0.12" y1="0" x2="0.7" y2="1">
      <stop offset="0" stopColor="currentColor" stopOpacity="1" />
      <stop offset="1" stopColor="currentColor" stopOpacity="0.55" />
    </linearGradient>

    {/* Shell: tinted with the scene's own accent rather than with neutral ink.
        A figure carrying no fluid — a head, a knee, a manuscript — was coming
        out as a pale outline on the light sections and reading as unfinished;
        tinting the shell gives every figure a body and ties it to its scene. */}
    <linearGradient id={`${uid}-shell`} x1="0.25" y1="0" x2="0.55" y2="1">
      <stop offset="0" stopColor="var(--rx-accent)" stopOpacity="0.34" />
      <stop offset="0.55" stopColor="var(--rx-accent)" stopOpacity="0.2" />
      <stop offset="1" stopColor="var(--rx-shell)" stopOpacity="0.7" />
    </linearGradient>

    {/* Contents: the accent, deepening toward the bottom of the vessel. */}
    <linearGradient id={`${uid}-fluid`} x1="0.3" y1="0" x2="0.55" y2="1">
      <stop offset="0" stopColor="var(--rx-accent)" stopOpacity="0.92" />
      <stop offset="1" stopColor="var(--rx-accent)" stopOpacity="0.6" />
    </linearGradient>
  </defs>
);
