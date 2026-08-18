import React from 'react';
import { Flower } from 'lucide-react';
import { ExplodedPanel, ExplodedSection } from '@/components/site/exploded/Track';
import { panchakarma } from '@/data/scenes';

/**
 * Panchakarma — the five actions.
 *
 * One figure rather than a pinned run: there is a single thing to show here,
 * and pinning it would spend a screen of scroll to say what one lotus opening
 * already says. It animates as it rises through the viewport instead.
 */
const PanchakarmaSection = () => (
  <ExplodedSection
    id="panchakarma"
    tone="dark"
    labelledBy="panchakarma-heading"
    eyebrow="Panchakarma"
    icon={Flower}
    heading="Everyone sells Panchakarma."
    highlight="These are the five actions."
    intro="The word means five actions, and they are specific procedures with indications and contraindications — not a spa menu. Open the flower to see what they are."
    outro="Panchakarma here is prescribed, supervised and monitored. Whether you need one procedure, three or none is a clinical decision made after assessment."
  >
    <ExplodedPanel scene={panchakarma} />
  </ExplodedSection>
);

export default PanchakarmaSection;
