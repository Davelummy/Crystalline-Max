// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectId = 'crystalline-max-rules-test';

let testEnv: RulesTestEnvironment;

function rulesPath() {
  return path.resolve(__dirname, '../firestore.rules');
}

function customerBookingData(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'client-1',
    customerName: 'Client One',
    customerEmail: 'client1@example.com',
    serviceId: 'car-full',
    serviceLabel: 'Full Detail',
    addons: [],
    address: '1 Test Street',
    city: 'Manchester',
    postcode: 'M1 1AA',
    locationLabel: '1 Test Street, Manchester',
    locationLat: 53.48,
    locationLng: -2.24,
    locationVerified: true,
    date: '2099-01-01',
    time: '10:30',
    timeWindow: '',
    total: 120,
    status: 'pending',
    paymentStatus: 'pending',
    assignedStaffId: null,
    assignedStaffName: null,
    assignedStaffIds: [],
    assignedStaffNames: [],
    assignedAt: null,
    staffAcknowledgedAt: null,
    staffAcknowledgedByIds: [],
    completedTaskIds: [],
    taskProgressPercent: 0,
    startedAt: null,
    completedAt: null,
    lastProgressAt: null,
    beforePhotoUrl: null,
    beforePhotoPath: null,
    afterPhotoUrl: null,
    afterPhotoPath: null,
    beforePhotos: [],
    afterPhotos: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: readFileSync(rulesPath(), 'utf8'),
    },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Firestore rules', () => {
  it('allows a customer to create their own verified booking', async () => {
    const customerDb = testEnv.authenticatedContext('client-1', { email: 'client1@example.com' }).firestore();

    await assertSucceeds(setDoc(doc(customerDb, 'bookings/booking-1'), customerBookingData()));
  });

  it('rejects a booking without a verified location', async () => {
    const customerDb = testEnv.authenticatedContext('client-1', { email: 'client1@example.com' }).firestore();

    await assertFails(setDoc(doc(customerDb, 'bookings/booking-1'), customerBookingData({ locationVerified: false })));
  });

  it('allows a customer to cancel their own booking', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'bookings/booking-1'), customerBookingData());
    });

    const customerDb = testEnv.authenticatedContext('client-1', { email: 'client1@example.com' }).firestore();
    await assertSucceeds(updateDoc(doc(customerDb, 'bookings/booking-1'), {
      status: 'cancelled',
      cancelledBy: 'customer',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('rejects a customer cancelling another customer booking', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'bookings/booking-1'), customerBookingData({ userId: 'client-2', customerEmail: 'client2@example.com' }));
    });

    const customerDb = testEnv.authenticatedContext('client-1', { email: 'client1@example.com' }).firestore();
    await assertFails(updateDoc(doc(customerDb, 'bookings/booking-1'), {
      status: 'cancelled',
      cancelledBy: 'customer',
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }));
  });

  it('allows an employee to claim a valid invite', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'employeeInvites/CMX-ABC123'), {
        employeeId: 'CMX-ABC123',
        displayName: 'Amina Yusuf',
        email: 'amina@crystallinemax.co.uk',
        position: 'field-operator',
        claimed: false,
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      });
    });

    const employeeDb = testEnv.authenticatedContext('employee-1', { email: 'amina@crystallinemax.co.uk' }).firestore();
    await assertSucceeds(updateDoc(doc(employeeDb, 'employeeInvites/CMX-ABC123'), {
      claimed: true,
      claimedAt: serverTimestamp(),
      claimedByUid: 'employee-1',
      claimedByEmail: 'amina@crystallinemax.co.uk',
      updatedAt: serverTimestamp(),
    }));
  });

  it('rejects claiming an already-claimed invite', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'employeeInvites/CMX-ABC123'), {
        employeeId: 'CMX-ABC123',
        displayName: 'Amina Yusuf',
        email: 'amina@crystallinemax.co.uk',
        position: 'field-operator',
        claimed: true,
        claimedByUid: 'employee-0',
        claimedByEmail: 'amina@crystallinemax.co.uk',
        createdAt: '2026-03-25T00:00:00.000Z',
        updatedAt: '2026-03-25T00:00:00.000Z',
      });
    });

    const employeeDb = testEnv.authenticatedContext('employee-1', { email: 'amina@crystallinemax.co.uk' }).firestore();
    await assertFails(updateDoc(doc(employeeDb, 'employeeInvites/CMX-ABC123'), {
      claimed: true,
      claimedAt: serverTimestamp(),
      claimedByUid: 'employee-1',
      claimedByEmail: 'amina@crystallinemax.co.uk',
      updatedAt: serverTimestamp(),
    }));
  });

  it('allows an admin to read arbitrary documents', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users/admin-1'), {
        uid: 'admin-1',
        email: 'admin@crystallinemax.co.uk',
        role: 'admin',
      });
      await setDoc(doc(context.firestore(), 'settings/general'), {
        businessName: 'Crystalline Max',
      });
    });

    const adminDb = testEnv.authenticatedContext('admin-1', { email: 'admin@crystallinemax.co.uk' }).firestore();
    const snapshot = await assertSucceeds(getDoc(doc(adminDb, 'settings/general')));
    expect(snapshot.exists()).toBe(true);
  });

  it('allows public read access to settings/general only', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'settings/general'), {
        businessName: 'Crystalline Max',
      });
      await setDoc(doc(context.firestore(), 'settings/availability'), {
        maxBookingsPerDay: 4,
        blockedDates: [],
        availableDetailingTimes: ['08:00'],
        availableTimeWindows: ['morning'],
      });
    });

    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(getDoc(doc(anonymousDb, 'settings/general')));
    await assertFails(getDoc(doc(anonymousDb, 'settings/availability')));
  });

  it('rejects other unauthenticated reads', async () => {
    const anonymousDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonymousDb, 'users/client-1')));
  });
});
