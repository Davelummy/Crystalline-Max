import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../firebase', () => ({
  auth: {},
}));

import {
  COMPANY_EMAIL_DOMAIN,
  clearLoginReturnPath,
  clearLoginTarget,
  getSavedLoginReturnPath,
  getSavedLoginTarget,
  hasSavedLoginTarget,
  isCompanyEmail,
  normalizeEmployeeId,
  saveLoginReturnPath,
  saveLoginTarget,
  shouldUseRedirectAuth,
} from './auth';

afterEach(() => {
  clearLoginTarget();
  clearLoginReturnPath();
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
