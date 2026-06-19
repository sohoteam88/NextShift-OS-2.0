import type { ExpansionProjection } from '../contracts/ExpansionProjection';
import type { ExpansionFacts } from './expansion-facts';
import { hasPositiveExpansion } from './expansion-facts';
import { calculateExpansionScore, expansionStageFor } from './expansion-score-engine';
import { detectExpansionOpportunities, detectExpansionRisks, nextMilestoneFor, selectCurrentGrowthLever } from './growth-lever-engine';
import { calculateScaleReadiness } from './scale-readiness-engine';

export function buildExpansionProjection(facts: ExpansionFacts): ExpansionProjection {
  const expansionScore = calculateExpansionScore(facts);
  const expansionStage = expansionStageFor(expansionScore, facts);
  const expansionOpportunities = detectExpansionOpportunities(facts);
  const expansionRisks = detectExpansionRisks(facts);
  const currentGrowthLever = selectCurrentGrowthLever(facts, expansionOpportunities);
  const scaleReadiness = calculateScaleReadiness(facts);

  return {
    source: 'ExpansionEngine',
    scope: 'user',
    confidence: hasPositiveExpansion(facts.metrics) ? 'derived' : 'fallback',
    fallback: hasPositiveExpansion(facts.metrics) ? 'none' : 'no_expansion_growth_detected',
    generatedAt: facts.generatedAt,
    businessMode: facts.businessMode,
    expansionScore,
    expansionStage,
    currentGrowthLever,
    scaleReadiness,
    expansionOpportunities,
    expansionRisks,
    nextGrowthMilestone: nextMilestoneFor(facts, currentGrowthLever.lever),
    metrics: facts.metrics,
    kpis: {
      leadGrowthRate: facts.metrics.leads.growthRate,
      revenueGrowthRate: facts.metrics.revenue.growthRate,
      customerGrowthRate: facts.metrics.customers.growthRate,
      teamGrowthRate: facts.metrics.team.growthRate,
      expansionSuccessRate: expansionScore,
    },
  };
}
