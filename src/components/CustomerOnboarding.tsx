import React from 'react';
import { motion } from 'motion/react';
import { User, Phone, MapPin, ArrowRight, Search } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface NominatimResult {
  place_id: number;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    postcode?: string;
  };
}

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

  const [addressQuery, setAddressQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  React.useEffect(() => {
    const trimmed = addressQuery.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(trimmed)}&addressdetails=1&limit=5&countrycodes=gb`,
          { headers: { Accept: 'application/json' }, signal: controller.signal },
        );
        if (resp.ok) setSuggestions(await resp.json());
      } catch (err) {
        if ((err as { name?: string })?.name !== 'AbortError') {
          console.error('Address search failed:', err);
        }
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [addressQuery]);

  const handleSelectSuggestion = (result: NominatimResult) => {
    const addr = result.address || {};
    const line1 = [addr.house_number, addr.road].filter(Boolean).join(' ').trim();
    const city = addr.city || addr.town || addr.village || addr.county || '';
    const postcode = addr.postcode || '';

    setFormData(prev => ({
      ...prev,
      address: line1 || result.display_name,
      city,
      postcode,
    }));
    setAddressQuery(line1 || result.display_name);
    setSuggestions([]);
  };

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
          <p className="text-charcoal/60 text-xs uppercase tracking-widest mt-2">Complete your profile to start booking</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/55" size={16} />
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/55" size={16} />
              <input
                required
                type="text"
                placeholder="Start typing your address..."
                className="input-field-light pl-12"
                value={addressQuery}
                onChange={e => {
                  setAddressQuery(e.target.value);
                  setFormData(prev => ({ ...prev, address: e.target.value }));
                }}
              />
            </div>
            {isSearching && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-charcoal/55">Searching...</p>
            )}
            {suggestions.length > 0 && (
              <div className="mt-1 max-h-48 overflow-y-auto rounded-2xl border border-charcoal/10 bg-white shadow-lg">
                {suggestions.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(result)}
                    className="w-full border-b border-charcoal/5 px-4 py-3 text-left transition-colors hover:bg-charcoal/[0.03] last:border-b-0"
                  >
                    <p className="text-xs tracking-wide text-charcoal">{result.display_name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-charcoal/60 mb-2">City</label>
              <input
                required
                type="text"
                placeholder="City or Town"
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
