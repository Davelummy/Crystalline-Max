import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Circle, ClipboardList, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const TASKS = [
  { id: 1, title: 'Exterior Pressure Wash', category: 'Detailing', status: 'completed', priority: 'high' },
  { id: 2, title: 'Interior Vacuum & Dust', category: 'Detailing', status: 'in-progress', priority: 'high' },
  { id: 3, title: 'Leather Conditioning', category: 'Detailing', status: 'pending', priority: 'medium' },
  { id: 4, title: 'Window Polish (Interior)', category: 'Detailing', status: 'pending', priority: 'medium' },
  { id: 5, title: 'Ceramic Coating Application', category: 'Detailing', status: 'pending', priority: 'high' },
  { id: 6, title: 'Tire Dressing', category: 'Detailing', status: 'pending', priority: 'low' },
];

interface StaffTasksProps {
  onNavigate: (view: any) => void;
}

export const StaffTasks: React.FC<StaffTasksProps> = ({ onNavigate }) => {
  const [tasks, setTasks] = React.useState(TASKS);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(t => 
      t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
    ));
  };

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progress = Math.round((completedCount / tasks.length) * 100);

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Task Management</h2>
            <h3 className="text-4xl text-white font-display uppercase">Current Checklist</h3>
            <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Bob Johnson - Mini Detail</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase font-bold mb-1">Progress</p>
            <p className="text-3xl font-display text-teal">{progress}%</p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            {tasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "group p-5 rounded-custom border transition-all flex items-center justify-between",
                  task.status === 'completed' ? "bg-teal/5 border-teal/20 text-teal/40" :
                  task.status === 'in-progress' ? "bg-white/5 border-teal/50 text-white" :
                  "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                )}
              >
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center border transition-all",
                      task.status === 'completed' ? "bg-teal border-teal text-charcoal" :
                      task.status === 'in-progress' ? "border-teal text-teal animate-pulse" :
                      "border-white/20 text-white/20"
                    )}
                  >
                    {task.status === 'completed' ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  </button>
                  <div>
                    <p className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      task.status === 'completed' && "line-through opacity-50"
                    )}>
                      {task.title}
                    </p>
                    <span className="text-[8px] uppercase tracking-[0.2em] opacity-40">{task.category}</span>
                  </div>
                </div>
                
                <div className={cn(
                  "px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest",
                  task.priority === 'high' ? "bg-red-500/10 text-red-500" :
                  task.priority === 'medium' ? "bg-amber-500/10 text-amber-500" :
                  "bg-teal-500/10 text-teal-500"
                )}>
                  {task.priority}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="dark-card p-6 border-teal/20">
              <div className="flex items-center gap-3 mb-6">
                <AlertCircle className="text-teal" size={20} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Special Instructions</h4>
              </div>
              <p className="text-[10px] text-white/40 uppercase leading-relaxed tracking-widest">
                Client requested extra attention to the rear seats due to pet hair. Use the deep steam cleaner on the dashboard.
              </p>
            </div>

            <div className="dark-card p-6 border-white/5">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-teal" size={20} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Safety Protocol</h4>
              </div>
              <ul className="space-y-3">
                {['Wear gloves', 'Ventilate interior', 'Check battery'].map(item => (
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
              <Sparkles size={16} /> COMPLETE JOB
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
