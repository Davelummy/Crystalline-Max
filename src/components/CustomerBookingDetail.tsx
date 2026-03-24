import React from 'react';
import { ArrowLeft, Calendar, Clock, CreditCard, MapPin } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  formatSchedule,
  getAfterPhotos,
  getBeforePhotos,
  getStatusLabel,
  getTaskProgressPercent,
} from '@/lib/bookings';
import { canPayNow, getPaymentDisplayLabel, startCheckoutSession } from '@/lib/payments';
import type { BookingPhoto, BookingRecord } from '@/types';
import { PhotoGalleryOverlay } from './PhotoGalleryOverlay';

interface CustomerBookingDetailProps {
  bookingId: string;
  onBack: () => void;
}

export const CustomerBookingDetail: React.FC<CustomerBookingDetailProps> = ({ bookingId, onBack }) => {
  const [booking, setBooking] = React.useState<BookingRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<{ title: string; photos: BookingPhoto[] } | null>(null);
  const [paymentError, setPaymentError] = React.useState<string | null>(null);
  const [openingCheckout, setOpeningCheckout] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'bookings', bookingId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setBooking(null);
          setLoading(false);
          setError('Booking not found.');
          return;
        }

        setBooking({ id: snapshot.id, ...(snapshot.data() as Omit<BookingRecord, 'id'>) });
        setLoading(false);
        setError(null);
      },
      () => {
        setLoading(false);
        setError('Booking could not be loaded.');
      },
    );

    return () => unsubscribe();
  }, [bookingId]);

  const beforePhotos = getBeforePhotos(booking);
  const afterPhotos = getAfterPhotos(booking);
  const paymentState = React.useMemo(() => {
    if (typeof window === 'undefined') {
      return null;
    }

    return new URLSearchParams(window.location.search).get('payment');
  }, []);

  const handlePay = async () => {
    if (!booking) {
      return;
    }

    setOpeningCheckout(true);
    setPaymentError(null);

    try {
      await startCheckoutSession(booking.id);
    } catch (checkoutError) {
      console.error('Checkout session failed:', checkoutError);
      setPaymentError(checkoutError instanceof Error ? checkoutError.message : 'Payment session could not be created.');
      setOpeningCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-silver/10 pt-32 pb-12">
      {gallery && (
        <PhotoGalleryOverlay
          title={gallery.title}
          photos={gallery.photos}
          onClose={() => setGallery(null)}
        />
      )}
      <div className="mx-auto max-w-4xl px-4">
        <button
          type="button"
          onClick={onBack}
          className="mb-8 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/45 transition-colors hover:text-teal"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {loading ? (
          <div className="frost-card-light p-8 text-sm text-charcoal/55">Loading booking...</div>
        ) : error || !booking ? (
          <div className="frost-card-light p-8 text-sm text-red-500">{error || 'Booking not found.'}</div>
        ) : (
          <div className="space-y-6">
            {paymentState === 'success' && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
                Payment completed successfully. The booking record will update as soon as Stripe confirms the session.
              </div>
            )}
            {paymentState === 'cancelled' && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
                Payment was cancelled before completion. You can retry from this booking once you are ready.
              </div>
            )}
            {paymentError && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
                {paymentError}
              </div>
            )}
            <div className="dark-card p-8">
              <p className="text-teal text-xs font-bold uppercase tracking-widest">{booking.serviceLabel}</p>
              <h1 className="mt-3 text-3xl font-display uppercase">{booking.customerName}</h1>
              <div className="mt-6 grid gap-3 text-sm text-white/68 sm:grid-cols-3">
                <p className="flex items-center gap-2"><Calendar size={16} className="text-teal" /> {booking.date}</p>
                <p className="flex items-center gap-2"><Clock size={16} className="text-teal" /> {formatSchedule(booking)}</p>
                <p className="flex items-center gap-2"><MapPin size={16} className="text-teal" /> {booking.locationLabel || booking.postcode}</p>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-white/70">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 uppercase tracking-widest">
                  <CreditCard size={14} className="text-teal" />
                  {getPaymentDisplayLabel(booking)}
                </span>
                {canPayNow(booking) && (
                  <button
                    type="button"
                    onClick={() => void handlePay()}
                    disabled={openingCheckout}
                    className="rounded-xl bg-teal px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-charcoal transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingCheckout ? 'Opening Checkout...' : 'Pay Now'}
                  </button>
                )}
              </div>
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-white/55">
                  <span>{getStatusLabel(booking.status)}</span>
                  <span>{getTaskProgressPercent(booking)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${getTaskProgressPercent(booking)}%` }} />
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="frost-card-light p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/45">Before Photos</p>
                {beforePhotos.length > 0 ? (
                  <>
                    <img src={beforePhotos[0].url} alt="Before service" className="mt-4 h-48 w-full rounded-2xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery({ title: 'Before Photos', photos: beforePhotos })}
                      className="mt-4 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-charcoal transition-colors hover:border-teal hover:text-teal"
                    >
                      View Gallery ({beforePhotos.length})
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-charcoal/55">No before photos uploaded yet.</p>
                )}
              </div>

              <div className="frost-card-light p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/45">After Photos</p>
                {afterPhotos.length > 0 ? (
                  <>
                    <img src={afterPhotos[afterPhotos.length - 1].url} alt="After service" className="mt-4 h-48 w-full rounded-2xl object-cover" />
                    <button
                      type="button"
                      onClick={() => setGallery({ title: 'After Photos', photos: afterPhotos })}
                      className="mt-4 w-full rounded-xl border border-charcoal/10 bg-charcoal/5 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-charcoal transition-colors hover:border-teal hover:text-teal"
                    >
                      View Gallery ({afterPhotos.length})
                    </button>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-charcoal/55">No after photos uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
