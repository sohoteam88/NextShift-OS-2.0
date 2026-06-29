import type { BusinessBrainSnapshot } from "./business-brain";
import {
  BusinessHealth,
  clampBusinessHealthScore,
  type BusinessHealthDimension,
} from "./business-health";

export interface BusinessHealthEvaluator {
  evaluate(snapshot: BusinessBrainSnapshot): BusinessHealth;
}

export class DefaultBusinessHealthEvaluator
  implements BusinessHealthEvaluator
{
  evaluate(snapshot: BusinessBrainSnapshot): BusinessHealth {
    const dimensions = createBaselineDimensions(snapshot);
    const score = clampBusinessHealthScore(
      50 +
        snapshot.observations.length * 5 +
        snapshot.insights.length * 8 +
        snapshot.opportunities.length * 7 -
        snapshot.risks.length * 10
    );

    return BusinessHealth.create({
      score,
      dimensions,
      summary: createHealthSummary(score),
      evaluatedAt: snapshot.updatedAt,
    });
  }
}

function createBaselineDimensions(
  snapshot: BusinessBrainSnapshot
): readonly BusinessHealthDimension[] {
  return Object.freeze([
    Object.freeze({
      name: "operations",
      score: clampBusinessHealthScore(50 + snapshot.observations.length * 10),
      summary: `${snapshot.observations.length} observation signal(s) available.`,
    }),
    Object.freeze({
      name: "customer",
      score: clampBusinessHealthScore(50 + snapshot.insights.length * 12),
      summary: `${snapshot.insights.length} insight signal(s) registered.`,
    }),
    Object.freeze({
      name: "revenue",
      score: clampBusinessHealthScore(50 + snapshot.opportunities.length * 12),
      summary: `${snapshot.opportunities.length} opportunity signal(s) registered.`,
    }),
    Object.freeze({
      name: "risk",
      score: clampBusinessHealthScore(100 - snapshot.risks.length * 20),
      summary: `${snapshot.risks.length} risk signal(s) registered.`,
    }),
  ]);
}

function createHealthSummary(score: number): string {
  if (score < 20) {
    return "Business health is critical based on current Business Brain signals.";
  }

  if (score < 40) {
    return "Business health is weak based on current Business Brain signals.";
  }

  if (score < 60) {
    return "Business health is stable based on current Business Brain signals.";
  }

  if (score < 80) {
    return "Business health is strong based on current Business Brain signals.";
  }

  return "Business health is excellent based on current Business Brain signals.";
}
