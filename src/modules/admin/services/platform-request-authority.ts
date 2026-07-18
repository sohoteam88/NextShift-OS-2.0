import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';

const CORRELATION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

function validatedHeader(value: string | null, name: string): string | undefined {
  const supplied = value?.trim();
  if (!supplied) return undefined;
  if (!CORRELATION_ID.test(supplied)) {
    throw new AppError('VALIDATION_ERROR', 400, `Invalid ${name} header`);
  }
  return supplied;
}

export function resolvePlatformCorrelationId(request: NextRequest): string {
  const supplied = validatedHeader(request.headers.get('x-correlation-id'), 'X-Correlation-ID');
  if (!supplied) return randomUUID();
  return supplied;
}

/**
 * Resolve one stable logical-attempt identity for idempotent platform writes.
 * When both headers are present they must be identical; accepting two distinct
 * authorities would make a retry look like a new mutation.
 */
export function resolvePlatformIdempotentAttempt(request: NextRequest): {
  idempotencyKey?: string;
  correlationId: string;
} {
  const idempotencyKey = validatedHeader(request.headers.get('idempotency-key'), 'Idempotency-Key');
  const correlationId = validatedHeader(request.headers.get('x-correlation-id'), 'X-Correlation-ID');
  if (idempotencyKey && correlationId && idempotencyKey !== correlationId) {
    throw new AppError(
      'IDEMPOTENCY_CORRELATION_MISMATCH',
      400,
      'Idempotency-Key and X-Correlation-ID must identify the same logical attempt',
    );
  }
  return {
    idempotencyKey,
    correlationId: idempotencyKey ?? correlationId ?? randomUUID(),
  };
}
