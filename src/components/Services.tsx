import React from 'react';
import { Car, Home, Building2, CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SafeImage } from './SafeImage';
import carAfter from '../assets/images/car-after.jpg';
import carBefore from '../assets/images/car-before.jpg';
import homeAfter from '../assets/images/home-after.jpg';
import homeBefore from '../assets/images/home-before.jpg';
import officeAfter from '../assets/images/office-after.jpg';
import officeBefore from '../assets/images/office-before.jpg';

const services = [
  {
    id: 'car',
    bookingId: 'car-full',
    title: 'Car Detailing',
    desc: 'Full interior and exterior restoration using premium ceramic coatings.',
    details: [
      'Multi-stage paint correction',
      'Ceramic coating application',
      'Deep interior steam cleaning',
      'Engine bay detailing',
    ],
    icon: Car,
    price: 'From £149',
  },
  {
    id: 'home',
    bookingId: 'home',
    title: 'Home Cleaning',
    desc: 'Deep residential cleaning with crystalline standard sanitization.',
    details: [
      'HEPA-filtered vacuuming',
      'Kitchen & bathroom sanitization',
      'Window & glass polishing',
      'Eco-friendly cleaning agents',
    ],
    icon: Home,
    price: 'From £50',
  },
  {
    id: 'office',
    bookingId: 'office',
    title: 'Office Cleaning',
    desc: 'Commercial workspace maintenance for high-performance teams.',
    details: [
      'Workspace & tech sanitization',
      'Communal area maintenance',
      'Waste management solutions',
      'Flexible scheduling',
    ],
    icon: Building2,
    price: 'Custom Quote',
    requiresQuote: true,
  },
];

interface ServicesProps {
  onBook?: (serviceId: string) => void;
  onRequestQuote?: (serviceId: string) => void;
  onEstimate?: () => void;
  onContact?: () => void;
}

const comparisons = [
  {
    id: 'home',
    title: 'Residential Excellence',
    description: 'Deep sanitization and restoration for high-end living spaces. We remove years of grime to reveal the luxury beneath.',
    before: homeBefore,
    after: homeAfter,
  },
  {
    id: 'car',
    title: 'Automotive Precision',
    description: 'Multi-stage correction and ceramic protection for luxury vehicles. Restoring that showroom shine to perfection.',
    before: carBefore,
    after: carAfter,
  },
  {
    id: 'office',
    title: 'Corporate Optimization',
    description: 'Revitalizing workspaces for peak performance. A clean office is a productive office.',
    before: officeBefore,
    after: officeAfter,
  },
];

export const Services: React.FC<ServicesProps> = ({ onBook, onRequestQuote, onEstimate, onContact }) => {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [activeComparison, setActiveComparison] = React.useState(0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  React.useEffect(() => {
    const timer = setInterval(() => {
      setActiveComparison((prev) => (prev + 1) % comparisons.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="services" className="py-24 bg-charcoal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-teal text-sm tracking-[0.3em] mb-4">OUR EXPERTISE</h2>
          <h3 className="text-4xl md:text-5xl font-display uppercase tracking-wider">Engineered Cleanliness</h3>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/72 md:text-base">
            Vehicle detailing, residential cleaning, and office upkeep delivered with the same precise, presentation-first standard.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {services.map((service, idx) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="dark-card p-8 hover:border-teal/50 transition-all group flex flex-col h-full"
            >
              <div className="w-12 h-12 bg-teal/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-teal group-hover:text-charcoal transition-colors">
                <service.icon size={24} />
              </div>
              <h4 className="text-xl mb-4 font-display uppercase tracking-wider">{service.title}</h4>
              <p className="text-white/72 text-sm mb-6 leading-relaxed flex-grow">
                {service.desc}
              </p>

              <AnimatePresence>
                {expandedId === service.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden mb-6"
                  >
                    <ul className="space-y-2 pt-4 border-t border-white/5">
                      {service.details.map((detail, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs text-white/68 uppercase tracking-widest">
                          <div className="w-1 h-1 bg-teal rounded-full" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col gap-4 pt-6 border-t border-white/10 mt-auto">
                <div className="flex justify-between items-center">
                  <span className="text-teal font-bold tracking-wider">{service.price}</span>
                  <button
                    onClick={() => toggleExpand(service.id)}
                    className="flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase text-white/68 hover:text-teal transition-colors"
                  >
                    {expandedId === service.id ? 'Close' : 'Details'}
                    {expandedId === service.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => (service.requiresQuote ? onRequestQuote?.(service.bookingId) : onBook?.(service.bookingId))}
                  className="btn-primary w-full py-3 text-[10px] flex items-center justify-center gap-2"
                >
                  {service.requiresQuote ? 'REQUEST QUOTE' : 'BOOK NOW'} <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-32 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeComparison}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h3 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase font-bold">The Crystalline Standard</h3>
                <h4 className="text-4xl font-display uppercase mb-6 tracking-wider">{comparisons[activeComparison].title}</h4>
                <p className="text-white/72 mb-8 leading-relaxed">
                  {comparisons[activeComparison].description}
                </p>
                <div className="flex gap-4 mb-12">
                  {comparisons.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveComparison(idx)}
                      className={`w-12 h-1 rounded-full transition-all ${activeComparison === idx ? 'bg-teal' : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <ul className="space-y-4">
                  {['Surgical Precision', 'Premium Restoration', 'Crystalline Sanitization', 'Detailing Excellence'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm font-medium uppercase tracking-widest text-white/85">
                      <CheckCircle2 size={18} className="text-teal" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4 relative">
                <div className="space-y-4">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative group">
                    <SafeImage
                      src={comparisons[activeComparison].before}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover grayscale brightness-50 group-hover:grayscale-0 transition-all duration-700"
                    />
                    <div className="absolute top-6 left-6 bg-charcoal/90 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/72">
                      Before
                    </div>
                  </div>
                </div>
                <div className="space-y-4 pt-12">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-teal/30 relative shadow-[0_0_50px_rgba(0,245,212,0.1)]">
                    <SafeImage
                      src={comparisons[activeComparison].after}
                      containerClassName="w-full h-full"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-6 left-6 bg-teal px-3 py-1 text-[10px] text-charcoal font-bold uppercase tracking-[0.2em] shadow-lg">
                      After
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 dark-card p-8 md:p-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal mb-2">Need A Precise Quote?</p>
            <p className="text-sm text-white/72 max-w-xl">
              Use the estimator for instant baseline pricing, then contact us for commercial scope, recurring plans, and specialist requirements.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={onEstimate} className="btn-secondary">
              Open Estimator
            </button>
            <button type="button" onClick={onContact} className="btn-primary">
              Contact Team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
