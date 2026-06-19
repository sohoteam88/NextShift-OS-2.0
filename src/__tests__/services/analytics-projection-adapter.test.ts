import { beforeEach, describe, expect, it, vi } from 'vitest';

const businessMocks = vi.hoisted(() => ({
  businessStateService: { getBusinessState: vi.fn() },
}));

const journeyMocks = vi.hoisted(() => ({
  journeyStateService: { getJourneyState: vi.fn() },
}));

const growthMocks = vi.hoisted(() => ({
  growthLoopStateService: { getGrowthLoopState: vi.fn() },
}));

vi.mock('@/modules/business-state/services/BusinessStateService', () => businessMocks);
vi.mock('@/modules/journey/services/JourneyStateService', () => journeyMocks);
vi.mock('@/modules/growth-loop/services/GrowthLoopStateService', () => growthMocks);

import {
  getAnalyticsProjection,
  projectionToBenchmark,
  projectionToHealth,
  projectionToActions,
} from '@/modules/analytics/adapters/AnalyticsProjectionAdapter';

describe('AUTH-004 analytics projection adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    businessMocks.businessStateService.getBusinessState.mockResolvedValue({
      stage: 'lead_generation',
      readiness: {
        source: 'BusinessStateAssembler',
        scope: 'user',
        confidence: 'derived',
        fallback: 'none',
        score: 64,
        maxScore: 100,
        percentage: 64,
      },
      bottlenecks: [{ code: 'traffic_missing' }],
      opportunities: [],
    });
    journeyMocks.journeyStateService.getJourneyState.mockResolvedValue({
      source: 'JourneyStateAssembler',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      stage: 'lead_generation',
      milestones: [],
      missions: [],
      nextAction: {
        title: 'Launch traffic',
        description: 'Start sending audience traffic to the funnel.',
        route: '/traffic-engine',
      },
      revenueProgress: {
        completionPercent: 57,
        currentMilestone: 'First lead',
        nextMilestone: 'First customer',
      },
    });
    growthMocks.growthLoopStateService.getGrowthLoopState.mockResolvedValue({
      source: 'GrowthLoopAssembler',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      subjectId: 'user_1',
      generatedAt: '2026-06-19T00:00:00.000Z',
      health: 'active',
      overallScore: 72,
      acquisition: {},
      activation: {},
      retention: {},
      referral: {},
      expansion: {},
      signals: [],
      recommendations: [{ id: 'g1' }],
    });
  });

  it('consumes Business State, Journey State, and Growth Loop projections', async () => {
    const projection = await getAnalyticsProjection('user_1', 'tenant_1');

    expect(projection.readiness.value).toBe(64);
    expect(projection.progress.value).toBe(57);
    expect(projection.progress.nextAction.title).toBe('Launch traffic');
    expect(projection.growth.value).toBe(72);
    expect(projection.businessStateVersion).toContain('BusinessStateAssembler');
    expect(projection.journeyVersion).toContain('JourneyStateAssembler');
    expect(projection.growthLoopVersion).toContain('GrowthLoopAssembler');
  });

  it('maps projections into legacy analytics center fields without local conclusions', async () => {
    const projection = await getAnalyticsProjection('user_1', 'tenant_1');

    expect(projectionToHealth(projection).overallScore).toBe(64);
    expect(projectionToActions(projection)[0].action).toBe('Launch traffic');
    expect(projectionToBenchmark(projection)).toMatchObject({
      level: 'growth',
      progress: 72,
    });
  });
});
