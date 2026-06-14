import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({ generate: vi.fn() }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));
const prismaMocks = vi.hoisted(() => ({
  aIPromptTemplate: { findFirst: vi.fn(), findMany: vi.fn() },
  content: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn(), count: vi.fn() },
}));
const resolverMocks = vi.hoisted(() => ({ resolveVariables: vi.fn(), buildPrompt: vi.fn() }));
const validatorMocks = vi.hoisted(() => ({ validateAIOutput: vi.fn() }));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: () => routerMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/prompt/resolver', () => resolverMocks);
vi.mock('@/modules/ai/prompt/validator', () => validatorMocks);

import { contentService } from '@/modules/ai/services/content-service';

const makeUser = () => ({ id: 'u1', email: 't@t.com', tenantId: 't1', role: 'admin', name: 'T', preferredLanguage: 'zh', status: 'active' as const });

describe('contentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    routerMocks.generate.mockResolvedValue({ text: 'Generated post', tokensIn: 100, tokensOut: 200, model: 'gpt-4o', provider: 'openai', durationMs: 500 });
    resolverMocks.resolveVariables.mockResolvedValue({});
    resolverMocks.buildPrompt.mockReturnValue('Built prompt');
    validatorMocks.validateAIOutput.mockReturnValue({ valid: true, violations: [] });
    prismaMocks.aIPromptTemplate.findFirst.mockResolvedValue({ id: 't1', systemPrompt: 'sys', userPromptTemplate: 'Write about {topic}' });
    prismaMocks.aIPromptTemplate.findMany.mockResolvedValue([{ id: 'default', systemPrompt: 'sys', userPromptTemplate: 'Write about {topic}', language: 'zh', isDefault: true, category: 'content' }]);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
  });

  // ── Happy path ──
  describe('generate', () => {
    it('generates content through full pipeline', async () => {
      const result = await contentService.generate(makeUser(), { topic: 'AI trends', platform: 'facebook', language: 'zh' });
      expect(quotaMocks.enforceQuota).toHaveBeenCalled();
      expect(routerMocks.generate).toHaveBeenCalled();
      expect(validatorMocks.validateAIOutput).toHaveBeenCalled();
      expect(trackerMocks.logAIUsage).toHaveBeenCalled();
      expect(result.content).toBe('Generated post');
    });

    it('resolves template by ID when provided', async () => {
      await contentService.generate(makeUser(), { templateId: 't1', topic: 'Test', platform: 'instagram' });
      expect(prismaMocks.aIPromptTemplate.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 't1' }) }));
    });

    it('retries on validation failure', async () => {
      validatorMocks.validateAIOutput.mockReturnValueOnce({ valid: false, violations: ['blocked'] }).mockReturnValueOnce({ valid: true, violations: [] });
      const result = await contentService.generate(makeUser(), { topic: 'Test', platform: 'facebook' });
      expect(routerMocks.generate).toHaveBeenCalledTimes(2);
      expect(result.content).toBe('Generated post');
    });
  });

  // ── Quota ──
  it('throws when quota exceeded', async () => {
    quotaMocks.enforceQuota.mockRejectedValue(new Error('QUOTA_EXCEEDED'));
    await expect(contentService.generate(makeUser(), { topic: 'Test', platform: 'facebook' }))
      .rejects.toThrow('QUOTA_EXCEEDED');
  });
});
