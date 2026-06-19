import { describe, expect, it } from 'vitest';
import { buildReferralProjection } from '@/modules/referral/services/referral-projection';
import type { ReferralFacts } from '@/modules/referral/services/referral-facts';

function facts(patch: Partial<ReferralFacts> = {}): ReferralFacts {
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
      valueRealizationScore: 82,
      currentValueStage: 'growing',
      valueRisk: 'low',
      outcomeMetrics: {
        leadsGenerated: 6,
        appointmentsBooked: 2,
        customersAcquired: 3,
        revenueGenerated: 1200,
        teamMembersRecruited: 0,
        contentPublished: 4,
        viewsGenerated: 1200,
      },
      milestones: [],
      latestWin: null,
      nextMilestone: null,
      blockers: [],
      recommendedValueAction: {
        title: 'Scale value',
        reason: 'Value exists.',
        route: '/dashboard',
        expectedOutcome: 'More outcomes',
      },
      kpis: {
        firstLeadRate: 100,
        firstCustomerRate: 100,
        firstSaleRate: 100,
        revenueGenerated: 1200,
        customerSuccessRate: 100,
      },
    },
    expansionProjection: {
      source: 'ExpansionEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      businessMode: 'retail',
      expansionScore: 78,
      expansionStage: 'scaling',
      currentGrowthLever: {
        lever: 'customer_growth',
        title: '提高客户获取',
        reason: 'Customer growth is moving.',
        route: '/customers',
      },
      scaleReadiness: {
        score: 80,
        status: 'scale_ready',
        reason: 'Ready to scale.',
      },
      expansionOpportunities: [],
      expansionRisks: [],
      nextGrowthMilestone: {
        title: 'Reach 4 customers',
        metric: 'customer_growth',
        target: 'customers: 4',
        route: '/customers',
      },
      metrics: {
        leads: { current: 6, previous: 3, growthRate: 100 },
        customers: { current: 3, previous: 1, growthRate: 200 },
        revenue: { current: 1200, previous: 500, growthRate: 140 },
        audience: { current: 1200, previous: 600, growthRate: 100 },
        content: { current: 4, previous: 2, growthRate: 100 },
        team: { current: 0, previous: 0, growthRate: 0 },
      },
      kpis: {
        leadGrowthRate: 100,
        revenueGrowthRate: 140,
        customerGrowthRate: 200,
        teamGrowthRate: 0,
        expansionSuccessRate: 78,
      },
    },
    retentionProjection: {
      source: 'RetentionEngine',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      generatedAt: '2026-06-19T00:00:00.000Z',
      retentionScore: 80,
      retentionState: 'engaged_user',
      retentionRisk: 'low',
      momentumScore: 82,
      currentMomentum: 'Strong',
      currentStreak: 8,
      daysInactive: 0,
      inactivityFlag: 'none',
      signals: {
        loginFrequency: { key: 'login', label: 'Login', value: 8, target: 8, unit: 'count' },
        missionCompletionFrequency: { key: 'mission', label: 'Mission', value: 4, target: 4, unit: 'count' },
        contentCreationFrequency: { key: 'content', label: 'Content', value: 4, target: 4, unit: 'count' },
        executionConsistency: { key: 'execution', label: 'Execution', value: 100, target: 80, unit: 'percent' },
        aiCooInteractionFrequency: { key: 'ai', label: 'AI COO', value: 4, target: 4, unit: 'count' },
      },
      momentum: {
        missionsCompleted: 4,
        contentGenerated: 4,
        leadMagnetsCreated: 1,
        funnelsLaunched: 1,
        winsAchieved: 5,
        recentWins: [
          { type: 'mission', title: 'First sale', occurredAt: '2026-06-19T00:00:00.000Z' },
          { type: 'content', title: 'Transformation story', occurredAt: '2026-06-18T00:00:00.000Z' },
        ],
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
        thirtyDayRetention: true,
        missionCompletionRate: 100,
        subscriptionRetention: 'healthy',
      },
    },
    referralInvitesCreated: 2,
    referralInvitesUsed: 1,
    referralLeads: 2,
    referredMembers: 0,
    positiveSatisfactionSignals: 2,
    negativeSatisfactionSignals: 0,
    ...patch,
  };
}

describe('CUSTOMER-005 referral engine', () => {
  it('marks successful retail users as referral advocates', () => {
    const projection = buildReferralProjection(facts());

    expect(projection.referralScore).toBeGreaterThanOrEqual(70);
    expect(['advocate', 'champion']).toContain(projection.referralReadiness);
    expect(projection.referralOpportunities[0]).toMatchObject({
      type: 'customer_referral',
      title: '启动顾客转介绍',
    });
    expect(projection.kpis).toMatchObject({
      referralRate: 100,
      referralConversionRate: 50,
      advocateRate: 100,
    });
  });

  it('uses creator advocacy opportunities', () => {
    const projection = buildReferralProjection(facts({
      businessMode: 'creator',
      referralInvitesCreated: 0,
      referralInvitesUsed: 0,
      referralLeads: 0,
      positiveSatisfactionSignals: 1,
    }));

    expect(projection.referralOpportunities.map((item) => item.type).slice(0, 3)).toEqual([
      'share_success_story',
      'case_study',
      'content_collaboration',
    ]);
  });

  it('blocks referrals when value is not proven', () => {
    const projection = buildReferralProjection(facts({
      valueProjection: {
        ...facts().valueProjection,
        valueRealizationScore: 25,
        currentValueStage: 'progressing',
        valueRisk: 'medium',
      },
      expansionProjection: {
        ...facts().expansionProjection,
        expansionScore: 20,
        expansionStage: 'first_win',
      },
      retentionProjection: {
        ...facts().retentionProjection,
        retentionScore: 35,
        retentionRisk: 'medium',
      },
      referralInvitesCreated: 0,
      referralInvitesUsed: 0,
      referralLeads: 0,
      positiveSatisfactionSignals: 0,
    }));

    expect(projection.referralReadiness).toBe('not_ready');
    expect(projection.referralRisks[0]).toMatchObject({
      code: 'referral_value_not_proven',
    });
    expect(projection.nextReferralMilestone.target).toBe('Reach referral readiness: ready');
  });
});
