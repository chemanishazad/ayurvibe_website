import type { MarkId } from '@/components/site/exploded/types';

/**
 * Artwork for the medallions.
 *
 * These are real image files, built by `npm run marks` from the hand-drawn
 * botanicals plus the icon set and then painted — gradient line work, a
 * translucent interior, a dropped shadow and a coloured halo, each subject in
 * its own palette. Transparent WebP, so one file works on the dark sections
 * and the light ones.
 *
 * If a subject has no file yet the medallion falls back to drawing it inline,
 * so adding a satellite never leaves a hole in the page.
 */
const files = import.meta.glob('../../../assets/marks/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const byId = new Map<string, string>(
  Object.entries(files).map(([path, url]) => [path.split('/').pop()!.replace('.webp', ''), url])
);

export const markImage = (id: MarkId): string | undefined => byId.get(id);
