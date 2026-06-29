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

export type OpportunityId = Brand<string, "OpportunityId">;

export type OpportunityType =
  | "Revenue"
  | "CostReduction"
  | "CustomerGrowth"
  | "Retention"
  | "Productivity"
  | "Automation"
  | "Strategic"
  | "Custom";

export interface OpportunitySnapshot {
  readonly opportunityId: OpportunityId;
  readonly decisionContextId: DecisionContextId;
  readonly opportunityType: OpportunityType;
  readonly title: string;
  readonly summary: string;
  readonly expectedImpact: string;
  readonly confidence: ConfidenceValue;
  readonly impact: ImpactValue;
  readonly urgency: UrgencyValue;
  readonly effort: EffortValue;
  readonly createdAt: Timestamp;
}

export interface CreateOpportunityInput {
  readonly opportunityId: OpportunityId;
  readonly decisionContextId: DecisionContextId;
  readonly opportunityType: OpportunityType;
  readonly title: string;
  readonly summary: string;
  readonly expectedImpact: string;
  readonly confidence: number;
  readonly impact: number;
  readonly urgency: number;
  readonly effort: number;
  readonly createdAt: Timestamp;
}

const OPPORTUNITY_TYPES: readonly OpportunityType[] = Object.freeze([
  "Revenue",
  "CostReduction",
  "CustomerGrowth",
  "Retention",
  "Productivity",
  "Automation",
  "Strategic",
  "Custom",
]);

export class Opportunity {
  private constructor(private readonly snapshot: OpportunitySnapshot) {}

  static create(input: CreateOpportunityInput): Opportunity {
    assertOpportunityType(input.opportunityType);

    return new Opportunity(
      freezeDeep({
        opportunityId: createRequiredId(
          input.opportunityId,
          "Opportunity ID is required."
        ) as OpportunityId,
        decisionContextId: createRequiredId(
          input.decisionContextId,
          "Opportunity decision context ID is required."
        ) as DecisionContextId,
        opportunityType: input.opportunityType,
        title: createRequiredText(input.title, "Opportunity title is required."),
        summary: createRequiredText(
          input.summary,
          "Opportunity summary is required."
        ),
        expectedImpact: createRequiredText(
          input.expectedImpact,
          "Opportunity expected impact is required."
        ),
        confidence: createConfidenceValue(input.confidence),
        impact: createImpactValue(input.impact),
        urgency: createUrgencyValue(input.urgency),
        effort: createEffortValue(input.effort),
        createdAt: createOpportunityTimestamp(
          input.createdAt,
          "Opportunity createdAt must be a valid timestamp."
        ),
      })
    );
  }

  get opportunityId(): OpportunityId {
    return this.snapshot.opportunityId;
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  toSnapshot(): OpportunitySnapshot {
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

function createOpportunityTimestamp(value: Timestamp, message: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function assertOpportunityType(value: OpportunityType): void {
  if (!OPPORTUNITY_TYPES.includes(value)) {
    throw new Error(`Unsupported opportunity type: ${value}.`);
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
