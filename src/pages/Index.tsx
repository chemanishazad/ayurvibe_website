import React, { FormEvent, useState } from 'react';
// (imports restored above after cleanup)
import { Button } from '@/components/ui/button';
import SEO from '@/components/SEO';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Leaf, Heart, Users, MapPin, Phone, Mail, Calendar, Clock, Star, Sparkles, CheckCircle, Award, Shield, Stethoscope, Timer, Quote, Loader2, ArrowRight } from 'lucide-react';
import { Reveal, StaggerGroup, StaggerItem } from '@/components/Reveal';
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
import { Link } from 'react-router-dom';
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
import { Logo } from '@/components/Logo';
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
  const [formErrors, setFormErrors] = useState({
    fullName: '',
    age: '',
    mobile: '',
    emailAddr: '',
    inquiryType: '',
    notes: '',
  });

  const validateBookingForm = () => {
    const errors = {
      fullName: '',
      age: '',
      mobile: '',
      emailAddr: '',
      inquiryType: '',
      notes: '',
    };

    const trimmedName = fullName.trim();
    const trimmedAge = age.trim();
    const trimmedMobile = mobile.trim();
    const trimmedEmail = emailAddr.trim();
    const trimmedNotes = notes.trim();

    if (!trimmedName) {
      errors.fullName = 'Full name is required';
    } else if (!/^[a-zA-Z.\s'-]{3,}$/.test(trimmedName)) {
      errors.fullName = 'Enter a valid full name';
    }

    if (!trimmedAge) {
      errors.age = 'Age is required';
    } else {
      const ageNum = Number(trimmedAge);
      if (!Number.isInteger(ageNum) || ageNum < 1 || ageNum > 120) {
        errors.age = 'Enter a valid age between 1 and 120';
      }
    }

    if (!trimmedMobile) {
      errors.mobile = 'Mobile number is required';
    } else {
      const digitsOnly = trimmedMobile.replace(/\D/g, '');
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        errors.mobile = 'Enter a valid mobile number';
      }
    }

    if (!trimmedEmail) {
      errors.emailAddr = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.emailAddr = 'Enter a valid email address';
    }

    if (!inquiryType.trim()) {
      errors.inquiryType = 'Please select inquiry type';
    }

    if (!trimmedNotes) {
      errors.notes = 'Message is required';
    } else if (trimmedNotes.length < 10) {
      errors.notes = 'Message should be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.values(errors).every((err) => !err);
  };

  const sendEmail = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (!validateBookingForm()) {
      toast({
        title: 'Please check the form',
        description: 'Fix the highlighted fields and try again.',
      });
      return;
    }

    setIsSending(true);
    const serviceId = 'service_0du2i3q';
    const templateId = 'template_laoe4hx';
    const userId = 'jCbJ4C1pc_xXhy0Fn';
    const trimmedName = fullName.trim();
    const trimmedAge = age.trim();
    const trimmedMobile = mobile.trim();
    const trimmedEmail = emailAddr.trim();
    const trimmedNotes = notes.trim();

    const templateParams = {
      name: trimmedName,
      age: trimmedAge,
      mobile: trimmedMobile,
      email: trimmedEmail,
      to_email: trimmedEmail,
      to_name: trimmedName,
      from_name: 'Sri Vinayaga Ayurvibe',
      reply_to: trimmedEmail,
      inquiry_type: inquiryType,
      message: trimmedNotes,
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
        setFormErrors({
          fullName: '',
          age: '',
          mobile: '',
          emailAddr: '',
          inquiryType: '',
          notes: '',
        });
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
      description: "Complete detoxification and rejuvenation therapy using five traditional cleansing procedures to eliminate toxins and restore natural balance. This comprehensive treatment includes Vamana (therapeutic vomiting), Virechana (purgation), Basti (medicated enema), Nasya (nasal administration), and Raktamokshana (bloodletting) to cleanse the body at cellular level.",
      duration: "7-21 days",
      benefits: ["Complete detoxification", "Improved digestion", "Enhanced immunity", "Mental clarity", "Rejuvenated skin", "Balanced doshas", "Increased energy", "Better sleep quality", "Reduced inflammation", "Anti-aging effects"],
      image: panchakarmaImg,
      category: "Detox"
    },
    {
      name: "Abhyanga", 
      description: "Full-body synchronized massage with warm herbal oils to balance doshas, improve circulation, and deeply nourish tissues. This ancient therapy uses specific oil blends tailored to individual constitution, applied with rhythmic strokes to stimulate marma points and promote healing.",
      duration: "60-90 mins",
      benefits: ["Improved circulation", "Stress relief", "Better sleep", "Skin nourishment", "Joint flexibility", "Muscle relaxation", "Lymphatic drainage", "Hormonal balance", "Pain relief", "Enhanced immunity"],
      image: abhyangaImg,
      category: "Massage"
    },
    {
      name: "Shirodhara",
      description: "Continuous pouring of warm medicated oil on the forehead to calm the mind, relieve stress, and enhance mental clarity. This deeply relaxing therapy targets the third eye chakra and nervous system, promoting profound relaxation and mental rejuvenation.",
      duration: "45-60 mins", 
      benefits: ["Deep relaxation", "Anxiety relief", "Better sleep", "Mental clarity", "Nervous system balance", "Headache relief", "Improved concentration", "Emotional stability", "Reduced blood pressure", "Enhanced memory"],
      image: shirodharaImg,
      category: "Therapy"
    },
    {
      name: "Detox Therapy",
      description: "Personalized cleansing programs combining herbal medicines, dietary guidance, and therapeutic treatments. Our detox programs are customized based on individual constitution, lifestyle, and health goals to ensure safe and effective toxin elimination.",
      duration: "3-14 days",
      benefits: ["Toxin elimination", "Weight management", "Energy boost", "Digestive health", "Cellular renewal", "Improved metabolism", "Clearer skin", "Better mood", "Reduced cravings", "Enhanced vitality"],
      image: herbsImg,
      category: "Detox"
    },
    {
      name: "Rejuvenation Programs",
      description: "Comprehensive wellness packages combining multiple therapies for complete physical and mental renewal. These programs integrate Panchakarma, specialized massages, yoga, meditation, and dietary modifications for holistic transformation.",
      duration: "5-30 days", 
      benefits: ["Complete renewal", "Anti-aging effects", "Vitality boost", "Stress management", "Longevity enhancement", "Improved immunity", "Better sleep", "Enhanced mental clarity", "Balanced hormones", "Increased energy"],
      image: panchakarmaImg,
      category: "Wellness"
    },
    {
      name: "Herbal Steam Therapy",
      description: "Medicated steam therapy using carefully selected herbs to open pores, improve circulation and eliminate toxins. This therapy combines the healing properties of specific herbs with the therapeutic benefits of steam to promote deep cleansing and relaxation.",
      duration: "20-30 mins",
      benefits: ["Pore cleansing", "Improved circulation", "Respiratory health", "Skin detox", "Muscle relaxation", "Reduced inflammation", "Better breathing", "Enhanced skin texture", "Stress relief", "Improved immunity"],
      image: herbsImg,
      category: "Therapy"
    },
    {
      name: "Pizhichil",
      description: "Warm oil bath therapy where medicated oils are continuously poured over the body while receiving gentle massage. This luxurious treatment deeply nourishes tissues, improves circulation, and provides profound relaxation while balancing the nervous system.",
      duration: "60-90 mins",
      benefits: ["Deep tissue nourishment", "Improved circulation", "Muscle relaxation", "Joint mobility", "Skin rejuvenation", "Stress relief", "Better sleep", "Pain relief", "Enhanced flexibility", "Balanced doshas"],
      image: abhyangaImg,
      category: "Therapy"
    },
    {
      name: "Udvartana",
      description: "Herbal powder massage therapy that exfoliates the skin, improves circulation, and helps in weight management. This invigorating treatment uses specific herbal powders to stimulate the lymphatic system and promote healthy skin.",
      duration: "45-60 mins",
      benefits: ["Skin exfoliation", "Improved circulation", "Weight management", "Lymphatic drainage", "Cellulite reduction", "Better skin texture", "Increased metabolism", "Toxin elimination", "Enhanced energy", "Improved muscle tone"],
      image: herbsImg,
      category: "Therapy"
    },
    {
      name: "Nasya",
      description: "Nasal administration of medicated oils and herbal preparations to cleanse and nourish the head and neck region. This therapy is particularly beneficial for respiratory health, sinus issues, and mental clarity.",
      duration: "15-30 mins",
      benefits: ["Sinus relief", "Improved breathing", "Mental clarity", "Headache relief", "Better sleep", "Enhanced memory", "Reduced allergies", "Clearer vision", "Balanced hormones", "Improved concentration"],
      image: herbsImg,
      category: "Therapy"
    },
    {
      name: "Kati Basti",
      description: "Localized treatment for lower back pain where warm medicated oil is retained in a dough ring placed on the lower back. This targeted therapy provides deep relief for chronic back pain and spinal issues.",
      duration: "30-45 mins",
      benefits: ["Back pain relief", "Improved spinal health", "Muscle relaxation", "Reduced inflammation", "Better posture", "Enhanced flexibility", "Stress relief", "Improved circulation", "Nerve regeneration", "Better sleep"],
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
  <div className="min-h-dvh bg-gradient-healing pb-10">
      <SEO 
        title="Sri Vinayaga Ayurvibe — Best Ayurveda Hospital Chennai | Perumbakkam, OMR"
        description="Ayurveda hospital at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara. Serving 20km radius. Dr. Vaitheeshwari BAMS. Book now."
        canonical="https://svayurvibe.com/"
        locationKeywords={['Sholinganallur', 'Perumbakkam', 'OMR', 'Pallikaranai', 'Navalur', 'Kelambakkam', 'Tambaram', 'Medavakkam', 'Velachery', 'Thiruvanmiyur', 'Kovilambakkam', 'Thoraipakkam', 'Besant Nagar', 'Adyar', 'Mylapore', 'T. Nagar', 'Anna Nagar', 'Kodambakkam', 'Ashok Nagar', 'Porur', 'Mount Road', 'Egmore', 'Royapettah', 'Triplicane', 'George Town', 'Ambattur', 'Avadi', 'Pallavaram', 'Chromepet', 'St. Thomas Mount', 'Guindy', 'Saidapet', 'Nungambakkam', 'Kilpauk', 'Anna Salai', 'Cathedral Road', 'Rajiv Gandhi Salai', 'Old Mahabalipuram Road', 'ECR', 'East Coast Road', 'IT Corridor', 'Rajiv Gandhi IT Corridor', 'OMR IT Corridor', 'Chennai', '20km radius', 'near Sholinganallur', 'Nookampalayam']}
        jsonLd={[
          {
            "@type": "MedicalBusiness",
            "name": "Sri Vinayaga Ayurvibe",
            "description": "Premier Ayurveda hospital at Nookampalayam, Perumbakkam, Chennai offering Panchakarma, Abhyanga, Shirodhara treatments. Serving 20km radius – easily reachable from Sholinganallur, OMR, Pallikaranai, Navalur, Kelambakkam, Tambaram, Medavakkam, Velachery, Chromepet.",
            "areaServed": [
              {"@type": "City", "name": "Sholinganallur"},
              {"@type": "City", "name": "Perumbakkam"},
              {"@type": "City", "name": "OMR Chennai"},
              {"@type": "City", "name": "Pallikaranai"},
              {"@type": "City", "name": "Navalur"},
              {"@type": "City", "name": "Kelambakkam"},
              {"@type": "City", "name": "Tambaram"},
              {"@type": "City", "name": "Medavakkam"},
              {"@type": "City", "name": "Velachery"},
              {"@type": "City", "name": "Thiruvanmiyur"},
              {"@type": "City", "name": "Kovilambakkam"},
              {"@type": "City", "name": "Thoraipakkam"},
              {"@type": "City", "name": "Besant Nagar"},
              {"@type": "City", "name": "Adyar"},
              {"@type": "City", "name": "Mylapore"},
              {"@type": "City", "name": "T. Nagar"},
              {"@type": "City", "name": "Anna Nagar"},
              {"@type": "City", "name": "Kodambakkam"},
              {"@type": "City", "name": "Ashok Nagar"},
              {"@type": "City", "name": "Porur"},
              {"@type": "City", "name": "Mount Road"},
              {"@type": "City", "name": "Egmore"},
              {"@type": "City", "name": "Royapettah"},
              {"@type": "City", "name": "Triplicane"},
              {"@type": "City", "name": "George Town"},
              {"@type": "City", "name": "Ambattur"},
              {"@type": "City", "name": "Avadi"},
              {"@type": "City", "name": "Pallavaram"},
              {"@type": "City", "name": "Chromepet"},
              {"@type": "City", "name": "St. Thomas Mount"},
              {"@type": "City", "name": "Guindy"},
              {"@type": "City", "name": "Saidapet"},
              {"@type": "City", "name": "Nungambakkam"},
              {"@type": "City", "name": "Kilpauk"},
              {"@type": "City", "name": "Anna Salai"},
              {"@type": "City", "name": "Cathedral Road"},
              {"@type": "City", "name": "Rajiv Gandhi Salai"},
              {"@type": "City", "name": "Old Mahabalipuram Road"},
              {"@type": "City", "name": "ECR"},
              {"@type": "City", "name": "East Coast Road"},
              {"@type": "City", "name": "IT Corridor"},
              {"@type": "City", "name": "Rajiv Gandhi IT Corridor"},
              {"@type": "City", "name": "OMR IT Corridor"},
              {"@type": "City", "name": "Chennai"}
            ],
            "medicalSpecialty": ["Ayurveda", "Panchakarma", "Abhyanga Massage", "Shirodhara Therapy", "Detox Treatment", "Holistic Wellness"]
          },
          {
            "@type": "Review",
            "itemReviewed": {
              "@type": "MedicalBusiness",
              "name": "Sri Vinayaga Ayurvibe"
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Ananya Sharma"
            },
            "reviewBody": "After my 14-day Panchakarma program, I feel like a completely new person. The stress that had been weighing me down for years is gone, and I have energy I haven't felt in decades."
          },
          {
            "@type": "Review",
            "itemReviewed": {
              "@type": "MedicalBusiness",
              "name": "Sri Vinayaga Ayurvibe"
            },
            "reviewRating": {
              "@type": "Rating",
              "ratingValue": "5",
              "bestRating": "5"
            },
            "author": {
              "@type": "Person",
              "name": "Priyanka Iyer"
            },
            "reviewBody": "The personalized treatment plan and herbal medicines completely transformed my digestive health. I'm finally able to enjoy food again without discomfort."
          }
        ]}
      />
      <SmoothScroll />
      <BackToTop />
      <ProgressiveWebApp />
      
      {/* Hero Slider Section */}
      <HeroSlider />

      {/* Stats band */}
      <section className="relative z-10 -mt-12 sm:-mt-16">
        <div className="wide-wrapper">
          <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 glass-card rounded-3xl p-5 sm:p-8 shadow-glow">
            {[
              { value: '100+', label: 'Patients Healed' },
              { value: '50+', label: 'Authentic Therapies' },
              { value: '4.9★', label: '12 Verified Reviews' },
              { value: 'Chennai', label: 'Service Radius' },
            ].map((s) => (
              <StaggerItem key={s.label} className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold text-gradient-gold">{s.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{s.label}</div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* About Section */}
  <section id="about" className="bg-cream bg-mesh section-spacing">
  <div className="wide-wrapper">
          <div className="text-center">
            <Reveal className="flex flex-col items-center mb-10">
              <span className="eyebrow mb-4"><Heart className="h-3.5 w-3.5" /> Our Sacred Mission</span>
              <h2 className="font-display font-bold text-foreground fluid-h2 max-w-3xl">Authentic Ayurveda, rooted in Chennai</h2>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <Reveal direction="right" className="space-y-6 text-left">
                <p className="text-lg leading-relaxed text-muted-foreground">
                  <strong>Sri Vinayaga Ayurvibe</strong> is the best Ayurveda hospital near Sholinganallur, Chennai.
                  Located at Nookampalayam, Perumbakkam (12/597, Main Road, Nethaji Nagar Main Rd), we serve patients within 20km – <Link to="/ayurveda-treatment-sholinganallur-chennai" className="text-primary font-medium hover:underline">Sholinganallur</Link>, <Link to="/ayurveda-clinic-omr-chennai" className="text-primary font-medium hover:underline">OMR</Link>, <Link to="/panchakarma-pallikaranai-chennai" className="text-primary font-medium hover:underline">Pallikaranai</Link>, <Link to="/ayurveda-hospital-perumbakkam-chennai" className="text-primary font-medium hover:underline">Perumbakkam</Link>, Navalur, Kelambakkam, Tambaram, <Link to="/ayurveda-hospital-medavakkam-chennai" className="text-primary font-medium hover:underline">Medavakkam</Link>, <Link to="/ayurveda-clinic-velachery-chennai" className="text-primary font-medium hover:underline">Velachery</Link>, Chromepet, and all nearby areas.
                </p>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  Led by <strong>Dr. Vaitheeshwari BAMS</strong>, our government-certified Ayurveda hospital offers authentic <Link to="/treatments" className="text-primary font-medium hover:underline">Panchakarma, Abhyanga, and Shirodhara</Link> treatments. Explore our <Link to="/about" className="text-primary font-medium hover:underline">about</Link> page, <Link to="/doctors" className="text-primary font-medium hover:underline">doctor</Link>, and <Link to="/faq" className="text-primary font-medium hover:underline">FAQ</Link>.
                </p>
                <Button asChild className="bg-primary hover:bg-primary/90 group">
                  <Link to="/booking">Start your healing journey <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                </Button>
              </Reveal>
              <Reveal direction="left" className="relative">
                <div className="bg-gradient-earth text-white rounded-3xl p-10 shadow-glow relative overflow-hidden">
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gold/20 blur-2xl float-slow" />
                  <Sparkles className="h-14 w-14 text-gold mb-5" />
                  <h3 className="font-display text-2xl font-bold mb-4">A Holistic Approach</h3>
                  <p className="text-white/85 leading-relaxed">
                    We treat not just symptoms, but the whole person—nurturing harmony between
                    physical health, mental clarity, and spiritual well-being.
                  </p>
                </div>
              </Reveal>
            </div>

            <StaggerGroup className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Users, title: 'Expert Practitioners', text: 'Care led by Dr. Vaitheeshwari, B.A.M.S., blending traditional knowledge with modern clinical rigour.' },
                { icon: Leaf, title: 'Natural Remedies', text: 'Only the finest herbs and authentic formulations, sourced with care and prepared the traditional way.' },
                { icon: Star, title: 'Modern Comfort', text: 'Ancient healing delivered in clean, calm, comfortable surroundings designed for your peace of mind.' },
              ].map((f) => (
                <StaggerItem key={f.title}>
                  <Card className="border border-border/60 shadow-soft bg-card/70 card-lift h-full text-left">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                        <f.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{f.text}</p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
  <section id="treatments" className="bg-background section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><Sparkles className="h-3.5 w-3.5" /> Signature Therapies</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2 max-w-3xl">Best Ayurvedic Treatments in Chennai</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Chennai's most authentic Ayurvedic care near Sholinganallur.
              Explore our <Link to="/authentic-panchakarma-treatment-chennai" className="text-primary font-medium hover:underline">Panchakarma</Link>, <Link to="/best-abhyanga-massage-chennai" className="text-primary font-medium hover:underline">Abhyanga</Link>, and <Link to="/shirodhara-therapy-chennai" className="text-primary font-medium hover:underline">Shirodhara</Link> programs — or read the <Link to="/blog" className="text-primary font-medium hover:underline">blog</Link> for wellness tips.
            </p>
          </Reveal>

          <StaggerGroup amount={0.05} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
            {treatments.map((treatment, index) => (
              <StaggerItem key={index} className="h-full">
              <Card className="group border border-border/60 shadow-soft bg-card card-lift overflow-hidden h-full flex flex-col">
                <div className="relative h-48 overflow-hidden">
                  <img
                    loading="lazy"
                    src={treatment.image}
                    alt={treatment.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gradient-gold text-earth border-none font-semibold shadow-sm">
                      {treatment.category}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/30 text-white border-none backdrop-blur-sm">
                      {treatment.duration}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle className="text-xl text-foreground">{treatment.name}</CardTitle>
                    <Badge className="bg-primary/10 text-primary border-none">
                      {treatment.duration}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex flex-col flex-grow">
                  <CardDescription className="text-base leading-relaxed line-clamp-3">
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

                  <div className="flex gap-2 pt-2 mt-auto">
                    <Button asChild className="flex-1 bg-primary hover:bg-primary/90" size="sm">
                      <Link to="/booking">Book Now</Link>
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
              </StaggerItem>
            ))}
          </StaggerGroup>
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
                      {treatments[activeTreatmentIndex].duration} 
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
                        <Link to="/booking" onClick={() => setDetailsOpen(false)}>Book Now</Link>
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
  <section id="body-map" className="bg-cream bg-mesh section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><Stethoscope className="h-3.5 w-3.5" /> Personalised Care</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2">Targeted Healing Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Tap any area on our interactive map to discover the Ayurvedic therapies best suited
              to your body and specific health concerns.
            </p>
          </Reveal>
          <Reveal><InteractiveBodyMap /></Reveal>
        </div>
      </section>

      {/* Treatment Comparison Section */}
  <section id="comparison" className="bg-background section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><CheckCircle className="h-3.5 w-3.5" /> Find Your Fit</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2">Compare Our Treatments</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Not sure where to begin? Compare therapies side by side and find the perfect
              match for your wellness goals.
            </p>
          </Reveal>
          <Reveal><TreatmentComparison /></Reveal>
        </div>
      </section>

      {/* Our Expert Practitioner Section */}
  <section id="doctors" className="bg-cream bg-mesh section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-12 flex flex-col items-center">
            <span className="eyebrow mb-4"><Stethoscope className="h-3.5 w-3.5" /> Meet Your Doctor</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2 max-w-3xl">Dr. Vaitheeshwari, B.A.M.S. — Chennai's trusted Ayurveda doctor</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              A Panchakarma and women's-health specialist serving Perumbakkam, Nookampalayam, OMR, Sholinganallur,
              Pallikaranai, Navalur, Kelambakkam, and Tambaram with authentic, personalised care.
            </p>
          </Reveal>

          <Reveal className="max-w-3xl mx-auto">
            <Card className="border border-border/60 shadow-glow bg-card overflow-hidden">
              <div className="grid sm:grid-cols-[auto,1fr]">
                <div className="relative bg-gradient-earth p-8 flex items-center justify-center">
                  <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-gold/25 blur-2xl float-slow" />
                  <div className="w-44 h-44 rounded-full overflow-hidden ring-4 ring-gold/50 shadow-warm">
                    <img loading="lazy" src={drVaitheeshwari} alt="Dr. Vaitheeshwari" className="w-full h-full object-cover" />
                  </div>
                </div>
                <CardContent className="p-8 flex flex-col justify-center text-left">
                  <h3 className="font-display text-3xl font-bold text-foreground mb-1">Dr. Vaitheeshwari</h3>
                  <p className="text-primary font-semibold mb-1">BAMS (Ayurveda)</p>
                  <p className="text-muted-foreground mb-4">Panchakarma &amp; Women's Health Specialist</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    <Badge variant="outline" className="border-primary/30 text-foreground">3+ Years Experience</Badge>
                    <Badge variant="outline" className="border-primary/30 text-foreground">Govt. Certified</Badge>
                    <Badge variant="outline" className="border-primary/30 text-foreground">English · Tamil · Hindi</Badge>
                  </div>
                  <Button asChild className="bg-primary hover:bg-primary/90 w-fit group">
                    <Link to="/booking">Book Consultation <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
                  </Button>
                </CardContent>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* Testimonials Section */}
  <section id="testimonials" className="bg-gradient-earth text-white section-spacing full-bleed relative overflow-hidden">
  <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-gold/10 blur-3xl float-slow" aria-hidden />
  <div className="wide-wrapper relative">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow !text-gold !bg-white/10 !border-white/20 mb-4"><Quote className="h-3.5 w-3.5" /> Real Stories</span>
            <h2 className="font-display font-bold mb-5 fluid-h2">Healing Stories</h2>
            <p className="text-lg text-white/85 max-w-3xl mx-auto">
              Real transformations from patients who found relief and renewal through authentic Ayurveda.
            </p>
          </Reveal>

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
  <section id="why" className="bg-background section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><Shield className="h-3.5 w-3.5" /> Why Sri Vinayaga</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2">Why Choose Our Ayurveda Hospital</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The perfect blend of ancient wisdom and modern, hygienic facilities — for a healing journey you can trust.
            </p>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal direction="right" className="relative">
              <img
                src={hospitalImg}
                alt="Ayurveda Hospital"
                className="w-full h-64 md:h-80 lg:h-[26rem] object-cover rounded-3xl shadow-glow"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-3xl"></div>
              <div className="absolute bottom-5 left-5 glass rounded-2xl px-4 py-3 text-white">
                <p className="text-2xl font-display font-bold">Reg. 2095</p>
                <p className="text-xs text-white/80">Govt. Certified Hospital</p>
              </div>
            </Reveal>

            <StaggerGroup className="space-y-4">
              {[
                { icon: Award, title: 'Certified Excellence', text: 'Government-certified facility (Reg. 2095) with a qualified B.A.M.S. practitioner.' },
                { icon: Shield, title: 'Safe & Natural', text: 'Only pure, authentic herbs and time-tested therapeutic methods — no shortcuts.' },
                { icon: Timer, title: 'Personalised Care', text: 'Treatment plans tailored to your unique constitution, history, and goals.' },
                { icon: Heart, title: 'Holistic Wellness', text: 'A complete approach addressing physical, mental, and emotional well-being.' },
              ].map((item) => (
                <StaggerItem key={item.title}>
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-card/60 transition-colors card-lift">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-gold rounded-2xl flex items-center justify-center shadow-sm">
                      <item.icon className="h-6 w-6 text-earth" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>

      {/* Find Your Dosha Section */}
  <section id="dosha" className="bg-gradient-healing bg-mesh section-spacing full-bleed">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><Sparkles className="h-3.5 w-3.5" /> Know Yourself</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2">Discover Your Dosha</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Your constitutional type is the first step toward personalised healing.
              Explore the three doshas and find your path to balance.
            </p>
          </Reveal>

          <div className="text-center">
            <div className="max-w-4xl mx-auto">
              <StaggerGroup className="grid md:grid-cols-3 gap-6 mb-12">
                {doshas.map((dosha, index) => (
                  <StaggerItem key={index} className="h-full">
                  <Card className="border border-border/60 shadow-soft glass-card card-lift h-full">
                    <CardHeader className="text-center">
                      <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${dosha.color} flex items-center justify-center shadow-sm`}>
                        <span className="font-display text-3xl font-bold text-earth">{dosha.name[0]}</span>
                      </div>
                      <CardTitle className="text-xl text-foreground">{dosha.name}</CardTitle>
                      <CardDescription className="text-primary font-medium">{dosha.element}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap justify-center gap-1.5 mb-2">
                        {dosha.traits.slice(0, 4).map((trait, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-primary/30">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </StaggerItem>
                ))}
              </StaggerGroup>
              
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
  <section id="blog" className="bg-background section-spacing" aria-labelledby="blog-heading">
  <div className="wide-wrapper">
          <h2 id="blog-heading" className="sr-only">Wellness Blog</h2>
          <WellnessBlog />
        </div>
      </section>

      {/* FAQ Section */}
  <section id="faq" className="bg-cream section-spacing">
  <div className="wide-wrapper">
          <FAQSection />
        </div>
      </section>

      {/* Booking Section with Map */}
  <section id="booking" className="bg-background section-spacing">
  <div className="wide-wrapper">
          <Reveal className="text-center mb-14 flex flex-col items-center">
            <span className="eyebrow mb-4"><Calendar className="h-3.5 w-3.5" /> Get Started</span>
            <h2 className="font-display font-bold text-foreground mb-5 fluid-h2">Book Your Healing Journey</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Begin your transformation today. Schedule a consultation with Dr. Vaitheeshwari
              and discover the perfect treatment plan for your unique constitution.
            </p>
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-12 items-stretch">
            {/* Booking Form */}
            <Reveal direction="right" className="h-full">
            <Card className="border border-border/60 shadow-glow h-full">
              <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-primary mr-2" />
                  Schedule Your Visit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <form className="space-y-6" onSubmit={sendEmail} noValidate>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      aria-invalid={!!formErrors.fullName}
                    />
                    {formErrors.fullName ? <p className="text-sm text-destructive">{formErrors.fullName}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Your age"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        if (formErrors.age) setFormErrors((prev) => ({ ...prev, age: '' }));
                      }}
                      aria-invalid={!!formErrors.age}
                    />
                    {formErrors.age ? <p className="text-sm text-destructive">{formErrors.age}</p> : null}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 81229 39197"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        if (formErrors.mobile) setFormErrors((prev) => ({ ...prev, mobile: '' }));
                      }}
                      aria-invalid={!!formErrors.mobile}
                    />
                    {formErrors.mobile ? <p className="text-sm text-destructive">{formErrors.mobile}</p> : null}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={emailAddr}
                      onChange={(e) => {
                        setEmailAddr(e.target.value);
                        if (formErrors.emailAddr) setFormErrors((prev) => ({ ...prev, emailAddr: '' }));
                      }}
                      aria-invalid={!!formErrors.emailAddr}
                    />
                    {formErrors.emailAddr ? <p className="text-sm text-destructive">{formErrors.emailAddr}</p> : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry">Inquiry Type</Label>
                  <Select
                    value={inquiryType}
                    onValueChange={(value) => {
                      setInquiryType(value);
                      if (formErrors.inquiryType) setFormErrors((prev) => ({ ...prev, inquiryType: '' }));
                    }}
                  >
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
                  {formErrors.inquiryType ? <p className="text-sm text-destructive">{formErrors.inquiryType}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us about your health concerns or questions..."
                    rows={4}
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      if (formErrors.notes) setFormErrors((prev) => ({ ...prev, notes: '' }));
                    }}
                    aria-invalid={!!formErrors.notes}
                  />
                  {formErrors.notes ? <p className="text-sm text-destructive">{formErrors.notes}</p> : null}
                </div>

                <Button type="submit" disabled={isSending} className="w-full bg-primary hover:bg-primary/90 text-lg py-6">
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
                </form>
              </CardContent>
            </Card>
            </Reveal>

            {/* Map Only */}
            <Reveal direction="left" className="h-full">
              <HospitalMap />
            </Reveal>
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
  <footer id="contact" className="bg-earth text-primary-foreground section-spacing">
  <div className="wide-wrapper">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            <div>
        <div className="flex items-center space-x-3 mb-6">
          <Logo className="h-10 w-auto object-contain" withText textClassName="" subtitleText="Ayurveda Wellness" />
        </div>
              <p className="text-primary-foreground/80 leading-relaxed mb-2">
                Dr. Vaitheeshwari BAMS
              </p>
              <p className="text-primary-foreground/80 leading-relaxed mb-6">
                Reg No: 2095
              </p>
              <p className="text-primary-foreground/80 leading-relaxed mb-6">
                Sri Vinayaga Ayurvibe is your destination for authentic Ayurvedic treatments. 
                Located at Nookampalayam, Perumbakkam, we serve patients across Chennai and nearby areas within 20km. 
                Experience Panchakarma, Abhyanga massage, and Shirodhara therapy with Dr. Vaitheeshwari BAMS.
              </p>
              
            </div>

            <div>
              <h3 className="text-xl font-bold mb-6 text-gold">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gold" />
                  <div>
                    <p className="text-primary-foreground/90">12/597, Main Road, Nethaji Nagar Main Rd</p>
                    <p className="text-primary-foreground/90">Nookampalayam, Perumbakkam, Chennai</p>
                    <p className="text-primary-foreground/90">Tamil Nadu 600131</p>
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
                  <span>Every day</span>
                  <span>10:00 AM - 8:00 PM</span>
                </div>
              </div>
              <Separator className="my-6 bg-primary-foreground/20" />
              {/* <p className="text-sm text-primary-foreground/70">
                Government Certified Ayurveda Hospital
              </p> */}
            </div>

          </div>

          <Separator className="bg-primary-foreground/20 mb-8" />
          
          <div className="text-center">
            <p className="text-primary-foreground/70">
              © 2026 Sri Vinayaga Ayurvibe. All rights reserved. • Healing with love, wisdom, and compassion.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
