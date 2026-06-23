import { describe, expect, it } from 'vitest';
import { buildDecisionProjection } from '@/modules/ai-coo/services/decision-projection';
import { prioritizeFocus } from '@/modules/ai-coo/services/focus-prioritizer';
import type { AICOODecisionSignal } from '@/modules/ai-coo/contracts/AICOODecision';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';

const missionAuthority: MissionAuthoritySnapshot = {
  source: 'MissionEngineAuthorityService',
  scope: 'user' as const,
  confidence: 'derived' as const,
  fallback: 'none' as const,
  currentJourney: {
    type: 'creator',
    title: 'Creator Journey',
    reason: 'Selected from interview authority.',
  },
  businessStage: 'LEAD_MAGNET' as const,
  bottleneck: 'NO_LEAD_MAGNET' as const,
  bottleneckResult: {
    bottleneck: 'NO_LEAD_MAGNET' as const,
    confidence: 80,
    evidence: ['offerExists=false'],
    severity: 'High' as const,
    explainability: 'Lead magnet is the highest-impact constraint.',
  },
  priorityResult: {
    priorityAction: 'Create Lead Magnet',
    priorityReason: 'The business needs a clear reason for visitors to leave contact information before traffic is scaled.',
    expectedImpact: 'Qualified visitors can become leads through a concrete opt-in asset.',
    urgency: 'High' as const,
    confidence: 82,
    category: 'LEADS' as const,
    missionType: 'LEAD_MAGNET' as const,
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
  },
  currentMission: {
    id: 'MISSION_005',
    title: '创建第一个引流磁铁',
    description: 'Create a lead magnet to capture qualified leads.',
    expectedOutcome: 'Capture the first qualified lead.',
    estimatedMinutes: 20,
    status: 'active' as const,
    priority: 70,
    unlockConditions: [],
    completionConditions: ['lead_magnet_created'],
    route: '/lead-magnet',
  },
  nextMission: null,
  priorityAction: {
    missionType: 'LEAD_MAGNET' as const,
    title: '创建第一个引流磁铁',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
    priority: 'High' as const,
  },
  explainability: {
    locale: 'en' as const,
    source: 'ExplainabilityEngine' as const,
    completed: ['品牌访谈', '品牌 DNA', '内容'],
    currentGap: 'NO_LEAD_MAGNET' as const,
    reasoning: 'Completed: 品牌访谈, 品牌 DNA, 内容. Current gap: NO_LEAD_MAGNET. Because this is the first missing requirement preventing progress, the highest leverage action is "创建第一个引流磁铁". Why not something else: the AI COO fixes the bottleneck before optimizing, scaling, or automating.',
    decisionReason: '现在不应该先加流量或团队动作，因为还没有可以承接陌生受众的领取入口。',
    whyThis: 'The business needs a clear opt-in offer before visitors have a reason to leave contact information.',
    whyNow: 'Creating the lead magnet now turns existing attention into measurable lead generation.',
    whyNotOthers: 'Traffic and automation can wait because the business still needs a concrete lead capture asset.',
    expectedOutcome: 'Capture the first qualified lead.',
    expectedRisk: 'If lead capture stays missing, interested visitors may leave without entering the follow-up system.',
    nextMilestone: 'Landing page',
    evidence: ['offerExists=false'],
    severity: 'High' as const,
    confidence: 80,
  },
  missionPlan: {
    id: 'mission-plan-lead_magnet',
    objective: 'Create Your First Lead Magnet',
    description: 'Build a lead capture asset that encourages prospects to exchange contact information.',
    steps: [
      { id: 'leadMagnet.type', title: 'Select Lead Magnet Type', description: 'Choose the format that fits the audience and offer.', estimatedMinutes: 5, required: true },
      { id: 'leadMagnet.content', title: 'Generate Lead Magnet Content', description: 'Create the asset copy and structure.', estimatedMinutes: 15, required: true },
      { id: 'leadMagnet.publish', title: 'Publish Lead Magnet', description: 'Publish the asset so it can be requested by prospects.', estimatedMinutes: 10, required: true },
      { id: 'leadMagnet.cta', title: 'Connect CTA', description: 'Connect the lead magnet to the call to action.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['Lead Magnet Exists', 'Lead Magnet Published', 'CTA Active'],
    completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    route: '/lead-magnet',
    missionType: 'LEAD_MAGNET' as const,
    nextMilestone: 'Landing page',
  },
  missionCompletion: {
    completed: false,
    completionPercentage: 0,
    completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    passedChecks: [],
    failedChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    missingChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    nextRequiredCheck: 'leadMagnet.exists',
    verificationStatus: 'BLOCKED',
    verificationSource: 'signal',
    verifiedAt: '2026-06-22T00:00:00.000Z',
    source: 'MissionCompletionVerifier',
  },
  dashboardCommandCenter: {
    currentStage: 'LEAD_MAGNET' as const,
    missionTitle: '创建第一个引流磁铁',
    missionDescription: 'Create a lead magnet to capture qualified leads.',
    reasoning: 'Completed: 品牌访谈, 品牌 DNA, 内容. Current gap: NO_LEAD_MAGNET. Because this is the first missing requirement preventing progress, the highest leverage action is "创建第一个引流磁铁". Why not something else: the AI COO fixes the bottleneck before optimizing, scaling, or automating.',
    expectedOutcome: 'Capture the first qualified lead.',
    estimatedTime: '20 分钟',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
    decisionReason: '现在不应该先加流量或团队动作，因为还没有可以承接陌生受众的领取入口。',
    priority: 'High' as const,
  },
  lifecycle: 'ACTIVE' as const,
  progress: {
    completionPercentage: 57,
    completedMissions: 4,
    totalMissions: 7,
    nextMilestone: 'Landing page',
    progressPath: [],
  },
  estimatedCompletion: {
    minutes: 20,
    label: '20 分钟',
  },
};

const journeyState = {
  source: 'JourneyStateAssembler',
  scope: 'user' as const,
  confidence: 'derived' as const,
  fallback: 'none' as const,
  stage: 'lead_generation' as const,
  milestones: [],
  missions: [],
  nextAction: {
    source: 'JourneyNextActionAdapter',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    title: 'Launch lead magnet',
    description: 'Create a simple opt-in asset.',
    route: '/lead-magnet',
    actionType: 'mission' as const,
  },
  revenueProgress: {
    source: 'RevenueProgressAdapter',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    completionPercent: 57,
    currentMilestone: 'First lead',
    nextMilestone: 'First customer',
    achievedMilestones: [],
  },
};

describe('AI-003 AI COO decision engine', () => {
  it('prioritizes a high risk over competing opportunities', () => {
    const risk: AICOODecisionSignal = {
      code: 'traffic_missing',
      title: 'Traffic missing',
      reason: 'No qualified lead flow exists yet.',
      domain: 'traffic',
      priority: 'high',
    };
    const opportunity: AICOODecisionSignal = {
      code: 'high_authority_score',
      title: 'Authority signal is strong',
      reason: 'The authority score is high.',
      domain: 'brand',
      priority: 'high',
    };

    const focus = prioritizeFocus({
      risks: [risk],
      opportunities: [opportunity],
      journeyState,
      missionAuthority,
    });

    expect(focus).toMatchObject({
      focusArea: 'generate_leads',
      basisType: 'risk',
      basis: risk,
    });
  });

  it('prioritizes retention risk as re-engagement work', () => {
    const risk: AICOODecisionSignal = {
      code: 'retention_14_days_inactive',
      title: 'Retention risk increasing',
      reason: '14 days inactive.',
      domain: 'operations',
      priority: 'high',
    };

    const focus = prioritizeFocus({
      risks: [risk],
      opportunities: [],
      journeyState,
      missionAuthority,
    });

    expect(focus).toMatchObject({
      focusArea: 're_engage_user',
      basisType: 'risk',
      basis: risk,
    });
  });

  it('prioritizes value risk as value realization work', () => {
    const risk: AICOODecisionSignal = {
      code: 'value_not_started',
      title: 'Value realization not proven',
      reason: 'No meaningful business outcome exists yet.',
      domain: 'traffic',
      priority: 'high',
    };

    const focus = prioritizeFocus({
      risks: [risk],
      opportunities: [],
      journeyState,
      missionAuthority,
    });

    expect(focus).toMatchObject({
      focusArea: 'realize_value',
      basisType: 'risk',
      basis: risk,
    });
  });

  it('prioritizes expansion opportunity as scale work after value is proven', () => {
    const opportunity: AICOODecisionSignal = {
      code: 'expansion_revenue_growth',
      title: '提高客单价或复购',
      reason: 'Revenue is already growing and ready to multiply.',
      domain: 'sales',
      priority: 'high',
    };

    const focus = prioritizeFocus({
      risks: [],
      opportunities: [opportunity],
      journeyState,
      missionAuthority,
    });

    expect(focus).toMatchObject({
      focusArea: 'scale_results',
      basisType: 'opportunity',
      basis: opportunity,
    });
  });

  it('prioritizes referral opportunity as advocacy work when ready', () => {
    const opportunity: AICOODecisionSignal = {
      code: 'referral_customer_referral',
      title: '启动顾客转介绍',
      reason: 'The user is ready to ask happy customers for referrals.',
      domain: 'crm',
      priority: 'high',
    };

    const focus = prioritizeFocus({
      risks: [],
      opportunities: [opportunity],
      journeyState,
      missionAuthority,
    });

    expect(focus).toMatchObject({
      focusArea: 'activate_advocacy',
      basisType: 'opportunity',
      basis: opportunity,
    });
  });

  it('returns exactly one primary decision with no supporting actions', () => {
    const risks: AICOODecisionSignal[] = [
      {
        code: 'traffic_missing',
        title: 'Traffic missing',
        reason: 'No qualified lead flow exists yet.',
        domain: 'traffic',
        priority: 'high',
      },
      {
        code: 'execution_bottleneck',
        title: 'Execution bottleneck',
        reason: 'The user has stalled on the current mission.',
        domain: 'operations',
        priority: 'medium',
      },
    ];
    const opportunities: AICOODecisionSignal[] = [
      {
        code: 'recent_milestone_completed',
        title: 'Recent milestone completed',
        reason: 'The user has momentum.',
        domain: 'operations',
        priority: 'medium',
      },
    ];

    const decision = buildDecisionProjection({
      userId: 'user_1',
      focusArea: 'generate_leads',
      basis: risks[0],
      basisType: 'risk',
      risks,
      opportunities,
      journeyState,
      missionAuthority,
    });

    expect(decision.currentFocus).toBe('Generate Leads');
    expect(decision.primaryRisk?.code).toBe('traffic_missing');
    expect(decision.nextBestAction).toMatchObject({
      title: '创建第一个引流磁铁',
      route: '/lead-magnet',
    });
    expect(decision.supportingActions).toHaveLength(0);
    expect(decision.decisionReason).toContain('Why not something else');
    expect(decision.decisionReason).toContain('one user gets one mission');
  });
});
