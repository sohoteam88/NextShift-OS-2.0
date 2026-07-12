import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  recordRevenueDriverIntentAudit,
  type RevenueDriverIntentAuditInput,
} from '@/modules/revenue-drivers/services/revenue-driver-intent-service';
import type { RevenueRuntimeMetadata } from '@/modules/revenue-drivers/runtime';

const prismaMocks = vi.hoisted(() => ({
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

const user = {
  id: 'user_1',
  tenantId: 'tenant_1',
};

const resolvedInput: RevenueDriverIntentAuditInput = {
  route: '/content-engine',
  intent: 'facebook-post',
  status: 'resolved',
  resolvedTool: 'content.facebook-post',
  timestamp: '2026-07-09T00:00:00.000Z',
};

function createAuditLog() {
  return {
    create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Revenue driver intent runtime callsite', () => {
  it('routes through the Revenue Runtime Adapter and preserves the service response shape', async () => {
    const auditLog = createAuditLog();
    const runtimeMetadata: RevenueRuntimeMetadata[] = [];

    const result = await recordRevenueDriverIntentAudit(user, resolvedInput, {
      auditLog,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
    });

    expect(result).toEqual({ action: 'intent.resolved' });
    expect(runtimeMetadata).toHaveLength(1);
    expect(runtimeMetadata[0]).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'api',
      fallback: false,
      confidence: 1,
      capabilityId: 'revenue.driver.intent.resolve',
      eventType: 'runtime.revenue.intent.resolved',
      diagnosticsStatus: 'healthy',
    });
    expect(runtimeMetadata[0]?.contextId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]?.correlationId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]).not.toHaveProperty('tenantId');
    expect(runtimeMetadata[0]).not.toHaveProperty('userId');
  });

  it('adds runtime resolution comparison metadata when runtime is enabled by default', async () => {
    const auditLog = createAuditLog();

    await recordRevenueDriverIntentAudit(user, resolvedInput, { auditLog });

    expect(auditLog.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant_1',
        actorId: 'user_1',
        action: 'intent.resolved',
        targetType: 'revenue_driver_intent',
        metadata: expect.objectContaining({
          route: '/content-engine',
          intent: 'facebook-post',
          status: 'resolved',
          runtimeResolution: 'resolved',
        }),
      },
    });
  });
});
