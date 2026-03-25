import { describe, expect, it } from 'vitest';
import {
  bookingDateValue,
  formatSchedule,
  getAfterPhotos,
  getBeforePhotos,
  getBookingTasks,
  getTaskProgressPercent,
  isUpcomingBooking,
  sortBookingsBySchedule,
} from './bookings';
import type { BookingRecord } from '@/types';

function makeBooking(overrides: Partial<BookingRecord> = {}): BookingRecord {
  return {
    id: 'booking-1',
    userId: 'user-1',
    customerName: 'Customer',
    customerEmail: 'customer@example.com',
    serviceId: 'car-full',
    serviceLabel: 'Full Detail',
    addons: [],
    address: '1 Test Street',
    city: 'Manchester',
    postcode: 'M1 1AA',
    date: '2099-01-01',
    time: '10:30',
    timeWindow: '',
    total: 120,
    status: 'pending',
    paymentStatus: 'pending',
    ...overrides,
  };
}

describe('getTaskProgressPercent', () => {
  it('returns 0 when no tasks are complete', () => {
    expect(getTaskProgressPercent(makeBooking())).toBe(0);
  });

  it('returns 100 when all tasks are complete', () => {
    const tasks = getBookingTasks('car-full', []);
    expect(getTaskProgressPercent(makeBooking({
      completedTaskIds: tasks.map((task) => task.id),
    }))).toBe(100);
  });

  it('returns a partial percentage for partially completed tasks', () => {
    expect(getTaskProgressPercent(makeBooking({
      completedTaskIds: ['wash', 'interior'],
    }))).toBe(50);
  });

  it('prefers taskProgressPercent when present', () => {
    expect(getTaskProgressPercent(makeBooking({
      completedTaskIds: [],
      taskProgressPercent: 88,
    }))).toBe(88);
  });
});

describe('getBookingTasks', () => {
  it('includes service tasks for known services', () => {
    const tasks = getBookingTasks('car-exterior', []);
    expect(tasks.map((task) => task.id)).toEqual(['wash', 'polish', 'wheels']);
  });

  it('converts addons into tasks', () => {
    const tasks = getBookingTasks('car-full', ['pet-hair']);
    expect(tasks.some((task) => task.id === 'addon-pet-hair')).toBe(true);
  });

  it('returns only addon tasks for an unknown service', () => {
    const tasks = getBookingTasks('unknown-service', ['extra-room']);
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.id).toBe('addon-extra-room');
  });
});

describe('booking photo helpers', () => {
  it('returns before photos from the array field', () => {
    const photos = getBeforePhotos(makeBooking({
      beforePhotos: [{ url: 'before.jpg', path: 'bookings/1/before.jpg', uploadedAt: 'now' }],
    }));
    expect(photos).toHaveLength(1);
    expect(photos[0]?.url).toBe('before.jpg');
  });

  it('falls back to legacy before photo fields', () => {
    const photos = getBeforePhotos(makeBooking({
      beforePhotoUrl: 'before.jpg',
      beforePhotoPath: 'bookings/1/before.jpg',
      startedAt: 'now',
    }));
    expect(photos).toHaveLength(1);
    expect(photos[0]?.path).toBe('bookings/1/before.jpg');
  });

  it('returns after photos from the array field', () => {
    const photos = getAfterPhotos(makeBooking({
      afterPhotos: [{ url: 'after.jpg', path: 'bookings/1/after.jpg', uploadedAt: 'later' }],
    }));
    expect(photos).toHaveLength(1);
    expect(photos[0]?.url).toBe('after.jpg');
  });
});

describe('schedule helpers', () => {
  it('sorts bookings by schedule', () => {
    const bookings = sortBookingsBySchedule([
      makeBooking({ id: '2', date: '2099-01-03', time: '12:00' }),
      makeBooking({ id: '1', date: '2099-01-01', time: '08:00' }),
    ]);
    expect(bookings.map((booking) => booking.id)).toEqual(['1', '2']);
  });

  it('formats explicit times', () => {
    expect(formatSchedule(makeBooking({ date: '2099-01-01', time: '08:00' }))).toContain('08:00');
  });

  it('calculates booking date values for time windows', () => {
    expect(bookingDateValue(makeBooking({ date: '2099-01-01', time: '', timeWindow: 'morning' })))
      .toBeLessThan(bookingDateValue(makeBooking({ date: '2099-01-01', time: '', timeWindow: 'evening' })));
  });

  it('flags future bookings as upcoming', () => {
    expect(isUpcomingBooking(makeBooking({ date: '2099-01-01', time: '09:00', status: 'confirmed' }))).toBe(true);
  });

  it('flags completed bookings as not upcoming', () => {
    expect(isUpcomingBooking(makeBooking({ status: 'completed' }))).toBe(false);
  });
});
