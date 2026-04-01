import React from 'react';
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react';
import { useGeneralSettings } from '@/lib/generalSettings';

interface ContactPageProps {
  onBookNow: () => void;
  onGoToPortal: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBookNow, onGoToPortal }) => {
  const { settings } = useGeneralSettings();
  const addressLines = settings.businessAddress
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <section className="min-h-screen bg-charcoal pt-32 pb-20 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <header className="mb-14 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal">Contact</p>
          <h1 className="mt-4 text-4xl font-display uppercase tracking-wide md:text-5xl">Talk To Crystalline Max Ltd</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/72">
            Book a service, request a commercial quote, or discuss operational requirements across Manchester, Salford, Stockport, and Oxfordshire.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-3">
          <article className="dark-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Mail size={18} className="text-teal" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">Email</p>
            <a href={`mailto:${settings.supportEmail}`} className="mt-2 block text-sm font-bold text-white hover:text-teal transition-colors">
              {settings.supportEmail}
            </a>
          </article>

          <article className="dark-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Phone size={18} className="text-teal" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">Phone</p>
            <a href={`tel:${settings.supportPhone.replace(/\s+/g, '')}`} className="mt-2 block text-sm font-bold text-white hover:text-teal transition-colors">
              {settings.supportPhone}
            </a>
          </article>

          <article className="dark-card p-6">
            <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <MapPin size={18} className="text-teal" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/65">Registered Address</p>
            <div className="mt-2 space-y-1">
              {addressLines.map((line) => (
                <p key={line} className="text-sm text-white/80">{line}</p>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-10 dark-card p-8">
          <p className="text-[10px] font-bold uppercase tracking-widest text-teal">Service Region</p>
          <p className="mt-2 text-base font-bold uppercase tracking-wider text-white">{settings.serviceRegion}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" onClick={onBookNow} className="btn-primary inline-flex items-center gap-2">
              Start Booking
              <ArrowRight size={15} />
            </button>
            <button type="button" onClick={onGoToPortal} className="btn-secondary">
              Customer & Staff Portals
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
