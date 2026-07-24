import { AsyncLocalStorage } from 'node:async_hooks';
import { AppError } from '@/lib/errors';
import { consumeRateLimit, releaseRateLimit, type RateLimitResult } from '@/lib/rate-limit';

type RateLimitUser = {
  id: string;
  tenantId: string;
};

type AiRateLimitOptions = {
  feature?: string;
  userLimit?: number;
  tenantLimit?: number;
  windowMs?: number;
  totalUserLimit?: number;
  /** Number of generation jobs reserved atomically before a batch begins. */
  cost?: number;
};

type ConsumedBucket = { key: string };
const requestBuckets = new AsyncLocalStorage<ConsumedBucket[]>();

export function runWithAiRateLimitRefunds<T>(handler: () => Promise<T>): Promise<T> {
  return requestBuckets.run([], handler);
}

/** Refund AI tokens only when the request failed after the guard for a server-side reason. */
export async function refundAiRateLimits(): Promise<void> {
  const buckets = requestBuckets.getStore();
  if (!buckets?.length) return;
  await Promise.all(buckets.splice(0).map(({ key }) => releaseRateLimit(key)));
}

function limitDetails(results: RateLimitResult[]) {
  return results.reduce(
    (mostRestrictive, result) => ({
      remaining: Math.min(mostRestrictive.remaining, result.remaining),
      retryAfterSeconds: Math.max(mostRestrictive.retryAfterSeconds, result.retryAfterSeconds),
    }),
    { remaining: Number.POSITIVE_INFINITY, retryAfterSeconds: 1 },
  );
}

export async function sharedAiRateLimitGuard(
  user: RateLimitUser,
  options: AiRateLimitOptions = {},
): Promise<{ remaining: number; retryAfterSeconds: number }> {
  const cost = options.cost ?? 1;
  if (!Number.isInteger(cost) || cost < 1) {
    throw new AppError('VALIDATION_ERROR', 400, 'AI request cost must be a positive integer');
  }
  if (cost > 1) {
    let latest: { remaining: number; retryAfterSeconds: number } | undefined;
    try {
      for (let index = 0; index < cost; index += 1) {
        latest = await sharedAiRateLimitGuard(user, { ...options, cost: 1 });
      }
      return latest!;
    } catch (error) {
      // A batch must either reserve every job before it starts or reserve none.
      await refundAiRateLimits();
      throw error;
    }
  }
  const feature = options.feature ?? 'ai';
  const windowMs = options.windowMs ?? 60 * 60 * 1000;
  const userLimit = options.userLimit ?? 30;
  const tenantLimit = options.tenantLimit ?? Math.max(userLimit * 5, userLimit);
  const totalUserLimit = options.totalUserLimit ?? 150;
  const keys = [
    `ai:${feature}:user:${user.id}`,
    `ai:${feature}:tenant:${user.tenantId}`,
    `ai:total:user:${user.id}`,
  ];

  const results = await Promise.all([
    consumeRateLimit(keys[0], userLimit, windowMs),
    consumeRateLimit(keys[1], tenantLimit, windowMs),
    consumeRateLimit(keys[2], totalUserLimit, windowMs),
  ]);

  if (results.some((result) => !result.allowed)) {
    await Promise.all(keys.map((key) => releaseRateLimit(key)));
    throw new AppError('RATE_LIMITED', 429, 'Too many AI requests', limitDetails(results));
  }

  requestBuckets.getStore()?.push(...keys.map((key) => ({ key })));
  return limitDetails(results);
}
