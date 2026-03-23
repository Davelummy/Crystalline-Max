import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Calendar, CreditCard, ChevronRight, Check, LogIn, UserPlus, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { auth, db } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { SERVICES, CAR_ADDONS, HOME_ADDONS } from '../constants';

const steps = [
  { id: 1, title: 'Service', icon: Check },
  { id: 2, title: 'Add-ons', icon: Check },
  { id: 3, title: 'Location', icon: Check },
  { id: 4, title: 'Time', icon: Check },
  { id: 5, title: 'Account', icon: Check },
  { id: 6, title: 'Payment', icon: Check },
];

interface BookingFlowProps {
  initialServiceId?: string;
  onComplete?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ initialServiceId, onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(initialServiceId ? 2 : 1);
  const [user, setUser] = React.useState(auth.currentUser);
  const [userData, setUserData] = React.useState<any>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [selection, setSelection] = React.useState({
    serviceId: initialServiceId || '',
    addons: [] as string[],
    address: '',
    time: '',
    timeWindow: '',
    date: new Date().toISOString().split('T')[0]
  });

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }
      } else {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const selectedService = SERVICES.find(s => s.id === selection.serviceId);
  const isDetailing = selectedService?.type === 'car';
  const availableAddons = selectedService?.type === 'car' ? CAR_ADDONS : 
                          selectedService?.type === 'home' ? HOME_ADDONS : [];

  const calculateTotal = () => {
    if (!selectedService) return 0;
    const addonsTotal = selection.addons.reduce((acc, id) => {
      const addon = availableAddons.find(a => a.id === id);
      return acc + (addon?.price || 0);
    }, 0);
    
    const baseTotal = selectedService.basePrice + addonsTotal;
    const bookingCount = userData?.bookingCount || 0;
    
    let discount = 0;
    if (bookingCount === 0) discount = 0.10; // 10% off first booking
    else if (bookingCount >= 3) discount = 0.05; // 5% off from 4th booking onwards
    
    return baseTotal * (1 - discount);
  };

  const nextStep = () => {
    if (currentStep === 4 && user) {
      setCurrentStep(6); // Skip account step if already logged in
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };
  const prevStep = () => {
    if (currentStep === 6 && user) {
      setCurrentStep(4);
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  const handleSocialLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setCurrentStep(6);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const toggleAddon = (id: string) => {
    setSelection(prev => ({
      ...prev,
      addons: prev.addons.includes(id) 
        ? prev.addons.filter(a => a !== id) 
        : [...prev.addons, id]
    }));
  };

  const handleFinalize = async () => {
    try {
      if (user) {
        await addDoc(collection(db, 'bookings'), {
          ...selection,
          userId: user.uid,
          total: calculateTotal(),
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: new Date().toISOString()
        });
        
        await updateDoc(doc(db, 'users', user.uid), {
          bookingCount: increment(1)
        });
      }
      setIsSuccess(true);
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    } catch (error) {
      console.error("Booking failed:", error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-teal text-charcoal rounded-full flex items-center justify-center mb-8"
        >
          <Check size={48} strokeWidth={3} />
        </motion.div>
        <h2 className="text-4xl font-display uppercase mb-4">Booking Confirmed!</h2>
        <p className="text-charcoal/60 max-w-sm mb-8">
          Thank you for choosing Crystalline Max. We've sent a confirmation email with all the details.
        </p>
        <div className="text-xs font-bold uppercase tracking-widest text-teal animate-pulse">
          Redirecting to your dashboard...
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl mb-6 font-display uppercase">Select Service</h3>
            <div className="grid grid-cols-1 gap-3">
              {SERVICES.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setSelection({ ...selection, serviceId: item.id, addons: [] }); nextStep(); }}
                  className={cn(
                    "w-full p-6 flex items-center justify-between frost-card-light hover:border-teal transition-all group",
                    selection.serviceId === item.id && "border-teal bg-teal/5"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-silver/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                      <item.icon className="text-teal" size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-xs text-charcoal/40 uppercase tracking-widest">Starting from £{item.basePrice}</span>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-silver" />
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl mb-6 font-display uppercase">Add Enhancements</h3>
            {availableAddons.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {availableAddons.map(addon => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      "w-full p-5 flex items-center justify-between frost-card-light transition-all",
                      selection.addons.includes(addon.id) ? "border-teal bg-teal/5" : "hover:border-teal/30"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center",
                        selection.addons.includes(addon.id) ? "bg-teal border-teal" : "border-charcoal/20"
                      )}>
                        {selection.addons.includes(addon.id) && <Check size={12} className="text-charcoal" />}
                      </div>
                      <span className="text-sm font-medium uppercase tracking-wider">{addon.label}</span>
                    </div>
                    <span className="text-sm font-bold text-teal">+£{addon.price}</span>
                  </button>
                ))}
                <button onClick={nextStep} className="btn-primary w-full mt-6">CONTINUE TO LOCATION</button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="mx-auto mb-4 text-teal/40" size={48} />
                <p className="text-charcoal/40 uppercase tracking-widest text-xs mb-8">No specific add-ons for this service</p>
                <button onClick={nextStep} className="btn-primary w-full">CONTINUE TO LOCATION</button>
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl mb-6 font-display uppercase">Service Location</h3>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-teal" size={20} />
              <input 
                type="text" 
                placeholder="Enter Manchester address..." 
                className="input-field-light pl-12"
                value={selection.address}
                onChange={(e) => setSelection({...selection, address: e.target.value})}
              />
            </div>
            <div className="h-48 bg-silver/20 rounded-lg overflow-hidden relative border border-charcoal/5">
              <div className="absolute inset-0 flex items-center justify-center text-charcoal/30 text-[10px] font-bold uppercase tracking-widest">
                Map Preview (Manchester Area)
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-teal/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="w-3 h-3 bg-teal rounded-full shadow-[0_0_10px_rgba(45,212,191,0.5)]" />
                </div>
              </div>
            </div>
            <button 
              onClick={nextStep} 
              disabled={!selection.address}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CONFIRM LOCATION
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl mb-6 font-display uppercase">Select {isDetailing ? 'Time Slot' : 'Time Window'}</h3>
            <div className="grid grid-cols-1 gap-3">
              {isDetailing ? (
                <div className="grid grid-cols-2 gap-3">
                  {['08:00', '10:30', '13:00', '15:30', '18:00'].map(time => (
                    <button
                      key={time}
                      onClick={() => { setSelection({...selection, time, timeWindow: ''}); nextStep(); }}
                      className={cn(
                        "p-4 text-sm font-bold frost-card-light hover:border-teal transition-all",
                        selection.time === time && "border-teal bg-teal/5"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { id: 'morning', label: 'Morning', window: '08:00 - 12:00' },
                    { id: 'afternoon', label: 'Afternoon', window: '12:00 - 16:00' },
                    { id: 'evening', label: 'Evening', window: '16:00 - 20:00' }
                  ].map(w => (
                    <button
                      key={w.id}
                      onClick={() => { setSelection({...selection, timeWindow: w.id, time: ''}); nextStep(); }}
                      className={cn(
                        "w-full p-6 flex items-center justify-between frost-card-light hover:border-teal transition-all",
                        selection.timeWindow === w.id && "border-teal bg-teal/5"
                      )}
                    >
                      <div className="text-left">
                        <span className="block font-bold uppercase tracking-wider">{w.label}</span>
                        <span className="text-[10px] text-charcoal/40 uppercase tracking-widest">{w.window}</span>
                      </div>
                      <Clock size={16} className="text-teal" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[10px] text-charcoal/40 text-center uppercase tracking-[0.3em]">
              {isDetailing ? 'Exact booking required for detailing' : 'Flexible windows for cleaning services'}
            </p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 text-center">
            <div className="w-20 h-20 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-6">
              <UserPlus size={40} />
            </div>
            <h3 className="text-2xl uppercase font-display tracking-wider">Create Your Account</h3>
            <p className="text-charcoal/60 text-sm max-w-xs mx-auto">
              Save your details for faster future bookings and track your service history.
            </p>
            <div className="space-y-4">
              <button onClick={handleSocialLogin} className="btn-primary w-full flex items-center justify-center gap-3">
                <LogIn size={18} /> CONTINUE WITH GOOGLE
              </button>
              <button onClick={nextStep} className="text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors">
                Continue as Guest
              </button>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl mb-6 font-display uppercase">Secure Payment</h3>
            <div className="frost-card-light p-6 space-y-4 border-teal/20">
              <div className="flex justify-between text-xs">
                <span className="text-charcoal/60 uppercase tracking-widest">Service</span>
                <span className="font-bold uppercase">{selectedService?.label}</span>
              </div>
              {selection.addons.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-charcoal/40 uppercase tracking-widest">Add-ons:</span>
                  {selection.addons.map(id => {
                    const addon = availableAddons.find(a => a.id === id);
                    return (
                      <div key={id} className="flex justify-between text-[10px]">
                        <span className="text-charcoal/60 uppercase tracking-widest">• {addon?.label}</span>
                        <span className="font-bold">+£{addon?.price}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex justify-between text-lg pt-4 border-t border-charcoal/5">
                <span className="text-charcoal/60 uppercase font-display">Total</span>
                <span className="text-teal font-bold">£{calculateTotal()}.00</span>
              </div>
              <hr className="border-charcoal/5" />
              <div className="space-y-3">
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
                  <input type="text" placeholder="Card Number" className="input-field-light pl-12" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="MM/YY" className="input-field-light" />
                  <input type="text" placeholder="CVC" className="input-field-light" />
                </div>
              </div>
            </div>
            <button onClick={handleFinalize} className="btn-primary w-full py-5 text-lg shadow-lg shadow-teal/20">
              PAY & BOOK NOW
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="py-24 bg-white min-h-screen">
      <div className="max-w-xl mx-auto px-4">
        {/* Stepper */}
        <div className="flex justify-between mb-16 relative">
          <div className="absolute top-4 left-0 right-0 h-[1px] bg-charcoal/10 -z-10" />
          {steps.map(step => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "step-indicator w-8 h-8 text-xs",
                currentStep === step.id ? "step-active" : 
                currentStep > step.id ? "step-completed" : "step-inactive"
              )}>
                {currentStep > step.id ? <Check size={14} /> : step.id}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40">{step.title}</span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="min-h-[450px]"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {currentStep > 1 && (
          <button 
            onClick={prevStep}
            className="mt-12 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-charcoal transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Previous Step
          </button>
        )}
      </div>
    </section>
  );
};
