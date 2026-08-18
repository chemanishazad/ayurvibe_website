#!/usr/bin/env node
/**
 * Image pipeline for the public site.
 *
 * The design renders are 2 MB+ each and carry two pieces of baked-in furniture
 * that must not reach the page: a "Sri Vinayaga AyurVibe Clinic" sign across the
 * top of every therapy photo, and the therapy name captioned across the bottom.
 * Both duplicate what the card markup already says, and cropping them out is
 * what makes a grid of 33 photos look composed rather than stamped.
 *
 * So each master is:
 *   1. cropped to a window that excludes the sign and the caption,
 *   2. squared off to the aspect the layout actually uses,
 *   3. graded — the renders are very warm and dark, which reads as muddy next to
 *      a white clinical UI, so this lifts brightness, trims the amber cast and
 *      adds a little contrast and sharpness,
 *   4. written at the two widths the site requests.
 *
 * Outputs:
 *   src/assets/treatments/<slug>.webp       900w, 4:3   (details dialog)
 *   src/assets/treatments/<slug>-480.webp   480w, 4:3   (grid cards)
 *   public/hero/<id>-{700,1100,1800}.webp          4:5  (hero gallery)
 *   public/hero/<id>-wide-{900,1400}.webp          4:3  (in-page scenes)
 *
 * Usage:  npm run images        (requires the optional `sharp` devDependency)
 */
import { readdirSync, existsSync, mkdirSync, statSync } from 'fs';
import { dirname, join, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

let sharp;
try {
  ({ default: sharp } = await import('sharp'));
} catch {
  console.error(
    '[images] `sharp` is not installed.\n' +
      '         Run `npm install` (it is listed as a devDependency) and try again.'
  );
  process.exit(1);
}

const TREATMENTS = join(ROOT, 'src/assets/treatments');
const ASSETS = join(ROOT, 'src/assets');
const HERO_OUT = join(ROOT, 'public/hero');

/** Crop window shared by the therapy renders, as fractions of the master. */
const THERAPY_WINDOW = { left: 0, right: 1, top: 0.33, bottom: 0.85 };

/** Renders that need their own window (stray diagram labels, odd framing). */
const THERAPY_OVERRIDES = {
  'matra-vasti': { left: 0, right: 0.8, top: 0.3, bottom: 0.66 },
};

/** Hero frames. The therapy renders carry a large watermark on the left third. */
const HERO_SOURCES = {
  hospital: { file: 'hospital-exterior.jpg', left: 0, grade: 0.5 },
  panchakarma: { file: 'panchakarma-treatment.png', left: 0.4, grade: 1 },
  shirodhara: { file: 'shirodhara-therapy.png', left: 0.4, grade: 1 },
  abhyanga: { file: 'abhyanga-massage.png', left: 0.4, grade: 1 },
  herbs: { file: 'ayurvedic-herbs.jpg', left: 0, grade: 0.4 },
};

/** In-page imagery imported directly by components. */
const INLINE = [
  { src: 'dr-vaitheeshwari.jpg', out: 'dr-vaitheeshwari.webp', width: 760, ratio: 1, quality: 80, grade: 0.4 },
  { src: 'hospital-exterior.jpg', out: 'hospital-exterior.webp', width: 1400, ratio: 4 / 3, quality: 76, grade: 0.5 },
  { src: 'ayurvedic-herbs.jpg', out: 'ayurvedic-herbs.webp', width: 1200, ratio: 4 / 3, quality: 78, grade: 0.4 },
  { src: 'panchakarma-treatment.png', out: 'panchakarma-treatment.webp', width: 1400, ratio: 4 / 3, quality: 76, grade: 1, left: 0.4 },
];

let written = 0;
let bytesIn = 0;
let bytesOut = 0;

/** Pixel crop box for a window expressed in fractions, squared to `ratio`. */
const boxFor = (meta, window, ratio, anchorX = 0.5) => {
  const left = Math.round(meta.width * (window.left ?? 0));
  const right = Math.round(meta.width * (window.right ?? 1));
  const top = Math.round(meta.height * (window.top ?? 0));
  const bottom = Math.round(meta.height * (window.bottom ?? 1));
  let w = right - left;
  let h = bottom - top;
  let x = left;
  let y = top;

  if (w / h > ratio) {
    const nw = Math.round(h * ratio);
    x = left + Math.round((w - nw) * anchorX);
    w = nw;
  } else {
    const nh = Math.round(w / ratio);
    h = nh;
  }
  return { left: x, top: y, width: w, height: h };
};

/**
 * Warm renders next to white UI look muddy; `strength` scales a lift in
 * brightness, a small drop in saturation and a nudge away from the amber cast.
 */
const graded = (pipeline, strength = 1) =>
  pipeline
    .modulate({ brightness: 1 + 0.12 * strength, saturation: 1 - 0.08 * strength })
    .linear(1 + 0.1 * strength, -(128 * 0.1 * strength))
    .gamma(1 + 0.001)
    .sharpen({ sigma: 0.6 });

const emit = async (srcPath, outPath, { window, ratio, width, quality, grade: g = 1, anchorX = 0.5 }) => {
  if (!existsSync(srcPath)) {
    console.warn(`[images] missing source, skipped: ${basename(srcPath)}`);
    return;
  }
  const input = sharp(srcPath);
  const meta = await input.metadata();
  const box = boxFor(meta, window, ratio, anchorX);
  mkdirSync(dirname(outPath), { recursive: true });
  await graded(sharp(srcPath).extract(box).resize({ width, height: Math.round(width / ratio) }), g)
    .webp({ quality, effort: 6 })
    .toFile(outPath);
  bytesIn += statSync(srcPath).size;
  bytesOut += statSync(outPath).size;
  written++;
};

// 1. Therapy cards
const masters = existsSync(TREATMENTS)
  ? readdirSync(TREATMENTS).filter((f) => /\.(png|jpe?g)$/i.test(f))
  : [];
for (const file of masters) {
  const slug = basename(file, extname(file));
  const window = THERAPY_OVERRIDES[slug] ?? THERAPY_WINDOW;
  await emit(join(TREATMENTS, file), join(TREATMENTS, `${slug}.webp`), {
    window, ratio: 4 / 3, width: 900, quality: 76,
  });
  await emit(join(TREATMENTS, file), join(TREATMENTS, `${slug}-480.webp`), {
    window, ratio: 4 / 3, width: 480, quality: 74,
  });
}

// 2. Hero frames — 4:5 portrait for the gallery, 4:3 for in-page scenes
for (const [id, cfg] of Object.entries(HERO_SOURCES)) {
  const src = join(ASSETS, cfg.file);
  const window = { left: cfg.left, right: 1, top: 0, bottom: 1 };
  for (const width of [700, 1100, 1800]) {
    await emit(src, join(HERO_OUT, `${id}-${width}.webp`), {
      window, ratio: 4 / 5, width, quality: 74, grade: cfg.grade,
    });
  }
  for (const width of [900, 1400]) {
    await emit(src, join(HERO_OUT, `${id}-wide-${width}.webp`), {
      window, ratio: 4 / 3, width, quality: 74, grade: cfg.grade,
    });
  }
}

// 3. Inline imagery
for (const item of INLINE) {
  await emit(join(ASSETS, item.src), join(ASSETS, item.out), {
    window: { left: item.left ?? 0, right: 1, top: 0, bottom: 1 },
    ratio: item.ratio,
    width: item.width,
    quality: item.quality,
    grade: item.grade,
  });
}

const mb = (n) => (n / 1e6).toFixed(2);
console.log(`[images] wrote ${written} WebP files — ${mb(bytesIn)} MB of sources -> ${mb(bytesOut)} MB shipped.`);
