import React from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, MapPin, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export const EmployeeCheckIn: React.FC = () => {
  const [status, setStatus] = React.useState<'in' | 'out' | 'unknown'>('unknown');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastAction, setLastAction] = React.useState<any>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'checkins'),
      where('employeeUid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const last = snapshot.docs[0].data();
        setLastAction(last);
        setStatus(last.type === 'in' ? 'in' : 'out');
      } else {
        setStatus('out');
      }
      setLoading(false);
    }, (err) => {
      console.error("Error fetching status:", err);
      setError("Failed to sync status. Please check your connection.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAction = async (type: 'in' | 'out') => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);

    try {
      let location = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        };
      } catch (e) {
        console.warn("Location access denied or timed out");
      }

      await addDoc(collection(db, 'checkins'), {
        employeeUid: auth.currentUser.uid,
        employeeName: auth.currentUser.displayName || auth.currentUser.email,
        type,
        timestamp: serverTimestamp(),
        location
      });

    } catch (err) {
      console.error("Check-in error:", err);
      setError("Permission denied or server error. Ensure you are logged in as an employee.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && status === 'unknown') return <div className="pt-32 text-center">Syncing...</div>;

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-lg mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dark-card p-10 text-center relative overflow-hidden"
      >
        {/* Status Indicator */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${status === 'in' ? 'bg-teal' : 'bg-red-500'}`} />
        
        <h1 className="text-3xl mb-2 font-display uppercase tracking-wider">Staff Portal</h1>
        <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-10">
          {auth.currentUser?.displayName || auth.currentUser?.email}
        </p>

        <div className="mb-12">
          <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 border-2 ${status === 'in' ? 'border-teal text-teal' : 'border-white/10 text-white/20'}`}>
            <Clock size={40} />
          </div>
          <p className="text-sm uppercase tracking-widest text-white/60">
            Current Status: <span className={status === 'in' ? 'text-teal font-bold' : 'text-red-500 font-bold'}>
              {status === 'in' ? 'ON DUTY' : 'OFF DUTY'}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAction('in')}
            disabled={status === 'in' || loading}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
              status === 'in' 
                ? 'bg-teal/5 border-teal/20 opacity-50 cursor-not-allowed' 
                : 'bg-white/5 border-white/10 hover:border-teal hover:bg-teal/10'
            }`}
          >
            <LogIn className={status === 'in' ? 'text-teal/40' : 'text-teal'} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Check In</span>
          </button>

          <button 
            onClick={() => handleAction('out')}
            disabled={status === 'out' || loading}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
              status === 'out' 
                ? 'bg-red-500/5 border-red-500/20 opacity-50 cursor-not-allowed' 
                : 'bg-white/5 border-white/10 hover:border-red-500 hover:bg-red-500/10'
            }`}
          >
            <LogOut className={status === 'out' ? 'text-red-500/40' : 'text-red-500'} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Check Out</span>
          </button>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[10px] uppercase tracking-widest flex items-center gap-2"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {lastAction && (
          <div className="mt-10 pt-8 border-t border-white/5 text-left">
            <p className="text-[10px] text-white/20 uppercase tracking-widest mb-4">Last Activity</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${lastAction.type === 'in' ? 'bg-teal' : 'bg-red-500'}`} />
                <span className="text-xs uppercase tracking-widest font-medium">
                  Checked {lastAction.type}
                </span>
              </div>
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                {lastAction.timestamp?.toDate ? lastAction.timestamp.toDate().toLocaleString() : 'Just now'}
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
