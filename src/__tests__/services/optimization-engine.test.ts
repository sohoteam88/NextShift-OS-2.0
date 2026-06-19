import { describe, expect, it } from 'vitest';
import type { GrowthProjection } from '@/modules/growth-loop/contracts/GrowthProjection';
import { buildOptimizationProjection } from '@/modules/optimization/services/optimization-projection';
import { analyzeSuccessPatterns } from '@/modules/optimization/services/success-analysis-engine';
import { analyzeFailurePatterns } from '@/modules/optimization/services/failure-analysis-engine';

const growthProjection: GrowthProjection = {
  source: 'GrowthLoopEngine',
  scope: 'user',
  confidence: 'derived',
  fallback: 'none',
  generatedAt: '2026-06-19T00:00:00.000Z',
  currentGrowthStage: 'lead',
  growthScore: 58,
  primaryBottleneck: {
    stage: 'lead',
    title: 'Lead bottleneck',
    reason: 'No leads have been captured yet.',
    severity: 'high',
    metric: 'lead_count',
  },
  primaryOpportunity: {
    stage: 'content',
    title: 'Activation momentum',
    reason: 'Activation progress is strong.',
    impact: 'medium',
    metric: 'activation_progress',
  },
  recommendedGrowthAction: {
    title: 'Create or improve the lead magnet',
    reason: 'Lead capture is the current blocked step.',
    route: '/lead-magnet',
    owner: 'growth-loop',
    expectedMetricLift: 'Increase lead_count.',
  },
};

describe('AI-006 self optimizing operating system', () => {
  it('increases confidence for positive outcome patterns', () => {
    const wins = analyzeSuccessPatterns({
      missionCompletionRate: 80,
      missionCompletedCount: 8,
      missionTotalCount: 10,
      contentPublishedCount: 3,
      funnelConversionRate: 12,
      agentSuccessRate: 90,
      agentCompletedCount: 9,
      executionCompletionRate: 75,
      growthProjection: {
        ...growthProjection,
        growthScore: 72,
        primaryBottleneck: null,
      },
    });

    expect(wins.map((pattern) => pattern.usageRecommendation)).toContain('increase');
    expect(wins[0].confidenceDelta).toBeGreaterThan(0);
  });

  it('decreases confidence for negative outcome patterns', () => {
    const failures = analyzeFailurePatterns({
      missionCompletionRate: 20,
      missionCompletedCount: 1,
      missionTotalCount: 5,
      missionBlockedCount: 2,
      missionAbandonedCount: 1,
      contentPublishedCount: 0,
      funnelConversionRate: 0,
      agentSuccessRate: 30,
      agentCompletedCount: 1,
      agentFailedCount: 2,
      executionCompletionRate: 20,
      executionFailedCount: 2,
      growthProjection,
    });

    expect(failures[0].confidenceDelta).toBeLessThan(0);
    expect(failures.map((pattern) => pattern.usageRecommendation)).toContain('decrease');
  });

  it('builds optimization projection with system, agent, and journey changes', () => {
    const projection = buildOptimizationProjection({
      generatedAt: '2026-06-19T00:00:00.000Z',
      missionCompletionRate: 30,
      missionCompletedCount: 3,
      missionTotalCount: 10,
      missionBlockedCount: 2,
      missionAbandonedCount: 1,
      contentPublishedCount: 0,
      funnelConversionRate: 0,
      agentSuccessRate: 40,
      agentCompletedCount: 2,
      agentFailedCount: 3,
      executionCompletionRate: 50,
      executionFailedCount: 1,
      growthProjection,
    });

    expect(projection.source).toBe('OptimizationEngine');
    expect(projection.optimizationScore).toBeLessThan(60);
    expect(projection.topFailurePatterns.length).toBeGreaterThan(0);
    expect(projection.recommendedSystemChanges.length).toBeGreaterThan(0);
    expect(projection.recommendedAgentChanges[0]).toMatchObject({
      area: 'agent',
    });
    expect(projection.recommendedJourneyChanges[0]).toMatchObject({
      area: expect.stringMatching(/mission|journey/),
    });
  });
});
