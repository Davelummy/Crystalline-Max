import React from 'react';
import { ArrowLeft, CreditCard, ReceiptText } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { formatSchedule, getStatusLabel, sortBookingsByCreatedAt } from '../lib/bookings';
import type { BookingRecord } from '../types';

interface CustomerBillingProps {
  user: { uid: string } | null;
  onBack: () => void;
}

export const CustomerBilling: React.FC<CustomerBillingProps> = ({ user, onBack }) => {
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
    }, () => setLoading(false));

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="min-h-screen bg-silver/10 pt-32 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-charcoal/40 hover:text-teal transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <header className="mb-12">
          <h2 className="text-teal text-xs tracking-[0.3em] mb-2 uppercase font-bold">Billing History</h2>
          <h3 className="text-4xl font-display uppercase tracking-wider">Payments & Quotes</h3>
        </header>

        <div className="space-y-4">
          {loading ? (
            <div className="frost-card-light p-8 text-sm text-charcoal/50">Loading billing history...</div>
          ) : bookings.length > 0 ? bookings.map((booking) => (
            <div key={booking.id} className="frost-card-light p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-charcoal/5 flex items-center justify-center">
                  <ReceiptText size={20} className="text-teal" />
                </div>
                <div>
                  <p className="font-bold uppercase">{booking.serviceLabel}</p>
                  <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">{formatSchedule(booking)}</p>
                  <p className="text-[10px] text-charcoal/40 uppercase tracking-widest mt-1">{getStatusLabel(booking.status)}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] text-charcoal/40 uppercase tracking-widest mb-1">Payment State</p>
                <p className="font-bold uppercase flex items-center gap-2 sm:justify-end">
                  <CreditCard size={14} className="text-teal" /> {booking.paymentStatus}
                </p>
                <p className="text-2xl font-display text-teal mt-2">£{booking.total.toFixed(2)}</p>
              </div>
            </div>
          )) : (
            <div className="frost-card-light p-8 text-sm text-charcoal/50">
              No billing records yet. Create a booking to populate this view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
