import * as Sentry from '@sentry/nextjs';

export type RuntimeFallbackLogPayload = Record<string, unknown>;

export const runtimeFallbackLogger = {
  warn(message: string, payload: RuntimeFallbackLogPayload) {
    console.warn(message, payload);
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: payload,
    });
  },
};
