import React from 'react';
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1,
  });
}

export function captureAppException(error: unknown, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export function setSentryUser(user: { uid?: string; role?: string } | null) {
  Sentry.setUser(user ? { id: user.uid, role: user.role } : null);
}

export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: (
      <div className="min-h-screen bg-charcoal px-4 py-24 text-center text-white">
        <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-teal">
          Crystalline Max
        </p>
        <h1 className="mt-4 text-3xl font-display uppercase">Something went wrong</h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-white/65">
          Refresh the page or return to the portal entry. The error has been logged for review.
        </p>
        <a
          href="/portal"
          className="mt-8 inline-flex rounded-xl bg-teal px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-charcoal"
        >
          Back To Portals
        </a>
      </div>
    ),
  },
);
