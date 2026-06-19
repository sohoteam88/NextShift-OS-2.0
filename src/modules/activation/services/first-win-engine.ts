import type { ActivationFacts } from './activation-score-engine';

const FIRST_WIN_TARGET_MINUTES = 15;

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export function getTimeToFirstWinMinutes(facts: ActivationFacts): number | null {
  if (!facts.firstContentGeneratedAt) return null;
  return minutesBetween(facts.userCreatedAt, facts.firstContentGeneratedAt);
}

export function getFirstWinStatus(facts: ActivationFacts): 'on_track' | 'at_risk' | 'missed' | 'achieved' {
  const timeToFirstWin = getTimeToFirstWinMinutes(facts);
  if (timeToFirstWin !== null) return 'achieved';

  const elapsed = minutesBetween(facts.userCreatedAt, new Date(facts.generatedAt));
  if (elapsed > FIRST_WIN_TARGET_MINUTES) return 'missed';
  if (elapsed > FIRST_WIN_TARGET_MINUTES * 0.7) return 'at_risk';
  return 'on_track';
}

export function getFirstWinProgressPercent(facts: ActivationFacts) {
  if (facts.firstContentGeneratedAt) return 100;
  if (facts.brandDnaGeneratedAt) return 80;
  if (facts.interviewCompletedAt) return 60;
  if (facts.interviewStartedAt) return 35;
  return 10;
}

export { FIRST_WIN_TARGET_MINUTES };
