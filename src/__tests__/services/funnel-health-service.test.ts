import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({ funnel: { findFirst: vi.fn() } }));
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

import { funnelHealthService, FunnelHealthScore } from '@/modules/funnel/services/funnel-health-service';

const makeUser = () => ({ id: 'u1', email: 't@t.com', tenantId: 't1', role: 'operator', name: 'T', preferredLanguage: 'zh', status: 'active' as const });

describe('funnelHealthService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ── calculate ──
  describe('calculate', () => {
    it('returns excellent for complete funnel with real material', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({
        id: 'f1', status: 'published', views: 100, conversions: 10,
        config: {
          sections: [{ type: 'hero' }, { type: 'pain' }, { type: 'benefits' }, { type: 'cta' }],
          strategy_context: { real_material: { case_studies: [{ name: 'Test' }] } },
          quality_gate_results: { pass_rate: 90 },
        },
      });
      const result = await funnelHealthService.calculate('f1', makeUser());
      expect(result.status).toBe('excellent');
      expect(result.overall).toBeGreaterThanOrEqual(80);
    });

    it('returns critical for empty funnel', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({
        id: 'f1', status: 'draft', views: 0, conversions: 0,
        config: { sections: [], strategy_context: { real_material: { case_studies: [] } }, quality_gate_results: { pass_rate: 0 } },
      });
      const result = await funnelHealthService.calculate('f1', makeUser());
      expect(result.status).toBe('critical');
      expect(result.overall).toBeLessThan(40);
    });

    it('returns needs_attention for partial funnel', async () => {
      prismaMocks.funnel.findFirst.mockResolvedValue({
        id: 'f1', status: 'draft', views: 5, conversions: 0,
        config: { sections: [{ type: 'hero' }], strategy_context: { real_material: { case_studies: [] } } },
      });
      const result = await funnelHealthService.calculate('f1', makeUser());
      expect(result.status).toBe('needs_attention');
    });
  });

  // ── getNextBestAction ──
  describe('getNextBestAction', () => {
    it('recommends adding real material when missing', () => {
      const result = funnelHealthService.getNextBestAction({
        completeness: 100, realMaterialUsed: 30, diversity: 90, ctaConsistency: 100, performance: 80,
      });
      expect(result.action).toContain('真实');
    });

    it('recommends unification when CTA inconsistent', () => {
      const result = funnelHealthService.getNextBestAction({
        completeness: 100, realMaterialUsed: 100, diversity: 90, ctaConsistency: 50, performance: 80,
      });
      expect(result.action).toContain('CTA');
    });

    it('recommends publishing when no performance data', () => {
      const result = funnelHealthService.getNextBestAction({
        completeness: 100, realMaterialUsed: 100, diversity: 90, ctaConsistency: 100, performance: null,
      });
      expect(result.action).toContain('发布');
    });
  });

  // ── evaluatePackage ──
  describe('evaluatePackage', () => {
    const makePkg = (overrides: any = {}) => ({
      landingPage: { headline: 'H', benefits: ['a', 'b', 'c'], heroCta: 'CTA', credibility: 'Trust' },
      thankYouPage: { confirmation: 'Thanks', whatsappCta: 'Chat' },
      whatsappFlow: { prefilledMessage: 'Hello', firstReply: 'Hi', qualificationQuestions: [], followUpFlow: '', objectionHandling: [], appointmentCta: '' },
      emailSequence: [{}, {}, {}, {}, {}],
      adAngles: [{}, {}, {}],
      ...overrides,
    } as any);

    it('scores highly for complete package', () => {
      const result = funnelHealthService.evaluatePackage(makePkg());
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('scores low for bare package', () => {
      const pkg = makePkg({ landingPage: { headline: '', benefits: [], heroCta: '', credibility: '' }, thankYouPage: { confirmation: '', whatsappCta: '' }, emailSequence: [], adAngles: [] });
      const result = funnelHealthService.evaluatePackage(pkg);
      expect(result.score).toBeLessThan(50);
    });
  });
});
