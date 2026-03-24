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
  | 'notifications'
  | 'profile'
  | 'privacy'
  | 'terms';

export type UserRole = 'client' | 'employee' | 'admin';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'not_required';

export interface BookingPhoto {
  url: string;
  path: string;
  uploadedAt: unknown;
}

export interface AppUserData {
  uid: string;
  email: string;
  displayName?: string | null;
  role: UserRole;
  employeeId?: string;
  bookingCount?: number;
  fcmToken?: string | null;
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
  locationLabel?: string;
  locationLat?: number;
  locationLng?: number;
  locationVerified?: boolean;
  date: string;
  time: string;
  timeWindow: string;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentSessionId?: string | null;
  paymentAmount?: number | null;
  paidAt?: unknown | null;
  adminNote?: string | null;
  cancelledAt?: unknown | null;
  cancelledBy?: 'customer' | 'admin' | null;
  assignedStaffId?: string | null;
  assignedStaffName?: string | null;
  assignedAt?: unknown;
  staffAcknowledgedAt?: unknown | null;
  completedTaskIds?: string[];
  taskProgressPercent?: number;
  startedAt?: unknown | null;
  completedAt?: unknown | null;
  lastProgressAt?: unknown | null;
  beforePhotoUrl?: string | null;
  beforePhotoPath?: string | null;
  afterPhotoUrl?: string | null;
  afterPhotoPath?: string | null;
  beforePhotos?: BookingPhoto[];
  afterPhotos?: BookingPhoto[];
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface StaffTask {
  id: string;
  title: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
}

export interface BookingLocationSelection {
  address: string;
  city: string;
  postcode: string;
  locationLabel: string;
  locationLat: number;
  locationLng: number;
  locationVerified: boolean;
}

export interface CheckIn {
  id: string;
  employeeUid: string;
  employeeName?: string | null;
  type: 'in' | 'out';
  timestamp: unknown;
  location?: { latitude: number; longitude: number } | null;
  bookingId?: string | null;
  bookingAddress?: string | null;
  distanceMeters?: number | null;
  serverValidated?: boolean;
}
