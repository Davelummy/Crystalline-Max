import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface NotFoundPageProps {
  onHome: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onHome }) => {
  return (
    <div className="min-h-screen bg-charcoal px-4 pt-32 text-white">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-teal text-[10px] font-bold uppercase tracking-[0.35em]">404</p>
        <h1 className="mt-6 text-5xl font-display uppercase tracking-wide">Page Not Found</h1>
        <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-white/70">
          The route you requested does not exist in this build. Use the main site navigation to return to the public surface.
        </p>
        <button
          type="button"
          onClick={onHome}
          className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-teal hover:text-teal"
        >
          <ArrowLeft size={14} />
          Back to Home
        </button>
      </div>
    </div>
  );
};
