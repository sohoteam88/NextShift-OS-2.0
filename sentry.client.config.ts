// @ts-nocheck — @sentry/nextjs is an optional dependency
// Sentry Client Configuration
// Gracefully no-ops if SENTRY_DSN is not set (local dev).

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

export function initSentryClient() {
  if (!SENTRY_DSN) return;

  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      enabled: process.env.NODE_ENV === 'production',
    });
  }).catch(() => {
    // @sentry/nextjs not installed — silently skip
  });
}
