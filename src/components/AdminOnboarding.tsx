import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Key, Lock, ArrowRight, AlertTriangle } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OnboardingProps {
  onComplete: (role: string) => void;
}

export const AdminOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [accessCode, setAccessCode] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    // In a real app, this would verify against a secret or pre-approved list
    // For this demo, we'll allow it if they have the code "MAX-2026"
    if (accessCode !== 'MAX-2026' && auth.currentUser.email !== 'jennerwatkins@gmail.com') {
      setError('Invalid administrative access code.');
      return;
    }

    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      role: 'admin',
      onboarded: true,
      createdAt: serverTimestamp()
    }, { merge: true });

    onComplete('admin');
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-charcoal">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full dark-card p-10 shadow-2xl border-teal/20"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4 border border-teal/20">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider text-white">Admin Access</h1>
          <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">Restricted administrative portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Access Code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
              <input 
                required
                type="password"
                placeholder="Enter admin code"
                className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
                value={accessCode}
                onChange={e => { setAccessCode(e.target.value); setError(''); }}
              />
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            AUTHORIZE ACCESS <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-white/20">
          <Lock size={14} />
          <p className="text-[8px] uppercase tracking-widest">End-to-end encrypted administrative session</p>
        </div>
      </motion.div>
    </div>
  );
};
