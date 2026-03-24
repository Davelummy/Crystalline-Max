import React from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  formatSchedule,
  getAfterPhotos,
  getBeforePhotos,
  getBookingTasks,
  getCompletedTaskIds,
  getStatusLabel,
  getTaskProgressPercent,
} from '@/lib/bookings';
import type { BookingPhoto, BookingRecord, CheckIn } from '@/types';
import { PhotoGalleryOverlay } from './PhotoGalleryOverlay';

interface AdminBookingDetailProps {
  bookingId: string;
  onBack: () => void;
}

export const AdminBookingDetail: React.FC<AdminBookingDetailProps> = ({ bookingId, onBack }) => {
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [checkins, setCheckins] = React.useState<CheckIn[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<{ title: string; photos: BookingPhoto[] } | null>(null);
  const [paymentBusy, setPaymentBusy] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeBooking = onSnapshot(
      doc(db, 'bookings', bookingId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setBooking(null);
          setLoading(false);
          setError('Booking not found.');
          return;
        }

        const nextBooking = { id: snapshot.id, ...(snapshot.data() as Omit<BookingRecord, 'id'>) };
        setBooking(nextBooking);
        setLoading(false);
        setError(null);
      },
      () => {
        setLoading(false);
        setError('Booking could not be loaded.');
      },
    );

    return () => unsubscribeBooking();
  }, [bookingId]);

  React.useEffect(() => {
    if (!booking?.assignedStaffId) {
      setCheckins([]);
      return;
    }

    const checkinsQuery = query(collection(db, 'checkins'), where('bookingId', '==', bookingId));
    const unsubscribe = onSnapshot(checkinsQuery, (snapshot) => {
      setCheckins(snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CheckIn, 'id'>) })));
    });

    return () => unsubscribe();
  }, [booking?.assignedStaffId, bookingId]);

  const beforePhotos = getBeforePhotos(booking);
  const afterPhotos = getAfterPhotos(booking);
  const tasks = booking ? getBookingTasks(booking.serviceId, booking.addons) : [];
  const completed = new Set(getCompletedTaskIds(booking));

  const handleMarkOfflinePayment = async () => {
    if (!booking) {
      return;
    }

    setPaymentBusy(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        paymentStatus: 'not_required',
        adminNote: 'Payment collected offline',
        updatedAt: serverTimestamp(),
      });
    } catch (paymentError) {
      console.error('Offline payment override failed:', paymentError);
      setError('Payment override could not be saved.');
    } finally {
      setPaymentBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-charcoal px-4 pb-20 pt-32 text-white">
      {gallery && (
        <PhotoGalleryOverlay
          title={gallery.title}
          photos={gallery.photos}
          onClose={() => setGallery(null)}
        />
      )}
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/50 transition-colors hover:text-teal"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {loading ? (
          <div className="dark-card p-8 text-sm text-white/55">Loading booking...</div>
        ) : error || !booking ? (
          <div className="dark-card p-8 text-sm text-red-500">{error || 'Booking not found.'}</div>
        ) : (
          <div className="space-y-6">
            <div className="dark-card p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-teal text-xs font-bold uppercase tracking-widest">{booking.serviceLabel}</p>
                  <h1 className="mt-3 text-3xl font-display uppercase">{booking.customerName}</h1>
                  <div className="mt-6 grid gap-3 text-sm text-white/68 sm:grid-cols-2 lg:grid-cols-4">
                    <p className="flex items-center gap-2"><Calendar size={16} className="text-teal" /> {booking.date}</p>
                    <p className="flex items-center gap-2"><Clock size={16} className="text-teal" /> {formatSchedule(booking)}</p>
                    <p className="flex items-center gap-2"><MapPin size={16} className="text-teal" /> {booking.locationLabel || booking.postcode}</p>
                    <p className="flex items-center gap-2"><Users size={16} className="text-teal" /> {booking.assignedStaffName || 'Unassigned'}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Status</p>
                  <p className="mt-2 text-lg font-bold uppercase">{getStatusLabel(booking.status)}</p>
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/50">Payment</p>
                  <p className="mt-2 text-lg font-bold uppercase">{booking.paymentStatus}</p>
                  {booking.paymentStatus === 'paid' && booking.paymentAmount != null && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                      Stripe amount: £{(booking.paymentAmount / 100).toFixed(2)}
                    </p>
                  )}
                  {booking.paymentStatus === 'not_required' && booking.adminNote && (
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/55">
                      {booking.adminNote}
                    </p>
                  )}
                  {booking.paymentStatus === 'pending' && (
                    <button
                      type="button"
                      onClick={() => void handleMarkOfflinePayment()}
                      disabled={paymentBusy}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentBusy ? 'Saving...' : 'Mark Cash / Offline'}
                    </button>
                  )}
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/50">Progress</p>
                  <p className="mt-2 text-lg font-bold uppercase">{getTaskProgressPercent(booking)}%</p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="dark-card p-6 lg:col-span-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Task Checklist</p>
                <div className="mt-4 space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span>{task.title}</span>
                        <span className={completed.has(task.id) ? 'text-teal' : 'text-white/35'}>
                          {completed.has(task.id) ? 'Done' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dark-card p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Before Photos</p>
                {beforePhotos.length > 0 ? (
                  <>
                    <img src={beforePhotos[0].url} alt="Before service" className="mt-4 h-56 w-full rounded-2xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery({ title: 'Before Photos', photos: beforePhotos })}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-teal hover:text-teal"
                    >
                      View Gallery ({beforePhotos.length})
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-white/55">No before photos uploaded yet.</p>
                )}
              </div>

              <div className="dark-card p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">After Photos</p>
                {afterPhotos.length > 0 ? (
                  <>
                    <img src={afterPhotos[afterPhotos.length - 1].url} alt="After service" className="mt-4 h-56 w-full rounded-2xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery({ title: 'After Photos', photos: afterPhotos })}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:border-teal hover:text-teal"
                    >
                      View Gallery ({afterPhotos.length})
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-white/55">No after photos uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="dark-card p-6">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Check-In Log</p>
              <div className="mt-4 space-y-3">
                {checkins.length > 0 ? checkins.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="uppercase">{entry.type}</span>
                      <span className="text-white/50">{entry.distanceMeters != null ? `${entry.distanceMeters}m` : 'Distance unavailable'}</span>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-white/55">No check-ins recorded for this booking yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
