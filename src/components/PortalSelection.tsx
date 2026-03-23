import React from 'react';
import { motion } from 'motion/react';
import { User, Briefcase, ShieldCheck, ArrowRight, Sparkles, Shield, Clock, MapPin, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { SERVICES } from '../constants';

interface PortalSelectionProps {
  onSelect: (portal: 'customer' | 'staff' | 'admin') => void;
  isLoggingIn?: boolean;
  error?: string | null;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({ onSelect, isLoggingIn, error }) => {
  return (
    <div className="min-h-screen bg-charcoal flex flex-col overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center px-4 pt-20">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-teal/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-7xl w-full relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-teal text-[10px] font-bold uppercase tracking-[0.3em] mb-8"
            >
              <Sparkles size={12} /> Manchester's #1 Detailing & Cleaning Service
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl text-white font-display uppercase tracking-wider mb-8 leading-tight"
            >
              Precision in <br />
              <span className="text-teal">Every Detail</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/40 max-w-2xl mx-auto text-lg md:text-xl leading-relaxed mb-12"
            >
              From luxury vehicle detailing to premium home sanitization, we deliver unmatched quality across Greater Manchester.
            </motion.p>
            
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase tracking-widest"
              >
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row justify-center gap-6"
            >
              <button 
                onClick={() => onSelect('customer')}
                disabled={isLoggingIn}
                className="btn-primary px-12 py-6 text-xl flex items-center justify-center gap-4 group disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(0,245,212,0.2)] hover:shadow-[0_0_50px_rgba(0,245,212,0.4)] transition-all"
              >
                {isLoggingIn ? 'SYNCING...' : 'CLIENT PORTAL'} <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
              <button 
                onClick={() => onSelect('staff')}
                disabled={isLoggingIn}
                className="btn-secondary px-12 py-6 text-xl flex items-center justify-center gap-4 group border-white/20 hover:border-teal/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'SYNCING...' : 'STAFF PORTAL'} <Briefcase size={24} />
              </button>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto mt-24">
            {[
              { label: 'Services Completed', value: '12,450+', icon: CheckCircle2 },
              { label: 'Expert Staff', value: '45+', icon: User },
              { label: 'Customer Rating', value: '4.9/5', icon: Star },
              { label: 'Service Areas', value: '12', icon: MapPin },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                className="text-center"
              >
                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <stat.icon size={18} className="text-teal" />
                </div>
                <p className="text-2xl font-display text-white mb-1">{stat.value}</p>
                <p className="text-[9px] text-white/20 uppercase font-bold tracking-widest">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Showcase */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase font-bold">Our Expertise</h2>
            <h3 className="text-4xl md:text-5xl text-white font-display uppercase tracking-wider">Premium Solutions</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {SERVICES.slice(0, 3).map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onSelect('customer')}
                className="glass-card p-10 border-white/5 hover:border-teal/30 transition-all group cursor-pointer"
              >
                <div className="w-16 h-16 bg-teal/10 text-teal rounded-2xl flex items-center justify-center mb-8 border border-teal/20 group-hover:bg-teal group-hover:text-charcoal group-hover:shadow-[0_0_30px_rgba(0,245,212,0.5)] transition-all">
                  <service.icon size={32} />
                </div>
                <h4 className="text-2xl font-display uppercase text-white mb-4 tracking-wider">{service.label}</h4>
                <p className="text-white/40 text-sm mb-8 leading-relaxed">
                  Professional {service.type} services tailored to your specific needs with precision and care.
                </p>
                <div className="flex items-center gap-2 text-teal text-[10px] font-bold uppercase tracking-[0.2em]">
                  Starting at £{service.basePrice}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer with Hidden Admin Link */}
      <footer className="py-12 border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-between items-center gap-8">
          <div className="flex items-center gap-8">
            <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
              © 2026 CRYSTALLINE MAX LTD.
            </p>
            <div className="flex gap-4">
              {['Privacy', 'Terms', 'Cookies'].map(link => (
                <button key={link} className="text-[10px] text-white/10 hover:text-white/40 transition-colors font-bold uppercase tracking-widest">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
