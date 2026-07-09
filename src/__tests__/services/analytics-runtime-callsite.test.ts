import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyticsService } from '@/modules/analytics/analyticsService';
import {
  resolveAnalyticsRuntimeProjection,
  type AnalyticsRuntimeMetadata,
} from '@/modules/analytics/runtime';
import type { AnalyticsProjection } from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';

const prismaMocks = vi.hoisted(() => ({
  content: {
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  videoProject: {
    count: vi.fn(),
  },
  lead: {
    count: vi.fn(),
  },
  customer: {
    count: vi.fn(),
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS;

const sampleProjection: AnalyticsProjection = {
  businessStateVersion: 'BusinessStateAssembler:lead_generation:64',
  journeyVersion: 'JourneyStateAssembler:lead_generation:57',
  growthLoopVersion: 'GrowthLoopAssembler:2026-06-19T00:00:00.000Z:72',
  readiness: {
    value: 64,
    stage: 'lead_generation',
    bottleneckCount: 1,
  },
  progress: {
    value: 57,
    stage: 'lead_generation',
    nextAction: {
      title: 'Launch traffic',
      description: 'Start sending audience traffic to the funnel.',
      route: '/traffic-engine',
    },
  },
  growth: {
    value: 72,
    health: 'active',
    recommendationCount: 1,
  },
};

function setRuntimeAnalyticsFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_RUNTIME_ANALYTICS = value;
}

function arrangeAnalyticsData() {
  prismaMocks.content.count.mockResolvedValue(2);
  prismaMocks.videoProject.count.mockResolvedValue(1);
  prismaMocks.lead.count
    .mockResolvedValueOnce(10)
    .mockResolvedValueOnce(4);
  prismaMocks.customer.count.mockResolvedValue(2);
  prismaMocks.customer.findMany.mockResolvedValue([
    { metadata: { value: 1200 } },
    { metadata: { value: 300 } },
  ]);
  prismaMocks.content.groupBy.mockResolvedValue([
    { platform: 'facebook', _count: 2 },
  ]);
}

function createRuntimeResolver() {
  const getProjection = vi.fn().mockResolvedValue(sampleProjection);

  return {
    getProjection,
    resolveRuntimeProjection: (input: Parameters<typeof resolveAnalyticsRuntimeProjection>[0]) =>
      resolveAnalyticsRuntimeProjection(input, { getProjection }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  arrangeAnalyticsData();
});

afterEach(() => {
  setRuntimeAnalyticsFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('Analytics center runtime callsite', () => {
  it('keeps the legacy service response shape when the runtime analytics flag is OFF', async () => {
    setRuntimeAnalyticsFlag(undefined);
    const runtimeMetadata: AnalyticsRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const center = await analyticsService.getAnalyticsCenter('user_1', 'tenant_1', undefined, {
      resolveRuntimeProjection: runtimeResolver.resolveRuntimeProjection,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
    });

    expect(runtimeResolver.getProjection).toHaveBeenCalledWith('user_1', 'tenant_1');
    expect(center.kpi).toMatchObject({
      totalPosts: 2,
      totalVideos: 1,
      totalLeads: 10,
      totalConversions: 2,
      totalRevenue: 1500,
      conversionRate: 20,
    });
    expect(center.health.overallScore).toBe(64);
    expect(center.actions[0]).toMatchObject({
      action: 'Launch traffic',
      impact: 'Advance Journey State progress',
    });
    expect(center).not.toHaveProperty('runtime');
    expect(runtimeMetadata).toEqual([{
      enabled: false,
      mode: 'legacy',
      source: 'analytics-center',
      fallback: false,
      confidence: 'derived',
    }]);
  });

  it('routes through the Analytics Runtime Adapter and produces runtime metadata when the flag is ON', async () => {
    setRuntimeAnalyticsFlag('true');
    const runtimeMetadata: AnalyticsRuntimeMetadata[] = [];
    const runtimeResolver = createRuntimeResolver();

    const center = await analyticsService.getAnalyticsCenter('user_1', 'tenant_1', undefined, {
      resolveRuntimeProjection: runtimeResolver.resolveRuntimeProjection,
      onRuntimeResolved: (runtime) => runtimeMetadata.push(runtime),
    });

    expect(center).not.toHaveProperty('runtime');
    expect(center.health.overallScore).toBe(64);
    expect(runtimeMetadata).toHaveLength(1);
    expect(runtimeMetadata[0]).toMatchObject({
      enabled: true,
      mode: 'runtime',
      source: 'analytics-center',
      fallback: false,
      confidence: 'derived',
      capabilityId: 'analytics.projection.resolve',
      eventType: 'runtime.analytics.projection.resolved',
      diagnosticsStatus: 'healthy',
    });
    expect(runtimeMetadata[0]?.contextId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]?.correlationId).toEqual(expect.any(String));
    expect(runtimeMetadata[0]).not.toHaveProperty('tenantId');
    expect(runtimeMetadata[0]).not.toHaveProperty('userId');
  });
});
