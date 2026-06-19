import { describe, expect, it } from 'vitest';
import type { GrowthLoopState } from '@/modules/growth-loop/contracts/GrowthLoopState';
import { buildGrowthProjection } from '@/modules/growth-loop/services/growth-projection';
import { detectGrowthBottlenecks } from '@/modules/growth-loop/services/growth-bottleneck-detector';
import { detectGrowthOpportunities } from '@/modules/growth-loop/services/growth-opportunity-engine';

const generatedAt = '2026-06-19T00:00:00.000Z';

function metric(key: string, value: number) {
  return { key, label: key, value, unit: 'count' as const };
}

function baseState(overrides: Partial<GrowthLoopState> = {}): GrowthLoopState {
  const acquisition = {
    source: 'test',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    id: 'acquisition',
    domain: 'acquisition' as const,
    status: 'ready' as const,
    score: 20,
    summary: 'acquisition',
    metrics: [
      metric('lead_count', 0),
      metric('content_count', 0),
      metric('funnel_views', 0),
      metric('funnel_conversions', 0),
    ],
    evidence: [],
    recommendations: [],
    generatedAt,
    channels: ['unknown' as const],
    assets: [],
    leadCount: 0,
  };
  const activation = {
    source: 'test',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    id: 'activation',
    domain: 'activation' as const,
    status: 'active' as const,
    score: 65,
    summary: 'activation',
    metrics: [{ key: 'activation_progress', label: 'activation_progress', value: 65, unit: 'percent' as const }],
    evidence: [],
    recommendations: [],
    generatedAt,
    progressPercent: 65,
    milestones: [],
  };
  const retention = {
    source: 'test',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    id: 'retention',
    domain: 'retention' as const,
    status: 'ready' as const,
    score: 25,
    summary: 'retention',
    metrics: [
      metric('customer_count', 0),
      metric('recent_activity_count', 0),
    ],
    evidence: [],
    recommendations: [],
    generatedAt,
    customerCount: 0,
    segments: [],
    followups: {
      overdue: 0,
      dueToday: 0,
      upcoming: 0,
    },
    atRiskCount: 0,
    retainedCount: 0,
  };
  const referral = {
    source: 'test',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    id: 'referral',
    domain: 'referral' as const,
    status: 'missing' as const,
    score: 0,
    summary: 'referral',
    metrics: [metric('referral_lead_count', 0)],
    evidence: [],
    recommendations: [],
    generatedAt,
    sources: ['unknown' as const],
    invites: {
      created: 0,
      active: 0,
      used: 0,
      expired: 0,
    },
    referralLeadCount: 0,
    referralMemberCount: 0,
  };
  const expansion = {
    source: 'test',
    scope: 'user' as const,
    confidence: 'derived' as const,
    fallback: 'none' as const,
    id: 'expansion',
    domain: 'expansion' as const,
    status: 'ready' as const,
    score: 10,
    summary: 'expansion',
    metrics: [],
    evidence: [],
    recommendations: [],
    generatedAt,
    paths: [],
    opportunities: [],
    teamSize: 0,
    customerCount: 0,
  };

  const state: GrowthLoopState = {
    source: 'GrowthLoopAssembler',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    subjectId: 'user_1',
    tenantId: 'tenant_1',
    generatedAt,
    health: 'building',
    overallScore: 24,
    acquisition,
    activation,
    retention,
    referral,
    expansion,
    signals: [acquisition, activation, retention, referral, expansion],
    recommendations: [],
  };

  return { ...state, ...overrides };
}

describe('GROWTH-001 growth loop engine', () => {
  it('detects the earliest blocking growth stage and recommended action', () => {
    const projection = buildGrowthProjection(baseState());

    expect(projection).toMatchObject({
      source: 'GrowthLoopEngine',
      currentGrowthStage: 'content',
      primaryBottleneck: {
        stage: 'content',
        title: 'Content bottleneck',
        severity: 'critical',
      },
      recommendedGrowthAction: {
        title: 'Publish the first growth content asset',
        route: '/content-engine',
      },
    });
    expect(projection.growthScore).toBeGreaterThan(0);
  });

  it('detects lead and conversion bottlenecks after content and traffic exist', () => {
    const state = baseState();
    state.acquisition = {
      ...state.acquisition,
      score: 45,
      leadCount: 0,
      metrics: [
        metric('content_count', 4),
        metric('funnel_views', 20),
        metric('lead_count', 0),
        metric('funnel_conversions', 0),
      ],
    };
    state.signals = [state.acquisition, state.activation, state.retention, state.referral, state.expansion];

    const bottlenecks = detectGrowthBottlenecks(state);

    expect(bottlenecks[0]).toMatchObject({
      stage: 'lead',
      title: 'Lead bottleneck',
    });
  });

  it('detects opportunities from activation and lead signals', () => {
    const state = baseState();
    state.acquisition = {
      ...state.acquisition,
      score: 70,
      leadCount: 3,
      metrics: [
        metric('content_count', 5),
        metric('funnel_views', 40),
        metric('lead_count', 3),
        metric('funnel_conversions', 1),
      ],
      conversionRate: 3,
    };
    state.signals = [state.acquisition, state.activation, state.retention, state.referral, state.expansion];

    const opportunities = detectGrowthOpportunities(state);

    expect(opportunities.map((item) => item.stage)).toContain('conversation');
    expect(opportunities.map((item) => item.stage)).toContain('conversion');
  });
});
