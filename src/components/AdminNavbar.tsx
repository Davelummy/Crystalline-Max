import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Logo } from './Logo';
import { Menu, X, LogOut, Users, BarChart3, Settings } from 'lucide-react';
import type { View } from '../types';

interface AdminNavbarProps {
  onNavigate: (view: View) => void;
  user: FirebaseUser;
  onLogout: () => void;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="glass-nav border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <Logo variant="light" />
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-teal uppercase hidden sm:block">Admin Portal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('admin')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <BarChart3 size={14} /> Dashboard
            </button>
            <button onClick={() => onNavigate('staff-mgmt')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Users size={14} /> Staff
            </button>
            <button onClick={() => onNavigate('settings')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Settings size={14} /> Settings
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">{user.displayName || 'Admin'}</p>
                <p className="text-[8px] text-teal uppercase tracking-widest">System Administrator</p>
              </div>
              <button onClick={onLogout} className="text-white/40 hover:text-red-500 transition-colors">
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
        <div className="md:hidden bg-charcoal border-b border-teal/20 p-4 flex flex-col gap-4">
          <button onClick={() => { onNavigate('admin'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Dashboard</button>
          <button onClick={() => { onNavigate('staff-mgmt'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Staff Management</button>
          <button onClick={() => { onNavigate('settings'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Settings</button>
          <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
        </div>
      )}
    </nav>
  );
};
