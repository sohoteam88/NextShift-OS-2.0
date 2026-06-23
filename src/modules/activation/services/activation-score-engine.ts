import type { ActivationFunnelStepId, ActivationStepId } from '../contracts/ActivationProjection';

export type ActivationFacts = {
  userCreatedAt: Date;
  interviewStartedAt: Date | null;
  interviewCompletedAt: Date | null;
  brandDnaGeneratedAt: Date | null;
  firstContentGeneratedAt: Date | null;
  firstLeadCapturedAt: Date | null;
  leadMagnetGeneratedAt: Date | null;
  landingPagePublishedAt: Date | null;
  firstMissionStartedAt: Date | null;
  firstAssetGeneratedAt: Date | null;
  firstAssetReviewedAt: Date | null;
  firstOutcomeVerifiedAt: Date | null;
  lastActivityAt: Date | null;
  generatedAt: string;
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

export function completedActivationFunnelSteps(facts: ActivationFacts): Set<ActivationFunnelStepId> {
  const completed = new Set<ActivationFunnelStepId>(['SIGNUP']);
  if (facts.interviewCompletedAt) completed.add('AI_INTERVIEW');
  if (facts.brandDnaGeneratedAt) completed.add('BUSINESS_ANALYSIS');
  if (facts.firstMissionStartedAt) completed.add('FIRST_MISSION');
  if (facts.firstAssetGeneratedAt ?? facts.firstContentGeneratedAt ?? facts.leadMagnetGeneratedAt ?? facts.landingPagePublishedAt) {
    completed.add('FIRST_ASSET');
  }
  if (facts.firstOutcomeVerifiedAt ?? facts.firstLeadCapturedAt) completed.add('FIRST_OUTCOME');
  if (facts.firstOutcomeVerifiedAt) completed.add('ACTIVATED');
  return completed;
}

export function getActivationFunnelCurrentStep(facts: ActivationFacts): ActivationFunnelStepId {
  const completed = completedActivationFunnelSteps(facts);
  const order: ActivationFunnelStepId[] = [
    'SIGNUP',
    'AI_INTERVIEW',
    'BUSINESS_ANALYSIS',
    'FIRST_MISSION',
    'FIRST_ASSET',
    'FIRST_OUTCOME',
    'ACTIVATED',
  ];
  return order.find((step) => !completed.has(step)) ?? 'ACTIVATED';
}

export function calculateActivationScore(facts: ActivationFacts): number {
  const completed = completedActivationFunnelSteps(facts);
  return Math.round((completed.size / 7) * 100);
}
