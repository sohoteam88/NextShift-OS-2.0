import type { OptimizationPattern } from '../contracts/OptimizationProjection';
import type { OptimizationFacts } from './success-analysis-engine';

export function analyzeFailurePatterns(facts: OptimizationFacts & {
  missionBlockedCount: number;
  missionAbandonedCount: number;
  agentFailedCount: number;
  executionFailedCount: number;
}): OptimizationPattern[] {
  const patterns: OptimizationPattern[] = [];

  if (facts.missionTotalCount > 0 && facts.missionCompletionRate < 40) {
    patterns.push({
      area: 'mission',
      title: 'Low mission completion pattern',
      reason: `Mission completion rate is only ${facts.missionCompletionRate}%.`,
      confidenceDelta: -12,
      usageRecommendation: 'decrease',
    });
  }

  if (facts.missionBlockedCount + facts.missionAbandonedCount > 0) {
    patterns.push({
      area: 'journey',
      title: 'Journey friction pattern',
      reason: `${facts.missionBlockedCount} blocked and ${facts.missionAbandonedCount} abandoned missions found.`,
      confidenceDelta: -10,
      usageRecommendation: 'decrease',
    });
  }

  if (facts.contentPublishedCount === 0) {
    patterns.push({
      area: 'content',
      title: 'No content output pattern',
      reason: 'No published content exists, so authority and traffic cannot compound.',
      confidenceDelta: -10,
      usageRecommendation: 'decrease',
    });
  }

  if (facts.funnelConversionRate === 0) {
    patterns.push({
      area: 'funnel',
      title: 'No funnel conversion pattern',
      reason: 'Funnels have no visible conversion signal.',
      confidenceDelta: -8,
      usageRecommendation: 'monitor',
    });
  }

  if (facts.agentFailedCount > 0 || facts.agentSuccessRate < 50) {
    patterns.push({
      area: 'agent',
      title: 'Agent execution weakness pattern',
      reason: `${facts.agentFailedCount} agent task failures found; success rate is ${facts.agentSuccessRate}%.`,
      confidenceDelta: -10,
      usageRecommendation: 'decrease',
    });
  }

  if (facts.growthProjection.primaryBottleneck) {
    patterns.push({
      area: 'growth',
      title: `${facts.growthProjection.primaryBottleneck.title} pattern`,
      reason: facts.growthProjection.primaryBottleneck.reason,
      confidenceDelta: -8,
      usageRecommendation: 'monitor',
    });
  }

  return patterns.sort((a, b) => a.confidenceDelta - b.confidenceDelta);
}
