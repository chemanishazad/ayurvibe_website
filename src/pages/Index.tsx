import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Leaf, Heart, Users, MapPin, Phone, Mail, Calendar, Clock, Star, Sparkles, CheckCircle, Award, Shield, Stethoscope, Timer, Quote, Loader2 } from 'lucide-react';
import DoshaQuiz from '@/components/DoshaQuiz';
import HospitalMap from '@/components/HospitalMap';
import InteractiveBodyMap from '@/components/InteractiveBodyMap';
import TreatmentComparison from '@/components/TreatmentComparison';
import LiveChat from '@/components/LiveChat';
import WellnessBlog from '@/components/WellnessBlog';
import FAQSection from '@/components/FAQSection';
import SmoothScroll from '@/components/SmoothScroll';
import BackToTop from '@/components/BackToTop';
import ProgressiveWebApp from '@/components/ProgressiveWebApp';
import HeroSlider from '@/components/HeroSlider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        autoplay?: boolean | '';
        loop?: boolean | '';
        mode?: string;
      };
    }
  }
}

// Import treatment images
import panchakarmaImg from '@/assets/panchakarma-treatment.jpg';
import abhyangaImg from '@/assets/abhyanga-massage.jpg';
import shirodharaImg from '@/assets/shirodhara-therapy.jpg';
import herbsImg from '@/assets/ayurvedic-herbs.jpg';
import doctorImg from '@/assets/ayurvedic-doctor.jpg';
import hospitalImg from '@/assets/hospital-exterior.jpg';
import logoNew from '@/assets/logo.png';
import drVaitheeshwari from '@/assets/dr-vaitheeshwari.jpg';

const Index = () => {
  const [selectedDosha, setSelectedDosha] = useState<string | null>(null);
  const [showDoshaQuiz, setShowDoshaQuiz] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeTreatmentIndex, setActiveTreatmentIndex] = useState<number | null>(null);
  const { toast } = useToast();
  const [showThankYou, setShowThankYou] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Booking form state (EmailJS schema)
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [inquiryType, setInquiryType] = useState('Appointment');
  const [notes, setNotes] = useState('');

  const sendEmail = async () => {
    setIsSending(true);
    const serviceId = 'service_0du2i3q';
    const templateId = 'template_laoe4hx';
    const userId = 'jCbJ4C1pc_xXhy0Fn';

    const templateParams = {
      name: fullName,
      age,
      mobile,
      email: emailAddr,
      to_email: emailAddr,
      to_name: fullName,
      from_name: 'Sri Vinayaga Ayurvibe',
      reply_to: emailAddr,
      inquiry_type: inquiryType,
      message: notes,
      time: new Date().toString(),
    } as Record<string, unknown>;

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: userId,
          template_params: templateParams,
        }),
      });

      if (response.ok) {
        setFullName('');
        setAge('');
        setMobile('');
        setEmailAddr('');
        setNotes('');
        setInquiryType('Appointment');
        setShowThankYou(true);
      } else {
        const text = await response.text();
        throw new Error(text || 'Failed to send');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast({ title: 'Failed to send', description: msg });
    } finally {
      setIsSending(false);
    }
  };

  const treatments = [
    {
      name: "Panchakarma",
      description: "Complete detoxification and rejuvenation therapy using five traditional cleansing procedures to eliminate toxins and restore natural balance.",
      duration: "7-21 days",
      price: "From $1,200",
      benefits: ["Complete detoxification", "Improved digestion", "Enhanced immunity", "Mental clarity", "Rejuvenated skin"],
      image: panchakarmaImg,
      category: "Detox"
    },
    {
      name: "Abhyanga", 
      description: "Full-body synchronized massage with warm herbal oils to balance doshas, improve circulation, and deeply nourish tissues.",
      duration: "60-90 mins",
      price: "From $150",
      benefits: ["Improved circulation", "Stress relief", "Better sleep", "Skin nourishment", "Joint flexibility"],
      image: abhyangaImg,
      category: "Massage"
    },
    {
      name: "Shirodhara",
      description: "Continuous pouring of warm medicated oil on the forehead to calm the mind, relieve stress, and enhance mental clarity.",
      duration: "45-60 mins", 
      price: "From $120",
      benefits: ["Deep relaxation", "Anxiety relief", "Better sleep", "Mental clarity", "Nervous system balance"],
      image: shirodharaImg,
      category: "Therapy"
    },
    {
      name: "Detox Therapy",
      description: "Personalized cleansing programs combining herbal medicines, dietary guidance, and therapeutic treatments.",
      duration: "3-14 days",
      price: "From $800",
      benefits: ["Toxin elimination", "Weight management", "Energy boost", "Digestive health", "Cellular renewal"],
      image: herbsImg,
      category: "Detox"
    },
    {
      name: "Rejuvenation Programs",
      description: "Comprehensive wellness packages combining multiple therapies for complete physical and mental renewal.",
      duration: "5-30 days", 
      price: "From $2,500",
      benefits: ["Complete renewal", "Anti-aging effects", "Vitality boost", "Stress management", "Longevity enhancement"],
      image: panchakarmaImg,
      category: "Wellness"
    },
    {
      name: "Herbal Steam Therapy",
      description: "Medicated steam therapy using carefully selected herbs to open pores, improve circulation and eliminate toxins.",
      duration: "20-30 mins",
      price: "From $80", 
      benefits: ["Pore cleansing", "Improved circulation", "Respiratory health", "Skin detox", "Muscle relaxation"],
      image: herbsImg,
      category: "Therapy"
    }
  ];

  const doctors = [
    {
      name: "Dr. Priya Sharma",
      qualification: "BAMS, MD (Ayurveda)",
      specialization: "Panchakarma & Women's Health",
      experience: "15 years",
      image: doctorImg
    },
    {  
      name: "Dr. Rajesh Kumar",
      qualification: "BAMS, PhD (Ayurvedic Medicine)",
      specialization: "Chronic Disease Management",
      experience: "20 years", 
      image: doctorImg
    },
    {
      name: "Dr. Anita Gupta", 
      qualification: "BAMS, MD (Kayachikitsa)",
      specialization: "Digestive Disorders & Detox",
      experience: "12 years",
      image: doctorImg
    }
  ];

  const testimonials = [
    {
      name: "Ananya Sharma",
      condition: "Chronic Stress & Anxiety",
      testimonial: "After my 14-day Panchakarma program, I feel like a completely new person. The stress that had been weighing me down for years is gone, and I have energy I haven't felt in decades.",
      rating: 5,
      treatment: "Panchakarma Program"
    },
    {
      name: "Priyanka Iyer", 
      condition: "Digestive Issues",
      testimonial: "The personalized treatment plan and herbal medicines completely transformed my digestive health. I'm finally able to enjoy food again without discomfort.",
      rating: 5,
      treatment: "Detox Therapy"
    },
    {
      name: "Meera Nair",
      condition: "Chronic Pain", 
      testimonial: "The Abhyanga massages and herbal treatments have given me relief from chronic joint pain that conventional medicine couldn't address. I'm so grateful for this holistic approach.",
      rating: 5,
      treatment: "Abhyanga & Herbal Therapy" 
    },
    {
      name: "Aishwarya Menon",
      condition: "Insomnia & Anxiety",
      testimonial: "Shirodhara sessions calmed my mind like nothing else. I sleep peacefully now and feel centered throughout the day.",
      rating: 5,
      treatment: "Shirodhara"
    },
    {
      name: "Kavya Reddy",
      condition: "Skin Health",
      testimonial: "After the rejuvenation program, my skin is glowing and I feel lighter and more positive. Truly life-changing!",
      rating: 5,
      treatment: "Rejuvenation Program"
    },
    {
      name: "Sneha Kapoor",
      condition: "Thyroid & Metabolism",
      testimonial: "Gentle detox and diet guidance improved my thyroid balance. Energy is back and mood is stable.",
      rating: 5,
      treatment: "Holistic Detox"
    }
  ];

  const doshas = [
    {
      name: "Vata",
      element: "Air & Space",
      traits: ["Creative", "Energetic", "Thin build", "Quick thinking", "Sensitive to cold"],
      lifestyle: ["Regular sleep", "Warm foods", "Gentle exercise", "Meditation", "Routine"],
      color: "from-blue-100 to-purple-100"
    },
    {
      name: "Pitta",
      element: "Fire & Water", 
      traits: ["Ambitious", "Focused", "Medium build", "Strong digestion", "Warm body temperature"],
      lifestyle: ["Cool foods", "Avoid spicy", "Moderate exercise", "Shade", "Balance work-rest"],
      color: "from-red-100 to-orange-100"
    },
    {
      name: "Kapha",
      element: "Earth & Water",
      traits: ["Calm", "Stable", "Strong build", "Good stamina", "Slow metabolism"],
      lifestyle: ["Light foods", "Regular exercise", "Early rising", "Warm spices", "Active lifestyle"],
      color: "from-green-100 to-yellow-100"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-healing">
      <SmoothScroll />
      <BackToTop />
      <ProgressiveWebApp />
      
      {/* Hero Slider Section */}
      <HeroSlider />

      {/* About Section */}
      <section id="about" className="min-h-screen bg-cream flex items-center">
        <div className="container mx-auto px-4 w-full">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <Heart className="h-12 w-12 text-primary mr-4" />
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">Our Sacred Mission</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div className="space-y-6 text-left">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  In the gentle embrace of nature's wisdom, our hospital stands as a beacon of hope and healing. 
                  We honor the ancient science of Ayurveda, where every herb whispers secrets of wellness, 
                  and every treatment is a dance between mind, body, and spirit.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Our practitioners, trained in the timeless traditions yet equipped with modern understanding, 
                  guide each soul on their unique path to balance. Here, healing is not just medicine—it is an art, 
                  a poetry written in the language of restoration.
                </p>
              </div>
              <div className="bg-gradient-gold rounded-2xl p-8 shadow-warm">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-earth mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-earth mb-4">Holistic Approach</h3>
                  <p className="text-earth/80">
                    We treat not just symptoms, but the whole person—nurturing harmony between 
                    physical health, mental clarity, and spiritual well-being.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-none shadow-soft bg-card/50">
                <CardHeader className="text-center">
                  <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Expert Practitioners</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our team combines decades of traditional knowledge with modern medical expertise.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-soft bg-card/50">
                <CardHeader className="text-center">
                  <Leaf className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Natural Remedies</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We use only the finest herbs and natural ingredients, sourced with care and prepared with love.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-soft bg-card/50">
                <CardHeader className="text-center">
                  <Star className="h-12 w-12 text-primary mx-auto mb-4" />
                  <CardTitle className="text-xl">Modern Comfort</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Experience ancient healing in luxurious, comfortable surroundings designed for your peace.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section id="treatments" className="py-16 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Sacred Treatments</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each treatment is a journey of transformation, carefully crafted to restore your natural harmony 
              and awaken your body's innate healing wisdom.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {treatments.map((treatment, index) => (
              <Card key={index} className="border-none shadow-soft bg-card hover:shadow-warm transition-all duration-300 hover:scale-105 overflow-hidden">
                <div className="relative h-48 overflow-hidden">
                  <img 
                    loading="lazy"
                    src={treatment.image} 
                    alt={treatment.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gold text-earth border-none font-medium">
                      {treatment.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/20 text-white border-none backdrop-blur-sm">
                      {treatment.duration}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl text-foreground">{treatment.name}</CardTitle>
                    <span className="text-lg font-bold text-primary">{treatment.price}</span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <CardDescription className="text-base leading-relaxed">
                    {treatment.description}
                  </CardDescription>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2 text-sm">Key Benefits:</h4>
                    <div className="grid grid-cols-1 gap-1">
                      {treatment.benefits.slice(0, 3).map((benefit, idx) => (
                        <div key={idx} className="flex items-center text-sm text-muted-foreground">
                          <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90" size="sm">
                      <a href="#booking">Book Now</a>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={() => { setActiveTreatmentIndex(index); setDetailsOpen(true); }}
                    >
                      Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* Treatment Details Modal */}
          <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
            <DialogContent className="max-w-lg">
              {activeTreatmentIndex !== null && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>{treatments[activeTreatmentIndex].name}</span>
                      <Badge className="ml-3 bg-gold text-earth border-none">{treatments[activeTreatmentIndex].category}</Badge>
                    </DialogTitle>
                    <DialogDescription>
                      {treatments[activeTreatmentIndex].duration} • {treatments[activeTreatmentIndex].price}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={treatments[activeTreatmentIndex].image} 
                        alt={treatments[activeTreatmentIndex].name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                    <p className="text-muted-foreground">
                      {treatments[activeTreatmentIndex].description}
                    </p>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 text-sm">Full Benefits:</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {treatments[activeTreatmentIndex].benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-center text-sm text-muted-foreground">
                            <CheckCircle className="h-3 w-3 text-primary mr-2 flex-shrink-0" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button asChild className="flex-1 bg-primary hover:bg-primary/90">
                        <a href="#booking" onClick={() => setDetailsOpen(false)}>Book Now</a>
                      </Button>
                      <Button 
                        variant="outline" 
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => setDetailsOpen(false)}
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Interactive Body Map Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Targeted Healing Solutions</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore our interactive treatment map to discover personalized Ayurvedic solutions 
              for different areas of your body and specific health concerns.
            </p>
          </div>
          <InteractiveBodyMap />
        </div>
      </section>

      {/* Treatment Comparison Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Compare Our Treatments</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Not sure which treatment is right for you? Use our comparison tool to explore 
              different therapies and find the perfect match for your wellness goals.
            </p>
          </div>
          <TreatmentComparison />
        </div>
      </section>

      {/* Our Expert Practitioner Section */}
      <section id="doctors" className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Our Expert Practitioner</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Meet our experienced Ayurvedic doctor who combines ancient wisdom with modern medical expertise 
              to guide you on your healing journey.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card className="border-none shadow-soft bg-card hover:shadow-warm transition-all duration-300 text-center">
              <CardContent className="pt-8">
                <div className="w-40 h-40 mx-auto mb-6 rounded-full overflow-hidden shadow-soft">
                  <img 
                    loading="lazy"
                    src={drVaitheeshwari}
                    alt="Dr. Vaitheeshwari"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-2">Dr. Vaitheeshwari</h3>
                <p className="text-primary font-medium mb-2">BAMS (Ayurveda)</p>
                <p className="text-muted-foreground mb-3">Panchakarma & Women's Health</p>
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Stethoscope className="h-4 w-4 text-gold" />
                  <span className="text-sm text-muted-foreground">3 Years Experience</span>
                </div>
                <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <a href="#booking">Book Consultation</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 bg-gradient-earth text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Healing Stories</h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Real stories from our patients who found healing and transformation through Ayurveda.
            </p>
          </div>

          {/* Marquee row 1 */}
          <div className="overflow-hidden marquee-container [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track gap-8 pr-8">
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <Card key={`m1-${index}`} className="min-w-[280px] sm:min-w-[320px] md:min-w-[420px] border-none shadow-warm bg-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gold fill-current" />
                      ))}
                    </div>
                    <Quote className="h-6 w-6 text-gold mb-3 opacity-60" />
                    <p className="text-white/90 leading-relaxed mb-4 italic">
                      "{testimonial.testimonial}"
                    </p>
                    <Separator className="bg-white/20 mb-3" />
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-white/70 text-xs mb-1">{testimonial.condition}</p>
                      <p className="text-gold text-xs font-medium">{testimonial.treatment}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Marquee row 2 (reverse direction) */}
          <div className="mt-8 overflow-hidden marquee-container [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="marquee-track gap-8 pr-8" style={{ animationDirection: 'reverse' }}>
              {[...testimonials, ...testimonials].map((testimonial, index) => (
                <Card key={`m2-${index}`} className="min-w-[280px] sm:min-w-[320px] md:min-w-[420px] border-none shadow-warm bg-white/10 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-2">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-gold fill-current" />
                      ))}
                    </div>
                    <Quote className="h-6 w-6 text-gold mb-3 opacity-60" />
                    <p className="text-white/90 leading-relaxed mb-4 italic">
                      "{testimonial.testimonial}"
                    </p>
                    <Separator className="bg-white/20 mb-3" />
                    <div>
                      <h4 className="font-bold text-white">{testimonial.name}</h4>
                      <p className="text-white/70 text-xs mb-1">{testimonial.condition}</p>
                      <p className="text-gold text-xs font-medium">{testimonial.treatment}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Why Choose Ayurveda Hospital</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the perfect blend of ancient wisdom and modern facilities in your healing journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <img 
                src={hospitalImg} 
                alt="Ayurveda Hospital"
                className="w-full h-96 object-cover rounded-2xl shadow-warm"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl"></div>
            </div>
            
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Certified Excellence</h3>
                  <p className="text-muted-foreground">Government certified facility with internationally trained practitioners.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Safe & Natural</h3>
                  <p className="text-muted-foreground">Only pure, organic herbs and time-tested therapeutic methods.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Timer className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Personalized Care</h3>
                  <p className="text-muted-foreground">Individual treatment plans tailored to your unique constitution and needs.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Heart className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Holistic Wellness</h3>
                  <p className="text-muted-foreground">Complete approach addressing physical, mental, and spiritual well-being.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Find Your Dosha Section */}
      <section id="dosha" className="py-20 bg-gradient-healing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Discover Your Dosha</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Understanding your constitutional type is the first step toward personalized healing. 
              Explore the three doshas and find your path to balance.
            </p>
          </div>

          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {doshas.map((dosha, index) => (
                  <Card key={index} className="border-none shadow-soft bg-card/80 backdrop-blur-sm">
                    <CardHeader className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r ${dosha.color} flex items-center justify-center`}>
                        <span className="text-2xl font-bold text-earth">{dosha.name[0]}</span>
                      </div>
                      <CardTitle className="text-xl text-foreground">{dosha.name}</CardTitle>
                      <CardDescription className="text-primary font-medium">{dosha.element}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="flex flex-wrap justify-center gap-1 mb-4">
                          {dosha.traits.slice(0, 3).map((trait, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-primary/30">
                              {trait}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="space-y-6">
                <p className="text-lg text-muted-foreground">
                  Ready to discover your unique constitution and receive personalized recommendations?
                </p>
                <Button 
                  size="lg" 
                  onClick={() => setShowDoshaQuiz(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Take the Dosha Quiz
                </Button>
                <p className="text-sm text-muted-foreground">
                  Complete our comprehensive assessment in just 5 minutes
                </p>
              </div>
            </div>
          </div>
          
          <DoshaQuiz 
            isOpen={showDoshaQuiz} 
            onClose={() => setShowDoshaQuiz(false)} 
          />
        </div>
      </section>

      {/* Wellness Blog Section */}
      <section id="blog" className="py-20 bg-background" aria-labelledby="blog-heading">
        <div className="container mx-auto px-4">
          <h2 id="blog-heading" className="sr-only">Wellness Blog</h2>
          <WellnessBlog />
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-cream">
        <div className="container mx-auto px-4">
          <FAQSection />
        </div>
      </section>

      {/* Booking Section with Map */}
      <section id="booking" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Book Your Healing Journey</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Begin your transformation today. Schedule a consultation with our expert practitioners 
              and discover the perfect treatment plan for your unique constitution.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Booking Form */}
            <Card className="border-none shadow-soft">
              <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary mr-2" />
                  Schedule Your Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" type="number" placeholder="Your age" value={age} onChange={(e) => setAge(e.target.value)} />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile</Label>
                    <Input id="phone" type="tel" placeholder="+91 81229 39197" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="your@email.com" value={emailAddr} onChange={(e) => setEmailAddr(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry">Inquiry Type</Label>
                  <Select value={inquiryType} onValueChange={setInquiryType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appointment">Appointment</SelectItem>
                      <SelectItem value="Panchakarma">Panchakarma</SelectItem>
                      <SelectItem value="Abhyanga">Abhyanga</SelectItem>
                      <SelectItem value="Shirodhara">Shirodhara</SelectItem>
                      <SelectItem value="Detox">Detox</SelectItem>
                      <SelectItem value="Rejuvenation">Rejuvenation</SelectItem>
                      <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your health concerns or questions..."
                    rows={4}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <Button onClick={sendEmail} disabled={isSending} className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Clock className="mr-2 h-5 w-5" />
                      Send Inquiry
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Map Only */}
            <div className="space-y-6">
              <HospitalMap />
            </div>
          </div>
        </div>
      </section>

      {/* Thank You Dialog */}
      <Dialog open={showThankYou} onOpenChange={setShowThankYou}>
        <DialogContent className="max-w-lg text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-center gap-2">
              Thank you!
            </DialogTitle>
            <DialogDescription className="text-base">
              Your message has been sent. Our expert will contact you shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col items-center gap-4">
            <lottie-player
              autoplay
              loop
              mode="normal"
              style={{ width: '220px', height: '220px' }}
              src={new URL('../assets/Thank You.json', import.meta.url).toString()}
            />
            <Button className="w-full" onClick={() => setShowThankYou(false)}>Okay</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Chat Component */}
      <LiveChat />

      {/* Footer */}
      <footer id="contact" className="bg-earth text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <img src={logoNew} alt="Sri Vinayaga Ayurvibe Logo" className="h-8 w-8" />
                <span className="text-2xl font-bold">Sri Vinayaga Ayurvibe</span>
              </div>
              <p className="text-primary-foreground/80 leading-relaxed mb-2">
                Dr. Vaitheeshwari BAMS
              </p>
              <p className="text-primary-foreground/80 leading-relaxed mb-6">
                Reg No: 2095
              </p>
              <p className="text-primary-foreground/80 leading-relaxed mb-6">
                A sanctuary of healing where ancient wisdom meets modern care. 
                Your journey to wellness begins here.
              </p>
              
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-gold">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-primary-foreground/90">No: 12/597, Main Road, Nethaji Nagar</p>
                    <p className="text-primary-foreground/90">Perumbakkam (Nookampalayam)</p>
                    <p className="text-primary-foreground/90">Chennai - 600131</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gold" />
                  <p className="text-primary-foreground/90">8122939197</p>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gold" />
                  <p className="text-primary-foreground/90">sv.ayurvibe@gmail.com</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-gold">Hours of Operation</h3>
              <div className="space-y-2 text-primary-foreground/90">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>10:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
              </div>
              <Separator className="my-6 bg-primary-foreground/20" />
              <p className="text-sm text-primary-foreground/70">
                Emergency consultations available 24/7
              </p>
            </div>

          </div>

          <Separator className="bg-primary-foreground/20 mb-8" />
          
          <div className="text-center">
            <p className="text-primary-foreground/70">
              © 2024 Sri Vinayaga Ayurvibe. All rights reserved. • Healing with love, wisdom, and compassion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
