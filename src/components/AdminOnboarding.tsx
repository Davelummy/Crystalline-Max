import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, ArrowRight, Phone } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface OnboardingProps {
  onComplete: () => void;
}

export const AdminOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [phoneNumber, setPhoneNumber] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const payload: Record<string, unknown> = {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      role: 'admin',
      phoneNumber,
      onboarded: true,
      updatedAt: serverTimestamp()
    };

    if (auth.currentUser.displayName) {
      payload.displayName = auth.currentUser.displayName;
    }

    await setDoc(doc(db, 'users', auth.currentUser.uid), payload, { merge: true });

    onComplete();
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
          <p className="text-white/60 text-[10px] uppercase tracking-widest mt-2">Complete your admin profile to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-white/60 mb-2">Contact Phone</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55" size={16} />
              <input 
                required
                type="tel"
                placeholder="+44 7000 000000"
                className="input-field bg-white/5 border-white/10 text-white pl-12 focus:border-teal"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            COMPLETE PROFILE <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 flex items-center gap-3 text-white/55">
          <Lock size={14} />
          <p className="text-[10px] uppercase tracking-widest">End-to-end encrypted administrative session</p>
        </div>
      </motion.div>
    </div>
  );
};
