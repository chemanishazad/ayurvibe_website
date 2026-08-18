import type { GlyphId } from '@/data/remedies';

/* ---------------------------------------------------------------------------
 * The exploded-diagram language
 * ---------------------------------------------------------------------------
 * One scene = a figure that comes apart on scroll, with labelled satellites
 * lifting out of it. The dispensary was the first use; these types are what let
 * the same scene carry a dosha, a body system, a stage of a visit or one of the
 * five Panchakarma actions without the components knowing the difference.
 * ------------------------------------------------------------------------- */

/** Palette slot for a satellite medallion. Four, so a ring stays calm. */
export type Tint = 'leaf' | 'amber' | 'clay' | 'stone';

/** Everything that can be drawn inside a medallion. */
export type MarkId = GlyphId | LucideMarkId | DrawnMarkId;

/**
 * Subjects no icon set has. An icon set's nearest match is worse than nothing
 * here — "cervical pain" was landing on a pair of ticks and "knee pain" on a
 * trail of footprints — so these are drawn in scripts/build-marks.mjs and only
 * ever appear as artwork.
 */
export type DrawnMarkId =
  | 'spine' | 'neck' | 'knee' | 'nerve' | 'ovary' | 'cycle' | 'cramp' | 'thyroid'
  | 'intestine' | 'nadi' | 'vasti' | 'vamana' | 'virechana' | 'nasya'
  | 'blooddrop' | 'belly';

/** Conceptual marks, drawn from the icon set rather than by hand. */
export type LucideMarkId =
  | 'wind' | 'waves' | 'syringe' | 'droplets' | 'droplet'
  | 'feather' | 'snowflake' | 'moon' | 'flame' | 'sun' | 'target'
  | 'thermometer' | 'spark' | 'anchor' | 'hourglass' | 'bed' | 'mountain' | 'cloud'
  | 'pulse' | 'eye' | 'clipboard' | 'compass' | 'checklist' | 'pill' | 'plate'
  | 'calendar' | 'clock' | 'door' | 'people' | 'stethoscope' | 'trend' | 'sliders'
  | 'sunrise' | 'battery' | 'rain' | 'bone' | 'activity' | 'foot' | 'scale'
  | 'gauge' | 'ring' | 'repeat' | 'baby' | 'shoot' | 'shield';

/** Openable centrepieces. */
export type FigureId =
  // dispensary vessels
  | 'vial' | 'capsule' | 'potli' | 'jar' | 'vati' | 'dhara'
  // everything else
  | 'lotus' | 'windpot' | 'lamp' | 'earthjar'
  | 'head' | 'joint' | 'gut' | 'womb'
  | 'hand' | 'scroll' | 'droni' | 'sprout';

export interface Satellite {
  mark: MarkId;
  /** What the medallion is called. */
  name: string;
  /** Small italic line under the name — Sanskrit, botanical or a qualifier. */
  sub?: string;
  /** One short clause. Hidden below `sm`. */
  note: string;
  tint: Tint;
}

export interface SceneData {
  slug: string;
  figure: FigureId;
  /** HSL triplet for what is inside the figure, e.g. `38 86% 58%`. */
  accent: string;
  /** Small caps line above the title. */
  kicker: string;
  title: string;
  /** One italic line under the title. */
  tagline: string;
  /** The readable paragraph. Hidden below `sm`. */
  body: string;
  /** The footnote beside the flask mark. */
  footnote: string;
  /** Rendered in italics after the footnote — a source or a duration. */
  footnoteSource?: string;
  /** Names the drawing, under the figure. Two or three words. */
  figureCaption: string;
  satellites: Satellite[];
  /** Chips linking into the therapy grid. */
  links?: { name: string; slug: string }[];
}

export type Tone = 'light' | 'dark';
