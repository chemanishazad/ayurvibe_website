import React, { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { submitAppointmentRequest } from '@/lib/api';
import SectionHeading from '@/components/site/SectionHeading';
import { EASE, Reveal } from '@/components/site/motion';
import { clinic, inquiryTypes } from '@/data/site';

const EMAILJS = {
  serviceId: 'service_0du2i3q',
  templateId: 'template_laoe4hx',
  userId: 'jCbJ4C1pc_xXhy0Fn',
};

const emptyErrors = {
  fullName: '',
  age: '',
  mobile: '',
  emailAddr: '',
  inquiryType: '',
  notes: '',
};

/** Lightweight replacement for the 350 KB Lottie confirmation animation. */
const SuccessMark = () => (
  <svg viewBox="0 0 72 72" className="h-20 w-20" role="img" aria-label="Request sent">
    <motion.circle
      cx="36"
      cy="36"
      r="32"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="3"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0.4 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
    />
    <motion.path
      d="M22 37.5 L32 47 L51 27"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: 0.45, delay: 0.45, ease: EASE }}
    />
  </svg>
);

const BookingSection = () => {
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [mobile, setMobile] = useState('');
  const [emailAddr, setEmailAddr] = useState('');
  const [inquiryType, setInquiryType] = useState<string>('Appointment');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState(emptyErrors);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  const clearError = (field: keyof typeof emptyErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev));

  const validate = () => {
    const next = { ...emptyErrors };
    const name = fullName.trim();
    const ageValue = age.trim();
    const phone = mobile.trim();
    const email = emailAddr.trim();
    const message = notes.trim();

    if (!name) next.fullName = 'Full name is required';
    else if (!/^[a-zA-Z.\s'-]{3,}$/.test(name)) next.fullName = 'Enter a valid full name';

    if (!ageValue) next.age = 'Age is required';
    else {
      const n = Number(ageValue);
      if (!Number.isInteger(n) || n < 1 || n > 120) next.age = 'Enter an age between 1 and 120';
    }

    if (!phone) next.mobile = 'Mobile number is required';
    else {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) next.mobile = 'Enter a valid mobile number';
    }

    if (!email) next.emailAddr = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.emailAddr = 'Enter a valid email address';

    if (!inquiryType.trim()) next.inquiryType = 'Please select an inquiry type';

    if (!message) next.notes = 'Please tell us briefly what you need help with';
    else if (message.length < 10) next.notes = 'A little more detail helps — at least 10 characters';

    setErrors(next);
    return Object.values(next).every((error) => !error);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      toast({ title: 'Please check the form', description: 'Fix the highlighted fields and try again.' });
      return;
    }

    setIsSending(true);
    const payload = {
      name: fullName.trim(),
      age: age.trim() ? Number(age.trim()) : undefined,
      mobile: mobile.trim(),
      email: emailAddr.trim(),
      inquiryType,
      message: notes.trim(),
    };

    // Persist to the clinic backend so the request appears in the admin panel.
    // Non-blocking: a backend hiccup must not stop the confirmation email.
    submitAppointmentRequest(payload).catch((error) => {
      console.error('[booking] failed to save appointment request to backend', error);
    });

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { origin: 'http://localhost', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: EMAILJS.serviceId,
          template_id: EMAILJS.templateId,
          user_id: EMAILJS.userId,
          template_params: {
            name: payload.name,
            age: age.trim(),
            mobile: payload.mobile,
            email: payload.email,
            to_email: payload.email,
            to_name: payload.name,
            from_name: clinic.name,
            reply_to: payload.email,
            inquiry_type: inquiryType,
            message: payload.message,
            time: new Date().toString(),
          },
        }),
      });

      if (!response.ok) throw new Error((await response.text()) || 'Failed to send');

      setFullName('');
      setAge('');
      setMobile('');
      setEmailAddr('');
      setNotes('');
      setInquiryType('Appointment');
      setErrors(emptyErrors);
      setSent(true);
    } catch (error: unknown) {
      toast({
        title: 'Could not send your request',
        description: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section id="booking" aria-labelledby="booking-heading" className="section-spacing bg-secondary/40">
      <div className="shell">
        <SectionHeading
          id="booking-heading"
          eyebrow="Get started"
          icon={CalendarDays}
          title="Book a consultation at"
          highlight="Perumbakkam"
          description="Send a request and we will call you back to confirm a slot. Open every day, 10 AM to 8 PM."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
          {/* Form */}
          <Reveal direction="right">
            <div className="surface p-6 sm:p-8">
              <h3 className="font-display text-xl font-bold text-foreground">Request an appointment</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                We reply to every request. Nothing is charged online.
              </p>

              <form className="mt-6 space-y-5" onSubmit={onSubmit} noValidate>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="booking-name">Full name</Label>
                    <Input
                      id="booking-name"
                      name="name"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        clearError('fullName');
                      }}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'booking-name-error' : undefined}
                    />
                    {errors.fullName && (
                      <p id="booking-name-error" className="text-xs text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking-age">Age</Label>
                    <Input
                      id="booking-age"
                      name="age"
                      type="number"
                      inputMode="numeric"
                      placeholder="e.g. 34"
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        clearError('age');
                      }}
                      aria-invalid={!!errors.age}
                      aria-describedby={errors.age ? 'booking-age-error' : undefined}
                    />
                    {errors.age && (
                      <p id="booking-age-error" className="text-xs text-destructive">{errors.age}</p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="booking-mobile">Mobile</Label>
                    <Input
                      id="booking-mobile"
                      name="tel"
                      type="tel"
                      autoComplete="tel"
                      placeholder={clinic.phoneDisplay}
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        clearError('mobile');
                      }}
                      aria-invalid={!!errors.mobile}
                      aria-describedby={errors.mobile ? 'booking-mobile-error' : undefined}
                    />
                    {errors.mobile && (
                      <p id="booking-mobile-error" className="text-xs text-destructive">{errors.mobile}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="booking-email">Email</Label>
                    <Input
                      id="booking-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={emailAddr}
                      onChange={(e) => {
                        setEmailAddr(e.target.value);
                        clearError('emailAddr');
                      }}
                      aria-invalid={!!errors.emailAddr}
                      aria-describedby={errors.emailAddr ? 'booking-email-error' : undefined}
                    />
                    {errors.emailAddr && (
                      <p id="booking-email-error" className="text-xs text-destructive">{errors.emailAddr}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-inquiry">What is this about?</Label>
                  <Select
                    value={inquiryType}
                    onValueChange={(value) => {
                      setInquiryType(value);
                      clearError('inquiryType');
                    }}
                  >
                    <SelectTrigger id="booking-inquiry">
                      <SelectValue placeholder="Select inquiry type" />
                    </SelectTrigger>
                    <SelectContent>
                      {inquiryTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.inquiryType && <p className="text-xs text-destructive">{errors.inquiryType}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="booking-message">Your message</Label>
                  <Textarea
                    id="booking-message"
                    name="message"
                    rows={4}
                    placeholder="Briefly describe your health concern, how long it has been going on, and any current medication."
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      clearError('notes');
                    }}
                    aria-invalid={!!errors.notes}
                    aria-describedby={errors.notes ? 'booking-message-error' : undefined}
                  />
                  {errors.notes && (
                    <p id="booking-message-error" className="text-xs text-destructive">{errors.notes}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSending}
                  size="lg"
                  className="w-full rounded-full py-6 text-base font-semibold shadow-soft"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    <>
                      <CalendarDays className="mr-2 h-5 w-5" aria-hidden />
                      Send appointment request
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Prefer to talk?{' '}
                  <a href={`tel:${clinic.phone}`} className="font-semibold text-primary hover:underline">
                    Call {clinic.phoneDisplay}
                  </a>
                </p>
              </form>
            </div>
          </Reveal>

          {/* Contact + map */}
          <Reveal direction="left" className="space-y-4">
            <div className="surface p-6">
              <h3 className="font-display text-lg font-bold text-foreground">Visit the hospital</h3>
              <ul className="mt-4 space-y-4 text-sm">
                <li className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <address className="not-italic text-muted-foreground">
                    {clinic.street}
                    <br />
                    {clinic.locality}, {clinic.region} {clinic.postalCode}
                  </address>
                </li>
                <li className="flex gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <span className="text-muted-foreground">{clinic.hours}</span>
                </li>
                <li className="flex gap-3">
                  <Phone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <a href={`tel:${clinic.phone}`} className="text-muted-foreground hover:text-primary">
                    {clinic.phoneDisplay}
                  </a>
                </li>
                <li className="flex gap-3">
                  <Mail className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                  <a href={`mailto:${clinic.email}`} className="text-muted-foreground hover:text-primary">
                    {clinic.email}
                  </a>
                </li>
              </ul>

              <div className="mt-5 grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="rounded-xl border-border font-medium">
                  <a href={clinic.mapsUrl} target="_blank" rel="noreferrer">
                    <Navigation className="mr-2 h-4 w-4 text-primary" aria-hidden />
                    Directions
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-border font-medium">
                  <a href={`https://wa.me/${clinic.whatsapp}`} target="_blank" rel="noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4 text-primary" aria-hidden />
                    WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            <div className="surface overflow-hidden">
              <iframe
                title={`Map showing ${clinic.name} in Perumbakkam, Chennai`}
                src="https://maps.google.com/maps?q=12.87961085860525,80.20520937617553&hl=en&z=17&output=embed"
                className="h-[320px] w-full lg:h-[360px]"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>

      {/* Confirmation */}
      <Dialog open={sent} onOpenChange={setSent}>
        <DialogContent className="max-w-md rounded-2xl text-center">
          <DialogHeader className="items-center">
            <SuccessMark />
            <DialogTitle className="font-display text-2xl font-bold">Request received</DialogTitle>
            <DialogDescription className="text-base">
              Thank you — we have your details. Someone from the clinic will call you shortly to confirm
              your slot.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" aria-hidden />
              A confirmation email is on its way
            </p>
            <Button className="w-full rounded-full font-semibold" onClick={() => setSent(false)}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default BookingSection;
