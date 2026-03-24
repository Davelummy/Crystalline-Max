import React from 'react';
import { Logo } from './Logo';
import { cn } from '@/lib/utils';

export const BrandBoard: React.FC = () => {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <header className="mb-20">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Brand Identity System</h2>
          <h3 className="text-5xl mb-2">CRYSTALLINE MAX LTD</h3>
          <p className="text-charcoal/40 uppercase tracking-widest text-sm font-bold">Manchester, UK • Est. 2026</p>
        </header>

        <div className="grid md:grid-cols-2 gap-20">
          {/* Colors */}
          <section>
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-8 border-b border-charcoal/5 pb-4">Color Palette</h4>
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: 'Deep Charcoal', hex: '#0F1115', text: 'text-white' },
                { name: 'Crystal Teal', hex: '#1FC8B3', text: 'text-charcoal' },
                { name: 'Soft Silver', hex: '#C9CED6', text: 'text-charcoal' },
                { name: 'Pure White', hex: '#FFFFFF', text: 'text-charcoal', border: 'border border-charcoal/10' },
              ].map(color => (
                <div key={color.name} className="space-y-2">
                  <div className={cn("h-24 rounded-lg flex items-end p-3", color.text, color.border)} style={{ backgroundColor: color.hex }}>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{color.hex}</span>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest">{color.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Typography */}
          <section>
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-8 border-b border-charcoal/5 pb-4">Typography</h4>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] text-charcoal/40 uppercase font-bold mb-2">Headings / Montserrat Bold</p>
                <p className="text-4xl font-display uppercase leading-tight">Precision. Efficiency. Excellence.</p>
              </div>
              <div>
                <p className="text-[10px] text-charcoal/40 uppercase font-bold mb-2">Body / Inter</p>
                <p className="text-sm leading-relaxed text-charcoal/60">
                  The Crystalline Max experience is built on a foundation of technical mastery and premium service delivery. Every interaction is designed to be seamless, efficient, and precise.
                </p>
              </div>
            </div>
          </section>

          {/* Logo System */}
          <section className="md:col-span-2">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 mb-8 border-b border-charcoal/5 pb-4">Logo System</h4>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="glass-card p-12 flex flex-col items-center justify-center gap-8">
                <Logo variant="dark" />
                <p className="text-[10px] text-charcoal/40 uppercase font-bold">Primary Dark</p>
              </div>
              <div className="dark-card p-12 flex flex-col items-center justify-center gap-8">
                <Logo variant="light" />
                <p className="text-[10px] text-white/40 uppercase font-bold">Primary Light</p>
              </div>
              <div className="glass-card p-12 flex flex-col items-center justify-center gap-8">
                <Logo variant="dark" showText={false} className="scale-150" />
                <p className="text-[10px] text-charcoal/40 uppercase font-bold">Icon Only</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
