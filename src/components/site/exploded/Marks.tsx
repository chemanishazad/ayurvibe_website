import React from 'react';
import {
  Activity, Anchor, Baby, BatteryLow, Bed, Bone, CalendarDays, CheckCheck, ClipboardList,
  Clock, Cloud, CloudRain, Compass, DoorClosed, Droplet, Droplets, Eye, Feather, Flame,
  Footprints, Gauge, Hourglass, ListChecks, Mountain, Moon, Pill, Repeat, Scale, Settings2,
  Shield, Snowflake, Sprout, Stethoscope, Sun, Sunrise, Syringe, Target, Thermometer,
  TrendingUp, UtensilsCrossed, Users, Waves, Wind, Zap, type LucideIcon,
} from 'lucide-react';
import { Botanical } from '@/components/site/apothecary/Botanicals';
import type { LucideMarkId, MarkId } from '@/components/site/exploded/types';
import type { GlyphId } from '@/data/remedies';

/* ---------------------------------------------------------------------------
 * Medallion marks
 * ---------------------------------------------------------------------------
 * Two sources, deliberately.
 *
 * The botanicals are hand-drawn (apothecary/Botanicals.tsx) because they are
 * the distinctive thing on the page — no stock photograph of turmeric, and no
 * icon set has a Haritaki. Everything else is conceptual (a moon, a spine, a
 * clock) and comes from the icon set already in the bundle: same 1.5–2 weight,
 * same round caps, so a ring mixing the two still reads as one drawing.
 * ------------------------------------------------------------------------- */

const LUCIDE: Record<LucideMarkId, LucideIcon> = {
  wind: Wind, waves: Waves, syringe: Syringe, droplets: Droplets, droplet: Droplet,
  feather: Feather, snowflake: Snowflake, moon: Moon, flame: Flame, sun: Sun, target: Target,
  thermometer: Thermometer, spark: Zap, anchor: Anchor, hourglass: Hourglass, bed: Bed,
  mountain: Mountain, cloud: Cloud, pulse: Activity, eye: Eye, clipboard: ClipboardList,
  compass: Compass, checklist: ListChecks, pill: Pill, plate: UtensilsCrossed,
  calendar: CalendarDays, clock: Clock, door: DoorClosed, people: Users,
  stethoscope: Stethoscope, trend: TrendingUp, sliders: Settings2, sunrise: Sunrise,
  battery: BatteryLow, rain: CloudRain, bone: Bone, activity: CheckCheck, foot: Footprints,
  scale: Scale, gauge: Gauge, ring: Repeat, repeat: Repeat, baby: Baby, shoot: Sprout,
  shield: Shield,
};

const BOTANICAL_IDS: Record<GlyphId, true> = {
  root: true, leaf: true, sprig: true, berry: true, fruit: true, seed: true,
  rhizome: true, flower: true, bark: true, resin: true, oil: true, milk: true,
  honey: true, ghee: true, salt: true, grain: true, pod: true, thread: true,
  wood: true, pepper: true,
};

const isLucide = (id: MarkId): id is LucideMarkId => id in LUCIDE;
const isBotanical = (id: MarkId): id is GlyphId => id in BOTANICAL_IDS;

/**
 * Inline fallback for a mark.
 *
 * The medallions normally show the artwork built by `npm run marks`; this only
 * runs when a subject has no file yet. Subjects that exist only as artwork
 * (a spine, a Vasti pot) have nothing to fall back to, so they render nothing
 * rather than something misleading.
 */
export const Mark = ({ id, className }: { id: MarkId; className?: string }) => {
  if (isLucide(id)) {
    const Icon = LUCIDE[id];
    return <Icon className={className} strokeWidth={1.5} aria-hidden />;
  }
  if (isBotanical(id)) return <Botanical id={id} className={className} />;
  return null;
};

export default Mark;
