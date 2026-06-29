import type {
  BusinessBrainSnapshot,
  BusinessInsight,
  Opportunity,
  Risk,
} from "./business-brain";
import {
  OpportunityDetectionResult,
  createDetectedOpportunity,
  type DetectedOpportunity,
  type DetectedOpportunityId,
} from "./opportunity-detection";

export interface OpportunityDetector {
  detect(snapshot: BusinessBrainSnapshot): OpportunityDetectionResult;
}

export class DefaultOpportunityDetector implements OpportunityDetector {
  detect(snapshot: BusinessBrainSnapshot): OpportunityDetectionResult {
    const detectedAt = snapshot.updatedAt;

    if (hasNoSignals(snapshot)) {
      return OpportunityDetectionResult.create({
        opportunities: [],
        detectedAt,
        summary:
          "No opportunity signals are available in the current Business Brain snapshot.",
      });
    }

    const opportunities: DetectedOpportunity[] = [
      ...snapshot.opportunities.map((opportunity) =>
        createExistingOpportunityDetection(opportunity, detectedAt)
      ),
    ];

    if (snapshot.insights.length > 0 && snapshot.opportunities.length === 0) {
      opportunities.push(
        createInsightOpportunityDetection(
          snapshot.insights[snapshot.insights.length - 1],
          detectedAt
        )
      );
    }

    if (snapshot.risks.length > snapshot.opportunities.length) {
      opportunities.push(
        createRiskMitigationOpportunityDetection(
          snapshot.risks[snapshot.risks.length - 1],
          detectedAt
        )
      );
    }

    return OpportunityDetectionResult.create({
      opportunities,
      detectedAt,
      summary: createDetectionSummary(opportunities.length),
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

function createExistingOpportunityDetection(
  opportunity: Opportunity,
  detectedAt: string
): DetectedOpportunity {
  return createDetectedOpportunity({
    id: createDetectedOpportunityId("manual", opportunity.id),
    title: opportunity.title,
    summary: opportunity.summary,
    confidence: 0.8,
    source: {
      type: "manual",
      referenceId: opportunity.id,
      summary: "Existing Business Brain opportunity.",
    },
    detectedAt,
  });
}

function createInsightOpportunityDetection(
  insight: BusinessInsight,
  detectedAt: string
): DetectedOpportunity {
  return createDetectedOpportunity({
    id: createDetectedOpportunityId("insight", insight.id),
    title: `Act on insight: ${insight.title}`,
    summary: insight.summary,
    confidence: 0.65,
    source: {
      type: "insight",
      referenceId: insight.id,
      summary: insight.summary,
    },
    detectedAt,
  });
}

function createRiskMitigationOpportunityDetection(
  risk: Risk,
  detectedAt: string
): DetectedOpportunity {
  return createDetectedOpportunity({
    id: createDetectedOpportunityId("risk", risk.id),
    title: `Mitigate risk: ${risk.title}`,
    summary: risk.summary,
    confidence: 0.7,
    source: {
      type: "risk",
      referenceId: risk.id,
      summary: risk.summary,
    },
    detectedAt,
  });
}

function createDetectedOpportunityId(
  sourceType: string,
  referenceId: string
): DetectedOpportunityId {
  return `detected-opportunity:${sourceType}:${referenceId}` as DetectedOpportunityId;
}

function createDetectionSummary(opportunityCount: number): string {
  if (opportunityCount === 1) {
    return "1 opportunity detected from current Business Brain signals.";
  }

  return `${opportunityCount} opportunities detected from current Business Brain signals.`;
}
