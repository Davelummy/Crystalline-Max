# Crystalline Max

Crystalline Max is a premium service operations platform for a mobile detailing and cleaning business. It combines a branded public site with three synchronized product surfaces:

- Customer portal
- Staff portal
- Admin portal

The platform runs on React, Vite, TypeScript, Firebase Authentication, Firestore, and Firebase Storage. The booking record is the operational source of truth, so customer progress, staff execution, and admin oversight all stay synchronized in real time.

Current migration status:

- Phase 1 foundation cleanup is complete
- Phase 2 router migration is complete with real route trees, protected layouts, URL-driven navigation, and direct-load support for public, customer, staff, and admin surfaces
- Phase 3 Cloud Functions platform setup is complete with a TypeScript functions workspace, emulator wiring, shared server utilities, and verified local backend emulators
- Phase 4 data integrity and storage security hardening is complete with booking-count triggers, secured media rules, composite indexes, and tighter client write constraints
- Phase 5 server-side check-in enforcement is complete with a deployed `validateCheckin` callable and client-side check-in writes removed
- Phase 6 payments integration is implemented and deployed with Stripe-backed checkout session creation, webhook payment confirmation, customer pay-now actions, and admin offline payment override
- Phase 7 notifications is implemented and deployed with booking update email triggers and a Europe/London scheduled reminder job
- Phase 8 admin capability completion is implemented with booking confirm/cancel flows, reassignment controls, and richer admin booking detail actions
- Phase 9 availability and capacity management is implemented with admin-managed blocked dates, booking-capacity controls, and a disabled-date customer calendar
- Phase 10 legal and policy drafting is implemented with UK-oriented privacy and terms pages aligned to the current platform behavior
- Phase 11 multi-employee job assignment is implemented with team-assignment booking fields, staff-side backward-compatible reads, and admin team assignment controls
- Phase 12 testing and local verification is implemented in-repo with Vitest unit coverage, Firestore rules tests, Playwright smoke scaffolding, and one-command local verify scripts
- Phase 13 pre-launch hardening is underway with Firebase App Check bootstrap hooks, bounded photo-upload validation, and launch-only environment placeholders for reCAPTCHA and Sentry
- MVP landing page expansion is complete with a trust-signal strip, How It Works section, and a rotating CTA carousel
- Staff management deep-linking is complete with per-employee profile and assignments subpages accessible from a click-through card modal
- Firestore rules are hardened with assignment-scoped booking reads, a dedicated `isStaff()` helper, reduced expression depth, and a `notificationLogs` rule

## Approved Roadmap

The approved execution roadmap for the next implementation cycle is in [implementation-brief.md](/Users/davidolumide/Crystalline-Max/implementation-brief.md).

It locks:

- the route map
- planned data-model additions
- Cloud Functions scope
- payment and notification behavior
- phase order
- acceptance standards

Key approved constraints from that brief:

- `/staff/*` routes are employee-only
- reminder scheduling targets `Europe/London`
- legal pages are aligned to current UK-facing platform behavior and now carry the live business identity
- build completion is measured against zero errors, not against existing bundle warnings
- the roadmap now includes a dedicated multi-employee job-assignment phase because the live booking model is still single-assignee

## Core Capabilities

### Public Experience

- Service-focused landing experience with Trust Strip, How It Works, and CTA Carousel sections
- Portal selection for customer and staff
- Dedicated `/admin` access path for admin
- Footer and legal contact details now use the live business identity stored in `settings/general`
- Public footer contact details and service-region copy now read from `settings/general`, so admin changes affect the live public surface

### Customer Experience

- Google sign-in
- Customer onboarding and profile editing
- Live booking creation
- Verified service location selection on a map
- Availability-aware date selection with blocked/full dates visibly disabled
- Booking history and billing visibility
- Live progress updates during a job
- Before and after photo evidence, including multi-image gallery viewing

### Staff Experience

- Company email/password login
- New staff signup using employee ID
- Staff onboarding
- Assigned job schedule
- New job alerts
- On-site check-in and check-out
- Task completion workflow
- Add-ons converted into execution tasks
- Multi-image before and after photo uploads
- Completion state synced to customer and admin
- Team-assigned jobs supported through shared booking execution for more than one employee

### Admin Experience

- Manual admin provisioning only
- Dedicated `/admin` login
- Employee ID issuance and reservation
- Staff assignment and workforce control
- Live dashboard for bookings, check-ins, staff activity, and progress
- Before and after photo review with gallery overlay
- Booking detail actions for confirmation, cancellation, reassignment, unassignment, and offline payment override
- Route-native admin navigation across dashboard, staff, and settings surfaces
- Team assignment from admin booking detail, with backward-compatible single-assignee support for older bookings
- Admin settings now drive the public business name, support contact, and service-region presentation instead of writing to an unused document
- Staff cards now open a modal that routes to two dedicated subpages: `/admin/staff/:staffId/profile` (employment record and payroll) and `/admin/staff/:staffId/assignments` (active bookings, history, progress stats)

## Product Rules

- Customers create bookings using a verified map-selected address
- Staff accounts require a valid employee ID and company email
- Admin accounts are manually provisioned in Firebase Auth and Firestore
- Staff check-in is blocked unless the device is near the assigned booking location
- Staff check-out is blocked unless:
  - the device is near the assigned booking location
  - all tasks are completed
  - after photos are uploaded
  - the booking is marked complete

## Realtime Sync Model

The customer, staff, and admin interfaces are synchronized through Firestore listeners. When staff update progress, upload evidence, complete tasks, or close a job, that state is reflected across the other portals from the same booking document.

Primary collections:

- `users`
- `bookings`
- `employeeInvites`
- `checkins`
- `settings`
- `notificationLogs` (admin-read only; write-locked to client; Cloud Functions write on email failure)

## Authentication Model

### Customer

- Firebase Google sign-in
- Firestore role: `client`

### Staff

- Firebase email/password
- Must use `@ctmds.co.uk`
- Firestore role: `employee`
- First account creation requires a valid employee invite

### Admin

- Firebase email/password
- Must use `@ctmds.co.uk`
- Firestore role: `admin`
- Must be provisioned manually before login

## Local Development

### Prerequisites

- Node.js 20+
- Java/OpenJDK for Firestore and Storage emulators
- Firebase CLI
- A Firebase project with Authentication, Firestore, and Storage enabled

### Setup

1. Install Node 20:
   ```bash
   nvm use
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Install the Functions workspace dependencies:
   ```bash
   npm --prefix functions install
   ```
4. Copy env values:
   ```bash
   cp .env.example .env.local
   ```
5. Fill `.env.local` with your Firebase web app values.
6. Start the app:
   ```bash
   npm run dev
   ```
7. Build the Functions workspace:
   ```bash
   npm run build:functions
   ```
8. Start local emulators when backend work is needed:
   ```bash
   export PATH="/usr/local/opt/openjdk/bin:$PATH"
   npm run dev:emulators
   ```
9. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
10. Optionally deploy storage rules:
   ```bash
   firebase deploy --only storage
   ```

### Functions Workspace

The repo now includes a dedicated Firebase Functions v2 TypeScript workspace in [functions/package.json](/Users/davidolumide/Crystalline-Max/functions/package.json).

Phase 3 baseline currently provides:

- global Functions runtime configuration
- shared server utility modules for distance checks, booking task derivation, and notification payload shaping
- local emulator wiring for Auth, Functions, Firestore, Storage, and Emulator UI
- root scripts for backend compilation and emulator startup
- deployed Firestore triggers for booking-count increment and cancellation decrement
- deployed `validateCheckin` callable for server-side geofence and checkout enforcement
- deployed Stripe payment functions:
  - `createCheckoutSession`
  - `stripeWebhook`
- deployed availability snapshot callable:
  - `getAvailabilitySnapshot`

Configured emulator ports:

- Auth: `127.0.0.1:9099`
- Functions: `127.0.0.1:5001`
- Firestore: `127.0.0.1:8080`
- Storage: `127.0.0.1:9199`
- Emulator UI: `127.0.0.1:4000`

## Payment Setup

Stripe is now the online payment provider for Crystalline Max.

Implemented payment behavior:

- customer portal can open Stripe Checkout for payable bookings
- `stripeWebhook` is the only path that marks a booking `paid`
- admin can mark a booking `not_required` for cash or offline payments
- admin revenue now counts only paid bookings

Required local/remote config:

- `.env.local`
  - `VITE_STRIPE_PUBLISHABLE_KEY`
- Firebase Functions secrets
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

Deployed webhook endpoint:

- `https://stripewebhook-aa6far2tqa-nw.a.run.app`

## Notifications Setup

Notification logic now exists in deployed Functions for:

- staff assignment emails
- customer booking confirmation emails
- customer job completion emails
- day-before staff reminder emails

The reminder scheduler runs daily at `08:00` in `Europe/London`.

Current dependency:

- `RESEND_API_KEY` must be a real provider key for outbound email to send
- if that key is still placeholder, the functions log and skip email instead of failing booking updates

## Firebase Configuration

The app initializes Firebase from `VITE_FIREBASE_*` environment variables only.

Expected values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_DATABASE_ID`
- `VITE_RECAPTCHA_SITE_KEY`
- `VITE_SENTRY_DSN`

No local Firebase app credentials should be committed.

## Switching To Another Firebase Project

To point the repo at another Firebase project:

1. Create or select the Firebase project
2. Create a web app in that project
3. Copy the new SDK config into `.env.local`
4. Update the CLI target if needed:
   ```bash
   firebase use --add
   ```
5. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules,storage
   ```

## Important Operational Setup

### Admin Provisioning

1. Create the admin user in Firebase Authentication
2. Create a matching Firestore document in `users/{uid}`
3. Set:
   - `uid`
   - `email`
   - `role: "admin"`
   - `displayName`

### Staff Provisioning

1. Admin logs in
2. Admin issues an employee ID in Staff Management
3. Staff creates account from the staff signup page
4. The signup flow claims the invite and creates the employee Firestore user record

## Important Source Files

- [handoff.md](/Users/davidolumide/Crystalline-Max/handoff.md)
- [design.md](/Users/davidolumide/Crystalline-Max/design.md)
- [implementation-brief.md](/Users/davidolumide/Crystalline-Max/implementation-brief.md)
- [src/App.tsx](/Users/davidolumide/Crystalline-Max/src/App.tsx)
- [src/types.ts](/Users/davidolumide/Crystalline-Max/src/types.ts)
- [src/lib/auth.ts](/Users/davidolumide/Crystalline-Max/src/lib/auth.ts)
- [src/lib/bookings.ts](/Users/davidolumide/Crystalline-Max/src/lib/bookings.ts)
- [src/components/BookingFlow.tsx](/Users/davidolumide/Crystalline-Max/src/components/BookingFlow.tsx)
- [src/components/EmployeeCheckIn.tsx](/Users/davidolumide/Crystalline-Max/src/components/EmployeeCheckIn.tsx)
- [firestore.rules](/Users/davidolumide/Crystalline-Max/firestore.rules)

## Verification

Last verified successfully:

```bash
npm run lint
npm run build
npm run build:functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes,storage
firebase deploy --only functions
firebase emulators:exec --only auth,firestore,functions,storage
```

Verification commands now checked into the repo:

```bash
npm run verify
npm run verify:full
npm run test
npm run test:emulator
npm run test:e2e
```

Current Phase 12 state:

- `npm run test` passes
- Firestore rules tests pass when the machine allows emulator ports
- Playwright smoke scaffolding is checked in, but route-level execution requires a machine that allows localhost listeners
- `npm run verify` is the default non-GitHub verification path

## Launch Hardening

Implemented in code:

- Firebase App Check bootstrap behind `VITE_RECAPTCHA_SITE_KEY`
- photo upload validation for JPEG, PNG, WebP, HEIC, and HEIF evidence
- per-file upload size cap of `10MB`
- per-phase upload cap of `10` photos for before and after job evidence

Still required before production launch:

- tighten Firebase Authentication authorized domains for the production project
- restrict browser API keys in Google Cloud Console
- add the Stripe Apple Pay domain association file on the production HTTPS domain
- install and verify real Sentry reporting with `VITE_SENTRY_DSN`
- run final E2E and production smoke tests from a machine that permits localhost/server ports

## Documentation Maintenance Rule

When features, architecture, auth logic, booking flow, data model, or design behavior changes, update these files in the same workstream:

- `README.md`
- `handoff.md`
- `design.md`

When changes affect the approved build-out sequence, acceptance criteria, or locked architectural decisions, update:

- `implementation-brief.md`
