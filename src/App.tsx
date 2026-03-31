import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdminRoute, { AdminOnlyRoute } from "./components/AdminRoute";
import { AdminErrorBoundary } from "./components/AdminErrorBoundary";
import SEORedirect from "./components/SEORedirect";
import SEO from "@/components/SEO";

const queryClient = new QueryClient();
const NotFound = React.lazy(() => import("./pages/NotFound"));
const BlogPost = React.lazy(() => import("./pages/BlogPost"));
const SectionPage = React.lazy(() => import("./pages/SectionPage"));
const AdminShell = React.lazy(() => import("./pages/admin/AdminShell"));
const DashboardPage = React.lazy(() => import("./pages/admin/DashboardPage"));
const PatientsPage = React.lazy(() => import("./pages/admin/PatientsPage"));
const NewPatientPage = React.lazy(() => import("./pages/admin/NewPatientPage"));
const EditPatientPage = React.lazy(() => import("./pages/admin/EditPatientPage"));
const ConsultationsPage = React.lazy(() => import("./pages/admin/ConsultationsPage"));
const PharmacyRecordsPage = React.lazy(() => import("./pages/admin/PharmacyRecordsPage"));
const PharmacyNewPage = React.lazy(() => import("./pages/admin/PharmacyNewPage"));
const ConsultationPrintPage = React.lazy(() => import("./pages/admin/ConsultationPrintPage"));
const PharmacyPrintPage = React.lazy(() => import("./pages/admin/PharmacyPrintPage"));
const TreatmentPlansPage = React.lazy(() => import("./pages/admin/TreatmentPlansPage"));
const TreatmentPlanNewPage = React.lazy(() => import("./pages/admin/TreatmentPlanNewPage"));
const MedicinesPage = React.lazy(() => import("./pages/admin/MedicinesPage"));
const SuppliersPage = React.lazy(() => import("./pages/admin/SuppliersPage"));
const InventoryPage = React.lazy(() => import("./pages/admin/InventoryPage"));
const ReportsPage = React.lazy(() => import("./pages/admin/ReportsPage"));
const UpcomingFollowUpsPage = React.lazy(() => import("./pages/admin/UpcomingFollowUpsPage"));
const DirectSalesPage = React.lazy(() => import("./pages/admin/DirectSalesPage"));
const DoctorsPage = React.lazy(() => import("./pages/admin/DoctorsPage"));
const ClinicsPage = React.lazy(() => import("./pages/admin/ClinicsPage"));
const UsersAdminPage = React.lazy(() => import("./pages/admin/UsersAdminPage"));
const UomAdminPage = React.lazy(() => import("./pages/admin/UomAdminPage"));

// Listens to route changes for SPA page_view tracking
const AnalyticsListener = () => {
  const location = useLocation();
  // fire page_view when location changes
  React.useEffect(() => {
    // Respect availability & user consent (Cookiebot defines window.Cookiebot when loaded)
    const sendPageView = () => {
      // @ts-expect-error gtag is injected by analytics script at runtime
      if (window.gtag && (!window.Cookiebot || window.Cookiebot.consent.statistics)) {
        // @ts-expect-error gtag is injected by analytics script at runtime
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
        <React.Suspense fallback={null}>
          <Routes>
          {/* Root */}
          <Route 
            path="/" 
            element={
              <>
                <SEO 
                  title="Sri Vinayaga Ayurvibe — Best Ayurveda Hospital Chennai | Perumbakkam, OMR" 
                  description="Ayurveda hospital at Nookampalayam, Perumbakkam. Panchakarma, Abhyanga, Shirodhara. Serving 20km radius. Dr.V.Vaitheeshwari B.A.M.S., Book now." 
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

          {/* Print: no login required, uses localStorage for data */}
          <Route path="/print/consultation/:id" element={<ConsultationPrintPage />} />
          <Route path="/print/pharmacy/:id" element={<PharmacyPrintPage />} />

          {/* Admin: login at /admin, dashboard at /admin/dashboard, etc. */}
          <Route path="/admin">
            <Route index element={<Login />} />
            <Route element={<AdminRoute><AdminErrorBoundary><AdminShell /></AdminErrorBoundary></AdminRoute>}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="patients" element={<PatientsPage />} />
                  <Route path="patients/new" element={<NewPatientPage />} />
                  <Route path="patients/:id/edit" element={<EditPatientPage />} />
              <Route path="doctors" element={<AdminOnlyRoute><DoctorsPage /></AdminOnlyRoute>} />
              <Route path="op" element={<ConsultationsPage />} />
              <Route path="op/new" element={<ConsultationsPage />} />
              <Route path="op/:id" element={<ConsultationsPage />} />
              <Route path="consultations" element={<ConsultationsPage />} />
              <Route path="consultations/new" element={<ConsultationsPage />} />
              <Route path="consultations/:id" element={<ConsultationsPage />} />
              <Route path="pharmacy" element={<PharmacyRecordsPage />} />
              <Route path="pharmacy/new" element={<PharmacyNewPage />} />
              <Route path="treatment-plans" element={<TreatmentPlansPage />} />
              <Route path="treatment-plans/new" element={<TreatmentPlanNewPage />} />
              <Route path="medicines" element={<AdminOnlyRoute><MedicinesPage /></AdminOnlyRoute>} />
              <Route path="suppliers" element={<AdminOnlyRoute><SuppliersPage /></AdminOnlyRoute>} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="direct-sales" element={<AdminOnlyRoute><DirectSalesPage /></AdminOnlyRoute>} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="upcoming-follow-ups" element={<UpcomingFollowUpsPage />} />
              <Route path="clinics" element={<ClinicsPage />} />
              <Route path="users" element={<UsersAdminPage />} />
              <Route path="uom" element={<UomAdminPage />} />
            </Route>
          </Route>

          {/* Blog by numeric ID; optional slug for cleaner URLs */}
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/blog/:id/:slug" element={<BlogPost />} />

          {/* All SEO routes redirect to main page with specific SEO */}
          <Route path="/best-ayurveda-hospital-chennai" element={<SEORedirect />} />
          <Route path="/top-ayurveda-clinic-chennai" element={<SEORedirect />} />
          <Route path="/dr-vaitheeshwari-ayurveda-doctor-chennai" element={<SEORedirect />} />
          <Route path="/government-certified-ayurveda-hospital-chennai" element={<SEORedirect />} />
          <Route path="/authentic-panchakarma-treatment-chennai" element={<SEORedirect />} />
          <Route path="/best-abhyanga-massage-chennai" element={<SEORedirect />} />
          <Route path="/shirodhara-therapy-chennai" element={<SEORedirect />} />
          <Route path="/ayurvedic-detox-treatment-chennai" element={<SEORedirect />} />
          <Route path="/holistic-wellness-center-chennai" element={<SEORedirect />} />
          <Route path="/traditional-medicine-chennai" element={<SEORedirect />} />
          <Route path="/ayurvedic-medicine-chennai" element={<SEORedirect />} />
          <Route path="/alternative-medicine-chennai" element={<SEORedirect />} />
          <Route path="/wellness-therapy-chennai" element={<SEORedirect />} />
          <Route path="/stress-management-chennai" element={<SEORedirect />} />
          <Route path="/chronic-disease-management-chennai" element={<SEORedirect />} />
          <Route path="/women-health-chennai" element={<SEORedirect />} />
          <Route path="/digestive-disorders-chennai" element={<SEORedirect />} />
          <Route path="/skin-health-chennai" element={<SEORedirect />} />
          <Route path="/mental-health-chennai" element={<SEORedirect />} />
          <Route path="/bams-doctor-chennai" element={<SEORedirect />} />
          
          {/* Location-specific pages for SEO */}
          <Route path="/ayurveda-hospital-perumbakkam-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-clinic-omr-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-treatment-sholinganallur-chennai" element={<SEORedirect />} />
          <Route path="/panchakarma-pallikaranai-chennai" element={<SEORedirect />} />
          <Route path="/abhyanga-massage-navalur-chennai" element={<SEORedirect />} />
          <Route path="/shirodhara-therapy-kelambakkam-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-doctor-tambaram-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-hospital-medavakkam-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-clinic-velachery-chennai" element={<SEORedirect />} />
          <Route path="/ayurveda-treatment-chromepet-chennai" element={<SEORedirect />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
