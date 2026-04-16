import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';

const env = import.meta.env as Record<string, string | undefined>;

const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

const missingEnvVars = requiredEnvVars.filter((key) => !env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing Firebase environment variables: ${missingEnvVars.join(', ')}.`);
}

const resolvedConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: env.VITE_FIREBASE_APP_ID as string,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};
const firestoreDatabaseId = env.VITE_FIREBASE_DATABASE_ID || '(default)';

const app = initializeApp(resolvedConfig);
const recaptchaSiteKey = env.VITE_RECAPTCHA_SITE_KEY;

if (!recaptchaSiteKey) {
  if (import.meta.env.PROD) {
    throw new Error(
      'VITE_RECAPTCHA_SITE_KEY is required in production. App Check cannot be disabled on a live deployment.',
    );
  } else {
    console.warn('[App Check] VITE_RECAPTCHA_SITE_KEY not set — App Check disabled in dev mode.');
  }
}

let appCheck = null;
if (typeof window !== 'undefined' && recaptchaSiteKey) {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.error('Error initializing App Check:', error);
  }
}

export const db = getFirestore(app, firestoreDatabaseId);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'europe-west2');
export const storage = getStorage(app);
export { appCheck };
// Auth persistence is managed per-user in src/lib/auth.ts signInWithGoogle
