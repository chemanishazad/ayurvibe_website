import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BadgeCheck, CalendarDays, Clock, MapPin, Phone, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { clinic, doctor, heroImage, heroSlides, heroSrcSet } from '@/data/site';
import { treatments } from '@/data/treatments';
import { EASE } from '@/components/site/motion';
import { Magnetic } from '@/components/site/scroll';
import { markImage } from '@/components/site/exploded/markImage';

const SLIDE_MS = 6000;

/**
 * Hero.
 *
 * An immersive band rather than a two-column card layout: the therapy room
 * fills the section, the copy sits on it, and the five hero frames are dealt
 * out on the right as a deck you can flip through.
 *
 * Three decisions worth keeping:
 *
 * · The backdrop never changes. It is one image — the preloaded LCP frame —
 *   and it is deliberately static: cross-fading a full-bleed photograph is the
 *   single most expensive thing a hero can do, and the deck already gives the
 *   section movement.
 * · The deck animates by position, not by mounting. All five cards stay in the
 *   DOM and each one animates to the preset for its distance from the front,
 *   so advancing the deck is five transform writes and no layout at all.
 * · Nothing here fades the <h1> or the paragraph in. Opacity on the largest
 *   text makes the browser treat it as unpainted and pushes LCP out by the
 *   length of the animation; these rise out of a mask instead.
 */

/** Where a card sits, by its distance from the front of the deck. */
const DECK = [
  { x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 },
  { x: 40, y: -24, rotate: 4, scale: 0.94, opacity: 1 },
  { x: 74, y: -44, rotate: 8, scale: 0.88, opacity: 0.92 },
  { x: 92, y: -56, rotate: 10.5, scale: 0.84, opacity: 0 },
];

const PROOF = [
  { mark: 'shield', label: 'Government certified', detail: `Reg. No. ${clinic.regNo}` },
  { mark: 'stethoscope', label: 'Doctor-led, always', detail: `${doctor.name}, ${doctor.qualification}` },
  { mark: 'leaf', label: `${treatments.length} classical therapies`, detail: 'Kerala protocols, in-house pharmacy' },
  { mark: 'clock', label: 'Open every day', detail: `${'10 AM'} – 8 PM, no weekly off` },
] as const;

const Hero = () => {
  // Opens on the second frame so the front card is never the backdrop.
  const [index, setIndex] = useState(1);
  const [paused, setPaused] = useState(false);
  const [scrolling, setScrolling] = useState(false);
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const deckY = useTransform(scrollYProgress, [0, 1], [0, 70]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  useEffect(() => {
    let timer = 0;
    const onScroll = () => {
      setScrolling(true);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setScrolling(false), 220);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (paused || reduce || scrolling) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % heroSlides.length), SLIDE_MS);
    return () => window.clearInterval(timer);
  }, [paused, reduce, scrolling]);

  const slide = heroSlides[index];
  const motionStyle = (style: Record<string, unknown>) => (reduce ? undefined : style);
  const rise = {
    hidden: { y: '108%' },
    show: { y: 0, transition: { duration: 0.75, ease: EASE } },
  };

  return (
    <section
      id="hero-section"
      ref={sectionRef}
      aria-labelledby="hero-heading"
      className="relative isolate [overflow:clip] bg-[hsl(158_44%_7%)] text-white"
    >
      {/* Backdrop: one static frame, preloaded in index.html. */}
      <img
        src={heroImage('hospital', 1800)}
        srcSet={heroSrcSet('hospital')}
        sizes="100vw"
        alt={heroSlides[0].alt}
        width={1800}
        height={2250}
        // @ts-expect-error fetchpriority is a valid HTML attribute React 18 forwards as-is
        fetchpriority="high"
        decoding="sync"
        className="absolute inset-0 h-full w-full object-cover object-[68%_center]"
      />
      {/* Scrims, written as inline gradients on purpose. Tailwind silently drops
          the `/97` alpha modifier when it is applied to an arbitrary `hsl(...)`
          colour, so `from-[hsl(...)]/97` renders opaque and the whole scrim
          comes out wrong — the same trap the exploded sections hit. */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(100deg, hsl(158 44% 5% / 0.93) 0%, hsl(158 44% 6% / 0.88) 42%,' +
            ' hsl(158 44% 7% / 0.78) 70%, hsl(158 44% 8% / 0.62) 100%)',
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to top, hsl(158 44% 6%) 0%, hsl(158 44% 6% / 0.35) 26%, transparent 55%),' +
            ' linear-gradient(to bottom, hsl(158 44% 5% / 0.75) 0%, transparent 22%)',
        }}
      />

      <div className="shell relative grid items-center gap-12 pb-14 pt-32 sm:pt-36 lg:min-h-[80svh] lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:pb-20 lg:pt-40">
        {/* ---- copy ---- */}
        <motion.div style={motionStyle({ y: copyY })} className="max-w-2xl">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-saffron"
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
            Government certified · Reg. No. {clinic.regNo}
          </motion.span>

          <h1
            id="hero-heading"
            className="mt-6 font-display text-[2.5rem] font-extrabold leading-[1.03] tracking-[-0.03em] sm:text-[3.2rem] lg:text-[3.7rem]"
          >
            <motion.span
              className="inline-block"
              initial={reduce ? false : 'hidden'}
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.08 } } }}
            >
              {['Authentic', 'Ayurveda', 'hospital', 'in'].map((word) => (
                <span key={word} className="inline-block overflow-hidden pb-[0.14em] align-bottom">
                  <motion.span className="inline-block" variants={rise}>
                    {word}&nbsp;
                  </motion.span>
                </span>
              ))}
              <span className="relative inline-block overflow-hidden pb-[0.14em] align-bottom">
                <motion.span className="relative inline-block whitespace-nowrap text-saffron" variants={rise}>
                  Chennai
                  <svg
                    aria-hidden
                    viewBox="0 0 300 12"
                    preserveAspectRatio="none"
                    className="absolute bottom-[0.08em] left-0 h-2.5 w-full text-saffron/45"
                  >
                    <motion.path
                      d="M2 8 C 80 2, 220 2, 298 7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
                    />
                  </svg>
                </motion.span>
              </span>
            </motion.span>
          </h1>

          <motion.p
            initial={reduce ? false : { y: 18, filter: 'blur(5px)' }}
            animate={{ y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.24, ease: EASE }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/80 sm:text-xl"
          >
            Classical Panchakarma, Abhyanga and Shirodhara at Nookampalayam, Perumbakkam. Every plan
            is written by {doctor.name}, {doctor.qualification}, after a full constitutional
            assessment — no package is sold before a diagnosis.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <Button
                asChild
                size="lg"
                className="group h-[3.25rem] rounded-full px-7 text-base font-semibold shadow-glow"
              >
                <Link to="/booking">
                  <CalendarDays className="mr-2 h-5 w-5" aria-hidden />
                  Book a consultation
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                </Link>
              </Button>
            </Magnetic>
            <Magnetic strength={10}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-[3.25rem] rounded-full border-white/25 bg-white/5 px-7 text-base font-semibold text-white hover:border-saffron/50 hover:bg-white/10 hover:text-saffron"
              >
                <a href={`tel:${clinic.phone}`}>
                  <Phone className="mr-2 h-5 w-5" aria-hidden />
                  {clinic.phoneDisplay}
                </a>
              </Button>
            </Magnetic>
          </motion.div>

          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60"
          >
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-saffron/80" aria-hidden />
              Nookampalayam, Perumbakkam · Chennai {clinic.postalCode}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-saffron/80" aria-hidden />
              Open every day, 10 AM – 8 PM
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-saffron text-saffron" aria-hidden />
              {clinic.ratingValue} · {clinic.reviewCount} Google reviews
            </span>
          </motion.p>
        </motion.div>

        {/* ---- the deck ---- */}
        <motion.div
          style={motionStyle({ y: deckY })}
          initial={reduce ? false : { opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          className="relative mx-auto w-full max-w-[23rem] lg:mr-6 lg:max-w-[25rem]"
        >
          <div className="relative aspect-[4/5]">
            {heroSlides.map((s, i) => {
              const seat = (i - index + heroSlides.length) % heroSlides.length;
              const preset = DECK[Math.min(seat, DECK.length - 1)];
              return (
                <motion.figure
                  key={s.id}
                  className="absolute inset-0 overflow-hidden rounded-[1.6rem] border border-white/15 bg-[hsl(158_44%_10%)] shadow-2xl"
                  style={{ zIndex: heroSlides.length - seat }}
                  animate={reduce ? undefined : preset}
                  transition={{ duration: 0.75, ease: EASE }}
                >
                  <img
                    src={heroImage(s.id, 1100)}
                    srcSet={heroSrcSet(s.id)}
                    sizes="(min-width: 1024px) 26rem, 90vw"
                    alt={s.alt}
                    width={1100}
                    height={1375}
                    loading={i === 1 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-[hsl(158_44%_4%)] via-[hsl(158_44%_5%)]/45 to-transparent"
                  />
                  {seat === 0 && (
                    <figcaption className="absolute inset-x-0 bottom-0 p-5 pt-10 sm:p-6 sm:pt-12">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={s.id}
                          initial={reduce ? false : { opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: -12 }}
                          transition={{ duration: 0.45, ease: EASE }}
                        >
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-saffron">
                            {s.label}
                          </p>
                          <p className="mt-1.5 font-display text-xl font-bold leading-snug sm:text-[1.4rem]">
                            {s.heading}
                          </p>
                          <p className="mt-1 text-sm text-white/75">{s.caption}</p>
                        </motion.div>
                      </AnimatePresence>
                    </figcaption>
                  )}
                </motion.figure>
              );
            })}
          </div>

          <div className="mt-6 flex gap-1.5" role="tablist" aria-label="Hero gallery">
            {heroSlides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={s.label}
                onClick={() => setIndex(i)}
                className="group relative h-1 flex-1 overflow-hidden rounded-full bg-white/20"
              >
                <span
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full bg-saffron transition-[width] ease-linear',
                    i === index ? 'w-full' : 'w-0 group-hover:w-1/4'
                  )}
                  style={
                    i === index && !reduce && !paused
                      ? { animation: `hero-progress ${SLIDE_MS}ms linear` }
                      : undefined
                  }
                />
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ---- proof bar ---- */}
      <div className="relative border-t border-white/12 bg-[hsl(158_44%_6%)]">
        <motion.ul
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.55 } } }}
          className="shell grid grid-cols-1 gap-x-8 gap-y-5 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:py-8"
        >
          {PROOF.map((point) => {
            const art = markImage(point.mark);
            return (
              <motion.li
                key={point.label}
                variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease: EASE }}
                className="flex items-center gap-3"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.09]">
                  {art ? (
                    <img src={art} alt="" width={160} height={160} loading="lazy" className="h-9 w-9" />
                  ) : (
                    <BadgeCheck className="h-5 w-5 text-saffron" aria-hidden />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{point.label}</span>
                  <span className="mt-0.5 block text-xs text-white/55">{point.detail}</span>
                </span>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
};

export default Hero;
