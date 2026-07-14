import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({ generate: vi.fn() }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));
const prismaMocks = vi.hoisted(() => ({ user: { findUnique: vi.fn() } }));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: () => routerMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/services/content-service', () => ({ contentService: { saveContent: vi.fn() } }));
vi.mock('@/modules/funnel/services/template-service', () => ({ funnelTemplateService: { getById: vi.fn() } }));
vi.mock('@/modules/funnel/services/funnel-service', () => ({ funnelService: { create: vi.fn() } }));

import { onboardingService } from '@/modules/member/services/onboarding-service';

const routing = {
  taskCategory: 'brand_discovery' as const,
  classification: {
    category: 'brand_discovery' as const,
    tier: 'A' as const,
    reason: 'Deep brand positioning analysis from user interview',
    estimatedInputTokens: 100,
    estimatedOutputTokens: 800,
  },
  selectedModel: 'gpt-4o',
  selectedModelName: 'GPT-4o',
  selectedTier: 'A',
  provider: 'openai' as const,
  estimatedCost: 0.01,
  wasEscalated: false,
  originalTier: 'A',
};

const makeUser = () => ({
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Steven',
  email: 'steven@example.com',
  role: 'member',
  phone: null,
  avatarUrl: null,
  bio: 'Health coach',
  languagePreference: 'zh',
  metadata: {
    goals: {
      health_goals: ['energy'],
      target_audience: 'busy parents',
      specialty: 'wellness',
    },
    brand_positioning: {
      positioning: 'Practical wellness support for busy parents',
      content_pillars: ['habits'],
      audience: 'busy parents',
    },
  },
});

describe('onboardingService AI router call sites', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMocks.user.findUnique.mockResolvedValue(makeUser());
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
  });

  it('routes brand positioning through brand_discovery after quota enforcement and logs routing', async () => {
    const result = {
      text: JSON.stringify({
        positioning: 'Wellness coach for busy parents',
        content_pillars: ['habits'],
        audience: 'busy parents',
        why_this_works: 'Clear audience',
      }),
      tokensIn: 100,
      tokensOut: 200,
      model: 'gpt-4o',
      provider: 'openai' as const,
      durationMs: 250,
      routing,
    };
    routerMocks.generate.mockResolvedValue(result);

    await onboardingService.generateBrandPositioning('user-1');

    expect(routerMocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.4, maxTokens: 512 }),
      'brand_discovery',
    );
    expect(quotaMocks.enforceQuota.mock.invocationCallOrder[0]).toBeLessThan(
      routerMocks.generate.mock.invocationCallOrder[0],
    );
    expect(trackerMocks.logAIUsage).toHaveBeenCalledWith(expect.objectContaining({
      feature: 'onboarding_brand',
      result,
      routing,
    }));
  });

  it('routes first-content options through content_generation after quota enforcement and logs routing', async () => {
    const contentRouting = {
      ...routing,
      taskCategory: 'content_generation' as const,
      classification: {
        ...routing.classification,
        category: 'content_generation' as const,
        tier: 'B' as const,
        reason: 'Template-guided creative writing, standard complexity',
        estimatedOutputTokens: 500,
      },
      selectedTier: 'B',
      originalTier: 'B',
    };
    const result = {
      text: JSON.stringify({
        options: [{ title: 'Start here', hook: 'A helpful tip', content: 'Post body', platform: 'facebook' }],
      }),
      tokensIn: 120,
      tokensOut: 240,
      model: 'gpt-4o',
      provider: 'openai' as const,
      durationMs: 300,
      routing: contentRouting,
    };
    routerMocks.generate.mockResolvedValue(result);

    await onboardingService.generateFirstContentOptions('user-1');

    expect(routerMocks.generate).toHaveBeenCalledWith(
      expect.objectContaining({ temperature: 0.8, maxTokens: 900 }),
      'content_generation',
    );
    expect(quotaMocks.enforceQuota.mock.invocationCallOrder[0]).toBeLessThan(
      routerMocks.generate.mock.invocationCallOrder[0],
    );
    expect(trackerMocks.logAIUsage).toHaveBeenCalledWith(expect.objectContaining({
      feature: 'onboarding_first_content',
      result,
      routing: contentRouting,
    }));
  });
});
