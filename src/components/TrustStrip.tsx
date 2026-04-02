import React from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, ShieldCheck, Zap, MapPin, Award } from 'lucide-react';
import { useGeneralSettings } from '@/lib/generalSettings';

export const TrustStrip: React.FC = () => {
  const { settings } = useGeneralSettings();
  const serviceRegion = settings.serviceRegion.replace(/and close environs/gi, '').replace(/\s+,/g, ',').trim();
  const stats = [
    { icon: ClipboardCheck, label: 'Verified Service Records', value: 'Live status + photo evidence', fill: false },
    { icon: ShieldCheck, label: 'Fully Insured', value: 'Public liability covered', fill: false },
    { icon: Zap, label: 'Same-Week Booking', value: 'Subject to availability', fill: false },
    { icon: MapPin, label: 'Primary Coverage', value: serviceRegion, fill: false },
    { icon: Award, label: 'Satisfaction Guarantee', value: 'Or we return free', fill: false },
  ];

  return (
    <div className="bg-white/[0.02] border-y border-white/5 py-5 overflow-hidden">
      <div className="truststrip-marquee">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="truststrip-track"
        >
          {[...stats, ...stats].map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={`${stat.label}-${idx}`} className="truststrip-item">
                <Icon
                  size={14}
                  className={stat.fill ? 'fill-teal text-teal' : 'text-teal'}
                />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white leading-none">
                    {stat.label}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-white/60 mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
