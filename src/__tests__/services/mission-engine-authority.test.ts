import { describe, expect, it } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
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

function authorityFor(completedChecks: string[]) {
  return resolveMissionAuthorityFromJourney(projectAdaptiveJourney({
    businessState: businessState(),
    interview: interview(),
    completedChecks,
  }));
}

describe('UX-002 mission engine authority', () => {
  it('returns Start AI Interview as the only valid mission when interview is missing', () => {
    const authority = authorityFor(['registered', 'approved']);

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
      title: 'Start AI Interview',
      priority: 'Critical',
    });
    expect(authority.dashboardCommandCenter).toMatchObject({
      missionTitle: 'Start AI Interview',
      route: '/brand-builder/step/interview',
      priority: 'Critical',
    });
    expect(authority.explainability.reasoning).toContain('Why not something else');
  });

  it('selects exactly one active mission from completed checks', () => {
    const authority = authorityFor([
      'registered',
      'approved',
      'brand_discovery_completed',
      'brand_dna_confirmed',
      'first_content_generated',
    ]);

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
      completionPercentage: 57,
      completedMissions: 4,
      totalMissions: 7,
      nextMilestone: '流量',
    });
    expect(authority.currentJourney.type).toBe('retail');
    expect(authority.progress.progressPath.filter((item) => item.status === 'current')).toHaveLength(1);
    expect(authority.businessStage).toBe('LEAD_MAGNET');
    expect(authority.bottleneck).toBe('NO_LEAD_MAGNET');
    expect(authority.priorityAction).toMatchObject({
      missionType: 'LEAD_MAGNET',
      title: '引流磁铁',
      priority: 'High',
    });
    expect(authority.dashboardCommandCenter.missionTitle).toBe('引流磁铁');
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
    ]);

    expect(authority.currentMission).toMatchObject({
      id: 'MISSION_007',
      status: 'completed',
    });
    expect(authority.nextMission).toBeNull();
    expect(authority.progress.completionPercentage).toBe(100);
    expect(authority.progress.progressPath.every((item) => item.status === 'completed')).toBe(true);
  });
});
