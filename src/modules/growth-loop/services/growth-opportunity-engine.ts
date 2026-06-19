import type { GrowthLoopState } from '../contracts/GrowthLoopState';
import type { GrowthOpportunity } from '../contracts/GrowthProjection';

function impactFor(score: number): GrowthOpportunity['impact'] {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

export function detectGrowthOpportunities(state: GrowthLoopState): GrowthOpportunity[] {
  const opportunities: GrowthOpportunity[] = [];

  if (state.activation.score >= 60) {
    opportunities.push({
      stage: 'content',
      title: 'Activation momentum',
      reason: 'Activation progress is strong enough to turn setup into visible content output.',
      impact: impactFor(state.activation.score),
      metric: 'activation_progress',
    });
  }

  if (state.acquisition.leadCount > 0) {
    opportunities.push({
      stage: 'conversation',
      title: 'Lead follow-up opportunity',
      reason: 'Captured leads create an opportunity to improve conversations and conversion.',
      impact: 'high',
      metric: 'lead_count',
    });
  }

  if ((state.acquisition.conversionRate ?? 0) > 0) {
    opportunities.push({
      stage: 'conversion',
      title: 'Conversion signal detected',
      reason: 'Funnel conversion exists, so conversion optimization can compound results.',
      impact: impactFor(state.acquisition.score),
      metric: 'conversion_rate',
    });
  }

  if (state.retention.score >= 60) {
    opportunities.push({
      stage: 'referral',
      title: 'Retention base ready for referral',
      reason: 'Retention signals are healthy enough to start referral motion.',
      impact: impactFor(state.retention.score),
      metric: 'retention_score',
    });
  }

  return opportunities.sort((a, b) => {
    const rank = { high: 3, medium: 2, low: 1 };
    return rank[b.impact] - rank[a.impact];
  });
}
