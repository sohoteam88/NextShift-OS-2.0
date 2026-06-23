import type { RetentionRisk, RetentionState } from '../contracts/RetentionProjection';
import { daysBetween, daysInactive, type RetentionFacts } from './retention-score-engine';

export function inactivityFlagFor(days: number) {
  if (days >= 30) return '30_days_inactive' as const;
  if (days >= 14) return '14_days_inactive' as const;
  if (days >= 7) return '7_days_inactive' as const;
  if (days >= 3) return '3_days_inactive' as const;
  return 'none' as const;
}

export function retentionRiskFor(days: number): RetentionRisk {
  if (days >= 30) return 'critical';
  if (days >= 14) return 'high';
  if (days >= 7) return 'medium';
  if (days >= 3) return 'medium';
  return 'low';
}

export function outcomeDaysInactive(facts: RetentionFacts) {
  if (!facts.lastOutcomeAt) return null;
  return daysBetween(facts.lastOutcomeAt, new Date(facts.generatedAt));
}

export function outcomeRetentionRiskFor(facts: RetentionFacts): RetentionRisk {
  const daysSinceOutcome = outcomeDaysInactive(facts);
  const outcomeCount = facts.outcomeCompletionCount ?? 0;
  const missionDaysInactive = daysInactive(facts);

  if (outcomeCount === 0) return retentionRiskFor(missionDaysInactive);
  if (daysSinceOutcome !== null && daysSinceOutcome >= 30) return 'critical';
  if (daysSinceOutcome !== null && daysSinceOutcome >= 14) return 'high';
  if (missionDaysInactive >= 14) return 'high';
  if ((facts.currentOutcomeProgressPercentage ?? 0) === 0 && daysSinceOutcome !== null && daysSinceOutcome >= 7) return 'medium';
  return 'low';
}

export function retentionStateFor(input: { facts: RetentionFacts; retentionScore: number; momentumScore: number }): RetentionState {
  const inactiveDays = daysInactive(input.facts);
  const accountAgeDays = daysBetween(input.facts.userCreatedAt, new Date(input.facts.generatedAt));

  if (accountAgeDays < 7) return 'new_user';
  if (inactiveDays >= 30) return 'churn_risk';
  if (inactiveDays >= 14) return 'inactive';
  if (inactiveDays >= 3 || input.retentionScore < 45) return 'at_risk';
  if (input.momentumScore >= 75 && input.retentionScore >= 70) return 'engaged_user';
  return 'active_user';
}
