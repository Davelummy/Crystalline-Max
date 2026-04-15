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

function escHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

  return `
    <h2>You have been assigned a new job</h2>
    <p><strong>Customer:</strong> ${escHtml(input.customerName)}</p>
    <p><strong>Service:</strong> ${escHtml(input.serviceLabel)}</p>
    <p><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</p>
    <p><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</p>
    <p><strong>Add-ons:</strong> ${addons}</p>
    <p>Open the staff portal to review the job and prepare for arrival.</p>
  `;
}

export function getCustomerConfirmationEmailHtml(input: BookingNotificationInput & { total?: number | null }) {
  return `
    <h2>Your booking is confirmed</h2>
    <p><strong>Service:</strong> ${escHtml(input.serviceLabel)}</p>
    <p><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</p>
    <p><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</p>
    <p><strong>Estimated total:</strong> ${typeof input.total === 'number' ? `GBP ${input.total.toFixed(2)}` : 'To be confirmed'}</p>
    <p>You can track progress and payment from your customer portal.</p>
  `;
}

export function getCustomerCompletionEmailHtml(input: BookingNotificationInput) {
  return `
    <h2>Your job is complete</h2>
    <p><strong>Service:</strong> ${escHtml(input.serviceLabel)}</p>
    <p><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</p>
    <p>The team has completed the job and uploaded the completion record. Open your customer portal to review the result.</p>
  `;
}

export function getStaffReminderEmailHtml(input: BookingNotificationInput) {
  return `
    <h2>Reminder: upcoming job tomorrow</h2>
    <p><strong>Customer:</strong> ${escHtml(input.customerName)}</p>
    <p><strong>Service:</strong> ${escHtml(input.serviceLabel)}</p>
    <p><strong>Date:</strong> ${escHtml(getScheduleLabel(input))}</p>
    <p><strong>Location:</strong> ${escHtml(input.locationLabel || 'Location to be confirmed')}</p>
    <p>You must be on site to check in.</p>
  `;
}
