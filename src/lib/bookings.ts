import { CAR_ADDONS, HOME_ADDONS, SERVICES } from '../constants';
import type { BookingPhoto, BookingRecord, BookingStatus, StaffTask } from '../types';

const SERVICE_TASKS: Record<string, StaffTask[]> = {
  'car-full': [
    { id: 'wash', title: 'Exterior pressure wash', category: 'Detailing', priority: 'high' },
    { id: 'interior', title: 'Interior vacuum and dust', category: 'Detailing', priority: 'high' },
    { id: 'paint', title: 'Paint correction pass', category: 'Detailing', priority: 'medium' },
    { id: 'finish', title: 'Final glass and trim finish', category: 'Detailing', priority: 'medium' },
  ],
  'car-exterior': [
    { id: 'wash', title: 'Exterior wash and rinse', category: 'Detailing', priority: 'high' },
    { id: 'polish', title: 'Polish and seal finish', category: 'Detailing', priority: 'medium' },
    { id: 'wheels', title: 'Wheel and tire dressing', category: 'Detailing', priority: 'medium' },
  ],
  'car-interior': [
    { id: 'vacuum', title: 'Full vacuum and mat reset', category: 'Detailing', priority: 'high' },
    { id: 'steam', title: 'Steam clean high-contact areas', category: 'Detailing', priority: 'high' },
    { id: 'finish', title: 'Dashboard and trim finish', category: 'Detailing', priority: 'medium' },
  ],
  home: [
    { id: 'kitchen', title: 'Kitchen sanitization', category: 'Residential', priority: 'high' },
    { id: 'bathroom', title: 'Bathroom deep clean', category: 'Residential', priority: 'high' },
    { id: 'surfaces', title: 'Living area surfaces', category: 'Residential', priority: 'medium' },
  ],
  office: [
    { id: 'desks', title: 'Desk and device sanitization', category: 'Commercial', priority: 'high' },
    { id: 'common', title: 'Common area cleaning', category: 'Commercial', priority: 'medium' },
    { id: 'waste', title: 'Waste and restroom reset', category: 'Commercial', priority: 'medium' },
  ],
  industrial: [
    { id: 'inspection', title: 'Safety inspection', category: 'Industrial', priority: 'high' },
    { id: 'floor', title: 'Floor and surface clean', category: 'Industrial', priority: 'high' },
    { id: 'equipment', title: 'Equipment wipe-down', category: 'Industrial', priority: 'medium' },
  ],
};

export function getServiceById(serviceId: string) {
  return SERVICES.find((service) => service.id === serviceId) ?? null;
}

export function serviceRequiresQuote(serviceId: string) {
  return Boolean(getServiceById(serviceId)?.requiresQuote);
}

export function getAddonLabel(serviceId: string, addonId: string) {
  const service = getServiceById(serviceId);
  const addons = service?.type === 'car' ? CAR_ADDONS : service?.type === 'home' ? HOME_ADDONS : [];
  return addons.find((addon) => addon.id === addonId)?.label ?? addonId;
}

export function getBookingTasks(serviceId: string, addons: string[] = []) {
  const serviceTasks = SERVICE_TASKS[serviceId] ?? [];
  const addonTasks = addons.map<StaffTask>((addonId) => ({
    id: `addon-${addonId}`,
    title: getAddonLabel(serviceId, addonId),
    category: 'Add-on',
    priority: 'medium',
  }));

  return [...serviceTasks, ...addonTasks];
}

export function getCompletedTaskIds(booking: Pick<BookingRecord, 'completedTaskIds'> | null) {
  return booking?.completedTaskIds ?? [];
}

export function getTaskProgressPercent(booking: Pick<BookingRecord, 'serviceId' | 'addons' | 'completedTaskIds' | 'taskProgressPercent'>) {
  if (typeof booking.taskProgressPercent === 'number' && Number.isFinite(booking.taskProgressPercent)) {
    return booking.taskProgressPercent;
  }

  const tasks = getBookingTasks(booking.serviceId, booking.addons);
  if (tasks.length === 0) return 0;

  const completed = new Set(getCompletedTaskIds(booking));
  return Math.round((tasks.filter((task) => completed.has(task.id)).length / tasks.length) * 100);
}

export function hasJobStarted(booking: Pick<BookingRecord, 'status' | 'beforePhotos' | 'beforePhotoUrl' | 'beforePhotoPath' | 'startedAt'>) {
  return booking.status === 'in_progress' || getBeforePhotos(booking).length > 0 || Boolean(booking.startedAt);
}

export function hasJobCompleted(booking: Pick<BookingRecord, 'status' | 'afterPhotos' | 'afterPhotoUrl' | 'afterPhotoPath' | 'completedAt'>) {
  return booking.status === 'completed' || getAfterPhotos(booking).length > 0 || Boolean(booking.completedAt);
}

export function getBeforePhotos(booking: Pick<BookingRecord, 'beforePhotos' | 'beforePhotoUrl' | 'beforePhotoPath' | 'startedAt'> | null): BookingPhoto[] {
  if (!booking) return [];
  if (Array.isArray(booking.beforePhotos) && booking.beforePhotos.length > 0) {
    return booking.beforePhotos;
  }
  if (booking.beforePhotoUrl) {
    return [{
      url: booking.beforePhotoUrl,
      path: booking.beforePhotoPath || '',
      uploadedAt: booking.startedAt || '',
    }];
  }
  return [];
}

export function getAfterPhotos(booking: Pick<BookingRecord, 'afterPhotos' | 'afterPhotoUrl' | 'afterPhotoPath' | 'completedAt'> | null): BookingPhoto[] {
  if (!booking) return [];
  if (Array.isArray(booking.afterPhotos) && booking.afterPhotos.length > 0) {
    return booking.afterPhotos;
  }
  if (booking.afterPhotoUrl) {
    return [{
      url: booking.afterPhotoUrl,
      path: booking.afterPhotoPath || '',
      uploadedAt: booking.completedAt || '',
    }];
  }
  return [];
}

export function getPrimaryBeforePhotoUrl(booking: Pick<BookingRecord, 'beforePhotos' | 'beforePhotoUrl' | 'beforePhotoPath' | 'startedAt'> | null) {
  return getBeforePhotos(booking)[0]?.url || null;
}

export function getPrimaryAfterPhotoUrl(booking: Pick<BookingRecord, 'afterPhotos' | 'afterPhotoUrl' | 'afterPhotoPath' | 'completedAt'> | null) {
  const photos = getAfterPhotos(booking);
  return photos[photos.length - 1]?.url || null;
}

export function bookingDateValue(booking: Pick<BookingRecord, 'date' | 'time' | 'timeWindow'>) {
  if (!booking.date) return Number.POSITIVE_INFINITY;

  const fallbackHour =
    booking.timeWindow === 'morning'
      ? 9
      : booking.timeWindow === 'afternoon'
        ? 13
        : booking.timeWindow === 'evening'
          ? 17
          : 12;
  const time = booking.time || `${String(fallbackHour).padStart(2, '0')}:00`;
  return new Date(`${booking.date}T${time}:00`).getTime();
}

export function sortBookingsBySchedule(bookings: BookingRecord[]) {
  return [...bookings].sort((left, right) => bookingDateValue(left) - bookingDateValue(right));
}

export function sortBookingsByCreatedAt(bookings: BookingRecord[]) {
  return [...bookings].sort((left, right) => {
    const leftDate =
      typeof left.createdAt === 'string'
        ? new Date(left.createdAt).getTime()
        : (left.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
    const rightDate =
      typeof right.createdAt === 'string'
        ? new Date(right.createdAt).getTime()
        : (right.createdAt as { seconds?: number } | undefined)?.seconds ?? 0;
    return rightDate - leftDate;
  });
}

export function formatSchedule(booking: Pick<BookingRecord, 'date' | 'time' | 'timeWindow'>) {
  if (!booking.date) return 'Schedule pending';

  const formattedDate = new Date(`${booking.date}T12:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (booking.time) return `${formattedDate} at ${booking.time}`;

  const windowLabel =
    booking.timeWindow === 'morning'
      ? 'Morning'
      : booking.timeWindow === 'afternoon'
        ? 'Afternoon'
        : booking.timeWindow === 'evening'
          ? 'Evening'
          : 'Flexible window';

  return `${formattedDate} (${windowLabel})`;
}

export function isUpcomingBooking(booking: Pick<BookingRecord, 'date' | 'time' | 'timeWindow' | 'status'>) {
  if (booking.status === 'completed' || booking.status === 'cancelled') return false;
  return bookingDateValue(booking as Pick<BookingRecord, 'date' | 'time' | 'timeWindow'>) >= Date.now();
}

export function getStatusLabel(status: BookingStatus) {
  switch (status) {
    case 'pending':
      return 'Pending review';
    case 'confirmed':
      return 'Confirmed';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

export function getAssignedStaffIds(booking: Pick<BookingRecord, 'assignedStaffId' | 'assignedStaffIds'> | null) {
  if (!booking) return [];
  if (Array.isArray(booking.assignedStaffIds) && booking.assignedStaffIds.length > 0) {
    return booking.assignedStaffIds;
  }
  return booking.assignedStaffId ? [booking.assignedStaffId] : [];
}

export function getAssignedStaffNames(booking: Pick<BookingRecord, 'assignedStaffName' | 'assignedStaffNames'> | null) {
  if (!booking) return [];
  if (Array.isArray(booking.assignedStaffNames) && booking.assignedStaffNames.length > 0) {
    return booking.assignedStaffNames;
  }
  return booking.assignedStaffName ? [booking.assignedStaffName] : [];
}

export function getAssignedStaffLabel(booking: Pick<BookingRecord, 'assignedStaffName' | 'assignedStaffNames'> | null) {
  const names = getAssignedStaffNames(booking);
  return names.length > 0 ? names.join(', ') : 'Unassigned';
}

export function hasStaffAcknowledged(
  booking: Pick<BookingRecord, 'staffAcknowledgedAt' | 'staffAcknowledgedByIds'> | null,
  userId: string,
) {
  if (!booking) return false;
  if (Array.isArray(booking.staffAcknowledgedByIds) && booking.staffAcknowledgedByIds.length > 0) {
    return booking.staffAcknowledgedByIds.includes(userId);
  }
  return Boolean(booking.staffAcknowledgedAt);
}
