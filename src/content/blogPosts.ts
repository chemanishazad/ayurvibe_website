// Central blog posts data so sitemap & other utilities can import without duplicating.
// Source of truth: blogPosts.json (Node scripts like sitemap import JSON directly).
import blogPostsData from './blogPosts.json';

export interface BlogPostMeta {
  id: number;
  title: string;
  excerpt: string;
  date: string; // ISO
  image?: string;
  category?: string;
  author?: string;
}

export const blogPosts: BlogPostMeta[] = blogPostsData as BlogPostMeta[];

export const slugify = (title: string) => title.toLowerCase()
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');
