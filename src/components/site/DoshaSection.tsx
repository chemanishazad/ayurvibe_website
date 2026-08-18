import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExplodedSection, ExplodedTrack } from '@/components/site/exploded/Track';
import { doshaScenes } from '@/data/scenes';

/**
 * The three doshas.
 *
 * Three vessels — a pot the air escapes from, a lamp, a stone jar — each
 * opening on what that dosha looks like when it is out of balance. The quiz
 * link stays at the end: the quiz is an indication, the consultation is the
 * diagnosis, and the copy says so.
 */
const DoshaSection = () => (
  <ExplodedSection
    id="dosha"
    tone="dark"
    labelledBy="dosha-heading"
    eyebrow="Your constitution"
    icon={Compass}
    heading="Three forces. Everyone is"
    highlight="a mix of all three."
    intro="Vata, Pitta and Kapha are not personality types — they are the functional forces behind movement, transformation and structure. Scroll to open each one."
  >
    <ExplodedTrack scenes={doshaScenes} stepVh={80} />

    <div className="shell relative pb-20 pt-10 text-center sm:pb-28">
      <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[hsl(var(--rx-ink)/0.5)]">
        Nobody is one dosha. You have a birth constitution (prakriti) and a current state (vikriti),
        and treatment works on the gap between them — which is why the quiz below gives an
        indication and the consultation gives the answer.
      </p>
      <Button
        asChild
        variant="outline"
        className="group mt-6 rounded-full border-[hsl(var(--rx-ink)/0.22)] bg-transparent px-6 font-semibold text-[hsl(var(--rx-ink))] hover:border-[hsl(var(--rx-gold)/0.5)] hover:bg-transparent hover:text-[hsl(var(--rx-gold))]"
      >
        <Link to="/dosha">
          Take the dosha quiz
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      </Button>
    </div>
  </ExplodedSection>
);

export default DoshaSection;
