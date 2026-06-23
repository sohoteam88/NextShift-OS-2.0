import { describe, expect, it } from 'vitest';
import type { MissionPlan } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { PersonalizationProfile } from '@/modules/personalization/services/PersonalizationEngine';
import { buildPersonalizedAssetContent } from '@/modules/personalization/services/PersonalizationEngine';

const plan: MissionPlan = {
  id: 'mission-plan-lead_magnet',
  objective: 'Create Your First Lead Magnet',
  description: 'Build a lead capture asset.',
  steps: [],
  estimatedTime: 35,
  successCriteria: ['Lead Magnet Exists'],
  completionChecks: ['leadMagnet.exists'],
  route: '/lead-magnet',
  missionType: 'LEAD_MAGNET',
  nextMilestone: 'Acquire First Lead',
};

function profile(overrides: Partial<PersonalizationProfile> = {}): PersonalizationProfile {
  return {
    source: 'PersonalizationEngine',
    brandDNA: {
      identity: 'Coach',
      name: 'Mei',
      positioning: 'Practical coach for busy mothers',
      tone: 'warm and direct',
      story: 'I help people simplify the first step.',
    },
    businessContext: {
      businessMode: 'retail',
      stage: 'validation',
      region: 'Malaysia',
      language: 'en',
    },
    audience: {
      primaryAudience: 'busy mothers',
      pains: ['they try diets but cannot keep consistent habits'],
      goals: ['lose fat without extreme dieting'],
      objections: ['I have no time'],
    },
    offer: {
      primaryOffer: 'Weight Management Coaching Program',
      promise: 'lose fat with simple daily habits',
      revenueModel: 'coaching',
    },
    missionHistory: {
      currentMission: plan.objective,
      completedMissionTitles: [],
    },
    outcomeHistory: {
      currentOutcome: 'Acquire First Lead',
      completedOutcomeIds: [],
    },
    assetHistory: {
      titles: [],
      themes: [],
      avoidTopics: [],
    },
    internalScore: {
      relevance: 90,
      uniqueness: 80,
      contextMatch: 90,
    },
    verificationBoundary: 'personalization_does_not_affect_completion',
    ...overrides,
  };
}

describe('PRODUCT-002 Personalization Engine', () => {
  it('creates a weight-loss-specific lead magnet instead of a generic one', () => {
    const content = buildPersonalizedAssetContent({
      profile: profile(),
      plan,
      assetType: 'LEAD_MAGNET_ASSET',
      actionLabel: 'Generate Lead Magnet',
    });

    expect(content).toContain('7 Hidden Habits Preventing Fat Loss');
    expect(content).toContain('busy mothers');
    expect(content).toContain('Weight Management Coaching Program');
    expect(content).toContain('Write in English');
  });

  it('creates a different lead magnet for a business opportunity profile', () => {
    const content = buildPersonalizedAssetContent({
      profile: profile({
        audience: {
          primaryAudience: 'new entrepreneurs',
          pains: ['they want leads but do not know what to offer first'],
          goals: ['generate first qualified lead'],
          objections: [],
        },
        offer: {
          primaryOffer: 'Business Opportunity Program',
          promise: 'turn attention into qualified conversations',
          revenueModel: 'network marketing',
        },
      }),
      plan,
      assetType: 'LEAD_MAGNET_ASSET',
      actionLabel: 'Generate Lead Magnet',
    });

    expect(content).toContain('7 Mistakes New Entrepreneurs Make Before Their First Lead');
    expect(content).toContain('Business Opportunity Program');
    expect(content).not.toContain('7 Hidden Habits Preventing Fat Loss');
  });

  it('uses asset history to avoid repetitive outputs', () => {
    const content = buildPersonalizedAssetContent({
      profile: profile({
        assetHistory: {
          titles: ['Lead Magnet Draft: Meal Prep Checklist'],
          themes: ['Meal Prep Checklist'],
          avoidTopics: ['Meal Prep Checklist'],
        },
      }),
      plan,
      assetType: 'CONTENT_ASSET',
      actionLabel: 'Generate Content',
    });

    expect(content).toContain('Avoid repeating these previous topics: Meal Prep Checklist.');
  });

  it('uses business stage context to shape asset direction', () => {
    const content = buildPersonalizedAssetContent({
      profile: profile({
        businessContext: {
          businessMode: 'retail',
          stage: 'lead_generation',
          currentState: 'LEAD_GENERATION',
          readiness: 45,
          region: 'Malaysia',
          language: 'en',
        },
      }),
      plan,
      assetType: 'FUNNEL_ASSET',
      actionLabel: 'Generate Funnel',
    });

    expect(content).toContain('Stage context: prioritize conversion assets that capture and qualify leads.');
  });
});
