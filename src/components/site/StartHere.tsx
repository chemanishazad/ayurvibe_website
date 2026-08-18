import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, MessageCircle, Phone, Stethoscope } from 'lucide-react';
import { clinic } from '@/data/site';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/site/motion';

/* ---------------------------------------------------------------------------
 * Start here
 * ---------------------------------------------------------------------------
 * The landing page is a long read, and the booking form is at the end of it.
 * Someone who arrived already knowing they want an appointment should not have
 * to scroll thirty screens to say so — this puts the three ways of reaching
 * the hospital directly under the hero, and gives the fourth kind of visitor
 * (the one who does not know what they need) somewhere to go as well.
 * ------------------------------------------------------------------------- */

const ROUTES = [
  {
    icon: CalendarDays,
    label: 'Book a consultation',
    detail: 'Pick a day and time online',
    to: '/booking',
    primary: true,
  },
  {
    icon: Phone,
    label: clinic.phoneDisplay,
    detail: 'Speak to the front desk now',
    href: `tel:${clinic.phone}`,
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp us',
    detail: 'Send your reports or ask a question',
    href: `https://wa.me/${clinic.whatsapp}`,
    external: true,
  },
];

const StartHere = () => (
  <section aria-labelledby="start-heading" className="border-b border-border bg-secondary/40">
    <div className="shell py-12 sm:py-14">
      <Reveal>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="start-heading" className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
              Start here
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
              Open every day, 10 AM to 8 PM. First visit is a full assessment, not a sales call.
            </p>
          </div>
          <Link
            to="/treatments#body-map"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            <Stethoscope className="h-4 w-4" aria-hidden />
            Not sure what you need? Start from the symptom
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </Reveal>

      <StaggerGroup className="mt-8 grid gap-4 sm:grid-cols-3" as="ul">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const inner = (
            <>
              <span
                className={
                  route.primary
                    ? 'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-foreground/15'
                    : 'grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary/8 text-primary'
                }
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-bold">{route.label}</span>
                <span
                  className={
                    route.primary ? 'mt-0.5 block text-sm opacity-80' : 'mt-0.5 block text-sm text-muted-foreground'
                  }
                >
                  {route.detail}
                </span>
              </span>
              <ArrowRight
                className="ml-auto h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-1"
                aria-hidden
              />
            </>
          );

          const className = route.primary
            ? 'card-hover group flex items-center gap-4 rounded-2xl bg-primary p-5 text-primary-foreground shadow-glow'
            : 'card-hover surface group flex items-center gap-4 p-5 text-foreground';

          return (
            <StaggerItem key={route.label} as="li">
              {route.to ? (
                <Link to={route.to} className={className}>
                  {inner}
                </Link>
              ) : (
                <a
                  href={route.href}
                  className={className}
                  {...(route.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {inner}
                </a>
              )}
            </StaggerItem>
          );
        })}
      </StaggerGroup>
    </div>
  </section>
);

export default StartHere;
