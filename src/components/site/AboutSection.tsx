import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, HeartPulse, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/site/motion';
import { ClipReveal } from '@/components/site/scroll';
import { clinic, doctor } from '@/data/site';
import hospitalImg from '@/assets/hospital-exterior.webp';
import herbsImg from '@/assets/ayurvedic-herbs.webp';

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Doctor-led, always',
    text: `Every therapy is prescribed by ${doctor.name}, ${doctor.qualification}, and reviewed as your treatment progresses.`,
  },
  {
    icon: Leaf,
    title: 'Classical formulations',
    text: 'Authentic herbs and medicated oils prepared to traditional specification, with an in-house pharmacy.',
  },
  {
    icon: HeartPulse,
    title: 'Whole-person care',
    text: 'Digestion, sleep, stress and routine are treated as part of the condition — not separate from it.',
  },
];

const AboutSection = () => (
    <section id="about" aria-labelledby="about-heading" className="section-spacing bg-secondary/40">
      <div className="shell">
        <SectionHeading
          id="about-heading"
          eyebrow="Our clinic"
          icon={Sparkles}
          title="Traditional Ayurveda, practised with"
          highlight="clinical discipline"
          description={`${clinic.name} is a government-certified Ayurveda hospital at Nookampalayam, Perumbakkam. Patients come to us from across Chennai for care that is properly diagnosed, properly delivered and properly followed up.`}
        />

        <div className="mt-14 grid items-center gap-10 lg:mt-20 lg:grid-cols-2 lg:gap-16">
          {/* Media */}
          <Reveal direction="right" className="relative">
            <div className="relative">
              <ClipReveal className="overflow-hidden rounded-[1.5rem] border border-border shadow-warm">
                <img
                  src={hospitalImg}
                  alt="Sri Vinayaga Ayurvibe Ayurveda hospital at Nookampalayam, Perumbakkam, Chennai"
                  width={1400}
                  height={933}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover"
                />
              </ClipReveal>

              <div className="absolute -bottom-8 -right-2 hidden w-44 overflow-hidden rounded-2xl border border-border shadow-warm sm:block lg:-right-8">
                <img
                  src={herbsImg}
                  alt="Authentic Ayurvedic herbs used in treatments at Sri Vinayaga Ayurvibe"
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="h-32 w-full object-cover"
                />
              </div>

              <div className="absolute left-3 top-6 rounded-2xl border border-border bg-background px-4 py-3 shadow-warm sm:-left-3 lg:-left-8">
                <p className="font-display text-2xl font-extrabold text-foreground">Reg. {clinic.regNo}</p>
                <p className="text-xs text-muted-foreground">Government-certified hospital</p>
              </div>
            </div>
          </Reveal>

          {/* Copy */}
          <div>
            <Reveal direction="left">
              <h3 className="font-display text-2xl font-bold text-foreground sm:text-3xl">
                What actually happens here
              </h3>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                We are a small hospital, not a chain. That means the doctor who assesses you is the
                doctor who writes your plan and reviews your progress. Treatment rooms are dedicated
                and cleaned between sessions, therapists are trained in classical technique, and
                medicines come from our own pharmacy.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
                If Ayurveda is not the right answer for your condition, we will tell you — and we
                never ask you to stop medication prescribed by another doctor.{' '}
                <Link to="/faq" className="link-underline font-medium text-primary">
                  Read the common questions
                </Link>{' '}
                or{' '}
                <Link to="/treatments" className="link-underline font-medium text-primary">
                  browse the therapies
                </Link>
                .
              </p>
            </Reveal>

            <StaggerGroup className="mt-8 space-y-4" as="ul">
              {pillars.map((pillar) => (
                <StaggerItem key={pillar.title} as="li">
                  <div className="group flex gap-4 rounded-2xl border border-transparent p-3 transition-colors hover:border-border hover:bg-background">
                    <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <pillar.icon className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h4 className="font-semibold text-foreground">{pillar.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{pillar.text}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>

            <Reveal delay={0.1}>
              <Button asChild className="group mt-8 rounded-full px-6 font-semibold">
                <Link to="/booking">
                  Start with a consultation
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
            </Reveal>
          </div>
        </div>

      </div>
  </section>
);

export default AboutSection;
