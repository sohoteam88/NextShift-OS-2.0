import { describe, expect, it } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { BusinessStateResult } from '@/modules/business-state/contracts/BusinessStateResult';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { BottleneckResult, MissionBottleneck } from '@/modules/mission-engine/contracts/MissionAuthority';
import { projectAdaptiveJourney } from '@/modules/journey-engine/journey-engine-service';
import { resolveMissionAuthorityFromJourney } from '@/modules/mission-engine/services/MissionEngineAuthorityService';

function businessState(): BusinessState {
  return {
    stage: 'foundation',
    readiness: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      score: 50,
      maxScore: 100,
      percentage: 50,
    },
    bottlenecks: [],
    opportunities: [],
    stateResult: {
      currentState: 'BRAND_FOUNDATION',
      completedStates: [],
      missingRequirements: ['AI Interview Completed'],
      nextState: 'BRAND_POSITIONING',
      readinessScore: 50,
      explainability: {
        completed: [],
        missing: [{ id: 'interviewCompleted', label: 'AI Interview Completed', completed: false }],
        reason: 'Business profile incomplete.',
      },
    },
  };
}

function interview(): InterviewAuthorityProjection {
  return {
    source: 'InterviewAuthorityProjection',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    businessMode: 'retail',
    experienceLevel: 'beginner',
    offerStatus: 'missing',
    audienceStatus: 'defined',
    contentReadiness: 40,
    trafficReadiness: 30,
    revenueStatus: 'none',
    primaryOffer: '',
    revenueModel: '',
    primaryGrowthChannel: '',
    brandArchetype: 'operator',
    personalStoryVector: [],
    authorityScore: 40,
    readinessScore: 50,
    recommendedJourney: 'retail',
    recommendedMission: 'MISSION_005',
  };
}

function bottleneckResult(bottleneck: MissionBottleneck, explainability = ''): BottleneckResult {
  return {
    bottleneck,
    confidence: bottleneck === 'NO_BRAND' || bottleneck === 'BUSINESS_HEALTHY' ? 90 : 80,
    evidence: [`bottleneck=${bottleneck}`],
    severity: bottleneck === 'NO_BRAND' ? 'Critical' : bottleneck === 'BUSINESS_HEALTHY' ? 'None' : 'High',
    explainability,
  };
}

function authorityFor(completedChecks: string[], bottleneck: MissionBottleneck) {
  return resolveMissionAuthorityFromJourney(projectAdaptiveJourney({
    businessState: businessState(),
    interview: interview(),
    completedChecks,
  }), undefined, bottleneckResult(bottleneck), { locale: 'zh' });
}

function stateResult(overrides: Partial<BusinessStateResult> = {}): BusinessStateResult {
  return {
    currentState: 'FUNNEL',
    completedStates: ['BRAND_FOUNDATION', 'BRAND_POSITIONING', 'CONTENT_SYSTEM', 'LEAD_MAGNET'],
    missingRequirements: ['Landing Page Created'],
    nextState: 'LEAD_GENERATION',
    readinessScore: 72,
    explainability: {
      completed: ['BRAND_FOUNDATION', 'BRAND_POSITIONING', 'CONTENT_SYSTEM', 'LEAD_MAGNET'],
      missing: [{ id: 'landingPageCreated', label: 'Landing Page Created', completed: false }],
      reason: 'Lead conversion journey is incomplete.',
    },
    ...overrides,
  };
}

describe('UX-002 mission engine authority', () => {
  it('returns Start AI Interview as the only valid mission when interview is missing', () => {
    const authority = authorityFor(['registered', 'approved'], 'NO_BRAND');

    expect(authority.currentMission).toMatchObject({
      id: 'MISSION_AI_INTERVIEW',
      title: 'Start AI Interview',
      route: '/brand-builder/step/interview',
      priority: 100,
    });
    expect(authority.nextMission).toBeNull();
    expect(authority.businessStage).toBe('BRAND_FOUNDATION');
    expect(authority.bottleneck).toBe('NO_BRAND');
    expect(authority.lifecycle).toBe('ACTIVE');
    expect(authority.priorityAction).toMatchObject({
      missionType: 'BRAND',
      title: 'Complete AI Interview',
      priority: 'Critical',
    });
    expect(authority.dashboardCommandCenter).toMatchObject({
      missionTitle: 'Complete Your AI Business Interview',
      route: '/brand-builder/step/interview',
      ctaLabel: '开始 AI 访谈',
      priority: 'Critical',
    });
    expect(authority.missionPlan).toMatchObject({
      objective: 'Complete Your AI Business Interview',
      missionType: 'BRAND',
      route: '/brand-builder/step/interview',
      completionChecks: ['businessProfile.exists', 'aiInterview.completed'],
    });
    expect(authority.explainability.reasoning).toBe(
      '业务资料还不完整，系统还不能可靠判断你的受众、Offer、内容角度和增长路径。',
    );
    expect(authority.explainability.decisionReason).toBe(
      '内容、漏斗和流量之后都重要，但它们需要先建立在清楚的业务画像上。',
    );
    expect(authority.explainability.source).toBe('ExplainabilityEngine');
  });

  it('selects exactly one active mission from completed checks', () => {
    const authority = authorityFor([
      'registered',
      'approved',
      'brand_discovery_completed',
      'brand_dna_confirmed',
      'first_content_generated',
    ], 'NO_LEAD_MAGNET');

    expect(authority.currentMission).toMatchObject({
      id: 'MISSION_005',
      title: '引流磁铁',
      status: 'active',
      priority: 60,
      completionConditions: ['lead_magnet_created'],
      nextMissionId: 'MISSION_006',
    });
    expect(authority.nextMission?.id).toBe('MISSION_006');
    expect(authority.progress).toMatchObject({
      completionPercentage: 50,
      completedMissions: 4,
      totalMissions: 8,
      nextMilestone: '双漏斗落地页',
    });
    expect(authority.currentJourney.type).toBe('retail');
    expect(authority.progress.progressPath.filter((item) => item.status === 'current')).toHaveLength(1);
    expect(authority.businessStage).toBe('LEAD_MAGNET');
    expect(authority.bottleneck).toBe('NO_LEAD_MAGNET');
    expect(authority.priorityAction).toMatchObject({
      missionType: 'LEAD_MAGNET',
      title: 'Create Lead Magnet',
      ctaLabel: '生成引流资源',
      priority: 'High',
    });
    expect(authority.priorityResult).toMatchObject({
      priorityAction: 'Create Lead Magnet',
      category: 'LEADS',
      route: '/lead-magnet',
    });
    expect(authority.dashboardCommandCenter.missionTitle).toBe('Create Your First Lead Magnet');
    expect(authority.missionPlan).toMatchObject({
      objective: 'Create Your First Lead Magnet',
      missionType: 'LEAD_MAGNET',
      successCriteria: ['Lead Magnet Exists', 'Lead Magnet Published', 'CTA Active'],
      completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    });
  });

  it('uses resolved Business State for stage and bottleneck before mission projection', () => {
    const journey = projectAdaptiveJourney({
      businessState: businessState(),
      interview: interview(),
      completedChecks: [
        'registered',
        'approved',
        'brand_discovery_completed',
        'brand_dna_confirmed',
        'first_content_generated',
        'lead_magnet_created',
      ],
    });
    const authority = resolveMissionAuthorityFromJourney(journey, stateResult(), bottleneckResult('NO_FUNNEL'), { locale: 'zh' });

    expect(authority.businessStage).toBe('FUNNEL');
    expect(authority.bottleneck).toBe('NO_FUNNEL');
    expect(authority.explainability.currentGap).toBe('NO_FUNNEL');
    expect(authority.explainability.reasoning).toBe(
      '业务需要一个可运作的漏斗，把引流资源、落地页和跟进路径连接起来。',
    );
    expect(authority.explainability.source).toBe('ExplainabilityEngine');
  });

  it('returns launch as completed when the full sequence is done', () => {
    const authority = authorityFor([
      'registered',
      'approved',
      'brand_discovery_completed',
      'brand_dna_confirmed',
      'first_content_generated',
      'lead_magnet_created',
      'funnel_published',
      'traffic_campaign_launched',
      'first_sale_completed',
    ], 'NO_TEAM');

    expect(authority.currentMission).toMatchObject({
      id: 'MISSION_008',
      status: 'completed',
    });
    expect(authority.nextMission).toBeNull();
    expect(authority.progress.completionPercentage).toBe(100);
    expect(authority.progress.progressPath.every((item) => item.status === 'completed')).toBe(true);
  });

  it('routes BUSINESS_HEALTHY to optimization instead of a repair mission', () => {
    const authority = authorityFor([
      'registered',
      'approved',
      'brand_discovery_completed',
      'brand_dna_confirmed',
      'first_content_generated',
      'lead_magnet_created',
      'funnel_published',
      'traffic_campaign_launched',
      'first_sale_completed',
    ], 'BUSINESS_HEALTHY');

    expect(authority.bottleneck).toBe('BUSINESS_HEALTHY');
    expect(authority.priorityAction).toMatchObject({
      missionType: 'OPTIMIZATION',
      title: 'Optimize Growth',
      route: '/dashboard',
      ctaLabel: '继续优化系统',
      priority: 'Normal',
    });
    expect(authority.dashboardCommandCenter).toMatchObject({
      missionTitle: 'Growth Optimization Mission',
      route: '/dashboard',
      ctaLabel: '继续优化系统',
      priority: 'Normal',
    });
    expect(authority.missionPlan).toMatchObject({
      objective: 'Growth Optimization Mission',
      missionType: 'OPTIMIZATION',
      completionChecks: ['optimization.completed'],
    });
    expect(authority.priorityResult).toMatchObject({
      priorityAction: 'Optimize Growth',
      category: 'OPTIMIZATION',
    });
    expect(authority.explainability.decisionReason).toBe('当前阶段不需要修复型动作。');
    expect(authority.explainability.source).toBe('ExplainabilityEngine');
  });

  it('passes recent priority history into the Priority Engine', () => {
    const authority = resolveMissionAuthorityFromJourney(
      projectAdaptiveJourney({
        businessState: businessState(),
        interview: interview(),
        completedChecks: [
          'registered',
          'approved',
          'brand_discovery_completed',
          'brand_dna_confirmed',
          'first_content_generated',
        ],
      }),
      undefined,
      bottleneckResult('NO_LEAD_MAGNET'),
      {
        recentPriorityHistory: [{
          priorityAction: 'Create Lead Magnet',
          bottleneck: 'NO_FUNNEL',
          completionStatus: 'completed',
          resolved: true,
        }],
      },
    );

    expect(authority.priorityResult.dedup).toMatchObject({
      applied: true,
      action: 'Create Lead Magnet',
      penalty: 30,
      reason: 'Completed within 7 days and bottleneck resolved.',
    });
  });
});
