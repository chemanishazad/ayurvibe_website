import React from 'react';
import { FlaskConical } from 'lucide-react';
import { ExplodedSection, ExplodedTrack } from '@/components/site/exploded/Track';
import { remedyScenes } from '@/data/remedies';

/**
 * The dispensary.
 *
 * Six classical preparations, each vessel opening on the plants inside it.
 * This was the first exploded scene on the site; the machinery it grew into
 * now lives in components/site/exploded and drives four other sections, so all
 * that is left here is the content and the frame around it.
 */
const ApothecarySection = () => (
  <ExplodedSection
    id="dispensary"
    tone="dark"
    labelledBy="dispensary-heading"
    eyebrow="Inside the medicine"
    icon={FlaskConical}
    heading="Open the vessel. Everything in it"
    highlight="grew in soil."
    intro="No proprietary blends, no unnamed actives. These are the six preparations our pharmacy compounds most — scroll to take each one apart."
    outro="Every formula above is dispensed from the hospital pharmacy after consultation. Quantity, combination and duration are set by the physician — nothing here is sold as a kit."
  >
    <ExplodedTrack scenes={remedyScenes} stepVh={80} />
  </ExplodedSection>
);

export default ApothecarySection;
