interface BookingNotificationInput {
  bookingId: string;
  serviceLabel: string;
  customerName: string;
  date: string;
  time?: string;
  timeWindow?: string;
}

export function getNotificationPayload(input: BookingNotificationInput) {
  const scheduleLabel = input.time || input.timeWindow || 'scheduled slot';

  return {
    title: `New job assigned: ${input.serviceLabel}`,
    body: `${input.customerName} on ${input.date} (${scheduleLabel})`,
    data: {
      bookingId: input.bookingId,
      path: '/staff/tasks',
    },
  };
}
