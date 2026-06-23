export type RetentionFacts = {
  userCreatedAt: Date;
  lastActivityAt: Date;
  generatedAt: string;
  loginEvents30d: number;
  activeDays30d: number;
  missionCompleted30d: number;
  missionTotal30d: number;
  contentGenerated30d: number;
  executionCompleted30d: number;
  executionFailed30d: number;
  aiCooInteractions30d: number;
  leadMagnetsCreated30d: number;
  funnelsLaunched30d: number;
  winsAchieved30d: number;
  outcomeCompletionCount?: number;
  outcomeCompletionCount30d?: number;
  lastOutcomeAt?: Date | null;
  currentOutcomeProgressPercentage?: number;
  assetUtilizationCount30d?: number;
  agentUsageCount30d?: number;
  currentOutcome?: 'FIRST_LEAD' | 'FIRST_CUSTOMER' | 'FIRST_REVENUE' | 'RETENTION_SYSTEM' | 'TEAM_SCALING' | 'AUTHORITY_BUILDING';
  locale?: string | null;
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreRatio(value: number, target: number) {
  if (target <= 0) return 0;
  return clamp((value / target) * 100);
}

export function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

export function daysInactive(facts: RetentionFacts) {
  return daysBetween(facts.lastActivityAt, new Date(facts.generatedAt));
}

export function missionCompletionRate(facts: RetentionFacts) {
  if (facts.missionTotal30d === 0) return facts.missionCompleted30d > 0 ? 100 : 0;
  return clamp((facts.missionCompleted30d / facts.missionTotal30d) * 100);
}

export function executionConsistency(facts: RetentionFacts) {
  const total = facts.executionCompleted30d + facts.executionFailed30d;
  if (total === 0) return 0;
  return clamp((facts.executionCompleted30d / total) * 100);
}

export function calculateRetentionScore(facts: RetentionFacts) {
  const outcomeCount = facts.outcomeCompletionCount ?? 0;
  const outcomeVelocity = facts.outcomeCompletionCount30d ?? 0;
  const outcomeProgress = facts.currentOutcomeProgressPercentage ?? 0;
  const lastOutcomeAt = facts.lastOutcomeAt;
  const daysSinceOutcome = lastOutcomeAt ? daysBetween(lastOutcomeAt, new Date(facts.generatedAt)) : null;
  const outcomeRecencyScore = daysSinceOutcome === null
    ? 0
    : daysSinceOutcome <= 7
      ? 100
      : daysSinceOutcome <= 14
        ? 70
        : daysSinceOutcome <= 30
          ? 35
          : 0;
  const inactivityPenalty = Math.min(daysInactive(facts) * 1.5, 30);
  const score = (
    scoreRatio(outcomeCount, 3) * 0.25 +
    scoreRatio(outcomeVelocity, 2) * 0.2 +
    outcomeRecencyScore * 0.2 +
    outcomeProgress * 0.15 +
    missionCompletionRate(facts) * 0.1 +
    scoreRatio(facts.assetUtilizationCount30d ?? facts.contentGenerated30d + facts.leadMagnetsCreated30d + facts.funnelsLaunched30d, 4) * 0.05 +
    scoreRatio(facts.agentUsageCount30d ?? facts.aiCooInteractions30d, 4) * 0.05
  ) - inactivityPenalty;

  return clamp(score);
}
