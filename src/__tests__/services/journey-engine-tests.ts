import { describe, expect, it } from 'vitest';
import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import { projectAdaptiveJourney } from '@/modules/journey-engine/journey-engine-service';

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

function interview(overrides: Partial<InterviewAuthorityProjection> = {}): InterviewAuthorityProjection {
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
    ...overrides,
  };
}

describe('UX-003 adaptive journey engine', () => {
  it('selects different mission paths for retail and team building users', () => {
    const retail = projectAdaptiveJourney({
      businessState: businessState(),
      interview: interview({ businessMode: 'retail' }),
      completedChecks: ['registered', 'approved', 'brand_discovery_completed'],
    });
    const team = projectAdaptiveJourney({
      businessState: businessState(),
      interview: interview({ businessMode: 'team_building', recommendedJourney: 'team_building' }),
      completedChecks: ['registered', 'approved', 'brand_discovery_completed'],
    });

    expect(retail.currentJourney.type).toBe('retail');
    expect(team.currentJourney.type).toBe('team_building');
    expect(retail.progressPath.map((item) => item.label)).toContain('产品定位');
    expect(team.progressPath.map((item) => item.label)).toContain('权威建设');
  });

  it('selects service journey from offer context without manual configuration', () => {
    const projection = projectAdaptiveJourney({
      businessState: businessState(),
      interview: interview({
        businessMode: 'service',
        primaryOffer: 'coaching service package',
        revenueModel: 'retainer',
        recommendedJourney: 'service',
      }),
      completedChecks: ['registered', 'approved', 'brand_discovery_completed'],
    });

    expect(projection.currentJourney.type).toBe('service');
    expect(projection.currentMission).toMatchObject({
      id: 'MISSION_003',
      title: 'Offer Builder',
      status: 'active',
    });
    expect(projection.progressPath.filter((item) => item.status === 'current')).toHaveLength(1);
  });
});
