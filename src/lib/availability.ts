import type { AvailabilitySettings, AvailabilityTimeWindow } from '@/types';

export const DETAILING_TIME_OPTIONS = ['08:00', '10:30', '13:00', '15:30', '18:00'] as const;

export const TIME_WINDOW_OPTIONS: Array<{
  id: AvailabilityTimeWindow;
  label: string;
  window: string;
}> = [
  { id: 'morning', label: 'Morning', window: '08:00 - 12:00' },
  { id: 'afternoon', label: 'Afternoon', window: '12:00 - 16:00' },
  { id: 'evening', label: 'Evening', window: '16:00 - 20:00' },
];

export const DEFAULT_AVAILABILITY_SETTINGS: AvailabilitySettings = {
  maxBookingsPerDay: 4,
  blockedDates: [],
  availableDetailingTimes: [...DETAILING_TIME_OPTIONS],
  availableTimeWindows: TIME_WINDOW_OPTIONS.map((item) => item.id),
};

export function normalizeAvailabilitySettings(
  input?: Partial<AvailabilitySettings> | null,
): AvailabilitySettings {
  const availableDetailingTimes = Array.isArray(input?.availableDetailingTimes)
    ? input.availableDetailingTimes.filter((time): time is string => typeof time === 'string')
    : DEFAULT_AVAILABILITY_SETTINGS.availableDetailingTimes;

  const availableTimeWindows = Array.isArray(input?.availableTimeWindows)
    ? input.availableTimeWindows.filter(
      (window): window is AvailabilityTimeWindow => TIME_WINDOW_OPTIONS.some((option) => option.id === window),
    )
    : DEFAULT_AVAILABILITY_SETTINGS.availableTimeWindows;

  const blockedDates = Array.isArray(input?.blockedDates)
    ? input.blockedDates.filter((date): date is string => typeof date === 'string')
    : DEFAULT_AVAILABILITY_SETTINGS.blockedDates;

  return {
    maxBookingsPerDay:
      typeof input?.maxBookingsPerDay === 'number' && Number.isFinite(input.maxBookingsPerDay)
        ? Math.max(1, Math.round(input.maxBookingsPerDay))
        : DEFAULT_AVAILABILITY_SETTINGS.maxBookingsPerDay,
    blockedDates,
    availableDetailingTimes: availableDetailingTimes.length > 0
      ? availableDetailingTimes
      : DEFAULT_AVAILABILITY_SETTINGS.availableDetailingTimes,
    availableTimeWindows: availableTimeWindows.length > 0
      ? availableTimeWindows
      : DEFAULT_AVAILABILITY_SETTINGS.availableTimeWindows,
  };
}

export function dateToIso(value: Date) {
  return value.toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
}

export function isoToDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

export function isDateUnavailable(
  settings: AvailabilitySettings,
  dateIso: string,
  bookedDateCounts: Record<string, number> = {},
) {
  if (settings.blockedDates.includes(dateIso)) {
    return true;
  }

  return (bookedDateCounts[dateIso] || 0) >= settings.maxBookingsPerDay;
}
