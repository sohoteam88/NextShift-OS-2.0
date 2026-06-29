import type { Brand, BusinessId, Timestamp } from "@nextshift/shared";

export type KPIId = Brand<string, "KPIId">;
export type KPIDefinitionId = Brand<string, "KPIDefinitionId">;
export type KPIName = Brand<string, "KPIName">;
export type KPIUnit = Brand<string, "KPIUnit">;

export type KPICategory =
  | "Business"
  | "CRM"
  | "Content"
  | "Campaign"
  | "Revenue"
  | "Custom";

export type KPIStatus =
  | "Pending"
  | "Warning"
  | "OnTrack"
  | "Achieved"
  | "Exceeded";

export type KPIDirection = "higher_is_better" | "lower_is_better";

export interface KPIDefinition {
  readonly definitionId: KPIDefinitionId;
  readonly name: KPIName;
  readonly category: KPICategory;
  readonly unit: KPIUnit;
  readonly direction: KPIDirection;
  readonly description?: string;
}

export interface KPIValue {
  readonly targetValue: number;
  readonly actualValue?: number;
  readonly achievementPercentage?: number;
  readonly variance?: number;
  readonly status: KPIStatus;
}

export interface KPISnapshot extends KPIDefinition, KPIValue {
  readonly kpiId: KPIId;
  readonly businessId?: BusinessId;
  readonly measurementDate: Timestamp;
}

export interface CreateKPIInput {
  readonly kpiId: KPIId;
  readonly businessId?: BusinessId;
  readonly definitionId?: KPIDefinitionId;
  readonly name: string;
  readonly category: string;
  readonly targetValue: number;
  readonly actualValue?: number;
  readonly unit: string;
  readonly measurementDate: Timestamp;
  readonly direction?: KPIDirection;
  readonly description?: string;
}

export class KPI {
  private constructor(private readonly snapshot: KPISnapshot) {}

  static create(input: CreateKPIInput): KPI {
    const targetValue = createTargetValue(input.targetValue);
    const actualValue =
      input.actualValue === undefined
        ? undefined
        : createActualValue(input.actualValue);
    const achievementPercentage =
      actualValue === undefined ? undefined : (actualValue / targetValue) * 100;
    const variance =
      actualValue === undefined ? undefined : actualValue - targetValue;

    return new KPI(
      Object.freeze({
        kpiId: input.kpiId,
        businessId: input.businessId,
        definitionId:
          input.definitionId ?? (input.kpiId as unknown as KPIDefinitionId),
        name: createKPIName(input.name),
        category: createKPICategory(input.category),
        targetValue,
        actualValue,
        unit: createKPIUnit(input.unit),
        measurementDate: createKPITimestamp(
          input.measurementDate,
          "measurementDate"
        ),
        direction: input.direction ?? "higher_is_better",
        description: createDescription(input.description),
        achievementPercentage,
        variance,
        status: determineKPIStatus(achievementPercentage),
      })
    );
  }

  get kpiId(): KPIId {
    return this.snapshot.kpiId;
  }

  get status(): KPIStatus {
    return this.snapshot.status;
  }

  toSnapshot(): KPISnapshot {
    return { ...this.snapshot };
  }
}

export function createKPIName(name: string): KPIName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("KPI name is required.");
  }

  return normalized as KPIName;
}

export function createKPICategory(category: string): KPICategory {
  const normalized = category.trim().toLowerCase();

  if (normalized === "crm") return "CRM";

  const categoryMap: Record<string, KPICategory> = {
    business: "Business",
    content: "Content",
    campaign: "Campaign",
    revenue: "Revenue",
    custom: "Custom",
  };
  const mapped = categoryMap[normalized];

  if (!mapped) {
    throw new Error(`Unsupported KPI category: ${category}.`);
  }

  return mapped;
}

export function createKPIUnit(unit: string): KPIUnit {
  const normalized = unit.trim();

  if (normalized.length === 0) {
    throw new Error("KPI unit is required.");
  }

  return normalized as KPIUnit;
}

export function createKPITimestamp(
  value: Timestamp,
  field: string
): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`KPI ${field} must be a valid timestamp.`);
  }

  return value;
}

function createTargetValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("KPI target value must be greater than zero.");
  }

  return value;
}

function createActualValue(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("KPI actual value must be zero or greater.");
  }

  return value;
}

function createDescription(description: string | undefined): string | undefined {
  if (description === undefined) {
    return undefined;
  }

  const normalized = description.trim();

  return normalized.length === 0 ? undefined : normalized;
}

function determineKPIStatus(
  achievementPercentage: number | undefined
): KPIStatus {
  if (achievementPercentage === undefined) {
    return "Pending";
  }

  if (achievementPercentage < 70) {
    return "Warning";
  }

  if (achievementPercentage < 100) {
    return "OnTrack";
  }

  if (achievementPercentage === 100) {
    return "Achieved";
  }

  return "Exceeded";
}
