/**
 * Single source of truth for public-route SEO metadata.
 *
 * Consumed by:
 *   - scripts/prerender.mjs       (bakes per-route <head> + static body into dist)
 *   - scripts/generate-sitemap.mjs (route list for sitemaps)
 *
 * Keep this in sync with the React routes in src/App.tsx and the runtime
 * configs in src/components/SEORedirect.tsx. This file is the canonical copy —
 * prefer editing here over duplicating strings across the app.
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const blogPosts = require('../src/content/blogPosts.json');

export const BASE_URL = process.env.SITE_URL || 'https://svayurvibe.com';
export const SITE_NAME = 'Sri Vinayaga Ayurvibe';
export const DEFAULT_IMAGE = `${BASE_URL}/logo.png`;

export const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');

/**
 * Each route: { path, title, description, priority, changefreq,
 *               heading, body (array of paragraph strings), links? }
 * `heading` / `body` feed the static crawler-visible content block.
 */

// --- Landing + readable section deep-links ---
const sectionRoutes = [
  {
    path: '/',
    title: 'Sri Vinayaga Ayurvibe — Best Ayurveda Hospital Chennai | Perumbakkam, OMR',
    description:
      'Ayurveda hospital at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara. Serving 20km radius. Dr.V.Vaitheeshwari B.A.M.S., Book now.',
    priority: '1.0',
    changefreq: 'daily',
    heading: 'Best Ayurveda Hospital in Chennai — Sri Vinayaga Ayurvibe',
    body: [
      'Sri Vinayaga Ayurvibe is a government-certified Ayurveda hospital at Nookampalayam, Perumbakkam, Chennai 600131, led by Dr. V. Vaitheeshwari, B.A.M.S.',
      'We offer authentic Panchakarma, Abhyanga massage, Shirodhara therapy, detox and rejuvenation programs, serving a 20km radius including Sholinganallur, OMR, Pallikaranai, Navalur, Kelambakkam, Tambaram, Medavakkam and Velachery.',
    ],
  },
  {
    path: '/about',
    title: 'About | Sri Vinayaga Ayurvibe Chennai',
    description:
      'About our Ayurveda hospital in Perumbakkam, Chennai – mission, values & qualified Ayurvedic doctors.',
    heading: 'About Sri Vinayaga Ayurvibe',
    body: [
      'Our Ayurveda hospital in Perumbakkam, Chennai is built on authentic, government-certified care led by qualified Ayurvedic doctors.',
      'We combine traditional Ayurvedic wisdom with modern facilities to deliver personalised, holistic wellness for every patient.',
    ],
  },
  {
    path: '/treatments',
    title: 'Treatments | Sri Vinayaga Ayurvibe',
    description:
      'Ayurvedic treatments in Chennai: Panchakarma, Abhyanga, Shirodhara, detox & rejuvenation therapies.',
    heading: 'Ayurvedic Treatments in Chennai',
    body: [
      'We provide authentic Panchakarma detox programs, Abhyanga full-body herbal oil massage, Shirodhara therapy, and rejuvenation programs.',
      'Each treatment plan is personalised to your dosha and health goals by Dr. V. Vaitheeshwari, B.A.M.S.',
    ],
  },
  {
    path: '/doctors',
    title: 'Doctor | Sri Vinayaga Ayurvibe',
    description:
      'Consult qualified Ayurvedic doctor in Perumbakkam, Chennai for personalized wellness plans.',
    heading: 'Our Ayurvedic Doctor',
    body: [
      'Dr. V. Vaitheeshwari, B.A.M.S., is a Panchakarma and women’s health specialist offering personalised consultations in Perumbakkam, Chennai.',
    ],
  },
  {
    path: '/testimonials',
    title: 'Healing Stories | Sri Vinayaga Ayurvibe',
    description: 'Patient success stories & reviews of our Ayurvedic treatments in Chennai.',
    heading: 'Patient Healing Stories',
    body: [
      'Read real success stories from patients who have completed Panchakarma, Abhyanga and Shirodhara treatments at Sri Vinayaga Ayurvibe.',
    ],
  },
  {
    path: '/why-ayurveda-hospital',
    title: 'Why Choose Us | Sri Vinayaga Ayurvibe',
    description:
      'Why choose our Ayurveda hospital in Chennai – safe authentic care, hygiene & personalized treatment.',
    heading: 'Why Choose Sri Vinayaga Ayurvibe',
    body: [
      'Government-certified, hygienic facilities, authentic therapies, and personalised treatment plans make us a trusted Ayurveda hospital in Chennai.',
    ],
  },
  {
    path: '/dosha',
    title: 'Dosha Quiz | Sri Vinayaga Ayurvibe',
    description:
      'Find your Ayurvedic body type (Vata Pitta Kapha) – free dosha quiz & lifestyle tips Chennai.',
    heading: 'Find Your Dosha',
    body: [
      'Take our free Ayurvedic dosha quiz to discover whether your constitution is predominantly Vata, Pitta or Kapha, and get lifestyle guidance tailored to your body type.',
    ],
  },
  {
    path: '/blog',
    title: 'Blog | Sri Vinayaga Ayurvibe',
    description:
      'Ayurveda blog: detox tips, nutrition, herbal therapies & natural healing guidance Chennai.',
    heading: 'Ayurveda Wellness Blog',
    body: [
      'Articles on Ayurvedic detox, nutrition, daily rituals, stress management and natural healing.',
    ],
    // links populated below from blogPosts
  },
  {
    path: '/faq',
    title: 'FAQ | Sri Vinayaga Ayurvibe',
    description:
      'FAQ: Ayurvedic treatment duration, Panchakarma process, pricing & consultation details Chennai.',
    heading: 'Frequently Asked Questions',
    body: [
      'Answers to common questions about Ayurvedic treatment duration, the Panchakarma process, pricing and consultations at our Chennai hospital.',
    ],
  },
  {
    path: '/booking',
    title: 'Book Appointment | Sri Vinayaga Ayurvibe',
    description:
      'Book Ayurveda consultation or Panchakarma therapy in Perumbakkam, Chennai – call or schedule online.',
    heading: 'Book Your Appointment',
    body: [
      'Book an Ayurveda consultation or Panchakarma therapy at our Perumbakkam, Chennai hospital. Call +91 81229 39197 or schedule online.',
    ],
  },
];

// --- High-intent SEO landing routes (render the Index page at runtime) ---
const seoRoutes = [
  { path: '/best-ayurveda-hospital-chennai', priority: '0.95', changefreq: 'daily', title: 'Best Ayurveda Clinic in Chennai | Sri Vinayaga Ayurvibe | Perumbakkam, OMR, Sholinganallur', description: 'Sri Vinayaga Ayurvibe offers authentic Panchakarma, Abhyanga, and Shirodhara in Perumbakkam, Chennai. Serving OMR, Sholinganallur, Pallikaranai, Navalur, Kelambakkam, Tambaram and nearby areas. Care led by Dr. V. Vaitheeshwari, B.A.M.S. Government-certified hospital. Book a consultation.' },
  { path: '/top-ayurveda-clinic-chennai', priority: '0.95', changefreq: 'daily', title: 'Top Ayurveda Clinic in Chennai | Sri Vinayaga Ayurvibe | Best Ayurvedic Treatment Center', description: 'Top-rated Ayurveda clinic in Chennai offering comprehensive Panchakarma, Abhyanga, Shirodhara treatments. Expert Ayurvedic doctors, modern facilities, authentic treatments. Serving all Chennai areas.' },
  { path: '/dr-vaitheeshwari-ayurveda-doctor-chennai', title: 'Dr.V.Vaitheeshwari B.A.M.S., - Best Ayurveda Doctor in Chennai | Sri Vinayaga Ayurvibe', description: 'Dr.V.Vaitheeshwari B.A.M.S., - Expert Ayurvedic doctor in Chennai. Specializes in Panchakarma, women’s health, chronic diseases. Book consultation at Sri Vinayaga Ayurvibe.' },
  { path: '/government-certified-ayurveda-hospital-chennai', title: 'Government Certified Ayurveda Hospital in Chennai | Sri Vinayaga Ayurvibe | Licensed Ayurvedic Center', description: 'Government certified Ayurveda hospital in Chennai. Licensed, authentic Ayurvedic treatments with qualified BAMS doctors. Panchakarma, Abhyanga, Shirodhara therapies.' },
  { path: '/authentic-panchakarma-treatment-chennai', title: 'Authentic Panchakarma Treatment in Chennai | Sri Vinayaga Ayurvibe | 14-Day Detox Program', description: 'Authentic Panchakarma treatment in Chennai. 14-day comprehensive detox program with qualified Ayurvedic doctors. Traditional cleansing therapies for complete wellness.' },
  { path: '/best-abhyanga-massage-chennai', title: 'Best Abhyanga Massage in Chennai | Sri Vinayaga Ayurvibe | Therapeutic Oil Massage', description: 'Best Abhyanga massage in Chennai. Therapeutic oil massage for relaxation, stress relief, and healing. Expert Ayurvedic therapists, authentic techniques.' },
  { path: '/shirodhara-therapy-chennai', title: 'Shirodhara Therapy in Chennai | Sri Vinayaga Ayurvibe | Stress Relief Treatment', description: 'Shirodhara therapy in Chennai for stress relief and mental wellness. Warm oil therapy for relaxation, insomnia treatment, and anxiety relief.' },
  { path: '/ayurvedic-detox-treatment-chennai', title: 'Ayurvedic Detox Treatment in Chennai | Sri Vinayaga Ayurvibe | Natural Cleansing Therapy', description: 'Ayurvedic detox treatment in Chennai. Natural cleansing therapy for body purification, toxin removal, and overall wellness. Expert Ayurvedic guidance.' },
  { path: '/holistic-wellness-center-chennai', title: 'Holistic Wellness Center in Chennai | Sri Vinayaga Ayurvibe | Complete Health Solutions', description: 'Holistic wellness center in Chennai offering complete health solutions. Integrative approach combining Ayurveda, nutrition, and lifestyle guidance for optimal health.' },
  { path: '/traditional-medicine-chennai', title: 'Traditional Medicine in Chennai | Sri Vinayaga Ayurvibe | Ancient Healing Wisdom', description: 'Traditional medicine in Chennai. Ancient healing wisdom of Ayurveda for modern health challenges. Authentic treatments, qualified practitioners.' },
  { path: '/ayurvedic-medicine-chennai', title: 'Ayurvedic Medicine in Chennai | Sri Vinayaga Ayurvibe | Herbal Remedies & Treatments', description: 'Ayurvedic medicine in Chennai. Herbal remedies, natural treatments, and traditional healing methods. Expert consultation and personalized medicine.' },
  { path: '/alternative-medicine-chennai', title: 'Alternative Medicine in Chennai | Sri Vinayaga Ayurvibe | Natural Healing Solutions', description: 'Alternative medicine in Chennai. Natural healing solutions, complementary therapies, and holistic approaches to health and wellness.' },
  { path: '/wellness-therapy-chennai', title: 'Wellness Therapy in Chennai | Sri Vinayaga Ayurvibe | Comprehensive Health Programs', description: 'Wellness therapy in Chennai. Comprehensive health programs, lifestyle counseling, and therapeutic treatments for complete well-being.' },
  { path: '/stress-management-chennai', title: 'Stress Management in Chennai | Sri Vinayaga Ayurvibe | Anxiety & Stress Relief', description: 'Stress management in Chennai. Effective anxiety and stress relief through Ayurvedic therapies, meditation, and lifestyle modifications.' },
  { path: '/chronic-disease-management-chennai', title: 'Chronic Disease Management in Chennai | Sri Vinayaga Ayurvibe | Long-term Health Solutions', description: 'Chronic disease management in Chennai. Long-term health solutions through Ayurvedic treatments, lifestyle modifications, and ongoing care.' },
  { path: '/women-health-chennai', title: 'Women Health in Chennai | Sri Vinayaga Ayurvibe | Ayurvedic Women’s Wellness', description: 'Women health in Chennai. Ayurvedic women’s wellness programs, hormonal balance, reproductive health, and specialized care for women.' },
  { path: '/digestive-disorders-chennai', title: 'Digestive Disorders Treatment in Chennai | Sri Vinayaga Ayurvibe | Gut Health Solutions', description: 'Digestive disorders treatment in Chennai. Gut health solutions, digestive wellness, and natural remedies for gastrointestinal issues.' },
  { path: '/skin-health-chennai', title: 'Skin Health Treatment in Chennai | Sri Vinayaga Ayurvibe | Natural Skin Care', description: 'Skin health treatment in Chennai. Natural skin care, Ayurvedic dermatology, and holistic approaches to healthy, glowing skin.' },
  { path: '/mental-health-chennai', title: 'Mental Health Treatment in Chennai | Sri Vinayaga Ayurvibe | Ayurvedic Mental Wellness', description: 'Mental health treatment in Chennai. Ayurvedic mental wellness, anxiety management, depression support, and emotional healing.' },
  { path: '/bams-doctor-chennai', title: 'BAMS Doctor in Chennai | Sri Vinayaga Ayurvibe | Qualified Ayurvedic Physician', description: 'BAMS doctor in Chennai. Qualified Ayurvedic physician with extensive training in traditional medicine, modern diagnostics, and holistic healing.' },
  // Location-specific
  { path: '/ayurveda-hospital-perumbakkam-chennai', title: 'Ayurveda Hospital in Perumbakkam, Chennai | Sri Vinayaga Ayurvibe | Nookampalayam', description: 'Ayurveda hospital at Nookampalayam, Perumbakkam (12/597, Main Road, Nethaji Nagar Main Rd), Chennai 600131. Authentic Panchakarma, Abhyanga, Shirodhara by Dr.V.Vaitheeshwari B.A.M.S.,.' },
  { path: '/ayurveda-clinic-omr-chennai', title: 'Ayurveda Clinic in OMR, Chennai | Sri Vinayaga Ayurvibe | OMR Healthcare Services', description: 'Ayurveda clinic in OMR, Chennai. Healthcare services for OMR area with convenient access to authentic Ayurvedic treatments and expert care.' },
  { path: '/ayurveda-treatment-sholinganallur-chennai', title: 'Ayurveda Treatment in Sholinganallur, Chennai | Sri Vinayaga Ayurvibe | Local Care', description: 'Ayurveda treatment in Sholinganallur, Chennai. Local care with authentic treatments, qualified practitioners, and personalized healing programs.' },
  { path: '/panchakarma-pallikaranai-chennai', title: 'Panchakarma Treatment in Pallikaranai, Chennai | Sri Vinayaga Ayurvibe | Detox Therapy', description: 'Panchakarma treatment in Pallikaranai, Chennai. Detox therapy with authentic cleansing procedures, expert guidance, and comprehensive wellness programs.' },
  { path: '/abhyanga-massage-navalur-chennai', title: 'Abhyanga Massage in Navalur, Chennai | Sri Vinayaga Ayurvibe | Therapeutic Massage', description: 'Abhyanga massage in Navalur, Chennai. Therapeutic massage for relaxation, healing, and wellness. Expert therapists and authentic techniques.' },
  { path: '/shirodhara-therapy-kelambakkam-chennai', title: 'Shirodhara Therapy in Kelambakkam, Chennai | Sri Vinayaga Ayurvibe | Stress Relief', description: 'Shirodhara therapy in Kelambakkam, Chennai. Stress relief treatment with warm oil therapy, expert care, and personalized wellness programs.' },
  { path: '/ayurveda-doctor-tambaram-chennai', title: 'Ayurveda Doctor in Tambaram, Chennai | Sri Vinayaga Ayurvibe | Local Physician', description: 'Ayurveda doctor in Tambaram, Chennai. Local physician with expertise in traditional medicine, modern diagnostics, and holistic patient care.' },
  { path: '/ayurveda-hospital-medavakkam-chennai', title: 'Ayurveda Hospital in Medavakkam, Chennai | Sri Vinayaga Ayurvibe | 20km Reachable', description: 'Ayurveda hospital near Medavakkam, Chennai. Located at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara by Dr.V.Vaitheeshwari B.A.M.S.,.' },
  { path: '/ayurveda-clinic-velachery-chennai', title: 'Ayurveda Clinic in Velachery, Chennai | Sri Vinayaga Ayurvibe | 20km Reachable', description: 'Ayurveda clinic near Velachery, Chennai. Located at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara by Dr.V.Vaitheeshwari B.A.M.S.,.' },
  { path: '/ayurveda-treatment-chromepet-chennai', title: 'Ayurveda Treatment in Chromepet, Chennai | Sri Vinayaga Ayurvibe | 20km Reachable', description: 'Ayurveda treatment near Chromepet, Chennai. Located at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara by Dr.V.Vaitheeshwari B.A.M.S.,.' },
].map((r) => ({
  priority: r.priority || '0.9',
  changefreq: r.changefreq || 'weekly',
  heading: r.title.split('|')[0].trim(),
  body: [r.description],
  ...r,
}));

// --- Blog post detail routes (canonical slug paths) ---
const blogRoutes = blogPosts.map((p) => {
  const slug = slugify(p.title);
  return {
    path: `/blog/${p.id}/${slug}`,
    title: `${p.title} | Sri Vinayaga Ayurvibe Blog`,
    description: p.excerpt,
    priority: '0.7',
    changefreq: 'monthly',
    type: 'article',
    publishedTime: new Date(p.date).toISOString(),
    image: p.image ? `${BASE_URL}${p.image.startsWith('/') ? p.image : '/' + p.image}` : undefined,
    heading: p.title,
    body: [p.excerpt],
    lastmod: new Date(p.date).toISOString(),
  };
});

// Fill the /blog index links from blog posts
const blogIndex = sectionRoutes.find((r) => r.path === '/blog');
if (blogIndex) {
  blogIndex.links = blogRoutes.map((b) => ({ href: b.path, text: b.title }));
}

export const allRoutes = [...sectionRoutes, ...seoRoutes, ...blogRoutes];
export const blogRouteList = blogRoutes;
