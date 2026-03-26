import React from 'react';
import { ArrowLeft, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { collection, doc, onSnapshot, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  formatSchedule,
  getAfterPhotos,
  getAssignedStaffIds,
  getAssignedStaffLabel,
  getBeforePhotos,
  getBookingTasks,
  getCompletedTaskIds,
  getStatusLabel,
  getTaskProgressPercent,
} from '@/lib/bookings';
import type { AppUserData, BookingPhoto, BookingRecord, CheckIn } from '@/types';
import { PhotoGalleryOverlay } from './PhotoGalleryOverlay';

interface AdminBookingDetailProps {
  bookingId: string;
  onBack: () => void;
}

export const AdminBookingDetail: React.FC<AdminBookingDetailProps> = ({ bookingId, onBack }) => {
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [checkins, setCheckins] = React.useState<CheckIn[]>([]);
  const [staff, setStaff] = React.useState<AppUserData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<{ title: string; photos: BookingPhoto[] } | null>(null);
  const [paymentBusy, setPaymentBusy] = React.useState(false);
  const [actionBusy, setActionBusy] = React.useState(false);

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
    const staffQuery = query(collection(db, 'users'), where('role', '==', 'employee'));
    const unsubscribe = onSnapshot(staffQuery, (snapshot) => {
      setStaff(snapshot.docs.map((entry) => entry.data() as AppUserData));
    });

    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (getAssignedStaffIds(booking).length === 0) {
      setCheckins([]);
      return;
    }

    const checkinsQuery = query(collection(db, 'checkins'), where('bookingId', '==', bookingId));
    const unsubscribe = onSnapshot(checkinsQuery, (snapshot) => {
      const entries = snapshot.docs.map((entry) => ({ id: entry.id, ...(entry.data() as Omit<CheckIn, 'id'>) }));
      entries.sort((left, right) => {
        const leftValue = typeof left.timestamp === 'string'
          ? new Date(left.timestamp).getTime()
          : ((left.timestamp as { seconds?: number } | undefined)?.seconds ?? 0) * 1000;
        const rightValue = typeof right.timestamp === 'string'
          ? new Date(right.timestamp).getTime()
          : ((right.timestamp as { seconds?: number } | undefined)?.seconds ?? 0) * 1000;
        return rightValue - leftValue;
      });
      setCheckins(entries);
    });

    return () => unsubscribe();
  }, [booking, bookingId]);

  const beforePhotos = getBeforePhotos(booking);
  const afterPhotos = getAfterPhotos(booking);
  const tasks = booking ? getBookingTasks(booking.serviceId, booking.addons) : [];
  const completed = new Set(getCompletedTaskIds(booking));
  const assignedStaffIds = getAssignedStaffIds(booking);
  const canManageAssignment = booking != null && ['pending', 'confirmed'].includes(booking.status);
  const canCancel = booking != null && ['pending', 'confirmed'].includes(booking.status);
  const canConfirm = booking?.status === 'pending';

  const updateBooking = async (payload: Partial<BookingRecord>) => {
    if (!booking) {
      return;
    }

    setActionBusy(true);
    setError(null);

    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
    } catch (bookingError) {
      console.error('Admin booking update failed:', bookingError);
      setError('Booking update could not be saved.');
    } finally {
      setActionBusy(false);
    }
  };

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

  const handleConfirmBooking = async () => {
    await updateBooking({
      status: 'confirmed',
    });
  };

  const handleCancelBooking = async () => {
    if (!booking || !window.confirm('Cancel this booking? This cannot be undone.')) {
      return;
    }

    await updateBooking({
      status: 'cancelled',
      cancelledBy: 'admin',
      cancelledAt: serverTimestamp(),
      assignedStaffId: null,
      assignedStaffName: null,
      assignedStaffIds: [],
      assignedStaffNames: [],
      assignedAt: null,
      staffAcknowledgedAt: null,
      staffAcknowledgedByIds: [],
    });
  };

  const handleAssignChange = async (staffId: string) => {
    if (!booking) {
      return;
    }

    const currentIds = getAssignedStaffIds(booking);
    const nextIds = currentIds.includes(staffId)
      ? currentIds.filter((id) => id !== staffId)
      : [...currentIds, staffId];
    const selectedStaff = staff.filter((member) => nextIds.includes(member.uid));
    const nextStatus = nextIds.length > 0
      ? (booking.status === 'pending' ? 'confirmed' : booking.status)
      : 'pending';

    await updateBooking({
      assignedStaffId: selectedStaff[0]?.uid || null,
      assignedStaffName: selectedStaff[0]?.displayName || selectedStaff[0]?.email || null,
      assignedStaffIds: nextIds,
      assignedStaffNames: selectedStaff.map((member) => member.displayName || member.email),
      assignedAt: nextIds.length > 0 ? serverTimestamp() : null,
      staffAcknowledgedAt: null,
      staffAcknowledgedByIds: [],
      status: nextStatus,
    });
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
                    <p className="flex items-center gap-2"><Users size={16} className="text-teal" /> {getAssignedStaffLabel(booking)}</p>
                  </div>
                  <div className="mt-6 grid gap-3 text-sm text-white/68 sm:grid-cols-2">
                    <p>{booking.customerEmail}</p>
                    <p>{booking.address}, {booking.city}, {booking.postcode}</p>
                    <p>Total quoted: £{booking.total.toFixed(2)}</p>
                    <p>Add-ons: {booking.addons.length > 0 ? booking.addons.length : 'None'}</p>
                  </div>
                  {booking.cancelledBy && (
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-red-400">
                      Cancelled by {booking.cancelledBy}
                    </p>
                  )}
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
              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Assigned Team</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {staff.map((member) => {
                      const selected = assignedStaffIds.includes(member.uid);
                      return (
                        <button
                          key={member.uid}
                          type="button"
                          onClick={() => void handleAssignChange(member.uid)}
                          disabled={!canManageAssignment || actionBusy}
                          className={`rounded-xl border px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border-teal bg-teal/10 text-teal' : 'border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white'}`}
                        >
                          {member.displayName || member.email}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-4 text-[10px] font-bold uppercase tracking-widest text-white/60">
                    {getAssignedStaffLabel(booking)}
                  </div>
                </div>
                {booking.status !== 'cancelled' && (
                  <div className="flex flex-wrap gap-3">
                    {canConfirm && (
                      <button
                        type="button"
                        onClick={() => void handleConfirmBooking()}
                        disabled={actionBusy}
                        className="rounded-xl bg-teal px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-charcoal transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionBusy ? 'Saving...' : 'Confirm Booking'}
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => void handleCancelBooking()}
                        disabled={actionBusy}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-red-300 transition-colors hover:border-red-400 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionBusy ? 'Saving...' : 'Cancel Booking'}
                      </button>
                    )}
                  </div>
                )}
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
                        <span className={completed.has(task.id) ? 'text-teal' : 'text-white/55'}>
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
