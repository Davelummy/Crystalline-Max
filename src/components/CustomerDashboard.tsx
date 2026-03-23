import React from 'react';
import { Calendar, ChevronRight, Clock, MapPin, Repeat, User } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { formatSchedule, getStatusLabel, isUpcomingBooking, sortBookingsByCreatedAt, sortBookingsBySchedule } from '../lib/bookings';
import type { AppUserData, BookingRecord, View } from '../types';

interface CustomerDashboardProps {
  onNavigate: (view: View) => void;
  user: { uid: string; displayName?: string | null } | null;
  userData: AppUserData | null;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate, user, userData }) => {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;

    const bookingsQuery = query(collection(db, 'bookings'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const records = snapshot.docs.map((entry) => ({
        id: entry.id,
        ...(entry.data() as Omit<BookingRecord, 'id'>),
      }));
      setBookings(sortBookingsByCreatedAt(records));
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const scheduled = sortBookingsBySchedule(bookings);
  const upcoming = scheduled.find((booking) => isUpcomingBooking(booking)) ?? null;
  const pastBookings = bookings.filter((booking) => booking.id !== upcoming?.id).slice(0, 5);

  return (
    <div className="min-h-screen bg-silver/10 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
          <div>
            <h2 className="text-teal text-xs tracking-widest mb-2 uppercase">Welcome Back</h2>
            <h3 className="text-3xl uppercase">
              {userData?.displayName || user?.displayName || 'Valued Client'}
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-charcoal/40 uppercase font-bold">Loyalty Status</p>
            <p className="text-2xl font-display text-teal">
              {userData?.bookingCount === 0 ? '10% OFF NEXT' :
               (userData?.bookingCount || 0) >= 3 ? '5% OFF ACTIVE' :
               `${Math.max(0, 3 - (userData?.bookingCount || 0))} TO 5% OFF`}
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Upcoming Booking</h4>
            <div className="dark-card p-8 relative overflow-hidden">
              {loading ? (
                <p className="text-white/40 uppercase tracking-widest text-xs">Loading bookings...</p>
              ) : upcoming ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-8">
                    <div>
                      <p className="text-teal text-xs font-bold uppercase tracking-widest mb-2">{upcoming.serviceLabel}</p>
                      <p className="text-3xl font-display uppercase">{formatSchedule(upcoming)}</p>
                    </div>
                    <button onClick={() => onNavigate('booking')} className="btn-primary py-2 px-4 text-xs">
                      NEW BOOKING
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-teal" /> {upcoming.postcode}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-teal" /> {getStatusLabel(upcoming.status)}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-white/70">You do not have an upcoming booking yet.</p>
                  <button onClick={() => onNavigate('booking')} className="btn-primary py-2 px-4 text-xs">
                    CREATE YOUR FIRST BOOKING
                  </button>
                </div>
              )}
            </div>

            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40 pt-6">Recent Activity</h4>
            <div className="space-y-3">
              {pastBookings.length > 0 ? pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onNavigate('billing')}
                  className="frost-card-light p-4 flex justify-between items-center hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-charcoal/5 rounded-lg flex items-center justify-center">
                      <Calendar size={18} className="text-charcoal/40" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase">{booking.serviceLabel}</p>
                      <p className="text-[10px] text-charcoal/40 uppercase">{formatSchedule(booking)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold">{getStatusLabel(booking.status)}</span>
                    <ChevronRight size={16} className="text-charcoal/20" />
                  </div>
                </div>
              )) : (
                <div className="frost-card-light p-6 text-sm text-charcoal/50">
                  Completed and past bookings will appear here after you start using the app.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/40">Quick Actions</h4>
            <button onClick={() => onNavigate('booking')} className="w-full btn-primary flex items-center justify-center gap-2 py-6">
              <Repeat size={18} /> NEW BOOKING
            </button>
            <button onClick={() => onNavigate('profile')} className="w-full btn-secondary flex items-center justify-center gap-2 py-6 border-charcoal/10 hover:border-teal/50">
              <User size={18} /> EDIT PROFILE
            </button>

            <div className="frost-card-light p-6">
              <h5 className="text-xs font-bold uppercase tracking-widest mb-4">Account Summary</h5>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/40 uppercase tracking-widest text-[10px]">Bookings</span>
                  <span className="font-bold">{bookings.length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/40 uppercase tracking-widest text-[10px]">Phone</span>
                  <span className="font-bold">{userData?.phoneNumber || 'Not set'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/40 uppercase tracking-widest text-[10px]">Primary Area</span>
                  <span className="font-bold">{userData?.postcode || 'Not set'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
