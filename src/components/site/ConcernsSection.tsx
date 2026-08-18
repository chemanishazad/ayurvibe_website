import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplodedSection, ExplodedTrack } from '@/components/site/exploded/Track';
import { concernScenes } from '@/data/scenes';

/**
 * What you came in with.
 *
 * Four body systems, each opening on the complaints we actually see and the
 * therapies prescribed for them. Skin, hair and general detox are covered by
 * the therapy grid rather than given a scene of their own — four is where the
 * scroll stops earning its length.
 */
const ConcernsSection = () => (
  <ExplodedSection
    id="body-map"
    tone="light"
    labelledBy="concerns-heading"
    eyebrow="Start with the complaint"
    icon={Stethoscope}
    heading="Tell us where it hurts."
    highlight="The therapy follows from that."
    intro="Most people arrive knowing the symptom, not the Sanskrit. These are the four areas the hospital treats most — open each one to see what sits inside it."
  >
    <ExplodedTrack scenes={concernScenes} stepVh={76} />

    <div className="shell relative pb-20 pt-10 text-center sm:pb-28">
      <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[hsl(var(--rx-ink)/0.5)]">
        Skin and hair, chronic fatigue, low immunity and post-illness recovery are treated here too —
        they are in the therapy list rather than given a panel of their own.
      </p>
      <Button
        asChild
        variant="outline"
        className="group mt-6 rounded-full border-[hsl(var(--rx-ink)/0.2)] bg-transparent px-6 font-semibold text-[hsl(var(--rx-ink))] hover:border-[hsl(var(--rx-gold)/0.5)] hover:bg-transparent hover:text-[hsl(var(--rx-gold))]"
      >
        <Link to="/treatments">
          Browse all 33 therapies
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </Button>
    </div>
  </ExplodedSection>
);

export default ConcernsSection;
