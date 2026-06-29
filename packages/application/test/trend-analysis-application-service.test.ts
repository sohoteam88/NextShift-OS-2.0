import {
  BusinessPerformanceSnapshot,
  KPI,
  type BusinessPerformanceSnapshotId,
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

describe("TrendAnalysis application orchestration", () => {
  it("creates trend analysis", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createTrendAnalysis({
      commandType: "CreateTrendAnalysis",
      context,
      trendId,
      baselineSnapshot: baselineSnapshot(),
      comparisonSnapshot: comparisonSnapshot(),
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.trend.toSnapshot()).toMatchObject({
        trendId,
        businessId,
        overallGrowthRate: 25,
        overallTrend: "Improving",
      });
    }
  });

  it("evaluates trend analysis", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.evaluateTrendAnalysis({
      queryType: "EvaluateTrendAnalysis",
      context,
      trendId,
      baselineSnapshot: baselineSnapshot(),
      comparisonSnapshot: comparisonSnapshot(),
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.trend.toSnapshot().metricComparisons).toHaveLength(2);
    }
  });

  it("propagates validation failures", async () => {
    const service = new AnalyticsApplicationService();
    const otherSnapshot = createSnapshot({
      id: "snapshot-3",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      actualValue: 100,
      businessId: otherBusinessId,
    });

    const result = await service.createTrendAnalysis({
      commandType: "CreateTrendAnalysis",
      context,
      trendId,
      baselineSnapshot: baselineSnapshot(),
      comparisonSnapshot: otherSnapshot,
      generatedAt: "2026-07-01T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Trend analysis snapshots must belong to the request business.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
