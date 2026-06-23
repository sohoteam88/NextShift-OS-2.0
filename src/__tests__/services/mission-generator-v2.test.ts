import { describe, expect, it } from 'vitest';
import { generateMissionPlan, validateMissionCompletion } from '@/modules/mission-engine/services/MissionGeneratorV2';
import type { BottleneckResult, ExplainabilityResult, PriorityResult } from '@/modules/mission-engine/contracts/MissionAuthority';

function bottleneckResult(bottleneck: BottleneckResult['bottleneck']): BottleneckResult {
  return {
    bottleneck,
    confidence: 80,
    evidence: [`internal_diagnostic:${bottleneck}`],
    severity: bottleneck === 'BUSINESS_HEALTHY' ? 'None' : 'High',
    explainability: `internal_diagnostic:${bottleneck}`,
  };
}

function explanation(nextMilestone = 'Build Funnel'): ExplainabilityResult {
  return {
    whyThis: 'The business needs an executable next action.',
    whyNow: 'The current bottleneck is ready to be resolved.',
    whyNotOthers: 'This action addresses the active constraint first.',
    expectedOutcome: 'The business moves to the next stage.',
    expectedRisk: 'Progress may slow if the action is ignored.',
    nextMilestone,
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

describe('COO-005 Mission Generator V2', () => {
  it('converts a lead magnet priority into an executable mission plan', () => {
    const plan = generateMissionPlan({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      priorityResult: priority(),
      explainability: explanation('Build Funnel'),
    });

    expect(plan).toMatchObject({
      objective: 'Create Your First Lead Magnet',
      description: expect.stringContaining('lead capture asset'),
      estimatedTime: 35,
      route: '/lead-magnet',
      missionType: 'LEAD_MAGNET',
      nextMilestone: 'Build Funnel',
      successCriteria: ['Lead Magnet Exists', 'Lead Magnet Published', 'CTA Active'],
      completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    });
    expect(plan.steps).toHaveLength(4);
    expect(plan.steps[0]).toMatchObject({
      id: 'leadMagnet.type',
      title: 'Select Lead Magnet Type',
      required: true,
    });
  });

  it('generates a healthy business optimization mission', () => {
    const plan = generateMissionPlan({
      bottleneckResult: bottleneckResult('BUSINESS_HEALTHY'),
      priorityResult: priority({
        priorityAction: 'Optimize Growth',
        expectedImpact: 'The business keeps momentum while testing growth, revenue, or scale opportunities.',
        urgency: 'Normal',
        category: 'OPTIMIZATION',
        missionType: 'OPTIMIZATION',
        route: '/dashboard',
        ctaLabel: '继续优化系统',
      }),
      explainability: explanation('Scale Operations'),
    });

    expect(plan).toMatchObject({
      objective: 'Growth Optimization Mission',
      successCriteria: ['Optimization Completed'],
      completionChecks: ['optimization.completed'],
      nextMilestone: 'Scale Operations',
    });
    expect(plan.steps.map((step) => step.title)).toEqual([
      'Analyze Opportunities',
      'Select Experiment',
      'Execute Experiment',
      'Review Outcome',
    ]);
  });

  it('generates a webinar conversion mission', () => {
    const plan = generateMissionPlan({
      bottleneckResult: bottleneckResult('NO_CONVERSION'),
      priorityResult: priority({
        priorityAction: 'Generate Webinar Conversion System',
        expectedImpact: 'Warm prospects get a structured presentation, offer stack, Q&A handling, and follow-up path.',
        category: 'CONVERSION',
        missionType: 'WEBINAR',
        route: '/webinar-center',
        ctaLabel: '生成 Webinar 系统',
      }),
      explainability: explanation('Acquire First Customer'),
    });

    expect(plan).toMatchObject({
      objective: 'Generate Webinar Conversion System',
      route: '/webinar-center',
      missionType: 'WEBINAR',
      nextMilestone: 'Acquire First Customer',
      successCriteria: ['Webinar Deck Generated', 'Speaker Script Generated', 'Offer Stack Generated', 'Follow-Up Generated'],
      completionChecks: ['webinar.deckGenerated', 'webinar.speakerScriptGenerated', 'webinar.offerStackGenerated', 'webinar.followUpGenerated'],
    });
    expect(plan.steps.map((step) => step.id)).toEqual([
      'webinar.strategy',
      'webinar.deck',
      'webinar.script',
      'webinar.offer',
      'webinar.followUp',
    ]);
  });

  it('generates a system recovery mission for NO_SYSTEM', () => {
    const plan = generateMissionPlan({
      bottleneckResult: bottleneckResult('NO_SYSTEM'),
      priorityResult: priority({
        priorityAction: 'Restore Business Signals',
        expectedImpact: 'The AI COO can resume trustworthy bottleneck and mission decisions.',
        category: 'SYSTEM',
        missionType: 'SYSTEM',
        route: '/dashboard',
        ctaLabel: '恢复业务信号',
      }),
      explainability: explanation('Signal Recovery'),
    });

    expect(plan).toMatchObject({
      objective: 'Restore Business Visibility',
      successCriteria: ['Signals Available'],
      completionChecks: ['signals.available'],
      nextMilestone: 'Signal Recovery',
    });
  });

  it('validates completion from completion checks instead of a user-declared done action', () => {
    const plan = generateMissionPlan({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      priorityResult: priority(),
      explainability: explanation(),
    });

    expect(validateMissionCompletion({
      missionPlan: plan,
      completedChecks: ['leadMagnet.exists'],
    })).toMatchObject({
      completed: false,
      passedChecks: ['leadMagnet.exists'],
      missingChecks: ['leadMagnet.published', 'cta.active'],
    });

    expect(validateMissionCompletion({
      missionPlan: plan,
      completedChecks: plan.completionChecks,
    })).toMatchObject({
      completed: true,
      missingChecks: [],
    });
  });
});
