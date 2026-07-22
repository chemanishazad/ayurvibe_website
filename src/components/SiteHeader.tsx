import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/doctors', label: 'Doctor' },
  { to: '/testimonials', label: 'Stories' },
  { to: '/dosha', label: 'Dosha Quiz' },
  { to: '/faq', label: 'FAQ' },
];

/**
 * Sticky site-wide header: transparent over the hero, frosted card once the
 * page scrolls. Includes a full mobile menu and a scroll-progress bar.
 */
const SiteHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu when navigating
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const solid = scrolled || open;

  return (
    <motion.header
      initial={reduce ? false : { y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
        solid
          ? 'bg-card/90 backdrop-blur-md shadow-soft border-b border-border/60'
          : 'bg-gradient-to-b from-black/45 to-transparent border-b border-transparent'
      )}
    >
      <div className="wide-wrapper flex items-center justify-between gap-3 py-2.5 md:py-3">
        <Link to="/" aria-label="Sri Vinayaga Ayurvibe — Home" className="shrink-0">
          <Logo
            className="h-11 md:h-14 w-auto drop-shadow-sm"
            withText
            textClassName={cn('hidden sm:block transition-colors', solid ? 'text-foreground' : 'text-white')}
            subtitleText="Holistic Ayurveda"
          />
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                'link-underline text-sm font-medium px-3.5 py-2 rounded-full transition-colors',
                solid
                  ? 'text-foreground/80 hover:text-primary'
                  : 'text-white/90 hover:text-white'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="tel:+918122939197"
            className={cn(
              'hidden md:inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full transition-colors',
              solid ? 'text-primary hover:bg-primary/10' : 'text-white glass hover:bg-white/20'
            )}
          >
            <Phone className="h-4 w-4" /> +91 81229 39197
          </a>
          <Button asChild size="sm" className="hidden sm:inline-flex bg-gradient-gold hover:opacity-95 text-earth font-semibold shadow-gold">
            <Link to="/booking">
              <Calendar className="mr-1.5 h-4 w-4" /> Book Now
            </Link>
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className={cn(
              'lg:hidden rounded-full p-2.5 transition-colors',
              solid ? 'text-foreground hover:bg-muted' : 'text-white glass'
            )}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Mobile"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden bg-card/95 backdrop-blur-md border-t border-border/60"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } } }}
              className="wide-wrapper py-3 space-y-1"
            >
              {navLinks.map((l) => (
                <motion.li key={l.to} variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}>
                  <Link
                    to={l.to}
                    className="block px-3 py-2.5 rounded-xl text-base font-medium text-foreground/85 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                </motion.li>
              ))}
              <motion.li
                variants={{ hidden: { opacity: 0, x: -14 }, show: { opacity: 1, x: 0 } }}
                className="flex gap-2 px-3 pt-2 pb-1"
              >
                <Button asChild className="flex-1 bg-gradient-gold text-earth font-semibold">
                  <Link to="/booking">
                    <Calendar className="mr-2 h-4 w-4" /> Book Now
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-primary text-primary">
                  <a href="tel:+918122939197">
                    <Phone className="mr-2 h-4 w-4" /> Call Us
                  </a>
                </Button>
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Scroll progress bar */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-[3px] origin-left bg-gradient-gold"
        style={{ scaleX: reduce ? 1 : progress, opacity: scrolled ? 1 : 0 }}
      />
    </motion.header>
  );
};

export default SiteHeader;
