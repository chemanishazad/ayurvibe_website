import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Mail, MessageCircle, Phone } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import SectionHeading from '@/components/site/SectionHeading';
import { Reveal } from '@/components/site/motion';
import { clinic, faqs } from '@/data/site';

const FaqSection = () => (
  <section id="faq" aria-labelledby="faq-heading" className="section-spacing bg-background">
    <div className="shell">
      <SectionHeading
        id="faq-heading"
        eyebrow="Questions"
        icon={HelpCircle}
        title="Everything patients ask"
        highlight="before booking"
        description="If your question is not here, call us — we would rather answer it before you book than after."
      />

      <div className="mt-14 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Reveal>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="surface overflow-hidden border-b px-5 transition-colors data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="py-4 text-left hover:no-underline">
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-foreground">{faq.question}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-5 pl-9 pr-2">
                  <p className="text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>

        <Reveal direction="left" className="space-y-4">
          <div className="surface p-6">
            <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
              <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
              Still unsure?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Tell us the condition you are dealing with and we will tell you honestly whether Ayurveda
              is the right route — and which therapy would apply.
            </p>
            <div className="mt-5 space-y-2">
              <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border font-medium">
                <a href={`tel:${clinic.phone}`}>
                  <Phone className="mr-2 h-4 w-4 text-primary" aria-hidden />
                  {clinic.phoneDisplay}
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border font-medium">
                <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4 text-primary" aria-hidden />
                  Message on WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start rounded-xl border-border font-medium">
                <a href={`mailto:${clinic.email}`}>
                  <Mail className="mr-2 h-4 w-4 text-primary" aria-hidden />
                  {clinic.email}
                </a>
              </Button>
            </div>
            <p className="mt-4 rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
              Phone answered during clinic hours (10 AM – 8 PM, every day). Email replies within 24 hours.
            </p>
          </div>

          <div className="surface bg-gradient-earth p-6 text-white">
            <h3 className="font-display text-lg font-bold">Book a consultation</h3>
            <p className="mt-2 text-sm text-white/80">
              A full assessment with {`Dr. Vaitheeshwari`} — pulse, constitution, history and a written plan.
            </p>
            <Button asChild className="mt-5 w-full rounded-full bg-white font-semibold text-foreground hover:bg-white/90">
              <Link to="/booking">Choose a time</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </div>
  </section>
);

export default FaqSection;
