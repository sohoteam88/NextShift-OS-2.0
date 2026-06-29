import type { Brand, Timestamp } from "@nextshift/shared";

export type DetectedOpportunityId = Brand<string, "DetectedOpportunityId">;

export type OpportunityPriority = "low" | "medium" | "high" | "critical";

export type OpportunitySourceType =
  | "observation"
  | "insight"
  | "risk"
  | "health"
  | "manual"
  | "system";

export interface OpportunitySource {
  readonly type: OpportunitySourceType;
  readonly referenceId: string;
  readonly summary: string;
}

export interface DetectedOpportunity {
  readonly id: DetectedOpportunityId;
  readonly title: string;
  readonly summary: string;
  readonly priority: OpportunityPriority;
  readonly confidence: number;
  readonly source: OpportunitySource;
  readonly detectedAt: Timestamp;
}

export interface OpportunityDetectionResultSnapshot {
  readonly opportunities: readonly DetectedOpportunity[];
  readonly detectedAt: Timestamp;
  readonly summary: string;
}

export interface CreateDetectedOpportunityInput {
  readonly id: DetectedOpportunityId;
  readonly title: string;
  readonly summary: string;
  readonly confidence: number;
  readonly source: OpportunitySource;
  readonly detectedAt: Timestamp;
}

export interface CreateOpportunityDetectionResultInput {
  readonly opportunities: readonly DetectedOpportunity[];
  readonly detectedAt: Timestamp;
  readonly summary: string;
}

export class OpportunityDetectionResult {
  private constructor(
    private readonly snapshot: OpportunityDetectionResultSnapshot
  ) {}

  static create(
    input: CreateOpportunityDetectionResultInput
  ): OpportunityDetectionResult {
    return new OpportunityDetectionResult(
      Object.freeze({
        opportunities: createDetectedOpportunities(input.opportunities),
        detectedAt: createTimestamp(input.detectedAt, "detectedAt"),
        summary: createRequiredString(
          input.summary,
          "OpportunityDetectionResult summary"
        ),
      })
    );
  }

  get opportunities(): readonly DetectedOpportunity[] {
    return cloneDetectedOpportunities(this.snapshot.opportunities);
  }

  toSnapshot(): OpportunityDetectionResultSnapshot {
    return cloneOpportunityDetectionResultSnapshot(this.snapshot);
  }
}

export function createDetectedOpportunity(
  input: CreateDetectedOpportunityInput
): DetectedOpportunity {
  const confidence = createOpportunityConfidence(input.confidence);

  return Object.freeze({
    id: createRequiredString(
      input.id,
      "DetectedOpportunity id"
    ) as DetectedOpportunityId,
    title: createRequiredString(input.title, "DetectedOpportunity title"),
    summary: createRequiredString(input.summary, "DetectedOpportunity summary"),
    priority: deriveOpportunityPriority(confidence),
    confidence,
    source: createOpportunitySource(input.source),
    detectedAt: createTimestamp(input.detectedAt, "detectedAt"),
  });
}

export function createOpportunityConfidence(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("Opportunity confidence must be numeric.");
  }

  if (!Number.isFinite(value)) {
    throw new Error("Opportunity confidence must be finite.");
  }

  if (value < 0 || value > 1) {
    throw new Error("Opportunity confidence must be between 0 and 1.");
  }

  return value;
}

export function deriveOpportunityPriority(
  confidence: number
): OpportunityPriority {
  const validatedConfidence = createOpportunityConfidence(confidence);

  if (validatedConfidence < 0.4) {
    return "low";
  }

  if (validatedConfidence < 0.7) {
    return "medium";
  }

  if (validatedConfidence < 0.9) {
    return "high";
  }

  return "critical";
}

export function createOpportunitySource(
  source: OpportunitySource
): OpportunitySource {
  if (!isOpportunitySourceType(source.type)) {
    throw new Error(`Unsupported opportunity source type: ${source.type}.`);
  }

  return Object.freeze({
    type: source.type,
    referenceId: createRequiredString(
      source.referenceId,
      "Opportunity source referenceId"
    ),
    summary: createRequiredString(source.summary, "Opportunity source summary"),
  });
}

function createDetectedOpportunities(
  opportunities: readonly DetectedOpportunity[]
): readonly DetectedOpportunity[] {
  return Object.freeze(
    opportunities.map((opportunity) => createDetectedOpportunity(opportunity))
  );
}

function isOpportunitySourceType(
  value: string
): value is OpportunitySourceType {
  return [
    "observation",
    "insight",
    "risk",
    "health",
    "manual",
    "system",
  ].includes(value);
}

function createRequiredString(value: string, label: string): string {
  const normalized = value.trim();

  if (normalized.length === 0) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function createTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Opportunity detection ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneOpportunityDetectionResultSnapshot(
  snapshot: OpportunityDetectionResultSnapshot
): OpportunityDetectionResultSnapshot {
  return {
    ...snapshot,
    opportunities: cloneDetectedOpportunities(snapshot.opportunities),
  };
}

function cloneDetectedOpportunity(
  opportunity: DetectedOpportunity
): DetectedOpportunity {
  return Object.freeze({
    ...opportunity,
    source: Object.freeze({
      ...opportunity.source,
    }),
  });
}

function cloneDetectedOpportunities(
  opportunities: readonly DetectedOpportunity[]
): readonly DetectedOpportunity[] {
  return Object.freeze(opportunities.map(cloneDetectedOpportunity));
}
