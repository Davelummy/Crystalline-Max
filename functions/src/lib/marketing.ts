// ---------------------------------------------------------------------------
// Marketing & engagement Cloud Functions for Crystalline Max
// ---------------------------------------------------------------------------

import { createHmac } from 'crypto';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { Resend } from 'resend';
import {
  brandedEmailWrapper,
  escHtml,
  getAdminBroadcastEmailTemplate,
  getFollowUpEmailTemplate,
  getQuoteReminderEmailTemplate,
  getReEngagementEmailTemplate,
  getWelcomeEmailTemplate,
} from './emailTemplates.js';

function getDb() {
  return getFirestore();
}

const resendApiKey = defineSecret('RESEND_API_KEY');
const unsubscribeSecret = defineSecret('UNSUBSCRIBE_SECRET');
const appOrigin = defineString('APP_ORIGIN', { default: 'http://localhost:3000' });
const FUNCTIONS_REGION = 'europe-west2';

const NOTIFICATION_FROM = 'Crystalline Max Ltd <admin@ctmds.co.uk>';
const BATCH_SIZE = 20; // emails per batch to stay within rate limits

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isConfiguredSecret(secret: string) {
  return Boolean(secret) && !secret.includes('placeholder');
}

function getString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function getResendClient(secret: string) {
  return new Resend(secret);
}

async function sendMarketingEmail(input: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isConfiguredSecret(input.apiKey)) {
    console.log(`Skipping email "${input.subject}" — RESEND_API_KEY not configured.`);
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resend = getResendClient(input.apiKey);

  try {
    await resend.emails.send({
      from: NOTIFICATION_FROM,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Marketing email failed for "${input.subject}"`, error);
    return { success: false, error: message };
  }
}

function generateUnsubscribeToken(uid: string, secret: string): string {
  return createHmac('sha256', secret).update(uid).digest('hex');
}

function getUnsubscribeUrl(uid: string, secret: string): string {
  const token = generateUnsubscribeToken(uid, secret);
  const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'crystalline-max-dolumide-2026';
  return `https://${FUNCTIONS_REGION}-${projectId}.cloudfunctions.net/handleUnsubscribe?uid=${encodeURIComponent(uid)}&token=${encodeURIComponent(token)}`;
}

function getUkDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

// ---------------------------------------------------------------------------
// 1. onFirstBooking — send welcome email on first booking
// ---------------------------------------------------------------------------

export const onFirstBooking = onDocumentCreated(
  { document: 'bookings/{bookingId}', region: FUNCTIONS_REGION, secrets: [resendApiKey, unsubscribeSecret] },
  async (event) => {
    const booking = event.data?.data();
    if (!booking) return;

    const userId = getString(booking.userId);
    const customerEmail = getString(booking.customerEmail);
    const customerName = getString(booking.customerName) || 'there';

    if (!userId || !customerEmail) return;

    const userRef = getDb().doc(`users/${userId}`);
    const userSnapshot = await userRef.get();
    const userData = userSnapshot.data();

    // Only send welcome email once
    if (userData?.welcomeEmailSent) return;

    // Update lastBookingDate + welcomeEmailSent atomically
    await userRef.set(
      {
        lastBookingDate: FieldValue.serverTimestamp(),
        welcomeEmailSent: true,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const origin = appOrigin.value();
    const bookingUrl = `${origin}/customer/bookings/${event.params.bookingId}`;
    const unsub = getUnsubscribeUrl(userId, unsubscribeSecret.value());

    const template = getWelcomeEmailTemplate({
      customerName,
      bookingUrl,
      unsubscribeUrl: unsub,
    });

    const result = await sendMarketingEmail({
      apiKey: resendApiKey.value(),
      to: customerEmail,
      subject: template.subject,
      html: template.html,
    });

    console.log('Welcome email', { userId, success: result.success });
  },
);

// ---------------------------------------------------------------------------
// 2. onBookingCompleted — queue follow-up email 2 days after completion
// ---------------------------------------------------------------------------

export const onBookingCompleted = onDocumentUpdated(
  { document: 'bookings/{bookingId}', region: FUNCTIONS_REGION },
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) return;
    if (before.status === 'completed' || after.status !== 'completed') return;

    const userId = getString(after.userId);
    const customerEmail = getString(after.customerEmail);
    const customerName = getString(after.customerName) || 'Customer';
    const serviceName = getString(after.serviceLabel) || 'service';

    if (!userId || !customerEmail) return;

    // Update lastBookingDate
    await getDb().doc(`users/${userId}`).set(
      { lastBookingDate: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );

    // Schedule a follow-up email for 2 days from now
    const scheduledFor = Timestamp.fromDate(addDays(new Date(), 2));

    await getDb().collection('scheduledEmails').add({
      type: 'follow-up',
      bookingId: event.params.bookingId,
      userId,
      recipientEmail: customerEmail,
      recipientName: customerName,
      serviceName,
      scheduledFor,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log('Follow-up email scheduled', { bookingId: event.params.bookingId });
  },
);

// ---------------------------------------------------------------------------
// 3. processScheduledEmails — run every hour, send due emails
// ---------------------------------------------------------------------------

export const processScheduledEmails = onSchedule(
  { schedule: 'every 1 hours', timeZone: 'Europe/London', region: FUNCTIONS_REGION, secrets: [resendApiKey, unsubscribeSecret] },
  async () => {
    const now = Timestamp.now();
    const snapshot = await getDb()
      .collection('scheduledEmails')
      .where('status', '==', 'pending')
      .where('scheduledFor', '<=', now)
      .limit(100)
      .get();

    if (snapshot.empty) {
      console.log('No scheduled emails to process.');
      return;
    }

    const apiKey = resendApiKey.value();
    const secret = unsubscribeSecret.value();
    const origin = appOrigin.value();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const emailRef = doc.ref;

      // Check marketing preference
      const userSnapshot = await getDb().doc(`users/${data.userId}`).get();
      const userData = userSnapshot.data();

      if (userData?.emailPreferences?.marketing === false) {
        await emailRef.update({ status: 'skipped', sentAt: FieldValue.serverTimestamp() });
        continue;
      }

      const unsub = getUnsubscribeUrl(data.userId, secret);
      let template: { subject: string; html: string };

      if (data.type === 'follow-up') {
        template = getFollowUpEmailTemplate({
          customerName: data.recipientName || 'there',
          serviceName: data.serviceName || 'service',
          bookAgainUrl: `${origin}/customer/booking`,
          unsubscribeUrl: unsub,
        });
      } else {
        // Unknown type — skip
        await emailRef.update({ status: 'skipped', sentAt: FieldValue.serverTimestamp() });
        continue;
      }

      const result = await sendMarketingEmail({
        apiKey,
        to: data.recipientEmail,
        subject: template.subject,
        html: template.html,
      });

      await emailRef.update({
        status: result.success ? 'sent' : 'failed',
        error: result.error || null,
        sentAt: FieldValue.serverTimestamp(),
      });
    }
  },
);

// ---------------------------------------------------------------------------
// 4. sendReEngagementEmails — Mondays 10 AM, inactive 30+ days
// ---------------------------------------------------------------------------

export const sendReEngagementEmails = onSchedule(
  { schedule: 'every monday 10:00', timeZone: 'Europe/London', region: FUNCTIONS_REGION, secrets: [resendApiKey, unsubscribeSecret] },
  async () => {
    const thirtyDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 30));
    const oneMonthAgoTimestamp = Timestamp.fromDate(subtractDays(new Date(), 30));

    // Find clients who haven't booked in 30+ days and haven't received re-engagement in 30 days
    const snapshot = await getDb()
      .collection('users')
      .where('role', '==', 'client')
      .where('emailPreferences.marketing', '!=', false)
      .where('lastBookingDate', '<=', thirtyDaysAgo)
      .limit(50)
      .get();

    if (snapshot.empty) {
      console.log('No inactive customers to re-engage.');
      return;
    }

    const apiKey = resendApiKey.value();
    const secret = unsubscribeSecret.value();
    const origin = appOrigin.value();

    const popularServices = [
      { name: 'Full Car Detail', price: 'from £149' },
      { name: 'Home Deep Clean', price: 'from £50' },
      { name: 'Office Clean', price: 'from £150' },
    ];

    let sentCount = 0;

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();

      // Throttle: skip if re-engagement sent within last 30 days
      if (userData.lastReEngagementEmailSent) {
        const lastSent = userData.lastReEngagementEmailSent as Timestamp;
        if (lastSent.toDate() > oneMonthAgoTimestamp.toDate()) {
          continue;
        }
      }

      const email = getString(userData.email);
      const name = getString(userData.displayName) || 'there';

      if (!email) continue;

      const unsub = getUnsubscribeUrl(userDoc.id, secret);

      const template = getReEngagementEmailTemplate({
        customerName: name,
        bookNowUrl: `${origin}/book`,
        services: popularServices,
        unsubscribeUrl: unsub,
      });

      const result = await sendMarketingEmail({
        apiKey,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      if (result.success) {
        await getDb().doc(`users/${userDoc.id}`).update({
          lastReEngagementEmailSent: FieldValue.serverTimestamp(),
        });
        sentCount++;
      }

      if (sentCount >= BATCH_SIZE) break;
    }

    console.log(`Re-engagement emails sent: ${sentCount}`);
  },
);

// ---------------------------------------------------------------------------
// 5. sendQuoteReminders — Daily 9 AM, open quotes older than 3 days
// ---------------------------------------------------------------------------

export const sendQuoteReminders = onSchedule(
  { schedule: 'every day 09:00', timeZone: 'Europe/London', region: FUNCTIONS_REGION, secrets: [resendApiKey, unsubscribeSecret] },
  async () => {
    const threeDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 3));

    const snapshot = await getDb()
      .collection('quoteRequests')
      .where('status', '==', 'open')
      .where('createdAt', '<=', threeDaysAgo)
      .where('reminderSent', '!=', true)
      .limit(50)
      .get();

    if (snapshot.empty) {
      console.log('No quote reminders to send.');
      return;
    }

    const apiKey = resendApiKey.value();
    const secret = unsubscribeSecret.value();
    const origin = appOrigin.value();

    for (const quoteDoc of snapshot.docs) {
      const data = quoteDoc.data();
      const email = getString(data.email) || getString(data.customerEmail);
      const name = getString(data.name) || getString(data.customerName) || 'there';
      const serviceName = getString(data.serviceLabel) || getString(data.serviceName) || 'your requested service';
      const userId = getString(data.userId);

      if (!email) continue;

      const unsub = userId
        ? getUnsubscribeUrl(userId, secret)
        : '';

      const serviceId = getString(data.serviceId) || '';
      const bookUrl = `${origin}/book/${serviceId}`;

      const template = getQuoteReminderEmailTemplate({
        customerName: name,
        serviceName,
        bookUrl,
        unsubscribeUrl: unsub,
      });

      const result = await sendMarketingEmail({
        apiKey,
        to: email,
        subject: template.subject,
        html: template.html,
      });

      if (result.success) {
        await quoteDoc.ref.update({ reminderSent: true });
      }
    }
  },
);

// ---------------------------------------------------------------------------
// 6. sendBroadcastEmail — Admin callable
// ---------------------------------------------------------------------------

export const sendBroadcastEmail = onCall(
  { region: FUNCTIONS_REGION, secrets: [resendApiKey, unsubscribeSecret] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be signed in.');
    }

    // Verify admin role
    const adminSnapshot = await getDb().doc(`users/${request.auth.uid}`).get();
    const adminData = adminSnapshot.data();

    if (!adminData || adminData.role !== 'admin') {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }

    const payload = request.data as Record<string, unknown>;
    const campaignName = getString(payload?.campaignName) || 'Untitled Campaign';
    const subject = getString(payload?.subject);
    const bodyHtml = getString(payload?.bodyHtml);
    const audience = getString(payload?.audience) || 'all';
    const ctaText = getString(payload?.ctaText) || undefined;
    const ctaUrl = getString(payload?.ctaUrl) || undefined;

    if (!subject || !bodyHtml) {
      throw new HttpsError('invalid-argument', 'subject and bodyHtml are required.');
    }

    // Build audience query
    let query = getDb().collection('users')
      .where('role', '==', 'client')
      .where('emailPreferences.marketing', '!=', false);

    if (audience === 'inactive_30d') {
      const thirtyDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 30));
      query = query.where('lastBookingDate', '<=', thirtyDaysAgo);
    } else if (audience === 'recent_30d') {
      const thirtyDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 30));
      query = query.where('lastBookingDate', '>=', thirtyDaysAgo);
    } else if (audience === 'new') {
      query = query.where('bookingCount', '==', 1);
    }

    const recipientSnapshot = await query.get();

    // Create campaign record
    const campaignRef = await getDb().collection('campaigns').add({
      name: campaignName,
      subject,
      bodyHtml,
      audience,
      ctaText: ctaText || null,
      ctaUrl: ctaUrl || null,
      recipientCount: recipientSnapshot.size,
      sentCount: 0,
      failedCount: 0,
      status: 'sending',
      createdBy: request.auth.uid,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send emails
    const apiKey = resendApiKey.value();
    const secret = unsubscribeSecret.value();
    let sentCount = 0;
    let failedCount = 0;

    for (const userDoc of recipientSnapshot.docs) {
      const userData = userDoc.data();
      const email = getString(userData.email);
      const name = getString(userData.displayName) || 'there';

      if (!email) {
        failedCount++;
        continue;
      }

      const unsub = getUnsubscribeUrl(userDoc.id, secret);
      const template = getAdminBroadcastEmailTemplate({
        customerName: name,
        bodyHtml,
        ctaText,
        ctaUrl,
        unsubscribeUrl: unsub,
      });

      const result = await sendMarketingEmail({
        apiKey,
        to: email,
        subject,
        html: template.html,
      });

      if (result.success) {
        sentCount++;
      } else {
        failedCount++;
      }
    }

    // Update campaign
    await campaignRef.update({
      sentCount,
      failedCount,
      status: 'completed',
      completedAt: FieldValue.serverTimestamp(),
    });

    return { campaignId: campaignRef.id, sentCount, failedCount };
  },
);

// ---------------------------------------------------------------------------
// 7. getAudienceCount — Preview audience size for admin UI
// ---------------------------------------------------------------------------

export const getAudienceCount = onCall(
  { region: FUNCTIONS_REGION },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Must be signed in.');
  }

  const adminSnapshot = await getDb().doc(`users/${request.auth.uid}`).get();
  const adminData = adminSnapshot.data();

  if (!adminData || adminData.role !== 'admin') {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }

  const audience = getString(request.data?.audience) || 'all';

  let query = getDb().collection('users')
    .where('role', '==', 'client')
    .where('emailPreferences.marketing', '!=', false);

  if (audience === 'inactive_30d') {
    const thirtyDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 30));
    query = query.where('lastBookingDate', '<=', thirtyDaysAgo);
  } else if (audience === 'recent_30d') {
    const thirtyDaysAgo = Timestamp.fromDate(subtractDays(new Date(), 30));
    query = query.where('lastBookingDate', '>=', thirtyDaysAgo);
  } else if (audience === 'new') {
    query = query.where('bookingCount', '==', 1);
  }

  const countSnapshot = await query.count().get();

  return { count: countSnapshot.data().count };
  },
);

// ---------------------------------------------------------------------------
// 8. handleUnsubscribe — One-click HMAC-verified unsubscribe (GET)
// ---------------------------------------------------------------------------

export const handleUnsubscribe = onRequest(
  { region: FUNCTIONS_REGION, secrets: [unsubscribeSecret] },
  async (request, response) => {
    const uid = getString(request.query.uid);
    const token = getString(request.query.token);

    if (!uid || !token) {
      response.status(400).send(renderUnsubscribePage('Invalid unsubscribe link.', false));
      return;
    }

    const expectedToken = generateUnsubscribeToken(uid, unsubscribeSecret.value());

    if (token !== expectedToken) {
      response.status(403).send(renderUnsubscribePage('Invalid or expired unsubscribe link.', false));
      return;
    }

    try {
      await getDb().doc(`users/${uid}`).set(
        {
          emailPreferences: {
            marketing: false,
            unsubscribedAt: FieldValue.serverTimestamp(),
          },
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

      response.status(200).send(renderUnsubscribePage('You have been unsubscribed from marketing emails.', true));
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      response.status(500).send(renderUnsubscribePage('Something went wrong. Please try again later.', false));
    }
  },
);

function renderUnsubscribePage(message: string, success: boolean): string {
  const icon = success ? '&#10003;' : '&#10007;';
  const color = success ? '#00F5D4' : '#ef4444';

  return brandedEmailWrapper(`
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:48px;color:${color};margin-bottom:16px">${icon}</div>
      <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">${success ? 'Unsubscribed' : 'Error'}</h2>
      <p style="margin:0;color:#666">${escHtml(message)}</p>
      ${success ? '<p style="margin:16px 0 0;font-size:13px;color:#999">You will continue to receive transactional emails about your bookings.</p>' : ''}
    </div>
  `);
}
