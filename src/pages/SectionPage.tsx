import { useEffect } from 'react';
import Index from './Index';
import SEO from '@/components/SEO';

interface SectionPageProps {
  sectionId: string;
  title: string;
  description?: string;
  canonical?: string;
}

// Renders the Index (landing) page and smooth-scrolls to the requested section
const SectionPage = ({ sectionId, title, description, canonical }: SectionPageProps) => {
  useEffect(() => {
    const handle = () => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    // Slight delay to allow layout & images to settle
    const t = setTimeout(handle, 120);
    return () => clearTimeout(t);
  }, [sectionId]);

  return (
    <>
      <SEO 
        title={title} 
        description={description} 
        canonical={canonical}
        locationKeywords={['Perumbakkam', 'OMR', 'Sholinganallur', 'Pallikaranai', 'Navalur', 'Kelambakkam', 'Tambaram', 'Chennai']}
      />
      <Index />
    </>
  );
};

export default SectionPage;
