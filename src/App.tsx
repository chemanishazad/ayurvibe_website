import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import BlogPost from "./pages/BlogPost";
import SectionPage from "./pages/SectionPage";
import LocationPage from "./pages/LocationPage";
import SEO from "@/components/SEO";

const queryClient = new QueryClient();

// Listens to route changes for SPA page_view tracking
const AnalyticsListener = () => {
  const location = useLocation();
  // fire page_view when location changes
  React.useEffect(() => {
    // Respect availability & user consent (Cookiebot defines window.Cookiebot when loaded)
    const sendPageView = () => {
      // @ts-ignore
      if (window.gtag && (!window.Cookiebot || window.Cookiebot.consent.statistics)) {
        // @ts-ignore
        window.gtag('event', 'page_view', {
          page_path: location.pathname + location.search,
          page_location: window.location.href,
          page_title: document.title
        });
      }
    };
    // Delay slightly to allow dynamic title/SEO component updates
    const timeout = setTimeout(sendPageView, 100);
    return () => clearTimeout(timeout);
  }, [location]);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsListener />
        <Routes>
          {/* Root */}
          <Route 
            path="/" 
            element={
              <>
                <SEO 
                  title="Sri Vinayaga Ayurvibe — Ayurveda Hospital Chennai" 
                  description="Ayurveda hospital in Perumbakkam, Chennai offering Panchakarma, Abhyanga, Shirodhara, detox & holistic wellness treatments." 
                  canonical="https://svayurvibe.com/"
                />
                <Index />
              </>
            } 
          />

          {/* Section deep links (SEO friendly readable paths) */}
          <Route path="/about" element={<SectionPage sectionId="about" title="About | Sri Vinayaga Ayurvibe Chennai" description="About our Ayurveda hospital in Perumbakkam, Chennai – mission, values & qualified Ayurvedic doctors." canonical="https://svayurvibe.com/about" />} />
          <Route path="/treatments" element={<SectionPage sectionId="treatments" title="Treatments | Sri Vinayaga Ayurvibe" description="Ayurvedic treatments in Chennai: Panchakarma, Abhyanga, Shirodhara, detox & rejuvenation therapies." canonical="https://svayurvibe.com/treatments" />} />
          <Route path="/doctors" element={<SectionPage sectionId="doctors" title="Doctor | Sri Vinayaga Ayurvibe" description="Consult qualified Ayurvedic doctor in Perumbakkam, Chennai for personalized wellness plans." canonical="https://svayurvibe.com/doctors" />} />
          <Route path="/testimonials" element={<SectionPage sectionId="testimonials" title="Healing Stories | Sri Vinayaga Ayurvibe" description="Patient success stories & reviews of our Ayurvedic treatments in Chennai." canonical="https://svayurvibe.com/testimonials" />} />
          <Route path="/why-ayurveda-hospital" element={<SectionPage sectionId="why" title="Why Choose Us | Sri Vinayaga Ayurvibe" description="Why choose our Ayurveda hospital in Chennai – safe authentic care, hygiene & personalized treatment." canonical="https://svayurvibe.com/why-ayurveda-hospital" />} />
          <Route path="/dosha" element={<SectionPage sectionId="dosha" title="Dosha Quiz | Sri Vinayaga Ayurvibe" description="Find your Ayurvedic body type (Vata Pitta Kapha) – free dosha quiz & lifestyle tips Chennai." canonical="https://svayurvibe.com/dosha" />} />
          <Route path="/blog" element={<SectionPage sectionId="blog" title="Blog | Sri Vinayaga Ayurvibe" description="Ayurveda blog: detox tips, nutrition, herbal therapies & natural healing guidance Chennai." canonical="https://svayurvibe.com/blog" />} />
          <Route path="/faq" element={<SectionPage sectionId="faq" title="FAQ | Sri Vinayaga Ayurvibe" description="FAQ: Ayurvedic treatment duration, Panchakarma process, pricing & consultation details Chennai." canonical="https://svayurvibe.com/faq" />} />
          <Route path="/booking" element={<SectionPage sectionId="booking" title="Book Appointment | Sri Vinayaga Ayurvibe" description="Book Ayurveda consultation or Panchakarma therapy in Perumbakkam, Chennai – call or schedule online." canonical="https://svayurvibe.com/booking" />} />

          {/* Blog by numeric ID; optional slug for cleaner URLs */}
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/blog/:id/:slug" element={<BlogPost />} />

          {/* Location-specific pages for SEO */}
          <Route path="/ayurveda-hospital-perumbakkam-chennai" element={<LocationPage />} />
          <Route path="/ayurveda-clinic-omr-chennai" element={<LocationPage />} />
          <Route path="/ayurveda-treatment-sholinganallur-chennai" element={<LocationPage />} />
          <Route path="/panchakarma-pallikaranai-chennai" element={<LocationPage />} />
          <Route path="/abhyanga-massage-navalur-chennai" element={<LocationPage />} />
          <Route path="/shirodhara-therapy-kelambakkam-chennai" element={<LocationPage />} />
          <Route path="/ayurveda-doctor-tambaram-chennai" element={<LocationPage />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
