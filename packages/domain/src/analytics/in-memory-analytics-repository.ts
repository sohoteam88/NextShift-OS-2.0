import type { BusinessId } from "@nextshift/shared";
import type {
  AnalyticsProjection,
  AnalyticsProjectionId,
  AnalyticsProjectionType,
  AnalyticsRepository,
} from "./analytics-repository";
import {
  getAnalyticsProjectionBusinessId,
  getAnalyticsProjectionGeneratedAt,
  getAnalyticsProjectionId,
  getAnalyticsProjectionType,
} from "./analytics-repository";
import type {
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotId,
} from "./business-performance-snapshot";
import type {
  ExecutiveDashboard,
  ExecutiveDashboardId,
} from "./executive-dashboard";
import type {
  PerformanceHealthScore,
  PerformanceHealthScoreId,
} from "./performance-health-score";
import type { TrendAnalysis, TrendAnalysisId } from "./trend-analysis";

export class InMemoryAnalyticsRepository implements AnalyticsRepository {
  private readonly businessPerformanceSnapshots = new Map<
    BusinessPerformanceSnapshotId,
    BusinessPerformanceSnapshot
  >();
  private readonly trendAnalyses = new Map<TrendAnalysisId, TrendAnalysis>();
  private readonly executiveDashboards = new Map<
    ExecutiveDashboardId,
    ExecutiveDashboard
  >();
  private readonly performanceHealthScores = new Map<
    PerformanceHealthScoreId,
    PerformanceHealthScore
  >();

  async saveBusinessPerformanceSnapshot(
    snapshot: BusinessPerformanceSnapshot
  ): Promise<void> {
    this.businessPerformanceSnapshots.set(snapshot.snapshotId, snapshot);
  }

  async saveTrendAnalysis(trend: TrendAnalysis): Promise<void> {
    this.trendAnalyses.set(trend.trendId, trend);
  }

  async saveExecutiveDashboard(dashboard: ExecutiveDashboard): Promise<void> {
    this.executiveDashboards.set(dashboard.dashboardId, dashboard);
  }

  async savePerformanceHealthScore(
    score: PerformanceHealthScore
  ): Promise<void> {
    this.performanceHealthScores.set(score.healthScoreId, score);
  }

  async saveProjection(projection: AnalyticsProjection): Promise<void> {
    const projectionType = getAnalyticsProjectionType(projection);

    if (projectionType === "BusinessPerformanceSnapshot") {
      await this.saveBusinessPerformanceSnapshot(
        projection as BusinessPerformanceSnapshot
      );
      return;
    }

    if (projectionType === "TrendAnalysis") {
      await this.saveTrendAnalysis(projection as TrendAnalysis);
      return;
    }

    if (projectionType === "ExecutiveDashboard") {
      await this.saveExecutiveDashboard(projection as ExecutiveDashboard);
      return;
    }

    await this.savePerformanceHealthScore(projection as PerformanceHealthScore);
  }

  async getBusinessPerformanceSnapshotById(
    snapshotId: BusinessPerformanceSnapshotId
  ): Promise<BusinessPerformanceSnapshot | undefined> {
    return this.businessPerformanceSnapshots.get(snapshotId);
  }

  async getTrendAnalysisById(
    trendId: TrendAnalysisId
  ): Promise<TrendAnalysis | undefined> {
    return this.trendAnalyses.get(trendId);
  }

  async getExecutiveDashboardById(
    dashboardId: ExecutiveDashboardId
  ): Promise<ExecutiveDashboard | undefined> {
    return this.executiveDashboards.get(dashboardId);
  }

  async getPerformanceHealthScoreById(
    healthScoreId: PerformanceHealthScoreId
  ): Promise<PerformanceHealthScore | undefined> {
    return this.performanceHealthScores.get(healthScoreId);
  }

  async getProjectionById(
    projectionType: AnalyticsProjectionType,
    projectionId: AnalyticsProjectionId
  ): Promise<AnalyticsProjection | undefined> {
    return this.getStore(projectionType).get(
      projectionId as never
    ) as AnalyticsProjection | undefined;
  }

  async listByBusiness(
    projectionType: AnalyticsProjectionType,
    businessId: BusinessId
  ): Promise<readonly AnalyticsProjection[]> {
    return [...this.getStore(projectionType).values()]
      .filter(
        (projection) => getAnalyticsProjectionBusinessId(projection) === businessId
      )
      .sort(compareAnalyticsProjections);
  }

  async getLatestByBusiness(
    projectionType: AnalyticsProjectionType,
    businessId: BusinessId
  ): Promise<AnalyticsProjection | undefined> {
    const projections = await this.listByBusiness(projectionType, businessId);

    return [...projections].sort(compareLatestAnalyticsProjections)[0];
  }

  async deleteProjection(
    projectionType: AnalyticsProjectionType,
    projectionId: AnalyticsProjectionId
  ): Promise<boolean> {
    return this.getStore(projectionType).delete(projectionId as never);
  }

  private getStore(
    projectionType: AnalyticsProjectionType
  ): Map<never, AnalyticsProjection> {
    if (projectionType === "BusinessPerformanceSnapshot") {
      return this.businessPerformanceSnapshots as unknown as Map<
        never,
        AnalyticsProjection
      >;
    }

    if (projectionType === "TrendAnalysis") {
      return this.trendAnalyses as unknown as Map<never, AnalyticsProjection>;
    }

    if (projectionType === "ExecutiveDashboard") {
      return this.executiveDashboards as unknown as Map<
        never,
        AnalyticsProjection
      >;
    }

    return this.performanceHealthScores as unknown as Map<
      never,
      AnalyticsProjection
    >;
  }
}

function compareAnalyticsProjections(
  left: AnalyticsProjection,
  right: AnalyticsProjection
): number {
  const generatedAtDifference =
    Date.parse(getAnalyticsProjectionGeneratedAt(left)) -
    Date.parse(getAnalyticsProjectionGeneratedAt(right));

  if (generatedAtDifference !== 0) {
    return generatedAtDifference;
  }

  return String(getAnalyticsProjectionId(left)).localeCompare(
    String(getAnalyticsProjectionId(right))
  );
}

function compareLatestAnalyticsProjections(
  left: AnalyticsProjection,
  right: AnalyticsProjection
): number {
  const generatedAtDifference =
    Date.parse(getAnalyticsProjectionGeneratedAt(right)) -
    Date.parse(getAnalyticsProjectionGeneratedAt(left));

  if (generatedAtDifference !== 0) {
    return generatedAtDifference;
  }

  return String(getAnalyticsProjectionId(left)).localeCompare(
    String(getAnalyticsProjectionId(right))
  );
}
