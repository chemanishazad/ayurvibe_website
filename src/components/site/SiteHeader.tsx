import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Calendar, Clock, MapPin, Menu, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/Logo';
import { clinic, navLinks } from '@/data/site';
import { EASE } from '@/components/site/motion';
import { useScrollProgress, useScrolledPast } from '@/components/site/scroll';

/**
 * Sticky site header.
 *
 * Three states: a utility strip that scrolls away, a transparent bar over the
 * hero, and a condensed frosted bar with a reading-progress line once the page
 * moves. The mobile menu is a full sheet with staggered links.
 */
const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const reduce = useReducedMotion();
  const progress = useScrollProgress();
  const scrolled = useScrolledPast(16);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <motion.header
      initial={reduce ? false : { y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* Utility strip — collapses away on scroll */}
      <motion.div
        aria-hidden={scrolled}
        animate={{ height: scrolled ? 0 : 36, opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="overflow-hidden bg-foreground text-background"
      >
        <div className="shell flex h-9 items-center justify-between gap-4 text-[0.72rem] sm:text-xs">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary-foreground/70" aria-hidden />
            <span className="truncate">Nookampalayam, Perumbakkam, Chennai 600131</span>
          </span>
          <span className="hidden items-center gap-1.5 sm:flex">
            <Clock className="h-3.5 w-3.5 text-primary-foreground/70" aria-hidden />
            Open every day · 10 AM – 8 PM
          </span>
          <a href={`tel:${clinic.phone}`} className="flex shrink-0 items-center gap-1.5 font-semibold hover:underline">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">{clinic.phoneDisplay}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </motion.div>

      {/* Main bar */}
      <div
        className={cn(
          'relative transition-all duration-300',
          scrolled || open
            ? 'border-b border-border bg-background shadow-soft'
            : 'border-b border-transparent bg-background/85'
        )}
      >
        <div className={cn('shell flex items-center justify-between gap-4 transition-all duration-300', scrolled ? 'py-2' : 'py-3')}>
          <Link to="/" aria-label={`${clinic.name} — home`} className="shrink-0">
            <Logo
              className={cn('w-auto transition-all duration-300', scrolled ? 'h-9 md:h-10' : 'h-11 md:h-12')}
              withText
              textClassName="hidden sm:block text-foreground [&>span:first-child]:text-base [&>span:first-child]:md:text-lg [&>span:first-child]:font-extrabold [&>span:first-child]:tracking-tight"
              subtitleText="Ayurveda Hospital · Chennai"
            />
          </Link>

          <nav aria-label="Primary" className="hidden shrink-0 items-center gap-0.5 lg:flex">
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium transition-colors xl:px-3.5',
                    active ? 'text-primary' : 'text-foreground/70 hover:text-primary'
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 -z-10 rounded-full bg-primary/8"
                      transition={{ duration: 0.35, ease: EASE }}
                    />
                  )}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`tel:${clinic.phone}`}
              className="hidden items-center gap-2 whitespace-nowrap rounded-full border border-border px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary 2xl:inline-flex"
            >
              <Phone className="h-4 w-4 text-primary" aria-hidden />
              {clinic.phoneDisplay}
            </a>
            <Button
              asChild
              size="sm"
              className="hidden whitespace-nowrap rounded-full px-4 font-semibold shadow-soft sm:inline-flex lg:px-5"
            >
              <Link to="/booking">
                <Calendar className="mr-1.5 h-4 w-4" aria-hidden />
                <span className="hidden xl:inline">Book appointment</span>
                <span className="xl:hidden">Book</span>
              </Link>
            </Button>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="site-mobile-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:border-primary/40 hover:text-primary lg:hidden"
            >
              {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Reading progress */}
        <motion.div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-primary"
          style={{ scaleX: reduce ? 0 : progress, opacity: scrolled ? 1 : 0 }}
        />
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.nav
            id="site-mobile-menu"
            aria-label="Mobile"
            initial={reduce ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background lg:hidden"
          >
            <motion.ul
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } } }}
              className="shell space-y-1 py-4"
            >
              {navLinks.map((link) => (
                <motion.li key={link.to} variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}>
                  <Link
                    to={link.to}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-primary/8 hover:text-primary"
                  >
                    {link.label}
                    <span aria-hidden className="text-muted-foreground">→</span>
                  </Link>
                </motion.li>
              ))}
              <motion.li
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                className="grid grid-cols-2 gap-2 px-3 pb-2 pt-3"
              >
                <Button asChild className="rounded-full font-semibold">
                  <Link to="/booking">
                    <Calendar className="mr-2 h-4 w-4" aria-hidden /> Book
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full border-primary/40 font-semibold text-primary">
                  <a href={`tel:${clinic.phone}`}>
                    <Phone className="mr-2 h-4 w-4" aria-hidden /> Call
                  </a>
                </Button>
              </motion.li>
              <motion.li
                variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}
                className="px-3 pb-2 text-xs text-muted-foreground"
              >
                {clinic.street}, {clinic.locality} {clinic.postalCode} · Open every day 10 AM – 8 PM
              </motion.li>
            </motion.ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default SiteHeader;
