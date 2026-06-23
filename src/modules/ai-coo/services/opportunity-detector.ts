import type { BusinessState } from '@/modules/business-state/contracts/BusinessState';
import type { GrowthLoopState } from '@/modules/growth-loop/contracts/GrowthLoopState';
import type { InterviewAuthorityProjection } from '@/modules/interview-authority/contracts/InterviewAuthorityProjection';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { BusinessContextProjection } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import type { GrowthProjection } from '@/modules/growth-loop/contracts/GrowthProjection';
import type { OptimizationProjection } from '@/modules/optimization/contracts/OptimizationProjection';
import type { ExpansionProjection } from '@/modules/expansion/contracts/ExpansionProjection';
import type { ReferralProjection } from '@/modules/referral/contracts/ReferralProjection';
import type { AICOODecisionSignal } from '../contracts/AICOODecision';

function priorityRank(priority: AICOODecisionSignal['priority']) {
  return { critical: 4, high: 3, medium: 2, low: 1 }[priority];
}

export function detectOpportunities(input: {
  businessState: BusinessState;
  missionAuthority: MissionAuthoritySnapshot;
  businessContext: BusinessContextProjection;
  interviewAuthority: InterviewAuthorityProjection;
  growthLoopState: GrowthLoopState;
  growthProjection?: GrowthProjection;
  optimizationProjection?: OptimizationProjection;
  expansionProjection?: ExpansionProjection;
  referralProjection?: ReferralProjection;
}): AICOODecisionSignal[] {
  const opportunities: AICOODecisionSignal[] = [];

  if (input.businessState.readiness.percentage >= 75) {
    opportunities.push({
      code: 'high_readiness',
      title: 'High business readiness',
      reason: 'The business state is ready enough to move from setup into execution.',
      domain: 'operations',
      priority: 'high',
    });
  }

  if (input.interviewAuthority.authorityScore >= 75) {
    opportunities.push({
      code: 'high_authority_score',
      title: 'Authority signal is strong',
      reason: 'The user has enough authority signal to turn positioning into audience-facing action.',
      domain: 'brand',
      priority: 'high',
    });
  }

  if (input.interviewAuthority.audienceStatus === 'defined' && input.interviewAuthority.contentReadiness >= 60) {
    opportunities.push({
      code: 'audience_ready',
      title: 'Audience and content are ready',
      reason: 'Audience clarity and content readiness are strong enough to generate demand.',
      domain: 'content',
      priority: 'medium',
    });
  }

  if (input.interviewAuthority.trafficReadiness >= 60 || input.growthLoopState.acquisition.leadCount > 0) {
    opportunities.push({
      code: 'traffic_ready',
      title: 'Traffic path is ready',
      reason: 'There is enough traffic readiness to move into lead capture or conversion.',
      domain: 'traffic',
      priority: 'medium',
    });
  }

  if (input.businessContext.completedMilestones.length > 0) {
    opportunities.push({
      code: 'recent_milestone_completed',
      title: 'Recent milestone completed',
      reason: `Recent progress creates momentum: ${input.businessContext.completedMilestones[0]}.`,
      domain: 'operations',
      priority: 'medium',
    });
  }

  for (const opportunity of input.businessState.opportunities) {
    opportunities.push({
      code: opportunity.code,
      title: opportunity.title,
      reason: opportunity.description,
      domain: opportunity.domain,
      priority: opportunity.impact === 'high' ? 'high' : opportunity.impact,
    });
  }

  if (input.missionAuthority.progress.completionPercentage >= 50) {
    opportunities.push({
      code: 'journey_momentum',
      title: 'Journey momentum',
      reason: 'Mission progress is past the halfway point, so the next action can create compounding value.',
      domain: 'operations',
      priority: 'medium',
    });
  }

  if (input.growthProjection?.primaryOpportunity) {
    opportunities.push({
      code: `growth_${input.growthProjection.primaryOpportunity.stage}_opportunity`,
      title: input.growthProjection.primaryOpportunity.title,
      reason: input.growthProjection.primaryOpportunity.reason,
      domain: input.growthProjection.primaryOpportunity.stage === 'content'
        ? 'content'
        : input.growthProjection.primaryOpportunity.stage === 'traffic'
          ? 'traffic'
          : input.growthProjection.primaryOpportunity.stage === 'conversion'
            ? 'funnel'
            : 'operations',
      priority: input.growthProjection.primaryOpportunity.impact === 'high'
        ? 'high'
        : input.growthProjection.primaryOpportunity.impact,
    });
  }

  if (input.optimizationProjection?.topWinningPatterns[0]) {
    const win = input.optimizationProjection.topWinningPatterns[0];
    opportunities.push({
      code: `optimization_${win.area}_win`,
      title: win.title,
      reason: win.reason,
      domain: win.area === 'content'
        ? 'content'
        : win.area === 'funnel'
          ? 'funnel'
          : 'operations',
      priority: win.confidenceDelta >= 10 ? 'high' : 'medium',
    });
  }

  if (input.expansionProjection?.expansionOpportunity && input.expansionProjection.scaleReadiness.status !== 'not_ready') {
    const opportunity = input.expansionProjection.expansionOpportunity;
    opportunities.push({
      code: `expansion_${opportunity.lever}`,
      title: opportunity.title,
      reason: `${opportunity.reason} Scale readiness is ${input.expansionProjection.scaleReadiness.score}.`,
      domain: opportunity.lever === 'content_growth' || opportunity.lever === 'audience_growth'
        ? 'content'
        : opportunity.lever === 'lead_growth'
          ? 'traffic'
          : opportunity.lever === 'team_growth'
            ? 'team'
            : 'sales',
      priority: opportunity.priority,
    });
  }

  if (input.referralProjection?.referralRecommendation && ['ready', 'advocate', 'ambassador', 'champion'].includes(input.referralProjection.referralReadiness)) {
    const opportunity = input.referralProjection.referralRecommendation;
    opportunities.push({
      code: `referral_${opportunity.type}`,
      title: opportunity.title,
      reason: `${opportunity.reason} Referral score is ${input.referralProjection.referralScore}.`,
      domain: opportunity.route.includes('content')
        ? 'content'
        : opportunity.route.includes('team')
          ? 'team'
          : 'crm',
      priority: opportunity.priority,
    });
  }

  return opportunities.sort((a, b) => priorityRank(b.priority) - priorityRank(a.priority));
}
