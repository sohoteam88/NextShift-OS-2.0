const TRANSIENT_PRISMA_CODES = new Set(['P1001', 'P1002', 'P2024']);

function isTransientPrismaError(error: unknown) {
  if (!error || typeof error !== 'object') return false;

  const candidate = error as { code?: string; message?: string };
  if (candidate.code && TRANSIENT_PRISMA_CODES.has(candidate.code)) return true;

  const message = candidate.message ?? '';
  return (
    message.includes("Can't reach database server") ||
    message.includes('Timed out fetching a new connection') ||
    message.includes('Connection terminated unexpectedly')
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withPrismaRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientPrismaError(error) || attempt === attempts) break;
      await delay(150 * attempt);
    }
  }

  throw lastError;
}
