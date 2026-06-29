import type { BusinessId } from "@nextshift/shared";
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

export type AnalyticsProjectionType =
  | "BusinessPerformanceSnapshot"
  | "TrendAnalysis"
  | "ExecutiveDashboard"
  | "PerformanceHealthScore";

export type AnalyticsProjection =
  | BusinessPerformanceSnapshot
  | TrendAnalysis
  | ExecutiveDashboard
  | PerformanceHealthScore;

export type AnalyticsProjectionId =
  | BusinessPerformanceSnapshotId
  | TrendAnalysisId
  | ExecutiveDashboardId
  | PerformanceHealthScoreId;

export interface AnalyticsRepository {
  saveBusinessPerformanceSnapshot(
    snapshot: BusinessPerformanceSnapshot
  ): Promise<void>;
  saveTrendAnalysis(trend: TrendAnalysis): Promise<void>;
  saveExecutiveDashboard(dashboard: ExecutiveDashboard): Promise<void>;
  savePerformanceHealthScore(score: PerformanceHealthScore): Promise<void>;
  saveProjection(projection: AnalyticsProjection): Promise<void>;

  getBusinessPerformanceSnapshotById(
    snapshotId: BusinessPerformanceSnapshotId
  ): Promise<BusinessPerformanceSnapshot | undefined>;
  getTrendAnalysisById(
    trendId: TrendAnalysisId
  ): Promise<TrendAnalysis | undefined>;
  getExecutiveDashboardById(
    dashboardId: ExecutiveDashboardId
  ): Promise<ExecutiveDashboard | undefined>;
  getPerformanceHealthScoreById(
    healthScoreId: PerformanceHealthScoreId
  ): Promise<PerformanceHealthScore | undefined>;
  getProjectionById(
    projectionType: AnalyticsProjectionType,
    projectionId: AnalyticsProjectionId
  ): Promise<AnalyticsProjection | undefined>;

  listByBusiness(
    projectionType: AnalyticsProjectionType,
    businessId: BusinessId
  ): Promise<readonly AnalyticsProjection[]>;
  getLatestByBusiness(
    projectionType: AnalyticsProjectionType,
    businessId: BusinessId
  ): Promise<AnalyticsProjection | undefined>;
  deleteProjection(
    projectionType: AnalyticsProjectionType,
    projectionId: AnalyticsProjectionId
  ): Promise<boolean>;
}

export function getAnalyticsProjectionType(
  projection: AnalyticsProjection
): AnalyticsProjectionType {
  if ("snapshotId" in projection) {
    return "BusinessPerformanceSnapshot";
  }

  if ("trendId" in projection) {
    return "TrendAnalysis";
  }

  if ("dashboardId" in projection) {
    return "ExecutiveDashboard";
  }

  return "PerformanceHealthScore";
}

export function getAnalyticsProjectionId(
  projection: AnalyticsProjection
): AnalyticsProjectionId {
  const projectionType = getAnalyticsProjectionType(projection);

  if (projectionType === "BusinessPerformanceSnapshot") {
    return (projection as BusinessPerformanceSnapshot).snapshotId;
  }

  if (projectionType === "TrendAnalysis") {
    return (projection as TrendAnalysis).trendId;
  }

  if (projectionType === "ExecutiveDashboard") {
    return (projection as ExecutiveDashboard).dashboardId;
  }

  return (projection as PerformanceHealthScore).healthScoreId;
}

export function getAnalyticsProjectionBusinessId(
  projection: AnalyticsProjection
): BusinessId {
  return projection.businessId;
}

export function getAnalyticsProjectionGeneratedAt(
  projection: AnalyticsProjection
): string {
  return projection.toSnapshot().generatedAt;
}
