import type {
  BusinessBrainSnapshot,
  BusinessInsight,
  Observation,
  Opportunity,
  Risk,
} from "./business-brain";
import {
  InsightGenerationResult,
  createGeneratedBusinessInsight,
  type GeneratedBusinessInsight,
  type GeneratedBusinessInsightId,
} from "./business-insight";

export interface BusinessInsightGenerator {
  generate(snapshot: BusinessBrainSnapshot): InsightGenerationResult;
}

export class DefaultBusinessInsightGenerator
  implements BusinessInsightGenerator
{
  generate(snapshot: BusinessBrainSnapshot): InsightGenerationResult {
    const generatedAt = snapshot.updatedAt;

    if (hasNoSignals(snapshot)) {
      return InsightGenerationResult.create({
        insights: [],
        generatedAt,
        summary:
          "No business insight signals are available in the current Business Brain snapshot.",
      });
    }

    const insights: GeneratedBusinessInsight[] = [];

    if (snapshot.opportunities.length > 0) {
      insights.push(
        createGrowthInsight(
          snapshot.opportunities[snapshot.opportunities.length - 1],
          generatedAt
        )
      );
    }

    if (snapshot.risks.length > 0) {
      insights.push(
        createRiskInsight(snapshot.risks[snapshot.risks.length - 1], generatedAt)
      );
    }

    if (snapshot.observations.length >= 3) {
      insights.push(
        createOperationsInsight(
          snapshot.observations[snapshot.observations.length - 1],
          snapshot.observations.length,
          generatedAt
        )
      );
    }

    if (snapshot.insights.length > 0) {
      insights.push(
        createCustomerInsight(
          snapshot.insights[snapshot.insights.length - 1],
          generatedAt
        )
      );
    }

    return InsightGenerationResult.create({
      insights,
      generatedAt,
      summary: createGenerationSummary(insights.length),
    });
  }
}

function hasNoSignals(snapshot: BusinessBrainSnapshot): boolean {
  return (
    snapshot.observations.length === 0 &&
    snapshot.insights.length === 0 &&
    snapshot.opportunities.length === 0 &&
    snapshot.risks.length === 0
  );
}

function createGrowthInsight(
  opportunity: Opportunity,
  generatedAt: string
): GeneratedBusinessInsight {
  return createGeneratedBusinessInsight({
    id: createGeneratedBusinessInsightId("growth", opportunity.id),
    title: `Growth opportunity: ${opportunity.title}`,
    summary: opportunity.summary,
    category: "growth",
    confidence: 0.8,
    generatedAt,
  });
}

function createRiskInsight(
  risk: Risk,
  generatedAt: string
): GeneratedBusinessInsight {
  return createGeneratedBusinessInsight({
    id: createGeneratedBusinessInsightId("risk", risk.id),
    title: `Risk signal: ${risk.title}`,
    summary: risk.summary,
    category: "risk",
    confidence: 0.75,
    generatedAt,
  });
}

function createOperationsInsight(
  observation: Observation,
  observationCount: number,
  generatedAt: string
): GeneratedBusinessInsight {
  return createGeneratedBusinessInsight({
    id: createGeneratedBusinessInsightId("operations", observation.id),
    title: "Operations signal volume increased",
    summary: `${observationCount} observations are available. Latest signal: ${observation.summary}`,
    category: "operations",
    confidence: 0.65,
    generatedAt,
  });
}

function createCustomerInsight(
  insight: BusinessInsight,
  generatedAt: string
): GeneratedBusinessInsight {
  return createGeneratedBusinessInsight({
    id: createGeneratedBusinessInsightId("customer", insight.id),
    title: `Customer insight: ${insight.title}`,
    summary: insight.summary,
    category: "customer",
    confidence: 0.7,
    generatedAt,
  });
}

function createGeneratedBusinessInsightId(
  category: string,
  referenceId: string
): GeneratedBusinessInsightId {
  return `generated-insight:${category}:${referenceId}` as GeneratedBusinessInsightId;
}

function createGenerationSummary(insightCount: number): string {
  if (insightCount === 0) {
    return "No business insights were generated from the current Business Brain signals.";
  }

  if (insightCount === 1) {
    return "1 business insight generated from current Business Brain signals.";
  }

  return `${insightCount} business insights generated from current Business Brain signals.`;
}
