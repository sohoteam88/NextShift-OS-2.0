import { describe, expect, it } from 'vitest';
import { buildExpansionProjection } from '@/modules/expansion/services/expansion-projection';
import { metric, type ExpansionFacts } from '@/modules/expansion/services/expansion-facts';

function facts(patch: Partial<ExpansionFacts> = {}): ExpansionFacts {
  return {
    businessMode: 'retail',
    generatedAt: '2026-06-19T00:00:00.000Z',
    valueProjection: {
      source: 'ValueRealizationEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      businessMode: 'retail',
      valueRealizationScore: 80,
      currentValueStage: 'growing',
      valueRisk: 'low',
      outcomeMetrics: {
        leadsGenerated: 4,
        appointmentsBooked: 1,
        customersAcquired: 2,
        revenueGenerated: 600,
        teamMembersRecruited: 0,
        contentPublished: 3,
        viewsGenerated: 1000,
      },
      milestones: [],
      latestWin: null,
      nextMilestone: null,
      blockers: [],
      recommendedValueAction: {
        title: 'Scale proven value',
        reason: 'Value exists.',
        route: '/dashboard',
        expectedOutcome: 'More outcomes',
      },
      kpis: {
        firstLeadRate: 100,
        firstCustomerRate: 100,
        firstSaleRate: 100,
        revenueGenerated: 600,
        customerSuccessRate: 100,
      },
    },
    retentionProjection: {
      source: 'RetentionEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      retentionScore: 75,
      retentionState: 'active_user',
      retentionRisk: 'low',
      momentumScore: 75,
      currentMomentum: 'Active',
      currentStreak: 5,
      daysInactive: 1,
      inactivityFlag: 'none',
      signals: {
        loginFrequency: { key: 'login', label: 'Login', value: 5, target: 8, unit: 'count' },
        missionCompletionFrequency: { key: 'mission', label: 'Mission', value: 3, target: 4, unit: 'count' },
        contentCreationFrequency: { key: 'content', label: 'Content', value: 3, target: 4, unit: 'count' },
        executionConsistency: { key: 'execution', label: 'Execution', value: 100, target: 80, unit: 'percent' },
        aiCooInteractionFrequency: { key: 'ai', label: 'AI COO', value: 3, target: 4, unit: 'count' },
      },
      momentum: {
        missionsCompleted: 3,
        contentGenerated: 3,
        leadMagnetsCreated: 1,
        funnelsLaunched: 1,
        winsAchieved: 4,
        recentWins: [],
      },
      reEngagement: {
        needed: false,
        priority: 'low',
        title: 'Keep going',
        reason: 'Active.',
        route: '/dashboard',
      },
      kpis: {
        sevenDayRetention: true,
        fourteenDayRetention: true,
        thirtyDayRetention: false,
        missionCompletionRate: 75,
        subscriptionRetention: 'healthy',
      },
    },
    metrics: {
      leads: metric(6, 3),
      customers: metric(2, 1),
      revenue: metric(800, 400),
      audience: metric(1200, 600),
      content: metric(4, 2),
      team: metric(0, 0),
    },
    ...patch,
  };
}

describe('CUSTOMER-004 expansion engine', () => {
  it('selects retail revenue or customer expansion after value realization', () => {
    const projection = buildExpansionProjection(facts());

    expect(projection.expansionScore).toBeGreaterThanOrEqual(70);
    expect(['scaling', 'optimizing']).toContain(projection.expansionStage);
    expect(projection.currentGrowthLever.lever).toBe('customer_growth');
    expect(projection.scaleReadiness.status).not.toBe('not_ready');
    expect(projection.kpis).toMatchObject({
      leadGrowthRate: 100,
      customerGrowthRate: 100,
      revenueGrowthRate: 100,
    });
  });

  it('uses creator content and audience levers', () => {
    const projection = buildExpansionProjection(facts({
      businessMode: 'creator',
      metrics: {
        leads: metric(1, 0),
        customers: metric(0, 0),
        revenue: metric(0, 0),
        audience: metric(1500, 500),
        content: metric(6, 2),
        team: metric(0, 0),
      },
    }));

    expect(projection.expansionOpportunities.map((item) => item.lever).slice(0, 2)).toEqual([
      'content_growth',
      'audience_growth',
    ]);
    expect(projection.nextGrowthMilestone.metric).toBe('content_growth');
  });

  it('blocks scale when value is not proven', () => {
    const projection = buildExpansionProjection(facts({
      valueProjection: {
        ...facts().valueProjection,
        valueRealizationScore: 20,
        currentValueStage: 'progressing',
        valueRisk: 'medium',
      },
      metrics: {
        leads: metric(0, 0),
        customers: metric(0, 0),
        revenue: metric(0, 0),
        audience: metric(0, 0),
        content: metric(1, 0),
        team: metric(0, 0),
      },
    }));

    expect(projection.expansionRisks[0]).toMatchObject({
      code: 'expansion_value_not_proven',
      priority: 'high',
    });
    expect(projection.expansionStage).toBe('repeatable');
  });
});
