import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, CalendarDays, Languages, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/site/motion';
import { ClipReveal, Magnetic } from '@/components/site/scroll';
import { clinic, doctor } from '@/data/site';
import doctorImg from '@/assets/dr-vaitheeshwari.webp';

const DoctorSection = () => (
  <section id="doctors" aria-labelledby="doctor-heading" className="section-spacing bg-secondary/40">
    <div className="shell">
      <SectionHeading
        id="doctor-heading"
        eyebrow="Meet your doctor"
        icon={Stethoscope}
        title="Your plan is written by"
        highlight={doctor.name}
        description={doctor.bio}
      />

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[0.85fr_1fr] lg:gap-16">
        <Reveal direction="right">
          <div className="relative mx-auto max-w-sm">
            <ClipReveal direction="up" className="overflow-hidden rounded-[1.5rem] border border-border shadow-warm">
              <img
                src={doctorImg}
                alt={`${doctor.name}, ${doctor.qualification} — Ayurvedic doctor at ${clinic.name}, Chennai`}
                width={760}
                height={760}
                loading="lazy"
                decoding="async"
                className="aspect-square w-full object-cover"
              />
            </ClipReveal>
            <div className="absolute -bottom-5 left-1/2 w-[88%] -translate-x-1/2 rounded-2xl border border-border bg-background px-4 py-3 text-center shadow-warm">
              <p className="font-display text-base font-bold text-foreground">{doctor.name}</p>
              <p className="text-xs text-muted-foreground">
                {doctor.qualification} · {doctor.role}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 lg:mt-0">
          <StaggerGroup className="space-y-3" as="ul">
            {doctor.credentials.map((credential) => (
              <StaggerItem key={credential} as="li">
                <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                  <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <p className="text-sm font-medium text-foreground">{credential}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.1} className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-2xl font-extrabold text-foreground">{doctor.experience}</p>
              <p className="text-xs text-muted-foreground">Clinical experience</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="font-display text-2xl font-extrabold text-foreground">Reg. {clinic.regNo}</p>
              <p className="text-xs text-muted-foreground">Government registered</p>
            </div>
            <div className="rounded-2xl border border-border bg-background p-4">
              <p className="flex items-center gap-1.5 font-display text-base font-extrabold text-foreground">
                <Languages className="h-4 w-4 text-primary" aria-hidden />
                {doctor.languages.join(' · ')}
              </p>
              <p className="text-xs text-muted-foreground">Consultation languages</p>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <Magnetic className="mt-7">
              <Button asChild size="lg" className="group rounded-full px-7 font-semibold shadow-soft">
                <Link to="/booking">
                  <CalendarDays className="mr-2 h-5 w-5" aria-hidden />
                  Book a consultation
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </div>
    </div>
  </section>
);

export default DoctorSection;
