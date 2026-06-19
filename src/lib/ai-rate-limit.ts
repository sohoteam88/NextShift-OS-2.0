import { AppError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';

type RateLimitUser = {
  id: string;
  tenantId: string;
};

type AiRateLimitOptions = {
  feature?: string;
  userLimit?: number;
  tenantLimit?: number;
  windowMs?: number;
};

export async function sharedAiRateLimitGuard(
  user: RateLimitUser,
  options: AiRateLimitOptions = {},
): Promise<void> {
  const feature = options.feature ?? 'ai';
  const windowMs = options.windowMs ?? 60 * 60 * 1000;
  const userLimit = options.userLimit ?? 20;
  const tenantLimit = options.tenantLimit ?? Math.max(userLimit * 5, userLimit);

  const [userAllowed, tenantAllowed] = await Promise.all([
    checkRateLimit(`ai:${feature}:user:${user.id}`, userLimit, windowMs),
    checkRateLimit(`ai:${feature}:tenant:${user.tenantId}`, tenantLimit, windowMs),
  ]);

  if (!userAllowed || !tenantAllowed) {
    throw new AppError('RATE_LIMITED', 429, 'Too many AI requests');
  }
}
