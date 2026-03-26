import React from 'react';
import { motion } from 'motion/react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { SafeImage } from './SafeImage';
import alexanderAvatar from '../assets/images/testimonial-alexander.jpg';
import sarahAvatar from '../assets/images/testimonial-sarah.jpg';
import davidAvatar from '../assets/images/testimonial-david.jpg';

const testimonials = [
  {
    id: 1,
    name: 'ALEXANDER VANCE',
    role: 'Luxury Car Collector',
    content: "The attention to detail is truly surgical. I've used many detailing services in Manchester, but Crystalline Max is the only one that treats my collection with the respect it deserves.",
    rating: 5,
    avatar: alexanderAvatar,
  },
  {
    id: 2,
    name: 'SARAH JENKINS',
    role: 'Property Manager',
    content: 'Reliability is everything in my business. Crystalline Max has never missed a window, and the quality of their residential cleaning is consistently superior. A true partner.',
    rating: 5,
    avatar: sarahAvatar,
  },
  {
    id: 3,
    name: 'DAVID CHEN',
    role: 'Tech Hub Director',
    content: 'Our office space needs to be immaculate for high-performance teams. The industrial-grade sanitization provided by Crystalline Max gives our staff total peace of mind.',
    rating: 5,
    avatar: davidAvatar,
  },
];

export const Testimonials: React.FC = () => {
  return (
    <section className="py-32 bg-charcoal relative overflow-hidden">
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
          {testimonials.map((testimonial, idx) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-10 border-white/5 relative group hover:border-teal/30 transition-all duration-500"
            >
              <Quote className="absolute top-8 right-8 text-teal opacity-10 transition-opacity group-hover:opacity-20" size={48} />

              <div className="flex gap-1 mb-8">
                {[...Array(testimonial.rating)].map((_, index) => (
                  <Star key={index} size={14} className="fill-teal text-teal drop-shadow-[0_0_8px_rgba(0,245,212,0.4)]" />
                ))}
              </div>

              <p className="text-white/72 text-lg leading-relaxed mb-10 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <SafeImage
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    containerClassName="w-full h-full rounded-full"
                    className="w-full h-full object-cover rounded-full grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-2">
                    {testimonial.name}
                    <CheckCircle2 size={12} className="text-teal" />
                  </h4>
                  <p className="text-[10px] text-white/68 uppercase tracking-widest font-medium">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-55 grayscale contrast-125">
          <div className="text-xl font-display uppercase tracking-widest">BMW MANCHESTER</div>
          <div className="text-xl font-display uppercase tracking-widest">SALFORD HUB</div>
          <div className="text-xl font-display uppercase tracking-widest">TRAFFORD CENTRE</div>
          <div className="text-xl font-display uppercase tracking-widest">STOCKPORT PLAZA</div>
        </div>
      </div>
    </section>
  );
};
