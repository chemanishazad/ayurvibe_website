import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
    title: "Ayurveda Hospital",
    subtitle: "Where Ancient Wisdom Meets Modern Healing",
    description: "Experience the timeless art of Ayurvedic medicine in a sanctuary designed for your complete wellness journey"
  },
  {
    id: 2,
    image: panchakarmaImg,
    title: "Panchakarma Detox",
    subtitle: "Complete Body Purification",
    description: "Transform your health with our signature detoxification treatments that cleanse, rejuvenate, and restore natural balance"
  },
  {
    id: 3,
    image: shirodharaImg,
    title: "Therapeutic Treatments",
    subtitle: "Mind, Body & Soul Harmony",
    description: "Discover personalized healing therapies that address your unique constitution and restore optimal wellbeing"
  },
  {
    id: 4,
    image: abhyangaImg,
    title: "Rejuvenation Therapy",
    subtitle: "Restore Your Natural Vitality",
    description: "Indulge in ancient massage techniques and oil therapies that nourish your body from within"
  },
  {
    id: 5,
    image: herbsImg,
    title: "Natural Medicine",
    subtitle: "Pure Herbal Healing",
    description: "Experience the power of carefully selected herbs and natural remedies prepared with traditional wisdom"
  }
];

const HeroSlider = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
  <div className="relative h-[90vh] min-h-[600px] sm:h-screen overflow-hidden">
      {/* Background Images */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            "absolute inset-0 transition-opacity duration-1000",
            index === currentSlide ? "opacity-100" : "opacity-0"
          )}
        >
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${slide.image})` }}
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
      ))}

      {/* Navigation */}
      <nav className="relative z-20 container mx-auto px-4 py-4 md:py-6">
        <div className="flex items-center justify-between">
          <Logo className="h-16 md:h-20 w-auto drop-shadow-lg" withText textClassName="hidden sm:block text-white" subtitleText="Holistic Ayurveda" />
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            <Link to="/about" className="text-white hover:text-gold transition-colors">About</Link>
            <Link to="/treatments" className="text-white hover:text-gold transition-colors">Treatments</Link>
            <Link to="/dosha" className="text-white hover:text-gold transition-colors">Find Your Dosha</Link>
            <Link to="/booking" className="text-white hover:text-gold transition-colors">Book Appointment</Link>
            <Link to="/contact" className="text-white hover:text-gold transition-colors">Contact</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-20 container mx-auto px-4 py-16 md:py-20 text-center text-white">
        <div className="max-w-4xl mx-auto px-0 sm:px-2">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 animate-fade-in">
            {slides[currentSlide].title}
          </h1>
          <p className="text-lg md:text-2xl mb-8 text-white/90 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {slides[currentSlide].subtitle}
          </p>
          <p className="text-base md:text-lg mb-12 max-w-2xl mx-auto text-white/80 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            {slides[currentSlide].description}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Button asChild size="lg" className="bg-gold hover:bg-gold/90 text-earth px-8 py-4 text-lg">
              <Link to="/booking">
                <Calendar className="mr-2 h-5 w-5" />
                Book Consultation
              </Link>
            </Button>
            {/* <Button asChild variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-earth px-8 py-4 text-lg bg-white/10 backdrop-blur-sm">
              <Link to="/about">Learn More</Link>
            </Button> */}
          </div>
        </div>
      </div>

      {/* Arrow Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-6 w-6 text-white group-hover:text-gold" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 group"
        aria-label="Next slide"
      >
        <ChevronRight className="h-6 w-6 text-white group-hover:text-gold" />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              index === currentSlide 
                ? "bg-gold scale-125" 
                : "bg-white/50 hover:bg-white/70"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroSlider;