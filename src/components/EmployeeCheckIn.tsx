import React from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, LogOut, MapPin, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatSchedule, getAfterPhotos, getTaskProgressPercent, sortBookingsBySchedule } from '../lib/bookings';
import type { BookingRecord } from '../types';

const CHECKIN_RADIUS_METERS = 200;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function getDistanceMeters(
  originLat: number,
  originLng: number,
  targetLat: number,
  targetLng: number,
) {
  const earthRadius = 6371000;
  const dLat = toRadians(targetLat - originLat);
  const dLng = toRadians(targetLng - originLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(originLat)) *
      Math.cos(toRadians(targetLat)) *
      Math.sin(dLng / 2) ** 2;

  return Math.round(earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))));
}

function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}

function getActiveAssignment(bookings: BookingRecord[]) {
  const openBookings = sortBookingsBySchedule(
    bookings.filter((booking) => !['completed', 'cancelled'].includes(booking.status)),
  );

  return (
    openBookings.find((booking) => booking.status === 'in_progress') ??
    openBookings.find((booking) => booking.date === getTodayDateString()) ??
    null
  );
}

export const EmployeeCheckIn: React.FC = () => {
  const [status, setStatus] = React.useState<'in' | 'out' | 'unknown'>('unknown');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [lastAction, setLastAction] = React.useState<any>(null);
  const [assignedBookings, setAssignedBookings] = React.useState<BookingRecord[]>([]);
  const [assignmentLoading, setAssignmentLoading] = React.useState(true);
  const [distanceFromSite, setDistanceFromSite] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'checkins'),
      where('employeeUid', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const last = snapshot.docs
          .map((entry) => entry.data())
          .sort((left, right) => {
            const leftValue = left.timestamp?.toDate ? left.timestamp.toDate().getTime() : 0;
            const rightValue = right.timestamp?.toDate ? right.timestamp.toDate().getTime() : 0;
            return rightValue - leftValue;
          })[0];
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

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const bookingsQuery = query(collection(db, 'bookings'), where('assignedStaffId', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      setAssignedBookings(records);
      setAssignmentLoading(false);
    }, () => {
      setAssignmentLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const assignment = React.useMemo(() => {
    if (status === 'in' && lastAction?.bookingId) {
      return assignedBookings.find((booking) => booking.id === lastAction.bookingId) ?? getActiveAssignment(assignedBookings);
    }

    return getActiveAssignment(assignedBookings);
  }, [assignedBookings, lastAction, status]);

  const handleAction = async (type: 'in' | 'out') => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);

    try {
      let location = null;
      let matchedBookingId: string | null = null;
      let matchedBookingAddress: string | null = null;
      let matchedDistanceMeters: number | null = null;

      if (type === 'in' || type === 'out') {
        if (!assignment) {
          throw new Error(`No active booking is assigned for ${type === 'in' ? 'check-in' : 'check-out'}.`);
        }

        if (assignment.locationLat == null || assignment.locationLng == null) {
          throw new Error('This assignment has no verified map location. Ask admin to confirm the booking address.');
        }
      }

      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        });
        location = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        if (type === 'in' || type === 'out') {
          throw new Error(`Location access is required to check ${type === 'in' ? 'in' : 'out'} on site.`);
        }
        console.warn('Location access denied or timed out');
      }

      if (location && assignment?.locationLat != null && assignment?.locationLng != null) {
        matchedDistanceMeters = getDistanceMeters(
          location.latitude,
          location.longitude,
          assignment.locationLat,
          assignment.locationLng,
        );
        setDistanceFromSite(matchedDistanceMeters);

        if (matchedDistanceMeters > CHECKIN_RADIUS_METERS) {
          throw new Error(
            `You must be within ${CHECKIN_RADIUS_METERS}m of the assigned service location to check ${type === 'in' ? 'in' : 'out'}. Current distance: ${matchedDistanceMeters}m.`,
          );
        }

        matchedBookingId = assignment.id;
        matchedBookingAddress = assignment.locationLabel || assignment.address || assignment.postcode;
      }

      if (type === 'out' && assignment) {
        const progress = getTaskProgressPercent(assignment);
        const afterPhotos = getAfterPhotos(assignment);

        if (progress < 100) {
          throw new Error('Complete every task item before checking out.');
        }

        if (afterPhotos.length === 0) {
          throw new Error('Upload the end-of-job photos before checking out.');
        }

        if (assignment.status !== 'completed') {
          throw new Error('Mark the job complete in the Tasks view before checking out.');
        }
      }

      await addDoc(collection(db, 'checkins'), {
        employeeUid: auth.currentUser.uid,
        employeeName: auth.currentUser.displayName || auth.currentUser.email,
        type,
        timestamp: serverTimestamp(),
        location,
        bookingId: matchedBookingId,
        bookingAddress: matchedBookingAddress,
        distanceMeters: matchedDistanceMeters,
      });

    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'Permission denied or server error. Ensure you are logged in as an employee.');
    } finally {
      setLoading(false);
    }
  };

  if ((loading && status === 'unknown') || assignmentLoading) return <div className="pt-32 text-center">Syncing...</div>;

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

        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-left">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/45">Active assignment</p>
          {assignment ? (
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-sm font-bold uppercase tracking-widest text-white">{assignment.customerName}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal">{assignment.serviceLabel}</p>
              </div>
              <div className="space-y-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <p>{formatSchedule(assignment)}</p>
                <p className="flex items-start gap-2">
                  <MapPin size={12} className="mt-0.5 text-teal" />
                  <span>{assignment.locationLabel || assignment.address || assignment.postcode}</span>
                </p>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                On-site check-in and check-out are allowed only within {CHECKIN_RADIUS_METERS}m of this location.
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Check-out also requires every task item completed and the job marked complete.
              </p>
              {distanceFromSite != null && (
                <p className={`text-[10px] font-bold uppercase tracking-widest ${distanceFromSite <= CHECKIN_RADIUS_METERS ? 'text-teal' : 'text-red-500'}`}>
                  Last measured distance: {distanceFromSite}m
                </p>
              )}
            </div>
          ) : (
            <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/45">
              No active assignment found for today. Check-in stays disabled until an admin assigns a live job.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAction('in')}
            disabled={status === 'in' || loading || !assignment}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
              status === 'in' || !assignment
                ? 'bg-teal/5 border-teal/20 opacity-50 cursor-not-allowed' 
                : 'bg-white/5 border-white/10 hover:border-teal hover:bg-teal/10'
            }`}
          >
            <LogIn className={status === 'in' ? 'text-teal/40' : 'text-teal'} />
            <span className="text-[10px] font-bold tracking-widest uppercase">Check In</span>
          </button>

          <button 
            onClick={() => handleAction('out')}
            disabled={status === 'out' || loading || !assignment}
            className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
              status === 'out' || !assignment
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
            {lastAction.bookingAddress && (
              <p className="mt-3 text-[10px] text-white/40 uppercase tracking-widest">
                Site: {lastAction.bookingAddress}
              </p>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
