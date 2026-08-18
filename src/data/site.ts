/**
 * Single source of truth for public-site content.
 *
 * Section components render from these objects, and the JSON-LD in
 * src/pages/Index.tsx is generated from the same data — so the structured data
 * a crawler reads can never drift from the copy a visitor sees.
 */

export const clinic = {
  name: 'Sri Vinayaga Ayurvibe',
  legalName: 'Sri Vinayaga Ayurvibe Ayurveda Hospital',
  tagline: 'Government-certified Ayurveda hospital in Chennai',
  regNo: '2095',
  phone: '+918122939197',
  phoneDisplay: '+91 81229 39197',
  whatsapp: '918122939197',
  email: 'sv.ayurvibe@gmail.com',
  url: 'https://svayurvibe.com',
  street: '12/597, Main Road, Nethaji Nagar Main Rd, Nookampalayam, Perumbakkam',
  locality: 'Chennai',
  region: 'Tamil Nadu',
  postalCode: '600131',
  country: 'IN',
  geo: { lat: 12.87961085860525, lng: 80.20520937617553 },
  hours: 'Every day · 10:00 AM – 8:00 PM',
  hoursOpens: '10:00',
  hoursCloses: '20:00',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=12.87961085860525,80.20520937617553',
  ratingValue: '4.9',
  reviewCount: '13',
} as const;

export const doctor = {
  name: 'Dr. V. Vaitheeshwari',
  shortName: 'Dr. Vaitheeshwari',
  qualification: 'B.A.M.S.',
  role: 'Panchakarma & Women’s Health Specialist',
  experience: '3+ years',
  languages: ['English', 'Tamil', 'Hindi'],
  bio:
    'Dr. V. Vaitheeshwari takes the time to read your pulse, constitution and history before a single therapy is prescribed. Every plan is built around your dosha balance, your medical background and what you actually want to change.',
  credentials: [
    'B.A.M.S. — Bachelor of Ayurvedic Medicine and Surgery',
    'Government-registered practitioner · Reg. No. 2095',
    'Specialist in Panchakarma and women’s health',
    'Consults in English, Tamil and Hindi',
  ],
} as const;

export const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/medicines', label: 'Medicines' },
  { to: '/doctors', label: 'Doctor' },
  { to: '/testimonials', label: 'Stories' },
  { to: '/dosha', label: 'Dosha' },
  { to: '/faq', label: 'FAQ' },
] as const;

export const stats = [
  { value: '100+', label: 'Patients treated', detail: 'Across Chennai and OMR' },
  { value: '33', label: 'Signature therapies', detail: 'Classical Kerala protocols' },
  { value: '4.9', label: 'Google rating', detail: `${clinic.reviewCount} verified reviews`, suffix: '★' },
  { value: '7', label: 'Days a week', detail: '10 AM – 8 PM, no weekly off' },
] as const;

export const heroSlides = [
  {
    id: 'hospital',
    label: 'Our hospital',
    heading: 'A calm, certified clinical space',
    caption: 'Government-certified facility at Nookampalayam, Perumbakkam.',
    alt: 'Sri Vinayaga Ayurvibe Ayurveda hospital building at Nookampalayam, Perumbakkam, Chennai',
  },
  {
    id: 'panchakarma',
    label: 'Panchakarma',
    heading: 'Full-body detox, done properly',
    caption: 'A supervised 7–21 day cleanse that resets your doshas.',
    alt: 'Panchakarma detox therapy in progress at Sri Vinayaga Ayurvibe, Chennai',
  },
  {
    id: 'shirodhara',
    label: 'Shirodhara',
    heading: 'Warm oil, steady stream, quiet mind',
    caption: 'For insomnia, anxiety and long-running stress.',
    alt: 'Shirodhara therapy — warm medicated oil poured over the forehead at Sri Vinayaga Ayurvibe',
  },
  {
    id: 'abhyanga',
    label: 'Abhyanga',
    heading: 'Synchronised herbal oil massage',
    caption: 'Releases tension, improves circulation, nourishes tissue.',
    alt: 'Abhyanga full-body herbal oil massage at Sri Vinayaga Ayurvibe, Chennai',
  },
  {
    id: 'herbs',
    label: 'Herbal medicine',
    heading: 'Formulations prepared the classical way',
    caption: 'Authentic herbs, in-house pharmacy, traceable sourcing.',
    alt: 'Authentic Ayurvedic herbs and formulations used at Sri Vinayaga Ayurvibe, Chennai',
  },
] as const;

export const trustPoints = [
  { label: 'Govt. certified', detail: `Reg. No. ${clinic.regNo}` },
  { label: 'B.A.M.S. doctor', detail: 'Every plan is doctor-led' },
  { label: 'Open 7 days', detail: '10 AM – 8 PM' },
] as const;

export const differentiators = [
  {
    title: 'Certified, not improvised',
    text: 'A government-certified hospital (Reg. 2095) with a qualified B.A.M.S. practitioner — not a spa running massage under an Ayurvedic name.',
  },
  {
    title: 'Diagnosis before therapy',
    text: 'Pulse reading, constitution assessment and history first. The therapy plan is written after that, never before.',
  },
  {
    title: 'Authentic materials',
    text: 'Classical formulations, fresh herbal preparations and medicated oils prepared to traditional specification.',
  },
  {
    title: 'Clean clinical rooms',
    text: 'Dedicated therapy rooms, fresh linen for every session and trained therapists supervised by the doctor.',
  },
] as const;

export const approachSteps = [
  {
    step: '01',
    title: 'Consultation',
    text: 'A full assessment — pulse, tongue, digestion, sleep, history and current medication.',
  },
  {
    step: '02',
    title: 'Your plan',
    text: 'Therapies, herbal medicines and diet mapped to your constitution and your schedule.',
  },
  {
    step: '03',
    title: 'Treatment',
    text: 'Sessions delivered by trained therapists in dedicated rooms, supervised throughout.',
  },
  {
    step: '04',
    title: 'Follow-up',
    text: 'Progress reviewed, plan adjusted, and lifestyle guidance you can actually keep up.',
  },
] as const;

export const testimonials = [
  {
    name: 'Ananya Sharma',
    condition: 'Chronic stress & anxiety',
    treatment: 'Panchakarma programme',
    rating: 5,
    quote:
      'After my 14-day Panchakarma programme, I feel like a completely new person. The stress that had been weighing me down for years is gone, and I have energy I haven’t felt in decades.',
  },
  {
    name: 'Priyanka Iyer',
    condition: 'Digestive issues',
    treatment: 'Detox therapy',
    rating: 5,
    quote:
      'The personalised treatment plan and herbal medicines completely transformed my digestive health. I’m finally able to enjoy food again without discomfort.',
  },
  {
    name: 'Meera Nair',
    condition: 'Chronic joint pain',
    treatment: 'Abhyanga & herbal therapy',
    rating: 5,
    quote:
      'The Abhyanga massages and herbal treatments gave me relief from joint pain that conventional medicine couldn’t address. I’m grateful for this holistic approach.',
  },
  {
    name: 'Aishwarya Menon',
    condition: 'Insomnia & anxiety',
    treatment: 'Shirodhara',
    rating: 5,
    quote:
      'Shirodhara sessions calmed my mind like nothing else. I sleep peacefully now and feel centred throughout the day.',
  },
  {
    name: 'Kavya Reddy',
    condition: 'Skin health',
    treatment: 'Rejuvenation programme',
    rating: 5,
    quote:
      'After the rejuvenation programme my skin is glowing and I feel lighter and more positive. Truly life-changing.',
  },
  {
    name: 'Sneha Kapoor',
    condition: 'Thyroid & metabolism',
    treatment: 'Holistic detox',
    rating: 5,
    quote:
      'Gentle detox and diet guidance improved my thyroid balance. My energy is back and my mood is stable.',
  },
] as const;

export const doshas = [
  {
    name: 'Vata',
    element: 'Air & Space',
    summary: 'Light, quick and creative — and the first to feel dryness, anxiety and irregular sleep.',
    traits: ['Creative', 'Energetic', 'Light build', 'Quick thinking', 'Feels cold easily'],
    lifestyle: ['Regular routine', 'Warm cooked food', 'Gentle exercise', 'Oil massage', 'Early nights'],
    accent: 'from-sky-100 to-violet-100',
  },
  {
    name: 'Pitta',
    element: 'Fire & Water',
    summary: 'Sharp, driven and warm — prone to acidity, inflammation and burning out.',
    traits: ['Ambitious', 'Focused', 'Medium build', 'Strong digestion', 'Runs warm'],
    lifestyle: ['Cooling foods', 'Less spice & caffeine', 'Moderate exercise', 'Shade & rest', 'Work–rest balance'],
    accent: 'from-amber-100 to-rose-100',
  },
  {
    name: 'Kapha',
    element: 'Earth & Water',
    summary: 'Steady, calm and strong — with a tendency to congestion, heaviness and slow metabolism.',
    traits: ['Calm', 'Stable', 'Strong build', 'Good stamina', 'Slow metabolism'],
    lifestyle: ['Light warm food', 'Daily movement', 'Early rising', 'Warming spices', 'Stay active'],
    accent: 'from-emerald-100 to-lime-100',
  },
] as const;

export const faqs = [
  {
    id: 'what-is-ayurveda',
    question: 'What is Ayurveda and how can it help me?',
    answer:
      'Ayurveda is a 5,000-year-old holistic system of medicine from India that works on the balance between body, mind and lifestyle. Rather than only suppressing symptoms, treatment addresses the pattern causing them — using herbal medicines, therapeutic procedures and diet and routine changes suited to your constitution.',
  },
  {
    id: 'first-consultation',
    question: 'What happens during my first consultation?',
    answer:
      'Your first visit is a full assessment: pulse and tongue examination, constitution analysis, and a discussion of your medical history, medication, digestion, sleep and current concerns. Only after that does Dr. Vaitheeshwari write your treatment plan — which may combine therapies, herbal medicines and lifestyle guidance.',
  },
  {
    id: 'dosha-determination',
    question: 'How do you determine my dosha type?',
    answer:
      'Through a structured consultation — pulse diagnosis, physical examination, and an assessment of your digestion, sleep, temperament and how you respond to seasons and environments. Our online dosha quiz gives you an indication, but the clinical assessment is what your treatment plan is based on.',
  },
  {
    id: 'treatment-duration',
    question: 'How long before I see results?',
    answer:
      'It depends on the condition. Acute complaints often ease within days to a few weeks. Chronic conditions usually need three to six months of consistent treatment for lasting change. Panchakarma programmes run 7–21 days, with the deeper benefits continuing for months afterwards.',
  },
  {
    id: 'safety-side-effects',
    question: 'Are Ayurvedic treatments safe? Any side effects?',
    answer:
      'When prescribed and supervised by a qualified practitioner, yes. We use tested, authentic herbs and follow strict hygiene and safety protocols. Mild detox effects — temporary tiredness or changes in digestion — are normal during a cleanse, and every patient is monitored so the plan can be adjusted.',
  },
  {
    id: 'modern-medicine',
    question: 'Can I continue my current medication?',
    answer:
      'Yes. Ayurveda works alongside conventional medicine, and we never advise stopping prescribed medication without your treating doctor’s approval. Bring your current prescriptions and recent reports to the consultation so the plan can be built around them.',
  },
  {
    id: 'panchakarma-process',
    question: 'What is Panchakarma and who is it for?',
    answer:
      'Panchakarma is a supervised detoxification and rejuvenation programme built on five classical purification procedures. It suits chronic conditions, stress-related disorders, digestive problems and general health maintenance. The protocol is customised to your constitution and typically runs 7–21 days.',
  },
  {
    id: 'dietary-restrictions',
    question: 'Will I have to follow a special diet?',
    answer:
      'You will get dietary guidelines matched to your dosha and condition. These are practical adjustments rather than severe restrictions, designed to support digestion and healing while still fitting the way you actually eat.',
  },
  {
    id: 'appointment-preparation',
    question: 'How should I prepare for my appointment?',
    answer:
      'Come rested and avoid a heavy meal in the two hours before your visit. Bring a list of current medications and supplements plus any recent medical reports, and wear comfortable loose clothing — especially if a therapy is scheduled the same day.',
  },
  {
    id: 'children-elderly',
    question: 'Is Ayurveda suitable for children and elderly patients?',
    answer:
      'Yes. Protocols are adapted by age — milder therapies, adjusted dosages and age-appropriate herbs. Many families come to us together, from children to grandparents.',
  },
  {
    id: 'location',
    question: 'Where are you located and how do I reach you?',
    answer:
      `We are at ${clinic.street}, ${clinic.locality} ${clinic.postalCode} — a short drive from Sholinganallur, OMR, Pallikaranai, Medavakkam, Velachery and Tambaram. Call ${clinic.phoneDisplay} and we will guide you in.`,
  },
  {
    id: 'appointment-booking',
    question: 'Do I need an appointment, or can I walk in?',
    answer:
      `Appointments are recommended so the doctor has time for a full assessment and a therapy room is reserved for you. Book online through this site or call ${clinic.phoneDisplay}. We are open every day, 10 AM to 8 PM.`,
  },
] as const;

export const inquiryTypes = [
  'Appointment',
  'Panchakarma',
  'Abhyanga',
  'Shirodhara',
  'Detox',
  'Rejuvenation',
  'General Inquiry',
] as const;

/**
 * Hero imagery lives in /public/hero with stable filenames so the LCP frame can
 * be preloaded by URL. Two crops of each frame are generated by
 * `npm run images`: a 4:5 portrait for the hero gallery and a 4:3 landscape for
 * in-page scenes.
 */
export const heroImage = (id: string, width: 700 | 1100 | 1800) => `/hero/${id}-${width}.webp`;
export const heroSrcSet = (id: string) =>
  `${heroImage(id, 700)} 700w, ${heroImage(id, 1100)} 1100w, ${heroImage(id, 1800)} 1800w`;

/** 4:3 crop of the same frames, for sections that need a landscape image. */
export const sceneImage = (id: string, width: 900 | 1400) => `/hero/${id}-wide-${width}.webp`;
export const sceneSrcSet = (id: string) =>
  `${sceneImage(id, 900)} 900w, ${sceneImage(id, 1400)} 1400w`;
