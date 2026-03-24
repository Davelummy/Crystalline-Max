import React from 'react';
import { Logo } from './Logo';
import { Menu, X, User } from 'lucide-react';

interface PublicNavbarProps {
  onNavigate: (view: any) => void;
}

export const PublicNavbar: React.FC<PublicNavbarProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="glass-nav border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Logo variant="light" />
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('landing')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase">Services</button>
            <button onClick={() => onNavigate('estimator')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase">Estimator</button>
            
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
          <button onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Home</button>
          <button onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Services</button>
          <button onClick={() => { onNavigate('estimator'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Estimator</button>
          <button onClick={() => { onNavigate('selection'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Portals</button>
        </div>
      )}
    </nav>
  );
};
