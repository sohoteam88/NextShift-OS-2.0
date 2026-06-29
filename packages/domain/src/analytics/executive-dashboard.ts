import type { Brand, BusinessId, Timestamp } from "@nextshift/shared";
import type {
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotReportingPeriod,
  BusinessPerformanceSnapshotSnapshot,
  CategorySummary,
  SnapshotStatus,
} from "./business-performance-snapshot";
import type { TrendAnalysis, TrendAnalysisSnapshot } from "./trend-analysis";

export type ExecutiveDashboardId = Brand<string, "ExecutiveDashboardId">;

export type DashboardStatus = SnapshotStatus;

export interface ExecutiveSummary {
  readonly totalKPIs: number;
  readonly achievedKPIs: number;
  readonly overallAchievement?: number;
  readonly overallTrend: TrendAnalysisSnapshot["overallTrend"];
  readonly strongestCategory?: CategorySummary;
  readonly weakestCategory?: CategorySummary;
  readonly generatedAt: Timestamp;
}

export interface ExecutiveDashboardSnapshot {
  readonly dashboardId: ExecutiveDashboardId;
  readonly businessId: BusinessId;
  readonly generatedAt: Timestamp;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly performanceSnapshot: BusinessPerformanceSnapshotSnapshot;
  readonly trendAnalysis: TrendAnalysisSnapshot;
  readonly executiveSummary: ExecutiveSummary;
  readonly dashboardStatus: DashboardStatus;
}

export interface CreateExecutiveDashboardInput {
  readonly dashboardId: ExecutiveDashboardId;
  readonly generatedAt: Timestamp;
  readonly performanceSnapshot: BusinessPerformanceSnapshot;
  readonly trendAnalysis: TrendAnalysis;
}

export class ExecutiveDashboard {
  private constructor(
    private readonly snapshot: ExecutiveDashboardSnapshot
  ) {}

  static create(input: CreateExecutiveDashboardInput): ExecutiveDashboard {
    assertDashboardId(input.dashboardId);

    const generatedAt = createDashboardTimestamp(input.generatedAt, "generatedAt");
    const performanceSnapshot = input.performanceSnapshot.toSnapshot();
    const trendAnalysis = input.trendAnalysis.toSnapshot();

    validateAnalyticalInputs(performanceSnapshot, trendAnalysis);

    const executiveSummary = createExecutiveSummary(
      performanceSnapshot,
      trendAnalysis,
      generatedAt
    );

    return new ExecutiveDashboard(
      Object.freeze({
        dashboardId: input.dashboardId,
        businessId: performanceSnapshot.businessId,
        generatedAt,
        reportingPeriod: Object.freeze({
          ...performanceSnapshot.reportingPeriod,
        }),
        performanceSnapshot: freezePerformanceSnapshot(performanceSnapshot),
        trendAnalysis: freezeTrendAnalysis(trendAnalysis),
        executiveSummary,
        dashboardStatus: performanceSnapshot.overallStatus,
      })
    );
  }

  get dashboardId(): ExecutiveDashboardId {
    return this.snapshot.dashboardId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get dashboardStatus(): DashboardStatus {
    return this.snapshot.dashboardStatus;
  }

  toSnapshot(): ExecutiveDashboardSnapshot {
    return {
      ...this.snapshot,
      reportingPeriod: Object.freeze({ ...this.snapshot.reportingPeriod }),
      performanceSnapshot: freezePerformanceSnapshot(
        this.snapshot.performanceSnapshot
      ),
      trendAnalysis: freezeTrendAnalysis(this.snapshot.trendAnalysis),
      executiveSummary: freezeExecutiveSummary(this.snapshot.executiveSummary),
    };
  }
}

function assertDashboardId(dashboardId: ExecutiveDashboardId): void {
  if (dashboardId.trim().length === 0) {
    throw new Error("Executive dashboard ID is required.");
  }
}

function createDashboardTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Executive dashboard ${field} must be a valid timestamp.`);
  }

  return value;
}

function validateAnalyticalInputs(
  performanceSnapshot: BusinessPerformanceSnapshotSnapshot,
  trendAnalysis: TrendAnalysisSnapshot
): void {
  if (performanceSnapshot.businessId !== trendAnalysis.businessId) {
    throw new Error(
      "Executive dashboard analytical inputs must belong to the same business."
    );
  }

  if (
    trendAnalysis.baselineSnapshotId !== performanceSnapshot.snapshotId &&
    trendAnalysis.comparisonSnapshotId !== performanceSnapshot.snapshotId
  ) {
    throw new Error(
      "Executive dashboard trend analysis must reference the performance snapshot."
    );
  }
}

function createExecutiveSummary(
  performanceSnapshot: BusinessPerformanceSnapshotSnapshot,
  trendAnalysis: TrendAnalysisSnapshot,
  generatedAt: Timestamp
): ExecutiveSummary {
  const categorySummariesWithAverage = performanceSnapshot.categorySummaries
    .filter(
      (summary): summary is CategorySummary & { readonly averageAchievement: number } =>
        summary.averageAchievement !== undefined
    )
    .sort((left, right) => {
      if (right.averageAchievement !== left.averageAchievement) {
        return right.averageAchievement - left.averageAchievement;
      }

      return left.category.localeCompare(right.category);
    });

  const strongestCategory = categorySummariesWithAverage[0];
  const weakestCategory =
    categorySummariesWithAverage[categorySummariesWithAverage.length - 1];

  return freezeExecutiveSummary({
    totalKPIs: performanceSnapshot.kpis.length,
    achievedKPIs: performanceSnapshot.kpis.filter(
      (kpi) => kpi.status === "Achieved" || kpi.status === "Exceeded"
    ).length,
    overallAchievement: performanceSnapshot.overallAchievement,
    overallTrend: trendAnalysis.overallTrend,
    strongestCategory:
      strongestCategory === undefined
        ? undefined
        : Object.freeze({ ...strongestCategory }),
    weakestCategory:
      weakestCategory === undefined ? undefined : Object.freeze({ ...weakestCategory }),
    generatedAt,
  });
}

function freezeExecutiveSummary(summary: ExecutiveSummary): ExecutiveSummary {
  return Object.freeze({
    ...summary,
    strongestCategory:
      summary.strongestCategory === undefined
        ? undefined
        : Object.freeze({ ...summary.strongestCategory }),
    weakestCategory:
      summary.weakestCategory === undefined
        ? undefined
        : Object.freeze({ ...summary.weakestCategory }),
  });
}

function freezePerformanceSnapshot(
  snapshot: BusinessPerformanceSnapshotSnapshot
): BusinessPerformanceSnapshotSnapshot {
  return Object.freeze({
    ...snapshot,
    reportingPeriod: Object.freeze({ ...snapshot.reportingPeriod }),
    kpis: Object.freeze(snapshot.kpis.map((kpi) => Object.freeze({ ...kpi }))),
    categorySummaries: Object.freeze(
      snapshot.categorySummaries.map((summary) => Object.freeze({ ...summary }))
    ),
  });
}

function freezeTrendAnalysis(
  snapshot: TrendAnalysisSnapshot
): TrendAnalysisSnapshot {
  return Object.freeze({
    ...snapshot,
    baselinePeriod: Object.freeze({ ...snapshot.baselinePeriod }),
    comparisonPeriod: Object.freeze({ ...snapshot.comparisonPeriod }),
    metricComparisons: Object.freeze(
      snapshot.metricComparisons.map((metric) => Object.freeze({ ...metric }))
    ),
  });
}
