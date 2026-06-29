import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
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

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const healthScoreId = "health-score-1" as PerformanceHealthScoreId;
const dashboardId = "dashboard-1" as ExecutiveDashboardId;
const trendId = "trend-1" as TrendAnalysisId;

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

function createDashboard(input?: { readonly businessId?: BusinessId }) {
  const dashboardBusinessId = input?.businessId ?? businessId;
  const baseline = createSnapshot({
    id: "snapshot-1",
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    actualValue: 80,
    businessId: dashboardBusinessId,
  });
  const comparison = createSnapshot({
    id: "snapshot-2",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    actualValue: 100,
    businessId: dashboardBusinessId,
  });
  const trend = TrendAnalysis.create({
    trendId,
    baselineSnapshot: baseline,
    comparisonSnapshot: comparison,
    generatedAt: "2026-07-01T00:00:00.000Z",
  });

  return ExecutiveDashboard.create({
    dashboardId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    performanceSnapshot: comparison,
    trendAnalysis: trend,
  });
}

describe("PerformanceHealthScore application orchestration", () => {
  it("creates performance health score", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createPerformanceHealthScore({
      commandType: "CreatePerformanceHealthScore",
      context,
      healthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard: createDashboard(),
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.healthScore.toSnapshot()).toMatchObject({
        healthScoreId,
        businessId,
        overallScore: 100,
        healthGrade: "A",
        healthStatus: "Excellent",
      });
    }
  });

  it("evaluates performance health score", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.evaluatePerformanceHealthScore({
      queryType: "EvaluatePerformanceHealthScore",
      context,
      healthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard: createDashboard(),
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.healthScore.toSnapshot().weightedMetrics).toHaveLength(4);
    }
  });

  it("rejects dashboard outside request business", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createPerformanceHealthScore({
      commandType: "CreatePerformanceHealthScore",
      context,
      healthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard: createDashboard({ businessId: otherBusinessId }),
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message:
          "Performance health score dashboard must belong to the request business.",
      });
    }
  });

  it("propagates domain validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createPerformanceHealthScore({
      commandType: "CreatePerformanceHealthScore",
      context,
      healthScoreId: "" as PerformanceHealthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard: createDashboard(),
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Performance health score ID is required.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
