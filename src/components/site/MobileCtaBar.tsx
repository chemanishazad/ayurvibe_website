import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, MessageCircle, Phone } from 'lucide-react';
import { clinic } from '@/data/site';
import { EASE } from '@/components/site/motion';

/**
 * Fixed call/WhatsApp/book bar for small screens. Appears once the visitor has
 * scrolled past the hero, so it never covers the first impression.
 */
const MobileCtaBar = () => {
  const [visible, setVisible] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 620);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduce ? false : { y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={reduce ? undefined : { y: 80, opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          className="safe-pb fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background shadow-warm sm:hidden"
        >
          <div className="grid grid-cols-3 gap-2 px-3 py-2.5">
            <a
              href={`tel:${clinic.phone}`}
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-foreground transition-colors active:bg-secondary"
            >
              <Phone className="h-5 w-5 text-primary" aria-hidden />
              Call
            </a>
            <a
              href={`https://wa.me/${clinic.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-1 rounded-xl py-2 text-xs font-semibold text-foreground transition-colors active:bg-secondary"
            >
              <MessageCircle className="h-5 w-5 text-primary" aria-hidden />
              WhatsApp
            </a>
            <Link
              to="/booking"
              className="flex flex-col items-center gap-1 rounded-xl bg-primary py-2 text-xs font-semibold text-primary-foreground"
            >
              <CalendarDays className="h-5 w-5" aria-hidden />
              Book
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileCtaBar;
