import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
  ExecutiveDashboardCalculator,
  KPI,
  TrendAnalysis,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
  type TrendAnalysisId,
} from "../src";
import {
  ExecutiveDashboard as PublicExecutiveDashboard,
  ExecutiveDashboardCalculator as PublicExecutiveDashboardCalculator,
} from "../src/analytics";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const dashboardId = "dashboard-1" as ExecutiveDashboardId;
const trendId = "trend-1" as TrendAnalysisId;

function createKPI(input: {
  readonly id: string;
  readonly category: string;
  readonly actualValue?: number;
  readonly businessId?: BusinessId;
}) {
  return KPI.create({
    kpiId: input.id as KPIId,
    businessId: input.businessId ?? businessId,
    name: "KPI",
    category: input.category,
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
  readonly kpis: readonly KPI[];
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
    kpis: input.kpis,
  });
}

function baselineSnapshot() {
  return createSnapshot({
    id: "snapshot-1",
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    kpis: [
      createKPI({ id: "kpi-1", category: "Revenue", actualValue: 80 }),
      createKPI({ id: "kpi-2", category: "CRM", actualValue: 100 }),
      createKPI({ id: "kpi-3", category: "Content" }),
    ],
  });
}

function comparisonSnapshot() {
  return createSnapshot({
    id: "snapshot-2",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    kpis: [
      createKPI({ id: "kpi-4", category: "Revenue", actualValue: 120 }),
      createKPI({ id: "kpi-5", category: "CRM", actualValue: 90 }),
      createKPI({ id: "kpi-6", category: "Content" }),
    ],
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

function createDashboard(
  performanceSnapshot = comparisonSnapshot(),
  trendAnalysis = createTrend(baselineSnapshot(), performanceSnapshot)
) {
  return ExecutiveDashboard.create({
    dashboardId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    performanceSnapshot,
    trendAnalysis,
  });
}

describe("ExecutiveDashboard", () => {
  it("creates immutable executive dashboard from analytical inputs", () => {
    const dashboard = createDashboard();
    const snapshot = dashboard.toSnapshot();

    expect(snapshot).toMatchObject({
      dashboardId,
      businessId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      dashboardStatus: "Exceeded",
      reportingPeriod: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      executiveSummary: {
        totalKPIs: 3,
        achievedKPIs: 1,
        overallAchievement: 105,
        overallTrend: "Improving",
        generatedAt: "2026-07-01T00:00:00.000Z",
      },
    });
    expect(snapshot.performanceSnapshot.snapshotId).toBe("snapshot-2");
    expect(snapshot.trendAnalysis.comparisonSnapshotId).toBe("snapshot-2");
    expect(Object.isFrozen(snapshot.performanceSnapshot.kpis)).toBe(true);
    expect(Object.isFrozen(snapshot.trendAnalysis.metricComparisons)).toBe(true);
  });

  it("derives strongest and weakest categories while ignoring undefined averages", () => {
    const summary = createDashboard().toSnapshot().executiveSummary;

    expect(summary.strongestCategory).toMatchObject({
      category: "Revenue",
      averageAchievement: 120,
    });
    expect(summary.weakestCategory).toMatchObject({
      category: "CRM",
      averageAchievement: 90,
    });
    expect(summary.strongestCategory?.category).not.toBe("Content");
    expect(summary.weakestCategory?.category).not.toBe("Content");
  });

  it("rejects invalid dashboard inputs", () => {
    const snapshot = comparisonSnapshot();
    const trend = createTrend(baselineSnapshot(), snapshot);
    const unrelatedSnapshot = createSnapshot({
      id: "snapshot-3",
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-08-01T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-7", category: "Revenue", actualValue: 110 })],
    });
    const otherBusinessSnapshot = createSnapshot({
      id: "snapshot-2",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      kpis: [
        createKPI({
          id: "kpi-8",
          category: "Revenue",
          actualValue: 120,
          businessId: otherBusinessId,
        }),
      ],
      businessId: otherBusinessId,
    });

    expect(() =>
      ExecutiveDashboard.create({
        dashboardId: "" as ExecutiveDashboardId,
        generatedAt: "2026-07-01T00:00:00.000Z",
        performanceSnapshot: snapshot,
        trendAnalysis: trend,
      })
    ).toThrow("Executive dashboard ID is required.");
    expect(() =>
      ExecutiveDashboard.create({
        dashboardId,
        generatedAt: "not-a-date",
        performanceSnapshot: snapshot,
        trendAnalysis: trend,
      })
    ).toThrow("Executive dashboard generatedAt must be a valid timestamp.");
    expect(() => createDashboard(otherBusinessSnapshot, trend)).toThrow(
      "Executive dashboard analytical inputs must belong to the same business."
    );
    expect(() => createDashboard(unrelatedSnapshot, trend)).toThrow(
      "Executive dashboard trend analysis must reference the performance snapshot."
    );
  });

  it("calculates deterministically through the calculator", () => {
    const calculator = new ExecutiveDashboardCalculator();
    const performanceSnapshot = comparisonSnapshot();
    const trendAnalysis = createTrend(baselineSnapshot(), performanceSnapshot);
    const input = {
      dashboardId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      performanceSnapshot,
      trendAnalysis,
    };

    expect(calculator.calculate(input).toSnapshot()).toEqual(
      calculator.calculate(input).toSnapshot()
    );
  });

  it("exports executive dashboard primitives from the analytics module", () => {
    expect(PublicExecutiveDashboard).toBe(ExecutiveDashboard);
    expect(PublicExecutiveDashboardCalculator).toBe(ExecutiveDashboardCalculator);
  });
});
