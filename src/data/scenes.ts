import type { SceneData } from '@/components/site/exploded/types';

/* ---------------------------------------------------------------------------
 * Content for the exploded scenes
 * ---------------------------------------------------------------------------
 * Each scene is a figure that comes apart to show what is inside it. The copy
 * here is the copy a crawler reads — nothing in these sections is
 * decoration-only, and every therapy slug must exist in src/data/treatments.ts.
 * ------------------------------------------------------------------------- */

/* -- The five actions ------------------------------------------------------ */

export const panchakarma: SceneData = {
  slug: 'panchakarma',
  figure: 'lotus',
  figureCaption: 'The five actions',
  accent: '38 86% 58%',
  kicker: 'The five actions · Pancha karma',
  title: 'Panchakarma',
  tagline: 'Five ways the body is emptied before it is rebuilt.',
  body:
    'Panchakarma is not a massage package. It is five classical purification procedures, run in sequence after the body has been oiled and sweated enough to release what is stuck. Which of the five you get — and whether you get any — is decided at consultation, not at booking.',
  footnote: 'Preceded by oleation and sudation; followed by a graded return to normal diet.',
  footnoteSource: 'Charaka Samhita, Sutrasthana',
  satellites: [
    { mark: 'vamana', name: 'Vamana', sub: 'Emesis', note: 'Clears Kapha from the chest', tint: 'stone' },
    { mark: 'virechana', name: 'Virechana', sub: 'Purgation', note: 'Clears Pitta from the gut', tint: 'amber' },
    { mark: 'vasti', name: 'Vasti', sub: 'Medicated enema', note: 'The first answer for Vata', tint: 'leaf' },
    { mark: 'nasya', name: 'Nasya', sub: 'Nasal instillation', note: 'Clears the head and sinuses', tint: 'leaf' },
    { mark: 'blooddrop', name: 'Raktamokshana', sub: 'Blood-letting', note: 'For skin and blood disorders', tint: 'clay' },
  ],
  links: [
    { name: 'Nasyam', slug: 'nasyam' },
    { name: 'Kashaya Vasti', slug: 'kashaya-vasti' },
    { name: 'Matra Vasti', slug: 'matra-vasti' },
    { name: 'Pizhichil', slug: 'pizhichil' },
  ],
};

/* -- The three doshas ------------------------------------------------------ */

export const doshaScenes: SceneData[] = [
  {
    slug: 'vata',
    figure: 'windpot',
  figureCaption: 'Air, escaping',
    accent: '196 60% 66%',
    kicker: 'Air & space · Vata',
    title: 'Vata',
    tagline: 'Movement — and the first thing to go out of rhythm.',
    body:
      'Vata governs everything that moves: breath, circulation, nerve impulse, the passage of food. It is light, dry, cold and irregular, which is why a Vata imbalance shows up as anxiety, insomnia, bloating, cracking joints and cold hands rather than as one clean symptom.',
    footnote: 'Settled by warmth, oil, weight and above all by routine.',
    footnoteSource: 'Ashtanga Hridayam, Sutrasthana',
    satellites: [
      { mark: 'wind', name: 'Dry skin', note: 'Rough, flaking, thirsty', tint: 'stone' },
      { mark: 'feather', name: 'Light frame', note: 'Thin build, hard to gain', tint: 'stone' },
      { mark: 'snowflake', name: 'Cold hands', note: 'Poor peripheral circulation', tint: 'stone' },
      { mark: 'moon', name: 'Broken sleep', note: 'Wakes between 2 and 4', tint: 'leaf' },
      { mark: 'waves', name: 'Irregular digestion', note: 'Gas, bloating, variable appetite', tint: 'clay' },
    ],
    links: [
      { name: 'Shareera Abhyangam', slug: 'shareera-abhyangam' },
      { name: 'Pizhichil', slug: 'pizhichil' },
      { name: 'Matra Vasti', slug: 'matra-vasti' },
      { name: 'Shirodhara', slug: 'shirodhara' },
    ],
  },
  {
    slug: 'pitta',
    figure: 'lamp',
  figureCaption: 'The inner flame',
    accent: '22 88% 58%',
    kicker: 'Fire & water · Pitta',
    title: 'Pitta',
    tagline: 'Transformation — the fire that digests food and ideas alike.',
    body:
      'Pitta runs digestion, metabolism, body temperature and the sharpness of the mind. Sharp, hot, light and slightly oily — so when it rises you get acidity, inflammation, skin flare-ups, a short fuse and the particular exhaustion of someone who cannot stop working.',
    footnote: 'Settled by cooling, by shade, and by finishing the day before the day finishes you.',
    footnoteSource: 'Ashtanga Hridayam, Sutrasthana',
    satellites: [
      { mark: 'flame', name: 'Sharp appetite', note: 'Cannot skip a meal', tint: 'amber' },
      { mark: 'sun', name: 'Runs warm', note: 'Dislikes heat and midday sun', tint: 'amber' },
      { mark: 'target', name: 'Focused mind', note: 'Driven, precise, impatient', tint: 'clay' },
      { mark: 'thermometer', name: 'Acidity', note: 'Reflux, burning, loose stool', tint: 'clay' },
      { mark: 'spark', name: 'Skin flare-ups', note: 'Rashes, acne, redness', tint: 'clay' },
    ],
    links: [
      { name: 'Takra Dhara', slug: 'takra-dhara' },
      { name: 'Ksheera Dhara', slug: 'ksheera-dhara' },
      { name: 'Netra Tarpanam', slug: 'netra-tarpanam' },
      { name: 'Navara Mukha Lepam', slug: 'navara-mukha-lepam' },
    ],
  },
  {
    slug: 'kapha',
    figure: 'earthjar',
  figureCaption: 'Earth, held',
    accent: '140 44% 52%',
    kicker: 'Earth & water · Kapha',
    title: 'Kapha',
    tagline: 'Structure — what holds the whole thing together.',
    body:
      'Kapha is the tissue, the fluid and the calm: it builds the body and lubricates every joint in it. Heavy, cool, slow and stable — which is a gift until it accumulates, and then it reads as weight gain, congestion, sluggish digestion, oversleeping and a reluctance to start.',
    footnote: 'Settled by dry heat, by movement, and by rising before the sun does.',
    footnoteSource: 'Ashtanga Hridayam, Sutrasthana',
    satellites: [
      { mark: 'anchor', name: 'Steady build', note: 'Strong frame, good stamina', tint: 'leaf' },
      { mark: 'hourglass', name: 'Slow digestion', note: 'Heavy after meals', tint: 'clay' },
      { mark: 'bed', name: 'Deep sleep', note: 'Sleeps long, wakes slowly', tint: 'stone' },
      { mark: 'mountain', name: 'Calm temperament', note: 'Patient, hard to rattle', tint: 'leaf' },
      { mark: 'cloud', name: 'Congestion', note: 'Sinus, mucus, damp chest', tint: 'stone' },
    ],
    links: [
      { name: 'Udwarthanam', slug: 'udwarthanam' },
      { name: 'Podi Kizhi', slug: 'podi-kizhi' },
      { name: 'Valuka Swedanam', slug: 'valuka-swedanam' },
      { name: 'Baspa Sweda', slug: 'baspa-sweda' },
    ],
  },
];

/* -- What you came in with ------------------------------------------------- */

export const concernScenes: SceneData[] = [
  {
    slug: 'mind',
    figure: 'head',
  figureCaption: 'Head and mind',
    accent: '196 55% 60%',
    kicker: 'Stress, sleep & mind',
    title: 'The head that will not switch off',
    tagline: 'Where most of our OMR patients start.',
    body:
      'Warm oil held on the forehead does something no tablet does: it drops the nervous system out of alert. These are the therapies we run for insomnia, anxiety, migraine and burnout — usually as a course of seven to fourteen sessions rather than a one-off.',
    footnote: 'Typical course: 7–14 sessions, 45–60 minutes each.',
    satellites: [
      { mark: 'wind', name: 'Anxiety', note: 'Restlessness, racing thought', tint: 'stone' },
      { mark: 'moon', name: 'Insomnia', note: 'Cannot fall or stay asleep', tint: 'leaf' },
      { mark: 'spark', name: 'Migraine', note: 'Recurrent one-sided headache', tint: 'clay' },
      { mark: 'battery', name: 'Burnout', note: 'Tired but wired', tint: 'amber' },
      { mark: 'rain', name: 'Low mood', note: 'Flat, withdrawn, unmotivated', tint: 'stone' },
    ],
    links: [
      { name: 'Shirodhara', slug: 'shirodhara' },
      { name: 'Takra Dhara', slug: 'takra-dhara' },
      { name: 'Thalapothichil', slug: 'thalapothichil' },
      { name: 'Shiro Abhyangam', slug: 'shiro-abhyangam' },
    ],
  },
  {
    slug: 'joints',
    figure: 'joint',
  figureCaption: 'The knee joint',
    accent: '38 84% 56%',
    kicker: 'Joints, spine & muscle',
    title: 'A joint that has stopped moving',
    tagline: 'Heat, oil and pressure, applied exactly where it hurts.',
    body:
      'Vasti therapies hold warm medicated oil over one joint inside a dough ring for half an hour, so the oil works on that structure and nowhere else. For discs, cervical pain and osteoarthritis this localised approach does more than a whole-body massage ever will.',
    footnote: 'Assessed first — imaging and current medication are reviewed before any heat is applied.',
    satellites: [
      { mark: 'spine', name: 'Low back pain', note: 'Disc, strain, spasm', tint: 'clay' },
      { mark: 'neck', name: 'Cervical pain', note: 'Neck, shoulder, referred arm', tint: 'stone' },
      { mark: 'knee', name: 'Knee pain', note: 'Osteoarthritis, swelling', tint: 'amber' },
      { mark: 'snowflake', name: 'Arthritis', note: 'Worse in cold and rain', tint: 'stone' },
      { mark: 'nerve', name: 'Sciatica', note: 'Shooting pain down the leg', tint: 'clay' },
    ],
    links: [
      { name: 'Kati Vasti', slug: 'kati-vasti' },
      { name: 'Greeva Vasti', slug: 'greeva-vasti' },
      { name: 'Jaanu Vasti', slug: 'jaanu-vasti' },
      { name: 'Elakizhi', slug: 'elakizhi' },
    ],
  },
  {
    slug: 'digestion',
    figure: 'gut',
  figureCaption: 'Agni — the cooking pot',
    accent: '28 82% 55%',
    kicker: 'Digestion & metabolism',
    title: 'Agni — the fire that decides everything',
    tagline: 'Almost every chronic complaint is traced back here first.',
    body:
      'Ayurveda reads poor digestion as the origin of most long-running disease: what is not digested becomes ama, and ama is what blocks the channels. So the plan usually starts by restoring appetite and regularity before anything is added on top of it.',
    footnote: 'Diet guidance comes with every plan — practical adjustments, not a severe restriction.',
    satellites: [
      { mark: 'intestine', name: 'IBS', note: 'Alternating, urgent, unpredictable', tint: 'leaf' },
      { mark: 'flame', name: 'Acidity', note: 'Reflux and burning', tint: 'amber' },
      { mark: 'belly', name: 'Bloating', note: 'Heavy and distended after food', tint: 'stone' },
      { mark: 'scale', name: 'Weight gain', note: 'Slow metabolism, stubborn fat', tint: 'clay' },
      { mark: 'thyroid', name: 'Thyroid imbalance', note: 'Managed alongside your physician', tint: 'stone' },
    ],
    links: [
      { name: 'Udwarthanam', slug: 'udwarthanam' },
      { name: 'Podi Kizhi', slug: 'podi-kizhi' },
      { name: 'Matra Vasti', slug: 'matra-vasti' },
      { name: 'Kashaya Vasti', slug: 'kashaya-vasti' },
    ],
  },
  {
    slug: 'womens-health',
    figure: 'womb',
  figureCaption: 'The womb',
    accent: '340 52% 62%',
    kicker: "Women's health",
    title: 'Cycle, fertility and after the birth',
    tagline: 'Handled by a doctor who specialises in it.',
    body:
      'Dr. Vaitheeshwari’s clinical focus is women’s health, and a large share of the hospital’s work is here: PCOS, painful and irregular cycles, fertility support, and the 42-day postnatal care that Kerala Ayurveda treats as non-negotiable.',
    footnote: 'Consultation and therapy with a female physician and female therapists throughout.',
    satellites: [
      { mark: 'ovary', name: 'PCOS', note: 'Cycle, weight and skin together', tint: 'clay' },
      { mark: 'cycle', name: 'Irregular cycles', note: 'Missed, early or prolonged', tint: 'stone' },
      { mark: 'cramp', name: 'Period pain', note: 'Cramping, clots, heaviness', tint: 'amber' },
      { mark: 'baby', name: 'Postnatal care', note: 'The classical 42-day protocol', tint: 'leaf' },
      { mark: 'shoot', name: 'Fertility support', note: 'Alongside your treating doctor', tint: 'leaf' },
    ],
    links: [
      { name: 'Yoni Prakshalanam', slug: 'yoni-prakshalanam' },
      { name: 'Prishta Vasti', slug: 'prishta-vasti' },
      { name: 'Shareera Abhyangam', slug: 'shareera-abhyangam' },
      { name: 'Navara Kizhi', slug: 'navara-kizhi' },
    ],
  },
];

/* -- What a course of treatment actually looks like ------------------------ */

export const journeyScenes: SceneData[] = [
  {
    slug: 'consultation',
    figure: 'hand',
  figureCaption: 'Reading the pulse',
    accent: '38 84% 58%',
    kicker: 'Step one · Consultation',
    title: 'Forty minutes before anything is prescribed',
    tagline: 'Three fingers on the wrist, and a great many questions.',
    body:
      'Nadi pariksha — pulse reading at three positions — is where the assessment starts, not where it ends. Tongue, eyes, digestion, sleep, cycle, stress, current medication and recent reports all go into the picture before a single therapy is named.',
    footnote: 'Bring your current prescriptions and any recent reports.',
    footnoteSource: '40–60 minutes',
    satellites: [
      { mark: 'nadi', name: 'Nadi pariksha', sub: 'Pulse reading', note: 'Vata, Pitta and Kapha at three positions', tint: 'amber' },
      { mark: 'eye', name: 'Tongue & eyes', note: 'Coating, colour, ama load', tint: 'clay' },
      { mark: 'clipboard', name: 'History', note: 'Reports and current medication', tint: 'stone' },
      { mark: 'moon', name: 'Sleep & digestion', note: 'The two questions that decide most', tint: 'leaf' },
      { mark: 'compass', name: 'Prakriti', note: 'Your constitution, written down', tint: 'leaf' },
    ],
  },
  {
    slug: 'plan',
    figure: 'scroll',
  figureCaption: 'Your written plan',
    accent: '120 42% 50%',
    kicker: 'Step two · Your plan',
    title: 'Written for you, on paper you take home',
    tagline: 'Therapies, medicines, diet and dates — not a package name.',
    body:
      'The plan says which therapies, in what order, for how many days, with which oils, alongside which herbal preparations, and what to eat while you are on it. It is built around your schedule, because a plan you cannot keep is a plan that does not work.',
    footnote: 'Reviewed and adjusted at every follow-up.',
    satellites: [
      { mark: 'checklist', name: 'Therapy list', note: 'In sequence, with reasons', tint: 'leaf' },
      { mark: 'pill', name: 'Medicines', note: 'Dispensed from our own pharmacy', tint: 'amber' },
      { mark: 'plate', name: 'Diet', note: 'Practical, not punishing', tint: 'clay' },
      { mark: 'calendar', name: 'Duration', note: 'Typically 7–21 days', tint: 'stone' },
      { mark: 'clock', name: 'Timing', note: 'Slots that fit your working day', tint: 'stone' },
    ],
  },
  {
    slug: 'treatment',
    figure: 'droni',
  figureCaption: 'The treatment table',
    accent: '30 78% 52%',
    kicker: 'Step three · Treatment',
    title: 'On the droni, supervised',
    tagline: 'Trained therapists, dedicated rooms, the doctor down the corridor.',
    body:
      'Therapy happens in a dedicated room on a traditional wooden droni, with oils warmed to the right temperature for your constitution. Sessions are delivered by trained therapists and reviewed by the physician through the course, not just at the start of it.',
    footnote: 'Same-gender therapists throughout; rest and a warm bath follow every session.',
    satellites: [
      { mark: 'door', name: 'Dedicated room', note: 'One patient at a time', tint: 'stone' },
      { mark: 'droplet', name: 'Warm oils', note: 'Chosen and heated per patient', tint: 'amber' },
      { mark: 'people', name: 'Trained therapists', note: 'Same gender, throughout', tint: 'leaf' },
      { mark: 'stethoscope', name: 'Doctor review', note: 'Through the course, not just day one', tint: 'clay' },
      { mark: 'bed', name: 'Rest after', note: 'Never rushed straight out', tint: 'stone' },
    ],
  },
  {
    slug: 'follow-up',
    figure: 'sprout',
  figureCaption: 'What you take home',
    accent: '140 46% 50%',
    kicker: 'Step four · After',
    title: 'What holds once you stop coming in',
    tagline: 'The part that decides whether any of it lasts.',
    body:
      'Panchakarma opens the tissue; Rasayana is what fills it back up. You leave with a rejuvenative preparation, a diet, a short daily routine and a follow-up date — and the plan is adjusted at that review rather than repeated blindly.',
    footnote: 'First review at two to four weeks, then as the condition needs.',
    satellites: [
      { mark: 'trend', name: 'Progress review', note: 'Measured against day one', tint: 'leaf' },
      { mark: 'sliders', name: 'Plan adjusted', note: 'Changed, not repeated', tint: 'stone' },
      { mark: 'leaf', name: 'Rasayana', note: 'Chyawanprash and its relatives', tint: 'leaf' },
      { mark: 'sunrise', name: 'Daily routine', note: 'Dinacharya you can actually keep', tint: 'amber' },
      { mark: 'droplets', name: 'Home oil', note: 'Self-massage between courses', tint: 'clay' },
    ],
  },
];
