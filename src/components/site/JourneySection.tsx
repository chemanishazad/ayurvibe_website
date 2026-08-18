import React from 'react';
import { Route } from 'lucide-react';
import { ExplodedSection, ExplodedTrack } from '@/components/site/exploded/Track';
import { journeyScenes } from '@/data/scenes';

/**
 * How treatment actually runs, in four stages.
 *
 * A hand on the wrist, a written plan, the droni, and what you take home —
 * each opening on what is inside that stage. This replaces the four-card
 * summary, which described the same thing without showing any of it.
 */
const JourneySection = () => (
  <ExplodedSection
    id="journey"
    tone="light"
    labelledBy="journey-heading"
    eyebrow="How it works"
    icon={Route}
    heading="No therapy is booked"
    highlight="before it is diagnosed."
    intro="Four stages, in this order, every time — consultation, a written plan, supervised treatment, and the follow-up that decides whether any of it holds."
  >
    <ExplodedTrack scenes={journeyScenes} stepVh={76} />
  </ExplodedSection>
);

export default JourneySection;
