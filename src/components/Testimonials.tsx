import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { SafeImage } from './SafeImage';

const testimonials = [
  {
    id: 1,
    name: "ALEXANDER VANCE",
    role: "Luxury Car Collector",
    content: "The attention to detail is truly surgical. I've used many detailing services in Manchester, but Crystalline Max is the only one that treats my collection with the respect it deserves.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 2,
    name: "SARAH JENKINS",
    role: "Property Manager",
    content: "Reliability is everything in my business. Crystalline Max has never missed a window, and the quality of their residential cleaning is consistently superior. A true partner.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
  },
  {
    id: 3,
    name: "DAVID CHEN",
    role: "Tech Hub Director",
    content: "Our office space needs to be immaculate for high-performance teams. The industrial-grade sanitization provided by Crystalline Max gives our staff total peace of mind.",
    rating: 5,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200"
  }
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-32 bg-charcoal relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-teal/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-full bg-vibrant-blue/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-teal tracking-[0.4em] uppercase mb-4"
          >
            Trust & Assurance
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display uppercase tracking-wider"
          >
            The Crystalline <span className="text-teal">Verdict</span>
          </motion.h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-10 border-white/5 relative group hover:border-teal/30 transition-all duration-500"
            >
              <Quote className="absolute top-8 right-8 text-teal/10 group-hover:text-teal/20 transition-colors" size={48} />
              
              <div className="flex gap-1 mb-8">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={14} className="fill-teal text-teal drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]" />
                ))}
              </div>

              <p className="text-white/60 text-lg leading-relaxed mb-10 italic">
                "{t.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <SafeImage 
                    src={t.avatar} 
                    alt={t.name} 
                    containerClassName="w-full h-full rounded-full"
                    className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    {t.name}
                    <CheckCircle2 size={12} className="text-teal" />
                  </h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-medium">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
          <div className="text-xl font-display uppercase tracking-widest">BMW MANCHESTER</div>
          <div className="text-xl font-display uppercase tracking-widest">SALFORD HUB</div>
          <div className="text-xl font-display uppercase tracking-widest">TRAFFORD CENTRE</div>
          <div className="text-xl font-display uppercase tracking-widest">STOCKPORT PLAZA</div>
        </div>
      </div>
    </section>
  );
};
