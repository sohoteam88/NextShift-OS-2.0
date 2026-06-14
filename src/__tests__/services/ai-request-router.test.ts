import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({
  getRouterForTenant: vi.fn(),
}));
const prismaMocks = vi.hoisted(() => ({ tenant: { findUnique: vi.fn() } }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const policyMocks = vi.hoisted(() => ({ decidePolicy: vi.fn(), getTaskDefinition: vi.fn() }));
const costMocks = vi.hoisted(() => ({ estimateCredits: vi.fn() }));
const providerMocks = vi.hoisted(() => ({ getFirstAvailable: vi.fn(), getAvailableProviders: vi.fn() }));
const fallbackMocks = vi.hoisted(() => ({ executeWithFallback: vi.fn() }));
const normalizerMocks = vi.hoisted(() => ({ normalizeResponse: vi.fn(), errorResponse: vi.fn() }));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: routerMocks.getRouterForTenant }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/services/model-policy-engine', () => policyMocks);
vi.mock('@/modules/ai/services/cost-estimator', () => costMocks);
vi.mock('@/modules/ai/services/provider-registry', () => providerMocks);
vi.mock('@/modules/ai/services/fallback-handler', () => fallbackMocks);
vi.mock('@/modules/ai/services/response-normalizer', () => normalizerMocks);

import { routeAiRequest } from '@/modules/ai/services/ai-request-router';

const makeRequest = (overrides = {}) => ({
  tenantId: 't1', userId: 'u1', taskType: 'content_generation' as const,
  systemPrompt: 'sys', userPrompt: 'user',
  ...overrides,
});

describe('routeAiRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    prismaMocks.tenant.findUnique.mockResolvedValue({ plan: 'pro' });
    policyMocks.decidePolicy.mockReturnValue({ maxCredits: 50, maxRetries: 2, allowedModels: [], preferredProvider: 'anthropic', allowPremium: true });
    policyMocks.getTaskDefinition.mockReturnValue({ preferredProviders: ['anthropic'], fallbackProviders: ['deepseek'] });
    costMocks.estimateCredits.mockReturnValue({ estimatedCredits: 3, estimatedCostLevel: 'low' });
    providerMocks.getAvailableProviders.mockReturnValue([
      { name: 'anthropic', available: true, models: [], supportsJson: true, supportsStreaming: true, costTier: 'high' },
    ]);
    providerMocks.getFirstAvailable.mockReturnValue('anthropic');
    fallbackMocks.executeWithFallback.mockResolvedValue({ success: true, text: 'ok', provider: 'anthropic', model: 'claude-sonnet' });
    normalizerMocks.errorResponse.mockReturnValue({ success: false, text: '', error: 'err', provider: '', model: '', creditsUsed: 0 } as any);
  });

  // ── Happy path ──
  it('routes a content generation request successfully', async () => {
    normalizerMocks.normalizeResponse.mockReturnValue({ success: true, text: 'Hello', provider: 'anthropic', model: 'claude-sonnet' } as any);
    const result = await routeAiRequest(makeRequest());
    expect(quotaMocks.enforceQuota).toHaveBeenCalledWith('t1');
    expect(policyMocks.decidePolicy).toHaveBeenCalledWith('pro', 'content_generation');
    expect(fallbackMocks.executeWithFallback).toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  // ── Quota exceeded ──
  it('returns error when quota exceeded', async () => {
    quotaMocks.enforceQuota.mockRejectedValue(new Error('QUOTA_EXCEEDED'));
    const result = await routeAiRequest(makeRequest());
    expect(result.success).toBe(false);
    expect(normalizerMocks.errorResponse).toHaveBeenCalled();
  });

  // ── Plan restriction ──
  it('returns error when credits exceed plan allowance', async () => {
    costMocks.estimateCredits.mockReturnValue({ estimatedCredits: 100, estimatedCostLevel: 'high' });
    const result = await routeAiRequest(makeRequest());
    expect(result.success).toBe(false);
  });

  // ── No providers ──
  it('returns error when no providers available', async () => {
    providerMocks.getAvailableProviders.mockReturnValue([]);
    const result = await routeAiRequest(makeRequest());
    expect(result.success).toBe(false);
  });

  // ── Free plan blocks premium ──
  it('restricts models for free plan', async () => {
    prismaMocks.tenant.findUnique.mockResolvedValue({ plan: 'free' });
    policyMocks.decidePolicy.mockReturnValue({ maxCredits: 3, maxRetries: 1, allowedModels: ['deepseek-chat'], preferredProvider: 'deepseek', allowPremium: false });
    await routeAiRequest(makeRequest());
    expect(policyMocks.decidePolicy).toHaveBeenCalledWith('free', 'content_generation');
  });
});
