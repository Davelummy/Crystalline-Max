# Crystalline Max

Crystalline Max is a premium service operations platform for a mobile detailing and cleaning business. It combines a branded public site with three synchronized product surfaces:

- Customer portal
- Staff portal
- Admin portal

The platform runs on React, Vite, TypeScript, Firebase Authentication, Firestore, and Firebase Storage. The booking record is the operational source of truth, so customer progress, staff execution, and admin oversight all stay synchronized in real time.

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
- legal pages are drafted for UK compliance but marked pending final review
- build completion is measured against zero errors, not against existing bundle warnings

## Core Capabilities

### Public Experience

- Service-focused landing experience
- Portal selection for customer and staff
- Dedicated `/admin` access path for admin

### Customer Experience

- Google sign-in
- Customer onboarding and profile editing
- Live booking creation
- Verified service location selection on a map
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

### Admin Experience

- Manual admin provisioning only
- Dedicated `/admin` login
- Employee ID issuance and reservation
- Staff assignment and workforce control
- Live dashboard for bookings, check-ins, staff activity, and progress
- Before and after photo review with gallery overlay

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

## Authentication Model

### Customer

- Firebase Google sign-in
- Firestore role: `client`

### Staff

- Firebase email/password
- Must use `@crystallinemax.co.uk`
- Firestore role: `employee`
- First account creation requires a valid employee invite

### Admin

- Firebase email/password
- Must use `@crystallinemax.co.uk`
- Firestore role: `admin`
- Must be provisioned manually before login

## Local Development

### Prerequisites

- Node.js 20+
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
3. Copy env values:
   ```bash
   cp .env.example .env.local
   ```
4. Fill `.env.local` with your Firebase web app values.
5. Start the app:
   ```bash
   npm run dev
   ```
6. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```
7. Optionally deploy storage rules:
   ```bash
   firebase deploy --only storage
   ```

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
firebase deploy --only firestore:rules
```

## Documentation Maintenance Rule

When features, architecture, auth logic, booking flow, data model, or design behavior changes, update these files in the same workstream:

- `README.md`
- `handoff.md`
- `design.md`

When changes affect the approved build-out sequence, acceptance criteria, or locked architectural decisions, update:

- `implementation-brief.md`
