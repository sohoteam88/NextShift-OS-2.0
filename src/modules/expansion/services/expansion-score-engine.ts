import type { ExpansionMetrics, ExpansionStage } from '../contracts/ExpansionProjection';
import type { ExpansionFacts } from './expansion-facts';
import { hasPositiveExpansion } from './expansion-facts';

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function positiveRateScore(metrics: ExpansionMetrics) {
  const rates = Object.values(metrics).map((metric) => metric.growthRate);
  const positiveRates = rates.filter((rate) => rate > 0);
  if (positiveRates.length === 0) return 0;

  const average = positiveRates.reduce((sum, rate) => sum + Math.min(rate, 100), 0) / positiveRates.length;
  return Math.min(30, average * 0.3);
}

function repeatabilityScore(metrics: ExpansionMetrics) {
  const activeSignals = Object.values(metrics).filter((metric) => metric.current > 0 && metric.previous > 0).length;
  return Math.min(25, activeSignals * 5);
}

export function calculateExpansionScore(facts: ExpansionFacts) {
  const valueBase = Math.min(35, facts.valueProjection.valueRealizationScore * 0.35);
  const retentionBase = Math.min(20, facts.retentionProjection.retentionScore * 0.2);
  const growthBase = positiveRateScore(facts.metrics);
  const repeatableBase = repeatabilityScore(facts.metrics);

  return clamp(valueBase + retentionBase + growthBase + repeatableBase);
}

export function expansionStageFor(score: number, facts: ExpansionFacts): ExpansionStage {
  if (score >= 85) return 'optimizing';
  if (score >= 70 || facts.metrics.revenue.current >= 1000 || facts.metrics.team.current >= 3) return 'scaling';
  if (score >= 55 || facts.metrics.customers.current >= 2 || facts.metrics.audience.current >= 1000) return 'growing';
  if (score >= 35 || hasPositiveExpansion(facts.metrics)) return 'repeatable';
  return 'first_win';
}
