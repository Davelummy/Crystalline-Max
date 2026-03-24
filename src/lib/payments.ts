import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import type { BookingRecord } from '@/types';

export function canPayNow(booking: BookingRecord) {
  if (booking.status === 'cancelled') {
    return false;
  }

  if (booking.paymentStatus !== 'pending') {
    return false;
  }

  return booking.status !== 'pending';
}

export function getPaymentDisplayLabel(booking: BookingRecord) {
  if (booking.paymentStatus === 'not_required') {
    return 'Paid offline';
  }

  if (booking.paymentStatus === 'paid') {
    return 'Paid';
  }

  return 'Pending payment';
}

export async function startCheckoutSession(bookingId: string) {
  const createSession = httpsCallable<{ bookingId: string }, { sessionUrl: string }>(
    functions,
    'createCheckoutSession',
  );
  const result = await createSession({ bookingId });
  window.location.href = result.data.sessionUrl;
}
