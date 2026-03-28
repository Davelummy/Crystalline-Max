import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, UserCheck, Sparkles, ShieldCheck } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: CalendarDays,
    title: 'Book Online',
    description: 'Choose your service, pick a date, verify your location, and pay securely — done in under two minutes.',
  },
  {
    number: '02',
    icon: UserCheck,
    title: 'We Assign a Specialist',
    description: 'A vetted, experienced specialist is allocated to your booking. You receive confirmation immediately.',
  },
  {
    number: '03',
    icon: Sparkles,
    title: 'The Work Gets Done',
    description: 'Our team arrives on time, completes the job to crystalline standard, and sends photographic evidence.',
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Guaranteed Satisfaction',
    description: "Not happy? We return within 48 hours at no extra cost. Your satisfaction isn't optional — it's our standard.",
  },
];

export const HowItWorks: React.FC = () => {
  return (
    <section className="py-28 bg-charcoal relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,245,212,0.04)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xs font-bold text-teal tracking-[0.4em] uppercase mb-4"
          >
            The Process
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display uppercase tracking-wider"
          >
            How It <span className="text-teal">Works</span>
          </motion.h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-teal/20 to-transparent pointer-events-none" />

          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.12 }}
                className="glass-card p-8 border-white/5 hover:border-teal/20 transition-all duration-500 group relative"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                    <Icon size={20} className="text-teal" />
                  </div>
                  <span className="text-4xl font-display text-white/8 group-hover:text-white/12 transition-colors leading-none">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-base font-display uppercase tracking-widest text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
