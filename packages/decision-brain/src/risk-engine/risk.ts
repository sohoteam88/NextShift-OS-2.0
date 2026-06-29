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

export type RiskId = Brand<string, "RiskId">;
export type ProbabilityValue = ConfidenceValue;

export type RiskType =
  | "Revenue"
  | "Customer"
  | "Operational"
  | "Compliance"
  | "Capacity"
  | "Financial"
  | "Strategic"
  | "Market"
  | "Custom";

export interface RiskSnapshot {
  readonly riskId: RiskId;
  readonly decisionContextId: DecisionContextId;
  readonly riskType: RiskType;
  readonly title: string;
  readonly summary: string;
  readonly potentialImpact: string;
  readonly probability: ProbabilityValue;
  readonly impact: ImpactValue;
  readonly urgency: UrgencyValue;
  readonly effort: EffortValue;
  readonly createdAt: Timestamp;
}

export interface CreateRiskInput {
  readonly riskId: RiskId;
  readonly decisionContextId: DecisionContextId;
  readonly riskType: RiskType;
  readonly title: string;
  readonly summary: string;
  readonly potentialImpact: string;
  readonly probability: number;
  readonly impact: number;
  readonly urgency: number;
  readonly effort: number;
  readonly createdAt: Timestamp;
}

const RISK_TYPES: readonly RiskType[] = Object.freeze([
  "Revenue",
  "Customer",
  "Operational",
  "Compliance",
  "Capacity",
  "Financial",
  "Strategic",
  "Market",
  "Custom",
]);

export class Risk {
  private constructor(private readonly snapshot: RiskSnapshot) {}

  static create(input: CreateRiskInput): Risk {
    assertRiskType(input.riskType);

    return new Risk(
      freezeDeep({
        riskId: createRequiredId(input.riskId, "Risk ID is required.") as RiskId,
        decisionContextId: createRequiredId(
          input.decisionContextId,
          "Risk decision context ID is required."
        ) as DecisionContextId,
        riskType: input.riskType,
        title: createRequiredText(input.title, "Risk title is required."),
        summary: createRequiredText(input.summary, "Risk summary is required."),
        potentialImpact: createRequiredText(
          input.potentialImpact,
          "Risk potential impact is required."
        ),
        probability: createConfidenceValue(input.probability),
        impact: createImpactValue(input.impact),
        urgency: createUrgencyValue(input.urgency),
        effort: createEffortValue(input.effort),
        createdAt: createRiskTimestamp(
          input.createdAt,
          "Risk createdAt must be a valid timestamp."
        ),
      })
    );
  }

  get riskId(): RiskId {
    return this.snapshot.riskId;
  }

  get decisionContextId(): DecisionContextId {
    return this.snapshot.decisionContextId;
  }

  toSnapshot(): RiskSnapshot {
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

function createRiskTimestamp(value: Timestamp, message: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(message);
  }

  return value;
}

function assertRiskType(value: RiskType): void {
  if (!RISK_TYPES.includes(value)) {
    throw new Error(`Unsupported risk type: ${value}.`);
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
