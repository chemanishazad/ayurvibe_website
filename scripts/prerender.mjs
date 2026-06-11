#!/usr/bin/env node
/**
 * Build-time prerenderer for the SPA.
 *
 * Runs AFTER `vite build`. For every public route it clones dist/index.html and
 * bakes route-specific <head> tags (title, description, canonical, OG/Twitter,
 * JSON-LD) plus a crawler-visible static content block into #root. The React
 * app still boots and hydrates over the snapshot, so behaviour is unchanged for
 * real users — but Googlebot, Bing, social and AI crawlers get correct,
 * route-specific HTML on the first request without executing JS.
 *
 * No headless browser / extra dependency required.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
  allRoutes,
  BASE_URL,
  SITE_NAME,
  DEFAULT_IMAGE,
} from './seo-routes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const DIST = join(ROOT, 'dist');

const TEMPLATE_PATH = join(DIST, 'index.html');
if (!existsSync(TEMPLATE_PATH)) {
  console.error('[prerender] dist/index.html not found — run `vite build` first.');
  process.exit(1);
}
const template = readFileSync(TEMPLATE_PATH, 'utf8');

// --- helpers -------------------------------------------------------------
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const abs = (p) => (p.startsWith('http') ? p : `${BASE_URL}${p}`);

/** Replace, or insert before </head>, a tag matched by `regex`. */
const upsert = (html, regex, tag) =>
  regex.test(html) ? html.replace(regex, tag) : html.replace('</head>', `  ${tag}\n</head>`);

const setTitle = (html, title) =>
  html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);

const setMetaName = (html, name, content) =>
  upsert(
    html,
    new RegExp(`<meta\\s+name=["']${name}["'][^>]*>`, 'i'),
    `<meta name="${name}" content="${esc(content)}" />`
  );

const setMetaProp = (html, property, content) =>
  upsert(
    html,
    new RegExp(`<meta\\s+property=["']${property}["'][^>]*>`, 'i'),
    `<meta property="${property}" content="${esc(content)}" />`
  );

const setCanonical = (html, href) =>
  upsert(
    html,
    /<link\s+rel=["']canonical["'][^>]*>/i,
    `<link rel="canonical" href="${esc(href)}" />`
  );

/** Build the static, crawler-visible content block injected into #root. */
const renderBody = (route) => {
  const paras = (route.body || []).map((p) => `<p>${esc(p)}</p>`).join('\n      ');
  const links = (route.links || [])
    .map((l) => `<li><a href="${esc(l.href)}">${esc(l.text)}</a></li>`)
    .join('\n        ');
  const linkBlock = links ? `\n      <ul>\n        ${links}\n      </ul>` : '';
  // Shared site nav helps crawlers discover all sections from any page.
  const nav = [
    ['/', 'Home'],
    ['/about', 'About'],
    ['/treatments', 'Treatments'],
    ['/doctors', 'Doctor'],
    ['/dosha', 'Dosha Quiz'],
    ['/blog', 'Blog'],
    ['/faq', 'FAQ'],
    ['/booking', 'Book Appointment'],
  ]
    .map(([h, t]) => `<a href="${h}">${t}</a>`)
    .join(' · ');
  return `
    <div data-prerendered="true">
      <nav aria-label="Primary">${nav}</nav>
      <h1>${esc(route.heading || route.title)}</h1>
      ${paras}${linkBlock}
      <p><strong>${esc(SITE_NAME)}</strong> — 12/597, Main Road, Nethaji Nagar Main Rd,
      Nookampalayam, Perumbakkam, Chennai 600131. Phone:
      <a href="tel:+918122939197">+91 81229 39197</a>.</p>
    </div>`;
};

/** Per-route JSON-LD: WebPage (+ Article for blog posts), linked to the business. */
const renderJsonLd = (route, url) => {
  const graph = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: route.title,
      description: route.description,
      url,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: `${BASE_URL}/` },
      about: { '@type': 'MedicalBusiness', '@id': `${BASE_URL}/#business` },
    },
  ];
  if (route.type === 'article') {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: route.heading || route.title,
      description: route.description,
      image: route.image ? [route.image] : [DEFAULT_IMAGE],
      datePublished: route.publishedTime,
      dateModified: route.publishedTime,
      mainEntityOfPage: url,
      publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: DEFAULT_IMAGE } },
    });
  }
  return `<script type="application/ld+json" id="prerender-jsonld">${JSON.stringify(graph)}</script>`;
};

const buildPage = (route) => {
  const url = route.path === '/' ? `${BASE_URL}/` : abs(route.path);
  const image = route.image ? abs(route.image) : DEFAULT_IMAGE;
  const ogType = route.type === 'article' ? 'article' : 'website';

  let html = template;
  html = setTitle(html, route.title);
  html = setMetaName(html, 'description', route.description);
  html = setCanonical(html, url);

  html = setMetaProp(html, 'og:title', route.title);
  html = setMetaProp(html, 'og:description', route.description);
  html = setMetaProp(html, 'og:url', url);
  html = setMetaProp(html, 'og:type', ogType);
  html = setMetaProp(html, 'og:image', image);

  html = setMetaName(html, 'twitter:title', route.title);
  html = setMetaName(html, 'twitter:description', route.description);
  html = setMetaName(html, 'twitter:image', image);

  // Inject route JSON-LD just before </head> (in addition to the static
  // business/FAQ schema already present in the template).
  html = html.replace('</head>', `  ${renderJsonLd(route, url)}\n</head>`);

  // Seed #root with crawler-visible content. React replaces it on mount.
  html = html.replace(
    /<div id="root">\s*<\/div>/,
    `<div id="root">${renderBody(route)}</div>`
  );

  return html;
};

// --- write pages ---------------------------------------------------------
let written = 0;
for (const route of allRoutes) {
  const html = buildPage(route);
  // "/" overwrites dist/index.html; others go to dist/<path>/index.html
  const outDir = route.path === '/' ? DIST : join(DIST, route.path);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html, 'utf8');
  written++;
}

console.log(`[prerender] wrote ${written} route HTML files into dist/`);
