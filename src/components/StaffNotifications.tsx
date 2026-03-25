import React from 'react';
import { Bell, CalendarClock, CheckCircle2 } from 'lucide-react';
import { arrayUnion, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { formatSchedule, getStatusLabel, hasStaffAcknowledged, sortBookingsBySchedule } from '../lib/bookings';
import { subscribeToAssignedBookings } from '@/lib/assignedBookings';
import type { BookingRecord, View } from '../types';

interface StaffNotificationsProps {
  onNavigate: (view: View) => void;
}

export const StaffNotifications: React.FC<StaffNotificationsProps> = ({ onNavigate }) => {
  const [bookings, setBookings] = React.useState<BookingRecord[]>([]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribe = subscribeToAssignedBookings(auth.currentUser.uid, (records) => {
      setBookings(sortBookingsBySchedule(records));
    });

    return () => unsubscribe();
  }, []);

  const unread = bookings.filter((booking) => auth.currentUser && !hasStaffAcknowledged(booking, auth.currentUser.uid) && !['completed', 'cancelled'].includes(booking.status));

  const acknowledge = async (bookingId: string) => {
    await updateDoc(doc(db, 'bookings', bookingId), {
      staffAcknowledgedAt: serverTimestamp(),
      staffAcknowledgedByIds: arrayUnion(auth.currentUser?.uid || ''),
      updatedAt: serverTimestamp(),
    });
  };

  return (
    <div className="min-h-screen bg-charcoal pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <div>
            <h2 className="text-teal text-xs tracking-[0.4em] mb-4 uppercase">Staff Alerts</h2>
            <h3 className="text-4xl text-white font-display uppercase">Job Notifications</h3>
            <p className="text-white/60 mt-2 text-sm">
              New assignments appear here until they are acknowledged.
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/50 uppercase tracking-widest">Unread assignments</p>
            <p className="text-3xl font-display text-teal">{unread.length}</p>
          </div>
        </header>

        <div className="space-y-4">
          {bookings.length > 0 ? bookings.map((booking) => {
            const isUnread = auth.currentUser != null &&
              !hasStaffAcknowledged(booking, auth.currentUser.uid) &&
              !['completed', 'cancelled'].includes(booking.status);

            return (
              <div key={booking.id} className={`dark-card p-6 ${isUnread ? 'border-teal/30' : 'border-white/5'}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <Bell size={16} className={isUnread ? 'text-teal' : 'text-white/45'} />
                      <p className="text-xs font-bold uppercase tracking-widest text-white">{booking.customerName}</p>
                      {isUnread && <span className="rounded-full bg-teal/15 px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-teal">New job</span>}
                    </div>
                    <p className="mt-3 text-sm text-white/80">{booking.serviceLabel}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-white/55">
                      <span className="inline-flex items-center gap-1"><CalendarClock size={12} className="text-teal" /> {formatSchedule(booking)}</span>
                      <span>{booking.postcode}</span>
                      <span>{getStatusLabel(booking.status)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => void acknowledge(booking.id)}
                        className="btn-secondary px-5 py-3 border-white/15"
                      >
                        ACKNOWLEDGE
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onNavigate('tasks')}
                      className="btn-primary px-5 py-3 flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} /> OPEN TASKS
                    </button>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="dark-card p-8 text-white/50">
              No job alerts yet. Assigned work will appear here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
