// Rate Limiter — supports in-memory (dev), VPS Redis, and Upstash Redis.
// Set REDIS_URL=redis://redis:6379 in production to enable Docker Redis.

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

type RedisStore = {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
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
