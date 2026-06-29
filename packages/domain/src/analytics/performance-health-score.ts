import type { Brand, BusinessId, Timestamp } from "@nextshift/shared";
import type {
  BusinessPerformanceSnapshotReportingPeriod,
  CategorySummary,
} from "./business-performance-snapshot";
import type {
  ExecutiveDashboard,
  ExecutiveDashboardSnapshot,
} from "./executive-dashboard";
import type { TrendDirection } from "./trend-analysis";

export type PerformanceHealthScoreId = Brand<
  string,
  "PerformanceHealthScoreId"
>;

export type HealthGrade = "A" | "B" | "C" | "D" | "F";

export type HealthStatus =
  | "Excellent"
  | "Healthy"
  | "Watch"
  | "AtRisk"
  | "Critical";

export interface WeightedHealthMetric {
  readonly metricName: string;
  readonly weight: number;
  readonly rawValue: number;
  readonly normalizedScore: number;
  readonly weightedContribution: number;
}

export interface PerformanceHealthScoreSnapshot {
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly businessId: BusinessId;
  readonly generatedAt: Timestamp;
  readonly reportingPeriod: BusinessPerformanceSnapshotReportingPeriod;
  readonly executiveDashboard: ExecutiveDashboardSnapshot;
  readonly weightedMetrics: readonly WeightedHealthMetric[];
  readonly overallScore: number;
  readonly healthGrade: HealthGrade;
  readonly healthStatus: HealthStatus;
}

export interface CreatePerformanceHealthScoreInput {
  readonly healthScoreId: PerformanceHealthScoreId;
  readonly generatedAt: Timestamp;
  readonly executiveDashboard: ExecutiveDashboard;
}

const DEFAULT_METRIC_WEIGHTS = Object.freeze({
  overallAchievement: 40,
  overallTrend: 25,
  kpiCompletionRate: 20,
  categoryBalance: 15,
});

export class PerformanceHealthScore {
  private constructor(
    private readonly snapshot: PerformanceHealthScoreSnapshot
  ) {}

  static create(
    input: CreatePerformanceHealthScoreInput
  ): PerformanceHealthScore {
    assertHealthScoreId(input.healthScoreId);

    if (!input.executiveDashboard) {
      throw new Error("Performance health score executive dashboard is required.");
    }

    const generatedAt = createHealthTimestamp(input.generatedAt, "generatedAt");
    const executiveDashboard = input.executiveDashboard.toSnapshot();
    const weightedMetrics = calculateWeightedMetrics(executiveDashboard);
    const overallScore = clampScore(
      weightedMetrics.reduce(
        (total, metric) => total + metric.weightedContribution,
        0
      )
    );
    const healthGrade = determineHealthGrade(overallScore);

    return new PerformanceHealthScore(
      Object.freeze({
        healthScoreId: input.healthScoreId,
        businessId: executiveDashboard.businessId,
        generatedAt,
        reportingPeriod: Object.freeze({
          ...executiveDashboard.reportingPeriod,
        }),
        executiveDashboard: freezeExecutiveDashboard(executiveDashboard),
        weightedMetrics: Object.freeze(
          weightedMetrics.map((metric) => Object.freeze({ ...metric }))
        ),
        overallScore,
        healthGrade,
        healthStatus: determineHealthStatus(healthGrade),
      })
    );
  }

  get healthScoreId(): PerformanceHealthScoreId {
    return this.snapshot.healthScoreId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get healthGrade(): HealthGrade {
    return this.snapshot.healthGrade;
  }

  get healthStatus(): HealthStatus {
    return this.snapshot.healthStatus;
  }

  toSnapshot(): PerformanceHealthScoreSnapshot {
    return {
      ...this.snapshot,
      reportingPeriod: Object.freeze({ ...this.snapshot.reportingPeriod }),
      executiveDashboard: freezeExecutiveDashboard(
        this.snapshot.executiveDashboard
      ),
      weightedMetrics: Object.freeze(
        this.snapshot.weightedMetrics.map((metric) =>
          Object.freeze({ ...metric })
        )
      ),
    };
  }
}

function assertHealthScoreId(healthScoreId: PerformanceHealthScoreId): void {
  if (healthScoreId.trim().length === 0) {
    throw new Error("Performance health score ID is required.");
  }
}

function createHealthTimestamp(value: Timestamp, field: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(
      `Performance health score ${field} must be a valid timestamp.`
    );
  }

  return value;
}

function calculateWeightedMetrics(
  executiveDashboard: ExecutiveDashboardSnapshot
): readonly WeightedHealthMetric[] {
  assertWeightTotal(DEFAULT_METRIC_WEIGHTS);

  const summary = executiveDashboard.executiveSummary;
  const metrics: readonly WeightedHealthMetric[] = Object.freeze([
    createWeightedMetric(
      "Overall Achievement",
      DEFAULT_METRIC_WEIGHTS.overallAchievement,
      summary.overallAchievement ?? 0
    ),
    createWeightedMetric(
      "Overall Trend",
      DEFAULT_METRIC_WEIGHTS.overallTrend,
      trendToScore(summary.overallTrend)
    ),
    createWeightedMetric(
      "KPI Completion Rate",
      DEFAULT_METRIC_WEIGHTS.kpiCompletionRate,
      calculateCompletionRate(summary.achievedKPIs, summary.totalKPIs)
    ),
    createWeightedMetric(
      "Category Balance",
      DEFAULT_METRIC_WEIGHTS.categoryBalance,
      calculateCategoryBalance(
        summary.strongestCategory,
        summary.weakestCategory
      )
    ),
  ]);

  return metrics;
}

function assertWeightTotal(weights: Record<string, number>): void {
  const totalWeight = Object.values(weights).reduce(
    (total, weight) => total + weight,
    0
  );

  if (totalWeight !== 100) {
    throw new Error("Performance health metric weights must total 100.");
  }
}

function createWeightedMetric(
  metricName: string,
  weight: number,
  rawValue: number
): WeightedHealthMetric {
  const normalizedScore = clampScore(rawValue);

  return Object.freeze({
    metricName,
    weight,
    rawValue,
    normalizedScore,
    weightedContribution: (normalizedScore * weight) / 100,
  });
}

function trendToScore(trend: TrendDirection): number {
  if (trend === "Improving") {
    return 100;
  }

  if (trend === "Stable") {
    return 75;
  }

  return 40;
}

function calculateCompletionRate(
  achievedKPIs: number,
  totalKPIs: number
): number {
  if (totalKPIs === 0) {
    return 0;
  }

  return (achievedKPIs / totalKPIs) * 100;
}

function calculateCategoryBalance(
  strongestCategory: CategorySummary | undefined,
  weakestCategory: CategorySummary | undefined
): number {
  if (
    strongestCategory?.averageAchievement === undefined ||
    weakestCategory?.averageAchievement === undefined
  ) {
    return 0;
  }

  return (
    100 -
    Math.abs(
      strongestCategory.averageAchievement - weakestCategory.averageAchievement
    )
  );
}

function clampScore(value: number): number {
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

function determineHealthGrade(score: number): HealthGrade {
  if (score >= 90) {
    return "A";
  }

  if (score >= 80) {
    return "B";
  }

  if (score >= 70) {
    return "C";
  }

  if (score >= 60) {
    return "D";
  }

  return "F";
}

function determineHealthStatus(grade: HealthGrade): HealthStatus {
  if (grade === "A") {
    return "Excellent";
  }

  if (grade === "B") {
    return "Healthy";
  }

  if (grade === "C") {
    return "Watch";
  }

  if (grade === "D") {
    return "AtRisk";
  }

  return "Critical";
}

function freezeExecutiveDashboard(
  snapshot: ExecutiveDashboardSnapshot
): ExecutiveDashboardSnapshot {
  return Object.freeze({
    ...snapshot,
    reportingPeriod: Object.freeze({ ...snapshot.reportingPeriod }),
    performanceSnapshot: Object.freeze({
      ...snapshot.performanceSnapshot,
      reportingPeriod: Object.freeze({
        ...snapshot.performanceSnapshot.reportingPeriod,
      }),
      kpis: Object.freeze(
        snapshot.performanceSnapshot.kpis.map((kpi) =>
          Object.freeze({ ...kpi })
        )
      ),
      categorySummaries: Object.freeze(
        snapshot.performanceSnapshot.categorySummaries.map((summary) =>
          Object.freeze({ ...summary })
        )
      ),
    }),
    trendAnalysis: Object.freeze({
      ...snapshot.trendAnalysis,
      baselinePeriod: Object.freeze({ ...snapshot.trendAnalysis.baselinePeriod }),
      comparisonPeriod: Object.freeze({
        ...snapshot.trendAnalysis.comparisonPeriod,
      }),
      metricComparisons: Object.freeze(
        snapshot.trendAnalysis.metricComparisons.map((metric) =>
          Object.freeze({ ...metric })
        )
      ),
    }),
    executiveSummary: Object.freeze({
      ...snapshot.executiveSummary,
      strongestCategory:
        snapshot.executiveSummary.strongestCategory === undefined
          ? undefined
          : Object.freeze({ ...snapshot.executiveSummary.strongestCategory }),
      weakestCategory:
        snapshot.executiveSummary.weakestCategory === undefined
          ? undefined
          : Object.freeze({ ...snapshot.executiveSummary.weakestCategory }),
    }),
  });
}
