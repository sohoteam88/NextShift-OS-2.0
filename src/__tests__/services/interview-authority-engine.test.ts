import { describe, expect, it } from 'vitest';
import type { InterviewAuthority } from '@/modules/interview-authority/contracts/InterviewAuthority';
import { projectInterviewAuthority } from '@/modules/interview-authority/services/interview-projection';

function authority(overrides: Partial<InterviewAuthority> = {}): InterviewAuthority {
  const base: InterviewAuthority = {
    profile: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      profileId: 'profile_1',
      fullName: 'Test User',
      professionalRole: 'Coach and content creator',
      industry: 'education',
      experienceLevel: 'intermediate',
      primarySkills: ['coaching', 'content'],
      personalStory: 'I helped founders grow from confusion to clarity.',
      missionStatement: 'Help founders build a trusted business.',
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T00:00:00.000Z',
    },
    audience: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      audienceId: 'aud_1',
      primaryAudience: 'new founders',
      audienceProblems: ['no clear offer'],
      audienceGoals: ['get first customers'],
      audienceObjections: ['not enough time'],
      audienceChannels: ['content'],
      audienceLanguage: 'zh',
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T00:00:00.000Z',
    },
    businessContext: {
      source: 'test',
      scope: 'user',
      confidence: 'derived',
      fallback: 'none',
      businessMode: 'retail',
      primaryOffer: 'coaching service package',
      revenueModel: 'retainer',
      businessStage: 'validation',
      targetRevenueGoal: '10000',
      primaryGrowthChannel: 'content',
      createdAt: '2026-06-19T00:00:00.000Z',
      updatedAt: '2026-06-19T00:00:00.000Z',
    },
  };

  return { ...base, ...overrides };
}

describe('AI-001 interview authority engine', () => {
  it('projects interview authority into business classification and scores', () => {
    const projection = projectInterviewAuthority(authority());

    expect(projection).toMatchObject({
      businessMode: 'service',
      experienceLevel: 'intermediate',
      offerStatus: 'defined',
      audienceStatus: 'defined',
      revenueStatus: 'none',
      recommendedJourney: 'service',
      recommendedMission: 'MISSION_003',
      brandArchetype: 'teacher',
    });
    expect(projection.authorityScore).toBeGreaterThan(50);
    expect(projection.readinessScore).toBeGreaterThan(70);
    expect(projection.personalStoryVector).toContain('I helped founders grow from confusion to clarity.');
  });

  it('classifies team building automatically without dropdown configuration', () => {
    const projection = projectInterviewAuthority(authority({
      businessContext: {
        ...authority().businessContext,
        businessMode: 'team_building',
        primaryOffer: '',
        revenueModel: '',
      },
    }));

    expect(projection.businessMode).toBe('team_building');
    expect(projection.recommendedJourney).toBe('team_building');
    expect(projection.recommendedMission).toBe('MISSION_003');
  });
});
