import type { Brand, Timestamp } from "@nextshift/shared";
import {
  createConfidenceValue,
  createEffortValue,
  createImpactValue,
  createUrgencyValue,
  type ConfidenceValue,
  type DecisionContextId,
  type EffortValue,
  type ImpactValue,
  type UrgencyValue,
} from "../context";

export type RecommendationId = Brand<string, "RecommendationId">;

export type RecommendationType =
  | "Growth"
  | "Efficiency"
  | "Retention"
  | "Revenue"
  | "Marketing"
  | "Operations"
  | "Custom";

export interface RecommendationSnapshot {
  readonly recommendationId: RecommendationId;
  readonly decisionContextId: DecisionContextId;
  readonly recommendationType: RecommendationType;
  readonly title: string;
  readonly summary: string;
  readonly rationale: string;
  readonly confidence: ConfidenceValue;
  readonly impact: ImpactValue;
  readonly urgency: UrgencyValue;
  readonly effort: EffortValue;
  readonly createdAt: Timestamp;
}

export interface CreateRecommendationInput {
  readonly recommendationId: RecommendationId;
  readonly decisionContextId: DecisionContextId;
  readonly recommendationType: RecommendationType;
  readonly title: string;
  readonly summary: string;
  readonly rationale: string;
  readonly confidence: number;
  readonly impact: number;
  readonly urgency: number;
  readonly effort: number;
  readonly createdAt: Timestamp;
}

const RECOMMENDATION_TYPES: readonly RecommendationType[] = Object.freeze([
  "Growth",
  "Efficiency",
  "Retention",
  "Revenue",
  "Marketing",
  "Operations",
  "Custom",
]);

export class Recommendation {
  private constructor(private readonly snapshot: RecommendationSnapshot) {}

  static create(input: CreateRecommendationInput): Recommendation {
    assertRecommendationType(input.recommendationType);

    return new Recommendation(
      freezeDeep({
        recommendationId: createRequiredId(
          input.recommendationId,
          "Recommendation ID is required."
        ) as RecommendationId,
        decisionContextId: createRequiredId(
          input.decisionContextId,
          "Recommendation decision context ID is required."
        ) as DecisionContextId,
        recommendationType: input.recommendationType,
        title: createRequiredText(input.title, "Recommendation title is required."),
        summary: createRequiredText(
          input.summary,
          "Recommendation summary is required."
        ),
        rationale: createRequiredText(
          input.rationale,
          "Recommendation rationale is required."
        ),
        confidence: createConfidenceValue(input.confidence),
        impact: createImpactValue(input.impact),
        urgency: createUrgencyValue(input.urgency),
        effort: createEffortValue(input.effort),
        createdAt: createRecommendationTimestamp(
          input.createdAt,
          "Recommendation createdAt must be a valid timestamp."
        ),
      })
    );
  }

  get recommendationId(): RecommendationId {
    return this.snapshot.recommendationId;
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  toSnapshot(): RecommendationSnapshot {
    return freezeDeep({ ...this.snapshot });
  }
}

function createRequiredId(value: string, message: string): string {
  if (value.trim().length === 0) {
    throw new Error(message);
  }

  return value;
}

function createRequiredText(value: string, message: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(message);
  }

  return normalized;
}

function createRecommendationTimestamp(value: Timestamp, message: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function assertRecommendationType(value: RecommendationType): void {
  if (!RECOMMENDATION_TYPES.includes(value)) {
    throw new Error(`Unsupported recommendation type: ${value}.`);
  }
}

function freezeDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    for (const item of value) {
      freezeDeep(item);
    }

    return Object.freeze(value) as T;
  }

  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      freezeDeep(child);
    }

    return Object.freeze(value) as T;
  }

  return value;
}
