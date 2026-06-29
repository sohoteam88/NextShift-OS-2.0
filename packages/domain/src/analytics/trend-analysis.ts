import type { Brand, BusinessId, Timestamp } from "@nextshift/shared";
import type {
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotId,
  BusinessPerformanceSnapshotReportingPeriod,
  BusinessPerformanceSnapshotSnapshot,
  CategorySummary,
} from "./business-performance-snapshot";

export type TrendAnalysisId = Brand<string, "TrendAnalysisId">;

export type TrendDirection = "Improving" | "Stable" | "Declining";

export interface MetricComparison {
  readonly metricName: string;
  readonly baselineValue: number;
  readonly comparisonValue: number;
  readonly absoluteChange: number;
  readonly percentageChange?: number;
  readonly trendDirection: TrendDirection;
}

export interface TrendAnalysisSnapshot {
  readonly trendId: TrendAnalysisId;
  readonly businessId: BusinessId;
  readonly baselineSnapshotId: BusinessPerformanceSnapshotId;
  readonly comparisonSnapshotId: BusinessPerformanceSnapshotId;
  readonly baselinePeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly comparisonPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly generatedAt: Timestamp;
  readonly metricComparisons: readonly MetricComparison[];
  readonly overallGrowthRate: number;
  readonly overallTrend: TrendDirection;
}

export interface CreateTrendAnalysisInput {
  readonly trendId: TrendAnalysisId;
  readonly baselineSnapshot: BusinessPerformanceSnapshot;
  readonly comparisonSnapshot: BusinessPerformanceSnapshot;
  readonly generatedAt: Timestamp;
}

export class TrendAnalysis {
  private constructor(private readonly snapshot: TrendAnalysisSnapshot) {}

  static create(input: CreateTrendAnalysisInput): TrendAnalysis {
    assertTrendId(input.trendId);

    const baseline = input.baselineSnapshot.toSnapshot();
    const comparison = input.comparisonSnapshot.toSnapshot();
    const generatedAt = createTrendTimestamp(input.generatedAt, "generatedAt");

    validateSnapshotPair(baseline, comparison);

    const metricComparisons = calculateMetricComparisons(baseline, comparison);
    const definedPercentageChanges = metricComparisons
      .map((metric) => metric.percentageChange)
      .filter((value): value is number => value !== undefined);

    if (definedPercentageChanges.length === 0) {
      throw new Error("Trend analysis requires at least one comparable metric.");
    }

    const overallGrowthRate = average(definedPercentageChanges);

    return new TrendAnalysis(
      Object.freeze({
        trendId: input.trendId,
        businessId: baseline.businessId,
        baselineSnapshotId: baseline.snapshotId,
        comparisonSnapshotId: comparison.snapshotId,
        baselinePeriod: Object.freeze({ ...baseline.reportingPeriod }),
        comparisonPeriod: Object.freeze({ ...comparison.reportingPeriod }),
        generatedAt,
        metricComparisons: Object.freeze(
          metricComparisons.map((metric) => Object.freeze({ ...metric }))
        ),
        overallGrowthRate,
        overallTrend: determineTrendDirection(overallGrowthRate),
      })
    );
  }

  get trendId(): TrendAnalysisId {
    return this.snapshot.trendId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get overallTrend(): TrendDirection {
    return this.snapshot.overallTrend;
  }

  toSnapshot(): TrendAnalysisSnapshot {
    return {
      ...this.snapshot,
      baselinePeriod: Object.freeze({ ...this.snapshot.baselinePeriod }),
      comparisonPeriod: Object.freeze({ ...this.snapshot.comparisonPeriod }),
      metricComparisons: Object.freeze(
        this.snapshot.metricComparisons.map((metric) =>
          Object.freeze({ ...metric })
        )
      ),
    };
  }
}

export function determineTrendDirection(
  percentageChange: number | undefined
): TrendDirection {
  if (percentageChange === undefined) {
    return "Stable";
  }

  if (percentageChange > 5) {
    return "Improving";
  }

  if (percentageChange < -5) {
    return "Declining";
  }

  return "Stable";
}

function assertTrendId(trendId: TrendAnalysisId): void {
  if (trendId.trim().length === 0) {
    throw new Error("Trend analysis ID is required.");
  }
}

function createTrendTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Trend analysis ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshotPair(
  baseline: BusinessPerformanceSnapshotSnapshot,
  comparison: BusinessPerformanceSnapshotSnapshot
): void {
  if (baseline.businessId !== comparison.businessId) {
    throw new Error("Trend analysis snapshots must belong to the same business.");
  }

  if (baseline.snapshotId === comparison.snapshotId) {
    throw new Error("Trend analysis requires different snapshots.");
  }

  if (
    Date.parse(baseline.reportingPeriod.end) >
    Date.parse(comparison.reportingPeriod.start)
  ) {
    throw new Error(
      "Trend analysis baseline period must precede comparison period."
    );
  }
}

function calculateMetricComparisons(
  baseline: BusinessPerformanceSnapshotSnapshot,
  comparison: BusinessPerformanceSnapshotSnapshot
): readonly MetricComparison[] {
  const metrics: MetricComparison[] = [];

  if (
    baseline.overallAchievement !== undefined &&
    comparison.overallAchievement !== undefined
  ) {
    metrics.push(
      createMetricComparison(
        "Overall Achievement",
        baseline.overallAchievement,
        comparison.overallAchievement
      )
    );
  }

  const comparisonCategories = new Map(
    comparison.categorySummaries.map((summary) => [summary.category, summary])
  );

  for (const baselineCategory of baseline.categorySummaries) {
    const comparisonCategory = comparisonCategories.get(
      baselineCategory.category
    );

    if (!comparisonCategory) {
      continue;
    }

    const baselineValue = getCategoryValue(baselineCategory);
    const comparisonValue = getCategoryValue(comparisonCategory);

    if (baselineValue === undefined || comparisonValue === undefined) {
      continue;
    }

    metrics.push(
      createMetricComparison(
        `${baselineCategory.category} Achievement`,
        baselineValue,
        comparisonValue
      )
    );
  }

  if (metrics.length === 0) {
    throw new Error("Trend analysis requires at least one comparable metric.");
  }

  return Object.freeze(metrics);
}

function createMetricComparison(
  metricName: string,
  baselineValue: number,
  comparisonValue: number
): MetricComparison {
  const absoluteChange = comparisonValue - baselineValue;
  const percentageChange =
    baselineValue === 0 ? undefined : (absoluteChange / baselineValue) * 100;

  return Object.freeze({
    metricName,
    baselineValue,
    comparisonValue,
    absoluteChange,
    percentageChange,
    trendDirection: determineTrendDirection(percentageChange),
  });
}

function getCategoryValue(summary: CategorySummary): number | undefined {
  return summary.averageAchievement;
}

function average(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
