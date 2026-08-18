import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import SEO from '@/components/SEO';
import SiteHeader from '@/components/site/SiteHeader';
import SiteFooter from '@/components/site/SiteFooter';
import MobileCtaBar from '@/components/site/MobileCtaBar';
import BookingCta from '@/components/site/BookingCta';
import { RouteTransition } from '@/components/site/Chrome';
import { AnimatedHeadline, Reveal, useSiteTheme } from '@/components/site/motion';

import AboutSection from '@/components/site/AboutSection';
import ApothecarySection from '@/components/site/ApothecarySection';
import BookingSection from '@/components/site/BookingSection';
import ConcernsSection from '@/components/site/ConcernsSection';
import DoctorSection from '@/components/site/DoctorSection';
import DoshaSection from '@/components/site/DoshaSection';
import FaqSection from '@/components/site/FaqSection';
import JourneySection from '@/components/site/JourneySection';
import PanchakarmaSection from '@/components/site/PanchakarmaSection';
import StatsBand from '@/components/site/StatsBand';
import TestimonialsSection from '@/components/site/TestimonialsSection';
import TreatmentsSection from '@/components/site/TreatmentsSection';
import WhySection from '@/components/site/WhySection';

import { clinic, doctor, faqs } from '@/data/site';
import { treatments } from '@/data/treatments';
import { remedies } from '@/data/remedies';
import { panchakarma } from '@/data/scenes';

/* ---------------------------------------------------------------------------
 * Focused pages
 * ---------------------------------------------------------------------------
 * These routes used to render the whole landing page and scroll to a section.
 * That gave nine URLs the same <h1>, the same body copy and the same
 * structured data, differing only in <title> — which is a duplicate-content
 * problem, and it also meant a visitor arriving on /treatments landed at the
 * top of a thirty-screen page.
 *
 * Each route now renders its own heading, its own opening paragraph, only the
 * sections it is about, and a closing call to action. Shorter for the patient,
 * distinct for a crawler.
 * ------------------------------------------------------------------------- */

interface PageConfig {
  eyebrow: string;
  h1: string;
  /** Trailing phrase of the h1, set in the brand colour. */
  highlight?: string;
  intro: string;
  sections: React.ReactNode;
  /** Page-specific structured data, beyond the breadcrumb. */
  schema?: Record<string, unknown>[];
  cta?: { title: string; note: string };
  /** /booking closes with the form itself, so it needs no CTA band. */
  hideCta?: boolean;
}

const therapyList = () => ({
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
});

const PAGES: Record<string, PageConfig> = {
  about: {
    eyebrow: 'About the hospital',
    h1: 'A certified Ayurveda hospital in',
    highlight: 'Perumbakkam, Chennai',
    intro:
      'Sri Vinayaga Ayurvibe is a government-registered Ayurveda hospital at Nookampalayam, Perumbakkam — classical Kerala protocols, delivered in dedicated therapy rooms and supervised by a qualified physician throughout.',
    sections: (
      <>
        <AboutSection />
        <StatsBand />
        <WhySection />
        <DoctorSection />
      </>
    ),
  },
  treatments: {
    eyebrow: 'Therapies',
    h1: '33 classical Ayurvedic treatments in',
    highlight: 'Chennai',
    intro:
      'Panchakarma, Abhyanga, Shirodhara, Pizhichil, Kati Vasti, Elakizhi and more — each prescribed after a constitutional assessment rather than sold as a package. Start from the therapy, or start from the symptom.',
    sections: (
      <>
        <TreatmentsSection />
        <ConcernsSection />
      </>
    ),
    schema: [therapyList()],
    cta: {
      title: 'Not sure which therapy you need?',
      note: 'That is what the consultation is for. Bring your reports and current medication; the plan is written after the assessment, not before it.',
    },
  },
  medicines: {
    eyebrow: 'The dispensary',
    h1: 'The Ayurvedic medicines we use, and',
    highlight: 'what is in them',
    intro:
      'Dhanwantharam Thailam, Triphala Churna, Podikizhi, Brahmi dhara oil, Yogaraja Guggulu and Chyawanprash — compounded in our own pharmacy, with every herb named.',
    sections: <ApothecarySection />,
    schema: [
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
            isProprietary: false,
            manufacturer: { '@id': `${clinic.url}/#business` },
            prescriptionStatus: 'https://schema.org/PrescriptionOnly',
            citation: remedy.source,
          },
        })),
      },
    ],
  },
  panchakarma: {
    eyebrow: 'Panchakarma',
    h1: 'Supervised Panchakarma treatment in',
    highlight: 'Chennai',
    intro:
      'Five classical purification procedures — Vamana, Virechana, Vasti, Nasya and Raktamokshana — preceded by oleation and sudation, and prescribed only after assessment. Programmes typically run 7 to 21 days.',
    sections: (
      <>
        <PanchakarmaSection />
        <JourneySection />
      </>
    ),
    schema: [
      {
        '@type': 'MedicalProcedure',
        name: 'Panchakarma',
        alternateName: 'Pancha karma — the five actions',
        description: panchakarma.body,
        howPerformed: panchakarma.footnote,
        preparation: 'Preceded by oleation (snehana) and sudation (swedana); prescribed after clinical assessment.',
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
    ],
  },
  doctors: {
    eyebrow: 'Your doctor',
    h1: `${doctor.name},`,
    highlight: doctor.qualification,
    intro:
      'Panchakarma and women’s-health specialist. Every treatment plan at this hospital is written after her assessment — pulse, history, constitution and current medication.',
    sections: (
      <>
        <DoctorSection />
        <TestimonialsSection />
      </>
    ),
    schema: [
      {
        '@type': 'Physician',
        name: `${doctor.name}, ${doctor.qualification}`,
        medicalSpecialty: 'Ayurvedic',
        knowsLanguage: doctor.languages,
        worksFor: { '@id': `${clinic.url}/#business` },
        address: {
          '@type': 'PostalAddress',
          streetAddress: clinic.street,
          addressLocality: clinic.locality,
          addressRegion: clinic.region,
          postalCode: clinic.postalCode,
          addressCountry: clinic.country,
        },
      },
    ],
    cta: {
      title: 'Consult Dr. Vaitheeshwari',
      note: 'A first consultation runs 40 to 60 minutes. Bring recent reports and a list of anything you are currently taking.',
    },
  },
  testimonials: {
    eyebrow: 'Patient stories',
    h1: 'What patients say after',
    highlight: 'finishing treatment',
    intro:
      'Accounts from people who completed a course here — Panchakarma, Shirodhara, Abhyanga and joint therapies — in their own words.',
    sections: <TestimonialsSection />,
  },
  why: {
    eyebrow: 'Why this hospital',
    h1: 'The difference between a spa and a',
    highlight: 'certified hospital',
    intro:
      'Government registration, a resident B.A.M.S. physician, dedicated therapy rooms and an in-house pharmacy — and no treatment sold before a diagnosis.',
    sections: (
      <>
        <WhySection />
        <StatsBand />
        <JourneySection />
      </>
    ),
  },
  dosha: {
    eyebrow: 'Your constitution',
    h1: 'Vata, Pitta and Kapha — find',
    highlight: 'your dosha',
    intro:
      'Three functional forces behind movement, transformation and structure. Everyone is a mix; treatment works on the gap between your birth constitution and your current state.',
    sections: <DoshaSection />,
    cta: {
      title: 'The quiz gives an indication. The consultation gives the answer.',
      note: 'Pulse reading, tongue and eye examination and a structured history are what your treatment plan is actually built on.',
    },
  },
  faq: {
    eyebrow: 'Questions',
    h1: 'Everything patients ask',
    highlight: 'before booking',
    intro:
      'Treatment duration, what a first consultation involves, whether Ayurveda works alongside your current medication, and what Panchakarma actually is.',
    sections: <FaqSection />,
    schema: [
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  },
  booking: {
    eyebrow: 'Appointments',
    h1: 'Book an Ayurveda consultation in',
    highlight: 'Perumbakkam, Chennai',
    intro:
      'Open every day, 10 AM to 8 PM. Tell us what is bothering you and when suits — the front desk will confirm your slot.',
    sections: <BookingSection />,
    hideCta: true,
  },
};

interface SectionPageProps {
  /** Key into PAGES; also the legacy landing-page section id. */
  sectionId: string;
  title: string;
  description?: string;
  canonical?: string;
  breadcrumbName?: string;
  path?: string;
}

const SectionPage = ({ sectionId, title, description, canonical, breadcrumbName, path }: SectionPageProps) => {
  useSiteTheme();
  const page = PAGES[sectionId] ?? PAGES.about;

  const jsonLd = useMemo(
    () => [
      ...(page.schema ?? []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${clinic.url}/` },
          ...(breadcrumbName && path
            ? [{ '@type': 'ListItem', position: 2, name: breadcrumbName, item: `${clinic.url}${path}` }]
            : []),
        ],
      },
    ],
    [page, breadcrumbName, path]
  );

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={title} description={description} canonical={canonical} jsonLd={jsonLd} />

      <a href="#main" className="skip-link">Skip to main content</a>
      <RouteTransition />
      <SiteHeader />

      <main id="main">
        {/* Page head: the one thing that makes this URL its own page. */}
        <section className="border-b border-border bg-secondary/30 pt-28 sm:pt-32">
          <div className="shell pb-12 sm:pb-16">
            <Reveal>
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <li>
                    <Link to="/" className="hover:text-primary">Home</Link>
                  </li>
                  <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                  <li className="text-foreground">{breadcrumbName ?? page.eyebrow}</li>
                </ol>
              </nav>
              <span className="eyebrow">{page.eyebrow}</span>
            </Reveal>

            <AnimatedHeadline
              as="h1"
              text={page.h1}
              highlight={page.highlight}
              className="mt-5 max-w-4xl font-display text-3xl font-extrabold leading-[1.1] text-foreground sm:text-4xl lg:text-[3rem]"
            />

            <Reveal delay={0.08}>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {page.intro}
              </p>
            </Reveal>
          </div>
        </section>

        {page.sections}

        {!page.hideCta && <BookingCta title={page.cta?.title} note={page.cta?.note} />}
      </main>

      <SiteFooter />
      <MobileCtaBar />
    </div>
  );
};

export default SectionPage;
