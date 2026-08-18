import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/site/motion';
import { ClipReveal, Magnetic } from '@/components/site/scroll';
import { clinic, differentiators } from '@/data/site';
import panchakarmaImg from '@/assets/panchakarma-treatment.webp';

/**
 * Why this hospital.
 *
 * Four claims beside one photograph. The image column sticks while the list
 * scrolls — sticky costs nothing, unlike the scroll-driven card stack this
 * replaced, which needed a screen of empty space between every card to work.
 */
const WhySection = () => (
  <section id="why" aria-labelledby="why-heading" className="section-spacing bg-background">
    <div className="shell">
      <SectionHeading
        id="why-heading"
        eyebrow="Why this hospital"
        icon={ShieldCheck}
        title="The difference between a spa and a"
        highlight="certified hospital"
        description="Ayurveda is only as good as the diagnosis behind it. Here is what that looks like in practice."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        {/* Media */}
        <Reveal direction="right" className="order-1 lg:sticky lg:top-28">
          <div className="relative">
            <ClipReveal direction="up" className="overflow-hidden rounded-[1.5rem] border border-border shadow-warm">
              <img
                src={panchakarmaImg}
                alt="Panchakarma therapy room at Sri Vinayaga Ayurvibe, Perumbakkam, Chennai"
                width={1400}
                height={1050}
                loading="lazy"
                decoding="async"
                className="aspect-[4/3] w-full object-cover"
              />
            </ClipReveal>

            <div className="absolute -bottom-6 left-5 right-5 rounded-2xl border border-border bg-background px-5 py-4 shadow-warm sm:left-8 sm:right-auto sm:w-64">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Certified facility</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Registration number {clinic.regNo}, issued by the state authority.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Claims */}
        <div className="order-2 mt-8 lg:mt-0">
          <StaggerGroup className="space-y-4" as="ul">
            {differentiators.map((item, i) => (
              <StaggerItem key={item.title} as="li">
                <article className="surface card-hover flex gap-4 p-5 sm:p-6">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/8 font-display text-sm font-extrabold text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground sm:text-xl">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.1} className="mt-7">
            <Magnetic>
              <Button
                asChild
                variant="outline"
                className="group rounded-full border-border px-6 font-semibold hover:border-primary/40 hover:text-primary"
              >
                <Link to="/treatments">
                  See all therapies
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

export default WhySection;
