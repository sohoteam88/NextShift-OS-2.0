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
  const inactivityPenalty = Math.min(daysInactive(facts) * 3, 45);
  const score = (
    scoreRatio(facts.activeDays30d, 8) * 0.25 +
    missionCompletionRate(facts) * 0.25 +
    scoreRatio(facts.contentGenerated30d, 4) * 0.2 +
    executionConsistency(facts) * 0.15 +
    scoreRatio(facts.aiCooInteractions30d, 4) * 0.15
  ) - inactivityPenalty;

  return clamp(score);
}
