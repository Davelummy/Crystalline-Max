import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Logo } from './Logo';
import { Menu, X, LogOut, Calendar, User, History, CreditCard, FileText } from 'lucide-react';
import type { View } from '../types';

interface CustomerNavbarProps {
  onNavigate: (view: View) => void;
  user: FirebaseUser;
  onLogout: () => void;
}

export const CustomerNavbar: React.FC<CustomerNavbarProps> = ({ onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="glass-nav border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <Logo variant="light" />
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-teal uppercase hidden sm:block">Client Portal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('booking')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Calendar size={14} /> New Booking
            </button>
            <button onClick={() => onNavigate('customer')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <History size={14} /> My Services
            </button>
            <button onClick={() => onNavigate('billing')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <CreditCard size={14} /> Billing
            </button>
            <button onClick={() => onNavigate('quote')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <FileText size={14} /> Request Quote
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">{user.displayName || 'Client'}</p>
                <p className="text-[10px] text-teal uppercase tracking-widest">Premium Member</p>
              </div>
              <button onClick={onLogout} className="text-white/70 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
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
        <div className="md:hidden bg-charcoal border-b border-white/10 p-4 flex flex-col gap-4">
          <button onClick={() => { onNavigate('booking'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">New Booking</button>
          <button onClick={() => { onNavigate('customer'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">My Services</button>
          <button onClick={() => { onNavigate('billing'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Billing</button>
          <button onClick={() => { onNavigate('quote'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Request Quote</button>
          <button onClick={() => { onNavigate('profile'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Edit Profile</button>
          <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
        </div>
      )}
    </nav>
  );
};
