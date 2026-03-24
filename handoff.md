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
- Employee ID may optionally be reserved to a specific `@crystallinemax.co.uk` email
- New staff create their account from the dedicated signup page
- Staff must use company email and password
- Firestore user record is created with `role: "employee"` only when the invite is valid

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
- draft legal pages marked for review
- zero build errors as the baseline acceptance target
- booking metric semantics to be revisited before server-trigger rollout

## Major Upgrades Completed

### Firebase And Environment Hardening

- Firebase app initialization moved to env-driven config in [src/firebase.ts](/Users/davidolumide/Crystalline-Max/src/firebase.ts)
- Added `.firebaserc`, `firebase.json`, `firestore.indexes.json`, and `storage.rules`
- Added `.nvmrc` for Node 20
- Removed committed environment-specific Firebase app config from version control
- Repository now avoids tracking local Firebase credentials

### Current Migration Checkpoint

- Phase 1 foundation cleanup is complete and verified
- `react-router-dom` has been added
- Auth state extraction has started with [AuthContext.tsx](/Users/davidolumide/Crystalline-Max/src/context/AuthContext.tsx)
- Route guard scaffolding has been added in [RouteGuard.tsx](/Users/davidolumide/Crystalline-Max/src/components/RouteGuard.tsx)
- [main.tsx](/Users/davidolumide/Crystalline-Max/src/main.tsx) now wraps the app in `AuthProvider`
- Full route replacement of the `App.tsx` state machine is still in progress

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

### Booking And Operations Upgrade

- Replaced fake booking/payment success behavior with real Firestore booking creation
- Added verified map-based address selection
- Added booking assignment timestamps and acknowledgement support
- Added live progress calculation from task state
- Added before and after photo evidence support
- Added multi-image galleries for admin and customer
- Added task completion support for add-ons

### Staff Operations Upgrade

- Added `StaffNotifications`
- Added richer `StaffSchedule`
- Rebuilt `StaffTasks` for:
  - multi-image uploads
  - explicit upload success state
  - live checklist updates
  - end-of-job completion rules
- Reworked `EmployeeCheckIn` with geofenced site validation and check-out gating

### Customer And Admin Visibility Upgrade

- Customer dashboard now shows live progress and photo evidence
- Customer billing/history now reads real booking data
- Admin dashboard now reads live booking, check-in, and workforce state
- Admin and customer can open multi-photo job records in an uncluttered overlay gallery

### UI And Routing Improvements

- Public/admin entry points separated
- Auth screens split into dedicated pages
- Responsive layout improved for laptop and mobile portal flows
- Text contrast adjusted where readability was poor
- Broken or unavailable imagery was replaced with bundled, niche-appropriate assets without replacing the site with placeholder blocks
- Public footer contact details now use temporary Manchester placeholder business data pending final real-world replacement before launch

## Current Firebase Project

- Linked project: `crystalline-max-dolumide-2026`

Local Firebase configuration is expected in `.env.local` and must not be committed.

## Current Auth Model

### Customer

- Provider: Google
- Firestore role: `client`

### Staff

- Provider: Firebase email/password
- Email domain: `@crystallinemax.co.uk`
- Firestore role: `employee`
- Signup requirement: valid employee ID

### Admin

- Provider: Firebase email/password
- Email domain: `@crystallinemax.co.uk`
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

Latest local verification completed successfully:

- `npm run lint`
- `npm run build`
- `firebase deploy --only firestore:rules`

## Documentation Rule Going Forward

When product, UX, auth, booking logic, data model, or operational behavior changes, update these files in the same workstream:

- `README.md`
- `handoff.md`
- `design.md`
