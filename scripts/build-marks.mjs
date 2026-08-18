#!/usr/bin/env node
/**
 * Builds the medallion artwork.
 *
 * The exploded scenes label everything they open — sixty-two subjects, from
 * Haritaki to a wall calendar. Drawn as flat line icons they read as an icon
 * set; what the scenes need is a small illustration of the thing.
 *
 * So each subject is composed here and rasterised:
 *
 *   1. line work is taken from two sources — the hand-drawn botanicals in
 *      src/components/site/apothecary/Botanicals.tsx (parsed, so the drawings
 *      are never transcribed twice) and the icon set already in the bundle
 *      (read straight out of node_modules, so nothing is redrawn by hand),
 *   2. it is painted: a two-stop gradient along the stroke, a translucent
 *      interior, a dropped shadow copy behind and a light rim on top,
 *   3. each subject gets its own palette, because turmeric is not the same
 *      colour as rock salt and a set where everything is one green is exactly
 *      what makes an icon set look like an icon set,
 *   4. it is written out as a transparent WebP, so the medallion's own plate
 *      still supplies the background and one file works on the light sections
 *      and the dark ones.
 *
 * Output:  src/assets/marks/<id>.webp   (160px, transparent)
 * Usage:   npm run marks
 */
import { readFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT = join(ROOT, 'src/assets/marks');
const BOTANICALS = join(ROOT, 'src/components/site/apothecary/Botanicals.tsx');
const LUCIDE = join(ROOT, 'node_modules/lucide-react/dist/esm/icons');

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error('[marks] `sharp` is not installed. Run `npm install` and try again.');
  process.exit(1);
}

/* -- palettes -------------------------------------------------------------
 * Mid-tone by design: these sit on a near-black section and a near-white one,
 * so nothing can be as pale as the dark tone would like or as deep as the
 * light tone would.
 */
const P = {
  herb:  { l: '#A6DBA0', d: '#3C8551', f1: '#63A874', f2: '#2F6B44' },
  deep:  { l: '#84CB9E', d: '#2C6B48', f1: '#4E9A6A', f2: '#265A3C' },
  amber: { l: '#F4C879', d: '#B9762A', f1: '#E0A34C', f2: '#A9691F' },
  gold:  { l: '#F7DC90', d: '#C08A22', f1: '#E8C05C', f2: '#A8761A' },
  clay:  { l: '#E6A587', d: '#9C4F31', f1: '#C87A56', f2: '#8B4127' },
  rust:  { l: '#EC9E76', d: '#A34A22', f1: '#CE7040', f2: '#8E3C17' },
  stone: { l: '#E2E8E3', d: '#87938C', f1: '#B9C4BD', f2: '#7C8A83' },
  cloud: { l: '#DCE8F1', d: '#7C93A6', f1: '#AFC5D6', f2: '#6E8698' },
  water: { l: '#AFD7EB', d: '#3C7A9B', f1: '#72AECD', f2: '#316A88' },
  fire:  { l: '#FDD095', d: '#C4451F', f1: '#EE8A3C', f2: '#AE3A16' },
  berry: { l: '#EEA6AC', d: '#9E3946', f1: '#CE6470', f2: '#8B2C39' },
  ink:   { l: '#C1CDD4', d: '#4E5F69', f1: '#8595A0', f2: '#43545E' },
};

/** Which palette each subject is painted in. */
const PALETTE = {
  // botanicals
  root: 'clay', leaf: 'herb', sprig: 'herb', berry: 'deep', fruit: 'clay',
  seed: 'stone', rhizome: 'gold', flower: 'berry', bark: 'clay', resin: 'amber',
  oil: 'amber', milk: 'stone', honey: 'gold', ghee: 'gold', salt: 'stone',
  grain: 'clay', pod: 'herb', thread: 'stone', wood: 'clay', pepper: 'clay',
  // everything else
  wind: 'cloud', waves: 'water', syringe: 'ink', droplets: 'water', droplet: 'amber',
  feather: 'stone', snowflake: 'water', moon: 'cloud', flame: 'fire', sun: 'gold',
  target: 'rust', thermometer: 'rust', spark: 'fire', anchor: 'ink', hourglass: 'clay',
  bed: 'stone', mountain: 'deep', cloud: 'cloud', pulse: 'rust', eye: 'water',
  clipboard: 'stone', compass: 'deep', checklist: 'deep', pill: 'amber', plate: 'clay',
  calendar: 'stone', clock: 'stone', door: 'clay', people: 'deep', stethoscope: 'water',
  trend: 'deep', sliders: 'stone', sunrise: 'gold', battery: 'amber', rain: 'cloud',
  bone: 'stone', activity: 'deep', foot: 'clay', scale: 'clay', gauge: 'ink',
  ring: 'berry', repeat: 'stone', baby: 'berry', shoot: 'herb', shield: 'deep',
  // drawn here, because nothing else draws them
  spine: 'stone', neck: 'stone', knee: 'stone', nerve: 'rust', ovary: 'berry',
  cycle: 'berry', cramp: 'berry', thyroid: 'rust', intestine: 'clay', nadi: 'amber',
  vasti: 'deep', vamana: 'cloud', virechana: 'amber', nasya: 'water',
  blooddrop: 'berry', belly: 'clay',
};

/** Mark id -> icon-set filename, for the conceptual subjects. */
const ICON_FILE = {
  wind: 'wind', waves: 'waves', syringe: 'syringe', droplets: 'droplets', droplet: 'droplet',
  feather: 'feather', snowflake: 'snowflake', moon: 'moon', flame: 'flame', sun: 'sun',
  target: 'target', thermometer: 'thermometer', spark: 'zap', anchor: 'anchor',
  hourglass: 'hourglass', bed: 'bed', mountain: 'mountain', cloud: 'cloud',
  pulse: 'activity', eye: 'eye', clipboard: 'clipboard-list', compass: 'compass',
  checklist: 'list-checks', pill: 'pill', plate: 'utensils-crossed',
  calendar: 'calendar-days', clock: 'clock', door: 'door-closed', people: 'users',
  stethoscope: 'stethoscope', trend: 'trending-up', sliders: 'settings-2',
  sunrise: 'sunrise', battery: 'battery-low', rain: 'cloud-rain', bone: 'bone',
  activity: 'check-check', foot: 'footprints', scale: 'scale', gauge: 'gauge',
  ring: 'repeat', repeat: 'repeat', baby: 'baby', shoot: 'sprout', shield: 'shield',
};

/* -- source 1: the hand-drawn botanicals --------------------------------- */

/** JSX attribute syntax -> SVG attribute syntax. */
const jsxToSvg = (markup) =>
  markup
    .replace(/fill=\{FILL\}/g, 'fill="INTERIOR"')
    .replace(/\{FILL\}/g, '"INTERIOR"')
    .replace(/([a-z]+[A-Z][a-zA-Z]*)=\{([^}]*)\}/g, (_, name, value) => {
      const attr = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
      return `${attr}="${value.replace(/['"]/g, '').trim()}"`;
    })
    .replace(/\s+/g, ' ')
    .trim();

const readBotanicals = () => {
  const src = readFileSync(BOTANICALS, 'utf8');
  const body = src.slice(src.indexOf('const glyphs'), src.indexOf('/** One ink drawing'));
  const out = {};
  // Each entry is `name: (\n <>...</>\n ),`
  const re = /^\s{2}(?:\/\*[\s\S]*?\*\/\s*)?([a-z]+):\s*\(\s*<>([\s\S]*?)<\/>\s*\),/gm;
  let m;
  while ((m = re.exec(body))) out[m[1]] = jsxToSvg(m[2]);
  return out;
};

/* -- source 2: the icon set --------------------------------------------- */

const readIcon = (file) => {
  const path = join(LUCIDE, `${file}.js`);
  if (!existsSync(path)) throw new Error(`icon not found: ${file}`);
  const src = readFileSync(path, 'utf8');
  const list = src.slice(src.indexOf('", ['), src.lastIndexOf(']);'));
  const nodes = [...list.matchAll(/\[\s*"(\w[\w-]*)"\s*,\s*\{([^}]*)\}\s*\]/g)];
  if (!nodes.length) throw new Error(`no nodes parsed: ${file}`);
  return nodes
    .map(([, tag, attrs]) => {
      const pairs = [...attrs.matchAll(/([\w-]+):\s*(?:"([^"]*)"|([\d.-]+))/g)]
        .filter(([, name]) => name !== 'key')
        .map(([, name, str, num]) => `${name}="${str ?? num}"`)
        .join(' ');
      return `<${tag} ${pairs} />`;
    })
    .join('');
};


/* -- source 3: subjects nothing else draws --------------------------------
 * An icon set has no Nadi pariksha, no Vasti pot and no ovary, and the nearest
 * match is worse than nothing: "cervical pain" was landing on a pair of ticks
 * and "knee pain" on a trail of footprints. These are drawn here, in the same
 * 48-unit box as the botanicals.
 */
const DRAWN = {
  /* Vertebral column — low back pain */
  spine: `<path d="M24 5c-3 0-5 2-5 5s2 5 5 5 5-2 5-5-2-5-5-5Z" fill="INTERIOR"/>
    <path d="M24 15v3M24 22v3M24 29v3M24 36v3"/>
    <path d="M17 19h14a3 3 0 0 1 0 6H17a3 3 0 0 1 0-6Z" fill="INTERIOR"/>
    <path d="M17 26h14a3 3 0 0 1 0 6H17a3 3 0 0 1 0-6Z" fill="INTERIOR"/>
    <path d="M18 33h12a3 3 0 0 1 0 6H18a3 3 0 0 1 0-6Z" fill="INTERIOR"/>
    <path d="M20 41c-1 3 0 5 4 5s5-2 4-5"/>`,

  /* Head over cervical vertebrae — neck and shoulder pain */
  neck: `<path d="M24 4c-6 0-10 4-10 9s4 9 10 9 10-4 10-9-4-9-10-9Z" fill="INTERIOR"/>
    <path d="M18 24h12a3 3 0 0 1 0 6H18a3 3 0 0 1 0-6Z" fill="INTERIOR"/>
    <path d="M17 31h14a3 3 0 0 1 0 6H17a3 3 0 0 1 0-6Z" fill="INTERIOR"/>
    <path d="M10 44c3-4 8-6 14-6s11 2 14 6"/>
    <path d="M36 20c3 1 5 3 6 6M12 20c-3 1-5 3-6 6"/>`,

  /* Knee joint — femur, condyles, tibia */
  knee: `<path d="M19 4h10v13c4 2 6 5 6 9 0 4-3 7-11 7s-11-3-11-7c0-4 2-7 6-9Z" fill="INTERIOR"/>
    <path d="M14 34c0 5 4 8 10 8s10-3 10-8" />
    <path d="M19 42v6h10v-6"/>
    <path d="M17 28c4 2 10 2 14 0"/>`,

  /* Leg with the sciatic line running down it */
  nerve: `<path d="M20 5c5 0 8 3 8 8 0 5-4 8-4 13 0 6 5 9 5 15 0 4-3 7-8 7" fill="none" stroke-width="2.6"/>
    <path d="M28 13c3-1 6 0 8 3M25 26c3 0 6 2 7 5M27 41c3 0 5 1 7 3" stroke-dasharray="1.5 3.5"/>
    <circle cx="20" cy="5" r="3" fill="INTERIOR"/>`,

  /* Ovary with follicles */
  ovary: `<path d="M24 10c9 0 15 6 15 14s-6 14-15 14-15-6-15-14 6-14 15-14Z" fill="INTERIOR"/>
    <circle cx="19" cy="21" r="3"/><circle cx="29" cy="20" r="2.4"/>
    <circle cx="18" cy="30" r="2.4"/><circle cx="29" cy="29" r="3"/><circle cx="24" cy="25" r="2"/>
    <path d="M24 10V5M24 38v5"/>`,

  /* A cycle that does not close */
  cycle: `<path d="M38 24a14 14 0 1 1-6-11.5" fill="none"/>
    <path d="M31 5v8h-8"/>
    <circle cx="24" cy="24" r="4" fill="INTERIOR"/>`,

  /* Womb with radiating pain */
  cramp: `<path d="M17 16c0 12 3 20 7 24 4-4 7-12 7-24Z" fill="INTERIOR"/>
    <path d="M17 16c-4-1-7-4-8-8 5-1 8 1 10 5M31 16c4-1 7-4 8-8-5-1-8 1-10 5"/>
    <path d="M11 26c-2 2-3 4-3 7M37 26c2 2 3 4 3 7M24 44v4"/>`,

  /* Thyroid gland at the throat */
  thyroid: `<path d="M24 18c5-4 12-4 15 1 3 6 0 14-6 15-5 1-8-3-9-9Z" fill="INTERIOR"/>
    <path d="M24 18c-5-4-12-4-15 1-3 6 0 14 6 15 5 1 8-3 9-9Z" fill="INTERIOR"/>
    <path d="M24 18v10"/>
    <path d="M18 6c0 4 2 6 6 6s6-2 6-6"/>`,

  /* Coiled intestine */
  intestine: `<path d="M24 6c-9 0-15 6-15 14 0 7 5 12 11 12 5 0 8-3 8-7s-3-6-6-6-5 2-5 5"/>
    <path d="M30 28c5 1 8 5 8 10s-4 8-9 8"/>
    <path d="M15 41c3 2 7 3 11 3"/>`,

  /* Three fingers on a wrist — Nadi pariksha */
  nadi: `<path d="M12 30h24a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H12a5 5 0 0 1-5-5v-2a5 5 0 0 1 5-5Z" fill="INTERIOR"/>
    <path d="M15 8h5v14a2.5 2.5 0 0 1-5 0ZM22 5h5v17a2.5 2.5 0 0 1-5 0ZM29 8h5v14a2.5 2.5 0 0 1-5 0Z"/>
    <path d="M9 36h6l2-4 3 8 3-9 2 5h14"/>`,

  /* Vasti pot with its tube */
  vasti: `<path d="M17 10h14l-2 6c5 3 8 8 8 14 0 7-6 12-13 12s-13-5-13-12c0-6 3-11 8-14Z" fill="INTERIOR"/>
    <path d="M15 10h18"/>
    <path d="M24 42c0 3 2 5 6 5s6-2 6-5"/>
    <path d="M20 26c3 2 6 2 9 0"/>`,

  /* Vamana — what rises out of the vessel */
  vamana: `<path d="M13 26h22c0 9-5 15-11 15s-11-6-11-15Z" fill="INTERIOR"/>
    <path d="M10 26h28"/>
    <path d="M24 20V6M24 6l-5 5M24 6l5 5"/>
    <path d="M16 20c-1-3-1-6 1-8M32 20c1-3 1-6-1-8" stroke-dasharray="1.5 3"/>`,

  /* Virechana — what leaves downward */
  virechana: `<path d="M13 7h22c0 9-5 15-11 15S13 16 13 7Z" fill="INTERIOR"/>
    <path d="M10 7h28"/>
    <path d="M24 26v16M24 42l-5-5M24 42l5-5"/>
    <path d="M16 28c-1 3-1 6 1 8M32 28c1 3 1 6-1 8" stroke-dasharray="1.5 3"/>`,

  /* Nasya — drops into the nose */
  nasya: `<path d="M30 6c-8 3-13 11-13 20 0 4-2 6-5 7 3 2 5 4 5 8h14" fill="INTERIOR"/>
    <path d="M17 33c3 2 7 2 10 0"/>
    <path d="M36 8c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9Z" fill="INTERIOR"/>
    <path d="M33 26c0 2 0 3 1 4"/>`,

  /* Raktamokshana — a drop and the lancet */
  blooddrop: `<path d="M22 8c7 9 11 15 11 20 0 6-5 11-11 11s-11-5-11-11c0-5 4-11 11-20Z" fill="INTERIOR"/>
    <path d="M16 29c0 4 2 6 5 7"/>
    <path d="M34 6l8 8M42 14l-5 2 2-5Z"/>`,

  /* Distended abdomen */
  belly: `<path d="M16 8h16l3 10c4 3 6 8 6 13 0 8-7 14-17 14S7 39 7 31c0-5 2-10 6-13Z" fill="INTERIOR"/>
    <path d="M13 25c7-3 15-3 22 0"/>
    <path d="M20 33a4 3 0 0 0 8 0"/>
    <path d="M42 20c2 2 3 4 3 6M6 20c-2 2-3 4-3 6"/>`,
};

/* -- compose ------------------------------------------------------------- */

/**
 * `box` is the drawing's native side length: the botanicals are drawn in 48,
 * the icon set in 24. Both are scaled into a 44-unit window inside a 64-unit
 * canvas, so every subject ends up the same visual weight.
 */
const compose = (markup, palette, box) => {
  const c = P[palette];
  const scale = 42 / box;
  const width = (box === 24 ? 1.95 : 2.05) / scale;
  const inner = markup.replace(/INTERIOR/g, 'url(#interior)');
  const shadow = markup.replace(/INTERIOR/g, '#0a1a12');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="line" x1="0.15" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${c.l}"/><stop offset="1" stop-color="${c.d}"/>
    </linearGradient>
    <linearGradient id="interior" x1="0.2" y1="0" x2="0.55" y2="1">
      <stop offset="0" stop-color="${c.f1}" stop-opacity="0.82"/>
      <stop offset="1" stop-color="${c.f2}" stop-opacity="0.52"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.36" cy="0.3" r="0.72">
      <stop offset="0" stop-color="${c.f1}" stop-opacity="0.3"/>
      <stop offset="1" stop-color="${c.f2}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="rim" x1="0.2" y1="0" x2="0.5" y2="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <circle cx="31" cy="30" r="31" fill="url(#halo)"/>

  <g transform="translate(11 11) scale(${scale.toFixed(4)})" fill="none"
     stroke-width="${width.toFixed(2)}" stroke-linecap="round" stroke-linejoin="round">
    <g stroke="#07130d" stroke-opacity="0.28" transform="translate(0.7 1.5)">${shadow}</g>
    <g stroke="url(#line)">${inner}</g>
    <g stroke="url(#rim)" stroke-width="${(width * 0.34).toFixed(2)}"
       transform="translate(-0.35 -0.7)" opacity="0.85">${markup.replace(/INTERIOR/g, 'none')}</g>
  </g>
</svg>`;
};

/* -- write --------------------------------------------------------------- */

const botanicals = readBotanicals();
mkdirSync(OUT, { recursive: true });

const subjects = new Map();
for (const [id, markup] of Object.entries(botanicals)) subjects.set(id, { markup, box: 48 });
for (const [id, markup] of Object.entries(DRAWN)) subjects.set(id, { markup, box: 48 });
for (const [id, file] of Object.entries(ICON_FILE)) {
  if (subjects.has(id)) continue; // anything drawn by hand always wins
  subjects.set(id, { markup: readIcon(file), box: 24 });
}

let written = 0;
let bytes = 0;
const missing = [];
for (const [id, { markup, box }] of subjects) {
  const palette = PALETTE[id];
  if (!palette) {
    missing.push(id);
    continue;
  }
  const svg = compose(markup, palette, box);
  const file = join(OUT, `${id}.webp`);
  await sharp(Buffer.from(svg), { density: 384 })
    .resize({ width: 160, height: 160, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, effort: 6, alphaQuality: 90 })
    .toFile(file);
  bytes += statSync(file).size;
  written++;
}

if (missing.length) console.warn(`[marks] no palette for: ${missing.join(', ')}`);
console.log(`[marks] wrote ${written} WebP files — ${(bytes / 1024).toFixed(0)} KB total.`);
