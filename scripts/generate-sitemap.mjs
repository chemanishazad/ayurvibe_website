#!/usr/bin/env node
/**
 * Simple sitemap generator for the SPA.
 * Builds a sitemap.xml inside public/ so Vite copies it OR directly into dist/ if it exists post-build.
 */
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { blogPosts, slugify } from '../src/content/blogPosts.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname); // project root
const BASE_URL = process.env.SITE_URL || 'https://svayurvibe.com';

// Static routes (avoid duplicates of root sections; each section has its own pretty path)
const staticRoutes = [
  '/',
  '/about',
  '/treatments',
  '/doctors',
  '/testimonials',
  '/why-ayurveda-hospital',
  '/dosha',
  '/blog',
  '/faq',
  '/booking'
];

const blogRoutes = blogPosts.map(p => `/blog/${p.id}/${slugify(p.title)}`);

const urls = [...staticRoutes, ...blogRoutes];

const lastmod = new Date().toISOString();
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${BASE_URL}${u}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>${u==='/'? '1.0':'0.7'}</priority></url>`).join('\n') +
  '\n</urlset>\n';

// Prefer writing to public/ so it's included in future builds.
const publicDir = join(ROOT, 'public');
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
writeFileSync(join(publicDir, 'sitemap.xml'), xml, 'utf8');

// If dist exists (script executed post-build) also copy there for immediate deploy
const distDir = join(ROOT, 'dist');
if (existsSync(distDir)) {
  writeFileSync(join(distDir, 'sitemap.xml'), xml, 'utf8');
}

console.log('Sitemap generated with', urls.length, 'URLs.');
