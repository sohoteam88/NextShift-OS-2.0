import { describe, expect, it } from 'vitest';
import { verifyMissionCompletion } from '@/modules/mission-engine/services/MissionCompletionVerifier';
import { generateMissionPlan } from '@/modules/mission-engine/services/MissionGeneratorV2';
import type { BottleneckResult, ExplainabilityResult, PriorityResult } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { BottleneckSignals } from '@/modules/mission-engine/services/BottleneckEngine';

function bottleneckResult(bottleneck: BottleneckResult['bottleneck']): BottleneckResult {
  return {
    bottleneck,
    confidence: 80,
    evidence: [`internal_diagnostic:${bottleneck}`],
    severity: bottleneck === 'BUSINESS_HEALTHY' ? 'None' : 'High',
    explainability: `internal_diagnostic:${bottleneck}`,
  };
}

function explanation(): ExplainabilityResult {
  return {
    whyThis: 'The business needs an executable next action.',
    whyNow: 'The current bottleneck is ready to be resolved.',
    whyNotOthers: 'This action addresses the active constraint first.',
    expectedOutcome: 'The business moves to the next stage.',
    expectedRisk: 'Progress may slow if the action is ignored.',
    nextMilestone: 'Build Funnel',
    locale: 'en',
    source: 'ExplainabilityEngine',
  };
}

function priority(overrides: Partial<PriorityResult> = {}): PriorityResult {
  return {
    priorityAction: 'Create Lead Magnet',
    priorityReason: 'The business needs a clear reason for visitors to leave contact information before traffic is scaled.',
    expectedImpact: 'Qualified visitors can become leads through a concrete opt-in asset.',
    urgency: 'High',
    confidence: 82,
    category: 'LEADS',
    missionType: 'LEAD_MAGNET',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
    ...overrides,
  };
}

function plan(overrides: Partial<PriorityResult> = {}) {
  return generateMissionPlan({
    bottleneckResult: bottleneckResult(overrides.missionType === 'CUSTOMERS' ? 'NO_CUSTOMERS' : 'NO_LEAD_MAGNET'),
    priorityResult: priority(overrides),
    explainability: explanation(),
  });
}

describe('HOTFIX-007 Mission Completion Verifier', () => {
  it('marks a mission completed only when all required checks pass', () => {
    const result = verifyMissionCompletion({
      missionPlan: plan(),
      signals: {
        leadMagnetExists: true,
        leadMagnetPublished: true,
        leadMagnetCtaExists: true,
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      },
      now: new Date('2026-06-22T00:00:00.000Z'),
    });

    expect(result).toMatchObject({
      completed: true,
      completionPercentage: 100,
      passedChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
      failedChecks: [],
      nextRequiredCheck: null,
      verificationStatus: 'VERIFIED',
      verificationSource: 'signal',
      source: 'MissionCompletionVerifier',
    });
  });

  it('returns 66 percent when two of three checks pass', () => {
    const result = verifyMissionCompletion({
      missionPlan: plan(),
      signals: {
        leadMagnetExists: true,
        leadMagnetPublished: true,
        leadMagnetCtaExists: false,
        contactMethodExists: false,
        leadRouteExists: false,
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      },
    });

    expect(result).toMatchObject({
      completed: false,
      completionPercentage: 66,
      passedChecks: ['leadMagnet.exists', 'leadMagnet.published'],
      failedChecks: ['cta.active'],
      nextRequiredCheck: 'cta.active',
      verificationStatus: 'BLOCKED',
      verificationSource: 'signal',
    });
  });

  it('returns zero percent when no checks pass', () => {
    const result = verifyMissionCompletion({
      missionPlan: plan(),
      signals: {
        leadMagnetExists: false,
        leadMagnetPublished: false,
        leadMagnetCtaExists: false,
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      },
    });

    expect(result).toMatchObject({
      completed: false,
      completionPercentage: 0,
      passedChecks: [],
      failedChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
      nextRequiredCheck: 'leadMagnet.exists',
    });
  });

  it('keeps the mission verifying when verification sources fail', () => {
    const result = verifyMissionCompletion({
      missionPlan: plan(),
      signals: null,
      sourceAvailable: false,
    });

    expect(result).toMatchObject({
      completed: false,
      completionPercentage: 0,
      passedChecks: [],
      verificationStatus: 'VERIFYING',
      verificationSource: 'unavailable',
      nextRequiredCheck: 'leadMagnet.exists',
    });
  });

  it('does not trust workspace step keys or manual progress as completion evidence', () => {
    const input = {
      missionPlan: {
        ...plan(),
        completionChecks: ['workspace.step.lead_magnet.3.leadMagnet_publish'],
      },
      completedChecks: ['workspace.step.lead_magnet.3.leadMagnet_publish'],
      signals: {
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      },
    } as unknown as Parameters<typeof verifyMissionCompletion>[0];
    const result = verifyMissionCompletion(input);

    expect(result).toMatchObject({
      completed: false,
      completionPercentage: 0,
      passedChecks: [],
      failedChecks: ['workspace.step.lead_magnet.3.leadMagnet_publish'],
      nextRequiredCheck: 'workspace.step.lead_magnet.3.leadMagnet_publish',
      verificationSource: 'signal',
    });
  });

  it('does not complete a customer mission from legacy completed checks without customer signals', () => {
    const customerPlan = plan({
      priorityAction: 'Convert Existing Leads',
      category: 'CONVERSION',
      missionType: 'CUSTOMERS',
      route: '/leads',
      ctaLabel: '跟进线索',
    });
    const input = {
      missionPlan: customerPlan,
      bottleneckResult: bottleneckResult('NO_CUSTOMERS'),
      completedChecks: ['first_sale_completed'],
      signals: {
        customerCount: 0,
        crmActivityCount: 0,
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      },
    } as unknown as Parameters<typeof verifyMissionCompletion>[0];
    const result = verifyMissionCompletion(input);

    expect(result).toMatchObject({
      completed: false,
      completionPercentage: 0,
      passedChecks: [],
      failedChecks: ['lead.followUpCompleted', 'customerOpportunity.updated'],
      verificationSource: 'signal',
    });
  });

  it('completes a customer mission when customer evidence exists', () => {
    const customerPlan = plan({
      priorityAction: 'Convert Existing Leads',
      category: 'CONVERSION',
      missionType: 'CUSTOMERS',
      route: '/leads',
      ctaLabel: '跟进线索',
    });
    const result = verifyMissionCompletion({
      missionPlan: customerPlan,
      bottleneckResult: bottleneckResult('NO_CUSTOMERS'),
      signals: {
        customerCount: 1,
        signalSourceAvailable: true,
        requiredMetricsResolved: true,
      } as Partial<BottleneckSignals>,
    });

    expect(result).toMatchObject({
      completed: true,
      completionPercentage: 100,
      passedChecks: ['lead.followUpCompleted', 'customerOpportunity.updated'],
      failedChecks: [],
    });
  });
});
