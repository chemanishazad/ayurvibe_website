import React from 'react';
import { useLocation } from 'react-router-dom';
import SEO from './SEO';
import Index from '../pages/Index';

// SEO configurations for different routes
const seoConfigs: Record<string, {
  title: string;
  description: string;
  keywords: string[];
}> = {
  '/best-ayurveda-hospital-chennai': {
    title: "Best Ayurveda Hospital in Chennai | #1 Sri Vinayaga Ayurvibe | Perumbakkam, OMR, Sholinganallur",
    description: "🏆 #1 Best Ayurveda Hospital in Chennai! Sri Vinayaga Ayurvibe offers authentic Panchakarma, Abhyanga, Shirodhara treatments. Serving Perumbakkam, OMR, Sholinganallur, Pallikaranai, Navalur, Kelambakkam, Tambaram. Expert care by Dr. Vaitheeshwari BAMS. Government certified. Book now!",
    keywords: ['Best Ayurveda Hospital Chennai', 'Top Ayurveda Clinic Chennai', 'Premier Ayurveda Center Chennai', 'Best Ayurveda Perumbakkam', 'Best Ayurveda OMR', 'Best Ayurveda Sholinganallur']
  },
  '/top-ayurveda-clinic-chennai': {
    title: "Top Ayurveda Clinic in Chennai | Sri Vinayaga Ayurvibe | Best Ayurvedic Treatment Center",
    description: "Top-rated Ayurveda clinic in Chennai offering comprehensive Panchakarma, Abhyanga, Shirodhara treatments. Expert Ayurvedic doctors, modern facilities, authentic treatments. Serving all Chennai areas.",
    keywords: ['Top Ayurveda Clinic Chennai', 'Best Ayurvedic Treatment Center', 'Premier Ayurveda Clinic', 'Top Ayurveda Perumbakkam', 'Top Ayurveda OMR']
  },
  '/dr-vaitheeshwari-ayurveda-doctor-chennai': {
    title: "Dr. Vaitheeshwari BAMS - Best Ayurveda Doctor in Chennai | Sri Vinayaga Ayurvibe",
    description: "Dr. Vaitheeshwari BAMS - Expert Ayurvedic doctor in Chennai. Specializes in Panchakarma, women's health, chronic diseases. Book consultation at Sri Vinayaga Ayurvibe.",
    keywords: ['Dr. Vaitheeshwari', 'BAMS doctor Chennai', 'Ayurvedic doctor Chennai', 'Best Ayurveda doctor', 'Panchakarma specialist']
  },
  '/government-certified-ayurveda-hospital-chennai': {
    title: "Government Certified Ayurveda Hospital in Chennai | Sri Vinayaga Ayurvibe | Licensed Ayurvedic Center",
    description: "Government certified Ayurveda hospital in Chennai. Licensed, authentic Ayurvedic treatments with qualified BAMS doctors. Panchakarma, Abhyanga, Shirodhara therapies.",
    keywords: ['Government Certified Ayurveda Hospital', 'Licensed Ayurvedic Center', 'Certified Ayurveda Clinic', 'Authentic Ayurveda Treatment']
  },
  '/authentic-panchakarma-treatment-chennai': {
    title: "Authentic Panchakarma Treatment in Chennai | Sri Vinayaga Ayurvibe | 14-Day Detox Program",
    description: "Authentic Panchakarma treatment in Chennai. 14-day comprehensive detox program with qualified Ayurvedic doctors. Traditional cleansing therapies for complete wellness.",
    keywords: ['Authentic Panchakarma Treatment', 'Panchakarma Chennai', '14-Day Detox Program', 'Traditional Panchakarma', 'Ayurvedic Detox Treatment']
  },
  '/best-abhyanga-massage-chennai': {
    title: "Best Abhyanga Massage in Chennai | Sri Vinayaga Ayurvibe | Therapeutic Oil Massage",
    description: "Best Abhyanga massage in Chennai. Therapeutic oil massage for relaxation, stress relief, and healing. Expert Ayurvedic therapists, authentic techniques.",
    keywords: ['Best Abhyanga Massage', 'Therapeutic Oil Massage', 'Abhyanga Chennai', 'Ayurvedic Massage', 'Stress Relief Massage']
  },
  '/shirodhara-therapy-chennai': {
    title: "Shirodhara Therapy in Chennai | Sri Vinayaga Ayurvibe | Stress Relief Treatment",
    description: "Shirodhara therapy in Chennai for stress relief and mental wellness. Warm oil therapy for relaxation, insomnia treatment, and anxiety relief.",
    keywords: ['Shirodhara Therapy', 'Stress Relief Treatment', 'Mental Wellness', 'Insomnia Treatment', 'Anxiety Relief']
  },
  '/ayurvedic-detox-treatment-chennai': {
    title: "Ayurvedic Detox Treatment in Chennai | Sri Vinayaga Ayurvibe | Natural Cleansing Therapy",
    description: "Ayurvedic detox treatment in Chennai. Natural cleansing therapy for body purification, toxin removal, and overall wellness. Expert Ayurvedic guidance.",
    keywords: ['Ayurvedic Detox Treatment', 'Natural Cleansing Therapy', 'Body Purification', 'Toxin Removal', 'Detox Chennai']
  },
  '/holistic-wellness-center-chennai': {
    title: "Holistic Wellness Center in Chennai | Sri Vinayaga Ayurvibe | Complete Health Solutions",
    description: "Holistic wellness center in Chennai offering complete health solutions. Integrative approach combining Ayurveda, nutrition, and lifestyle guidance for optimal health.",
    keywords: ['Holistic Wellness Center', 'Complete Health Solutions', 'Integrative Medicine', 'Wellness Chennai', 'Health Solutions']
  },
  '/traditional-medicine-chennai': {
    title: "Traditional Medicine in Chennai | Sri Vinayaga Ayurvibe | Ancient Healing Wisdom",
    description: "Traditional medicine in Chennai. Ancient healing wisdom of Ayurveda for modern health challenges. Authentic treatments, qualified practitioners.",
    keywords: ['Traditional Medicine', 'Ancient Healing Wisdom', 'Ayurvedic Medicine', 'Traditional Healing', 'Ancient Medicine']
  },
  '/ayurvedic-medicine-chennai': {
    title: "Ayurvedic Medicine in Chennai | Sri Vinayaga Ayurvibe | Herbal Remedies & Treatments",
    description: "Ayurvedic medicine in Chennai. Herbal remedies, natural treatments, and traditional healing methods. Expert consultation and personalized medicine.",
    keywords: ['Ayurvedic Medicine', 'Herbal Remedies', 'Natural Treatments', 'Traditional Healing', 'Herbal Medicine']
  },
  '/alternative-medicine-chennai': {
    title: "Alternative Medicine in Chennai | Sri Vinayaga Ayurvibe | Natural Healing Solutions",
    description: "Alternative medicine in Chennai. Natural healing solutions, complementary therapies, and holistic approaches to health and wellness.",
    keywords: ['Alternative Medicine', 'Natural Healing Solutions', 'Complementary Therapies', 'Holistic Approaches', 'Natural Medicine']
  },
  '/wellness-therapy-chennai': {
    title: "Wellness Therapy in Chennai | Sri Vinayaga Ayurvibe | Comprehensive Health Programs",
    description: "Wellness therapy in Chennai. Comprehensive health programs, lifestyle counseling, and therapeutic treatments for complete well-being.",
    keywords: ['Wellness Therapy', 'Comprehensive Health Programs', 'Lifestyle Counseling', 'Therapeutic Treatments', 'Wellness Programs']
  },
  '/stress-management-chennai': {
    title: "Stress Management in Chennai | Sri Vinayaga Ayurvibe | Anxiety & Stress Relief",
    description: "Stress management in Chennai. Effective anxiety and stress relief through Ayurvedic therapies, meditation, and lifestyle modifications.",
    keywords: ['Stress Management', 'Anxiety Relief', 'Stress Relief', 'Mental Health', 'Stress Therapy']
  },
  '/chronic-disease-management-chennai': {
    title: "Chronic Disease Management in Chennai | Sri Vinayaga Ayurvibe | Long-term Health Solutions",
    description: "Chronic disease management in Chennai. Long-term health solutions through Ayurvedic treatments, lifestyle modifications, and ongoing care.",
    keywords: ['Chronic Disease Management', 'Long-term Health Solutions', 'Disease Management', 'Chronic Care', 'Health Management']
  },
  '/women-health-chennai': {
    title: "Women Health in Chennai | Sri Vinayaga Ayurvibe | Ayurvedic Women's Wellness",
    description: "Women health in Chennai. Ayurvedic women's wellness programs, hormonal balance, reproductive health, and specialized care for women.",
    keywords: ['Women Health', 'Ayurvedic Women Wellness', 'Hormonal Balance', 'Reproductive Health', 'Women Care']
  },
  '/digestive-disorders-chennai': {
    title: "Digestive Disorders Treatment in Chennai | Sri Vinayaga Ayurvibe | Gut Health Solutions",
    description: "Digestive disorders treatment in Chennai. Gut health solutions, digestive wellness, and natural remedies for gastrointestinal issues.",
    keywords: ['Digestive Disorders Treatment', 'Gut Health Solutions', 'Digestive Wellness', 'Gastrointestinal Issues', 'Digestive Health']
  },
  '/skin-health-chennai': {
    title: "Skin Health Treatment in Chennai | Sri Vinayaga Ayurvibe | Natural Skin Care",
    description: "Skin health treatment in Chennai. Natural skin care, Ayurvedic dermatology, and holistic approaches to healthy, glowing skin.",
    keywords: ['Skin Health Treatment', 'Natural Skin Care', 'Ayurvedic Dermatology', 'Skin Care', 'Healthy Skin']
  },
  '/mental-health-chennai': {
    title: "Mental Health Treatment in Chennai | Sri Vinayaga Ayurvibe | Ayurvedic Mental Wellness",
    description: "Mental health treatment in Chennai. Ayurvedic mental wellness, anxiety management, depression support, and emotional healing.",
    keywords: ['Mental Health Treatment', 'Ayurvedic Mental Wellness', 'Anxiety Management', 'Depression Support', 'Emotional Healing']
  },
  '/bams-doctor-chennai': {
    title: "BAMS Doctor in Chennai | Sri Vinayaga Ayurvibe | Qualified Ayurvedic Physician",
    description: "BAMS doctor in Chennai. Qualified Ayurvedic physician with extensive training in traditional medicine, modern diagnostics, and holistic healing.",
    keywords: ['BAMS Doctor', 'Qualified Ayurvedic Physician', 'Ayurvedic Doctor', 'Traditional Medicine', 'Holistic Healing']
  },
  '/ayurveda-hospital-perumbakkam-chennai': {
    title: "Ayurveda Hospital in Perumbakkam, Chennai | Sri Vinayaga Ayurvibe | Local Healthcare",
    description: "Ayurveda hospital in Perumbakkam, Chennai. Local healthcare with authentic Ayurvedic treatments, qualified doctors, and modern facilities.",
    keywords: ['Ayurveda Hospital Perumbakkam', 'Perumbakkam Chennai', 'Local Healthcare', 'Ayurveda Perumbakkam', 'Healthcare Perumbakkam']
  },
  '/ayurveda-clinic-omr-chennai': {
    title: "Ayurveda Clinic in OMR, Chennai | Sri Vinayaga Ayurvibe | OMR Healthcare Services",
    description: "Ayurveda clinic in OMR, Chennai. Healthcare services for OMR area with convenient access to authentic Ayurvedic treatments and expert care.",
    keywords: ['Ayurveda Clinic OMR', 'OMR Chennai', 'OMR Healthcare', 'Ayurveda OMR', 'Healthcare OMR']
  },
  '/ayurveda-treatment-sholinganallur-chennai': {
    title: "Ayurveda Treatment in Sholinganallur, Chennai | Sri Vinayaga Ayurvibe | Local Care",
    description: "Ayurveda treatment in Sholinganallur, Chennai. Local care with authentic treatments, qualified practitioners, and personalized healing programs.",
    keywords: ['Ayurveda Treatment Sholinganallur', 'Sholinganallur Chennai', 'Local Care', 'Ayurveda Sholinganallur', 'Healthcare Sholinganallur']
  },
  '/panchakarma-pallikaranai-chennai': {
    title: "Panchakarma Treatment in Pallikaranai, Chennai | Sri Vinayaga Ayurvibe | Detox Therapy",
    description: "Panchakarma treatment in Pallikaranai, Chennai. Detox therapy with authentic cleansing procedures, expert guidance, and comprehensive wellness programs.",
    keywords: ['Panchakarma Pallikaranai', 'Pallikaranai Chennai', 'Detox Therapy', 'Panchakarma Pallikaranai', 'Wellness Pallikaranai']
  },
  '/abhyanga-massage-navalur-chennai': {
    title: "Abhyanga Massage in Navalur, Chennai | Sri Vinayaga Ayurvibe | Therapeutic Massage",
    description: "Abhyanga massage in Navalur, Chennai. Therapeutic massage for relaxation, healing, and wellness. Expert therapists and authentic techniques.",
    keywords: ['Abhyanga Massage Navalur', 'Navalur Chennai', 'Therapeutic Massage', 'Massage Navalur', 'Wellness Navalur']
  },
  '/shirodhara-therapy-kelambakkam-chennai': {
    title: "Shirodhara Therapy in Kelambakkam, Chennai | Sri Vinayaga Ayurvibe | Stress Relief",
    description: "Shirodhara therapy in Kelambakkam, Chennai. Stress relief treatment with warm oil therapy, expert care, and personalized wellness programs.",
    keywords: ['Shirodhara Therapy Kelambakkam', 'Kelambakkam Chennai', 'Stress Relief', 'Therapy Kelambakkam', 'Wellness Kelambakkam']
  },
  '/ayurveda-doctor-tambaram-chennai': {
    title: "Ayurveda Doctor in Tambaram, Chennai | Sri Vinayaga Ayurvibe | Local Physician",
    description: "Ayurveda doctor in Tambaram, Chennai. Local physician with expertise in traditional medicine, modern diagnostics, and holistic patient care.",
    keywords: ['Ayurveda Doctor Tambaram', 'Tambaram Chennai', 'Local Physician', 'Doctor Tambaram', 'Healthcare Tambaram']
  }
};

const SEORedirect: React.FC = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  // Get SEO config for current path or use default
  const seoConfig = seoConfigs[currentPath] || {
    title: "Sri Vinayaga Ayurvibe — Best Ayurveda Hospital in Chennai",
    description: "Premier Ayurveda hospital in Chennai offering comprehensive Panchakarma, Abhyanga, Shirodhara treatments and holistic wellness care.",
    keywords: ['Ayurveda Hospital Chennai', 'Best Ayurveda Clinic', 'Panchakarma Treatment', 'Holistic Wellness']
  };

  return (
    <>
      <SEO
        title={seoConfig.title}
        description={seoConfig.description}
        canonical={`https://svayurvibe.com${currentPath}`}
        locationKeywords={seoConfig.keywords}
      />
      <Index />
    </>
  );
};

export default SEORedirect;
