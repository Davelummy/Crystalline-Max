import React from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Search, MoreVertical, Star, ShieldCheck, Clock, MapPin } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const STAFF = [
  { id: '1619642751034-765dfdf7c58e', name: 'Marcus Thorne', role: 'Senior Specialist', rating: 4.9, status: 'active', location: 'M1, Manchester', jobs: 452 },
  { id: '1584622650111-993a426fbf0a', name: 'Sarah Jenkins', role: 'Detailer', rating: 4.7, status: 'active', location: 'M2, Manchester', jobs: 218 },
  { id: '1603584173870-7f3118941648', name: 'James Wilson', role: 'Cleaner', rating: 4.8, status: 'on-break', location: 'M3, Manchester', jobs: 184 },
  { id: '1584622781564-1d987f7333c1', name: 'Elena Rodriguez', role: 'Detailer', rating: 4.6, status: 'off-duty', location: 'M4, Manchester', jobs: 92 },
];

export const AdminStaffManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-wrap justify-between items-end gap-6">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Human Resources</h2>
            <h3 className="text-4xl text-white font-display uppercase">Staff Management</h3>
            <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Manage your precision team</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input type="text" placeholder="Search staff..." className="bg-white/5 border border-white/10 rounded-custom pl-12 pr-6 py-3 text-sm text-white focus:border-teal/50 outline-none transition-all" />
            </div>
            <button 
              onClick={() => alert('Add Staff flow coming soon')}
              className="btn-primary flex items-center gap-2 px-6 py-3"
            >
              <UserPlus size={18} /> ADD STAFF
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4">
          {STAFF.map((staff, idx) => (
            <motion.div
              key={staff.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group dark-card p-6 border-white/5 hover:border-teal/30 transition-all flex flex-wrap items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10 group-hover:border-teal/30 transition-all">
                  <img 
                    src={`https://images.unsplash.com/photo-${staff.id}?auto=format&fit=crop&q=80&w=200`} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-xl font-display uppercase text-white">{staff.name}</h4>
                    <ShieldCheck size={14} className="text-teal" />
                  </div>
                  <p className="text-teal text-xs font-bold uppercase tracking-widest mb-3">{staff.role}</p>
                  <div className="flex flex-wrap items-center gap-6 text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    <span className="flex items-center gap-1"><Star size={12} className="fill-teal text-teal" /> {staff.rating}</span>
                    <span className="flex items-center gap-1"><Clock size={12} className="text-teal/40" /> {staff.jobs} Jobs</span>
                    <span className="flex items-center gap-1"><MapPin size={12} className="text-teal/40" /> {staff.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] text-white/20 uppercase font-bold mb-1">Status</p>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.2em] border",
                    staff.status === 'active' ? "bg-teal/10 border-teal/20 text-teal" :
                    staff.status === 'on-break' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                    "bg-white/5 border-white/10 text-white/20"
                  )}>
                    {staff.status}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => alert(`Viewing profile for ${staff.name}`)}
                    className="btn-secondary py-2 px-4 text-[10px]"
                  >
                    VIEW PROFILE
                  </button>
                  <button className="p-2 text-white/20 hover:text-white transition-colors">
                    <MoreVertical size={20} />
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
