import type { GrowthLoopState } from '../contracts/GrowthLoopState';
import type { GrowthBottleneck, GrowthStage } from '../contracts/GrowthProjection';

function metricValue(state: GrowthLoopState, key: string): number {
  const metric = state.signals.flatMap((signal) => signal.metrics).find((item) => item.key === key);
  return metric?.value ?? 0;
}

function severityFor(score: number): GrowthBottleneck['severity'] {
  if (score < 20) return 'critical';
  if (score < 45) return 'high';
  if (score < 70) return 'medium';
  return 'low';
}

export function detectGrowthBottlenecks(state: GrowthLoopState): GrowthBottleneck[] {
  const contentCount = metricValue(state, 'content_count');
  const funnelViews = metricValue(state, 'funnel_views');
  const leadCount = metricValue(state, 'lead_count');
  const funnelConversions = metricValue(state, 'funnel_conversions');
  const customerCount = metricValue(state, 'customer_count');
  const recentActivityCount = metricValue(state, 'recent_activity_count');
  const referralLeads = metricValue(state, 'referral_lead_count');
  const candidates: Array<GrowthBottleneck & { score: number }> = [];

  if (contentCount === 0) {
    candidates.push({
      stage: 'content',
      title: 'Content bottleneck',
      reason: 'No content assets exist, so traffic and authority cannot compound.',
      severity: 'critical',
      metric: 'content_count',
      score: 0,
    });
  }

  if (funnelViews === 0) {
    candidates.push({
      stage: 'traffic',
      title: 'Traffic bottleneck',
      reason: 'No funnel views are present, so lead capture cannot be validated.',
      severity: severityFor(state.acquisition.score),
      metric: 'funnel_views',
      score: state.acquisition.score,
    });
  }

  if (leadCount === 0) {
    candidates.push({
      stage: 'lead',
      title: 'Lead bottleneck',
      reason: 'No leads have been captured yet.',
      severity: severityFor(state.acquisition.score),
      metric: 'lead_count',
      score: state.acquisition.score,
    });
  }

  if (leadCount > 0 && recentActivityCount === 0) {
    candidates.push({
      stage: 'conversation',
      title: 'Conversation bottleneck',
      reason: 'Leads exist, but there is no recent activity or follow-up signal.',
      severity: 'high',
      metric: 'recent_activity_count',
      score: state.retention.score,
    });
  }

  if (leadCount > 0 && customerCount === 0 && funnelConversions === 0) {
    candidates.push({
      stage: 'conversion',
      title: 'Conversion bottleneck',
      reason: 'Lead or traffic signals exist, but no conversion/customer signal is visible.',
      severity: 'high',
      metric: 'customer_count',
      score: state.retention.score,
    });
  }

  if (customerCount > 0 && state.retention.score < 60) {
    candidates.push({
      stage: 'retention',
      title: 'Retention bottleneck',
      reason: 'Customers exist, but retention health is below target.',
      severity: severityFor(state.retention.score),
      metric: 'retention_score',
      score: state.retention.score,
    });
  }

  if (state.overallScore >= 50 && referralLeads === 0) {
    candidates.push({
      stage: 'referral',
      title: 'Referral bottleneck',
      reason: 'Growth foundation exists, but referral activity has not started.',
      severity: severityFor(state.referral.score),
      metric: 'referral_lead_count',
      score: state.referral.score,
    });
  }

  return candidates.sort((a, b) => a.score - b.score).map(({ score, ...bottleneck }) => bottleneck);
}

export function currentGrowthStageFromBottleneck(bottleneck: GrowthBottleneck | null): GrowthStage {
  return bottleneck?.stage ?? 'referral';
}
