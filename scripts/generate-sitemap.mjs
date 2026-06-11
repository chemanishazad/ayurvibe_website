#!/usr/bin/env node
/**
 * Sitemap generator for the SPA.
 * Builds sitemap.xml (and split static/blog sitemaps + index) into public/,
 * and also into dist/ when run post-build.
 *
 * Route list comes from scripts/seo-routes.mjs (single source of truth shared
 * with the prerenderer), so sitemaps can never drift from prerendered pages.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { allRoutes, blogRouteList, BASE_URL } from './seo-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);

const buildRunTime = new Date();
const buildRunTimeISO = buildRunTime.toISOString();

const writeXmlFile = (dir, name, xml) => {
  writeFileSync(join(dir, name), xml, 'utf8');
  try {
    writeFileSync(join(dir, name + '.gz'), gzipSync(Buffer.from(xml)));
  } catch (e) {
    console.warn('Gzip failed for', name, e.message);
  }
};

const blogPaths = new Set(blogRouteList.map((b) => b.path));

const staticRouteEntries = allRoutes
  .filter((r) => !blogPaths.has(r.path))
  .map((r) => ({
    loc: r.path,
    lastmod: buildRunTimeISO,
    priority: r.priority || '0.7',
    changefreq: r.changefreq || 'weekly',
  }));

const blogRouteEntries = blogRouteList.map((b) => ({
  loc: b.path,
  lastmod: b.lastmod || buildRunTimeISO,
  priority: b.priority || '0.7',
  changefreq: b.changefreq || 'monthly',
  image: b.image,
  title: b.heading || b.title,
}));

const urlTag = (u) => {
  const imagePart = u.image
    ? `\n    <image:image>\n      <image:loc>${u.image}</image:loc>\n      <image:title><![CDATA[${u.title}]]></image:title>\n    </image:image>`
    : '';
  return `  <url>\n    <loc>${BASE_URL}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>${imagePart}\n  </url>`;
};

const buildUrlset = (entries) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  entries.map(urlTag).join('\n') +
  '\n</urlset>\n';

const staticXml = buildUrlset(staticRouteEntries);
const blogXml = buildUrlset(blogRouteEntries);
const combinedXml = buildUrlset([...staticRouteEntries, ...blogRouteEntries]);

const sitemapIndexXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [
    { loc: `${BASE_URL}/sitemap.xml`, lastmod: buildRunTimeISO },
    { loc: `${BASE_URL}/sitemap-static.xml`, lastmod: buildRunTimeISO },
    { loc: `${BASE_URL}/sitemap-blog.xml`, lastmod: buildRunTimeISO },
  ]
    .map((s) => `  <sitemap><loc>${s.loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>`)
    .join('\n') +
  '\n</sitemapindex>\n';

const writeAll = (dir) => {
  writeXmlFile(dir, 'sitemap.xml', combinedXml);
  writeXmlFile(dir, 'sitemap-static.xml', staticXml);
  writeXmlFile(dir, 'sitemap-blog.xml', blogXml);
  writeXmlFile(dir, 'sitemap_index.xml', sitemapIndexXml);
};

const publicDir = join(ROOT, 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
writeAll(publicDir);

const distDir = join(ROOT, 'dist');
if (existsSync(distDir)) writeAll(distDir);

console.log('Sitemaps generated:', {
  static: staticRouteEntries.length,
  blog: blogRouteEntries.length,
  combined: staticRouteEntries.length + blogRouteEntries.length,
});
