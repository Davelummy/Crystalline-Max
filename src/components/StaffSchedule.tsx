import React from 'react';
import { Calendar as CalendarIcon, CheckCircle2, ChevronRight, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { cn } from '@/src/lib/utils';
import { formatSchedule, getStatusLabel, sortBookingsBySchedule } from '../lib/bookings';
import type { BookingRecord, View } from '../types';

interface StaffScheduleProps {
  onNavigate: (view: View) => void;
}

export const StaffSchedule: React.FC<StaffScheduleProps> = ({ onNavigate }) => {
  const [schedule, setSchedule] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const scheduleQuery = query(collection(db, 'bookings'), where('assignedStaffId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(scheduleQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      setSchedule(sortBookingsBySchedule(records));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Your Schedule</h2>
          <h3 className="text-4xl text-white font-display uppercase">Assigned Bookings</h3>
          <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Pulled from live Firestore bookings</p>
        </header>

        {loading ? (
          <div className="dark-card p-8 text-white/50">Loading schedule...</div>
        ) : schedule.length > 0 ? (
          <div className="space-y-4">
            {schedule.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  'group relative overflow-hidden dark-card p-6 border-white/5 hover:border-teal/30 transition-all',
                  item.status === 'in_progress' && 'border-teal/50 bg-teal/5',
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div
                      className={cn(
                        'w-16 h-16 rounded-xl flex flex-col items-center justify-center border',
                        item.status === 'completed'
                          ? 'bg-teal/10 border-teal/20 text-teal'
                          : item.status === 'in_progress'
                            ? 'bg-teal border-teal text-charcoal'
                            : 'bg-white/5 border-white/10 text-white/40',
                      )}
                    >
                      <CalendarIcon size={16} />
                      <span className="text-[8px] uppercase tracking-widest font-bold mt-1">{item.date}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-xl font-display uppercase text-white">{item.customerName}</h4>
                        {item.status === 'completed' && <CheckCircle2 size={14} className="text-teal" />}
                      </div>
                      <p className="text-teal text-xs font-bold uppercase tracking-widest mb-3">{item.serviceLabel}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                        <span className="flex items-center gap-1"><MapPin size={12} className="text-teal/40" /> {item.postcode}</span>
                        <span className="flex items-center gap-1"><Clock size={12} className="text-teal/40" /> {formatSchedule(item)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border',
                        item.status === 'completed'
                          ? 'bg-teal/10 border-teal/20 text-teal'
                          : item.status === 'in_progress'
                            ? 'bg-teal/20 border-teal/40 text-teal animate-pulse'
                            : 'bg-white/5 border-white/10 text-white/20',
                      )}
                    >
                      {getStatusLabel(item.status)}
                    </div>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:bg-teal hover:text-charcoal transition-all"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="dark-card p-8 text-white/50">
            No bookings are assigned to this staff member yet. Use the admin assignment queue to attach a booking.
          </div>
        )}
      </div>
    </div>
  );
};
