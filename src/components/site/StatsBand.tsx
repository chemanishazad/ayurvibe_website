import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { treatments } from '@/data/treatments';
import { stats } from '@/data/site';
import { CountUp, EASE } from '@/components/site/motion';
import { Marquee } from '@/components/site/scroll';

/** Continuously drifting ribbon of therapy names — a CSS-only marquee. */
const TherapyRibbon = () => (
  <div className="border-y border-border bg-secondary/60 py-3">
    <Marquee seconds={70} className="edge-fade">
      {treatments.map((treatment) => (
        <span
          key={treatment.slug}
          className="flex shrink-0 items-center gap-6 pr-6 text-sm font-medium tracking-tight text-muted-foreground"
        >
          {treatment.name}
          <span aria-hidden className="h-1 w-1 rounded-full bg-primary/40" />
        </span>
      ))}
    </Marquee>
  </div>
);

/** Key numbers, counted up once as they enter view. */
const StatsBand = () => {
  const reduce = useReducedMotion();

  return (
    <section aria-label="Clinic at a glance" className="relative bg-background">
      <TherapyRibbon />

      <div className="shell py-12 sm:py-16">
        <motion.ul
          initial={reduce ? false : 'hidden'}
          whileInView="show"
          viewport={{ once: true, amount: 0.4 }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="grid grid-cols-2 gap-y-10 lg:grid-cols-4"
        >
          {stats.map((stat, i) => (
            <motion.li
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 26 },
                show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
              }}
              className={
                'px-4 text-center sm:px-6 lg:text-left ' +
                (i > 0 ? 'lg:border-l lg:border-border' : '')
              }
            >
              <p className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                <CountUp value={stat.value} />
                {'suffix' in stat && stat.suffix ? (
                  <span className="ml-0.5 text-2xl text-saffron sm:text-3xl">{stat.suffix}</span>
                ) : null}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.detail}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
};

export default StatsBand;
