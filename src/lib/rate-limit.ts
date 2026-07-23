// Rate Limiter — supports in-memory (dev), VPS Redis, and Upstash Redis.
// Set REDIS_URL=redis://redis:6379 in production to enable Docker Redis.

type Entry = { count: number; resetAt: number };
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};
const store = new Map<string, Entry>();

type RedisStore = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  decr(key: string): Promise<number>;
  ttl(key: string): Promise<number>;
};

let redisStorePromise: Promise<RedisStore | null> | null = null;

async function createRedisStore(): Promise<RedisStore | null> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    if (redisUrl.startsWith('http://') || redisUrl.startsWith('https://')) {
      if (!process.env.REDIS_TOKEN) return null;
      const { Redis } = await import('@upstash/redis');
      return new Redis({ url: redisUrl, token: process.env.REDIS_TOKEN });
    }

    if (redisUrl.startsWith('redis://') || redisUrl.startsWith('rediss://')) {
      const { default: Redis } = await import('ioredis');
      const client = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      client.on('error', () => undefined);
      await client.connect();
      return client;
    }
  } catch {
    return null;
  }

  return null;
}

async function getRedisStore() {
  redisStorePromise ??= createRedisStore();
  const redis = await redisStorePromise;
  if (!redis) redisStorePromise = null;
  return redis;
}

export async function consumeRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const redis = await getRedisStore();
  if (redis) {
    try {
      const current = await redis.incr(key);
      if (current === 1) await redis.expire(key, Math.ceil(windowMs / 1000));
      const ttl = await redis.ttl(key);
      return {
        allowed: current <= max,
        remaining: Math.max(0, max - current),
        retryAfterSeconds: ttl > 0 ? ttl : Math.ceil(windowMs / 1000),
      };
    } catch { /* fall through to in-memory */ }
  }

  // In-memory fallback (dev, single instance)
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, max - 1), retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }
  if (entry.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  entry.count++;
  return {
    allowed: true,
    remaining: Math.max(0, max - entry.count),
    retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
  };
}

export async function releaseRateLimit(key: string): Promise<void> {
  const redis = await getRedisStore();
  if (redis) {
    try {
      await redis.decr(key);
      return;
    } catch { /* fall through to in-memory */ }
  }

  const entry = store.get(key);
  if (entry && entry.count > 0) entry.count--;
}

export async function checkRateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const result = await consumeRateLimit(key, max, windowMs);
  if (!result.allowed) await releaseRateLimit(key);
  return result.allowed;
}

export function resetRateLimits() { store.clear(); }
