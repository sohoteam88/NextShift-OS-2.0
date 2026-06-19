import type { AnalyticsDashboardData } from '@/modules/analytics/types';
import type { GrowthSignalMetric } from '../contracts/GrowthSignal';
import type { GrowthLoopState } from '../contracts/GrowthLoopState';

function metricValue(metrics: GrowthSignalMetric[], key: string): number | undefined {
  return metrics.find((metric) => metric.key === key)?.value;
}

function percentValue(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(value, 100));
}

export function toMemberAnalyticsViewModel(
  growthLoopState: GrowthLoopState,
  fallback: AnalyticsDashboardData,
): AnalyticsDashboardData {
  const acquisitionMetrics = growthLoopState.acquisition.metrics;
  const retentionMetrics = growthLoopState.retention.metrics;
  const expansionMetrics = growthLoopState.expansion.metrics;

  const totalLeads = metricValue(acquisitionMetrics, 'lead_count') ?? fallback.summary.totalLeads;
  const contentCount = metricValue(acquisitionMetrics, 'content_count') ?? fallback.summary.contentCount;
  const funnelViews = metricValue(acquisitionMetrics, 'funnel_views') ?? fallback.summary.funnelViews;
  const funnelConversions = metricValue(acquisitionMetrics, 'funnel_conversions') ?? fallback.summary.funnelConversions;
  const aiUsageCount = metricValue(expansionMetrics, 'ai_usage_count') ?? fallback.summary.aiUsageCount;
  const memberRetentionRate = percentValue(
    growthLoopState.retention.retentionRate ?? metricValue(retentionMetrics, 'retention_rate'),
    fallback.summary.memberRetentionRate,
  );

  return {
    ...fallback,
    summary: {
      ...fallback.summary,
      totalLeads,
      contentCount,
      funnelViews,
      funnelConversions,
      aiUsageCount,
      conversionRate: percentValue(growthLoopState.acquisition.conversionRate, fallback.summary.conversionRate),
      memberRetentionRate,
    },
  };
}
