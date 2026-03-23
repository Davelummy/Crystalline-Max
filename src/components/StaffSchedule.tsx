import React from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, Clock, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const SCHEDULE = [
  { id: 1, time: '09:00', client: 'Alice Smith', service: 'Full Detail', location: 'M1 4BT, Manchester', status: 'completed' },
  { id: 2, time: '11:30', client: 'Bob Johnson', service: 'Mini Detail', location: 'M2 5RT, Manchester', status: 'in-progress' },
  { id: 3, time: '14:00', client: 'Charlie Brown', service: 'Interior Only', location: 'M3 6YU, Manchester', status: 'upcoming' },
  { id: 4, time: '16:30', client: 'Diana Prince', service: 'Home Cleaning', location: 'M4 7IO, Manchester', status: 'upcoming' },
];

interface StaffScheduleProps {
  onNavigate: (view: any) => void;
}

export const StaffSchedule: React.FC<StaffScheduleProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Your Schedule</h2>
          <h3 className="text-4xl text-white font-display uppercase">Daily Agenda</h3>
          <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Sunday, 22 March 2026</p>
        </header>

        <div className="space-y-4">
          {SCHEDULE.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={cn(
                "group relative overflow-hidden dark-card p-6 border-white/5 hover:border-teal/30 transition-all",
                item.status === 'in-progress' && "border-teal/50 bg-teal/5"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "w-16 h-16 rounded-xl flex flex-col items-center justify-center border",
                    item.status === 'completed' ? "bg-teal/10 border-teal/20 text-teal" :
                    item.status === 'in-progress' ? "bg-teal border-teal text-charcoal" :
                    "bg-white/5 border-white/10 text-white/40"
                  )}>
                    <span className="text-lg font-bold font-display">{item.time}</span>
                    <span className="text-[8px] uppercase tracking-widest font-bold">Start</span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-xl font-display uppercase text-white">{item.client}</h4>
                      {item.status === 'completed' && <CheckCircle2 size={14} className="text-teal" />}
                    </div>
                    <p className="text-teal text-xs font-bold uppercase tracking-widest mb-3">{item.service}</p>
                    <div className="flex items-center gap-4 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-teal/40" /> {item.location}</span>
                      <span className="flex items-center gap-1"><Clock size={12} className="text-teal/40" /> 2.5h</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border",
                    item.status === 'completed' ? "bg-teal/10 border-teal/20 text-teal" :
                    item.status === 'in-progress' ? "bg-teal/20 border-teal/40 text-teal animate-pulse" :
                    "bg-white/5 border-white/10 text-white/20"
                  )}>
                    {item.status}
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
      </div>
    </div>
  );
};
