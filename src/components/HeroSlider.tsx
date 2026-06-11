import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight, Phone, ShieldCheck, Star, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import background images
import panchakarmaImg from '@/assets/panchakarma-treatment.jpg';
import abhyangaImg from '@/assets/abhyanga-massage.jpg';
import shirodharaImg from '@/assets/shirodhara-therapy.jpg';
import herbsImg from '@/assets/ayurvedic-herbs.jpg';
import hospitalImg from '@/assets/hospital-exterior.jpg';
import { Logo } from '@/components/Logo';

const slides = [
  {
    id: 1,
    image: hospitalImg,
    eyebrow: 'Government-Certified · Reg No. 2095',
    title: 'Best Ayurveda Clinic in Chennai',
    subtitle: 'Where Ancient Wisdom Meets Modern Healing',
    description:
      'Authentic Ayurvedic care at Nookampalayam, Perumbakkam — led by Dr. Vaitheeshwari, B.A.M.S. Personalised treatment for your unique constitution.',
  },
  {
    id: 2,
    image: panchakarmaImg,
    eyebrow: 'Signature Detox',
    title: 'Panchakarma Detox',
    subtitle: 'Complete Body Purification',
    description:
      'A 7–21 day cleansing journey that eliminates toxins, rebalances your doshas, and restores deep, lasting vitality.',
  },
  {
    id: 3,
    image: shirodharaImg,
    eyebrow: 'Mind & Nervous System',
    title: 'Shirodhara Therapy',
    subtitle: 'Calm the Mind, Restore Clarity',
    description:
      'A continuous stream of warm medicated oil melts away stress, eases insomnia, and brings profound mental stillness.',
  },
  {
    id: 4,
    image: abhyangaImg,
    eyebrow: 'Therapeutic Touch',
    title: 'Abhyanga Massage',
    subtitle: 'Nourish Body & Circulation',
    description:
      'Full-body synchronised massage with warm herbal oils to release tension, improve circulation, and deeply nourish tissue.',
  },
  {
    id: 5,
    image: herbsImg,
    eyebrow: 'Pure & Natural',
    title: 'Natural Herbal Medicine',
    subtitle: 'Healing the Way Nature Intended',
    description:
      'Carefully selected herbs and time-tested formulations, prepared with traditional wisdom for safe, effective healing.',
  },
];

const trustBadges = [
  { icon: ShieldCheck, label: 'Govt. Certified' },
  { icon: Star, label: '4.9 ★ (12 reviews)' },
  { icon: Leaf, label: '100% Authentic' },
];

const navLinks = [
  { to: '/about', label: 'About' },
  { to: '/treatments', label: 'Treatments' },
  { to: '/dosha', label: 'Find Your Dosha' },
  { to: '/blog', label: 'Blog' },
  { to: '/booking', label: 'Book' },
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  const slide = slides[currentSlide];

  return (
    <div className="relative h-[92vh] min-h-[640px] sm:h-screen overflow-hidden">
      {/* Background Images with cross-fade + Ken Burns */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className={cn(
            'absolute inset-0 transition-opacity duration-[1200ms]',
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div
            className={cn(
              'w-full h-full bg-cover bg-center bg-no-repeat',
              index === currentSlide && 'ken-burns'
            )}
            style={{ backgroundImage: `url(${s.image})` }}
          />
        </div>
      ))}

      {/* Cinematic gradient overlay (forest → terracotta mesh) */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/40" />

      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Logo
            className="h-14 md:h-20 w-auto drop-shadow-lg"
            withText
            textClassName="hidden sm:block text-white"
            subtitleText="Holistic Ayurveda"
          />
          <div className="hidden md:flex items-center gap-1 glass rounded-full px-2 py-1.5">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-white/90 hover:text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-white/15 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <a
            href="tel:+918122939197"
            className="md:hidden glass rounded-full p-2.5 text-white"
            aria-label="Call us"
          >
            <Phone className="h-5 w-5" />
          </a>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 pt-10 md:pt-16 text-center text-white">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="eyebrow !text-white !bg-white/15 !border-white/25 backdrop-blur-sm mb-6">
              <Leaf className="h-3.5 w-3.5" /> {slide.eyebrow}
            </span>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold mt-6 mb-5 leading-[1.05] drop-shadow-md">
              {slide.title}
            </h1>
            <p className="text-lg md:text-2xl mb-5 text-gold font-medium">{slide.subtitle}</p>
            <p className="text-base md:text-lg mb-9 max-w-2xl mx-auto text-white/85">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-gold hover:opacity-95 text-earth px-8 py-6 text-lg font-semibold shadow-gold pulse-ring"
          >
            <Link to="/booking">
              <Calendar className="mr-2 h-5 w-5" />
              Book Consultation
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="px-8 py-6 text-lg glass border-white/30 text-white hover:bg-white/20 hover:text-white"
          >
            <a href="tel:+918122939197">
              <Phone className="mr-2 h-5 w-5" />
              +91 81229 39197
            </a>
          </Button>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          {trustBadges.map((b) => (
            <span key={b.label} className="flex items-center gap-2 text-sm text-white/85">
              <b.icon className="h-4 w-4 text-gold" />
              {b.label}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-3 transition-all duration-300 group hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white group-hover:text-gold" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 z-20 glass rounded-full p-3 transition-all duration-300 group hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white group-hover:text-gold" />
      </button>

      {/* Progress-style dot indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              'h-2 rounded-full transition-all duration-500',
              index === currentSlide ? 'w-9 bg-gold' : 'w-2 bg-white/50 hover:bg-white/80'
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;
