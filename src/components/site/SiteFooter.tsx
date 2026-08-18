import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, Phone } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { StaggerGroup, StaggerItem } from '@/components/site/motion';
import { clinic, doctor, navLinks } from '@/data/site';

const popularTreatments = ['Shirodhara', 'Abhyanga', 'Panchakarma', 'Pizhichil', 'Kati Vasti', 'Elakizhi'];

const SiteFooter = () => (
  <footer id="contact" className="relative overflow-hidden border-t border-white/10 bg-foreground text-background">
    <div className="shell py-14 lg:py-20">
      <StaggerGroup className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
        <StaggerItem className="lg:col-span-1">
          <Logo
            className="h-11 w-auto"
            withText
            textClassName="text-background [&>span:first-child]:text-lg [&>span:first-child]:font-extrabold [&>span:last-child]:text-background/60"
            subtitleText="Ayurveda Hospital"
          />
          <p className="mt-5 text-sm leading-relaxed text-background/70">
            Government-certified Ayurveda hospital at Nookampalayam, Perumbakkam. Classical
            Panchakarma, Abhyanga and Shirodhara, prescribed after a full assessment.
          </p>
          <p className="mt-4 text-sm text-background/70">
            {doctor.name}, {doctor.qualification}
            <br />
            Reg. No. {clinic.regNo}
          </p>
        </StaggerItem>

        <StaggerItem>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-background">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {navLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="text-background/70 transition-colors hover:text-background">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/booking" className="text-background/70 transition-colors hover:text-background">
                Book appointment
              </Link>
            </li>
          </ul>
        </StaggerItem>

        <StaggerItem>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-background">
            Popular therapies
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {popularTreatments.map((name) => (
              <li key={name}>
                <Link to="/treatments" className="text-background/70 transition-colors hover:text-background">
                  {name} in Chennai
                </Link>
              </li>
            ))}
          </ul>
        </StaggerItem>

        <StaggerItem>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-background">Visit us</h3>
          <ul className="mt-4 space-y-3.5 text-sm">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden />
              <address className="not-italic text-background/70">
                {clinic.street}
                <br />
                {clinic.locality}, {clinic.region} {clinic.postalCode}
              </address>
            </li>
            <li className="flex gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden />
              <a href={`tel:${clinic.phone}`} className="text-background/70 hover:text-background">
                {clinic.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden />
              <a href={`mailto:${clinic.email}`} className="break-all text-background/70 hover:text-background">
                {clinic.email}
              </a>
            </li>
            <li className="flex gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-saffron" aria-hidden />
              <span className="text-background/70">{clinic.hours}</span>
            </li>
          </ul>
        </StaggerItem>
      </StaggerGroup>

      <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-background/15 pt-6 text-xs text-background/60 sm:flex-row">
        <p>© {new Date().getFullYear()} {clinic.name}. All rights reserved.</p>
        <p>Serving Perumbakkam, Sholinganallur, OMR, Pallikaranai, Medavakkam, Velachery &amp; Tambaram.</p>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
