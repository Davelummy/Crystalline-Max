export type Portal = 'public' | 'customer' | 'staff' | 'admin';

export type View =
  | 'landing'
  | 'booking'
  | 'customer'
  | 'admin'
  | 'brand'
  | 'estimator'
  | 'checkin'
  | 'schedule'
  | 'tasks'
  | 'staff-mgmt'
  | 'settings'
  | 'billing'
  | 'selection'
  | 'customer-login'
  | 'staff-login'
  | 'staff-signup'
  | 'admin-login'
  | 'profile';

export type UserRole = 'client' | 'employee' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'not_required';

export interface AppUserData {
  uid: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  employeeId?: string;
  bookingCount?: number;
  phoneNumber?: string;
  address?: string;
  city?: string;
  postcode?: string;
  position?: string;
  experience?: string;
  onboarded?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface EmployeeInvite {
  employeeId: string;
  displayName?: string;
  email?: string;
  position?: string;
  claimed: boolean;
  claimedAt?: unknown;
  claimedByUid?: string;
  claimedByEmail?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface BookingRecord {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceLabel: string;
  addons: string[];
  address: string;
  city: string;
  postcode: string;
  date: string;
  time: string;
  timeWindow: string;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StaffTask {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}
