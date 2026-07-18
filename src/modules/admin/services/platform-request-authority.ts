import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';
import { AppError } from '@/lib/errors';

const CORRELATION_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export function resolvePlatformCorrelationId(request: NextRequest): string {
  const supplied = request.headers.get('x-correlation-id')?.trim();
  if (!supplied) return randomUUID();
  if (!CORRELATION_ID.test(supplied)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid X-Correlation-ID header');
  }
  return supplied;
}
