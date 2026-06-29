import type { Brand, BusinessId, Timestamp } from "@nextshift/shared";
import type { KPI, KPICategory, KPISnapshot } from "./kpi";

export type BusinessPerformanceSnapshotId = Brand<
  string,
  "BusinessPerformanceSnapshotId"
>;

export type SnapshotStatus = "Warning" | "OnTrack" | "Achieved" | "Exceeded";

export interface BusinessPerformanceSnapshotReportingPeriod {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface CategorySummary {
  readonly category: KPICategory;
  readonly totalKPIs: number;
  readonly achievedKPIs: number;
  readonly averageAchievement?: number;
  readonly highestAchievement?: number;
  readonly lowestAchievement?: number;
  readonly status: SnapshotStatus;
}

export interface BusinessPerformanceSnapshotSnapshot {
  readonly snapshotId: BusinessPerformanceSnapshotId;
  readonly businessId: BusinessId;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly kpis: readonly KPISnapshot[];
  readonly categorySummaries: readonly CategorySummary[];
  readonly overallAchievement?: number;
  readonly overallStatus: SnapshotStatus;
}

export interface CreateBusinessPerformanceSnapshotInput {
  readonly snapshotId: BusinessPerformanceSnapshotId;
  readonly businessId: BusinessId;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly kpis: readonly KPI[];
}

export class BusinessPerformanceSnapshot {
  private constructor(
    private readonly snapshot: BusinessPerformanceSnapshotSnapshot
  ) {}

  static create(
    input: CreateBusinessPerformanceSnapshotInput
  ): BusinessPerformanceSnapshot {
    assertSnapshotId(input.snapshotId);
    const reportingPeriod = createReportingPeriod(input.reportingPeriod);
    const generatedAt = createSnapshotTimestamp(input.generatedAt, "generatedAt");
    const kpis = input.kpis.map((kpi) => kpi.toSnapshot());

    if (kpis.length === 0) {
      throw new Error("Business performance snapshot requires at least one KPI.");
    }

    assertKPIBusinessConsistency(input.businessId, kpis);

    const categorySummaries = calculateCategorySummaries(kpis);
    const overallAchievement = calculateAverageAchievement(kpis);

    return new BusinessPerformanceSnapshot(
      Object.freeze({
        snapshotId: input.snapshotId,
        businessId: input.businessId,
        reportingPeriod,
        generatedAt,
        kpis: Object.freeze(kpis.map((kpi) => Object.freeze({ ...kpi }))),
        categorySummaries: Object.freeze(
          categorySummaries.map((summary) => Object.freeze({ ...summary }))
        ),
        overallAchievement,
        overallStatus: determineSnapshotStatus(overallAchievement),
      })
    );
  }

  get snapshotId(): BusinessPerformanceSnapshotId {
    return this.snapshot.snapshotId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get overallStatus(): SnapshotStatus {
    return this.snapshot.overallStatus;
  }

  toSnapshot(): BusinessPerformanceSnapshotSnapshot {
    return {
      ...this.snapshot,
      reportingPeriod: Object.freeze({ ...this.snapshot.reportingPeriod }),
      kpis: Object.freeze(
        this.snapshot.kpis.map((kpi) => Object.freeze({ ...kpi }))
      ),
      categorySummaries: Object.freeze(
        this.snapshot.categorySummaries.map((summary) =>
          Object.freeze({ ...summary })
        )
      ),
    };
  }
}

export function createReportingPeriod(
  period: BusinessPerformanceSnapshotReportingPeriod
): BusinessPerformanceSnapshotReportingPeriod {
  const start = createSnapshotTimestamp(period.start, "reportingPeriod.start");
  const end = createSnapshotTimestamp(period.end, "reportingPeriod.end");

  if (Date.parse(end) <= Date.parse(start)) {
    throw new Error("Business performance reporting period end must be after start.");
  }

  return Object.freeze({ start, end });
}

export function determineSnapshotStatus(
  achievement: number | undefined
): SnapshotStatus {
  if (achievement === undefined || achievement < 70) {
    return "Warning";
  }

  if (achievement < 100) {
    return "OnTrack";
  }

  if (achievement === 100) {
    return "Achieved";
  }

  return "Exceeded";
}

function assertSnapshotId(snapshotId: BusinessPerformanceSnapshotId): void {
  if (snapshotId.trim().length === 0) {
    throw new Error("Business performance snapshot ID is required.");
  }
}

function createSnapshotTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Business performance snapshot ${field} must be a valid timestamp.`);
  }

  return value;
}

function assertKPIBusinessConsistency(
  businessId: BusinessId,
  kpis: readonly KPISnapshot[]
): void {
  for (const kpi of kpis) {
    if (!kpi.businessId || kpi.businessId !== businessId) {
      throw new Error("All KPIs must belong to the snapshot business.");
    }
  }
}

function calculateCategorySummaries(
  kpis: readonly KPISnapshot[]
): readonly CategorySummary[] {
  const categories = [...new Set(kpis.map((kpi) => kpi.category))].sort();

  return categories.map((category) => {
    const categoryKPIs = kpis.filter((kpi) => kpi.category === category);
    const achievements = getEvaluatedAchievements(categoryKPIs);
    const averageAchievement = average(achievements);

    return Object.freeze({
      category,
      totalKPIs: categoryKPIs.length,
      achievedKPIs: categoryKPIs.filter(
        (kpi) => kpi.status === "Achieved" || kpi.status === "Exceeded"
      ).length,
      averageAchievement,
      highestAchievement:
        achievements.length === 0 ? undefined : Math.max(...achievements),
      lowestAchievement:
        achievements.length === 0 ? undefined : Math.min(...achievements),
      status: determineSnapshotStatus(averageAchievement),
    });
  });
}

function calculateAverageAchievement(
  kpis: readonly KPISnapshot[]
): number | undefined {
  return average(getEvaluatedAchievements(kpis));
}

function getEvaluatedAchievements(kpis: readonly KPISnapshot[]): number[] {
  return kpis
    .map((kpi) => kpi.achievementPercentage)
    .filter((achievement): achievement is number => achievement !== undefined);
}

function average(values: readonly number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}
