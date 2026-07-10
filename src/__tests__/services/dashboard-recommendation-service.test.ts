import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  Recommendation,
  type DecisionContext,
  type DecisionContextId,
  type RecommendationEngine,
  type RecommendationId,
} from '@nextshift/decision-brain';
import {
  getCommandCenterRecommendation,
  type CommandCenterRecommendationDependencies,
} from '@/modules/dashboard/services/recommendation-service';

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER;

function setCommandCenterFlag(value: string | undefined) {
  if (value === undefined) {
    delete process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER;
    return;
  }

  process.env.NEXT_PUBLIC_ENABLE_COMMAND_CENTER = value;
}

afterEach(() => {
  setCommandCenterFlag(ORIGINAL_FLAG);
  vi.restoreAllMocks();
});

describe('Command Center recommendation service', () => {
  it('returns null and does not call decision-brain when the flag is OFF', async () => {
    setCommandCenterFlag(undefined);
    const recommendationEngine: RecommendationEngine = { generate: vi.fn() };
    const dependencies = createDependencies({ recommendationEngine });

    const result = await getCommandCenterRecommendation(user(), dependencies);
    const loaders = dependencies.loaders!;

    expect(result).toBeNull();
    expect(loaders.getCurrentMission).not.toHaveBeenCalled();
    expect(loaders.getBusinessState).not.toHaveBeenCalled();
    expect(loaders.resolveAnalytics).not.toHaveBeenCalled();
    expect(loaders.resolveRevenue).not.toHaveBeenCalled();
    expect(recommendationEngine.generate).not.toHaveBeenCalled();
  });

  it('uses the decision-brain recommendation engine when runtime context is sufficient', async () => {
    setCommandCenterFlag('true');
    const generate = vi.fn((context: DecisionContext) => [
      Recommendation.create({
        recommendationId: 'recommendation-1' as RecommendationId,
        decisionContextId: context.toSnapshot().decisionContextId,
        recommendationType: 'Growth',
        title: 'Convert the next qualified lead',
        summary: 'Focus today on the highest-impact sales action.',
        rationale: 'Mission, business-state, revenue, and analytics signals agree on conversion.',
        confidence: 0.84,
        impact: 0.86,
        urgency: 0.74,
        effort: 0.4,
        createdAt: '2026-07-10T00:00:00.000Z',
      }),
    ]);
    const dependencies = createDependencies({
      recommendationEngine: { generate },
      now: () => new Date('2026-07-10T00:00:00.000Z'),
    });

    const result = await getCommandCenterRecommendation(user(), dependencies);
    const loaders = dependencies.loaders!;

    expect(generate).toHaveBeenCalledTimes(1);
    expect(loaders.getCurrentMission).toHaveBeenCalledWith('user_1', {}, {
      source: 'dashboard',
    });
    expect(loaders.getBusinessState).toHaveBeenCalledWith('user_1', {
      source: 'command-center',
    });
    expect(loaders.resolveAnalytics).toHaveBeenCalledWith({
      userId: 'user_1',
      tenantId: 'tenant_1',
      source: 'api',
      projectionType: 'analytics-center',
      workspaceFocus: 'command-center',
    });
    expect(loaders.resolveRevenue).toHaveBeenCalledWith({
      route: '/sales',
      intent: 'customers',
      tenantId: 'tenant_1',
      userId: 'user_1',
      source: 'dashboard',
    });
    expect(result).toEqual({
      recommendation: {
        id: 'recommendation-1',
        title: 'Convert the next qualified lead',
        summary: 'Focus today on the highest-impact sales action.',
        rationale: 'Mission, business-state, revenue, and analytics signals agree on conversion.',
        type: 'Growth',
        route: '/sales',
        ctaLabel: 'Open Sales',
      },
      confidence: 0.84,
      explain: 'Mission, business-state, revenue, and analytics signals agree on conversion.',
      source: 'engine',
    });
  });

  it('falls back to a rule-based recommendation for cold-start AI Interview context', async () => {
    setCommandCenterFlag('true');
    const generate = vi.fn();
    const dependencies = createDependencies({
      recommendationEngine: { generate },
      loaders: {
        getCurrentMission: vi.fn().mockResolvedValue(mission({ aiInterview: true })),
        getBusinessState: vi.fn().mockResolvedValue(businessState({ missingInterview: true })),
      },
    });

    const result = await getCommandCenterRecommendation(user(), dependencies);

    expect(generate).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      recommendation: {
        id: 'command-center-rule-ai-interview',
        title: 'Complete the AI Interview',
        route: '/brand-builder/step/interview',
      },
      confidence: 0.9,
      source: 'rule',
    });
  });
});

function user() {
  return {
    id: 'user_1',
    tenantId: 'tenant_1',
  };
}

function createDependencies(
  overrides: Partial<CommandCenterRecommendationDependencies> = {},
): CommandCenterRecommendationDependencies & Record<string, any> {
  const loaders = {
    getCurrentMission: vi.fn().mockResolvedValue(mission()),
    getBusinessState: vi.fn().mockResolvedValue(businessState()),
    resolveAnalytics: vi.fn().mockResolvedValue(analyticsOutput()),
    resolveRevenue: vi.fn().mockReturnValue(revenueOutput()),
    ...overrides.loaders,
  };

  return {
    ...overrides,
    loaders,
  };
}

function mission(input: { aiInterview?: boolean } = {}) {
  return {
    currentMission: {
      id: input.aiInterview ? 'MISSION_AI_INTERVIEW' : 'MISSION_CONVERT_LEAD',
      title: input.aiInterview ? 'Start AI Interview' : 'Convert the next qualified lead',
      description: 'Focus on the current bottleneck.',
      expectedOutcome: 'Business progress',
      estimatedMinutes: 15,
      status: 'active',
      priority: 90,
      unlockConditions: [],
      completionConditions: [],
      route: input.aiInterview ? '/brand-builder/step/interview' : '/sales',
    },
    priorityAction: {
      missionType: input.aiInterview ? 'BRAND' : 'CUSTOMERS',
      title: input.aiInterview ? 'Start AI Interview' : 'Convert the next qualified lead',
      route: input.aiInterview ? '/brand-builder/step/interview' : '/sales',
      ctaLabel: input.aiInterview ? 'Start AI Interview' : 'Open Sales',
      priority: 'High',
    },
    priorityResult: {
      priorityAction: input.aiInterview ? 'Start AI Interview' : 'Convert the next qualified lead',
      priorityReason: 'Resolve the active bottleneck.',
      expectedImpact: 'Move the business to the next state.',
      urgency: 'High',
      confidence: 0.82,
      category: input.aiInterview ? 'FOUNDATION' : 'CONVERSION',
      missionType: input.aiInterview ? 'BRAND' : 'CUSTOMERS',
      route: input.aiInterview ? '/brand-builder/step/interview' : '/sales',
      ctaLabel: input.aiInterview ? 'Start AI Interview' : 'Open Sales',
    },
    explainability: {
      whyThis: 'This is the highest leverage action.',
      whyNow: 'The current signals point to this action today.',
      whyNotOthers: 'Other work depends on this step.',
      expectedOutcome: 'Clear next progress.',
      expectedRisk: 'Delay slows the journey.',
      nextMilestone: 'Next stage',
      locale: 'en',
      source: 'ExplainabilityEngine',
      completed: [],
      currentGap: input.aiInterview ? 'NO_BRAND' : 'NO_CONVERSION',
      reasoning: 'Resolve active bottleneck.',
      decisionReason: 'Priority engine selected it.',
      evidence: [],
      severity: 'High',
      confidence: 0.82,
    },
    bottleneck: input.aiInterview ? 'NO_BRAND' : 'NO_CONVERSION',
    bottleneckResult: {
      bottleneck: input.aiInterview ? 'NO_BRAND' : 'NO_CONVERSION',
      confidence: 0.82,
      evidence: ['test evidence'],
      severity: 'High',
      explainability: 'test',
    },
    missionPlan: {
      id: input.aiInterview ? 'MISSION_AI_INTERVIEW' : 'MISSION_CONVERT_LEAD',
      objective: input.aiInterview ? 'Start AI Interview' : 'Convert the next qualified lead',
      description: 'Resolve active bottleneck.',
      steps: [],
      estimatedTime: 15,
      successCriteria: [],
      completionChecks: [],
      route: input.aiInterview ? '/brand-builder/step/interview' : '/sales',
      missionType: input.aiInterview ? 'BRAND' : 'CUSTOMERS',
      nextMilestone: 'Next stage',
    },
  } as any;
}

function businessState(input: { missingInterview?: boolean } = {}) {
  return {
    stage: input.missingInterview ? 'foundation' : 'customer_acquisition',
    readiness: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      score: input.missingInterview ? 10 : 80,
      maxScore: 100,
      percentage: input.missingInterview ? 10 : 80,
    },
    bottlenecks: [],
    opportunities: [{
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      code: 'CONVERT_LEAD',
      title: 'Convert a qualified lead',
      description: 'Close the next opportunity.',
      impact: 'high',
      domain: 'sales',
    }],
    stateResult: {
      currentState: input.missingInterview ? 'BRAND_FOUNDATION' : 'SALES',
      completedStates: input.missingInterview ? [] : ['BRAND_FOUNDATION', 'BRAND_POSITIONING'],
      missingRequirements: input.missingInterview ? ['AI Interview Completed'] : [],
      nextState: input.missingInterview ? 'BRAND_POSITIONING' : 'TEAM_BUILDING',
      readinessScore: input.missingInterview ? 10 : 80,
      explainability: {
        completed: input.missingInterview ? [] : ['BRAND_FOUNDATION', 'BRAND_POSITIONING'],
        missing: input.missingInterview
          ? [{ id: 'interviewCompleted', label: 'AI Interview Completed', completed: false }]
          : [],
        reason: input.missingInterview ? 'Interview missing.' : 'Ready for conversion.',
      },
    },
  } as any;
}

function analyticsOutput() {
  return {
    projection: {
      businessStateVersion: 'test:sales:80',
      journeyVersion: 'test:sales:65',
      growthLoopVersion: 'test:growth:55',
      readiness: { value: 80, stage: 'customer_acquisition', bottleneckCount: 0 },
      progress: {
        value: 65,
        stage: 'sales',
        nextAction: {
          title: 'Convert qualified lead',
          description: 'Follow up with the highest intent lead.',
          route: '/sales',
        },
      },
      growth: { value: 55, health: 'medium', recommendationCount: 1 },
    },
    runtime: {
      enabled: true,
      mode: 'runtime',
      source: 'api',
      fallback: false,
      confidence: 'derived',
    },
  };
}

function revenueOutput() {
  return {
    resolution: {
      status: 'resolved',
      driverId: 'crm',
      route: '/sales',
      intent: 'customers',
      toolId: 'crm.follow-up',
      titleKey: 'test.title',
      descriptionKey: 'test.description',
      focusTargetId: 'test-focus',
      state: {},
    },
    runtime: {
      enabled: true,
      mode: 'runtime',
      source: 'dashboard',
      fallback: false,
      confidence: 0.8,
    },
  };
}
