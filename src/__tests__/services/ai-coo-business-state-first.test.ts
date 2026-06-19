import { beforeEach, describe, expect, it, vi } from 'vitest';

const businessStateMocks = vi.hoisted(() => ({
  businessStateService: { getBusinessState: vi.fn() },
}));

const ceoMocks = vi.hoisted(() => ({
  ceoAdvisorEngine: { generateCEOReport: vi.fn() },
}));

vi.mock('@/modules/business-state/services/BusinessStateService', () => businessStateMocks);
vi.mock('@/modules/business-intelligence/ceoAdvisorEngine', () => ceoMocks);

import { adaptCEORecommendations } from '@/modules/ai-coo/adapters/CEORecommendationAdapter';

describe('AUTH-003 business-state-first COO recommendations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
  });

  it('uses Business State before CEO Advisor local calculations', async () => {
    businessStateMocks.businessStateService.getBusinessState.mockResolvedValue({
      stage: 'lead_generation',
      readiness: {
        source: 'BusinessStateAssembler',
        scope: 'user',
        confidence: 'derived',
        fallback: 'none',
        score: 72,
        maxScore: 100,
        percentage: 72,
      },
      bottlenecks: [
        {
          source: 'FunnelReadinessAdapter',
          scope: 'user',
          confidence: 'derived',
          fallback: 'none',
          code: 'funnel_missing',
          title: 'Build the funnel',
          description: 'A funnel is required before traffic.',
          severity: 'high',
          domain: 'funnel',
        },
      ],
      opportunities: [],
    });

    const result = await adaptCEORecommendations('user_1', 'tenant_1');

    expect(result.source).toBe('business_state');
    expect(result.businessState?.businessStage).toBe('lead_generation');
    expect(result.recommendations[0]).toMatchObject({
      source: 'business_state',
      recommendationSource: 'business_state',
      title: 'Build the funnel',
      domain: 'funnel',
    });
    expect(ceoMocks.ceoAdvisorEngine.generateCEOReport).not.toHaveBeenCalled();
  });

  it('falls back to CEO Advisor only when Business State is unavailable', async () => {
    businessStateMocks.businessStateService.getBusinessState.mockRejectedValue(new Error('unavailable'));
    ceoMocks.ceoAdvisorEngine.generateCEOReport.mockResolvedValue({
      summary: 'fallback report',
      health: { overallScore: 44 },
      bottlenecks: [],
      opportunities: [],
      actions: [
        {
          priority: 1,
          action: 'Fallback action',
          expectedImpact: 'Fallback impact',
          agentRecommended: 'ceo_advisor',
          route: '/dashboard',
        },
      ],
      risks: [],
      forecast: {},
      agentRecommendations: [],
      automationRecommendations: [],
    });

    const result = await adaptCEORecommendations('user_1', 'tenant_1');

    expect(result.source).toBe('fallback_ceo_advisor');
    expect(result.report?.summary).toBe('fallback report');
    expect(result.recommendations[0]).toMatchObject({
      source: 'fallback_ceo_advisor',
      recommendationSource: 'fallback',
      title: 'Fallback action',
    });
    expect(ceoMocks.ceoAdvisorEngine.generateCEOReport).toHaveBeenCalledWith('user_1', 'tenant_1');
  });
});
