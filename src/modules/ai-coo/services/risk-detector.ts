import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { GrowthLoopState } from '@/modules/growth-loop/contracts/GrowthLoopState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { BusinessContextProjection } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import type { GrowthProjection } from '@/modules/growth-loop/contracts/GrowthProjection';
import type { OptimizationProjection } from '@/modules/optimization/contracts/OptimizationProjection';
import type { ActivationProjection } from '@/modules/activation/contracts/ActivationProjection';
import type { RetentionProjection } from '@/modules/retention/contracts/RetentionProjection';
import type { ValueProjection } from '@/modules/value/contracts/ValueProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import type { UserSuccessProjection } from '@/modules/user-success/contracts/UserSuccessProjection';
import type { CustomerHealthProjection } from '@/modules/customer-health/contracts/CustomerHealthProjection';
import type { AICOODecisionSignal } from '../contracts/AICOODecision';

function priorityRank(priority: AICOODecisionSignal['priority']) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[priority];
}

export function detectRisks(input: {
  businessState: BusinessState;
  missionAuthority: MissionAuthoritySnapshot;
  businessContext: BusinessContextProjection;
  interviewAuthority: InterviewAuthorityProjection;
  growthLoopState: GrowthLoopState;
  growthProjection?: GrowthProjection;
  optimizationProjection?: OptimizationProjection;
  activationProjection?: ActivationProjection;
  retentionProjection?: RetentionProjection;
  valueProjection?: ValueProjection;
  userSuccessProjection?: UserSuccessProjection;
  expansionProjection?: ExpansionProjection;
  referralProjection?: ReferralProjection;
  customerHealthProjection?: CustomerHealthProjection;
}): AICOODecisionSignal[] {
  const risks: AICOODecisionSignal[] = [];

  if (
    input.customerHealthProjection
    && input.customerHealthProjection.customerHealth.interventionRequired
  ) {
    const primaryRisk = input.customerHealthProjection.customerHealth.riskFactors[0];
    risks.push({
      code: `health_${input.customerHealthProjection.customerHealth.healthLevel.toLowerCase()}`,
      title: input.customerHealthProjection.recommendedAction.title,
      reason: primaryRisk?.reason ?? input.customerHealthProjection.recommendedAction.reason,
      domain: primaryRisk?.type === 'expansion_plateau'
        ? 'sales'
        : primaryRisk?.type === 'referral_blocked'
          ? 'crm'
          : primaryRisk?.type === 'low_asset_utilization'
            ? 'content'
            : 'operations',
      priority: input.customerHealthProjection.customerHealth.healthLevel === 'CRITICAL' ? 'critical' : 'high',
    });
  }

  if (
    input.activationProjection
    && input.activationProjection.activationScore < input.activationProjection.activationThreshold
    && input.activationProjection.dropOffRisk.state !== 'ON_TRACK'
    && input.activationProjection.dropOffRisk.state !== 'ACTIVATED'
  ) {
    risks.push({
      code: `activation_${input.activationProjection.dropOffRisk.state.toLowerCase()}_${input.activationProjection.activationState.currentStep.toLowerCase()}`,
      title: input.activationProjection.localization.aiCooRiskTitle,
      reason: input.activationProjection.localization.aiCooRiskReason,
      domain: input.activationProjection.activationState.currentStep === 'FIRST_OUTCOME'
        || input.activationProjection.activationState.currentStep === 'ACTIVATED'
        ? 'traffic'
        : 'operations',
      priority: input.activationProjection.dropOffRisk.state === 'DROPPED_OFF'
        ? 'high'
        : input.activationProjection.activationRisk === 'critical'
        ? 'critical'
        : input.activationProjection.activationRisk === 'high'
          ? 'high'
          : 'medium',
    });
  }

  if (input.valueProjection && input.valueProjection.valueRisk !== 'low') {
    risks.push({
      code: `value_${input.valueProjection.currentValueStage}`,
      title: 'Value realization not proven',
      reason: `Value score is ${input.valueProjection.valueRealizationScore}. Next milestone: ${input.valueProjection.nextMilestone?.label ?? 'scale proven value'}.`,
      domain: input.valueProjection.nextMilestone?.id.includes('content')
        ? 'content'
        : input.valueProjection.nextMilestone?.id.includes('lead') || input.valueProjection.nextMilestone?.id.includes('prospect')
          ? 'traffic'
          : input.valueProjection.nextMilestone?.id.includes('customer') || input.valueProjection.nextMilestone?.id.includes('sale') || input.valueProjection.nextMilestone?.id.includes('client')
            ? 'sales'
            : 'operations',
      priority: input.valueProjection.valueRisk,
    });
  }

  if (
    input.userSuccessProjection
    && input.userSuccessProjection.successState.successLevel !== 'SUCCESSFUL'
    && (input.userSuccessProjection.successState.successLevel === 'AT_RISK'
      || input.userSuccessProjection.successState.successLevel === 'BLOCKED')
  ) {
    const blocker = input.userSuccessProjection.blockers[0];
    risks.push({
      code: `success_${input.userSuccessProjection.successState.successLevel.toLowerCase()}_${input.userSuccessProjection.successState.currentOutcome.toLowerCase()}`,
      title: blocker?.title ?? 'User success outcome stalled',
      reason: blocker?.reason ?? `${input.userSuccessProjection.currentOutcome.label} is not achieved yet.`,
      domain: input.userSuccessProjection.successState.currentOutcome === 'FIRST_CUSTOMER'
        || input.userSuccessProjection.successState.currentOutcome === 'FIRST_REVENUE'
        ? 'sales'
        : input.userSuccessProjection.successState.currentOutcome === 'TEAM_SCALING'
          ? 'team'
          : input.userSuccessProjection.successState.currentOutcome === 'AUTHORITY_BUILDING'
            ? 'content'
            : 'traffic',
      priority: input.userSuccessProjection.successState.successLevel === 'BLOCKED' ? 'high' : 'medium',
    });
  }

  if (input.expansionProjection?.expansionRisks[0]) {
    const risk = input.expansionProjection.expansionRisks[0];
    risks.push({
      code: risk.code,
      title: input.expansionProjection.expansionRecovery.title,
      reason: `${input.expansionProjection.expansionRecovery.reason} Scale readiness is ${input.expansionProjection.scaleReadiness.score}.`,
      domain: risk.lever === 'content_growth' || risk.lever === 'audience_growth'
        ? 'content'
        : risk.lever === 'lead_growth'
          ? 'traffic'
          : risk.lever === 'team_growth'
            ? 'team'
            : 'sales',
      priority: risk.priority,
    });
  }

  if (input.referralProjection?.referralRisks[0]) {
    const risk = input.referralProjection.referralRisks[0];
    risks.push({
      code: risk.code,
      title: risk.title,
      reason: `${risk.reason} Referral level is ${input.referralProjection.referralState.referralLevel}.`,
      domain: risk.code.includes('value')
        ? 'sales'
        : risk.code.includes('retention')
          ? 'operations'
          : 'crm',
      priority: risk.priority,
    });
  }

  if (input.retentionProjection?.retentionRecovery.needed || input.retentionProjection?.reEngagement.needed) {
    risks.push({
      code: `retention_${input.retentionProjection.outcomeRetention.retentionLevel.toLowerCase()}`,
      title: input.retentionProjection.retentionRecovery.title,
      reason: input.retentionProjection.retentionRecovery.reason,
      domain: 'operations',
      priority: input.retentionProjection.retentionRisk,
    });
  }

  if (input.missionAuthority.currentMission.status === 'blocked') {
    risks.push({
      code: 'mission_stalled',
      title: 'Mission stalled',
      reason: `${input.missionAuthority.currentMission.title} is blocked, so new priorities should wait.`,
      domain: 'operations',
      priority: 'critical',
    });
  }

  if (input.interviewAuthority.offerStatus === 'missing') {
    risks.push({
      code: 'offer_undefined',
      title: 'Offer undefined',
      reason: 'The business cannot convert attention until the primary offer is defined.',
      domain: 'sales',
      priority: 'high',
    });
  }

  if (input.interviewAuthority.contentReadiness < 35) {
    risks.push({
      code: 'no_content_published',
      title: 'No content momentum',
      reason: 'Content readiness is too low to support authority or traffic growth.',
      domain: 'content',
      priority: 'high',
    });
  }

  if (input.interviewAuthority.trafficReadiness < 35 || input.growthLoopState.acquisition.leadCount === 0) {
    risks.push({
      code: 'traffic_missing',
      title: 'Traffic missing',
      reason: 'There is not enough traffic or lead flow to validate the next growth step.',
      domain: 'traffic',
      priority: 'high',
    });
  }

  for (const bottleneck of input.businessState.bottlenecks) {
    risks.push({
      code: bottleneck.code,
      title: bottleneck.title,
      reason: bottleneck.description,
      domain: bottleneck.domain,
      priority: bottleneck.severity === 'high' ? 'high' : bottleneck.severity,
    });
  }

  for (const blockedArea of input.businessContext.blockedAreas) {
    risks.push({
      code: 'execution_bottleneck',
      title: blockedArea,
      reason: 'Business context memory shows this area is currently blocking progress.',
      domain: 'operations',
      priority: 'medium',
    });
  }

  if (input.growthProjection?.primaryBottleneck) {
    risks.push({
      code: `growth_${input.growthProjection.primaryBottleneck.stage}_bottleneck`,
      title: input.growthProjection.primaryBottleneck.title,
      reason: input.growthProjection.primaryBottleneck.reason,
      domain: input.growthProjection.primaryBottleneck.stage === 'content'
        ? 'content'
        : input.growthProjection.primaryBottleneck.stage === 'traffic'
          ? 'traffic'
          : input.growthProjection.primaryBottleneck.stage === 'conversion'
            ? 'funnel'
            : 'operations',
      priority: input.growthProjection.primaryBottleneck.severity,
    });
  }

  if (input.optimizationProjection?.topFailurePatterns[0]) {
    const failure = input.optimizationProjection.topFailurePatterns[0];
    risks.push({
      code: `optimization_${failure.area}_failure`,
      title: failure.title,
      reason: failure.reason,
      domain: failure.area === 'content'
        ? 'content'
        : failure.area === 'funnel'
          ? 'funnel'
          : 'operations',
      priority: Math.abs(failure.confidenceDelta) >= 10 ? 'high' : 'medium',
    });
  }

  return risks.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
}
