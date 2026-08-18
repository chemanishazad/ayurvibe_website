import type { SceneData, Tint as SceneTint } from '@/components/site/exploded/types';

/**
 * The dispensary.
 * ---------------------------------------------------------------------------
 * Six classical preparations the hospital actually compounds, described by
 * what goes *into* them. This is the source for the scroll scene that opens
 * each vessel and lays its botanicals out, so the copy here is the copy a
 * crawler reads — nothing in that scene is decoration-only.
 *
 * `usedIn` slugs must exist in src/data/treatments.ts; they render as anchors
 * into the therapy grid.
 */

/** Ink drawings available in components/site/apothecary/Botanicals.tsx. */
export type GlyphId =
  | 'root'
  | 'leaf'
  | 'sprig'
  | 'berry'
  | 'fruit'
  | 'seed'
  | 'rhizome'
  | 'flower'
  | 'bark'
  | 'resin'
  | 'oil'
  | 'milk'
  | 'honey'
  | 'ghee'
  | 'salt'
  | 'grain'
  | 'pod'
  | 'thread'
  | 'wood'
  | 'pepper';

/** Palette slot for the medallion. Kept to four so the ring stays calm. */
export type Tint = SceneTint;

export interface Ingredient {
  glyph: GlyphId;
  /** Common name — what the medallion shows. */
  name: string;
  /** Sanskrit / botanical name — the small italic line. */
  sanskrit: string;
  /** One clause on why it is in the formula. */
  role: string;
  tint: Tint;
}

export type VesselId = 'vial' | 'capsule' | 'potli' | 'jar' | 'vati' | 'dhara';

export interface Remedy {
  slug: string;
  vessel: VesselId;
  /** Formulation name. */
  name: string;
  /** How it is classified in the classics. */
  form: string;
  /** Sanskrit source / classical reference. */
  source: string;
  /** One line under the name. */
  tagline: string;
  /** Two or three sentences — the readable body copy. */
  description: string;
  /** How it is prepared, in one line. Sits under the opened vessel. */
  method: string;
  ingredients: Ingredient[];
  usedIn: { name: string; slug: string }[];
}

export const remedies: Remedy[] = [
  {
    slug: 'dhanwantharam-thailam',
    vessel: 'vial',
    name: 'Dhanwantharam Thailam',
    form: 'Medicated oil · Taila',
    source: 'Ashtanga Hridayam',
    tagline: 'The oil the whole massage room is built around.',
    description:
      'A sesame-oil base cooked down with a root decoction until every drop of water has gone and only the herb remains in the oil. It is the standard vehicle for Vata disorders — low back pain, stiffness, post-natal care and the neurological work the hospital sees most.',
    method: 'Sesame oil simmered with the decoction and herb paste until only oil remains.',
    ingredients: [
      { glyph: 'root', name: 'Bala', sanskrit: 'Sida cordifolia', role: 'Rebuilds nerve and muscle', tint: 'leaf' },
      { glyph: 'oil', name: 'Sesame oil', sanskrit: 'Tila taila', role: 'Carries herbs past skin', tint: 'amber' },
      { glyph: 'wood', name: 'Ten roots', sanskrit: 'Dashamoola', role: 'Settles Vata pain', tint: 'clay' },
      { glyph: 'sprig', name: 'Shatavari', sanskrit: 'Asparagus racemosus', role: 'Cools and nourishes', tint: 'leaf' },
      { glyph: 'milk', name: "Cow's milk", sanskrit: 'Go ksheera', role: 'Softens the cooking heat', tint: 'stone' },
    ],
    usedIn: [
      { name: 'Shareera Abhyangam', slug: 'shareera-abhyangam' },
      { name: 'Pizhichil', slug: 'pizhichil' },
      { name: 'Kati Vasti', slug: 'kati-vasti' },
      { name: 'Jaanu Vasti', slug: 'jaanu-vasti' },
    ],
  },
  {
    slug: 'triphala-churna',
    vessel: 'capsule',
    name: 'Triphala Churna',
    form: 'Powder · Churna',
    source: 'Sharangadhara Samhita',
    tagline: 'Three fruits, one for each dosha.',
    description:
      'The most quietly useful formula in the pharmacy: three dried fruits ground in equal measure. One clears, one binds, one restores — which is why it corrects a sluggish gut and a loose one with the same dose, and why it is given as an eyewash as readily as a digestive.',
    method: 'Three sun-dried fruits, de-seeded and ground to an equal-part powder.',
    ingredients: [
      { glyph: 'fruit', name: 'Haritaki', sanskrit: 'Terminalia chebula', role: 'Moves a stalled bowel', tint: 'clay' },
      { glyph: 'seed', name: 'Bibhitaki', sanskrit: 'Terminalia bellirica', role: 'Dries excess Kapha', tint: 'stone' },
      { glyph: 'berry', name: 'Amalaki', sanskrit: 'Emblica officinalis', role: 'Cools Pitta, rebuilds', tint: 'leaf' },
    ],
    usedIn: [
      { name: 'Netra Tarpanam', slug: 'netra-tarpanam' },
      { name: 'Udwarthanam', slug: 'udwarthanam' },
    ],
  },
  {
    slug: 'podi-kizhi-bolus',
    vessel: 'potli',
    name: 'Podikizhi Bolus',
    form: 'Herbal poultice · Pinda sweda',
    source: 'Sahasrayogam',
    tagline: 'A hot pouch, tied fresh for every session.',
    description:
      'Coarse powders are dry-roasted, tied into cotton, warmed in oil and stamped rhythmically over the body. The heat opens the channel while the powder pulls stagnant fluid out of it — the reason a swollen, cold, aching joint loosens within a session or two.',
    method: 'Powders roasted, tied in cotton, warmed in medicated oil before each use.',
    ingredients: [
      { glyph: 'grain', name: 'Horse gram', sanskrit: 'Kulattha', role: 'Draws out swelling', tint: 'clay' },
      { glyph: 'salt', name: 'Rock salt', sanskrit: 'Saindhava lavana', role: 'Holds the heat in', tint: 'stone' },
      { glyph: 'rhizome', name: 'Turmeric', sanskrit: 'Haridra', role: 'Settles inflammation', tint: 'amber' },
      { glyph: 'leaf', name: 'Nirgundi', sanskrit: 'Vitex negundo', role: 'The joint-pain leaf', tint: 'leaf' },
      { glyph: 'sprig', name: 'Rasna', sanskrit: 'Pluchea lanceolata', role: 'Frees a stiff joint', tint: 'leaf' },
    ],
    usedIn: [
      { name: 'Podi Kizhi', slug: 'podi-kizhi' },
      { name: 'Elakizhi', slug: 'elakizhi' },
      { name: 'Navara Kizhi', slug: 'navara-kizhi' },
    ],
  },
  {
    slug: 'brahmi-dhara-oil',
    vessel: 'dhara',
    name: 'Brahmi Dhara Taila',
    form: 'Pouring oil · Dhara dravya',
    source: 'Chikitsa Manjari',
    tagline: 'What runs from the vessel during Shirodhara.',
    description:
      'The dhara pot hangs a hand-span above the forehead and releases an unbroken thread of warm oil across the brow for forty minutes. The formula is deliberately cooling and slightly sedative: it is prescribed for insomnia, anxiety, migraine and the burnout the clinic sees in OMR office workers.',
    method: 'Kept at body heat and poured in one continuous stream over the brow.',
    ingredients: [
      { glyph: 'leaf', name: 'Brahmi', sanskrit: 'Bacopa monnieri', role: 'Quietens the mind', tint: 'leaf' },
      { glyph: 'root', name: 'Jatamansi', sanskrit: 'Nardostachys jatamansi', role: 'Deepens sleep', tint: 'clay' },
      { glyph: 'wood', name: 'Sandalwood', sanskrit: 'Chandana', role: 'Cools head and eyes', tint: 'stone' },
      { glyph: 'berry', name: 'Amla', sanskrit: 'Amalaki', role: 'Takes out Pitta heat', tint: 'leaf' },
      { glyph: 'oil', name: 'Ksheerabala', sanskrit: 'Bala–ksheera taila', role: 'The milk-cooked base', tint: 'amber' },
    ],
    usedIn: [
      { name: 'Shirodhara', slug: 'shirodhara' },
      { name: 'Takra Dhara', slug: 'takra-dhara' },
      { name: 'Ksheera Dhara', slug: 'ksheera-dhara' },
      { name: 'Thalapothichil', slug: 'thalapothichil' },
    ],
  },
  {
    slug: 'yogaraja-guggulu',
    vessel: 'vati',
    name: 'Yogaraja Guggulu',
    form: 'Tablet · Vati',
    source: 'Sharangadhara Samhita',
    tagline: 'Resin, pressed into a tablet, for joints that have stopped moving.',
    description:
      'Guggulu is the gum that seeps from a desert tree; it is purified in a decoction before it is ever used. Ground with digestive spices and the three fruits, it becomes the classical answer to arthritis, sciatica and the cold, stiff, swollen joint that improves with movement and worsens in the rain.',
    method: 'Purified resin triturated with the powders, then rolled and pressed into tablets.',
    ingredients: [
      { glyph: 'resin', name: 'Guggulu', sanskrit: 'Commiphora mukul', role: 'Scrapes out stagnation', tint: 'amber' },
      { glyph: 'fruit', name: 'Triphala', sanskrit: 'The three fruits', role: 'Clears what it loosens', tint: 'clay' },
      { glyph: 'pepper', name: 'Trikatu', sanskrit: 'Ginger · pepper · pippali', role: 'Carries it deeper', tint: 'clay' },
      { glyph: 'seed', name: 'Ajamoda', sanskrit: 'Trachyspermum roxburghianum', role: 'Relieves cramp and gas', tint: 'stone' },
      { glyph: 'pod', name: 'Cardamom', sanskrit: 'Ela', role: 'Easy on the gut', tint: 'leaf' },
    ],
    usedIn: [
      { name: 'Greeva Vasti', slug: 'greeva-vasti' },
      { name: 'Prishta Vasti', slug: 'prishta-vasti' },
      { name: 'Kati Vasti', slug: 'kati-vasti' },
    ],
  },
  {
    slug: 'chyawanprash',
    vessel: 'jar',
    name: 'Chyawanprash',
    form: 'Jam · Avaleha / Rasayana',
    source: 'Charaka Samhita',
    tagline: 'Fifty herbs cooked into amla, taken by the spoon.',
    description:
      'The oldest rejuvenative in the record, made for the sage Chyawana to give him back his youth. Amla is cooked with ghee, honey and a long list of supporting herbs into a dark jam. It is what patients are sent home with after Panchakarma, while the tissue is still rebuilding.',
    method: 'Amla pulp reduced with ghee and herb powders, finished with honey off the heat.',
    ingredients: [
      { glyph: 'berry', name: 'Amla', sanskrit: 'Amalaki', role: 'The vitamin-C base', tint: 'leaf' },
      { glyph: 'ghee', name: 'Ghee', sanskrit: 'Go ghrita', role: 'Reaches deep tissue', tint: 'amber' },
      { glyph: 'honey', name: 'Honey', sanskrit: 'Madhu', role: 'Added cold, stays raw', tint: 'amber' },
      { glyph: 'pepper', name: 'Long pepper', sanskrit: 'Pippali', role: 'Wakes lungs and gut', tint: 'clay' },
      { glyph: 'flower', name: 'Saffron', sanskrit: 'Kumkuma', role: 'Colour, aroma, blood tone', tint: 'clay' },
      { glyph: 'thread', name: 'Vetiver', sanskrit: 'Ushira', role: 'Cools a warm formula', tint: 'stone' },
    ],
    usedIn: [
      { name: 'Kashaya Vasti', slug: 'kashaya-vasti' },
      { name: 'Matra Vasti', slug: 'matra-vasti' },
    ],
  },
];


/* -- adapter --------------------------------------------------------------

 * The exploded-scene renderer takes a generic shape (kicker / title / tagline
 * / satellites). Remedies keep their own vocabulary above, because
 * scripts/seo-routes.mjs, the /medicines copy and the Drug structured data all
 * read `form`, `source`, `method` and `ingredients` by name. This maps one to
 * the other in a single place.
 */

/** What the drawing of each vessel is, in two or three words. */
const VESSEL_CAPTION: Record<VesselId, string> = {
  vial: 'The oil bottle',
  capsule: 'The capsule',
  potli: 'The poultice',
  dhara: 'The pouring vessel',
  vati: 'The pressed tablet',
  jar: 'The lehyam jar',
};

/** What is inside each vessel, as an HSL triplet. */
const FLUID: Record<VesselId, string> = {
  vial: '38 86% 58%',
  capsule: '74 48% 58%',
  potli: '84 44% 54%',
  dhara: '44 62% 72%',
  vati: '24 54% 58%',
  jar: '20 62% 46%',
};

export const remedyScenes: SceneData[] = remedies.map((remedy) => ({
  slug: remedy.slug,
  figure: remedy.vessel,
  accent: FLUID[remedy.vessel],
  figureCaption: VESSEL_CAPTION[remedy.vessel],
  kicker: remedy.form,
  title: remedy.name,
  tagline: remedy.tagline,
  body: remedy.description,
  footnote: remedy.method,
  footnoteSource: remedy.source,
  satellites: remedy.ingredients.map((ingredient) => ({
    mark: ingredient.glyph,
    name: ingredient.name,
    sub: ingredient.sanskrit,
    note: ingredient.role,
    tint: ingredient.tint,
  })),
  links: remedy.usedIn,
}));
