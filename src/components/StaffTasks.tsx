import React from 'react';
import { AlertCircle, CheckCircle2, Circle, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { cn } from '@/src/lib/utils';
import { formatSchedule, getBookingTasks, sortBookingsBySchedule } from '../lib/bookings';
import type { BookingRecord, View } from '../types';

interface StaffTasksProps {
  onNavigate: (view: View) => void;
}

export const StaffTasks: React.FC<StaffTasksProps> = ({ onNavigate }) => {
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [completed, setCompleted] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const tasksQuery = query(collection(db, 'bookings'), where('assignedStaffId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      const [nextBooking] = sortBookingsBySchedule(
        records.filter((entry) => !['completed', 'cancelled'].includes(entry.status)),
      );
      setBooking(nextBooking || null);
      setCompleted({});
    });

    return () => unsubscribe();
  }, []);

  const tasks = booking ? getBookingTasks(booking.serviceId) : [];
  const completedCount = tasks.filter((task) => completed[task.id]).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Task Management</h2>
            <h3 className="text-4xl text-white font-display uppercase">Current Checklist</h3>
            <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">
              {booking ? `${booking.customerName} - ${booking.serviceLabel}` : 'No active booking selected'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase font-bold mb-1">Progress</p>
            <p className="text-3xl font-display text-teal">{progress}%</p>
          </div>
        </header>

        {booking ? (
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              {tasks.map((task, idx) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    'group p-5 rounded-custom border transition-all flex items-center justify-between',
                    completed[task.id]
                      ? 'bg-teal/5 border-teal/20 text-teal/40'
                      : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCompleted((prev) => ({ ...prev, [task.id]: !prev[task.id] }))}
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center border transition-all',
                        completed[task.id] ? 'bg-teal border-teal text-charcoal' : 'border-white/20 text-white/20',
                      )}
                    >
                      {completed[task.id] ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                    </button>
                    <div>
                      <p className={cn('text-sm font-bold uppercase tracking-wider', completed[task.id] && 'line-through opacity-50')}>
                        {task.title}
                      </p>
                      <span className="text-[8px] uppercase tracking-[0.2em] opacity-40">{task.category}</span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      'px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest',
                      task.priority === 'high'
                        ? 'bg-red-500/10 text-red-500'
                        : task.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-teal-500/10 text-teal-500',
                    )}
                  >
                    {task.priority}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="space-y-6">
              <div className="dark-card p-6 border-teal/20">
                <div className="flex items-center gap-3 mb-6">
                  <AlertCircle className="text-teal" size={20} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Booking Snapshot</h4>
                </div>
                <p className="text-[10px] text-white/40 uppercase leading-relaxed tracking-widest">
                  {formatSchedule(booking)} at {booking.postcode}
                </p>
                <p className="text-[10px] text-white/40 uppercase leading-relaxed tracking-widest mt-3">
                  Add-ons: {booking.addons.length > 0 ? booking.addons.join(', ') : 'None'}
                </p>
              </div>

              <div className="dark-card p-6 border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="text-teal" size={20} />
                  <h4 className="text-xs font-bold uppercase tracking-widest">Safety Protocol</h4>
                </div>
                <ul className="space-y-3">
                  {['Wear gloves', 'Confirm service scope', 'Check site access'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-[9px] text-white/60 uppercase tracking-widest">
                      <div className="w-1 h-1 bg-teal rounded-full" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => onNavigate('schedule')}
                className="btn-primary w-full py-4 text-xs flex items-center justify-center gap-2"
              >
                <Sparkles size={16} /> RETURN TO SCHEDULE
              </button>
            </div>
          </div>
        ) : (
          <div className="dark-card p-8 text-white/50">
            No active assigned booking. Assign a booking from the admin portal to populate this checklist.
          </div>
        )}
      </div>
    </div>
  );
};
