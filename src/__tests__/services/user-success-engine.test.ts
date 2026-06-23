import { describe, expect, it } from 'vitest';
import type { BusinessOutcome } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import { buildUserSuccessProjection } from '@/modules/user-success/services/user-success-projection';

function outcome(patch: Partial<BusinessOutcome> = {}): BusinessOutcome {
  return {
    id: 'outcome-first-customer',
    templateId: 'FIRST_CUSTOMER',
    name: 'Acquire First Customer',
    description: 'Coordinate missions until the first customer is recorded.',
    missions: [
      {
        missionId: 'mission-plan-lead_magnet',
        missionType: 'LEAD_MAGNET',
        name: 'Create Lead Magnet',
        route: '/lead-magnet',
        dependsOn: [],
        status: 'COMPLETED',
        completionPercentage: 100,
        workforcePlanId: 'workforce-lead-magnet',
      },
      {
        missionId: 'mission-plan-funnel',
        missionType: 'FUNNEL',
        name: 'Publish Funnel',
        route: '/funnel',
        dependsOn: ['mission-plan-lead_magnet'],
        status: 'COMPLETED',
        completionPercentage: 100,
        workforcePlanId: 'workforce-funnel',
      },
      {
        missionId: 'mission-plan-customers',
        missionType: 'CUSTOMERS',
        name: 'Convert Customer',
        route: '/crm',
        dependsOn: ['mission-plan-funnel'],
        status: 'COMPLETED',
        completionPercentage: 100,
        workforcePlanId: 'workforce-customers',
      },
    ],
    completionPercentage: 75,
    status: 'BLOCKED',
    blockedMissionIds: [],
    requiredSignal: {
      id: 'customerCount',
      label: 'Customer count',
      verified: false,
      currentValue: 0,
      operator: '>',
      targetValue: 0,
    },
    verificationBoundary: 'outcome_completion_requires_missions_and_signal',
    ...patch,
  };
}

function value(patch: Partial<ValueProjection> = {}): ValueProjection {
  return {
    source: 'ValueRealizationEngine',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    generatedAt: '2026-06-22T00:00:00.000Z',
    businessMode: 'retail',
    valueRealizationScore: 45,
    currentValueStage: 'progressing',
    valueRisk: 'medium',
    outcomeMetrics: {
      leadsGenerated: 5,
      appointmentsBooked: 1,
      customersAcquired: 0,
      revenueGenerated: 0,
      teamMembersRecruited: 0,
      contentPublished: 1,
      viewsGenerated: 100,
    },
    milestones: [],
    latestWin: null,
    nextMilestone: null,
    blockers: [],
    recommendedValueAction: {
      title: 'Reach First Customer',
      reason: 'Convert the first customer.',
      route: '/crm',
      expectedOutcome: 'First Customer',
    },
    kpis: {
      firstLeadRate: 100,
      firstCustomerRate: 0,
      firstSaleRate: 0,
      revenueGenerated: 0,
      customerSuccessRate: 0,
    },
    ...patch,
  };
}

function retention(patch: Partial<RetentionProjection> = {}): RetentionProjection {
  return {
    source: 'RetentionEngine',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    generatedAt: '2026-06-22T00:00:00.000Z',
    retentionScore: 60,
    retentionState: 'active_user',
    retentionRisk: 'medium',
    momentumScore: 55,
    currentMomentum: 'steady',
    outcomeRetention: {
      currentStage: 'ACTIVATED',
      retentionLevel: 'ACTIVE_PROGRESS',
      retentionLevelLabel: 'Active Progress',
      progressPercentage: 50,
      nextOutcome: 'FIRST_CUSTOMER',
      retained: false,
    },
    outcomeRecommendation: {
      outcome: 'FIRST_CUSTOMER',
      label: 'Acquire First Customer',
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
      messageKeys: ['retention.level.ACTIVE_PROGRESS'],
    },
    currentStreak: 2,
    daysInactive: 1,
    inactivityFlag: 'none',
    signals: {
      loginFrequency: { key: 'login', label: 'Login', value: 3, target: 4, unit: 'count' },
      missionCompletionFrequency: { key: 'mission', label: 'Mission', value: 2, target: 3, unit: 'count' },
      contentCreationFrequency: { key: 'content', label: 'Content', value: 1, target: 2, unit: 'count' },
      executionConsistency: { key: 'execution', label: 'Execution', value: 10, target: 20, unit: 'percent' },
      aiCooInteractionFrequency: { key: 'ai_coo', label: 'AI COO', value: 1, target: 3, unit: 'count' },
    },
    momentum: {
      missionsCompleted: 2,
      contentGenerated: 1,
      leadMagnetsCreated: 1,
      funnelsLaunched: 1,
      winsAchieved: 2,
      recentWins: [],
    },
    reEngagement: {
      needed: false,
      priority: 'medium',
      title: 'No re-engagement needed',
      reason: 'User is active.',
      route: '/dashboard',
    },
    kpis: {
      sevenDayRetention: true,
      fourteenDayRetention: false,
      thirtyDayRetention: false,
      missionCompletionRate: 66,
      subscriptionRetention: 'healthy',
    },
    ...patch,
  };
}

describe('PRODUCT-005 User Success Engine', () => {
  it('blocks success when missions are complete but the outcome signal is missing', () => {
    const projection = buildUserSuccessProjection({
      outcome: outcome(),
      valueProjection: value(),
      retentionProjection: retention(),
      generatedAt: '2026-06-22T00:00:00.000Z',
      locale: { userPreference: 'en' },
    });

    expect(projection.successState).toMatchObject({
      currentOutcome: 'FIRST_CUSTOMER',
      successLevel: 'BLOCKED',
      successful: false,
      blockedReason: 'conversion_blocker',
    });
    expect(projection.outcomeProgress).toMatchObject({
      missionCompletionPercentage: 100,
      signalProgressPercentage: 0,
      missionCompletionContributesOnly: true,
    });
    expect(projection.blockers[0]).toMatchObject({
      code: 'conversion_blocker',
      title: 'Conversion blocker',
    });
    expect(projection.recoveryActions[0]).toMatchObject({
      action: 'recovery_mission',
      title: 'Improve offer',
      route: '/crm',
    });
  });

  it('marks success only when the business outcome signal is verified', () => {
    const projection = buildUserSuccessProjection({
      outcome: outcome({
        status: 'COMPLETED',
        completionPercentage: 100,
        requiredSignal: {
          id: 'customerCount',
          label: 'Customer count',
          verified: true,
          currentValue: 1,
          operator: '>',
          targetValue: 0,
        },
      }),
      valueProjection: value({
        outcomeMetrics: {
          ...value().outcomeMetrics,
          customersAcquired: 1,
          revenueGenerated: 300,
        },
      }),
      retentionProjection: retention({ retentionRisk: 'low' }),
      generatedAt: '2026-06-22T00:00:00.000Z',
      locale: { userPreference: 'zh' },
    });

    expect(projection.successState).toMatchObject({
      successLevel: 'SUCCESSFUL',
      progressPercentage: 100,
      successful: true,
    });
    expect(projection.currentOutcome).toMatchObject({
      label: '获得第一位客户',
      currentResult: '1 Customers',
    });
    expect(projection.celebrations.map((celebration) => celebration.event)).toContain('first_customer');
    expect(projection.localization).toMatchObject({
      locale: 'zh',
      fallbackUsed: false,
    });
  });

  it('falls back to English for unsupported locales without rendering raw keys', () => {
    const projection = buildUserSuccessProjection({
      outcome: outcome(),
      valueProjection: value(),
      retentionProjection: retention(),
      generatedAt: '2026-06-22T00:00:00.000Z',
      locale: { userPreference: 'ja-JP' },
    });

    expect(projection.localization).toMatchObject({
      locale: 'en',
      localeSource: 'systemDefault',
      fallbackUsed: true,
    });
    expect(projection.currentOutcome.label).toBe('Acquire First Customer');
    expect(projection.currentOutcome.label).not.toContain('success.outcome');
  });
});
