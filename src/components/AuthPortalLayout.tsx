import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, Sparkles } from 'lucide-react';

interface AuthPortalLayoutProps {
  badge: string;
  title: string;
  description: string;
  error?: string | null;
  onBack: () => void;
  backLabel?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export const AuthPortalLayout: React.FC<AuthPortalLayoutProps> = ({
  badge,
  title,
  description,
  error,
  onBack,
  backLabel = 'Back',
  children,
  aside,
}) => {
  return (
    <div className="min-h-screen bg-charcoal px-4 pt-28 pb-16">
      <div className="max-w-6xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:text-teal transition-colors mb-8"
        >
          <ArrowLeft size={14} /> {backLabel}
        </button>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="dark-card p-8 md:p-10 border-white/5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-teal mb-8">
              <Sparkles size={12} /> {badge}
            </div>
            <h1 className="text-4xl md:text-5xl text-white font-display uppercase tracking-wider leading-tight mb-6">
              {title}
            </h1>
            <p className="text-white/45 text-sm leading-relaxed max-w-md">
              {description}
            </p>

            {aside && (
              <div className="mt-10 rounded-3xl border border-white/5 bg-white/[0.03] p-6">
                {aside}
              </div>
            )}
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="dark-card p-8 md:p-10 border-white/5"
          >
            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-4 text-xs font-bold uppercase tracking-widest text-red-400">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {children}
          </motion.section>
        </div>
      </div>
    </div>
  );
};
