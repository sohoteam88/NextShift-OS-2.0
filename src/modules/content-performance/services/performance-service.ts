// Content Performance Service — KPIs + performance scoring

import type { ContentPerformance, ContentKPIs } from '../types/performance.types';
import { scoreContent } from '@/modules/content-engine/services/content-scoring-service';

export function calculatePerformanceScore(kpis: Partial<ContentKPIs>): number {
  const reach = Math.min(100, ((kpis.views ?? 0) + (kpis.impressions ?? 0)) / 100);
  const engagement = Math.min(100, ((kpis.likes ?? 0) * 2 + (kpis.comments ?? 0) * 3 + (kpis.shares ?? 0) * 5 + (kpis.saves ?? 0) * 4) / 2);
  const leadGen = Math.min(100, ((kpis.leads ?? 0) * 10 + (kpis.appointments ?? 0) * 20 + (kpis.revenue ?? 0) * 0.5));
  return Math.round((reach * 0.2 + engagement * 0.4 + leadGen * 0.4));
}

export function comparePredictedVsActual(predictedScore: number, actualKPIs: Partial<ContentKPIs>): { actualScore: number; gap: number; insight: string } {
  const actualScore = calculatePerformanceScore(actualKPIs);
  const gap = predictedScore - actualScore;
  let insight = 'Performance matches prediction.';
  if (gap > 20) insight = 'Underperformed prediction. Review hook and CTA strength.';
  else if (gap < -10) insight = 'Exceeded expectations! This content type works well for your audience.';
  return { actualScore, gap, insight };
}

export function getBestContent(items: ContentPerformance[], limit = 5): ContentPerformance[] {
  return [...items].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, limit);
}

export function getWorstContent(items: ContentPerformance[], limit = 5): ContentPerformance[] {
  return [...items].sort((a, b) => a.performanceScore - b.performanceScore).slice(0, limit);
}
