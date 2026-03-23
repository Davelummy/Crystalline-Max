import React from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, ArrowRight } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface OnboardingProps {
  onComplete: () => void;
}

export const CustomerOnboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [formData, setFormData] = React.useState({
    phoneNumber: '',
    address: '',
    city: '',
    postcode: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const existing = await getDoc(userRef);

    await setDoc(userRef, {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      displayName: auth.currentUser.displayName,
      role: 'client',
      ...formData,
      onboarded: true,
      ...(existing.exists() ? {} : { bookingCount: 0, createdAt: serverTimestamp() }),
      updatedAt: serverTimestamp()
    }, { merge: true });

    onComplete();
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 flex items-center justify-center bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-8 shadow-2xl border-charcoal/5"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-4">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-display uppercase tracking-wider">Welcome to Crystalline</h1>
          <p className="text-charcoal/40 text-xs uppercase tracking-widest mt-2">Complete your profile to start booking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20" size={16} />
              <input 
                required
                type="tel"
                placeholder="+44 7000 000000"
                className="input-field-light pl-12"
                value={formData.phoneNumber}
                onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">Primary Address</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/20" size={16} />
              <input 
                required
                type="text"
                placeholder="123 Street Name, Manchester"
                className="input-field-light pl-12"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">City</label>
              <input
                required
                type="text"
                placeholder="Manchester"
                className="input-field-light"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">Postcode</label>
              <input
                required
                type="text"
                placeholder="M1 4BT"
                className="input-field-light"
                value={formData.postcode}
                onChange={e => setFormData({ ...formData, postcode: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
            COMPLETE SETUP <ArrowRight size={16} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
