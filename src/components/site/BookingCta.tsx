import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from '@/components/site/motion';
import { clinic, doctor } from '@/data/site';

/**
 * Closing call to action for a focused page.
 *
 * Every section page ends here rather than leaving the visitor at the bottom
 * of a list with nowhere to go.
 */
const BookingCta = ({ title, note }: { title?: string; note?: string }) => (
  <section aria-labelledby="cta-heading" className="section-spacing bg-secondary/40">
    <div className="shell">
      <Reveal>
        <div className="surface flex flex-col items-start gap-6 p-7 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2 id="cta-heading" className="font-display text-2xl font-extrabold text-foreground sm:text-3xl">
              {title ?? 'Book a consultation'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              {note ??
                `A full assessment with ${doctor.name}, ${doctor.qualification} — pulse, history and constitution — before any therapy is prescribed. Open every day, 10 AM to 8 PM.`}
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg" className="group h-12 rounded-full px-7 font-semibold shadow-glow">
              <Link to="/booking">
                <CalendarDays className="mr-2 h-5 w-5" aria-hidden />
                Book online
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-full border-border px-7 font-semibold hover:border-primary/40 hover:text-primary"
            >
              <a href={`tel:${clinic.phone}`}>
                <Phone className="mr-2 h-5 w-5 text-primary" aria-hidden />
                {clinic.phoneDisplay}
              </a>
            </Button>
          </div>
        </div>
      </Reveal>
    </div>
  </section>
);

export default BookingCta;
