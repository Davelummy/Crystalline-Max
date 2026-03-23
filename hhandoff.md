# Handoff

This file records the changes made to the project in this working session so the next person can understand the current state quickly.

## Project And Firebase Setup

- Connected the repo to a new Firebase project: `crystalline-max-dolumide-2026`.
- Added Firebase CLI project files:
  - `.firebaserc`
  - `firebase.json`
  - `firestore.indexes.json`
  - `storage.rules`
- Refactored Firebase app bootstrapping so the frontend reads Firebase config from environment variables in `src/firebase.ts`.
- Added `.nvmrc` to pin local development to Node 20.
- Updated `README.md`, `.env.example`, `package.json`, `package-lock.json`, `tsconfig.json`, and `vite.config.ts` to support the current app setup and local testing flow.

## Authentication And Portal Flow

- Reworked auth into distinct customer, staff, and admin flows.
- Added shared auth helpers in `src/lib/auth.ts`.
- Rebuilt public portal routing in `src/App.tsx`.
- Replaced the previous mixed login UI with dedicated auth pages:
  - `src/components/PortalSelection.tsx`
  - `src/components/CustomerLoginPage.tsx`
  - `src/components/StaffLoginPage.tsx`
  - `src/components/StaffSignupPage.tsx`
  - `src/components/AdminLoginPage.tsx`
  - `src/components/AuthPortalLayout.tsx`
- Customer flow:
  - Google sign-in only.
- Staff flow:
  - Existing staff log in with company email and password.
  - New staff create an account using an employee ID plus company email and password.
- Admin flow:
  - No in-app account creation.
  - Admin must already exist in Firebase Authentication and have a Firestore `users/{uid}` document with `role: "admin"`.

## Firestore Security And Data Model

- Added shared TypeScript models in `src/types.ts`.
- Added staff invite support with an `employeeInvites` collection.
- Updated `firestore.rules` so:
  - customer user records can self-create,
  - staff user records can only be created when a valid employee invite exists,
  - admin user records cannot self-create through the app,
  - invite claiming is restricted to the authenticated company email associated with the signup flow,
  - admin keeps privileged access to staff/admin management data.
- Deployed the Firestore rules to the linked Firebase project.

## Admin And Staff Management

- Reworked `src/components/AdminStaffManagement.tsx` so admin can:
  - issue employee IDs,
  - optionally reserve an employee ID to a specific company email,
  - review claimed/unclaimed invite state,
  - continue assigning bookings to staff.
- Updated onboarding flows:
  - `src/components/AdminOnboarding.tsx`
  - `src/components/StaffOnboarding.tsx`
  - `src/components/CustomerOnboarding.tsx`

## Customer, Staff, And Admin Product Work

- Reworked booking flow in `src/components/BookingFlow.tsx` so bookings are saved to Firestore as real pending records instead of fake paid bookings.
- Added or updated Firestore-backed customer and staff/admin views, including:
  - `src/components/CustomerBilling.tsx`
  - `src/components/CustomerDashboard.tsx`
  - `src/components/AdminDashboard.tsx`
  - `src/components/AdminSettings.tsx`
  - `src/components/StaffSchedule.tsx`
  - `src/components/StaffTasks.tsx`
  - `src/components/EmployeeCheckIn.tsx`
- Added shared booking helpers in `src/lib/bookings.ts`.

## UI And Navigation Changes

- Cleaned up public navigation to point users to the new portal chooser.
- Adjusted public pages and supporting components where needed:
  - `src/components/PublicNavbar.tsx`
  - `src/components/Services.tsx`
  - `src/components/CostEstimator.tsx`

## Verification

- Ran `npm run lint` successfully.
- Ran `npm run build` successfully.
- Deployed Firestore rules successfully with:
  - `firebase deploy --only firestore:rules`

## Important Operational Notes

- `.env.local` contains local Firebase credentials for the connected project but is intentionally not committed.
- To use admin login successfully:
  1. Create the admin in Firebase Authentication.
  2. Create the matching Firestore `users/{uid}` document.
  3. Set `role` to `admin`.
- To create a staff account successfully:
  1. Log in as admin.
  2. Issue an employee ID from Staff Management.
  3. Give that employee ID to the staff member.
  4. Staff completes account creation from the dedicated staff signup page.
