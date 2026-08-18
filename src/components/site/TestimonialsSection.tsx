import React from 'react';
import { Quote, Star } from 'lucide-react';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal } from '@/components/site/motion';
import { Marquee } from '@/components/site/scroll';
import { clinic, testimonials } from '@/data/site';

type Testimonial = (typeof testimonials)[number];

const ReviewCard = ({ item }: { item: Testimonial }) => (
  <figure className="mx-3 flex w-[19rem] shrink-0 flex-col rounded-2xl border border-white/12 bg-white/[0.07] p-6 transition-transform duration-500 hover:-translate-y-1.5 sm:w-[23rem]">
    <div className="flex items-center gap-1" aria-label={`${item.rating} out of 5 stars`}>
      {Array.from({ length: item.rating }).map((_, i) => (
        <Star key={i} className="h-4 w-4 fill-saffron text-saffron" aria-hidden />
      ))}
    </div>
    <Quote className="mt-4 h-6 w-6 text-white/25" aria-hidden />
    <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-white/85">{item.quote}</blockquote>
    <figcaption className="mt-5 border-t border-white/12 pt-4">
      <p className="text-sm font-semibold text-white">{item.name}</p>
      <p className="text-xs text-white/60">{item.condition}</p>
      <p className="mt-1 text-xs font-medium text-saffron">{item.treatment}</p>
    </figcaption>
  </figure>
);

/** Rows drift continuously; the animation is CSS, so scrolling stays free. */
const Row = ({ reverse = false, seconds }: { reverse?: boolean; seconds: number }) => (
  <Marquee seconds={seconds} reverse={reverse} className="edge-fade">
    {testimonials.map((item) => (
      <ReviewCard key={`${reverse ? 'b' : 'a'}-${item.name}`} item={item} />
    ))}
  </Marquee>
);

const TestimonialsSection = () => (
  <section
    id="testimonials"
    aria-labelledby="testimonials-heading"
    className="section-spacing relative overflow-hidden bg-gradient-earth"
  >
    <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-dark opacity-70" />

    <div className="relative">
      <div className="shell">
        <SectionHeading
          id="testimonials-heading"
          tone="dark"
          eyebrow="Patient stories"
          icon={Quote}
          title="What people say after"
          highlight="finishing treatment"
          description="Real outcomes from patients treated at our Perumbakkam hospital — collected from Google reviews and follow-up consultations."
        />

        <Reveal className="mt-8 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-5 py-2.5">
            <span className="flex items-center gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-saffron text-saffron" />
              ))}
            </span>
            <span className="text-sm font-semibold text-white">
              {clinic.ratingValue} average · {clinic.reviewCount} Google reviews
            </span>
          </div>
        </Reveal>
      </div>

      <div className="mt-12 space-y-5">
        <Row seconds={62} />
        <Row reverse seconds={78} />
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
