export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initSentryServer } = await import('./sentry.server.config');
    initSentryServer();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initSentryEdge } = await import('./sentry.edge.config');
    initSentryEdge();
  }
}

export const onRequestError = async (...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>) => {
  const Sentry = await import('@sentry/nextjs');
  return Sentry.captureRequestError(...args);
};
