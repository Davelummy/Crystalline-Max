import React from 'react';
import { Calendar, ChevronRight, Clock, FileText, MapPin, Repeat, User } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { formatSchedule, getAfterPhotos, getBeforePhotos, getPrimaryAfterPhotoUrl, getPrimaryBeforePhotoUrl, getStatusLabel, getTaskProgressPercent, hasJobCompleted, hasJobStarted, isUpcomingBooking, sortBookingsByCreatedAt, sortBookingsBySchedule } from '../lib/bookings';
import { getActivePromotion } from '../lib/promotions';
import { PhotoGalleryOverlay } from './PhotoGalleryOverlay';
import type { AppUserData, BookingPhoto, BookingRecord, View } from '../types';

interface CustomerDashboardProps {
  onNavigate: (view: View) => void;
  user: { uid: string; displayName?: string | null } | null;
  userData: AppUserData | null;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onNavigate, user, userData }) => {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [galleryState, setGalleryState] = React.useState<{ title: string; photos: BookingPhoto[] } | null>(null);

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
  const upcoming = scheduled.find((booking) => booking.status === 'in_progress') ??
    scheduled.find((booking) => isUpcomingBooking(booking)) ??
    null;
  const activePromotion = getActivePromotion();
  const pastBookings = bookings.filter((booking) => booking.id !== upcoming?.id).slice(0, 5);
  const beforePhotos = upcoming ? getBeforePhotos(upcoming) : [];
  const afterPhotos = upcoming ? getAfterPhotos(upcoming) : [];

  return (
    <div className="min-h-screen bg-silver/10 pt-24 pb-12">
      {galleryState && (
        <PhotoGalleryOverlay
          title={galleryState.title}
          photos={galleryState.photos}
          onClose={() => setGalleryState(null)}
        />
      )}
      <div className="max-w-4xl mx-auto px-4">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-6 mb-12">
          <div>
            <h2 className="text-teal text-xs tracking-widest mb-2 uppercase">Welcome Back</h2>
            <h3 className="text-3xl uppercase">
              {userData?.displayName || user?.displayName || 'Valued Client'}
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs text-charcoal/60 uppercase font-bold">Loyalty Status</p>
            <p className="text-2xl font-display text-teal">
              {userData?.bookingCount === 0 ? '10% OFF NEXT' :
               (userData?.bookingCount || 0) >= 3 ? '5% OFF ACTIVE' :
               `${Math.max(0, 3 - (userData?.bookingCount || 0))} TO 5% OFF`}
            </p>
            {activePromotion && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-charcoal/60">
                {activePromotion.label} · Ends {activePromotion.endsOn}
              </p>
            )}
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="md:col-span-2 space-y-6">
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/60">Upcoming Booking</h4>
            <div className="dark-card p-8 relative overflow-hidden">
              {loading ? (
                <p className="text-white/60 uppercase tracking-widest text-xs">Loading bookings...</p>
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
                  {(hasJobStarted(upcoming) || upcoming.status === 'confirmed') && (
                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/65">
                        <span>Live progress</span>
                        <span>{getTaskProgressPercent(upcoming)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${getTaskProgressPercent(upcoming)}%` }} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] font-bold uppercase tracking-widest text-white/65">
                          <p>Before Photo</p>
                          {getPrimaryBeforePhotoUrl(upcoming) ? (
                            <>
                              <img src={getPrimaryBeforePhotoUrl(upcoming)!} alt="Before service" className="mt-3 h-24 w-full rounded-lg object-cover" />
                              <button
                                type="button"
                                onClick={() => setGalleryState({ title: 'Before Photos', photos: beforePhotos })}
                                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:border-teal hover:text-teal transition-colors"
                              >
                                View Gallery ({beforePhotos.length})
                              </button>
                            </>
                          ) : (
                            <p className="mt-3">Pending</p>
                          )}
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-[10px] font-bold uppercase tracking-widest text-white/65">
                          <p>After Photo</p>
                          {getPrimaryAfterPhotoUrl(upcoming) && hasJobCompleted(upcoming) ? (
                            <>
                              <img src={getPrimaryAfterPhotoUrl(upcoming)!} alt="After service" className="mt-3 h-24 w-full rounded-lg object-cover" />
                              <button
                                type="button"
                                onClick={() => setGalleryState({ title: 'After Photos', photos: afterPhotos })}
                                className="mt-3 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-white/80 hover:border-teal hover:text-teal transition-colors"
                              >
                                View Gallery ({afterPhotos.length})
                              </button>
                            </>
                          ) : (
                            <p className="mt-3">Pending</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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

            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/60 pt-6">Recent Activity</h4>
            <div className="space-y-3">
              {pastBookings.length > 0 ? pastBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => onNavigate('billing')}
                  className="frost-card-light p-4 flex justify-between items-center hover:bg-white transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-charcoal/5 rounded-lg flex items-center justify-center">
                      <Calendar size={18} className="text-charcoal/60" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase">{booking.serviceLabel}</p>
                      <p className="text-[10px] text-charcoal/60 uppercase">{formatSchedule(booking)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-sm font-bold">{getStatusLabel(booking.status)}</span>
                    <ChevronRight size={16} className="text-charcoal/55" />
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
            <h4 className="text-sm font-bold uppercase tracking-widest text-charcoal/60">Quick Actions</h4>
            <button onClick={() => onNavigate('booking')} className="w-full btn-primary flex items-center justify-center gap-2 py-6">
              <Repeat size={18} /> NEW BOOKING
            </button>
            <button onClick={() => onNavigate('quote')} className="w-full btn-secondary flex items-center justify-center gap-2 py-6 border-charcoal/10 hover:border-teal/50">
              <FileText size={18} /> REQUEST QUOTE
            </button>
            <button onClick={() => onNavigate('profile')} className="w-full btn-secondary flex items-center justify-center gap-2 py-6 border-charcoal/10 hover:border-teal/50">
              <User size={18} /> EDIT PROFILE
            </button>

            <div className="frost-card-light p-6">
              <h5 className="text-xs font-bold uppercase tracking-widest mb-4">Account Summary</h5>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/60 uppercase tracking-widest text-[10px]">Bookings</span>
                  <span className="font-bold">{bookings.length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/60 uppercase tracking-widest text-[10px]">Phone</span>
                  <span className="font-bold">{userData?.phoneNumber || 'Not set'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-charcoal/60 uppercase tracking-widest text-[10px]">Primary Area</span>
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
