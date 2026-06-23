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
      expansionState: {
        currentExpansionStage: 'scaling',
        expansionLevel: 'SCALING',
        expansionLevelLabel: 'Scaling',
        expansionProgress: 72,
        nextExpansionOpportunity: 'RETENTION_SYSTEM',
        nextExpansionOpportunityLabel: 'Build retention system',
        expanding: true,
      },
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
      expansionOpportunity: {
        id: 'expand_customer_growth',
        lever: 'customer_growth',
        opportunity: 'RETENTION_SYSTEM',
        title: 'Build retention system',
        reason: 'Customer growth is moving.',
        route: '/customers',
        priority: 'high',
        expectedMetricLift: 'Increase customer growth rate.',
        personalizedBy: ['businessMode', 'stage', 'region'],
      },
      expansionOpportunities: [
        {
          id: 'expand_customer_growth',
          lever: 'customer_growth',
          opportunity: 'RETENTION_SYSTEM',
          title: 'Build retention system',
          reason: 'Customer growth is moving.',
          route: '/customers',
          priority: 'high',
          expectedMetricLift: 'Increase customer growth rate.',
          personalizedBy: ['businessMode', 'stage', 'region'],
        },
      ],
      expansionRisks: [],
      expansionRecovery: {
        needed: false,
        riskCode: 'none',
        action: 'expansion_outcome',
        title: 'Recommend expansion outcome',
        reason: 'The user is ready for the next larger business outcome.',
        route: '/customers',
      },
      expansionCelebrations: [
        { id: 'first_revenue', title: 'First revenue achieved', occurredAt: '2026-06-19T00:00:00.000Z' },
      ],
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
        expansionRate: 100,
        outcomeProgressionRate: 60,
        expansionOpportunityAdoption: 72,
      },
      localization: {
        locale: 'en',
        source: 'systemDefault',
        translationSource: 'registry',
        fallbackUsed: false,
        messageKeys: ['expansion.level.SCALING'],
      },
      personalization: {
        businessModel: 'retail',
        stage: 'scaling',
        locale: 'en',
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
      outcomeRetention: {
        currentStage: 'RETAINED',
        retentionLevel: 'RETAINED',
        retentionLevelLabel: 'Retained',
        progressPercentage: 100,
        nextOutcome: 'FIRST_REVENUE',
        retained: true,
      },
      outcomeRecommendation: {
        outcome: 'FIRST_REVENUE',
        label: 'Generate First Revenue',
        reason: 'The user is ready for the next business outcome.',
        route: '/mission',
      },
      retentionRecovery: {
        needed: false,
        action: 'recommend_next_outcome',
        title: 'Recommend next outcome',
        reason: 'The user is ready for the next business outcome.',
        route: '/mission',
      },
      localization: {
        locale: 'en',
        localeSource: 'systemDefault',
        translationSource: 'registry',
        fallbackUsed: false,
        messageKeys: ['retention.level.RETAINED'],
      },
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
    referredMembers: 1,
    activatedReferrals: 1,
    successfulReferrals: 1,
    pendingReferrals: 1,
    ignoredReferralRequests: 0,
    referralAttribution: [
      {
        referralUserId: 'referred-user-1',
        source: 'invite_code',
        activated: true,
        successful: true,
        activatedAt: '2026-06-19T00:00:00.000Z',
      },
    ],
    positiveSatisfactionSignals: 2,
    negativeSatisfactionSignals: 0,
    ...patch,
  };
}

describe('PRODUCT-008 referral engine', () => {
  it('marks successful retail users as referral advocates', () => {
    const projection = buildReferralProjection(facts());

    expect(projection.referralScore).toBeGreaterThanOrEqual(70);
    expect(['advocate', 'ambassador', 'champion']).toContain(projection.referralReadiness);
    expect(projection.referralState).toMatchObject({
      referralReady: true,
      referralLevel: 'ADVOCATE',
      referralCount: 2,
      successfulReferrals: 1,
      pendingReferrals: 1,
      nextReferralOpportunity: 'invite_friend',
    });
    expect(projection.referralRecommendation).toMatchObject({
      type: 'invite_friend',
    });
    expect(projection.kpis).toMatchObject({
      referralRate: 100,
      referralConversionRate: 50,
      advocateRate: 100,
      activatedReferralRate: 50,
    });
  });

  it('does not count invites or leads as successful referrals before referred user activation', () => {
    const projection = buildReferralProjection(facts({
      activatedReferrals: 0,
      successfulReferrals: 0,
      referredMembers: 1,
      pendingReferrals: 3,
      referralAttribution: [
        {
          referralUserId: 'referred-user-1',
          source: 'invite_code',
          activated: false,
          successful: false,
          activatedAt: null,
        },
      ],
    }));

    expect(projection.referralReadiness).toBe('ready');
    expect(projection.referralState).toMatchObject({
      referralLevel: 'READY',
      successfulReferrals: 0,
      pendingReferrals: 3,
    });
    expect(projection.kpis).toMatchObject({
      referralConversionRate: 0,
      successfulReferralRate: 0,
      activatedReferralRate: 0,
    });
  });

  it('uses creator advocacy opportunities', () => {
    const projection = buildReferralProjection(facts({
      businessMode: 'creator',
      referralInvitesCreated: 0,
      referralInvitesUsed: 0,
      referralLeads: 0,
      referredMembers: 0,
      activatedReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      referralAttribution: [],
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
      referredMembers: 0,
      activatedReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 0,
      referralAttribution: [],
      positiveSatisfactionSignals: 0,
    }));

    expect(projection.referralReadiness).toBe('not_ready');
    expect(projection.referralRisks[0]).toMatchObject({
      code: 'referral_value_not_proven',
      riskCode: 'NO_SUCCESS_YET',
    });
    expect(projection.nextReferralMilestone.target).toBe('Reach referral readiness: ready');
  });

  it('detects ignored referral request risk and reduces frequency', () => {
    const projection = buildReferralProjection(facts({
      referralInvitesCreated: 5,
      referralInvitesUsed: 0,
      activatedReferrals: 0,
      successfulReferrals: 0,
      pendingReferrals: 5,
      ignoredReferralRequests: 5,
      referralAttribution: [],
    }));

    expect(projection.referralRisks.some((risk) => risk.riskCode === 'REFERRAL_REQUESTS_IGNORED')).toBe(true);
  });
});
