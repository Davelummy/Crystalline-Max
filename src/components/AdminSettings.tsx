import React from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, Bell, Database, Globe, Palette, Save, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export const AdminSettings: React.FC = () => {
  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Configuration</h2>
          <h3 className="text-4xl text-white font-display uppercase">System Settings</h3>
          <p className="text-white/40 mt-2 uppercase tracking-widest text-xs font-bold">Control your precision infrastructure</p>
        </header>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-2">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'data', label: 'Data & Sync', icon: Database },
              { id: 'regions', label: 'Service Regions', icon: Globe },
              { id: 'branding', label: 'Branding', icon: Palette },
            ].map((item, idx) => (
              <button
                key={item.id}
                className={cn(
                  "w-full p-4 flex items-center gap-3 rounded-custom text-[10px] font-bold uppercase tracking-widest transition-all",
                  idx === 0 ? "bg-teal text-charcoal" : "text-white/40 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </div>

          <div className="md:col-span-3 space-y-8">
            <div className="dark-card p-10 border-white/5">
              <h4 className="text-xl font-display uppercase text-white mb-8 tracking-wider">General Configuration</h4>
              
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Business Name</label>
                    <input type="text" defaultValue="Crystalline Max" className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Support Email</label>
                    <input type="email" defaultValue="support@crystallinemax.com" className="bg-white/5 border border-white/10 rounded-custom px-4 py-3 text-sm text-white w-full focus:border-teal/50 outline-none" />
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-teal">Operational Status</h5>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-custom border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-teal rounded-full animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-widest text-white/60">System Online</span>
                    </div>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">Force Maintenance</button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-teal">Security & Access</h5>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-custom border border-white/10">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">Two-Factor Authentication</p>
                        <p className="text-[8px] text-white/20 uppercase font-bold mt-1">Required for all administrative accounts</p>
                      </div>
                      <div className="w-10 h-5 bg-teal rounded-full relative">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-charcoal rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-custom border border-white/10">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-white">Public Registration</p>
                        <p className="text-[8px] text-white/20 uppercase font-bold mt-1">Allow new clients to sign up from landing page</p>
                      </div>
                      <div className="w-10 h-5 bg-white/10 rounded-full relative">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex justify-end gap-4">
                <button 
                  onClick={() => alert('Changes discarded')}
                  className="btn-secondary px-8 py-3 text-xs"
                >
                  DISCARD CHANGES
                </button>
                <button 
                  onClick={() => alert('Settings saved successfully')}
                  className="btn-primary px-8 py-3 text-xs flex items-center gap-2"
                >
                  <Save size={16} /> SAVE SETTINGS
                </button>
              </div>
            </div>

            <div className="p-6 rounded-custom bg-red-500/5 border border-red-500/20 flex items-center gap-4">
              <AlertCircle className="text-red-500" size={24} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-red-500">Danger Zone</p>
                <p className="text-[10px] text-red-500/40 uppercase font-bold">Irreversible actions that affect the entire system infrastructure.</p>
              </div>
              <button 
                onClick={() => alert('Purge data initiated. Please confirm in the next step.')}
                className="ml-auto px-4 py-2 border border-red-500/40 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all rounded-custom"
              >
                PURGE DATA
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
