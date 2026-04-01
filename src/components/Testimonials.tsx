import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ClipboardCheck, ShieldCheck, TimerReset } from 'lucide-react';
import { useGeneralSettings } from '@/lib/generalSettings';

const standards = [
  {
    id: 1,
    title: 'Verified Completion Logs',
    description: 'Each booking records status, assignment, and completion timestamps so service delivery can be audited.',
    icon: ClipboardCheck,
  },
  {
    id: 2,
    title: 'Quality-Control Workflow',
    description: 'Staff tasks and before/after evidence are tracked in-app to maintain consistent execution standards.',
    icon: ShieldCheck,
  },
  {
    id: 3,
    title: 'Live Operational Visibility',
    description: 'Customer, staff, and admin portals stay synchronized with real-time booking and progress updates.',
    icon: TimerReset,
  },
];

export const Testimonials: React.FC = () => {
  const { settings } = useGeneralSettings();
  const coverageAreas = settings.serviceRegion
    .replace(/and close environs/gi, '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

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
            Compliance & Assurance
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-display uppercase tracking-wider"
          >
            Operational <span className="text-teal">Standards</span>
          </motion.h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {standards.map((standard, idx) => (
            <motion.div
              key={standard.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="glass-card p-10 border-white/5 relative group hover:border-teal/30 transition-all duration-500"
            >
              <div className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center mb-8">
                <standard.icon size={22} className="text-teal" />
              </div>

              <h4 className="text-lg font-display uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                {standard.title}
                <CheckCircle2 size={14} className="text-teal" />
              </h4>
              <p className="text-white/72 text-base leading-relaxed">
                {standard.description}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 pt-12 border-t border-white/5 flex flex-wrap justify-center gap-12 opacity-65">
          {coverageAreas.map((area) => (
            <div key={area} className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">{area} Coverage</div>
          ))}
        </div>
      </div>
    </section>
  );
};
