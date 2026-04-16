import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth } from '../firebase';
import type { Portal } from '../types';

const LOGIN_TARGET_KEY = 'crystalline-max-login-target';
const LOGIN_RETURN_PATH_KEY = 'crystalline-max-login-return-path';
const CLIENT_STAY_LOGGED_IN_KEY = 'crystalline-max-client-stay-logged-in';
export const COMPANY_EMAIL_DOMAIN = '@ctmds.co.uk';

function readLoginTargetStorage() {
  if (typeof window === 'undefined') return null;

  return (
    window.sessionStorage.getItem(LOGIN_TARGET_KEY) ||
    window.localStorage.getItem(LOGIN_TARGET_KEY)
  );
}

export function createGoogleProvider() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

export function getSavedLoginTarget(): Exclude<Portal, 'public'> {
  const saved = readLoginTargetStorage();
  if (saved === 'staff' || saved === 'admin' || saved === 'customer') {
    return saved;
  }
  return 'customer';
}

export function hasSavedLoginTarget() {
  return readLoginTargetStorage() != null;
}

export function saveLoginTarget(portal: Exclude<Portal, 'public'>) {
  window.sessionStorage.setItem(LOGIN_TARGET_KEY, portal);
  window.localStorage.setItem(LOGIN_TARGET_KEY, portal);
}

export function clearLoginTarget() {
  window.sessionStorage.removeItem(LOGIN_TARGET_KEY);
  window.localStorage.removeItem(LOGIN_TARGET_KEY);
}

export function saveLoginReturnPath(pathname?: string | null) {
  const value = pathname?.trim();
  if (!value) return;
  window.sessionStorage.setItem(LOGIN_RETURN_PATH_KEY, value);
  window.localStorage.setItem(LOGIN_RETURN_PATH_KEY, value);
}

const ALLOWED_RETURN_PREFIXES = ['/customer/', '/staff/', '/admin/', '/book'];

function isSafeReturnPath(path: string | null): path is string {
  if (!path) return false;
  // Reject anything that looks like an absolute URL or contains protocol
  if (path.includes('://') || path.includes('//')) return false;
  return ALLOWED_RETURN_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export function getSavedLoginReturnPath() {
  if (typeof window === 'undefined') return null;

  const raw =
    window.sessionStorage.getItem(LOGIN_RETURN_PATH_KEY) ||
    window.localStorage.getItem(LOGIN_RETURN_PATH_KEY);

  return isSafeReturnPath(raw) ? raw : null;
}

export function clearLoginReturnPath() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(LOGIN_RETURN_PATH_KEY);
  window.localStorage.removeItem(LOGIN_RETURN_PATH_KEY);
}

export function getClientStayLoggedInPreference() {
  if (typeof window === 'undefined') return false;
  const saved =
    window.sessionStorage.getItem(CLIENT_STAY_LOGGED_IN_KEY) ??
    window.localStorage.getItem(CLIENT_STAY_LOGGED_IN_KEY);
  return saved === '1';
}

export function setClientStayLoggedInPreference(enabled: boolean) {
  if (typeof window === 'undefined') return;
  const value = enabled ? '1' : '0';
  window.sessionStorage.setItem(CLIENT_STAY_LOGGED_IN_KEY, value);
  window.localStorage.setItem(CLIENT_STAY_LOGGED_IN_KEY, value);
}

export function shouldUseRedirectAuth() {
  if (typeof navigator === 'undefined') return false;

  const userAgent = navigator.userAgent || '';
  const inAppBrowser = /FBAN|FBAV|Instagram|Line|TikTok|wv\)|WebView/i.test(userAgent);
  return inAppBrowser;
}

export async function signInWithGoogle(
  targetPortal: Exclude<Portal, 'public'>,
  options?: { stayLoggedIn?: boolean },
) {
  const provider = createGoogleProvider();
  saveLoginTarget(targetPortal);

  const stayLoggedIn = Boolean(options?.stayLoggedIn);
  if (targetPortal === 'customer') {
    setClientStayLoggedInPreference(stayLoggedIn);
    await setPersistence(auth, stayLoggedIn ? browserLocalPersistence : browserSessionPersistence);
  }

  if (shouldUseRedirectAuth()) {
    await signInWithRedirect(auth, provider);
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, provider);
      return null;
    }

    throw error;
  }
}

export async function signInWithCompanyEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function createCompanyUser(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email.trim(), password);
}

export function isCompanyEmail(email: string) {
  return email.trim().toLowerCase().endsWith(COMPANY_EMAIL_DOMAIN);
}

export function normalizeEmployeeId(employeeId: string) {
  return employeeId.trim().toUpperCase();
}

export function getAuthErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'this host';

  switch (code) {
    case 'auth/popup-blocked':
      return 'The login popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/cancelled-popup-request':
      return 'A login request was already in progress. Please wait.';
    case 'auth/popup-closed-by-user':
      return 'The login window was closed before completion.';
    case 'auth/unauthorized-domain':
      return `This host is not authorized for Firebase sign-in. Add ${hostname} to Firebase Authentication > Settings > Authorized domains.`;
    case 'auth/operation-not-supported-in-this-environment':
      return 'This browser cannot use popup login here. Try again in Safari or Chrome, or use a standard browser tab instead of an in-app browser.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'The email or password is incorrect.';
    case 'auth/user-not-found':
      return 'This account does not exist in Firebase Authentication yet.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/redirect-cancelled-by-user':
      return 'The login redirect was cancelled before completion.';
    case 'auth/redirect-operation-pending':
      return 'A redirect login is already in progress. Please wait.';
    default:
      return `Login failed${code ? ` (${code})` : ''}. Check Firebase Auth authorized domains and Google sign-in settings.`;
  }
}
