import type { OptimizationProjection, RecommendedSystemChange } from '../contracts/OptimizationProjection';
import { analyzeFailurePatterns } from './failure-analysis-engine';
import { recommendedChangesFromPatterns } from './pattern-detection-engine';
import { analyzeSuccessPatterns, type OptimizationFacts } from './success-analysis-engine';

type BuildOptimizationProjectionInput = OptimizationFacts & {
  generatedAt: string;
  missionBlockedCount: number;
  missionAbandonedCount: number;
  agentFailedCount: number;
  executionFailedCount: number;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function optimizationScoreFor(input: BuildOptimizationProjectionInput) {
  const outcomeScore = (
    input.missionCompletionRate
    + input.agentSuccessRate
    + input.executionCompletionRate
    + input.growthProjection.growthScore
  ) / 4;
  const penalty = Math.min((input.missionBlockedCount + input.missionAbandonedCount + input.agentFailedCount + input.executionFailedCount) * 5, 30);

  return clamp(outcomeScore - penalty);
}

function changeFromPattern(pattern: { area: RecommendedSystemChange['area']; title: string; reason: string; confidenceDelta: number }): RecommendedSystemChange {
  return {
    area: pattern.area,
    title: pattern.confidenceDelta >= 0 ? `Increase usage of ${pattern.title}` : `Reduce friction from ${pattern.title}`,
    reason: pattern.reason,
    priority: Math.abs(pattern.confidenceDelta) >= 10 ? 'high' : 'medium',
  };
}

function agentChangesFromPatterns(input: ReturnType<typeof analyzeSuccessPatterns>) {
  return input.filter((pattern) => pattern.area === 'agent').map(changeFromPattern);
}

function journeyChangesFromPatterns(input: ReturnType<typeof analyzeFailurePatterns>) {
  return input
    .filter((pattern) => pattern.area === 'journey' || pattern.area === 'mission')
    .map(changeFromPattern);
}

export function buildOptimizationProjection(input: BuildOptimizationProjectionInput): OptimizationProjection {
  const topWinningPatterns = analyzeSuccessPatterns(input).slice(0, 5);
  const topFailurePatterns = analyzeFailurePatterns(input).slice(0, 5);
  const recommendedSystemChanges = recommendedChangesFromPatterns({
    wins: topWinningPatterns,
    failures: topFailurePatterns,
  });
  const score = optimizationScoreFor(input);
  const focus = topFailurePatterns[0]?.title ?? topWinningPatterns[0]?.title ?? 'Monitor operating system performance';

  return {
    source: 'OptimizationEngine',
    scope: 'user',
    confidence: input.missionTotalCount > 0 || input.agentCompletedCount > 0 ? 'derived' : 'fallback',
    fallback: input.missionTotalCount > 0 || input.agentCompletedCount > 0 ? 'none' : 'insufficient_outcome_history',
    generatedAt: input.generatedAt,
    optimizationScore: score,
    currentOptimizationFocus: focus,
    topWinningPatterns,
    topFailurePatterns,
    recommendedSystemChanges,
    recommendedAgentChanges: agentChangesFromPatterns([...topWinningPatterns, ...topFailurePatterns]),
    recommendedJourneyChanges: journeyChangesFromPatterns(topFailurePatterns),
  };
}
