# Crystalline Max Implementation Brief

This document is the approved execution roadmap for the next major build-out of Crystalline Max. It is the implementation contract for the work that follows and should be treated as the source of truth for phase order, dependencies, acceptance criteria, and locked decisions.

Current execution checkpoint:

- Phase 1 complete
- Phase 2 complete
- Phase 3 complete
- Phase 4 complete
- Phase 5 complete
- Phase 6 complete
- Phase 7 complete
- Phase 8 complete
- Phase 9 complete
- Phase 10 next

## Locked Corrections

These corrections are applied to the roadmap before implementation starts:

- Build acceptance uses zero errors as the baseline. Existing bundle-size warnings are not treated as a blocker unless a phase explicitly includes code-splitting work.
- Staff routes are employee-only. Admin observes staff operations from admin routes rather than entering staff flows directly.
- Reminder scheduling uses `Europe/London`, not UTC.
- Legal pages will be written as UK-oriented draft content aligned to the product, and explicitly marked as pending final business/legal review.
- `bookingCount` should not remain a vague loyalty proxy. The preferred future metric is `completedBookingCount`, or another explicitly named metric with stable business meaning.
- `react-router-dom` and `stripe` provide their own types. Avoid adding redundant `@types` packages unless a package clearly requires them.

## Final Route Map

### Public Routes

- `/` → `LandingPage`
- `/services` → `ServicesPage`
- `/estimate` → `CostEstimatorPage`
- `/book` → `BookingFlowPage`
- `/book/:serviceId` → `BookingFlowPage`
- `/portal` → `PortalSelectionPage`
- `/login` → `CustomerLoginPage`
- `/staff/login` → `StaffLoginPage`
- `/staff/signup` → `StaffSignupPage`
- `/admin` → `AdminLoginPage`
- `/privacy` → `PrivacyPage`
- `/terms` → `TermsPage`
- `*` → `NotFoundPage`

### Customer Routes

- `/customer` → `CustomerDashboard`
- `/customer/booking` → `BookingFlowPage`
- `/customer/bookings/:bookingId` → `CustomerBookingDetail`
- `/customer/billing` → `CustomerBilling`
- `/customer/profile` → `UserProfileEdit`

### Staff Routes

- `/staff` → `StaffSchedule`
- `/staff/checkin` → `EmployeeCheckIn`
- `/staff/tasks` → `StaffTasks`
- `/staff/notifications` → `StaffNotifications`

### Admin Routes

- `/admin/dashboard` → `AdminDashboard`
- `/admin/staff` → `AdminStaffManagement`
- `/admin/bookings/:bookingId` → `AdminBookingDetail`
- `/admin/settings` → `AdminSettings`

### Guard Behavior

- Unauthenticated user hitting a guarded route is redirected to the route guard target, defaulting to `/portal`
- Client hitting `/staff/*` or `/admin/*` is redirected to `/customer`
- Employee hitting `/admin/*` is redirected to `/staff`
- Authenticated admin hitting `/admin` is redirected to `/admin/dashboard`
- Admin may still browse the public site without forced redirect
- Redirect state preserves the intended destination where appropriate

## Final Data Model Additions

### `BookingRecord`

Planned additions:

- `paymentSessionId?: string | null`
- `paymentAmount?: number | null`
- `paidAt?: unknown | null`
- `adminNote?: string | null`
- `cancelledAt?: unknown | null`
- `cancelledBy?: 'customer' | 'admin' | null`

These fields must be added to `src/types.ts` and to `isValidBooking` allowed fields in `firestore.rules`. Payment fields remain system/admin-written only.

### `AppUserData`

Planned addition:

- `fcmToken?: string | null`

If multi-device support becomes necessary later, this may evolve to a token array or device subcollection.

### `CheckIn`

Must exist in `src/types.ts`:

```ts
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
```

### `AvailabilitySettings`

Stored at `settings/availability`:

```ts
export interface AvailabilitySettings {
  maxBookingsPerDay: number;
  blockedDates: string[];
  availableDetailingTimes: string[];
  availableTimeWindows: ('morning' | 'afternoon' | 'evening')[];
}
```

## Firestore Indexes

Planned composite indexes:

- `checkins`: `employeeUid ASC`, `timestamp DESC`
- `bookings`: `status ASC`, `date ASC`
- `bookings`: `assignedStaffId ASC`, `status ASC`

## Storage Rules Target

Target authorization model:

- Admin can read all booking media and delete when needed
- Assigned staff can read and write media for their assigned booking
- Booking owner can read media for their own booking
- All other reads and writes are denied

This matches the existing storage path convention: `bookings/{bookingId}/...`

## Cloud Functions Plan

### `createCheckoutSession`

- Type: callable
- Auth required: yes
- Purpose: create a Stripe Checkout session for an owned unpaid booking

### `stripeWebhook`

- Type: HTTP
- Purpose: mark booking paid only after Stripe confirms the session

### `validateCheckin`

- Type: callable
- Auth required: employee role
- Purpose: enforce booking assignment, geofence distance, and check-out completion rules server-side

### `onBookingCreated`

- Type: Firestore trigger
- Purpose: maintain the user booking metric server-side instead of from the client

### `onBookingUpdated`

- Type: Firestore trigger
- Purpose: send notifications for assignment, confirmation, and completion transitions

### `sendJobReminders`

- Type: scheduled function
- Timezone: `Europe/London`
- Purpose: day-before reminder to assigned staff

### `onBookingCountDecrement`

- Type: Firestore trigger
- Purpose: only valid if we keep a creation/cancellation-based booking metric

## Notification Scope

Notifications that will be implemented:

- Booking assigned to staff
- Booking confirmed for customer
- Booking completed for customer
- Upcoming job reminder for assigned staff

Notifications explicitly excluded:

- Account creation
- Invite issuance
- Photo uploads
- Task completion pings

Channels:

- Email first
- FCM push for staff is optional after email stability

## Payment Plan

Payment provider:

- Stripe

Payment methods:

- Card
- Apple Pay through Stripe Checkout on verified production domains

Manual payment path:

- Admin can set `paymentStatus: 'not_required'` for offline or cash collection

Payment state model:

- booking created → `pending`
- `pending` → `paid` via Stripe webhook only
- `pending` → `not_required` via admin action only

No reversal path is planned from `paid` or `not_required`.

## Approved Phase Order

### Phase 1 — Foundation Cleanup

- remove unused dependencies
- unify aliases/imports
- eliminate `any`
- add missing types
- replace placeholder anchors and add legal routes
- sync docs

### Phase 2 — Router And App Shell Migration

- add `react-router-dom`
- create route map and guards
- add `AuthContext`
- remove state-machine navigation from `App.tsx`
- centralize redirect auth handling

### Phase 3 — Cloud Functions Platform Setup

- initialize Functions v2 with TypeScript
- configure secrets
- configure emulators
- add shared server utilities

### Phase 4 — Data Integrity And Security Hardening

- move booking metrics off the client
- fix employee ID collision risk
- add indexes
- tighten storage rules
- optimize check-in history query

### Phase 5 — Server-Side Check-In Enforcement

- replace client check-in writes with callable validation
- remove direct client create access to `checkins`

### Phase 6 — Payments

- Stripe Checkout session creation
- webhook confirmation
- customer payment UI
- admin offline payment override
- revenue correction

### Phase 7 — Notifications

- assignment, confirmation, completion, reminder flows
- email first
- optional FCM for staff

### Phase 8 — Admin Capability Completion

- booking cancellation
- reassign/unassign
- booking detail route
- manual confirmation flow

### Phase 9 — Availability And Capacity Management

- `settings/availability`
- admin controls
- disabled dates and slots in booking flow

### Phase 10 — Legal And Policy Drafting

- UK-oriented draft privacy and terms pages
- clearly marked as draft pending final review

### Phase 11 — Multi-Employee Job Assignment

- move from single-assignee booking fields to a multi-assignee model
- allow admin to assign more than one employee to the same booking
- update staff schedule, notifications, check-in, task execution, and customer/admin displays for shared jobs
- preserve backwards compatibility for existing single-assignee bookings during migration

### Phase 12 — Testing And CI

- Vitest
- Firestore/rules tests
- emulator-backed tests
- Playwright
- GitHub Actions

### Phase 13 — Pre-Launch Hardening

- App Check
- API restrictions
- image limits and validation
- Sentry
- Apple Pay domain verification
- final production smoke test

## Acceptance Standard

No phase is considered complete unless:

- its route/data/security changes are implemented
- its documented acceptance criteria pass
- `README.md`, `handoff.md`, and `design.md` are updated where the phase changes product behavior or architecture
- the work is committed in a clean, reviewable checkpoint

## Open Business Decisions To Keep Visible

These do not block Phase 1, but they must be resolved during implementation:

- whether to replace `bookingCount` with `completedBookingCount`
- final real-world business identity fields for footer and legal pages
- whether FCM remains single-device via `fcmToken` or expands to multi-device support

## Roadmap Notes Added Mid-Execution

- The admin navbar regression is treated as a router/admin-surface hardening issue and is folded into the completed routing/admin phases rather than treated as a new standalone phase.
- Multi-employee job assignment is now a planned roadmap item because the current booking model is still single-assignee (`assignedStaffId` / `assignedStaffName`) and needs an explicit migration path.
