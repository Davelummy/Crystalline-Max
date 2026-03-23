import React from 'react';
import { User, Phone, MapPin, Save, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileEditProps {
  user: any;
  onBack: () => void;
}

export const UserProfileEdit: React.FC<UserProfileEditProps> = ({ user, onBack }) => {
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    displayName: '',
    phoneNumber: '',
    address: '',
    city: '',
    postcode: ''
  });

  React.useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData({
            displayName: data.displayName || user.displayName || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            city: data.city || '',
            postcode: data.postcode || ''
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        ...formData,
        updatedAt: new Date().toISOString()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-silver/10 pt-32 pb-12">
      <div className="max-w-2xl mx-auto px-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-teal transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.3em] mb-2 uppercase font-bold">Account Settings</h2>
          <h3 className="text-4xl font-display uppercase tracking-wider">Edit Profile</h3>
        </header>

        <div className="frost-card-light p-8 md:p-12 relative overflow-hidden">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                  <User size={12} className="text-teal" /> Full Name
                </label>
                <input 
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="w-full bg-charcoal/5 border-b border-charcoal/10 py-3 px-4 focus:border-teal outline-none transition-colors text-sm font-medium"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                  <Phone size={12} className="text-teal" /> Phone Number
                </label>
                <input 
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-charcoal/5 border-b border-charcoal/10 py-3 px-4 focus:border-teal outline-none transition-colors text-sm font-medium"
                  placeholder="e.g. +44 7700 900000"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 flex items-center gap-2">
                <MapPin size={12} className="text-teal" /> Street Address
              </label>
              <input 
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-charcoal/5 border-b border-charcoal/10 py-3 px-4 focus:border-teal outline-none transition-colors text-sm font-medium"
                placeholder="Enter your street address"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">City</label>
                <input 
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-charcoal/5 border-b border-charcoal/10 py-3 px-4 focus:border-teal outline-none transition-colors text-sm font-medium"
                  placeholder="e.g. Manchester"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40">Postcode</label>
                <input 
                  type="text"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  className="w-full bg-charcoal/5 border-b border-charcoal/10 py-3 px-4 focus:border-teal outline-none transition-colors text-sm font-medium"
                  placeholder="e.g. M1 4BT"
                  required
                />
              </div>
            </div>

            <div className="pt-8 border-t border-charcoal/5 flex flex-col sm:flex-row items-center justify-between gap-6">
              <AnimatePresence mode="wait">
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-emerald-600 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <CheckCircle2 size={16} /> Changes Saved Successfully
                  </motion.div>
                )}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-2 text-red-500 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <AlertCircle size={16} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={saving}
                className="btn-primary px-12 py-4 flex items-center justify-center gap-3 group disabled:opacity-50 w-full sm:w-auto"
              >
                {saving ? 'SAVING...' : (
                  <>
                    SAVE CHANGES <Save size={18} className="group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
