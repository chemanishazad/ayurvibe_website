import React, { useMemo } from 'react';
import SEO from '@/components/SEO';
import SmoothScroll from '@/components/SmoothScroll';
import ProgressiveWebApp from '@/components/ProgressiveWebApp';
import LiveChat from '@/components/LiveChat';

import SiteHeader from '@/components/site/SiteHeader';
import Hero from '@/components/site/Hero';
import StatsBand from '@/components/site/StatsBand';
import StartHere from '@/components/site/StartHere';
import AboutSection from '@/components/site/AboutSection';
import JourneySection from '@/components/site/JourneySection';
import TreatmentsSection from '@/components/site/TreatmentsSection';
import ApothecarySection from '@/components/site/ApothecarySection';
import PanchakarmaSection from '@/components/site/PanchakarmaSection';
import ConcernsSection from '@/components/site/ConcernsSection';
import DoctorSection from '@/components/site/DoctorSection';
import TestimonialsSection from '@/components/site/TestimonialsSection';
import WhySection from '@/components/site/WhySection';
import DoshaSection from '@/components/site/DoshaSection';
import FaqSection from '@/components/site/FaqSection';
import BookingSection from '@/components/site/BookingSection';
import SiteFooter from '@/components/site/SiteFooter';
import MobileCtaBar from '@/components/site/MobileCtaBar';
import { RouteTransition, ScrollRail } from '@/components/site/Chrome';
import { useSiteTheme } from '@/components/site/motion';

import { clinic, faqs } from '@/data/site';
import { treatments } from '@/data/treatments';
import { remedies } from '@/data/remedies';
import { panchakarma } from '@/data/scenes';

/** Sections surfaced by the right-hand scroll rail. */
const RAIL_SECTIONS = [
  { id: 'hero-section', label: 'Top' },
  { id: 'about', label: 'The clinic' },
  { id: 'journey', label: 'How it works' },
  { id: 'panchakarma', label: 'Panchakarma' },
  { id: 'treatments', label: 'Therapies' },
  { id: 'dispensary', label: 'The medicine' },
  { id: 'body-map', label: 'Your concern' },
  { id: 'doctors', label: 'Your doctor' },
  { id: 'testimonials', label: 'Stories' },
  { id: 'why', label: 'Why us' },
  { id: 'dosha', label: 'Dosha' },
  { id: 'faq', label: 'Questions' },
  { id: 'booking', label: 'Book' },
];

const LOCATIONS = [
  'Perumbakkam', 'Nookampalayam', 'Sholinganallur', 'OMR', 'Pallikaranai', 'Navalur',
  'Kelambakkam', 'Tambaram', 'Medavakkam', 'Velachery', 'Chromepet', 'Thoraipakkam',
  'Thiruvanmiyur', 'Adyar', 'Guindy', 'Chennai',
];

export interface IndexSeoProps {
  /** Route-specific <title>. Defaults to the landing-page title. */
  title?: string;
  description?: string;
  /** Absolute canonical URL for this route. */
  canonical?: string;
  /** Adds a BreadcrumbList entry below "Home" for section deep-links. */
  breadcrumb?: { name: string; path: string };
  /** Overrides the location keyword set used for the meta keywords tag. */
  locationKeywords?: string[];
}

const DEFAULT_TITLE = 'Ayurveda Hospital in Chennai | Sri Vinayaga Ayurvibe';
const DEFAULT_DESCRIPTION =
  'Government-certified Ayurveda hospital in Perumbakkam, Chennai. Panchakarma, Abhyanga and Shirodhara, prescribed by Dr. V. Vaitheeshwari, B.A.M.S.';

/**
 * Public landing page.
 *
 * Layout lives in src/components/site/*; this file wires the sections together
 * and derives the page's structured data from the same content the sections
 * render, so schema and copy cannot drift apart. Section deep-links
 * (/about, /treatments, …) render this same page through SectionPage and pass
 * their own title/description/canonical, so exactly one <SEO> runs per route.
 */
const Index = ({ title, description, canonical, breadcrumb, locationKeywords }: IndexSeoProps = {}) => {
  useSiteTheme();

  const jsonLd = useMemo(
    () => [
      {
        '@type': 'ItemList',
        name: `Ayurvedic treatments at ${clinic.name}`,
        numberOfItems: treatments.length,
        itemListElement: treatments.map((treatment, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'MedicalTherapy',
            name: treatment.name,
            description: treatment.description,
            medicineSystem: 'https://schema.org/Ayurvedic',
            relevantSpecialty: 'Ayurvedic',
            provider: { '@id': `${clinic.url}/#business` },
          },
        })),
      },
      {
        '@type': 'ItemList',
        name: `Classical Ayurvedic preparations dispensed at ${clinic.name}`,
        numberOfItems: remedies.length,
        itemListElement: remedies.map((remedy, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'Drug',
            name: remedy.name,
            alternateName: remedy.form,
            description: remedy.description,
            activeIngredient: remedy.ingredients.map((ingredient) => ingredient.name),
            drugClass: { '@type': 'DrugClass', name: 'Classical Ayurvedic formulation' },
            isProprietary: false,
            manufacturer: { '@id': `${clinic.url}/#business` },
            prescriptionStatus: 'https://schema.org/PrescriptionOnly',
            citation: remedy.source,
          },
        })),
      },
      {
        '@type': 'MedicalProcedure',
        name: 'Panchakarma',
        alternateName: 'Pancha karma — the five actions',
        description: panchakarma.body,
        procedureType: 'https://schema.org/PercutaneousProcedure',
        howPerformed: panchakarma.footnote,
        preparation:
          'Preceded by oleation (snehana) and sudation (swedana); prescribed only after clinical assessment.',
        followup: 'A graded return to normal diet and a Rasayana course.',
        relevantSpecialty: 'Ayurvedic',
        provider: { '@id': `${clinic.url}/#business` },
        subjectOf: panchakarma.satellites.map((action) => ({
          '@type': 'MedicalProcedure',
          name: action.name,
          alternateName: action.sub,
          description: action.note,
          relevantSpecialty: 'Ayurvedic',
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${clinic.url}/` },
          ...(breadcrumb
            ? [{ '@type': 'ListItem', position: 2, name: breadcrumb.name, item: `${clinic.url}${breadcrumb.path}` }]
            : []),
        ],
      },
    ],
    [breadcrumb]
  );

  return (
    <div className="min-h-dvh bg-background">
      <SEO
        title={title ?? DEFAULT_TITLE}
        description={description ?? DEFAULT_DESCRIPTION}
        canonical={canonical ?? `${clinic.url}/`}
        locationKeywords={locationKeywords ?? LOCATIONS}
        jsonLd={jsonLd}
      />

      <a href="#main" className="skip-link">Skip to main content</a>

      <RouteTransition />

      <SmoothScroll />
      <ProgressiveWebApp />

      <SiteHeader />
      <ScrollRail sections={RAIL_SECTIONS} />

      <main id="main">
        <Hero />
        <StartHere />
        <StatsBand />
        <AboutSection />
        <JourneySection />
        <PanchakarmaSection />
        <TreatmentsSection />
        <ApothecarySection />
        <ConcernsSection />
        <DoctorSection />
        <TestimonialsSection />
        <WhySection />
        <DoshaSection />
        <FaqSection />
        <BookingSection />
      </main>

      <SiteFooter />
      <MobileCtaBar />
      <LiveChat />

    </div>
  );
};

export default Index;
