import type { GrowthProjection } from '@/modules/growth-loop/contracts/GrowthProjection';
import type { OptimizationPattern } from '../contracts/OptimizationProjection';

export type OptimizationFacts = {
  missionCompletionRate: number;
  missionCompletedCount: number;
  missionTotalCount: number;
  contentPublishedCount: number;
  funnelConversionRate: number;
  agentSuccessRate: number;
  agentCompletedCount: number;
  executionCompletionRate: number;
  growthProjection: GrowthProjection;
};

export function analyzeSuccessPatterns(facts: OptimizationFacts): OptimizationPattern[] {
  const patterns: OptimizationPattern[] = [];

  if (facts.missionCompletionRate >= 70) {
    patterns.push({
      area: 'mission',
      title: 'High mission completion pattern',
      reason: `${facts.missionCompletedCount}/${facts.missionTotalCount} missions are completed.`,
      confidenceDelta: 12,
      usageRecommendation: 'increase',
    });
  }

  if (facts.contentPublishedCount > 0) {
    patterns.push({
      area: 'content',
      title: 'Content publishing pattern',
      reason: `${facts.contentPublishedCount} published content assets exist.`,
      confidenceDelta: 8,
      usageRecommendation: 'increase',
    });
  }

  if (facts.funnelConversionRate > 0) {
    patterns.push({
      area: 'funnel',
      title: 'Funnel conversion pattern',
      reason: `Funnels are converting at ${facts.funnelConversionRate}%.`,
      confidenceDelta: 10,
      usageRecommendation: 'increase',
    });
  }

  if (facts.agentSuccessRate >= 70) {
    patterns.push({
      area: 'agent',
      title: 'Agent execution success pattern',
      reason: `Agent workforce success rate is ${facts.agentSuccessRate}%.`,
      confidenceDelta: 10,
      usageRecommendation: 'increase',
    });
  }

  if (facts.growthProjection.growthScore >= 60) {
    patterns.push({
      area: 'growth',
      title: 'Growth loop momentum pattern',
      reason: `Growth score is ${facts.growthProjection.growthScore}%.`,
      confidenceDelta: 10,
      usageRecommendation: 'increase',
    });
  }

  return patterns.sort((a, b) => b.confidenceDelta - a.confidenceDelta);
}
