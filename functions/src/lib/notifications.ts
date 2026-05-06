import { brandedEmailWrapper, escHtml } from './emailTemplates.js';

interface BookingNotificationInput {
  bookingId: string;
  serviceLabel: string;
  customerName: string;
  date: string;
  locationLabel?: string;
  addons?: string[];
  time?: string;
  timeWindow?: string;
}

export { escHtml };

export function getScheduleLabel(input: Pick<BookingNotificationInput, 'date' | 'time' | 'timeWindow'>) {
  const slot = input.time || input.timeWindow || 'scheduled slot';
  return `${input.date} (${slot})`;
}

export function getNotificationPayload(input: BookingNotificationInput) {
  const scheduleLabel = getScheduleLabel(input);

  return {
    title: `New job assigned: ${input.serviceLabel}`,
    body: `${input.customerName} on ${scheduleLabel}`,
    data: {
      bookingId: input.bookingId,
      path: '/staff/tasks',
    },
  };
}

export function getStaffAssignmentEmailHtml(input: BookingNotificationInput) {
  const addons = input.addons && input.addons.length > 0 ? escHtml(input.addons.join(', ')) : 'None';

  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">You have been assigned a new job</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:8px 0;color:#333"><strong>Customer:</strong> ${escHtml(input.customerName)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Service:</strong> ${escHtml(input.serviceLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Add-ons:</strong> ${addons}</td></tr>
    </table>
    <p style="margin:20px 0 0;color:#666">Open the staff portal to review the job and prepare for arrival.</p>`;

  return brandedEmailWrapper(content);
}

export function getCustomerConfirmationEmailHtml(input: BookingNotificationInput & { total?: number | null }) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Your booking is confirmed</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:8px 0;color:#333"><strong>Service:</strong> ${escHtml(input.serviceLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Estimated total:</strong> ${typeof input.total === 'number' ? `GBP ${input.total.toFixed(2)}` : 'To be confirmed'}</td></tr>
    </table>
    <p style="margin:20px 0 0;color:#666">You can track progress and payment from your customer portal.</p>`;

  return brandedEmailWrapper(content);
}

export function getCustomerCompletionEmailHtml(input: BookingNotificationInput) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Your job is complete</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:8px 0;color:#333"><strong>Service:</strong> ${escHtml(input.serviceLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</td></tr>
    </table>
    <p style="margin:20px 0 0;color:#666">The team has completed the job and uploaded the completion record. Open your customer portal to review the result.</p>`;

  return brandedEmailWrapper(content);
}

export function getStaffReminderEmailHtml(input: BookingNotificationInput) {
  const content = `
    <h2 style="margin:0 0 16px;font-size:22px;color:#0a0a0a">Reminder: upcoming job tomorrow</h2>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="padding:8px 0;color:#333"><strong>Customer:</strong> ${escHtml(input.customerName)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Service:</strong> ${escHtml(input.serviceLabel)}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</td></tr>
      <tr><td style="padding:8px 0;color:#333"><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</td></tr>
    </table>
    <p style="margin:20px 0 0;color:#666">You must be on site to check in.</p>`;

  return brandedEmailWrapper(content);
}
