import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';
import { defineSecret } from 'firebase-functions/params';
import Stripe from 'stripe';
import { getAddonLabel, getBookingTasks } from './lib/bookings.js';
import { getDistanceMeters } from './lib/distance.js';

setGlobalOptions({
  region: 'europe-west2',
  memory: '256MiB',
  maxInstances: 10,
});

initializeApp();

const db = getFirestore();
const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

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

function getHeaderString(value: unknown) {
  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0];
  }

  return null;
}

function getOriginFromHeader(value: unknown) {
  const header = getHeaderString(value);
  if (!header) {
    return null;
  }

  try {
    return new URL(header).origin;
  } catch {
    return header.replace(/\/$/, '');
  }
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

function getStripeClient(secret: string) {
  return new Stripe(secret);
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

export const createCheckoutSession = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const payload = asRecord(request.data);
  const bookingId = getString(payload?.bookingId);

  if (!bookingId) {
    throw new HttpsError('invalid-argument', 'bookingId is required.');
  }

  const bookingSnapshot = await db.doc(`bookings/${bookingId}`).get();
  if (!bookingSnapshot.exists) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  const booking = asRecord(bookingSnapshot.data());
  if (!booking) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  if (booking.userId !== request.auth.uid) {
    throw new HttpsError('permission-denied', 'Not your booking.');
  }

  if (booking.paymentStatus === 'paid') {
    throw new HttpsError('already-exists', 'Booking is already paid.');
  }

  if (booking.paymentStatus === 'not_required') {
    throw new HttpsError('failed-precondition', 'Booking is marked for offline payment.');
  }

  const amount = getNumber(booking.total);
  const serviceLabel = getString(booking.serviceLabel);
  const customerEmail = getString(booking.customerEmail);
  const serviceId = getString(booking.serviceId) ?? '';
  const addons = getStringArray(booking.addons);
  const origin =
    getOriginFromHeader(request.rawRequest.headers.origin) ||
    getOriginFromHeader(request.rawRequest.headers.referer) ||
    'http://localhost:3000';

  if (amount == null || !serviceLabel || !customerEmail) {
    throw new HttpsError('failed-precondition', 'Booking is missing payment details.');
  }

  const addonLabels = addons.map((addonId) => getAddonLabel(serviceId, addonId));
  const stripe = getStripeClient(stripeSecret.value());
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'gbp',
          unit_amount: Math.round(amount * 100),
          product_data: {
            name: serviceLabel,
            description: addonLabels.length > 0 ? `Add-ons: ${addonLabels.join(', ')}` : undefined,
          },
        },
      },
    ],
    metadata: {
      bookingId,
      userId: request.auth.uid,
    },
    success_url: `${origin}/customer/bookings/${bookingId}?payment=success`,
    cancel_url: `${origin}/customer/billing?payment=cancelled`,
  });

  if (!session.url) {
    throw new HttpsError('internal', 'Stripe did not return a checkout URL.');
  }

  return { sessionUrl: session.url };
});

export const stripeWebhook = onRequest({ secrets: [stripeSecret, stripeWebhookSecret] }, async (request, response) => {
  const signature = request.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    response.status(400).send('Missing Stripe signature.');
    return;
  }

  let event: Stripe.Event;
  const stripe = getStripeClient(stripeSecret.value());

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, signature, stripeWebhookSecret.value());
  } catch (error) {
    response.status(400).send(`Webhook error: ${error instanceof Error ? error.message : 'unknown'}`);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = getString(session.metadata?.bookingId);

    if (bookingId) {
      const bookingRef = db.doc(`bookings/${bookingId}`);
      const bookingSnapshot = await bookingRef.get();
      const booking = bookingSnapshot.data();

      if (booking && booking.paymentStatus !== 'paid') {
        await bookingRef.update({
          paymentStatus: 'paid',
          paymentSessionId: session.id,
          paymentAmount: session.amount_total ?? null,
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }
  }

  response.json({ received: true });
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
