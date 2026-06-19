import type { ActivationStepId } from '../contracts/ActivationProjection';

export type ActivationFacts = {
  userCreatedAt: Date;
  interviewStartedAt: Date | null;
  interviewCompletedAt: Date | null;
  brandDnaGeneratedAt: Date | null;
  firstContentGeneratedAt: Date | null;
  firstLeadCapturedAt: Date | null;
  leadMagnetGeneratedAt: Date | null;
  landingPagePublishedAt: Date | null;
  lastActivityAt: Date | null;
  generatedAt: string;
};

const STEP_WEIGHTS: Record<ActivationStepId, number> = {
  account_created: 10,
  interview_started: 15,
  interview_completed: 20,
  brand_dna_generated: 25,
  first_content_generated: 20,
  first_lead_captured: 10,
};

export function completedActivationSteps(facts: ActivationFacts): Set<ActivationStepId> {
  const completed = new Set<ActivationStepId>(['account_created']);
  if (facts.interviewStartedAt) completed.add('interview_started');
  if (facts.interviewCompletedAt) completed.add('interview_completed');
  if (facts.brandDnaGeneratedAt) completed.add('brand_dna_generated');
  if (facts.firstContentGeneratedAt) completed.add('first_content_generated');
  if (facts.firstLeadCapturedAt) completed.add('first_lead_captured');
  return completed;
}

export function calculateActivationScore(facts: ActivationFacts): number {
  const completed = completedActivationSteps(facts);
  return Array.from(completed).reduce((score, step) => score + STEP_WEIGHTS[step], 0);
}
