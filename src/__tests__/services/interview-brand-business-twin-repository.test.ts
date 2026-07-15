import { describe, expect, it, vi } from 'vitest';
import type { BrandContext } from '@/modules/brand-dna/types';
import type { InterviewAuthority } from '@/modules/interview-authority/contracts/InterviewAuthority';
import { InterviewBrandBusinessTwinRepository } from '@/modules/business-twin/services/interview-brand-business-twin-repository';
import type { BusinessId, TenantId } from '@nextshift/shared';

describe('InterviewBrandBusinessTwinRepository', () => {
  it('maps confirmed Interview and Brand DNA data into identity and brand contexts', async () => {
    const getInterviewAuthority = vi.fn().mockResolvedValue(confirmedInterview());
    const getBrandContext = vi.fn().mockResolvedValue(brandContext());
    const repository = createRepository({ getInterviewAuthority, getBrandContext });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot).toMatchObject({
      identity: {
        businessName: 'North Star Wellness',
        industry: 'Wellness',
        businessStage: 'growth',
        mission: 'Make everyday wellness practical.',
        positioning: 'Practical wellness coaching for busy professionals.',
      },
      brand: {
        brandStory: 'I help busy professionals build sustainable wellness routines.',
        voice: 'Warm and evidence-led',
      },
    });
    expect(snapshot?.brand).not.toHaveProperty('brandName');
    expect(snapshot?.brand).not.toHaveProperty('positioning');
    expect(snapshot?.identity).not.toHaveProperty('values');
    expect(getInterviewAuthority).toHaveBeenCalledWith('user_1');
    expect(getBrandContext).toHaveBeenCalledWith('user_1');
  });

  it('returns null for fallback Interview defaults and no Brand DNA', async () => {
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue(fallbackInterview()),
      getBrandContext: vi.fn().mockResolvedValue(null),
    });

    await expect(repository.getSnapshot(businessId(), tenant())).resolves.toBeNull();
  });

  it('uses known Brand DNA without leaking fallback Interview defaults', async () => {
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue(fallbackInterview()),
      getBrandContext: vi.fn().mockResolvedValue(brandContext()),
    });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot?.identity).toEqual({
      businessName: 'North Star Wellness',
      positioning: 'Practical wellness coaching for busy professionals.',
    });
    expect(snapshot?.brand?.brandName).toBeUndefined();
    expect(snapshot?.identity?.businessName).toBe('North Star Wellness');
    expect(snapshot?.identity).not.toHaveProperty('businessStage');
    expect(snapshot?.identity).not.toHaveProperty('industry');
  });

  it('uses confirmed Interview data when Brand DNA is absent', async () => {
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue(confirmedInterview()),
      getBrandContext: vi.fn().mockResolvedValue(null),
    });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot?.identity).toEqual({
      businessName: 'Aisha Rahman',
      industry: 'Wellness',
      businessStage: 'growth',
      mission: 'Make everyday wellness practical.',
    });
    expect(snapshot).not.toHaveProperty('brand');
  });

  it('omits whitespace-normalized duplicate name and positioning facts', async () => {
    const interview = confirmedInterview();
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue({
        ...interview,
        profile: {
          ...interview.profile,
          missionStatement: 'Practical  wellness\ncoaching for busy professionals.',
        },
      }),
      getBrandContext: vi.fn().mockResolvedValue(brandContext()),
    });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot?.identity).toMatchObject({
      businessName: 'North Star Wellness',
      positioning: 'Practical wellness coaching for busy professionals.',
    });
    expect(snapshot?.identity).not.toHaveProperty('mission');
    expect(snapshot?.brand).toMatchObject({
      brandStory: 'I help busy professionals build sustainable wellness routines.',
      voice: 'Warm and evidence-led',
    });
    expect(snapshot?.brand).not.toHaveProperty('brandName');
    expect(snapshot?.brand).not.toHaveProperty('positioning');
  });

  it('keeps every non-colliding source fact', async () => {
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue(confirmedInterview()),
      getBrandContext: vi.fn().mockResolvedValue(brandContext({ brandName: '', positioning: '' })),
    });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot?.identity).toEqual({
      businessName: 'Aisha Rahman',
      industry: 'Wellness',
      businessStage: 'growth',
      mission: 'Make everyday wellness practical.',
    });
    expect(snapshot?.brand).toEqual({
      brandStory: 'I help busy professionals build sustainable wellness routines.',
      voice: 'Warm and evidence-led',
    });
  });

  it('omits a Brand DNA context when de-duplication removes its final fields', async () => {
    const repository = createRepository({
      getInterviewAuthority: vi.fn().mockResolvedValue(confirmedInterview()),
      getBrandContext: vi.fn().mockResolvedValue(brandContext({
        messaging: {
          coreMessage: '',
          uniqueAngle: '',
          elevatorPitch: '',
        },
        tone: '',
      })),
    });

    const snapshot = await repository.getSnapshot(businessId(), tenant());

    expect(snapshot?.identity).toMatchObject({
      businessName: 'North Star Wellness',
      positioning: 'Practical wellness coaching for busy professionals.',
    });
    expect(snapshot).not.toHaveProperty('brand');
  });
});

function createRepository(input: {
  getInterviewAuthority: () => Promise<InterviewAuthority>;
  getBrandContext: () => Promise<BrandContext | null>;
}) {
  return new InterviewBrandBusinessTwinRepository('user_1', {
    ...input,
    now: () => new Date('2026-07-14T08:00:00.000Z'),
  });
}

function businessId() {
  return 'business-tenant_1' as BusinessId;
}

function tenant() {
  return { tenantId: 'tenant_1' as TenantId };
}

function confirmedInterview(): InterviewAuthority {
  return {
    profile: {
      source: 'brand_interview',
      scope: 'user',
      confidence: 'confirmed',
      fallback: 'none',
      profileId: 'interview_1',
      fullName: 'Aisha Rahman',
      professionalRole: 'Wellness coach',
      industry: 'Wellness',
      experienceLevel: 'intermediate',
      primarySkills: ['Coaching'],
      personalStory: 'Recovered from burnout through sustainable routines.',
      missionStatement: 'Make everyday wellness practical.',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
    },
    audience: {
      source: 'brand_interview',
      scope: 'user',
      confidence: 'confirmed',
      fallback: 'none',
      audienceId: 'audience_1',
      primaryAudience: 'Busy professionals',
      audienceProblems: [],
      audienceGoals: [],
      audienceObjections: [],
      audienceChannels: [],
      audienceLanguage: 'en',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
    },
    businessContext: {
      source: 'brand_interview',
      scope: 'user',
      confidence: 'confirmed',
      fallback: 'none',
      businessMode: 'hybrid',
      primaryOffer: 'Wellness coaching',
      revenueModel: 'Coaching packages',
      businessStage: 'growth',
      targetRevenueGoal: 'MYR 20,000 monthly',
      primaryGrowthChannel: 'Instagram',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-10T00:00:00.000Z',
    },
  };
}

function fallbackInterview(): InterviewAuthority {
  return {
    ...confirmedInterview(),
    profile: {
      ...confirmedInterview().profile,
      confidence: 'fallback',
      profileId: '',
      fullName: '',
      professionalRole: '',
      industry: '',
      experienceLevel: 'beginner',
      primarySkills: [],
      personalStory: '',
      missionStatement: '',
    },
    businessContext: {
      ...confirmedInterview().businessContext,
      confidence: 'fallback',
      businessMode: 'retail',
      primaryOffer: '',
      revenueModel: '',
      businessStage: 'idea',
      targetRevenueGoal: '',
      primaryGrowthChannel: '',
    },
  };
}

function brandContext(overrides: Partial<BrandContext> = {}): BrandContext {
  return {
    brandName: 'North Star Wellness',
    personalName: 'Aisha Rahman',
    positioning: 'Practical wellness coaching for busy professionals.',
    messaging: {
      coreMessage: 'Wellness should fit your life.',
      uniqueAngle: 'Small sustainable routines.',
      elevatorPitch: 'I help busy professionals build sustainable wellness routines.',
    },
    tone: 'Warm and evidence-led',
    audience: 'Busy professionals',
    audiencePainPoints: [],
    contentPillars: [],
    offer: {
      primary: 'Wellness coaching',
      transformation: 'Sustainable routines',
    },
    visualIdentity: {
      colors: [],
      imagePrompt: '',
      bannerPrompt: '',
    },
    ...overrides,
  };
}
