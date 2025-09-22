import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Phone, Mail } from 'lucide-react';

const FAQSection = () => {
  const faqs = [
    {
      id: 'what-is-ayurveda',
      question: 'What is Ayurveda and how can it help me?',
      answer: 'Ayurveda is a 5,000-year-old holistic healing system from India that focuses on balancing mind, body, and spirit. It treats the root cause of illness rather than just symptoms, using natural herbs, lifestyle modifications, and therapeutic treatments to restore optimal health and prevent disease.'
    },
    {
      id: 'first-consultation',
      question: 'What should I expect during my first consultation?',
      answer: 'Your first consultation will include a comprehensive health assessment where our doctor will examine your pulse, tongue, and overall constitution. We\'ll discuss your medical history, lifestyle, diet, and current health concerns. Based on this evaluation, we\'ll create a personalized treatment plan that may include therapies, herbal medicines, and lifestyle recommendations.'
    },
    {
      id: 'dosha-determination',
      question: 'How do you determine my dosha type?',
      answer: 'We determine your dosha through a detailed consultation that includes physical examination, pulse diagnosis, observation of your physical characteristics, and assessment of your mental and emotional tendencies. We also consider your digestive patterns, sleep habits, and responses to different environments and seasons.'
    },
    {
      id: 'treatment-duration',
      question: 'How long do treatments typically take to show results?',
      answer: 'Results vary depending on your condition and constitution. Acute conditions may improve within days to weeks, while chronic conditions typically require 3-6 months for significant improvement. Panchakarma detox programs show immediate benefits, with deeper healing continuing for months afterward. We focus on sustainable, long-term wellness rather than quick fixes.'
    },
    {
      id: 'safety-side-effects',
      question: 'Are Ayurvedic treatments safe? Are there any side effects?',
      answer: 'Ayurvedic treatments are generally very safe when administered by qualified practitioners. We use only high-quality, tested herbs and follow strict safety protocols. Mild detox symptoms like temporary fatigue or changes in elimination are normal during cleansing. We monitor all patients closely and adjust treatments as needed.'
    },
    {
      id: 'modern-medicine',
      question: 'Can I continue my current medications while receiving Ayurvedic treatment?',
      answer: 'Yes, Ayurveda can complement conventional medicine. We work with your existing healthcare providers and never recommend stopping prescribed medications without your doctor\'s approval. Many of our patients successfully integrate both approaches for optimal health outcomes.'
    },
    {
      id: 'panchakarma-process',
      question: 'What is Panchakarma and who should consider it?',
      answer: 'Panchakarma is a comprehensive detoxification and rejuvenation program involving five purification procedures. It\'s beneficial for chronic conditions, stress-related disorders, digestive issues, and overall health maintenance. The program is customized based on your constitution and health needs, typically lasting 7-21 days.'
    },
    {
      id: 'dietary-restrictions',
      question: 'Will I need to follow a special diet?',
      answer: 'We provide personalized dietary guidelines based on your dosha and health condition. These aren\'t strict restrictions but recommendations to optimize your digestion and support healing. We help you make gradual, sustainable changes that fit your lifestyle while supporting your health goals.'
    },
    {
      id: 'insurance-coverage',
      question: 'Do you accept insurance? What are the payment options?',
      answer: 'We accept most major insurance plans, though coverage varies by provider and treatment type. We also offer flexible payment plans and package deals for longer treatments. Our billing team can verify your coverage and discuss payment options during your consultation.'
    },
    {
      id: 'appointment-preparation',
      question: 'How should I prepare for my appointment?',
      answer: 'Come well-rested and avoid heavy meals 2 hours before your visit. Bring a list of current medications, supplements, and any recent medical reports. Wear comfortable, loose-fitting clothes, especially for treatments. For morning appointments, it\'s best to have a light breakfast only.'
    },
    {
      id: 'children-elderly',
      question: 'Is Ayurveda suitable for children and elderly patients?',
      answer: 'Absolutely! Ayurveda is gentle and can be adapted for all ages. We have special protocols for children and elderly patients, using milder treatments and age-appropriate herbs. Many families choose Ayurveda for its natural approach to supporting health at every life stage.'
    },
    {
      id: 'emergency-care',
      question: 'Do you provide emergency or urgent care services?',
      answer: 'While we focus on preventive and chronic care, we do offer urgent consultations for existing patients experiencing health crises. For medical emergencies, please call emergency services first. We provide 24/7 phone support for our patients and can advise on immediate care while arranging follow-up treatment.'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Find answers to common questions about Ayurvedic treatments, our services, 
          and what to expect during your healing journey with us.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* FAQ Accordion */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-soft">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.id} value={faq.id} className="border border-border/50 rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline py-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <span className="font-medium text-foreground">{faq.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pl-9">
                      <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact Support */}
        <div className="space-y-6">
          <Card className="border-none shadow-soft bg-gradient-subtle">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 text-primary mr-2" />
                Still Have Questions?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Our team is here to help! Contact us directly for personalized answers to your health questions.
              </p>
              
              <div className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <a href="tel:8122939197">
                    <Phone className="h-4 w-4 mr-2" />
                    Call: 8122939197
                  </a>
                </Button>
                
                <Button asChild className="w-full justify-start" variant="outline">
                  <a href="mailto:sv.ayurvibe@gmail.com">
                    <Mail className="h-4 w-4 mr-2" />
                    sv.ayurvibe@gmail.com
                  </a>
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                <p className="font-medium mb-1">Response Times:</p>
                <p>• Phone: Immediate during business hours</p>
                <p>• Email: Within 24 hours</p>
                <p>• Emergency: 24/7 hotline available</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft bg-gradient-gold text-earth">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-bold mb-2">Schedule a Consultation</h3>
              <p className="mb-4 opacity-90 text-sm">
                Get personalized answers and create your wellness plan
              </p>
              <Button asChild className="bg-earth text-gold hover:bg-earth/90">
                <a href="#booking">Book Now</a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Quick Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-sm">
                → New Patient Guide
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                → Treatment Price List
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                → Insurance Information
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                → Preparation Guidelines
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;