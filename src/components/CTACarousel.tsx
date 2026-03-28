import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from './SafeImage';
import carAfter from '../assets/images/car-after.jpg';
import homeAfter from '../assets/images/home-after.jpg';
import officeAfter from '../assets/images/office-after.jpg';

interface CTACarouselProps {
  onBook: (serviceId: string) => void;
  onEstimate: () => void;
}

const slides = [
  {
    id: 'car-full',
    label: 'Automotive',
    heading: 'Your Vehicle, Restored to Showroom Standard.',
    sub: 'Full interior & exterior detail · paint decontamination · ceramic coating options',
    cta: 'Book a Detail',
    image: carAfter,
    accent: 'teal' as const,
  },
  {
    id: 'home-standard',
    label: 'Residential',
    heading: 'A Home That Breathes Clean.',
    sub: 'Weekly, fortnightly, or one-off deep cleans · eco products · vetted specialists',
    cta: 'Book Home Cleaning',
    image: homeAfter,
    accent: 'vibrant-blue' as const,
  },
  {
    id: 'commercial',
    label: 'Commercial',
    heading: 'A Workspace That Performs.',
    sub: 'Flexible scheduling · industrial sanitization · tailored commercial quotes',
    cta: 'Request a Quote',
    image: officeAfter,
    accent: 'teal' as const,
  },
];

export const CTACarousel: React.FC<CTACarouselProps> = ({ onBook, onEstimate }) => {
  const [current, setCurrent] = React.useState(0);

  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  React.useEffect(() => {
    const t = setInterval(next, 8000);
    return () => clearInterval(t);
  }, []);

  const slide = slides[current];

  return (
    <section className="py-24 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,245,212,0.05)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs font-bold text-teal tracking-[0.4em] uppercase mb-4">Ready to Book?</p>
          <h2 className="text-4xl md:text-5xl font-display uppercase tracking-wider">
            Choose Your <span className="text-teal">Service</span>
          </h2>
        </div>

        <div className="relative rounded-3xl overflow-hidden border border-white/10 glass-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.5 }}
              className="grid lg:grid-cols-2 min-h-[360px]"
            >
              {/* Text side */}
              <div className="flex flex-col justify-center p-10 md:p-14 gap-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-teal">
                  {slide.label}
                </p>
                <h3 className="text-3xl md:text-4xl font-display uppercase leading-tight text-white">
                  {slide.heading}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-sm">
                  {slide.sub}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={() => onBook(slide.id)}
                    className="btn-primary flex items-center gap-3 group"
                  >
                    {slide.cta}
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={onEstimate} className="btn-secondary">
                    Get Estimate
                  </button>
                </div>
              </div>

              {/* Image side */}
              <div className="relative hidden lg:block">
                <SafeImage
                  src={slide.image}
                  alt={slide.label}
                  containerClassName="absolute inset-0"
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/80 via-charcoal/30 to-transparent" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="absolute bottom-6 left-10 flex items-center gap-4">
            <button
              onClick={prev}
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all group glass-card"
            >
              <ChevronLeft size={16} className="text-white group-hover:text-charcoal transition-colors" />
            </button>
            <div className="flex gap-2">
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={cn(
                    'h-1 rounded-full transition-all',
                    current === idx
                      ? 'w-8 bg-teal shadow-[0_0_8px_rgba(0,245,212,0.5)]'
                      : 'w-2 bg-white/15 hover:bg-white/30',
                  )}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all group glass-card"
            >
              <ChevronRight size={16} className="text-white group-hover:text-charcoal transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
