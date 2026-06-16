// Rate Limiter — supports in-memory (dev) and Redis (production)
// Set REDIS_URL in production to enable distributed rate limiting

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

// Redis adapter - activates when both Upstash env vars are set.
// Install: pnpm add @upstash/redis
async function getRedisStore() {
  if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) return null;
  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
  } catch { return null; }
}

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const redis = await getRedisStore();
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
      return current <= max;
    } catch { /* fall through to in-memory */ }
  }

  // In-memory fallback (dev, single instance)
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) { store.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

export function resetRateLimits() { store.clear(); }
