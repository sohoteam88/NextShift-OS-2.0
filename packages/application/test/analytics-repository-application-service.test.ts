import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
  InMemoryAnalyticsRepository,
  KPI,
  PerformanceHealthScore,
  TrendAnalysis,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
  type PerformanceHealthScoreId,
  type TrendAnalysisId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  AnalyticsApplicationService,
  AnalyticsApplicationService as PublicAnalyticsApplicationService,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

function createKPI(input: {
  readonly id: string;
  readonly actualValue: number;
  readonly businessId?: BusinessId;
}) {
  return KPI.create({
    kpiId: input.id as KPIId,
    businessId: input.businessId ?? businessId,
    name: "KPI",
    category: "Revenue",
    targetValue: 100,
    actualValue: input.actualValue,
    unit: "points",
    measurementDate: "2026-06-28T00:00:00.000Z",
  });
}

function createSnapshot(input: {
  readonly id: string;
  readonly start?: string;
  readonly end?: string;
  readonly actualValue?: number;
  readonly businessId?: BusinessId;
}) {
  return BusinessPerformanceSnapshot.create({
    snapshotId: input.id as BusinessPerformanceSnapshotId,
    businessId: input.businessId ?? businessId,
    reportingPeriod: {
      start: input.start ?? "2026-06-01T00:00:00.000Z",
      end: input.end ?? "2026-07-01T00:00:00.000Z",
    },
    generatedAt: input.end ?? "2026-07-01T00:00:00.000Z",
    kpis: [
      createKPI({
        id: `${input.id}-kpi`,
        actualValue: input.actualValue ?? 100,
        businessId: input.businessId,
      }),
    ],
  });
}

function createTrend(comparison = createSnapshot({ id: "snapshot-2" })) {
  return TrendAnalysis.create({
    trendId: "trend-1" as TrendAnalysisId,
    baselineSnapshot: createSnapshot({
      id: "snapshot-1",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      actualValue: 80,
      businessId: comparison.businessId,
    }),
    comparisonSnapshot: comparison,
    generatedAt: comparison.toSnapshot().generatedAt,
  });
}

function createDashboard(comparison = createSnapshot({ id: "snapshot-2" })) {
  return ExecutiveDashboard.create({
    dashboardId: "dashboard-1" as ExecutiveDashboardId,
    generatedAt: comparison.toSnapshot().generatedAt,
    performanceSnapshot: comparison,
    trendAnalysis: createTrend(comparison),
  });
}

function createHealthScore(dashboard = createDashboard()) {
  return PerformanceHealthScore.create({
    healthScoreId: "health-score-1" as PerformanceHealthScoreId,
    generatedAt: dashboard.toSnapshot().generatedAt,
    executiveDashboard: dashboard,
  });
}

describe("Analytics repository application orchestration", () => {
  it("saves and gets projections through the repository", async () => {
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      new InMemoryAnalyticsRepository()
    );
    const snapshot = createSnapshot({ id: "snapshot-1" });

    const saveResult = await service.saveAnalyticsProjection({
      commandType: "SaveAnalyticsProjection",
      context,
      projection: snapshot,
    });
    const getResult = await service.getAnalyticsProjection({
      queryType: "GetAnalyticsProjection",
      context,
      projectionType: "BusinessPerformanceSnapshot",
      projectionId: snapshot.snapshotId,
    });

    expect(saveResult.ok).toBe(true);
    expect(getResult.ok).toBe(true);

    if (getResult.ok) {
      expect(getResult.value.projection).toBe(snapshot);
    }
  });

  it("lists and gets latest projections by request business", async () => {
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      new InMemoryAnalyticsRepository()
    );
    const first = createSnapshot({
      id: "snapshot-1",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      actualValue: 90,
    });
    const second = createSnapshot({
      id: "snapshot-2",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      actualValue: 100,
    });

    await service.saveAnalyticsProjection({
      commandType: "SaveAnalyticsProjection",
      context,
      projection: second,
    });
    await service.saveAnalyticsProjection({
      commandType: "SaveAnalyticsProjection",
      context,
      projection: first,
    });

    const listResult = await service.listAnalyticsProjections({
      queryType: "ListAnalyticsProjections",
      context,
      projectionType: "BusinessPerformanceSnapshot",
    });
    const latestResult = await service.getLatestAnalyticsProjection({
      queryType: "GetLatestAnalyticsProjection",
      context,
      projectionType: "BusinessPerformanceSnapshot",
    });

    expect(listResult.ok).toBe(true);
    expect(latestResult.ok).toBe(true);

    if (listResult.ok) {
      expect(listResult.value.projections.map((projection) => projection.toSnapshot()))
        .toMatchObject([{ snapshotId: "snapshot-1" }, { snapshotId: "snapshot-2" }]);
    }

    if (latestResult.ok) {
      expect(latestResult.value.projection?.toSnapshot()).toMatchObject({
        snapshotId: "snapshot-2",
      });
    }
  });

  it("deletes projections through the repository", async () => {
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      new InMemoryAnalyticsRepository()
    );
    const snapshot = createSnapshot({ id: "snapshot-1" });

    await service.saveAnalyticsProjection({
      commandType: "SaveAnalyticsProjection",
      context,
      projection: snapshot,
    });
    const deleteResult = await service.deleteAnalyticsProjection({
      commandType: "DeleteAnalyticsProjection",
      context,
      projectionType: "BusinessPerformanceSnapshot",
      projectionId: snapshot.snapshotId,
    });
    const getResult = await service.getAnalyticsProjection({
      queryType: "GetAnalyticsProjection",
      context,
      projectionType: "BusinessPerformanceSnapshot",
      projectionId: snapshot.snapshotId,
    });

    expect(deleteResult.ok).toBe(true);
    expect(getResult.ok).toBe(true);

    if (deleteResult.ok) {
      expect(deleteResult.value.deleted).toBe(true);
    }

    if (getResult.ok) {
      expect(getResult.value.projection).toBeUndefined();
    }
  });

  it("rejects saving projections outside request business", async () => {
    const service = new AnalyticsApplicationService();
    const result = await service.saveAnalyticsProjection({
      commandType: "SaveAnalyticsProjection",
      context,
      projection: createSnapshot({
        id: "snapshot-other",
        businessId: otherBusinessId,
      }),
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Analytics projection must belong to the request business.",
      });
    }
  });

  it("returns missing projections without failing", async () => {
    const service = new AnalyticsApplicationService();
    const result = await service.getAnalyticsProjection({
      queryType: "GetAnalyticsProjection",
      context,
      projectionType: "BusinessPerformanceSnapshot",
      projectionId: "missing" as BusinessPerformanceSnapshotId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.projection).toBeUndefined();
    }
  });

  it("supports all released analytical projection types", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );
    const snapshot = createSnapshot({ id: "snapshot-2" });
    const trend = createTrend(snapshot);
    const dashboard = createDashboard(snapshot);
    const healthScore = createHealthScore(dashboard);
    const projections = [snapshot, trend, dashboard, healthScore];

    for (const projection of projections) {
      const result = await service.saveAnalyticsProjection({
        commandType: "SaveAnalyticsProjection",
        context,
        projection,
      });

      expect(result.ok).toBe(true);
    }

    expect(await repository.listByBusiness("TrendAnalysis", businessId)).toHaveLength(
      1
    );
    expect(
      await repository.listByBusiness("ExecutiveDashboard", businessId)
    ).toHaveLength(1);
    expect(
      await repository.listByBusiness("PerformanceHealthScore", businessId)
    ).toHaveLength(1);
  });

  it("keeps existing analytics APIs available and exports the service", async () => {
    const service = new AnalyticsApplicationService();
    const result = await service.createKPI({
      commandType: "CreateKPI",
      context,
      kpiId: "kpi-1" as KPIId,
      name: "KPI",
      category: "Revenue",
      targetValue: 100,
      actualValue: 100,
      unit: "points",
      measurementDate: "2026-06-28T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
