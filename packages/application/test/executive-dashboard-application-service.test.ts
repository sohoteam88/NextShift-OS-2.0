import {
  BusinessPerformanceSnapshot,
  KPI,
  TrendAnalysis,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
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
const dashboardId = "dashboard-1" as ExecutiveDashboardId;
const trendId = "trend-1" as TrendAnalysisId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

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

function baselineSnapshot() {
  return createSnapshot({
    id: "snapshot-1",
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    actualValue: 80,
  });
}

function comparisonSnapshot() {
  return createSnapshot({
    id: "snapshot-2",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    actualValue: 100,
  });
}

function createTrend(
  baseline = baselineSnapshot(),
  comparison = comparisonSnapshot()
) {
  return TrendAnalysis.create({
    trendId,
    baselineSnapshot: baseline,
    comparisonSnapshot: comparison,
    generatedAt: "2026-07-01T00:00:00.000Z",
  });
}

describe("ExecutiveDashboard application orchestration", () => {
  it("creates executive dashboard", async () => {
    const service = new AnalyticsApplicationService();
    const performanceSnapshot = comparisonSnapshot();

    const result = await service.createExecutiveDashboard({
      commandType: "CreateExecutiveDashboard",
      context,
      dashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot,
      trendAnalysis: createTrend(baselineSnapshot(), performanceSnapshot),
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.dashboard.toSnapshot()).toMatchObject({
        dashboardId,
        businessId,
        dashboardStatus: "Achieved",
        executiveSummary: {
          totalKPIs: 1,
          achievedKPIs: 1,
          overallAchievement: 100,
          overallTrend: "Improving",
        },
      });
    }
  });

  it("evaluates executive dashboard", async () => {
    const service = new AnalyticsApplicationService();
    const performanceSnapshot = comparisonSnapshot();

    const result = await service.evaluateExecutiveDashboard({
      queryType: "EvaluateExecutiveDashboard",
      context,
      dashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot,
      trendAnalysis: createTrend(baselineSnapshot(), performanceSnapshot),
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.dashboard.toSnapshot().performanceSnapshot.snapshotId).toBe(
        "snapshot-2"
      );
    }
  });

  it("rejects analytical inputs outside request business", async () => {
    const service = new AnalyticsApplicationService();
    const performanceSnapshot = createSnapshot({
      id: "snapshot-4",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      actualValue: 100,
      businessId: otherBusinessId,
    });
    const trendAnalysis = createTrend(
      createSnapshot({
        id: "snapshot-3",
        start: "2026-05-01T00:00:00.000Z",
        end: "2026-06-01T00:00:00.000Z",
        actualValue: 80,
        businessId: otherBusinessId,
      }),
      performanceSnapshot
    );

    const result = await service.createExecutiveDashboard({
      commandType: "CreateExecutiveDashboard",
      context,
      dashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot,
      trendAnalysis,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message:
          "Executive dashboard analytical inputs must belong to the request business.",
      });
    }
  });

  it("propagates domain validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createExecutiveDashboard({
      commandType: "CreateExecutiveDashboard",
      context,
      dashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot: createSnapshot({
        id: "snapshot-3",
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-08-01T00:00:00.000Z",
        actualValue: 100,
      }),
      trendAnalysis: createTrend(),
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message:
          "Executive dashboard trend analysis must reference the performance snapshot.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
