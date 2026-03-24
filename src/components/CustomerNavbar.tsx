import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Logo } from './Logo';
import { Menu, X, LogOut, Calendar, User, History, CreditCard } from 'lucide-react';
import type { View } from '../types';

interface CustomerNavbarProps {
  onNavigate: (view: View) => void;
  user: FirebaseUser;
  onLogout: () => void;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({ onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="glass-nav border-charcoal/5 shadow-sm bg-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <Logo variant="dark" />
            <div className="h-6 w-px bg-charcoal/10 hidden sm:block" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-charcoal uppercase hidden sm:block">Client Portal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('booking')} className="text-xs font-bold tracking-widest text-charcoal hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Calendar size={14} /> New Booking
            </button>
            <button onClick={() => onNavigate('customer')} className="text-xs font-bold tracking-widest text-charcoal hover:text-teal transition-colors uppercase flex items-center gap-2">
              <History size={14} /> My Services
            </button>
            <button onClick={() => onNavigate('billing')} className="text-xs font-bold tracking-widest text-charcoal hover:text-teal transition-colors uppercase flex items-center gap-2">
              <CreditCard size={14} /> Billing
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-charcoal/10">
              <div className="text-right">
                <p className="text-[10px] text-charcoal font-bold uppercase tracking-widest">{user.displayName || 'Client'}</p>
                <p className="text-[8px] text-teal uppercase tracking-widest">Premium Member</p>
              </div>
              <button onClick={onLogout} className="text-charcoal/40 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-charcoal">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-charcoal/5 p-4 flex flex-col gap-4">
          <button onClick={() => { onNavigate('booking'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-charcoal text-left uppercase">New Booking</button>
          <button onClick={() => { onNavigate('customer'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-charcoal text-left uppercase">My Services</button>
          <button onClick={() => { onNavigate('billing'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-charcoal text-left uppercase">Billing</button>
          <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
        </div>
      )}
    </nav>
  );
};
