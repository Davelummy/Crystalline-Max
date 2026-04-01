import React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { Menu, X, LogOut, Users, BarChart3, Settings, FileText } from 'lucide-react';

interface AdminNavbarProps {
  user: FirebaseUser;
  onLogout: () => void;
}

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/staff', label: 'Staff', icon: Users },
  { to: '/admin/quotes', label: 'Quotes', icon: FileText },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
] as const;

export const AdminNavbar: React.FC<AdminNavbarProps> = ({ user, onLogout }) => {
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
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `text-xs font-bold tracking-widest uppercase flex items-center gap-2 transition-colors ${isActive ? 'text-teal' : 'text-white hover:text-teal'}`}
              >
                <item.icon size={14} /> {item.label}
              </NavLink>
            ))}

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">{user.displayName || 'Admin'}</p>
                <p className="text-[10px] text-teal uppercase tracking-widest">System Administrator</p>
              </div>
              <button onClick={onLogout} className="text-white/60 hover:text-red-500 transition-colors">
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
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `text-xs font-bold tracking-widest text-left uppercase ${isActive ? 'text-teal' : 'text-white'}`}
            >
              {item.label}
            </NavLink>
          ))}
          <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
        </div>
      )}
    </nav>
  );
};
