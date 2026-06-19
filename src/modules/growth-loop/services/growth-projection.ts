import type { GrowthLoopState } from '../contracts/GrowthLoopState';
import type { GrowthAction, GrowthProjection } from '../contracts/GrowthProjection';
import { detectGrowthBottlenecks, currentGrowthStageFromBottleneck } from './growth-bottleneck-detector';
import { detectGrowthOpportunities } from './growth-opportunity-engine';
import { calculateGrowthScore } from './growth-score-engine';

function actionFor(input: {
  bottleneck: GrowthProjection['primaryBottleneck'];
  opportunity: GrowthProjection['primaryOpportunity'];
}): GrowthAction {
  if (input.bottleneck) {
    switch (input.bottleneck.stage) {
      case 'content':
        return {
          title: 'Publish the first growth content asset',
          reason: 'Content is the first missing step in the growth loop.',
          route: '/content-engine',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase content_count and reach.',
        };
      case 'traffic':
        return {
          title: 'Drive traffic to the primary funnel',
          reason: 'Traffic must exist before lead generation can be measured.',
          route: '/journey',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase funnel_views.',
        };
      case 'lead':
        return {
          title: 'Create or improve the lead magnet',
          reason: 'Lead capture is the current blocked step.',
          route: '/lead-magnet',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase lead_count.',
        };
      case 'conversation':
        return {
          title: 'Start lead follow-up conversations',
          reason: 'Leads need active conversations to move toward conversion.',
          route: '/customers',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase recent_activity_count.',
        };
      case 'conversion':
        return {
          title: 'Improve the conversion path',
          reason: 'Traffic or leads exist, but conversion is not visible yet.',
          route: '/funnel-builder',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase funnel_conversions and customer_count.',
        };
      case 'retention':
        return {
          title: 'Repair customer retention motion',
          reason: 'Retention health is below target.',
          route: '/customers',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase retention score.',
        };
      case 'referral':
        return {
          title: 'Start referral activation',
          reason: 'Growth foundation is ready for referral motion.',
          route: '/team/growth',
          owner: 'growth-loop',
          expectedMetricLift: 'Increase referral_lead_count.',
        };
    }
  }

  if (input.opportunity) {
    return {
      title: input.opportunity.title,
      reason: input.opportunity.reason,
      route: input.opportunity.stage === 'conversation' ? '/customers' : '/content-engine',
      owner: 'growth-loop',
      expectedMetricLift: `Increase ${input.opportunity.metric ?? input.opportunity.stage}.`,
    };
  }

  return {
    title: 'Review growth loop performance',
    reason: 'No severe bottleneck or high-confidence opportunity is currently visible.',
    route: '/dashboard',
    owner: 'growth-loop',
    expectedMetricLift: 'Maintain growth score.',
  };
}

export function buildGrowthProjection(state: GrowthLoopState): GrowthProjection {
  const growthScore = calculateGrowthScore(state);
  const bottlenecks = detectGrowthBottlenecks(state);
  const opportunities = detectGrowthOpportunities(state);
  const primaryBottleneck = bottlenecks[0] ?? null;
  const primaryOpportunity = opportunities[0] ?? null;

  return {
    source: 'GrowthLoopEngine',
    scope: 'user',
    confidence: state.confidence === 'confirmed' ? 'confirmed' : state.confidence === 'fallback' ? 'fallback' : 'derived',
    fallback: state.fallback,
    generatedAt: state.generatedAt,
    currentGrowthStage: currentGrowthStageFromBottleneck(primaryBottleneck),
    growthScore,
    primaryBottleneck,
    primaryOpportunity,
    recommendedGrowthAction: actionFor({ bottleneck: primaryBottleneck, opportunity: primaryOpportunity }),
  };
}
