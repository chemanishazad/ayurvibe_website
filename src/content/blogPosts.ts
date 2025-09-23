// Central blog posts data so sitemap & other utilities can import without duplicating.
// Mirrors the structure inside BlogPost.tsx so we can generate a sitemap and future listing pages.
export interface BlogPostMeta {
  id: number;
  title: string;
  excerpt: string;
  date: string; // ISO
  image?: string;
  category?: string;
  author?: string;
}

// NOTE: Keep this in sync with BlogPost.tsx content array (or refactor BlogPost.tsx to consume this).
// For now we list minimal metadata required for sitemap + JSON-LD.
export const blogPosts: BlogPostMeta[] = [
  {
    id: 1,
    title: 'Understanding Your Dosha: A Complete Guide to Ayurvedic Body Types',
    excerpt: 'Discover how knowing your dosha can transform your health and help you make better lifestyle choices aligned with your natural constitution.',
    date: '2024-01-15'
  },
  {
    id: 2,
    title: 'Seasonal Detox: Spring Cleanse with Ayurvedic Principles',
    excerpt: 'Learn how to cleanse your body naturally this spring using time-tested Ayurvedic detoxification methods and seasonal foods.',
    date: '2024-01-10'
  },
  {
    id: 3,
    title: '10 Morning Rituals for Better Digestion According to Ayurveda',
    excerpt: 'Start your day right with these simple Ayurvedic practices that will improve your digestive fire and overall energy levels.',
    date: '2024-01-05'
  },
  {
    id: 4,
    title: 'Stress Management Through Meditation and Pranayama',
    excerpt: 'Explore ancient breathing techniques and meditation practices that can help you manage stress and anxiety naturally.',
    date: '2024-01-01'
  },
  {
    id: 5,
    title: 'Ayurvedic Nutrition: Eating for Your Body Type',
    excerpt: 'Discover how to choose the right foods for your dosha and create meal plans that support your unique constitution.',
    date: '2023-12-28'
  },
  {
    id: 6,
    title: 'The Power of Abhyanga: Self-Massage for Daily Wellness',
    excerpt: 'Learn the art of self-massage with herbal oils and its incredible benefits for skin, circulation, and mental wellbeing.',
    date: '2023-12-25'
  }
];

export const slugify = (title: string) => title.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');
