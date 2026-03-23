<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Crystalline Max

Crystalline Max is a Vite + React + Firebase app for a mobile detailing and cleaning business. It includes:

- Public marketing pages and service estimator
- Customer onboarding, bookings, and billing history
- Staff check-in, schedule, and task views
- Admin dashboard, staff assignment, and system settings

## Run Locally

**Prerequisites:** Node.js 20+, a Firebase project, and Google Auth enabled in Firebase Authentication.

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and set your Firebase values.
3. Start the app:
   `npm run dev`
4. Deploy the Firestore rules:
   `firebase deploy --only firestore:rules`
5. Optionally deploy Storage rules:
   `firebase deploy --only storage`

## Switching To Another Firebase Project

Yes. The app can be pointed at a different Firebase project by changing the `VITE_FIREBASE_*` values in `.env.local`.

- `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_DATABASE_ID`: Firestore project and database
- `VITE_FIREBASE_STORAGE_BUCKET`: Storage bucket
- `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MESSAGING_SENDER_ID`: Auth/app connection details
 
The app now initializes Firebase from local `VITE_FIREBASE_*` environment variables only. No environment-specific Firebase app config file is committed.

## Local Test Notes

- Customer accounts can self-onboard after Google sign-in.
- Staff and admin roles should be provisioned in Firestore by setting the user document `role` to `employee` or `admin`.
- Admin settings are stored in `settings/general`.
- The repo now includes `firebase.json`, `firestore.indexes.json`, and `storage.rules` for CLI deploys.
