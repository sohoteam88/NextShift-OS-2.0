import type { Brand, Timestamp } from "@nextshift/shared";
import {
  createConfidenceValue,
  createImpactValue,
  type ConfidenceValue,
  type DecisionContextId,
  type ImpactValue,
} from "../context";

export type PrioritizedDecisionId = Brand<string, "PrioritizedDecisionId">;
export type PriorityScoreValue = ImpactValue;

export type PrioritizedDecisionSourceType =
  | "Recommendation"
  | "Opportunity"
  | "Risk"
  | "Custom";

export interface PrioritizedDecisionSnapshot {
  readonly prioritizedDecisionId: PrioritizedDecisionId;
  readonly decisionContextId: DecisionContextId;
  readonly sourceType: PrioritizedDecisionSourceType;
  readonly sourceId: string;
  readonly priorityScore: PriorityScoreValue;
  readonly confidence: ConfidenceValue;
  readonly rationale: string;
  readonly rank: number;
  readonly createdAt: Timestamp;
}

export interface CreatePrioritizedDecisionInput {
  readonly prioritizedDecisionId: PrioritizedDecisionId;
  readonly decisionContextId: DecisionContextId;
  readonly sourceType: PrioritizedDecisionSourceType;
  readonly sourceId: string;
  readonly priorityScore: number;
  readonly confidence: number;
  readonly rationale: string;
  readonly rank: number;
  readonly createdAt: Timestamp;
}

const PRIORITIZED_DECISION_SOURCE_TYPES: readonly PrioritizedDecisionSourceType[] =
  Object.freeze(["Recommendation", "Opportunity", "Risk", "Custom"]);

export class PrioritizedDecision {
  private constructor(private readonly snapshot: PrioritizedDecisionSnapshot) {}

  static create(input: CreatePrioritizedDecisionInput): PrioritizedDecision {
    assertSourceType(input.sourceType);

    return new PrioritizedDecision(
      freezeDeep({
        prioritizedDecisionId: createRequiredId(
          input.prioritizedDecisionId,
          "Prioritized decision ID is required."
        ) as PrioritizedDecisionId,
        decisionContextId: createRequiredId(
          input.decisionContextId,
          "Prioritized decision context ID is required."
        ) as DecisionContextId,
        sourceType: input.sourceType,
        sourceId: createRequiredId(
          input.sourceId,
          "Prioritized decision source ID is required."
        ),
        priorityScore: createImpactValue(input.priorityScore),
        confidence: createConfidenceValue(input.confidence),
        rationale: createRequiredText(
          input.rationale,
          "Prioritized decision rationale is required."
        ),
        rank: createRank(input.rank),
        createdAt: createPrioritizedDecisionTimestamp(
          input.createdAt,
          "Prioritized decision createdAt must be a valid timestamp."
        ),
      })
    );
  }

  get prioritizedDecisionId(): PrioritizedDecisionId {
    return this.snapshot.prioritizedDecisionId;
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  get rank(): number {
    return this.snapshot.rank;
  }

  toSnapshot(): PrioritizedDecisionSnapshot {
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

function createRank(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error("Prioritized decision rank must be a positive integer.");
  }

  return value;
}

function createPrioritizedDecisionTimestamp(
  value: Timestamp,
  message: string
): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function assertSourceType(value: PrioritizedDecisionSourceType): void {
  if (!PRIORITIZED_DECISION_SOURCE_TYPES.includes(value)) {
    throw new Error(`Unsupported prioritized decision source type: ${value}.`);
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
