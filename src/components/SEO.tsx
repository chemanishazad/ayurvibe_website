import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  robots?: string;
  type?: 'website' | 'article';
  publishedTime?: string; // ISO
  modifiedTime?: string; // ISO
  authorName?: string;
  siteName?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, any> | Record<string, any>[]; // allow custom injection
}

// Enhanced client-side SEO helper. For maximal SEO consider SSR or prerender.
export const SEO = ({
  title,
  description,
  canonical,
  image = '/logo.png',
  robots,
  type = 'website',
  publishedTime,
  modifiedTime,
  authorName,
  siteName = 'Sri Vinayaga Ayurvibe',
  noIndex,
  jsonLd
}: SEOProps) => {
  useEffect(() => {
    const doc = document;
    if (title) {
      doc.title = title;
    }
    const ensure = (selector: string, create: () => HTMLElement) => {
      let el = doc.head.querySelector(selector) as HTMLElement | null;
      if (!el) {
        el = create();
        doc.head.appendChild(el);
      }
      return el;
    };
    const setMeta = (name: string, content?: string) => {
      if (!content) return;
      const el = ensure(`meta[name='${name}']`, () => {
        const m = doc.createElement('meta');
        m.setAttribute('name', name);
        return m;
      }) as HTMLMetaElement;
      el.content = content;
    };
    const setProperty = (property: string, content?: string) => {
      if (!content) return;
      const el = ensure(`meta[property='${property}']`, () => {
        const m = doc.createElement('meta');
        m.setAttribute('property', property);
        return m;
      }) as HTMLMetaElement;
      el.content = content;
    };

    // Basic meta
    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex,nofollow' : robots || 'index,follow');
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    if (image) setMeta('twitter:image', image);

    // Open Graph
    setProperty('og:type', type);
    setProperty('og:title', title);
    setProperty('og:description', description);
    setProperty('og:image', image);
    setProperty('og:site_name', siteName);
    if (canonical) setProperty('og:url', canonical);

    if (type === 'article') {
      if (publishedTime) setProperty('article:published_time', publishedTime);
      if (modifiedTime) setProperty('article:modified_time', modifiedTime || publishedTime);
      if (authorName) setProperty('article:author', authorName);
    }

    if (canonical) {
      const link = ensure("link[rel='canonical']", () => {
        const l = doc.createElement('link');
        l.rel = 'canonical';
        return l;
      }) as HTMLLinkElement;
      link.href = canonical;
    }

    // JSON-LD injection (merge base WebSite / optional Article / custom)
    const ldKey = 'dynamic-seo-jsonld';
    // Remove old script if present to avoid stacking
    const prev = doc.getElementById(ldKey);
    if (prev) prev.remove();

    const graph: any[] = [];
    // Base WebSite / Organization (lightweight; more detailed static in index.html is fine)
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': siteName,
      'url': canonical || window.location.href
    });
    if (type === 'article' && title) {
      graph.push({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': title,
        'description': description,
        'image': image ? [image] : undefined,
        'author': authorName ? { '@type': 'Person', 'name': authorName } : undefined,
        'datePublished': publishedTime,
        'dateModified': modifiedTime || publishedTime,
        'mainEntityOfPage': canonical || window.location.href
      });
    }
    if (jsonLd) {
      if (Array.isArray(jsonLd)) graph.push(...jsonLd); else graph.push(jsonLd);
    }
    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.id = ldKey;
    script.textContent = JSON.stringify(graph.filter(Boolean));
    doc.head.appendChild(script);
  }, [title, description, canonical, image, robots, type, publishedTime, modifiedTime, authorName, siteName, noIndex, jsonLd]);

  return null;
};

export default SEO;
