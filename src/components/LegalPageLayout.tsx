import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({
  title,
  lastUpdated,
  onBack,
  children,
}) => {
  return (
    <section className="min-h-screen bg-charcoal px-4 pb-20 pt-32 text-white">
      <div className="mx-auto max-w-4xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/55 transition-colors hover:text-teal"
        >
          <ArrowLeft size={14} />
          Back to Site
        </button>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-10">
          <h1 className="text-3xl font-display uppercase tracking-wide sm:text-4xl">{title}</h1>
          <p className="mt-4 text-sm uppercase tracking-widest text-white/50">Last updated {lastUpdated}</p>
          <div className="mt-8 space-y-8 text-sm leading-7 text-white/80">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};
