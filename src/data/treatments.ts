// Signature treatments of Sri Vinayaga Ayurvibe.
// Each treatment expects an image at src/assets/treatments/<slug>.webp —
// drop a WebP with the matching slug name and it is picked up automatically;
// until then the card falls back to /placeholder.svg. PNG masters live in the
// same folder and are converted with `npm run images` (scripts/optimize-images.mjs).

export interface Treatment {
  name: string;
  slug: string;
  description: string;
  duration: string;
  benefits: string[];
  category: TreatmentCategory;
  /** ~900px wide — used in the details dialog. */
  image: string;
  /** ~480px wide — what the grid cards actually need. */
  thumb: string;
}

export type TreatmentCategory =
  | 'Head & Face'
  | 'Dhara'
  | 'Massage'
  | 'Kizhi & Sweda'
  | 'Vasti'
  | 'Specialised';

export const treatmentCategories = [
  'All',
  'Head & Face',
  'Dhara',
  'Massage',
  'Kizhi & Sweda',
  'Vasti',
  'Specialised',
] as const;

// WebP renditions replace the multi-megabyte PNGs: ~900px for the dialog and
// ~480px for the grid cards, which are never wider than ~330 CSS px. The PNG
// masters stay on disk for re-encoding but are no longer bundled.
const treatmentImages = import.meta.glob('../assets/treatments/*.webp', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const imageFor = (slug: string) =>
  treatmentImages[`../assets/treatments/${slug}.webp`] ?? '/placeholder.svg';

const thumbFor = (slug: string) =>
  treatmentImages[`../assets/treatments/${slug}-480.webp`] ?? imageFor(slug);

type TreatmentInput = Omit<Treatment, 'image' | 'thumb'>;

const data: TreatmentInput[] = [
  {
    name: 'Shiro Abhyangam',
    slug: 'shiro-abhyangam',
    description:
      'Traditional head massage with warm medicated oils, working gently on the scalp, neck and shoulders to stimulate vital marma points and calm the nervous system.',
    duration: '30-45 mins',
    benefits: ['Relieves stress & tension', 'Improves sleep quality', 'Nourishes scalp & hair', 'Eases headaches'],
    category: 'Head & Face',
  },
  {
    name: 'Shirodhara',
    slug: 'shirodhara',
    description:
      'A continuous stream of warm medicated oil poured rhythmically over the forehead, deeply calming the mind and balancing the nervous system.',
    duration: '45-60 mins',
    benefits: ['Deep relaxation', 'Relieves anxiety & insomnia', 'Enhances mental clarity', 'Balances the nervous system'],
    category: 'Dhara',
  },
  {
    name: 'Shiro Pichu',
    slug: 'shiro-pichu',
    description:
      'A cotton pad soaked in warm medicated oil is placed on the crown of the head, allowing the oil to slowly nourish the scalp and calm the mind.',
    duration: '30-45 mins',
    benefits: ['Soothes the nervous system', 'Helps insomnia & migraine', 'Strengthens hair roots', 'Reduces mental fatigue'],
    category: 'Head & Face',
  },
  {
    name: 'Thalapothichil',
    slug: 'thalapothichil',
    description:
      'The scalp is completely covered with a cooling medicated herbal paste, traditionally used for stress, sleep disorders and scalp conditions.',
    duration: '45-60 mins',
    benefits: ['Cools & calms the head', 'Improves sleep', 'Helps scalp disorders', 'Reduces stress & anxiety'],
    category: 'Head & Face',
  },
  {
    name: 'Netra Tarpanam',
    slug: 'netra-tarpanam',
    description:
      'Warm medicated ghee is pooled over the eyes within a dough ring, rejuvenating tired eyes and nourishing the delicate eye tissues.',
    duration: '20-30 mins',
    benefits: ['Relieves eye strain', 'Improves vision clarity', 'Soothes dry & tired eyes', 'Strengthens eye muscles'],
    category: 'Head & Face',
  },
  {
    name: 'Nasyam',
    slug: 'nasyam',
    description:
      'Medicated oils or herbal preparations administered through the nostrils to cleanse and nourish the head, sinuses and respiratory passages.',
    duration: '15-30 mins',
    benefits: ['Clears sinuses', 'Relieves headaches & allergies', 'Improves breathing', 'Enhances mental clarity'],
    category: 'Head & Face',
  },
  {
    name: 'Takra Dhara',
    slug: 'takra-dhara',
    description:
      'A soothing stream of medicated buttermilk poured continuously over the forehead, prized for cooling the mind and easing stress-related disorders.',
    duration: '45-60 mins',
    benefits: ['Cools mind & body', 'Helps insomnia & stress', 'Relieves scalp conditions', 'Balances Pitta dosha'],
    category: 'Dhara',
  },
  {
    name: 'Mukha Abhyangam',
    slug: 'mukha-abhyangam',
    description:
      'A gentle Ayurvedic face massage with herbal oils, stimulating facial marma points to relax muscles and bring a natural glow.',
    duration: '30-45 mins',
    benefits: ['Natural facial glow', 'Relaxes facial muscles', 'Improves skin tone', 'Reduces fine lines'],
    category: 'Head & Face',
  },
  {
    name: 'Navara Mukha Lepam',
    slug: 'navara-mukha-lepam',
    description:
      'A nourishing face pack of Navara rice cooked in milk and herbal decoction, deeply rejuvenating the facial skin.',
    duration: '30-45 mins',
    benefits: ['Deeply nourishes skin', 'Brightens complexion', 'Anti-ageing effect', 'Softens & firms skin'],
    category: 'Head & Face',
  },
  {
    name: 'Ksheera Dhoomam',
    slug: 'ksheera-dhoomam',
    description:
      'Herbal steam generated from medicated milk is directed to the face and neck, traditionally used for facial palsy and nerve-related conditions.',
    duration: '15-20 mins',
    benefits: ['Tones facial nerves', 'Helps facial palsy', 'Improves circulation', 'Relaxes facial muscles'],
    category: 'Head & Face',
  },
  {
    name: 'Paada Abhyangam',
    slug: 'paada-abhyangam',
    description:
      'A relaxing foot massage with warm medicated oils, stimulating vital points on the feet to ground the body and calm the mind.',
    duration: '30-45 mins',
    benefits: ['Relieves foot pain & fatigue', 'Improves sleep', 'Enhances circulation', 'Calms the nervous system'],
    category: 'Massage',
  },
  {
    name: 'Shareera Abhyangam',
    slug: 'shareera-abhyangam',
    description:
      'Full-body massage with warm herbal oils chosen for your constitution, applied in rhythmic strokes to nourish tissues and balance the doshas.',
    duration: '45-60 mins',
    benefits: ['Improves circulation', 'Relieves muscle stiffness', 'Nourishes skin & tissues', 'Reduces stress & fatigue'],
    category: 'Massage',
  },
  {
    name: 'Udwarthanam',
    slug: 'udwarthanam',
    description:
      'An invigorating massage using dry herbal powders in upward strokes, stimulating metabolism and supporting healthy weight management.',
    duration: '45-60 mins',
    benefits: ['Supports weight management', 'Exfoliates & tones skin', 'Reduces cellulite', 'Stimulates lymphatic flow'],
    category: 'Massage',
  },
  {
    name: 'Podi Kizhi',
    slug: 'podi-kizhi',
    description:
      'Warm boluses of medicated herbal powders are applied over the body in rhythmic strokes, easing pain, stiffness and inflammation.',
    duration: '45-60 mins',
    benefits: ['Relieves joint & muscle pain', 'Reduces stiffness', 'Eases inflammation', 'Improves mobility'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Elakizhi',
    slug: 'elakizhi',
    description:
      'Fresh medicinal leaves fried in herbal oil are bundled into warm boluses and massaged over the body, excellent for joint and musculoskeletal complaints.',
    duration: '45-60 mins',
    benefits: ['Eases joint pain', 'Reduces swelling', 'Relaxes muscles', 'Improves flexibility'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Navara Kizhi',
    slug: 'navara-kizhi',
    description:
      'Boluses of Navara rice cooked in milk and herbal decoction are massaged over the body, deeply nourishing muscles, nerves and tissues.',
    duration: '60-90 mins',
    benefits: ['Strengthens muscles & nerves', 'Nourishes body tissues', 'Helps neurological conditions', 'Rejuvenates the body'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Pizhichil',
    slug: 'pizhichil',
    description:
      'The royal treatment — warm medicated oil is continuously squeezed and poured over the body with synchronised massage, deeply rejuvenating body and mind.',
    duration: '60-90 mins',
    benefits: ['Deep tissue nourishment', 'Relieves body pain', 'Improves joint mobility', 'Profound relaxation'],
    category: 'Dhara',
  },
  {
    name: 'Kashaya Dhara',
    slug: 'kashaya-dhara',
    description:
      'Warm herbal decoction is poured in a continuous stream over the body, cleansing the skin and easing inflammatory conditions.',
    duration: '45-60 mins',
    benefits: ['Reduces inflammation', 'Helps skin conditions', 'Relieves body ache', 'Improves circulation'],
    category: 'Dhara',
  },
  {
    name: 'Ksheera Dhara',
    slug: 'ksheera-dhara',
    description:
      'A gentle stream of warm medicated milk poured over the body or forehead, cooling and calming for stress and Pitta-related conditions.',
    duration: '45-60 mins',
    benefits: ['Cools & soothes the body', 'Relieves stress & burning sensation', 'Nourishes the skin', 'Calms the mind'],
    category: 'Dhara',
  },
  {
    name: 'Dhanyamla Dhara',
    slug: 'dhanyamla-dhara',
    description:
      'Warm fermented herbal liquid prepared from grains is poured rhythmically over the body, effective for inflammatory and rheumatic conditions.',
    duration: '45-60 mins',
    benefits: ['Reduces joint inflammation', 'Helps rheumatic complaints', 'Improves metabolism', 'Relieves heaviness & stiffness'],
    category: 'Dhara',
  },
  {
    name: 'Jambira Pinda Swedanam',
    slug: 'jambira-pinda-swedanam',
    description:
      'Warm boluses of lemon and herbs fried in medicated oil are massaged over the body, relieving deep-seated pain and stiffness.',
    duration: '45-60 mins',
    benefits: ['Relieves chronic pain', 'Reduces muscle spasm', 'Improves joint movement', 'Eases neck & back stiffness'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Valuka Swedanam',
    slug: 'valuka-swedanam',
    description:
      'Heated sand poultices are applied over affected areas — a dry fomentation especially suited for inflammatory joint conditions.',
    duration: '30-45 mins',
    benefits: ['Reduces joint swelling', 'Helps rheumatoid conditions', 'Dry heat relieves pain', 'Improves joint function'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Naadi Swedanam',
    slug: 'naadi-swedanam',
    description:
      'Localised herbal steam directed through a tube to specific body parts, loosening stiffness and preparing tissues for further therapy.',
    duration: '15-20 mins',
    benefits: ['Targeted pain relief', 'Loosens stiff joints', 'Improves local circulation', 'Relaxes muscles'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Baspa Sweda',
    slug: 'baspa-sweda',
    description:
      'Full-body herbal steam bath in a traditional steam chamber, opening the channels and helping the body eliminate toxins.',
    duration: '15-20 mins',
    benefits: ['Eliminates toxins', 'Opens body channels', 'Relieves heaviness', 'Refreshes body & mind'],
    category: 'Kizhi & Sweda',
  },
  {
    name: 'Greeva Vasti',
    slug: 'greeva-vasti',
    description:
      'Warm medicated oil is retained over the neck within a herbal dough ring, relieving cervical pain and stiffness.',
    duration: '30-45 mins',
    benefits: ['Relieves neck pain', 'Helps cervical spondylosis', 'Reduces stiffness', 'Strengthens neck muscles'],
    category: 'Vasti',
  },
  {
    name: 'Prishta Vasti',
    slug: 'prishta-vasti',
    description:
      'Warm medicated oil pooled along the spine within a dough boundary, nourishing the spinal muscles and nerves.',
    duration: '30-45 mins',
    benefits: ['Relieves back pain', 'Nourishes spinal nerves', 'Improves posture', 'Eases muscle spasm'],
    category: 'Vasti',
  },
  {
    name: 'Kati Vasti',
    slug: 'kati-vasti',
    description:
      'Warm medicated oil retained over the lower back within a dough ring — a targeted therapy for chronic low-back pain and disc problems.',
    duration: '30-45 mins',
    benefits: ['Relieves lower back pain', 'Helps disc & sciatica issues', 'Reduces inflammation', 'Improves spinal flexibility'],
    category: 'Vasti',
  },
  {
    name: 'Jaanu Vasti',
    slug: 'jaanu-vasti',
    description:
      'Warm medicated oil retained over the knee joints within a dough ring, lubricating the joints and easing knee pain.',
    duration: '30-45 mins',
    benefits: ['Relieves knee pain', 'Helps osteoarthritis', 'Lubricates knee joints', 'Improves mobility'],
    category: 'Vasti',
  },
  {
    name: 'Kashaya Vasti',
    slug: 'kashaya-vasti',
    description:
      'A cleansing medicated enema using herbal decoction — a classical Panchakarma procedure for deep detoxification and Vata disorders.',
    duration: '15-30 mins',
    benefits: ['Deep detoxification', 'Balances Vata dosha', 'Improves gut health', 'Helps chronic constipation'],
    category: 'Vasti',
  },
  {
    name: 'Matra Vasti',
    slug: 'matra-vasti',
    description:
      'A gentle nourishing enema with a small measured dose of medicated oil, safe and strengthening for daily rejuvenation.',
    duration: '15-30 mins',
    benefits: ['Nourishes & strengthens', 'Eases Vata complaints', 'Supports joint health', 'Gentle & safe rejuvenation'],
    category: 'Vasti',
  },
  {
    name: 'Yoni Prakshalanam',
    slug: 'yoni-prakshalanam',
    description:
      'A therapeutic vaginal wash with warm herbal decoctions, supporting feminine hygiene and gynaecological wellness.',
    duration: '15-30 mins',
    benefits: ['Supports feminine health', 'Helps infections & discharge', 'Maintains intimate hygiene', 'Soothes inflammation'],
    category: 'Specialised',
  },
  {
    name: 'Pichu',
    slug: 'pichu',
    description:
      'A thick cotton pad soaked in warm medicated oil is placed over the affected area, providing sustained localised nourishment and pain relief.',
    duration: '30-45 mins',
    benefits: ['Localised pain relief', 'Reduces inflammation', 'Nourishes tissues', 'Helps degenerative conditions'],
    category: 'Specialised',
  },
  {
    name: 'Upanaha / Lepam',
    slug: 'upanaha-lepam',
    description:
      'A warm herbal paste is applied and bandaged over painful joints or swollen areas, drawing out inflammation and easing pain overnight.',
    duration: '30-45 mins',
    benefits: ['Reduces swelling', 'Relieves joint pain', 'Improves local circulation', 'Helps chronic inflammation'],
    category: 'Specialised',
  },
];

export const treatments: Treatment[] = data.map((t) => ({
  ...t,
  image: imageFor(t.slug),
  thumb: thumbFor(t.slug),
}));
