import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { getBookingTasks } from './lib/bookings.js';
import { getDistanceMeters } from './lib/distance.js';

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

function asRecord(value: unknown) {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function getString(value: unknown) {
  return typeof value === 'string' ? value : null;
}

function getNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function getAfterPhotoCount(data: Record<string, unknown>) {
  const afterPhotos = data.afterPhotos;
  if (Array.isArray(afterPhotos)) {
    return afterPhotos.length;
  }

  return getString(data.afterPhotoUrl) ? 1 : 0;
}

function isEmployeeRole(value: unknown) {
  return value === 'employee';
}

export const validateCheckin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const userSnapshot = await db.doc(`users/${request.auth.uid}`).get();
  const userData = userSnapshot.data();

  if (!userData || !isEmployeeRole(userData.role)) {
    throw new HttpsError('permission-denied', 'Employee access is required.');
  }

  const payload = asRecord(request.data);
  const bookingId = getString(payload?.bookingId);
  const type = getString(payload?.type);
  const latitude = getNumber(payload?.latitude);
  const longitude = getNumber(payload?.longitude);

  if (!bookingId || (type !== 'in' && type !== 'out') || latitude == null || longitude == null) {
    throw new HttpsError('invalid-argument', 'bookingId, type, latitude, and longitude are required.');
  }

  const bookingSnapshot = await db.doc(`bookings/${bookingId}`).get();
  if (!bookingSnapshot.exists) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  const booking = asRecord(bookingSnapshot.data());
  if (!booking) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  if (booking.assignedStaffId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'This booking is not assigned to you.');
  }

  const targetLat = getNumber(booking.locationLat);
  const targetLng = getNumber(booking.locationLng);
  if (targetLat == null || targetLng == null) {
    throw new HttpsError('failed-precondition', 'This booking has no verified map coordinates.');
  }

  const distance = getDistanceMeters(latitude, longitude, targetLat, targetLng);
  const radius = 200;

  if (distance > radius) {
    throw new HttpsError(
      'failed-precondition',
      `You must be within ${radius}m of the job site. Currently ${distance}m away.`,
    );
  }

  if (type === 'out') {
    if (booking.status !== 'completed') {
      throw new HttpsError('failed-precondition', 'Job must be marked complete first.');
    }

    if (getAfterPhotoCount(booking) === 0) {
      throw new HttpsError('failed-precondition', 'Upload after photos first.');
    }

    const tasks = getBookingTasks(
      getString(booking.serviceId) ?? '',
      getStringArray(booking.addons),
    );
    const completedTaskIds = new Set(getStringArray(booking.completedTaskIds));
    const hasIncompleteTasks = tasks.some((task) => !completedTaskIds.has(task.id));

    if (hasIncompleteTasks) {
      throw new HttpsError('failed-precondition', 'All tasks must be completed first.');
    }
  }

  await db.collection('checkins').add({
    employeeUid: request.auth.uid,
    employeeName: getString(request.auth.token.name) || request.auth.token.email || null,
    type,
    timestamp: FieldValue.serverTimestamp(),
    location: {
      latitude,
      longitude,
    },
    bookingId,
    bookingAddress: getString(booking.locationLabel) || getString(booking.address) || null,
    distanceMeters: distance,
    serverValidated: true,
  });

  return { success: true };
});

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
