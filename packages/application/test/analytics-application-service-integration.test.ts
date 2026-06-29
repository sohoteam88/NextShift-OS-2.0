import {
  BusinessPerformanceSnapshot,
  InMemoryAnalyticsRepository,
  KPI,
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
import type {
  BuildAnalyticsInsightCommand,
  ClearAnalyticsInsightCommand,
  EvaluateAnalyticsInsightQuery,
  GetAnalyticsInsightQuery,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

const baselineReportingPeriod = {
  start: "2026-05-01T00:00:00.000Z",
  end: "2026-06-01T00:00:00.000Z",
};

const comparisonReportingPeriod = {
  start: "2026-06-01T00:00:00.000Z",
  end: "2026-07-01T00:00:00.000Z",
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

function baselineSnapshot(input?: { readonly businessId?: BusinessId }) {
  return createSnapshot({
    id: "snapshot-baseline",
    start: baselineReportingPeriod.start,
    end: baselineReportingPeriod.end,
    actualValue: 80,
    businessId: input?.businessId,
  });
}

function comparisonSnapshot(input?: { readonly businessId?: BusinessId }) {
  return createSnapshot({
    id: "snapshot-comparison",
    start: comparisonReportingPeriod.start,
    end: comparisonReportingPeriod.end,
    actualValue: 100,
    businessId: input?.businessId,
  });
}

function buildCommand(
  input?: Partial<
    Omit<BuildAnalyticsInsightCommand, "commandType" | "context">
  >
): BuildAnalyticsInsightCommand {
  return {
    commandType: "BuildAnalyticsInsight",
    context,
    baselineSnapshotId:
      input?.baselineSnapshotId ??
      ("snapshot-baseline" as BusinessPerformanceSnapshotId),
    comparisonSnapshotId:
      input?.comparisonSnapshotId ??
      ("snapshot-comparison" as BusinessPerformanceSnapshotId),
    trendId: input?.trendId ?? ("trend-1" as TrendAnalysisId),
    dashboardId: input?.dashboardId ?? ("dashboard-1" as ExecutiveDashboardId),
    healthScoreId:
      input?.healthScoreId ?? ("health-score-1" as PerformanceHealthScoreId),
    baselineReportingPeriod:
      input?.baselineReportingPeriod ?? baselineReportingPeriod,
    comparisonReportingPeriod:
      input?.comparisonReportingPeriod ?? comparisonReportingPeriod,
    generatedAt: input?.generatedAt ?? "2026-07-01T00:00:00.000Z",
    baselineKPIs:
      input?.baselineKPIs ??
      [createKPI({ id: "baseline-kpi", actualValue: 80 })],
    comparisonKPIs:
      input?.comparisonKPIs ??
      [createKPI({ id: "comparison-kpi", actualValue: 100 })],
    persist: input?.persist ?? true,
  };
}

function evaluateQuery(
  input?: Partial<
    Omit<EvaluateAnalyticsInsightQuery, "queryType" | "context">
  >
): EvaluateAnalyticsInsightQuery {
  const command = buildCommand(input);

  return {
    queryType: "EvaluateAnalyticsInsight",
    context,
    baselineSnapshotId: command.baselineSnapshotId,
    comparisonSnapshotId: command.comparisonSnapshotId,
    trendId: command.trendId,
    dashboardId: command.dashboardId,
    healthScoreId: command.healthScoreId,
    baselineReportingPeriod: command.baselineReportingPeriod,
    comparisonReportingPeriod: command.comparisonReportingPeriod,
    generatedAt: command.generatedAt,
    baselineKPIs: command.baselineKPIs,
    comparisonKPIs: command.comparisonKPIs,
  };
}

describe("Analytics insight application orchestration", () => {
  it("builds the full analytical projection set", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.buildAnalyticsInsight(
      buildCommand({ persist: false })
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.persisted).toBe(false);
      expect(result.value.baselineSnapshot.toSnapshot()).toMatchObject({
        snapshotId: "snapshot-baseline",
        businessId,
      });
      expect(result.value.comparisonSnapshot.toSnapshot()).toMatchObject({
        snapshotId: "snapshot-comparison",
        businessId,
      });
      expect(result.value.trendAnalysis.toSnapshot()).toMatchObject({
        trendId: "trend-1",
        overallTrend: "Improving",
      });
      expect(result.value.executiveDashboard.toSnapshot()).toMatchObject({
        dashboardId: "dashboard-1",
        dashboardStatus: "Achieved",
      });
      expect(result.value.performanceHealthScore.toSnapshot()).toMatchObject({
        healthScoreId: "health-score-1",
        healthGrade: "A",
      });
    }
  });

  it("persists generated projections when requested", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );

    const result = await service.buildAnalyticsInsight(buildCommand());

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.persisted).toBe(true);
    }

    expect(
      await repository.listByBusiness("BusinessPerformanceSnapshot", businessId)
    ).toHaveLength(2);
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

  it("evaluates the full projection set without repository writes", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );

    const result = await service.evaluateAnalyticsInsight(evaluateQuery());

    expect(result.ok).toBe(true);
    expect(
      await repository.listByBusiness("BusinessPerformanceSnapshot", businessId)
    ).toHaveLength(0);
    expect(await repository.listByBusiness("TrendAnalysis", businessId)).toHaveLength(
      0
    );
  });

  it("gets latest analytics insight projections by business", async () => {
    const service = new AnalyticsApplicationService();

    await service.buildAnalyticsInsight(buildCommand());
    const result = await service.getAnalyticsInsight({
      queryType: "GetAnalyticsInsight",
      context,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.businessPerformanceSnapshot?.businessId).toBe(businessId);
      expect(result.value.trendAnalysis?.businessId).toBe(businessId);
      expect(result.value.executiveDashboard?.businessId).toBe(businessId);
      expect(result.value.performanceHealthScore?.businessId).toBe(businessId);
    }
  });

  it("gets partial analytics insight results when repository data is incomplete", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );
    const trend = TrendAnalysis.create({
      trendId: "trend-only" as TrendAnalysisId,
      baselineSnapshot: baselineSnapshot(),
      comparisonSnapshot: comparisonSnapshot(),
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    await repository.saveTrendAnalysis(trend);

    const query: GetAnalyticsInsightQuery = {
      queryType: "GetAnalyticsInsight",
      context,
    };
    const result = await service.getAnalyticsInsight(query);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.businessPerformanceSnapshot).toBeUndefined();
      expect(result.value.trendAnalysis).toBe(trend);
      expect(result.value.executiveDashboard).toBeUndefined();
      expect(result.value.performanceHealthScore).toBeUndefined();
    }
  });

  it("clears requested analytics insight projections", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );

    await service.buildAnalyticsInsight(buildCommand());
    const command: ClearAnalyticsInsightCommand = {
      commandType: "ClearAnalyticsInsight",
      context,
      projectionIds: {
        businessPerformanceSnapshotId:
          "snapshot-comparison" as BusinessPerformanceSnapshotId,
        trendAnalysisId: "trend-1" as TrendAnalysisId,
        executiveDashboardId: "dashboard-1" as ExecutiveDashboardId,
        performanceHealthScoreId: "health-score-1" as PerformanceHealthScoreId,
      },
    };

    const result = await service.clearAnalyticsInsight(command);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toMatchObject({
        businessPerformanceSnapshotDeleted: true,
        trendAnalysisDeleted: true,
        executiveDashboardDeleted: true,
        performanceHealthScoreDeleted: true,
      });
    }

    expect(
      await repository.getBusinessPerformanceSnapshotById(
        "snapshot-comparison" as BusinessPerformanceSnapshotId
      )
    ).toBeUndefined();
    expect(
      await repository.getTrendAnalysisById("trend-1" as TrendAnalysisId)
    ).toBeUndefined();
  });

  it("validates request business before clearing existing projections", async () => {
    const repository = new InMemoryAnalyticsRepository();
    const service = new AnalyticsApplicationService(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      repository
    );
    const otherSnapshot = baselineSnapshot({ businessId: otherBusinessId });

    await repository.saveBusinessPerformanceSnapshot(otherSnapshot);

    const result = await service.clearAnalyticsInsight({
      commandType: "ClearAnalyticsInsight",
      context,
      projectionIds: {
        businessPerformanceSnapshotId: otherSnapshot.snapshotId,
      },
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Analytics projection must belong to the request business.",
      });
    }
  });

  it("propagates domain validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.buildAnalyticsInsight(
      buildCommand({
        trendId: "" as TrendAnalysisId,
      })
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Trend analysis ID is required.",
      });
    }
  });

  it("propagates analytical business validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.buildAnalyticsInsight(
      buildCommand({
        baselineKPIs: [
          createKPI({
            id: "baseline-other-kpi",
            actualValue: 80,
            businessId: otherBusinessId,
          }),
        ],
      })
    );

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "All KPIs must belong to the snapshot business.",
      });
    }
  });

  it("keeps existing S-001 through S-006 methods and public exports available", () => {
    const service = new AnalyticsApplicationService();

    expect(service.createKPI).toEqual(expect.any(Function));
    expect(service.evaluateKPI).toEqual(expect.any(Function));
    expect(service.getKPISummary).toEqual(expect.any(Function));
    expect(service.createBusinessPerformanceSnapshot).toEqual(expect.any(Function));
    expect(service.evaluateBusinessPerformanceSnapshot).toEqual(
      expect.any(Function)
    );
    expect(service.createTrendAnalysis).toEqual(expect.any(Function));
    expect(service.evaluateTrendAnalysis).toEqual(expect.any(Function));
    expect(service.createExecutiveDashboard).toEqual(expect.any(Function));
    expect(service.evaluateExecutiveDashboard).toEqual(expect.any(Function));
    expect(service.createPerformanceHealthScore).toEqual(expect.any(Function));
    expect(service.evaluatePerformanceHealthScore).toEqual(expect.any(Function));
    expect(service.saveAnalyticsProjection).toEqual(expect.any(Function));
    expect(service.getAnalyticsProjection).toEqual(expect.any(Function));
    expect(service.listAnalyticsProjections).toEqual(expect.any(Function));
    expect(service.getLatestAnalyticsProjection).toEqual(expect.any(Function));
    expect(service.deleteAnalyticsProjection).toEqual(expect.any(Function));
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
