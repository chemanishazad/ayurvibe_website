import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, ChevronDown, Clock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/site/motion';
import { Magnetic } from '@/components/site/scroll';
import { treatmentCategories, treatments, type Treatment } from '@/data/treatments';

/** How many cards are shown before "view all". */
const INITIAL = 8;

/**
 * The source list is grouped by category, so the first eight cards would all be
 * head-and-face treatments — eight near-identical photographs of the same scene.
 * Interleaving one therapy from each category means the default view shows the
 * actual range of the clinic, and reads as eight different treatments.
 */
const interleaveByCategory = (list: Treatment[]) => {
  const buckets = new Map<string, Treatment[]>();
  for (const item of list) {
    const bucket = buckets.get(item.category) ?? [];
    bucket.push(item);
    buckets.set(item.category, bucket);
  }
  const queues = [...buckets.values()];
  const out: Treatment[] = [];
  let i = 0;
  while (out.length < list.length && queues.some((q) => q.length)) {
    const queue = queues[i % queues.length];
    if (queue.length) out.push(queue.shift() as Treatment);
    i++;
  }
  return out;
};

/**
 * One therapy.
 *
 * A real <article> with a heading, description and benefit list — everything a
 * crawler needs is in the markup rather than behind an interaction. Each card
 * is anchored by slug, so `/treatments#therapy-shirodhara` deep-links to it.
 *
 * All motion is CSS on transform and opacity: one entry animation and a hover
 * lift. A grid of 33 of these costs nothing to scroll past.
 */
const TreatmentCard = ({ treatment, onOpen }: { treatment: Treatment; onOpen: (t: Treatment) => void }) => (
  <article
    id={`therapy-${treatment.slug}`}
    className="group surface card-hover flex h-full flex-col overflow-hidden scroll-mt-28"
  >
    <button
      type="button"
      onClick={() => onOpen(treatment)}
      aria-label={`View details of ${treatment.name}`}
      className="relative block aspect-[4/3] w-full overflow-hidden bg-muted text-left"
    >
      <img
        src={treatment.thumb}
        srcSet={`${treatment.thumb} 480w, ${treatment.image} 900w`}
        sizes="(min-width: 1280px) 22vw, (min-width: 640px) 45vw, 92vw"
        alt={`${treatment.name} — Ayurvedic therapy at Sri Vinayaga Ayurvibe, Chennai`}
        width={480}
        height={360}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-transparent to-transparent"
      />
      <span className="absolute left-3 top-3 rounded-full bg-background px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-foreground">
        {treatment.category}
      </span>
      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-medium text-white">
        <Clock className="h-3.5 w-3.5" aria-hidden />
        {treatment.duration}
      </span>
    </button>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="font-display text-lg font-bold leading-snug text-foreground">{treatment.name}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{treatment.description}</p>

      <ul className="mt-4 space-y-1.5">
        {treatment.benefits.slice(0, 2).map((benefit) => (
          <li key={benefit} className="flex items-start gap-2 text-xs text-foreground/80">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex items-center gap-2 pt-1">
        <Button asChild size="sm" className="flex-1 rounded-full font-semibold">
          <Link to="/booking">Book</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onOpen(treatment)}
          className="rounded-full border-border font-semibold hover:border-primary/40 hover:text-primary"
        >
          Details
        </Button>
      </div>
    </div>
  </article>
);

/**
 * Treatments.
 *
 * A straightforward, fast grid: filter by category, show eight, expand to all
 * 33. Filtering re-renders a static list — no layout animation, no pinning and
 * no scroll hijacking — which is what makes it feel immediate.
 */
const TreatmentsSection = () => {
  const [filter, setFilter] = useState<string>('All');
  const [expanded, setExpanded] = useState(false);
  const [active, setActive] = useState<Treatment | null>(null);

  const filtered = useMemo(
    () =>
      filter === 'All'
        ? interleaveByCategory(treatments)
        : treatments.filter((t) => t.category === filter),
    [filter]
  );
  // Every matching therapy is rendered; the ones past the fold are simply
  // hidden. Expanding is then instant (no re-render, no image refetch) and each
  // card's `#therapy-<slug>` anchor exists whether or not it is on screen.
  const hiddenFrom = expanded ? filtered.length : INITIAL;

  return (
    <section id="treatments" aria-labelledby="treatments-heading" className="section-spacing bg-background">
      <div className="shell">
        <SectionHeading
          id="treatments-heading"
          eyebrow="Signature therapies"
          icon={Sparkles}
          title="33 classical treatments, matched to"
          highlight="your constitution"
          description="From Shirodhara and Pizhichil to Kati Vasti and Navara Kizhi — each therapy is prescribed after assessment, never sold as a standalone package."
        />

        <Reveal className="mt-10">
          <div
            className="flex flex-wrap justify-center gap-2"
            role="tablist"
            aria-label="Filter treatments by category"
          >
            {treatmentCategories.map((category) => {
              const selected = filter === category;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => {
                    setFilter(category);
                    setExpanded(false);
                  }}
                  className={cn(
                    'rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:text-primary'
                  )}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </Reveal>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{Math.min(hiddenFrom, filtered.length)}</span> of{' '}
          <span className="font-semibold text-foreground">{filtered.length}</span>{' '}
          {filter === 'All' ? 'therapies' : `${filter.toLowerCase()} therapies`}
        </p>

        <StaggerGroup
          key={filter}
          className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtered.map((treatment, i) => (
            <StaggerItem key={treatment.slug} className={cn('h-full', i >= hiddenFrom && 'hidden')}>
              <TreatmentCard treatment={treatment} onOpen={setActive} />
            </StaggerItem>
          ))}
        </StaggerGroup>

        {filtered.length > INITIAL && (
          <div className="mt-11 text-center">
            <Magnetic>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setExpanded((v) => !v)}
                className="group rounded-full border-border px-7 font-semibold hover:border-primary/40 hover:text-primary"
              >
                {expanded ? 'Show fewer therapies' : `View all ${filtered.length} therapies`}
                <ChevronDown
                  className={cn('ml-2 h-4 w-4 transition-transform duration-300', expanded && 'rotate-180')}
                  aria-hidden
                />
              </Button>
            </Magnetic>
          </div>
        )}
      </div>

      {/* Details */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto rounded-2xl p-0">
          {active && (
            <>
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                <img
                  src={active.image}
                  alt={`${active.name} — Ayurvedic therapy at Sri Vinayaga Ayurvibe, Chennai`}
                  width={900}
                  height={506}
                  className="h-full w-full object-cover"
                />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <span className="rounded-full bg-background/92 px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-foreground">
                    {active.category}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <DialogHeader className="space-y-1 text-left">
                  <DialogTitle className="font-display text-2xl font-bold">{active.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-4 w-4 text-primary" aria-hidden />
                    {active.duration} per session
                  </DialogDescription>
                </DialogHeader>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{active.description}</p>

                <h4 className="mt-6 text-sm font-semibold text-foreground">What it helps with</h4>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {active.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {benefit}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="group flex-1 rounded-full font-semibold">
                    <Link to="/booking" onClick={() => setActive(null)}>
                      Book this therapy
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setActive(null)}
                    className="rounded-full border-border font-semibold"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </section>
  );
};

export default TreatmentsSection;
