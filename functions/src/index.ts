import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2/options';

setGlobalOptions({
  region: 'europe-west2',
  memory: '256MiB',
  maxInstances: 10,
});

initializeApp();

const db = getFirestore();

function getBookingOwnerId(data: unknown) {
  if (!data || typeof data !== 'object' || !('userId' in data) || typeof data.userId !== 'string') {
    return null;
  }

  return data.userId;
}

export const onBookingCreated = onDocumentCreated('bookings/{bookingId}', async (event) => {
  const booking = event.data?.data();
  const userId = getBookingOwnerId(booking);

  if (!userId) {
    return;
  }

  await db.doc(`users/${userId}`).set(
    {
      bookingCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});

export const onBookingCountDecrement = onDocumentUpdated('bookings/{bookingId}', async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) {
    return;
  }

  if (before.status === 'cancelled' || after.status !== 'cancelled') {
    return;
  }

  const userId = getBookingOwnerId(after) ?? getBookingOwnerId(before);
  if (!userId) {
    return;
  }

  await db.doc(`users/${userId}`).set(
    {
      bookingCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
});
