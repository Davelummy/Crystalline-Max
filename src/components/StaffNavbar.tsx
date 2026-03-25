import React from 'react';
import { Logo } from './Logo';
import { Menu, X, LogOut, Clock, Calendar, ClipboardList, Bell } from 'lucide-react';
import { hasStaffAcknowledged } from '@/lib/bookings';
import { subscribeToAssignedBookings } from '@/lib/assignedBookings';
import type { View } from '../types';

interface StaffNavbarProps {
  onNavigate: (view: View) => void;
  user: { uid: string; displayName?: string | null };
  onLogout: () => void;
}

export const StaffNavbar: React.FC<StaffNavbarProps> = ({ onNavigate, user, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const unsubscribe = subscribeToAssignedBookings(user.uid, (records) => {
      setUnreadCount(
        records.filter((booking) => !hasStaffAcknowledged(booking, user.uid) && !['completed', 'cancelled'].includes(booking.status)).length,
      );
    });

    return () => unsubscribe();
  }, [user.uid]);

  return (
    <nav className="glass-nav border-white/5 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-4">
            <Logo variant="light" />
            <div className="h-6 w-px bg-white/10 hidden sm:block" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-teal uppercase hidden sm:block">Staff Portal</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => onNavigate('checkin')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Clock size={14} /> Check In
            </button>
            <button onClick={() => onNavigate('schedule')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Calendar size={14} /> Schedule
            </button>
            <button onClick={() => onNavigate('tasks')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <ClipboardList size={14} /> Tasks
            </button>
            <button onClick={() => onNavigate('notifications')} className="text-xs font-bold tracking-widest text-white hover:text-teal transition-colors uppercase flex items-center gap-2">
              <Bell size={14} />
              Alerts
              {unreadCount > 0 && (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-teal px-1.5 py-0.5 text-[9px] text-charcoal">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <div className="text-right">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest">{user.displayName || 'Staff'}</p>
                <p className="text-[8px] text-teal uppercase tracking-widest">Field Specialist</p>
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
        <div className="md:hidden bg-charcoal border-b border-white/10 p-4 flex flex-col gap-4">
          <button onClick={() => { onNavigate('checkin'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Check In</button>
          <button onClick={() => { onNavigate('schedule'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Schedule</button>
          <button onClick={() => { onNavigate('tasks'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Tasks</button>
          <button onClick={() => { onNavigate('notifications'); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-white text-left uppercase">Alerts {unreadCount > 0 ? `(${unreadCount})` : ''}</button>
          <button onClick={() => { onLogout(); setIsOpen(false); }} className="text-xs font-bold tracking-widest text-red-500 text-left uppercase">Logout</button>
        </div>
      )}
    </nav>
  );
};
