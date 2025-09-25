import { useEffect } from 'react';
import { logoPath } from '@/components/Logo';

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
  locationKeywords?: string[]; // Add location-specific keywords
}

// Enhanced client-side SEO helper. For maximal SEO consider SSR or prerender.
export const SEO = ({
  title,
  description,
  canonical,
  image = logoPath,
  robots,
  type = 'website',
  publishedTime,
  modifiedTime,
  authorName,
  siteName = 'Sri Vinayaga Ayurvibe',
  noIndex,
  jsonLd,
  locationKeywords = ['Perumbakkam', 'OMR', 'Sholinganallur', 'Pallikaranai', 'Navalur', 'Kelambakkam', 'Tambaram', 'Chennai']
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

    // Normalize image to absolute URL for social crawlers
    const resolvedImage = image
      ? (image.startsWith('http') ? image : `${window.location.origin}${image.startsWith('/') ? image : '/' + image}`)
      : undefined;

    // Basic meta
    setMeta('description', description);
    setMeta('robots', noIndex ? 'noindex,nofollow' : robots || 'index,follow');
    
    // Add comprehensive location-specific keywords
    if (locationKeywords && locationKeywords.length > 0) {
      const baseKeywords = [
        'Ayurveda hospital Chennai', 'best Ayurveda clinic Chennai', 'top Ayurveda center Chennai',
        'Panchakarma treatment Chennai', 'Abhyanga massage Chennai', 'Shirodhara therapy Chennai',
        'Dr Vaitheeshwari Ayurveda doctor', 'BAMS doctor Chennai', 'Ayurvedic doctor Chennai',
        'detox treatment Chennai', 'holistic wellness Chennai', 'traditional medicine Chennai',
        'Ayurvedic medicine Chennai', 'alternative medicine Chennai', 'wellness therapy Chennai',
        'stress management Chennai', 'chronic disease management Chennai', 'women health Chennai',
        'digestive disorders Chennai', 'skin health Chennai', 'mental health Chennai',
        'government certified Ayurveda hospital', 'authentic Ayurveda treatment Chennai',
        'Ayurvedic detox Chennai', 'rejuvenation therapy Chennai', 'herbal medicine Chennai'
      ];
      
      const locationSpecificKeywords = locationKeywords.flatMap(loc => [
        `Ayurveda hospital ${loc}`, `Ayurveda clinic ${loc}`, `best Ayurveda ${loc}`,
        `Panchakarma ${loc}`, `Abhyanga ${loc}`, `Shirodhara ${loc}`,
        `detox treatment ${loc}`, `Ayurvedic doctor ${loc}`, `wellness center ${loc}`,
        `traditional medicine ${loc}`, `holistic health ${loc}`, `Ayurvedic treatment ${loc}`,
        `near ${loc}`, `in ${loc}`, `${loc} Ayurveda`, `${loc} Panchakarma`,
        `${loc} Abhyanga`, `${loc} Shirodhara`, `${loc} detox`, `${loc} wellness`
      ]);
      
      const allKeywords = [...baseKeywords, ...locationSpecificKeywords].join(', ');
      setMeta('keywords', allKeywords);
    }
  setMeta('twitter:card', resolvedImage ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
  if (resolvedImage) setMeta('twitter:image', resolvedImage);

    // Open Graph
    setProperty('og:type', type);
    setProperty('og:title', title);
    setProperty('og:description', description);
  if (resolvedImage) setProperty('og:image', resolvedImage);
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
  'image': resolvedImage ? [resolvedImage] : undefined,
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
