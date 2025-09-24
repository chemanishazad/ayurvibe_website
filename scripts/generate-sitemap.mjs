#!/usr/bin/env node
/**
 * Simple sitemap generator for the SPA.
 * Builds a sitemap.xml inside public/ so Vite copies it OR directly into dist/ if it exists post-build.
 */
import { writeFileSync, existsSync, mkdirSync, createWriteStream } from 'fs';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { blogPosts, slugify } from '../src/content/blogPosts.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname); // project root
const BASE_URL = process.env.SITE_URL || 'https://svayurvibe.com';

// Build metadata
const buildRunTime = new Date();
const buildRunTimeISO = buildRunTime.toISOString();

// Helper to write (and gzip) a file
const writeXmlFile = (dir, name, xml) => {
  writeFileSync(join(dir, name), xml, 'utf8');
  try {
    const gz = gzipSync(Buffer.from(xml));
    writeFileSync(join(dir, name + '.gz'), gz);
  } catch (e) {
    console.warn('Gzip failed for', name, e.message);
  }
};

// Canonical static pages
const staticPages = [
  { loc: '/', priority: '1.0', changefreq: 'daily' },
  { loc: '/about' },
  { loc: '/treatments' },
  { loc: '/doctors' },
  { loc: '/testimonials' },
  { loc: '/why-ayurveda-hospital' },
  { loc: '/dosha' },
  { loc: '/blog' },
  { loc: '/faq' },
  { loc: '/booking' }
];

const staticRouteEntries = staticPages.map(p => ({
  loc: p.loc,
  lastmod: buildRunTimeISO,
  priority: p.priority || '0.7',
  changefreq: p.changefreq || 'weekly'
}));

// Blog posts (include publication date + potential image reference if available)
const blogRouteEntries = blogPosts.map(p => {
  let d = new Date(p.date);
  if (isNaN(d.getTime())) d = buildRunTime;
  const slug = slugify(p.title);
  const loc = `/blog/${p.id}/${slug}`;
  return {
    loc,
    lastmod: new Date(Math.max(d.getTime(), buildRunTime.getTime() - 1000)).toISOString(),
    priority: '0.7',
    changefreq: 'monthly',
    image: p.image ? `${BASE_URL}${p.image.startsWith('/') ? p.image : '/' + p.image}` : undefined,
    title: p.title
  };
});

// Serialize helpers
const urlTag = (u) => {
  const imagePart = u.image ? `\n    <image:image>\n      <image:loc>${u.image}</image:loc>\n      <image:title><![CDATA[${u.title}]]></image:title>\n    </image:image>` : '';
  return `  <url>\n    <loc>${BASE_URL}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>${imagePart}\n  </url>`;
};

const buildUrlset = (entries) => `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  entries.map(urlTag).join('\n') + '\n</urlset>\n';

// Generate individual sitemaps
const staticXml = buildUrlset(staticRouteEntries);
const blogXml = buildUrlset(blogRouteEntries);
const combinedXml = buildUrlset([...staticRouteEntries, ...blogRouteEntries]);

// Sitemap index referencing separate files (and retain combined root for backward compatibility)
const sitemapIndexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  [
    { loc: `${BASE_URL}/sitemap.xml`, lastmod: buildRunTimeISO }, // combined
    { loc: `${BASE_URL}/sitemap-static.xml`, lastmod: buildRunTimeISO },
    { loc: `${BASE_URL}/sitemap-blog.xml`, lastmod: buildRunTimeISO }
  ].map(s => `  <sitemap><loc>${s.loc}</loc><lastmod>${s.lastmod}</lastmod></sitemap>`).join('\n') +
  '\n</sitemapindex>\n';

// Prefer writing to public/ so it's included in future builds.
const publicDir = join(ROOT, 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
writeXmlFile(publicDir, 'sitemap.xml', combinedXml);
writeXmlFile(publicDir, 'sitemap-static.xml', staticXml);
writeXmlFile(publicDir, 'sitemap-blog.xml', blogXml);
writeXmlFile(publicDir, 'sitemap_index.xml', sitemapIndexXml);

// If dist exists (script executed post-build) also copy there for immediate deploy
const distDir = join(ROOT, 'dist');
if (existsSync(distDir)) {
  writeXmlFile(distDir, 'sitemap.xml', combinedXml);
  writeXmlFile(distDir, 'sitemap-static.xml', staticXml);
  writeXmlFile(distDir, 'sitemap-blog.xml', blogXml);
  writeXmlFile(distDir, 'sitemap_index.xml', sitemapIndexXml);
}
console.log('Sitemaps generated:', {
  static: staticRouteEntries.length,
  blog: blogRouteEntries.length,
  combined: staticRouteEntries.length + blogRouteEntries.length,
  files: ['sitemap.xml', 'sitemap-static.xml', 'sitemap-blog.xml', 'sitemap_index.xml']
});
