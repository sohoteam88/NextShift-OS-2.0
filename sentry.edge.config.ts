// @ts-nocheck — @sentry/nextjs is an optional dependency
// Sentry Edge Configuration (Edge Runtime / Middleware)

export function initSentryEdge() {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.1,
      enabled: process.env.NODE_ENV === 'production',
    });
  }).catch(() => {});
}
