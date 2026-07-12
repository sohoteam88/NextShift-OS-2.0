import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  aIUsageLog: {
    count: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

import { checkDailyTenantQuota, enforceDailyTenantQuota } from './quota';

describe('AI daily tenant quota', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows usage below the tenant daily limit', async () => {
    prismaMocks.aIUsageLog.count.mockResolvedValue(25);

    const quota = await checkDailyTenantQuota('tenant_1', {
      now: new Date('2026-07-11T08:30:00.000Z'),
      env: { AI_DAILY_CALL_LIMIT_PER_TENANT: '200' },
    });

    expect(quota).toMatchObject({
      used: 25,
      limit: 200,
      remaining: 175,
      percentUsed: 12.5,
    });
    expect(quota.resetAt.toISOString()).toBe('2026-07-12T00:00:00.000Z');
  });

  it('allows the boundary call before the tenant daily limit is reached', async () => {
    prismaMocks.aIUsageLog.count.mockResolvedValue(199);

    await expect(enforceDailyTenantQuota('tenant_1', {
      now: new Date('2026-07-11T23:59:00.000Z'),
      env: { AI_DAILY_CALL_LIMIT_PER_TENANT: '200' },
    })).resolves.toBeUndefined();
  });

  it('throws a structured 429 error when the tenant daily limit is exceeded', async () => {
    prismaMocks.aIUsageLog.count.mockResolvedValue(200);

    await expect(enforceDailyTenantQuota('tenant_1', {
      now: new Date('2026-07-11T12:00:00.000Z'),
      env: { AI_DAILY_CALL_LIMIT_PER_TENANT: '200' },
    })).rejects.toMatchObject({
      code: 'QUOTA_EXCEEDED',
      statusCode: 429,
      details: {
        scope: 'tenant',
        window: 'day',
        used: 200,
        limit: 200,
        resetAt: '2026-07-12T00:00:00.000Z',
      },
    });
  });

  it('resets the daily count on the next UTC day', async () => {
    prismaMocks.aIUsageLog.count
      .mockResolvedValueOnce(200)
      .mockResolvedValueOnce(0);

    const july11 = await checkDailyTenantQuota('tenant_1', {
      now: new Date('2026-07-11T22:00:00.000Z'),
      env: { AI_DAILY_CALL_LIMIT_PER_TENANT: '200' },
    });
    const july12 = await checkDailyTenantQuota('tenant_1', {
      now: new Date('2026-07-12T00:01:00.000Z'),
      env: { AI_DAILY_CALL_LIMIT_PER_TENANT: '200' },
    });

    expect(july11.remaining).toBe(0);
    expect(july12.remaining).toBe(200);
    expect(prismaMocks.aIUsageLog.count).toHaveBeenNthCalledWith(1, {
      where: {
        tenantId: 'tenant_1',
        createdAt: {
          gte: new Date('2026-07-11T00:00:00.000Z'),
          lt: new Date('2026-07-12T00:00:00.000Z'),
        },
      },
    });
    expect(prismaMocks.aIUsageLog.count).toHaveBeenNthCalledWith(2, {
      where: {
        tenantId: 'tenant_1',
        createdAt: {
          gte: new Date('2026-07-12T00:00:00.000Z'),
          lt: new Date('2026-07-13T00:00:00.000Z'),
        },
      },
    });
  });
});
