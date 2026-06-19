import type { ActivationRisk, DropOffStage } from '../contracts/ActivationProjection';
import type { ActivationFacts } from './activation-score-engine';

const FIFTEEN_MINUTES = 15;

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

export function detectDropOffStage(facts: ActivationFacts): DropOffStage {
  if (!facts.interviewStartedAt) return 'signup_dropoff';
  if (!facts.interviewCompletedAt) return 'interview_dropoff';
  if (!facts.brandDnaGeneratedAt) return 'brand_dna_dropoff';
  if (!facts.firstContentGeneratedAt) return 'content_dropoff';
  if (!facts.leadMagnetGeneratedAt) return 'lead_magnet_dropoff';
  if (!facts.firstLeadCapturedAt) return 'landing_page_dropoff';
  return 'none';
}

export function activationRiskFor(input: {
  facts: ActivationFacts;
  activationScore: number;
  dropOffStage: DropOffStage;
}): ActivationRisk {
  if (input.dropOffStage === 'none') return 'low';

  const now = new Date(input.facts.generatedAt);
  const elapsedMinutes = minutesBetween(input.facts.userCreatedAt, now);
  const firstWinMissed = !input.facts.firstContentGeneratedAt && elapsedMinutes > FIFTEEN_MINUTES;

  if (firstWinMissed && input.activationScore < 70) return 'critical';
  if (input.activationScore < 35) return 'high';
  if (input.activationScore < 70) return 'medium';
  return 'low';
}
