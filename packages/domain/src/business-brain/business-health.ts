import type { Timestamp } from "@nextshift/shared";

export type BusinessHealthStatus =
  | "critical"
  | "weak"
  | "stable"
  | "strong"
  | "excellent";

export type BusinessHealthDimensionName =
  | "revenue"
  | "customer"
  | "campaign"
  | "content"
  | "operations"
  | "risk"
  | (string & {});

export interface BusinessHealthDimension {
  readonly name: BusinessHealthDimensionName;
  readonly score: number;
  readonly summary: string;
}

export interface BusinessHealthSnapshot {
  readonly score: number;
  readonly status: BusinessHealthStatus;
  readonly dimensions: readonly BusinessHealthDimension[];
  readonly summary: string;
  readonly evaluatedAt: Timestamp;
}

export interface CreateBusinessHealthInput {
  readonly score: number;
  readonly dimensions: readonly BusinessHealthDimension[];
  readonly summary: string;
  readonly evaluatedAt: Timestamp;
}

export class BusinessHealth {
  private constructor(private readonly snapshot: BusinessHealthSnapshot) {}

  static create(input: CreateBusinessHealthInput): BusinessHealth {
    const score = createHealthScore(input.score, "BusinessHealth score");

    return new BusinessHealth(
      Object.freeze({
        score,
        status: deriveBusinessHealthStatus(score),
        dimensions: createBusinessHealthDimensions(input.dimensions),
        summary: createRequiredString(input.summary, "BusinessHealth summary"),
        evaluatedAt: createTimestamp(input.evaluatedAt, "evaluatedAt"),
      })
    );
  }

  get score(): number {
    return this.snapshot.score;
  }

  get status(): BusinessHealthStatus {
    return this.snapshot.status;
  }

  toSnapshot(): BusinessHealthSnapshot {
    return cloneBusinessHealthSnapshot(this.snapshot);
  }
}

export function createBusinessHealthDimension(
  dimension: BusinessHealthDimension
): BusinessHealthDimension {
  return Object.freeze({
    name: createRequiredString(
      dimension.name,
      "BusinessHealth dimension name"
    ) as BusinessHealthDimensionName,
    score: createHealthScore(
      dimension.score,
      `BusinessHealth ${dimension.name} dimension score`
    ),
    summary: createRequiredString(
      dimension.summary,
      "BusinessHealth dimension summary"
    ),
  });
}

export function createHealthScore(value: number, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} must be numeric.`);
  }

  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite.`);
  }

  if (value < 0 || value > 100) {
    throw new Error(`${label} must be between 0 and 100.`);
  }

  return value;
}

export function clampBusinessHealthScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
}

export function deriveBusinessHealthStatus(
  score: number
): BusinessHealthStatus {
  const validatedScore = createHealthScore(score, "BusinessHealth score");

  if (validatedScore < 20) {
    return "critical";
  }

  if (validatedScore < 40) {
    return "weak";
  }

  if (validatedScore < 60) {
    return "stable";
  }

  if (validatedScore < 80) {
    return "strong";
  }

  return "excellent";
}

function createBusinessHealthDimensions(
  dimensions: readonly BusinessHealthDimension[]
): readonly BusinessHealthDimension[] {
  if (dimensions.length === 0) {
    throw new Error("BusinessHealth dimensions are required.");
  }

  return Object.freeze(
    dimensions.map((dimension) => createBusinessHealthDimension(dimension))
  );
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
    throw new Error(`BusinessHealth ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneBusinessHealthSnapshot(
  snapshot: BusinessHealthSnapshot
): BusinessHealthSnapshot {
  return {
    ...snapshot,
    dimensions: Object.freeze(
      snapshot.dimensions.map((dimension) =>
        Object.freeze({
          ...dimension,
        })
      )
    ),
  };
}
