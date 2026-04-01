import React from 'react';
import { Logo } from './Logo';
import { Menu, X, User } from 'lucide-react';
import type { View } from '../types';
import { useLocation } from 'react-router-dom';

interface PublicNavbarProps {
  onNavigate: (view: View) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navItems: Array<{ label: string; view: View; match: (pathname: string) => boolean }> = [
    { label: 'Home', view: 'landing', match: (pathname) => pathname === '/' },
    { label: 'Services', view: 'services', match: (pathname) => pathname === '/services' },
    { label: 'Quotes', view: 'quote', match: (pathname) => pathname === '/quote' || pathname.startsWith('/quote/') },
    { label: 'Estimator', view: 'estimator', match: (pathname) => pathname === '/estimate' },
    { label: 'Contact', view: 'contact', match: (pathname) => pathname === '/contact' },
  ];

  return (
    <nav className="glass-nav border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Logo variant="light" />
          
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = item.match(location.pathname);
              return (
                <button
                  key={item.label}
                  onClick={() => onNavigate(item.view)}
                  className={`text-xs font-bold tracking-widest transition-colors uppercase ${isActive ? 'text-teal' : 'text-white hover:text-teal'}`}
                >
                  {item.label}
                </button>
              );
            })}

            <div className="h-6 w-px bg-white/10 mx-2" />

            <button 
              onClick={() => onNavigate('selection')} 
              className="text-[10px] font-bold tracking-widest text-white/80 hover:text-teal transition-all uppercase flex items-center gap-2 px-4 py-2 border border-white/10 rounded-full hover:border-teal/50 glass-card"
            >
              <User size={12} className="text-teal" />
              Portals
            </button>

            <button onClick={() => onNavigate('booking')} className="btn-primary text-[10px] py-2 px-6 flex items-center gap-2">
              BOOK NOW
            </button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-charcoal/98 backdrop-blur-xl border-b border-white/10 p-4 flex flex-col gap-4">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.view); setIsOpen(false); }}
              className={`text-xs font-bold tracking-widest text-left uppercase ${item.match(location.pathname) ? 'text-teal' : 'text-white'}`}
            >
              {item.label}
            </button>
          ))}
          <button onClick={() => { onNavigate('selection'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Portals</button>
          <button onClick={() => { onNavigate('booking'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Book Now</button>
        </div>
      )}
    </nav>
  );
};
