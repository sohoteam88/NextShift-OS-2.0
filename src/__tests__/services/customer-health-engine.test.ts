import { describe, expect, it } from 'vitest';
import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import { buildCustomerHealthProjection } from '@/modules/customer-health/services/customer-health-projection';
import type { CustomerHealthFacts } from '@/modules/customer-health/services/customer-health-facts';

function facts(patch: Partial<CustomerHealthFacts> = {}): CustomerHealthFacts {
  const activationProjection = {
    activationScore: 90,
    activationRisk: 'low',
    localization: { locale: 'en' },
  } as ActivationProjection;
  const userSuccessProjection = {
    successScore: 88,
    successState: {
      currentOutcome: 'FIRST_REVENUE',
      successLevel: 'SUCCESSFUL',
      progressPercentage: 100,
      successful: true,
    },
    currentOutcome: { label: 'Generate first revenue' },
    blockers: [],
  } as unknown as UserSuccessProjection;
  const retentionProjection = {
    retentionScore: 86,
    retentionRisk: 'low',
    currentMomentum: 'Outcome momentum is strong.',
    outcomeRetention: {
      currentStage: 'RETAINED',
      retentionLevel: 'RETAINED',
      retentionLevelLabel: 'Retained',
      progressPercentage: 100,
      nextOutcome: 'RETENTION_SYSTEM',
      retained: true,
    },
    retentionRecovery: {
      needed: false,
      reason: 'The user is ready for the next business outcome.',
      route: '/mission',
    },
    signals: {
      missionCompletionFrequency: { value: 4, target: 4 },
    },
    momentum: {
      missionsCompleted: 4,
      outcomeVelocity30d: 2,
      daysSinceLastOutcome: 3,
      assetUtilizationCount: 2,
    },
  } as RetentionProjection;
  const expansionProjection = {
    expansionScore: 90,
    expansionState: {
      currentExpansionStage: 'scaling',
      expansionLevel: 'SCALING',
      expansionLevelLabel: 'Scaling',
      expansionProgress: 90,
      nextExpansionOpportunity: 'TEAM_SCALING',
      nextExpansionOpportunityLabel: 'Scale team',
      expanding: true,
    },
    expansionRecovery: {
      needed: false,
      riskCode: 'none',
      reason: 'The user is ready for the next larger business outcome.',
      route: '/team/growth',
    },
    personalization: {
      businessModel: 'retail',
      stage: 'scaling',
      locale: 'en',
    },
  } as ExpansionProjection;
  const referralProjection = {
    referralScore: 84,
    referralState: {
      successfulReferrals: 1,
    },
    referralRisks: [],
  } as unknown as ReferralProjection;

  return {
    generatedAt: '2026-06-23T00:00:00.000Z',
    activationProjection,
    userSuccessProjection,
    retentionProjection,
    expansionProjection,
    referralProjection,
    locale: 'en',
    ...patch,
  };
}

describe('PRODUCT-009 customer health engine', () => {
  it('marks expanding and referring users as thriving', () => {
    const projection = buildCustomerHealthProjection(facts({ previousHealthScore: 78 }));

    expect(projection.customerHealth.healthLevel).toBe('THRIVING');
    expect(projection.customerHealth.healthScore).toBeGreaterThanOrEqual(85);
    expect(projection.customerHealth.interventionRequired).toBe(false);
    expect(projection.healthTrend.direction).toBe('UP');
    expect(projection.customerHealth.healthDrivers.map((driver) => driver.type)).toContain('referral_success');
  });

  it('detects predictive health risk before churn', () => {
    const base = facts();
    const projection = buildCustomerHealthProjection(facts({
      previousHealthScore: 74,
      userSuccessProjection: {
        ...base.userSuccessProjection,
        successScore: 42,
        successState: {
          currentOutcome: 'FIRST_REVENUE',
          successLevel: 'AT_RISK',
          progressPercentage: 35,
          successful: false,
        },
        blockers: [
          {
            code: 'revenue_blocker',
            title: 'Revenue stalled',
            reason: 'Revenue outcome has not moved.',
            route: '/sales',
          },
        ],
      } as UserSuccessProjection,
      retentionProjection: {
        ...base.retentionProjection,
        retentionScore: 50,
        retentionRisk: 'high',
        retentionRecovery: {
          needed: true,
          reason: 'No outcome progress for 14 days.',
          route: '/mission',
        },
        momentum: {
          missionsCompleted: 0,
          daysSinceLastOutcome: 18,
          assetUtilizationCount: 0,
        },
      } as RetentionProjection,
    }));

    expect(projection.customerHealth.healthLevel).toBe('AT_RISK');
    expect(projection.customerHealth.interventionRequired).toBe(true);
    expect(projection.customerHealth.riskFactors.map((risk) => risk.type)).toContain('no_outcome_progress');
    expect(projection.recommendedAction.action).toBe('outcome_recovery_mission');
    expect(projection.healthTrend.direction).toBe('DOWN');
  });

  it('escalates critical expansion stalls', () => {
    const base = facts();
    const projection = buildCustomerHealthProjection(facts({
      expansionProjection: {
        ...base.expansionProjection,
        expansionScore: 35,
        expansionRecovery: {
          needed: true,
          riskCode: 'STALLED_GROWTH',
          reason: 'No new verified outcome has been detected for 45 days.',
          route: '/mission',
        },
      } as ExpansionProjection,
    }));

    expect(projection.customerHealth.healthLevel).toBe('CRITICAL');
    expect(projection.customerHealth.riskFactors[0]).toMatchObject({
      type: 'expansion_plateau',
      severity: 'critical',
    });
    expect(projection.recommendedAction.action).toBe('expansion_recovery_mission');
  });
});
