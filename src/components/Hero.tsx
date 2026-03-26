import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Shield, Clock, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SafeImage } from './SafeImage';
import carAfter from '../assets/images/car-after.jpg';
import carBefore from '../assets/images/car-before.jpg';
import homeAfter from '../assets/images/home-after.jpg';
import homeBefore from '../assets/images/home-before.jpg';
import officeAfter from '../assets/images/office-after.jpg';
import officeBefore from '../assets/images/office-before.jpg';
import { useGeneralSettings } from '@/lib/generalSettings';

const slides = [
  {
    id: 1,
    title: 'Automotive Excellence.',
    subtitle: 'Restored.',
    description: "From mud-caked to showroom-ready. Our surgical detailing process removes every imperfection, restoring your vehicle's soul with precision.",
    image: carAfter,
    beforeImage: carBefore,
    tag: 'Transformation',
    tagValue: 'Dirty to Dazzling',
    location: 'Manchester City Centre',
  },
  {
    id: 2,
    title: 'Elite Home Cleaning.',
    subtitle: 'Refined.',
    description: 'Professional residential cleaning with crystalline standard sanitization. Impeccable standards for your living space, leaving it pure and pristine.',
    image: homeAfter,
    beforeImage: homeBefore,
    tag: 'Sanitization',
    tagValue: 'Crystalline Standard',
    location: 'Salford & Stockport',
  },
  {
    id: 3,
    title: 'Commercial Workspace.',
    subtitle: 'Optimized.',
    description: 'Deep office sanitization and maintenance for high-performance teams. Flexible scheduling to suit your business needs.',
    image: officeAfter,
    beforeImage: officeBefore,
    tag: 'Business Solutions',
    tagValue: 'Custom Quotes',
    location: 'Manchester Hub',
  },
];

interface HeroProps {
  onBookNow: () => void;
  onViewServices: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onBookNow, onViewServices }) => {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const { settings } = useGeneralSettings();

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  React.useEffect(() => {
    const timer = setInterval(nextSlide, 12000);
    return () => clearInterval(timer);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section className="relative pt-28 pb-20 overflow-hidden min-h-[760px] flex items-center md:pt-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl mb-6 leading-tight text-white">
                {slide.title}<br />
                <span className="text-teal drop-shadow-[0_0_15px_rgba(0,245,212,0.3)]">{slide.subtitle}</span>
              </h1>
              <p className="text-lg text-white/72 mb-10 max-w-lg leading-relaxed">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <button onClick={onBookNow} className="btn-primary flex items-center gap-3 group">
                  BOOK NOW <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <button onClick={onViewServices} className="btn-secondary">VIEW SERVICES</button>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-6 text-[10px] font-bold text-white/68 uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-teal" /> 5-STAR RATED
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-teal" /> 24/7 BOOKING
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-teal" /> {settings.serviceRegion.toUpperCase()}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.8 }}
                className="relative"
              >
                <div className="aspect-square rounded-3xl overflow-hidden glass-card p-2 border-white/10 group relative">
                  <SafeImage
                    src={slide.image}
                    alt={slide.title}
                    containerClassName="w-full h-full rounded-2xl"
                    className="w-full h-full object-cover opacity-90 transition-opacity duration-500 group-hover:opacity-0"
                  />
                  <SafeImage
                    src={slide.beforeImage}
                    alt={`${slide.title} Before`}
                    containerClassName="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] rounded-2xl"
                    className="w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 grayscale brightness-50"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-60" />

                  <div className="absolute top-8 right-8 bg-teal/20 backdrop-blur-md border border-teal/30 px-3 py-1 rounded-full text-[8px] font-bold text-teal uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Before View
                  </div>
                  <div className="absolute top-8 right-8 bg-white/5 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[8px] font-bold text-white/68 uppercase tracking-widest group-hover:opacity-0 transition-opacity">
                    After View
                  </div>

                  <div className="absolute bottom-8 left-8 right-8 glass-card p-6 md:p-8 border-white/20 text-white backdrop-blur-3xl shadow-2xl">
                    <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
                      <div>
                        <p className="text-teal text-[10px] font-bold tracking-[0.3em] mb-2 uppercase">{slide.tag}</p>
                        <p className="text-3xl font-display uppercase tracking-wider">{slide.tagValue}</p>
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-white/68 text-[10px] mb-2 uppercase tracking-widest font-bold">Location</p>
                        <p className="text-xs font-bold uppercase tracking-widest text-teal">{slide.location}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute -bottom-16 left-0 flex items-center gap-6">
              <button onClick={prevSlide} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all group glass-card">
                <ChevronLeft size={20} className="text-white group-hover:text-charcoal transition-colors" />
              </button>
              <div className="flex gap-3">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={cn(
                      'h-1.5 rounded-full transition-all',
                      currentSlide === idx ? 'w-10 bg-teal shadow-[0_0_10px_rgba(0,245,212,0.5)]' : 'w-2 bg-white/10 hover:bg-white/30',
                    )}
                  />
                ))}
              </div>
              <button onClick={nextSlide} className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-teal hover:border-teal transition-all group glass-card">
                <ChevronRight size={20} className="text-white group-hover:text-charcoal transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
