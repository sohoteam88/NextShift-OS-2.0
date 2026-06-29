import type { Brand, Timestamp } from "@nextshift/shared";

export type GeneratedBusinessInsightId = Brand<
  string,
  "GeneratedBusinessInsightId"
>;

export type BusinessInsightCategory =
  | "growth"
  | "efficiency"
  | "revenue"
  | "customer"
  | "campaign"
  | "content"
  | "operations"
  | "risk";

export type BusinessInsightSeverity =
  | "informational"
  | "advisory"
  | "important"
  | "critical";

export interface GeneratedBusinessInsight {
  readonly id: GeneratedBusinessInsightId;
  readonly title: string;
  readonly summary: string;
  readonly category: BusinessInsightCategory;
  readonly severity: BusinessInsightSeverity;
  readonly confidence: number;
  readonly generatedAt: Timestamp;
}

export interface InsightGenerationResultSnapshot {
  readonly insights: readonly GeneratedBusinessInsight[];
  readonly generatedAt: Timestamp;
  readonly summary: string;
}

export interface CreateGeneratedBusinessInsightInput {
  readonly id: GeneratedBusinessInsightId;
  readonly title: string;
  readonly summary: string;
  readonly category: BusinessInsightCategory;
  readonly confidence: number;
  readonly generatedAt: Timestamp;
}

export interface CreateInsightGenerationResultInput {
  readonly insights: readonly GeneratedBusinessInsight[];
  readonly generatedAt: Timestamp;
  readonly summary: string;
}

export class InsightGenerationResult {
  private constructor(
    private readonly snapshot: InsightGenerationResultSnapshot
  ) {}

  static create(
    input: CreateInsightGenerationResultInput
  ): InsightGenerationResult {
    return new InsightGenerationResult(
      Object.freeze({
        insights: createGeneratedBusinessInsights(input.insights),
        generatedAt: createTimestamp(input.generatedAt, "generatedAt"),
        summary: createRequiredString(
          input.summary,
          "InsightGenerationResult summary"
        ),
      })
    );
  }

  get insights(): readonly GeneratedBusinessInsight[] {
    return cloneGeneratedBusinessInsights(this.snapshot.insights);
  }

  toSnapshot(): InsightGenerationResultSnapshot {
    return cloneInsightGenerationResultSnapshot(this.snapshot);
  }
}

export function createGeneratedBusinessInsight(
  input: CreateGeneratedBusinessInsightInput
): GeneratedBusinessInsight {
  const confidence = createInsightConfidence(input.confidence);

  return Object.freeze({
    id: createRequiredString(
      input.id,
      "GeneratedBusinessInsight id"
    ) as GeneratedBusinessInsightId,
    title: createRequiredString(input.title, "GeneratedBusinessInsight title"),
    summary: createRequiredString(
      input.summary,
      "GeneratedBusinessInsight summary"
    ),
    category: createBusinessInsightCategory(input.category),
    severity: deriveBusinessInsightSeverity(confidence),
    confidence,
    generatedAt: createTimestamp(input.generatedAt, "generatedAt"),
  });
}

export function createInsightConfidence(value: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error("Business insight confidence must be numeric.");
  }

  if (!Number.isFinite(value)) {
    throw new Error("Business insight confidence must be finite.");
  }

  if (value < 0 || value > 1) {
    throw new Error("Business insight confidence must be between 0 and 1.");
  }

  return value;
}

export function deriveBusinessInsightSeverity(
  confidence: number
): BusinessInsightSeverity {
  const validatedConfidence = createInsightConfidence(confidence);

  if (validatedConfidence < 0.4) {
    return "informational";
  }

  if (validatedConfidence < 0.7) {
    return "advisory";
  }

  if (validatedConfidence < 0.9) {
    return "important";
  }

  return "critical";
}

export function createBusinessInsightCategory(
  category: BusinessInsightCategory
): BusinessInsightCategory {
  if (!isBusinessInsightCategory(category)) {
    throw new Error(`Unsupported business insight category: ${category}.`);
  }

  return category;
}

function createGeneratedBusinessInsights(
  insights: readonly GeneratedBusinessInsight[]
): readonly GeneratedBusinessInsight[] {
  return Object.freeze(
    insights.map((insight) => createGeneratedBusinessInsight(insight))
  );
}

function isBusinessInsightCategory(
  value: string
): value is BusinessInsightCategory {
  return [
    "growth",
    "efficiency",
    "revenue",
    "customer",
    "campaign",
    "content",
    "operations",
    "risk",
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
    throw new Error(`Business insight ${field} must be a valid timestamp.`);
  }

  return value;
}

function cloneInsightGenerationResultSnapshot(
  snapshot: InsightGenerationResultSnapshot
): InsightGenerationResultSnapshot {
  return {
    ...snapshot,
    insights: cloneGeneratedBusinessInsights(snapshot.insights),
  };
}

function cloneGeneratedBusinessInsight(
  insight: GeneratedBusinessInsight
): GeneratedBusinessInsight {
  return Object.freeze({
    ...insight,
  });
}

function cloneGeneratedBusinessInsights(
  insights: readonly GeneratedBusinessInsight[]
): readonly GeneratedBusinessInsight[] {
  return Object.freeze(insights.map(cloneGeneratedBusinessInsight));
}
