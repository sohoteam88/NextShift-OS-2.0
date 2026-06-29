import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
  InMemoryAnalyticsRepository,
  KPI,
  PerformanceHealthScore,
  TrendAnalysis,
  type AnalyticsProjectionType,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
  type PerformanceHealthScoreId,
  type TrendAnalysisId,
} from "../src";
import {
  InMemoryAnalyticsRepository as PublicInMemoryAnalyticsRepository,
} from "../src/analytics";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;

function createKPI(input: {
  readonly id: string;
  readonly category?: string;
  readonly actualValue: number;
  readonly businessId?: BusinessId;
}) {
  return KPI.create({
    kpiId: input.id as KPIId,
    businessId: input.businessId ?? businessId,
    name: "KPI",
    category: input.category ?? "Revenue",
    targetValue: 100,
    actualValue: input.actualValue,
    unit: "points",
    measurementDate: "2026-06-28T00:00:00.000Z",
  });
}

function createSnapshot(input: {
  readonly id: string;
  readonly start: string;
  readonly end: string;
  readonly actualValue: number;
  readonly businessId?: BusinessId;
}) {
  return BusinessPerformanceSnapshot.create({
    snapshotId: input.id as BusinessPerformanceSnapshotId,
    businessId: input.businessId ?? businessId,
    reportingPeriod: {
      start: input.start,
      end: input.end,
    },
    generatedAt: input.end,
    kpis: [
      createKPI({
        id: `${input.id}-kpi`,
        actualValue: input.actualValue,
        businessId: input.businessId,
      }),
    ],
  });
}

function baselineSnapshot(business = businessId) {
  return createSnapshot({
    id: `snapshot-baseline-${business}`,
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    actualValue: 80,
    businessId: business,
  });
}

function comparisonSnapshot(input?: {
  readonly id?: string;
  readonly actualValue?: number;
  readonly businessId?: BusinessId;
}) {
  return createSnapshot({
    id: input?.id ?? "snapshot-comparison",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    actualValue: input?.actualValue ?? 100,
    businessId: input?.businessId ?? businessId,
  });
}

function createTrend(input?: {
  readonly id?: string;
  readonly comparison?: BusinessPerformanceSnapshot;
  readonly businessId?: BusinessId;
}) {
  const business = input?.businessId ?? businessId;
  const comparison = input?.comparison ?? comparisonSnapshot({ businessId: business });

  return TrendAnalysis.create({
    trendId: (input?.id ?? "trend-1") as TrendAnalysisId,
    baselineSnapshot: baselineSnapshot(business),
    comparisonSnapshot: comparison,
    generatedAt: comparison.toSnapshot().generatedAt,
  });
}

function createDashboard(input?: {
  readonly id?: string;
  readonly comparison?: BusinessPerformanceSnapshot;
  readonly trend?: TrendAnalysis;
}) {
  const comparison = input?.comparison ?? comparisonSnapshot();

  return ExecutiveDashboard.create({
    dashboardId: (input?.id ?? "dashboard-1") as ExecutiveDashboardId,
    generatedAt: comparison.toSnapshot().generatedAt,
    performanceSnapshot: comparison,
    trendAnalysis: input?.trend ?? createTrend({ comparison }),
  });
}

function createHealthScore(input?: {
  readonly id?: string;
  readonly dashboard?: ExecutiveDashboard;
}) {
  const dashboard = input?.dashboard ?? createDashboard();

  return PerformanceHealthScore.create({
    healthScoreId: (input?.id ?? "health-score-1") as PerformanceHealthScoreId,
    generatedAt: dashboard.toSnapshot().generatedAt,
    executiveDashboard: dashboard,
  });
}

describe("InMemoryAnalyticsRepository", () => {
  it("saves and retrieves each supported projection type", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const snapshot = comparisonSnapshot();
    const trend = createTrend({ comparison: snapshot });
    const dashboard = createDashboard({ comparison: snapshot, trend });
    const healthScore = createHealthScore({ dashboard });

    await repository.saveBusinessPerformanceSnapshot(snapshot);
    await repository.saveTrendAnalysis(trend);
    await repository.saveExecutiveDashboard(dashboard);
    await repository.savePerformanceHealthScore(healthScore);

    await expect(
      repository.getBusinessPerformanceSnapshotById(snapshot.snapshotId)
    ).resolves.toBe(snapshot);
    await expect(repository.getTrendAnalysisById(trend.trendId)).resolves.toBe(
      trend
    );
    await expect(
      repository.getExecutiveDashboardById(dashboard.dashboardId)
    ).resolves.toBe(dashboard);
    await expect(
      repository.getPerformanceHealthScoreById(healthScore.healthScoreId)
    ).resolves.toBe(healthScore);
  });

  it("replaces projections with the same type and ID", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const first = comparisonSnapshot({
      id: "snapshot-replace",
      actualValue: 80,
    });
    const second = comparisonSnapshot({
      id: "snapshot-replace",
      actualValue: 120,
    });

    await repository.saveProjection(first);
    await repository.saveProjection(second);

    const stored = await repository.getProjectionById(
      "BusinessPerformanceSnapshot",
      first.snapshotId
    );

    expect(stored?.toSnapshot()).toMatchObject({
      snapshotId: "snapshot-replace",
      overallAchievement: 120,
    });
  });

  it("lists by business and projection type in deterministic order", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const first = createSnapshot({
      id: "snapshot-b",
      start: "2026-04-01T00:00:00.000Z",
      end: "2026-05-01T00:00:00.000Z",
      actualValue: 80,
    });
    const second = createSnapshot({
      id: "snapshot-a",
      start: "2026-04-01T00:00:00.000Z",
      end: "2026-05-01T00:00:00.000Z",
      actualValue: 90,
    });
    const third = createSnapshot({
      id: "snapshot-c",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      actualValue: 100,
    });
    const otherBusiness = comparisonSnapshot({
      id: "snapshot-other",
      businessId: otherBusinessId,
    });

    await repository.saveProjection(first);
    await repository.saveProjection(second);
    await repository.saveProjection(third);
    await repository.saveProjection(otherBusiness);
    await repository.saveProjection(createTrend({ comparison: third }));

    const snapshots = await repository.listByBusiness(
      "BusinessPerformanceSnapshot",
      businessId
    );

    expect(snapshots.map((projection) => projection.toSnapshot())).toMatchObject([
      { snapshotId: "snapshot-a" },
      { snapshotId: "snapshot-b" },
      { snapshotId: "snapshot-c" },
    ]);
  });

  it("gets latest projection by business with deterministic tie-breaker", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const first = createSnapshot({
      id: "snapshot-b",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      actualValue: 100,
    });
    const second = createSnapshot({
      id: "snapshot-a",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      actualValue: 110,
    });

    await repository.saveProjection(first);
    await repository.saveProjection(second);

    const latest = await repository.getLatestByBusiness(
      "BusinessPerformanceSnapshot",
      businessId
    );

    expect(latest?.toSnapshot()).toMatchObject({ snapshotId: "snapshot-a" });
  });

  it("deletes projections and returns missing projections as undefined", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const snapshot = comparisonSnapshot();

    expect(
      await repository.getProjectionById(
        "BusinessPerformanceSnapshot",
        snapshot.snapshotId
      )
    ).toBeUndefined();
    await repository.saveProjection(snapshot);
    await expect(
      repository.deleteProjection(
        "BusinessPerformanceSnapshot",
        snapshot.snapshotId
      )
    ).resolves.toBe(true);
    await expect(
      repository.deleteProjection(
        "BusinessPerformanceSnapshot",
        snapshot.snapshotId
      )
    ).resolves.toBe(false);
  });

  it("returns immutable defensive snapshots from retrieved projections", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const snapshot = comparisonSnapshot();

    await repository.saveProjection(snapshot);

    const stored = await repository.getBusinessPerformanceSnapshotById(
      snapshot.snapshotId
    );
    const storedSnapshot = stored?.toSnapshot();

    expect(storedSnapshot).toBeDefined();
    expect(storedSnapshot).not.toBe(snapshot.toSnapshot());
    expect(Object.isFrozen(storedSnapshot?.kpis)).toBe(true);
  });

  it("exports repository primitives from analytics module", () => {
    expect(PublicInMemoryAnalyticsRepository).toBe(InMemoryAnalyticsRepository);
  });

  it("supports each projection type through the generic API", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const snapshot = comparisonSnapshot();
    const trend = createTrend({ comparison: snapshot });
    const dashboard = createDashboard({ comparison: snapshot, trend });
    const healthScore = createHealthScore({ dashboard });
    const projections = [
      ["BusinessPerformanceSnapshot", snapshot],
      ["TrendAnalysis", trend],
      ["ExecutiveDashboard", dashboard],
      ["PerformanceHealthScore", healthScore],
    ] as const;

    for (const [, projection] of projections) {
      await repository.saveProjection(projection);
    }

    for (const [projectionType, projection] of projections) {
      const stored = await repository.getProjectionById(
        projectionType as AnalyticsProjectionType,
        projection.toSnapshot()[
          projectionType === "BusinessPerformanceSnapshot"
            ? "snapshotId"
            : projectionType === "TrendAnalysis"
              ? "trendId"
              : projectionType === "ExecutiveDashboard"
                ? "dashboardId"
                : "healthScoreId"
        ]
      );

      expect(stored).toBe(projection);
    }
  });
});
