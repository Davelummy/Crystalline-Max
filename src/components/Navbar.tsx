import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { Logo } from './Logo';
import { Menu, X, LogIn, LogOut, User, ShieldCheck, Clock } from 'lucide-react';
import type { UserRole, View } from '../types';

interface NavbarProps {
  onNavigate?: (view: View) => void;
  user?: FirebaseUser | null;
  userRole?: UserRole | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, user, userRole, onLogin, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-charcoal/95 backdrop-blur-md border-b border-white/10 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Logo variant="light" />
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate?.('landing')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase">Services</button>
            <button onClick={() => onNavigate?.('estimator')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase">Cost Estimator</button>
            
            {userRole === 'admin' && (
              <button onClick={() => onNavigate?.('admin')} className="text-xs font-bold tracking-widest text-teal hover:text-white transition-colors uppercase flex items-center gap-2">
                <ShieldCheck size={14} /> Admin
              </button>
            )}

            {(userRole === 'employee' || userRole === 'admin') && (
              <button onClick={() => onNavigate?.('checkin')} className="text-xs font-bold tracking-widest text-teal hover:text-white transition-colors uppercase flex items-center gap-2">
                <Clock size={14} /> Staff
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                <div className="text-right">
                  <p className="text-[10px] text-white font-bold uppercase tracking-widest">{user.displayName || 'User'}</p>
                  <p className="text-[8px] text-teal uppercase tracking-widest">{userRole}</p>
                </div>
                <button onClick={onLogout} className="text-white/40 hover:text-red-500 transition-colors">
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="btn-primary text-[10px] py-2 px-6 flex items-center gap-2">
                <LogIn size={14} /> LOGIN
              </button>
            )}
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
          <button onClick={() => { onNavigate?.('landing'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Services</button>
          <button onClick={() => { onNavigate?.('estimator'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Cost Estimator</button>
          
          {userRole === 'admin' && (
            <button onClick={() => { onNavigate?.('admin'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-teal text-left uppercase">Admin Dashboard</button>
          )}

          {(userRole === 'employee' || userRole === 'admin') && (
            <button onClick={() => { onNavigate?.('checkin'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-teal text-left uppercase">Staff Check-in</button>
          )}

          {user ? (
            <button onClick={() => { onLogout?.(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
          ) : (
            <button onClick={() => { onLogin?.(); setIsOpen(false); }} className="btn-primary w-full text-[10px]">LOGIN</button>
          )}
        </div>
      )}
    </nav>
  );
};
