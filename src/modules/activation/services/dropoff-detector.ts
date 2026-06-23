import type {
  ActivationDropOffRisk,
  ActivationFunnelStepId,
  ActivationProgressState,
  ActivationRisk,
  DropOffStage,
} from '../contracts/ActivationProjection';
import { getActivationFunnelCurrentStep, type ActivationFacts } from './activation-score-engine';

const FIFTEEN_MINUTES = 15;
const GRACE_PERIOD_HOURS: Record<ActivationFunnelStepId, number | null> = {
  SIGNUP: 6,
  AI_INTERVIEW: 24,
  BUSINESS_ANALYSIS: 24,
  FIRST_MISSION: 48,
  FIRST_ASSET: 72,
  FIRST_OUTCOME: 7 * 24,
  ACTIVATED: null,
};

function minutesBetween(start: Date, end: Date) {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60_000));
}

function hoursBetween(start: Date, end: Date) {
  return Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
}

function latestDate(values: Array<Date | null | undefined>) {
  const dates = values.filter((value): value is Date => Boolean(value));
  if (dates.length === 0) return null;
  return dates.reduce((latest, value) => value.getTime() > latest.getTime() ? value : latest);
}

export function getLastMeaningfulActivationActivity(facts: ActivationFacts): Date {
  return latestDate([
    facts.userCreatedAt,
    facts.interviewStartedAt,
    facts.interviewCompletedAt,
    facts.brandDnaGeneratedAt,
    facts.firstMissionStartedAt,
    facts.firstAssetGeneratedAt,
    facts.firstAssetReviewedAt,
    facts.firstOutcomeVerifiedAt,
    facts.firstContentGeneratedAt,
    facts.leadMagnetGeneratedAt,
    facts.landingPagePublishedAt,
    facts.firstLeadCapturedAt,
    facts.lastActivityAt,
  ]) ?? facts.userCreatedAt;
}

function riskLevelFor(state: ActivationProgressState): ActivationRisk {
  if (state === 'DROPPED_OFF') return 'critical';
  if (state === 'AT_RISK') return 'medium';
  return 'low';
}

export function getActivationDropOffRisk(facts: ActivationFacts): ActivationDropOffRisk {
  const currentStep = getActivationFunnelCurrentStep(facts);
  const now = new Date(facts.generatedAt);
  const activityAnchor = getLastMeaningfulActivationActivity(facts);
  const gracePeriodHours = GRACE_PERIOD_HOURS[currentStep];

  if (currentStep === 'ACTIVATED' || gracePeriodHours === null) {
    return {
      state: 'ACTIVATED',
      riskLevel: 'low',
      currentStep,
      gracePeriodHours,
      hoursSinceActivity: 0,
      hoursRemaining: null,
      activityAnchor: activityAnchor.toISOString(),
      thresholdPercentUsed: 0,
      interventionAllowed: false,
    };
  }

  const hoursSinceActivity = hoursBetween(activityAnchor, now);
  const thresholdPercentUsed = gracePeriodHours === 0 ? 1 : hoursSinceActivity / gracePeriodHours;
  const hoursRemaining = Math.max(0, gracePeriodHours - hoursSinceActivity);
  const state: Exclude<ActivationProgressState, 'ACTIVE'> = thresholdPercentUsed > 1
    ? 'DROPPED_OFF'
    : thresholdPercentUsed > 0.75
      ? 'AT_RISK'
      : 'ON_TRACK';

  return {
    state,
    riskLevel: riskLevelFor(state),
    currentStep,
    gracePeriodHours,
    hoursSinceActivity: Number(hoursSinceActivity.toFixed(2)),
    hoursRemaining: Number(hoursRemaining.toFixed(2)),
    activityAnchor: activityAnchor.toISOString(),
    thresholdPercentUsed: Number(thresholdPercentUsed.toFixed(4)),
    interventionAllowed: state !== 'ON_TRACK',
  };
}

export function detectDropOffStage(facts: ActivationFacts): DropOffStage {
  const risk = getActivationDropOffRisk(facts);

  if (facts.firstOutcomeVerifiedAt) return 'none';
  if (risk.state !== 'DROPPED_OFF') return 'none';

  switch (risk.currentStep) {
    case 'SIGNUP':
      return 'signup_dropoff';
    case 'AI_INTERVIEW':
      return 'interview_dropoff';
    case 'BUSINESS_ANALYSIS':
      return 'brand_dna_dropoff';
    case 'FIRST_MISSION':
      return 'first_mission_dropoff';
    case 'FIRST_ASSET':
      return facts.firstAssetGeneratedAt ? 'first_asset_review_dropoff' : 'content_dropoff';
    case 'FIRST_OUTCOME':
      return 'first_outcome_dropoff';
    case 'ACTIVATED':
      return 'none';
  }
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
