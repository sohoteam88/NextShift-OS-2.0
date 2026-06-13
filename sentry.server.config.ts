// @ts-nocheck — @sentry/nextjs is an optional dependency
// Sentry Server Configuration

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initSentryServer() {
  if (!SENTRY_DSN) return;

  import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      enabled: process.env.NODE_ENV === 'production',

      // Do NOT log secrets or sensitive data
      beforeSend(event) {
        // Sanitize: strip potential secrets from error messages
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        // Strip API keys from URLs
        if (event.request?.url) {
          event.request.url = event.request.url.replace(/([?&])(key|token|secret|api_key)=[^&]+/gi, '$1$2=[REDACTED]');
        }
        return event;
      },
    });
  }).catch(() => {
    // @sentry/nextjs not installed — silently skip
  });
}

/**
 * Report a handled error to Sentry.
 * Safe to call even if Sentry is not configured.
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;
  import('@sentry/nextjs').then((Sentry) => {
    Sentry.captureException(error, { extra: context });
  }).catch(() => {});
}
