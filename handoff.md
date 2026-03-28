# Handoff

## Project Core

Crystalline Max is a React + Vite + Firebase operations platform for a premium mobile detailing and cleaning business. It is not just a brochure site. It combines:

- Public marketing and service discovery
- Customer booking and account management
- Staff job execution and operational tracking
- Admin workforce and booking control

The product is built around one shared operational truth: bookings live in Firestore and all three interfaces react to the same booking records in real time.

## Product Areas

### Public Surface

- Brand-led landing page and service presentation
- Portal selection for customer and staff access
- Dedicated `/admin` entry path for admin access only
- Responsive public navigation and portal routing
- Public footer business/contact details now read from `settings/general`

### Customer Portal

- Google sign-in flow
- Customer onboarding and profile editing
- Live booking creation
- Billing and booking history
- Live job progress visibility
- Before and after photo evidence viewing
- Gallery overlay for multi-photo job records

### Staff Portal

- Company email and password login
- New staff account creation with employee ID + company email
- Staff onboarding
- Schedule and assigned jobs
- Notifications for newly assigned jobs
- On-site geofenced check-in and check-out
- Task checklist execution
- Add-ons converted into executable staff checklist items
- Before and after photo uploads with multi-image support
- Explicit upload success feedback
- Job completion flow that updates admin and customer views live

### Admin Portal

- Dedicated `/admin` login route
- Manual admin provisioning only
- Workforce control and employee ID issuance
- Booking assignment to staff
- Live operational dashboard
- Coverage, revenue, active booking, and activity visibility
- Before and after photo gallery review
- Admin booking detail with confirm, cancel, reassign, unassign, and offline payment override controls
- Availability and capacity controls backed by `settings/availability`
- General configuration in `settings/general` now drives public business/contact output instead of acting as dead config

## Core Business Flows

### Booking Flow

Booking is now a real Firestore-backed workflow rather than a fake success flow.

- Customer selects a service and add-ons
- Customer selects service location on a map instead of manually typing an unverified address
- App reverse-geocodes and stores verified coordinates and label
- Booking is created in Firestore as a live booking document
- Booking becomes the single source of truth for assignment, execution, progress, and completion

### Staff Account Creation Flow

- Admin issues an employee ID from Staff Management
- Employee ID may optionally be reserved to a specific `@ctmds.co.uk` email
- New staff create their account from the dedicated signup page
- Staff must use company email and password
- Firestore user record is created with `role: "employee"` only when the invite is valid
- Staff Management now surfaces a dedicated biodata panel per employee showing salary allocation, onboarding state, and a live job-allocation history pulled from the latest bookings so payroll and scheduling stays auditable.
- Salary allocation data is stored on each `users/{uid}` document (`salaryAllocation`, `salaryCurrency`, `bio`) and can be updated directly from this panel.

### Admin Access Flow

- Admin does not self-register in the app
- Admin must already exist in Firebase Authentication
- Matching Firestore `users/{uid}` document must exist with `role: "admin"`
- Admin login is only exposed through `/admin`

### Job Execution Flow

- Admin assigns a booking to staff
- Staff receives a live notification
- Staff acknowledges assignment
- Staff checks in on site only if their live device location is within the configured radius of the verified booking location
- Staff uploads multiple before photos
- Staff completes core tasks and add-on tasks
- Customer and admin see live progress percentages
- Staff uploads multiple after photos
- Staff marks job complete
- Staff can only check out if:
  - they are still within the allowed distance of the job location
  - all tasks are completed
  - after photos are uploaded
  - the job is marked complete

## Technical Architecture

### Frontend

- Vite
- React
- TypeScript
- Tailwind-style utility classes already present in the codebase
- Motion for animated states
- Lucide icons
- React Leaflet + Leaflet for map selection

### Backend Platform

- Firebase Authentication
- Firestore
- Firebase Storage
- Firebase Functions v2 in a dedicated TypeScript workspace
- Firebase CLI project configuration checked into the repo

### Realtime Data Model

The platform depends on Firestore `onSnapshot` listeners across the customer, staff, and admin surfaces so all parties see synchronized job state as it changes.

Main collections:

- `users`
- `bookings`
- `employeeInvites`
- `checkins`
- `settings`

### Shared Domain Models

Defined primarily in [src/types.ts](/Users/davidolumide/Crystalline-Max/src/types.ts):

- `AppUserData`
- `BookingRecord`
- `BookingPhoto`
- `EmployeeInvite`
- `StaffTask`

Shared booking behavior lives in [src/lib/bookings.ts](/Users/davidolumide/Crystalline-Max/src/lib/bookings.ts).

## Approved Roadmap

The next implementation cycle is now locked in [implementation-brief.md](/Users/davidolumide/Crystalline-Max/implementation-brief.md).

That roadmap is the execution reference for:

- router migration
- Cloud Functions rollout
- payment integration
- server-side geofence enforcement
- notifications
- admin lifecycle completion
- availability management
- testing and launch hardening

Roadmap corrections already accepted before implementation:

- employee-only access for `/staff/*`
- reminder scheduling in `Europe/London`
- UK-oriented legal pages now use the live business identity and no longer carry draft markers
- zero build errors as the baseline acceptance target
- booking metric semantics to be revisited before server-trigger rollout
- multi-employee job assignment is now added as a dedicated later phase because the current booking model is still single-assignee

## Major Upgrades Completed

### Firebase And Environment Hardening

- Firebase app initialization moved to env-driven config in [src/firebase.ts](/Users/davidolumide/Crystalline-Max/src/firebase.ts)
- Firebase App Check bootstrap is now wired behind `VITE_RECAPTCHA_SITE_KEY` in [src/firebase.ts](/Users/davidolumide/Crystalline-Max/src/firebase.ts)
- Added `.firebaserc`, `firebase.json`, `firestore.indexes.json`, and `storage.rules`
- Added `.nvmrc` for Node 20
- Removed committed environment-specific Firebase app config from version control
- Repository now avoids tracking local Firebase credentials
- Firestore now allows public read access to `settings/general` only, so public brand/contact copy can stay live without exposing protected operational settings

### Current Migration Checkpoint

- Phase 1 foundation cleanup is complete and verified
- Phase 2 router migration is now complete and verified
- Phase 3 Cloud Functions platform setup is now complete and verified
- Phase 4 data integrity and storage security hardening is now complete and verified
- Phase 5 server-side check-in enforcement is now complete and verified
- Phase 6 payments integration is now implemented and deployed
- Phase 7 notifications is now implemented and deployed
- Phase 8 admin capability completion is now implemented and verified
- Phase 9 availability and capacity management is now implemented and verified
- Phase 10 legal and policy drafting is now implemented and verified
- Phase 11 multi-employee job assignment is now implemented and verified
- Phase 12 testing and local verification is now implemented in-repo with unit tests, Firestore rules tests, Playwright smoke scaffolding, and repo-local verify commands
- Phase 13 pre-launch hardening is now partially implemented with App Check bootstrap hooks and bounded photo-upload validation, with remaining production-console tasks still pending
- Admin navigation is now being hardened as route-native navigation rather than legacy callback-driven shell controls
- `react-router-dom` is installed and live
- [AuthContext.tsx](/Users/davidolumide/Crystalline-Max/src/context/AuthContext.tsx) provides shared auth/profile state
- [RouteGuard.tsx](/Users/davidolumide/Crystalline-Max/src/components/RouteGuard.tsx) enforces role-based access
- [App.tsx](/Users/davidolumide/Crystalline-Max/src/App.tsx) is now route-driven and no longer uses the old `currentView` / `portal` state machine
- Direct-loadable route pages now exist for customer and admin booking detail views
- [functions/package.json](/Users/davidolumide/Crystalline-Max/functions/package.json) now defines a separate Node 20 Functions workspace
- [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts) sets the Functions v2 runtime baseline
- Shared server utility modules now exist in:
  - [functions/src/lib/bookings.ts](/Users/davidolumide/Crystalline-Max/functions/src/lib/bookings.ts)
  - [functions/src/lib/distance.ts](/Users/davidolumide/Crystalline-Max/functions/src/lib/distance.ts)
  - [functions/src/lib/notifications.ts](/Users/davidolumide/Crystalline-Max/functions/src/lib/notifications.ts)
- [firebase.json](/Users/davidolumide/Crystalline-Max/firebase.json) now defines Functions source plus local emulators for auth, functions, firestore, storage, and Emulator UI
- Root scripts now include `npm run build:functions` and `npm run dev:emulators`
- Placeholder Firebase secrets were created in the linked project for `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `RESEND_API_KEY`
- Local backend verification now includes a successful startup of Auth, Functions, Firestore, Storage, and Emulator UI on `127.0.0.1:4000`
- Deployed Functions now include:
  - `validateCheckin`
  - `onBookingCreated`
  - `onBookingCountDecrement`
  - `createCheckoutSession`
  - `stripeWebhook`
  - `onBookingUpdated`
  - `sendJobReminders`
- Emulator smoke verification confirmed the booking-count triggers increment on booking create and decrement on cancellation
- Emulator smoke verification confirmed `validateCheckin` enforces:
  - distance gate
  - assignment ownership
  - incomplete checkout rejection
  - missing after photo rejection
  - successful server-written `serverValidated` checkins

### Authentication Refactor

- Replaced shared/mixed auth entry with dedicated flows:
  - customer login
  - staff login
  - staff signup
  - admin login
- Added shared auth helpers in [src/lib/auth.ts](/Users/davidolumide/Crystalline-Max/src/lib/auth.ts)
- Stabilized redirect and portal state handling
- Restricted admin entry to `/admin`

### Firestore Rules Alignment

- Firestore rules were rewritten to match the live frontend data model
- Added invite claiming validation
- Added booking schema support for:
  - verified location fields
  - assignment fields
  - task progress fields
  - before and after photo arrays
  - legacy photo compatibility
  - enriched check-in payloads
- Rules have been deployed to the linked Firebase project

### Data Integrity And Storage Hardening

- Removed the client-side `bookingCount` increment from [BookingFlow.tsx](/Users/davidolumide/Crystalline-Max/src/components/BookingFlow.tsx)
- Moved booking-count updates to deployed Firestore triggers in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts)
- Prevented client owners from mutating `bookingCount` directly in [firestore.rules](/Users/davidolumide/Crystalline-Max/firestore.rules)
- Hardened employee ID issuance against collisions in [AdminStaffManagement.tsx](/Users/davidolumide/Crystalline-Max/src/components/AdminStaffManagement.tsx)
- Reduced staff check-in history queries to the latest record only in [EmployeeCheckIn.tsx](/Users/davidolumide/Crystalline-Max/src/components/EmployeeCheckIn.tsx)
- Added deployed composite indexes in [firestore.indexes.json](/Users/davidolumide/Crystalline-Max/firestore.indexes.json)
- Replaced permissive Storage rules with booking-aware access control in [storage.rules](/Users/davidolumide/Crystalline-Max/storage.rules)

### Booking And Operations Upgrade

- Replaced fake booking/payment success behavior with real Firestore booking creation
- Added verified map-based address selection
- Added booking assignment timestamps and acknowledgement support
- Added live progress calculation from task state
- Added before and after photo evidence support
- Added multi-image galleries for admin and customer
- Added task completion support for add-ons
- Added admin-side booking cancellation with cancellation attribution fields
- Added admin reassignment and unassignment controls from both dashboard and staff management surfaces
- Added richer admin booking detail actions for confirmation, payment override, check-in review, and lifecycle control
- Added `settings/availability` driven capacity management with blocked dates, per-day booking caps, and slot visibility toggles
- Added a public-safe availability snapshot callable so the booking calendar can disable full dates without exposing booking records
- Added multi-employee booking assignment fields with backward-compatible support for legacy single-assignee records
- Updated admin booking assignment controls, staff schedule/tasks/notifications/check-in reads, and reminder emails to support team-assigned jobs

### Staff Operations Upgrade

- Added `StaffNotifications`
- Added richer `StaffSchedule`
- Rebuilt `StaffTasks` for:
  - multi-image uploads
  - explicit upload success state
  - live checklist updates
  - end-of-job completion rules
- Added upload-time file validation in [src/components/StaffTasks.tsx](/Users/davidolumide/Crystalline-Max/src/components/StaffTasks.tsx) for supported formats, `10MB` size caps, and a `10`-photo limit per evidence phase
- Reworked `EmployeeCheckIn` with geofenced site validation and check-out gating

### Server-Enforced Check-In Upgrade

- Added deployed callable enforcement in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts)
- [EmployeeCheckIn.tsx](/Users/davidolumide/Crystalline-Max/src/components/EmployeeCheckIn.tsx) now writes through `httpsCallable(functions, 'validateCheckin')`
- Client direct create access to `checkins` was removed from [firestore.rules](/Users/davidolumide/Crystalline-Max/firestore.rules)
- Successful check-ins now write `serverValidated: true`
- Check-in rules are now enforced from the backend instead of trusting browser-only writes

### Customer And Admin Visibility Upgrade

- Customer dashboard now shows live progress and photo evidence
- Customer billing/history now reads real booking data
- Admin dashboard now reads live booking, check-in, and workforce state
- Admin and customer can open multi-photo job records in an uncluttered overlay gallery

### Payment Upgrade

- Added Stripe-backed checkout session creation in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts)
- Added Stripe webhook payment confirmation in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts)
- Added customer-side pay-now logic in [src/lib/payments.ts](/Users/davidolumide/Crystalline-Max/src/lib/payments.ts)
- Customer billing can now launch checkout from [src/components/CustomerBilling.tsx](/Users/davidolumide/Crystalline-Max/src/components/CustomerBilling.tsx)
- Customer booking detail can now launch checkout from [src/components/CustomerBookingDetail.tsx](/Users/davidolumide/Crystalline-Max/src/components/CustomerBookingDetail.tsx)
- Admin can mark bookings as offline-paid from [src/components/AdminBookingDetail.tsx](/Users/davidolumide/Crystalline-Max/src/components/AdminBookingDetail.tsx)
- Admin revenue now counts only paid bookings in [src/components/AdminDashboard.tsx](/Users/davidolumide/Crystalline-Max/src/components/AdminDashboard.tsx)
- Booking schema now includes `adminNote` for manual payment context in [src/types.ts](/Users/davidolumide/Crystalline-Max/src/types.ts)
- Current deployed Stripe webhook URL:
  - `https://stripewebhook-aa6far2tqa-nw.a.run.app`

### Notification Upgrade

- Added email notification formatting helpers in [functions/src/lib/notifications.ts](/Users/davidolumide/Crystalline-Max/functions/src/lib/notifications.ts)
- Added booking transition trigger in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts):
  - staff assignment email
  - customer confirmation email
  - customer completion email
- Added scheduled reminder trigger in [functions/src/index.ts](/Users/davidolumide/Crystalline-Max/functions/src/index.ts)
- Reminder schedule is now locked to `08:00` in `Europe/London`
- Notification functions are tolerant of placeholder or missing `RESEND_API_KEY` and skip email instead of breaking booking updates

### UI And Routing Improvements

- Public/admin entry points separated
- Auth screens split into dedicated pages
- Responsive layout improved for laptop and mobile portal flows
- Text contrast adjusted where readability was poor
- Broken or unavailable imagery was replaced with bundled, niche-appropriate assets without replacing the site with placeholder blocks
- Public footer contact details now use the live business identity from `settings/general`

## Current Firebase Project

- Linked project: `crystalline-max-dolumide-2026`

Local Firebase configuration is expected in `.env.local` and must not be committed.
Local Firestore and Storage emulator use also requires Java/OpenJDK on the machine PATH.

## Current Auth Model

### Customer

- Provider: Google
- Firestore role: `client`

### Staff

- Provider: Firebase email/password
- Email domain: `@ctmds.co.uk`
- Firestore role: `employee`
- Signup requirement: valid employee ID

### Admin

- Provider: Firebase email/password
- Email domain: `@ctmds.co.uk`
- Firestore role: `admin`
- Provisioning: manual only

## Operational Constraints

- New bookings require a verified map location
- Staff cannot create accounts without a valid employee invite
- Staff check-in requires being physically near the assigned job location
- Staff check-out requires:
  - proximity to the job location
  - completed checklist
  - after photos
  - booking marked complete

## Important Files

- [README.md](/Users/davidolumide/Crystalline-Max/README.md)
- [design.md](/Users/davidolumide/Crystalline-Max/design.md)
- [implementation-brief.md](/Users/davidolumide/Crystalline-Max/implementation-brief.md)
- [firestore.rules](/Users/davidolumide/Crystalline-Max/firestore.rules)
- [src/App.tsx](/Users/davidolumide/Crystalline-Max/src/App.tsx)
- [src/types.ts](/Users/davidolumide/Crystalline-Max/src/types.ts)
- [src/lib/auth.ts](/Users/davidolumide/Crystalline-Max/src/lib/auth.ts)
- [src/lib/bookings.ts](/Users/davidolumide/Crystalline-Max/src/lib/bookings.ts)
- [src/components/BookingFlow.tsx](/Users/davidolumide/Crystalline-Max/src/components/BookingFlow.tsx)
- [src/components/StaffTasks.tsx](/Users/davidolumide/Crystalline-Max/src/components/StaffTasks.tsx)
- [src/components/EmployeeCheckIn.tsx](/Users/davidolumide/Crystalline-Max/src/components/EmployeeCheckIn.tsx)
- [src/components/AdminStaffManagement.tsx](/Users/davidolumide/Crystalline-Max/src/components/AdminStaffManagement.tsx)

## Verification Status

Latest repo-backed verification completed successfully:

- `npm run lint`
- `npm run build`
- `npm run test`
- `npm run verify`

Phase 12 verification currently available in this repo:

- Firestore rules tests are checked in at [tests/firestore.rules.test.ts](/Users/davidolumide/Crystalline-Max/tests/firestore.rules.test.ts)
- Playwright smoke coverage is checked in at [tests/e2e/public-smoke.spec.ts](/Users/davidolumide/Crystalline-Max/tests/e2e/public-smoke.spec.ts)
- repo-local verification entry points now live in [package.json](/Users/davidolumide/Crystalline-Max/package.json)
- Emulator-backed rules tests and Playwright route boot still require a machine that allows localhost listeners

## Remaining Launch Tasks

- tighten Firebase Authentication authorized domains for production
- restrict browser API keys in Google Cloud Console
- add the Stripe Apple Pay domain association file on the production domain
- install and verify Sentry with a real DSN
- run final E2E and production smoke tests from an unrestricted machine

## Documentation Rule Going Forward

When product, UX, auth, booking logic, data model, or operational behavior changes, update these files in the same workstream:

- `README.md`
- `handoff.md`
- `design.md`
