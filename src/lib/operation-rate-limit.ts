import { AppError } from '@/lib/errors';
import { consumeRateLimit, releaseRateLimit } from '@/lib/rate-limit';

/** Rate limit non-generative mutations without spending the AI allowance. */
export async function operationRateLimitGuard(
  userId: string,
  feature: string,
  limit = 60,
  windowMs = 60 * 60 * 1000,
): Promise<void> {
  const result = await consumeRateLimit(`operation:${feature}:user:${userId}`, limit, windowMs);
  if (result.allowed) return;

  // consumeRateLimit mirrors Redis INCR on rejection, so rolling this request
  // back preserves the fixed-window count at its configured limit.
  await releaseRateLimit(`operation:${feature}:user:${userId}`);
  throw new AppError('RATE_LIMITED', 429, 'Too many operations', result);
}
