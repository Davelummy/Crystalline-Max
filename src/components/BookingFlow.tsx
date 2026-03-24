import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronRight, Check, Clock, LogIn, MapPin, Sparkles } from 'lucide-react';
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getAuthErrorMessage, signInWithGoogle } from '../lib/auth';
import { cn } from '@/lib/utils';
import { auth, db } from '../firebase';
import { MapLocationPicker } from './MapLocationPicker';
import { CAR_ADDONS, HOME_ADDONS, SERVICES } from '../constants';
import { getAddonLabel, getServiceById } from '../lib/bookings';
import type { AppUserData, BookingLocationSelection } from '../types';

const steps = [
  { id: 1, title: 'Service' },
  { id: 2, title: 'Add-ons' },
  { id: 3, title: 'Location' },
  { id: 4, title: 'Time' },
  { id: 5, title: 'Account' },
  { id: 6, title: 'Confirm' },
];

interface BookingFlowProps {
  initialServiceId?: string;
  onComplete?: () => void;
}

interface BookingSelection {
  serviceId: string;
  addons: string[];
  address: string;
  city: string;
  postcode: string;
  locationLabel: string;
  locationLat: number | null;
  locationLng: number | null;
  locationVerified: boolean;
  date: string;
  time: string;
  timeWindow: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ initialServiceId, onComplete }) => {
  const [currentStep, setCurrentStep] = React.useState(initialServiceId ? 2 : 1);
  const [user, setUser] = React.useState(auth.currentUser);
  const [userData, setUserData] = React.useState<AppUserData | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authLoading, setAuthLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selection, setSelection] = React.useState<BookingSelection>({
    serviceId: initialServiceId || '',
    addons: [],
    address: '',
    city: 'Manchester',
    postcode: '',
    locationLabel: '',
    locationLat: null,
    locationLng: null,
    locationVerified: false,
    time: '',
    timeWindow: '',
    date: new Date().toISOString().split('T')[0],
  });

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setUserData(null);
        return;
      }

      const userDoc = await getDoc(doc(db, 'users', nextUser.uid));
      setUserData(userDoc.exists() ? (userDoc.data() as AppUserData) : null);
    });

    return () => unsubscribe();
  }, []);

  const selectedService = getServiceById(selection.serviceId);
  const isDetailing = selectedService?.type === 'car';
  const availableAddons =
    selectedService?.type === 'car'
      ? CAR_ADDONS
      : selectedService?.type === 'home'
        ? HOME_ADDONS
        : [];

  const total = React.useMemo(() => {
    if (!selectedService) return 0;

    const addonsTotal = selection.addons.reduce((sum, id) => {
      const addon = availableAddons.find((item) => item.id === id);
      return sum + (addon?.price || 0);
    }, 0);
    const baseTotal = selectedService.basePrice + addonsTotal;
    const bookingCount = userData?.bookingCount || 0;

    if (bookingCount === 0) return baseTotal * 0.9;
    if (bookingCount >= 3) return baseTotal * 0.95;
    return baseTotal;
  }, [availableAddons, selectedService, selection.addons, userData?.bookingCount]);

  const nextStep = () => {
    if (currentStep === 4 && user) {
      setCurrentStep(6);
      return;
    }
    setCurrentStep((step) => Math.min(step + 1, 6));
  };

  const prevStep = () => {
    if (currentStep === 6 && user) {
      setCurrentStep(4);
      return;
    }
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const toggleAddon = (id: string) => {
    setSelection((prev) => ({
      ...prev,
      addons: prev.addons.includes(id)
        ? prev.addons.filter((addonId) => addonId !== id)
        : [...prev.addons, id],
    }));
  };

  const selectedLocation = React.useMemo<BookingLocationSelection | null>(() => {
    if (
      selection.locationLat == null ||
      selection.locationLng == null ||
      !selection.locationVerified
    ) {
      return null;
    }

    return {
      address: selection.address,
      city: selection.city,
      postcode: selection.postcode,
      locationLabel: selection.locationLabel,
      locationLat: selection.locationLat,
      locationLng: selection.locationLng,
      locationVerified: selection.locationVerified,
    };
  }, [selection]);

  const handleSocialLogin = async () => {
    setAuthLoading(true);
    setError(null);

    try {
      const result = await signInWithGoogle('customer');
      if (!result?.user) return;
      setCurrentStep(6);
    } catch (authError) {
      console.error('Login failed:', authError);
      setError(getAuthErrorMessage(authError));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!user || !selectedService) {
      setError('Sign in to continue with your booking request.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const userRef = doc(db, 'users', user.uid);
      const latestUserDoc = await getDoc(userRef);

      if (!latestUserDoc.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: 'client',
          bookingCount: 0,
          onboarded: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await addDoc(collection(db, 'bookings'), {
        userId: user.uid,
        customerName: user.displayName || user.email || 'Crystalline Max Customer',
        customerEmail: user.email,
        serviceId: selectedService.id,
        serviceLabel: selectedService.label,
        addons: selection.addons,
        address: selection.address,
        city: selection.city,
        postcode: selection.postcode,
        locationLabel: selection.locationLabel,
        locationLat: selection.locationLat,
        locationLng: selection.locationLng,
        locationVerified: selection.locationVerified,
        date: selection.date,
        time: selection.time,
        timeWindow: selection.timeWindow,
        total: Number(total.toFixed(2)),
        status: 'pending',
        paymentStatus: 'pending',
        assignedStaffId: null,
        assignedStaffName: null,
        assignedAt: null,
        staffAcknowledgedAt: null,
        completedTaskIds: [],
        taskProgressPercent: 0,
        startedAt: null,
        completedAt: null,
        lastProgressAt: null,
        beforePhotoUrl: null,
        beforePhotoPath: null,
        afterPhotoUrl: null,
        afterPhotoPath: null,
        beforePhotos: [],
        afterPhotos: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setIsSuccess(true);
      window.setTimeout(() => {
        onComplete?.();
      }, 2500);
    } catch (bookingError) {
      console.error('Booking failed:', bookingError);
      setError('The booking could not be saved. Check your Firebase rules and try again.');
    } finally {
      setSubmitting(false);
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
        <h2 className="text-4xl font-display uppercase mb-4">Booking Request Received</h2>
        <p className="text-charcoal/60 max-w-md mb-8">
          Your booking has been saved as pending. You can review it in your customer portal while your team confirms the schedule and payment.
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
              {SERVICES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelection((prev) => ({ ...prev, serviceId: item.id, addons: [] }));
                    nextStep();
                  }}
                  className={cn(
                    'w-full p-6 flex items-center justify-between frost-card-light hover:border-teal transition-all group',
                    selection.serviceId === item.id && 'border-teal bg-teal/5',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-silver/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                      <item.icon className="text-teal" size={24} />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold uppercase tracking-wider">{item.label}</span>
                      <span className="text-xs text-charcoal/40 uppercase tracking-widest">
                        Starting from £{item.basePrice}
                      </span>
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
                {availableAddons.map((addon) => (
                  <button
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={cn(
                      'w-full p-5 flex items-center justify-between frost-card-light transition-all',
                      selection.addons.includes(addon.id) ? 'border-teal bg-teal/5' : 'hover:border-teal/30',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'w-5 h-5 rounded border flex items-center justify-center',
                          selection.addons.includes(addon.id) ? 'bg-teal border-teal' : 'border-charcoal/20',
                        )}
                      >
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
            <MapLocationPicker
              value={selectedLocation}
              onChange={(location) => {
                setSelection((prev) => ({
                  ...prev,
                  ...location,
                }));
              }}
            />
            <button
              onClick={nextStep}
              disabled={!selectedLocation}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CONFIRM LOCATION
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl mb-2 font-display uppercase">Select Schedule</h3>
            <p className="text-sm text-charcoal/50">Choose the date and the slot you want us to review.</p>
            <input
              type="date"
              className="input-field-light"
              value={selection.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(event) => setSelection((prev) => ({ ...prev, date: event.target.value }))}
            />
            <div className="grid grid-cols-1 gap-3">
              {isDetailing ? (
                <div className="grid grid-cols-2 gap-3">
                  {['08:00', '10:30', '13:00', '15:30', '18:00'].map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelection((prev) => ({ ...prev, time, timeWindow: '' }));
                        nextStep();
                      }}
                      className={cn(
                        'p-4 text-sm font-bold frost-card-light hover:border-teal transition-all',
                        selection.time === time && 'border-teal bg-teal/5',
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
                    { id: 'evening', label: 'Evening', window: '16:00 - 20:00' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelection((prev) => ({ ...prev, timeWindow: item.id, time: '' }));
                        nextStep();
                      }}
                      className={cn(
                        'w-full p-6 flex items-center justify-between frost-card-light hover:border-teal transition-all',
                        selection.timeWindow === item.id && 'border-teal bg-teal/5',
                      )}
                    >
                      <div className="text-left">
                        <span className="block font-bold uppercase tracking-wider">{item.label}</span>
                        <span className="text-[10px] text-charcoal/40 uppercase tracking-widest">{item.window}</span>
                      </div>
                      <Clock size={16} className="text-teal" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8 text-center">
            <div className="w-20 h-20 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn size={40} />
            </div>
            <h3 className="text-2xl uppercase font-display tracking-wider">Sign In To Save Your Booking</h3>
            <p className="text-charcoal/60 text-sm max-w-sm mx-auto">
              Bookings are tied to a customer account so you can track status, billing, and future discounts.
            </p>
            <button
              onClick={handleSocialLogin}
              disabled={authLoading}
              className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <LogIn size={18} /> {authLoading ? 'SYNCING ACCOUNT...' : 'CONTINUE WITH GOOGLE'}
            </button>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-2xl mb-6 font-display uppercase">Confirm Booking Request</h3>
            <div className="frost-card-light p-6 space-y-4 border-teal/20">
              <div className="flex justify-between text-xs">
                <span className="text-charcoal/60 uppercase tracking-widest">Service</span>
                <span className="font-bold uppercase">{selectedService?.label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal/60 uppercase tracking-widest">Schedule</span>
                <span className="font-bold uppercase">
                  {selection.time || selection.timeWindow || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-charcoal/60 uppercase tracking-widest">Location</span>
                <span className="font-bold uppercase text-right">{selection.locationLabel || selection.postcode}</span>
              </div>
              {selection.addons.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] text-charcoal/40 uppercase tracking-widest">Add-ons</span>
                  {selection.addons.map((addonId) => (
                    <div key={addonId} className="flex justify-between text-[10px]">
                      <span className="text-charcoal/60 uppercase tracking-widest">
                        {getAddonLabel(selection.serviceId, addonId)}
                      </span>
                      <span className="font-bold">Included</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between text-lg pt-4 border-t border-charcoal/5">
                <span className="text-charcoal/60 uppercase font-display">Estimated Total</span>
                <span className="text-teal font-bold">£{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="rounded-2xl border border-teal/20 bg-teal/5 p-5 text-sm text-charcoal/70">
              No card is captured in this local build. Submitting creates a pending booking in Firestore so you can test the customer, staff, and admin flows end-to-end.
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-500">
                {error}
              </div>
            )}

            <button
              onClick={handleFinalize}
              disabled={submitting}
              className="btn-primary w-full py-5 text-lg shadow-lg shadow-teal/20 disabled:opacity-50"
            >
              {submitting ? 'SUBMITTING...' : 'CREATE BOOKING REQUEST'}
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
        <div className="flex justify-between mb-16 relative">
          <div className="absolute top-4 left-0 right-0 h-[1px] bg-charcoal/10 -z-10" />
          {steps.map((step) => (
            <div key={step.id} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  'step-indicator w-8 h-8 text-xs',
                  currentStep === step.id ? 'step-active' : currentStep > step.id ? 'step-completed' : 'step-inactive',
                )}
              >
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
