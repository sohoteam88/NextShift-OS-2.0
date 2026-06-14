import { beforeEach, describe, expect, it, vi } from 'vitest';

const routerMocks = vi.hoisted(() => ({ generate: vi.fn() }));
const quotaMocks = vi.hoisted(() => ({ enforceQuota: vi.fn() }));
const trackerMocks = vi.hoisted(() => ({ logAIUsage: vi.fn() }));
const prismaMocks = vi.hoisted(() => ({
  lead: { findFirst: vi.fn() },
  aIPromptTemplate: { findFirst: vi.fn(), findMany: vi.fn() },
}));
const resolverMocks = vi.hoisted(() => ({ resolveVariables: vi.fn(), buildPrompt: vi.fn() }));
const validatorMocks = vi.hoisted(() => ({ validateAIOutput: vi.fn() }));

vi.mock('@/modules/ai/router', () => ({ getRouterForTenant: () => routerMocks }));
vi.mock('@/modules/ai/usage/quota', () => ({ enforceQuota: quotaMocks.enforceQuota }));
vi.mock('@/modules/ai/usage/tracker', () => ({ logAIUsage: trackerMocks.logAIUsage }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/prompt/resolver', () => resolverMocks);
vi.mock('@/modules/ai/prompt/validator', () => validatorMocks);

import { leadAnalysisService } from '@/modules/ai/services/lead-analysis-service';

const makeUser = () => ({ id: 'u1', email: 't@t.com', tenantId: 't1', role: 'admin', name: 'T', preferredLanguage: 'zh', status: 'active' as const });

const analysisJson = JSON.stringify({
  summary: 'High potential lead',
  engagement_level: 'high',
  next_best_action: 'Send personalized WhatsApp',
  talking_points: ['Point 1', 'Point 2'],
  risk_factors: ['Competitor contact'],
  estimated_conversion_likelihood: 'high',
  recommended_followup_days: 2,
});

describe('leadAnalysisService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    quotaMocks.enforceQuota.mockResolvedValue(undefined);
    routerMocks.generate.mockResolvedValue({ text: analysisJson, tokensIn: 200, tokensOut: 300, model: 'gpt-4o', provider: 'openai', durationMs: 800 });
    resolverMocks.resolveVariables.mockResolvedValue({ lead_name: 'John' });
    resolverMocks.buildPrompt.mockReturnValue('Analyze this lead');
    validatorMocks.validateAIOutput.mockReturnValue({ valid: true, violations: [] });
    prismaMocks.lead.findFirst.mockResolvedValue({ id: 'lead-1', name: 'John', phone: '60123456789', source: 'facebook', stage: 'new', score: 50, tags: [], notes: [], activities: [] });
    prismaMocks.aIPromptTemplate.findFirst.mockResolvedValue({ id: 't1', systemPrompt: 'sys', userPromptTemplate: '{lead_name}' });
    prismaMocks.aIPromptTemplate.findMany.mockResolvedValue([{ id: 'default', systemPrompt: 'sys', userPromptTemplate: '{lead_name}', language: 'zh', isDefault: true, category: 'lead_analysis' }]);
    trackerMocks.logAIUsage.mockResolvedValue(undefined);
  });

  // ── Happy path ──
  describe('analyze', () => {
    it('analyzes a lead through full pipeline', async () => {
      const result = await leadAnalysisService.analyze(makeUser(), { leadId: 'lead-1' });
      expect(quotaMocks.enforceQuota).toHaveBeenCalled();
      expect(prismaMocks.lead.findFirst).toHaveBeenCalled();
      expect(result.summary).toBe('High potential lead');
      expect(result.engagement_level).toBe('high');
    });

    it('returns structured analysis fields', async () => {
      const result = await leadAnalysisService.analyze(makeUser(), { leadId: 'lead-1' });
      expect(result.talking_points).toHaveLength(2);
      expect(result.risk_factors).toContain('Competitor contact');
      expect(result.estimated_conversion_likelihood).toBe('high');
    });
  });

  // ── Quota ──
  it('throws when quota exceeded', async () => {
    quotaMocks.enforceQuota.mockRejectedValue(new Error('QUOTA_EXCEEDED'));
    await expect(leadAnalysisService.analyze(makeUser(), { leadId: 'lead-1' }))
      .rejects.toThrow('QUOTA_EXCEEDED');
  });

  // ── Error handling ──
  it('handles malformed JSON from AI', async () => {
    routerMocks.generate.mockResolvedValue({ text: 'not json', tokensIn: 100, tokensOut: 100, model: 'gpt-4o', provider: 'openai', durationMs: 500 });
    await expect(leadAnalysisService.analyze(makeUser(), { leadId: 'lead-1' }))
      .rejects.toThrow();
  });
});
