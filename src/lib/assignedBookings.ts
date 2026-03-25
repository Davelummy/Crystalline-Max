import { collection, onSnapshot, query, where, type DocumentData, type QuerySnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import type { BookingRecord } from '@/types';

function mergeBookings(
  primary: BookingRecord[],
  secondary: BookingRecord[],
) {
  const map = new Map<string, BookingRecord>();

  for (const booking of [...primary, ...secondary]) {
    map.set(booking.id, booking);
  }

  return [...map.values()];
}

function toBookingRecords(
  snapshot: QuerySnapshot<DocumentData, DocumentData>,
) {
  return snapshot.docs.map((entry) => ({
    id: entry.id,
    ...(entry.data() as Omit<BookingRecord, 'id'>),
  }));
}

export function subscribeToAssignedBookings(
  userId: string,
  onRecords: (records: BookingRecord[]) => void,
  onError?: () => void,
) {
  const legacyQuery = query(collection(db, 'bookings'), where('assignedStaffId', '==', userId));
  const multiQuery = query(collection(db, 'bookings'), where('assignedStaffIds', 'array-contains', userId));

  let legacyRecords: BookingRecord[] = [];
  let multiRecords: BookingRecord[] = [];

  const publish = () => onRecords(mergeBookings(legacyRecords, multiRecords));

  const unsubLegacy = onSnapshot(
    legacyQuery,
    (snapshot) => {
      legacyRecords = toBookingRecords(snapshot);
      publish();
    },
    () => {
      onError?.();
    },
  );

  const unsubMulti = onSnapshot(
    multiQuery,
    (snapshot) => {
      multiRecords = toBookingRecords(snapshot);
      publish();
    },
    () => {
      onError?.();
    },
  );

  return () => {
    unsubLegacy();
    unsubMulti();
  };
}
