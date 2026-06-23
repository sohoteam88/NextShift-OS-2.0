import type { MomentumWin } from '../contracts/RetentionProjection';
import type { RetentionFacts } from './retention-score-engine';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function calculateMomentumScore(facts: RetentionFacts) {
  const outcomeScore = (facts.outcomeCompletionCount30d ?? 0) * 30;
  const progressScore = Math.round((facts.currentOutcomeProgressPercentage ?? 0) * 0.25);
  const assetUsageScore = (facts.assetUtilizationCount30d ?? facts.contentGenerated30d + facts.leadMagnetsCreated30d + facts.funnelsLaunched30d) * 8;
  const agentUsageScore = (facts.agentUsageCount30d ?? facts.aiCooInteractions30d) * 6;

  return clamp(
    outcomeScore +
    progressScore +
    facts.missionCompleted30d * 10 +
    assetUsageScore +
    agentUsageScore,
  );
}

export function currentMomentumFor(input: { score: number; recentWins: MomentumWin[] }) {
  if (input.score >= 75) return 'Momentum is strong. Keep the current weekly rhythm.';
  if (input.score >= 45) return 'Momentum is building. Complete one meaningful action today.';
  if (input.recentWins.length > 0) return 'Recent wins exist, but the rhythm needs reinforcement.';
  return 'Momentum is low. Restart with one small guided action.';
}

export function currentStreakFromActiveDays(activeDays30d: number) {
  return Math.max(0, Math.min(activeDays30d, 30));
}
