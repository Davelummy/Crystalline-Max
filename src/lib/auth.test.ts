import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase', () => ({
  auth: {},
  functions: {},
}));

import {
  COMPANY_EMAIL_DOMAIN,
  clearClientEmailForSignIn,
  clearLoginReturnPath,
  clearLoginTarget,
  getSavedClientEmailForSignIn,
  getSavedLoginReturnPath,
  getSavedLoginTarget,
  hasSavedLoginTarget,
  isClientEmail,
  isCompanyEmail,
  normalizeEmployeeId,
  saveClientEmailForSignIn,
  saveLoginReturnPath,
  saveLoginTarget,
  shouldUseRedirectAuth,
} from './auth';

afterEach(() => {
  clearLoginTarget();
  clearLoginReturnPath();
  clearClientEmailForSignIn();
  vi.unstubAllGlobals();
});

describe('isCompanyEmail', () => {
  it(`accepts ${COMPANY_EMAIL_DOMAIN}`, () => {
    expect(isCompanyEmail('staff@ctmds.co.uk')).toBe(true);
  });

  it('rejects non-company emails', () => {
    expect(isCompanyEmail('staff@gmail.com')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isCompanyEmail('STAFF@CTMDS.CO.UK')).toBe(true);
  });
});

describe('normalizeEmployeeId', () => {
  it('trims and uppercases the value', () => {
    expect(normalizeEmployeeId('  cmx-abc123  ')).toBe('CMX-ABC123');
  });
});

describe('client email helpers', () => {
  it('accepts personal emails for client email-link auth', () => {
    expect(isClientEmail('customer@gmail.com')).toBe(true);
  });

  it(`rejects ${COMPANY_EMAIL_DOMAIN} for client email-link auth`, () => {
    expect(isClientEmail('admin@ctmds.co.uk')).toBe(false);
  });

  it('stores and restores the pending email-link address', () => {
    saveClientEmailForSignIn('  CUSTOMER@GMAIL.COM ');
    expect(getSavedClientEmailForSignIn()).toBe('customer@gmail.com');
  });
});

describe('saved login target helpers', () => {
  it('stores and restores the login target', () => {
    saveLoginTarget('staff');
    expect(hasSavedLoginTarget()).toBe(true);
    expect(getSavedLoginTarget()).toBe('staff');
  });

  it('stores and restores the login return path', () => {
    saveLoginReturnPath('/customer/bookings/booking-1');
    expect(getSavedLoginReturnPath()).toBe('/customer/bookings/booking-1');
  });
});

describe('shouldUseRedirectAuth', () => {
  it('returns true for in-app browser user agents', () => {
    vi.stubGlobal('navigator', { userAgent: 'Instagram WebView' });
    expect(shouldUseRedirectAuth()).toBe(true);
  });

  it('returns false for normal browsers', () => {
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 Safari/605.1.15' });
    expect(shouldUseRedirectAuth()).toBe(false);
  });
});
