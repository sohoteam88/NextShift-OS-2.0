import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessPerformanceSnapshot,
  ExecutiveDashboard,
  KPI,
  PerformanceHealthScore,
  PerformanceHealthScoreCalculator,
  TrendAnalysis,
  type BusinessPerformanceSnapshotId,
  type ExecutiveDashboardId,
  type KPIId,
  type PerformanceHealthScoreId,
  type TrendAnalysisId,
} from "../src";
import {
  PerformanceHealthScore as PublicPerformanceHealthScore,
  PerformanceHealthScoreCalculator as PublicPerformanceHealthScoreCalculator,
} from "../src/analytics";

const businessId = "business-1" as BusinessId;
const healthScoreId = "health-score-1" as PerformanceHealthScoreId;
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

function createDashboard(input: {
  readonly baseline: readonly { category: string; actualValue?: number }[];
  readonly comparison: readonly { category: string; actualValue?: number }[];
}) {
  const baselineSnapshot = createSnapshot({
    id: "snapshot-1",
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    kpis: input.baseline.map((kpi, index) =>
      createKPI({
        id: `baseline-kpi-${index}`,
        category: kpi.category,
        actualValue: kpi.actualValue,
      })
    ),
  });
  const comparisonSnapshot = createSnapshot({
    id: "snapshot-2",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    kpis: input.comparison.map((kpi, index) =>
      createKPI({
        id: `comparison-kpi-${index}`,
        category: kpi.category,
        actualValue: kpi.actualValue,
      })
    ),
  });
  const trendAnalysis = TrendAnalysis.create({
    trendId,
    baselineSnapshot,
    comparisonSnapshot,
    generatedAt: "2026-07-01T00:00:00.000Z",
  });

  return ExecutiveDashboard.create({
    dashboardId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    performanceSnapshot: comparisonSnapshot,
    trendAnalysis,
  });
}

function createHealthScore(
  executiveDashboard = createDashboard({
    baseline: [
      { category: "Revenue", actualValue: 80 },
      { category: "CRM", actualValue: 100 },
      { category: "Content" },
    ],
    comparison: [
      { category: "Revenue", actualValue: 120 },
      { category: "CRM", actualValue: 90 },
      { category: "Content" },
    ],
  })
) {
  return PerformanceHealthScore.create({
    healthScoreId,
    generatedAt: "2026-07-01T00:00:00.000Z",
    executiveDashboard,
  });
}

describe("PerformanceHealthScore", () => {
  it("creates immutable health score with weighted metrics", () => {
    const healthScore = createHealthScore();
    const snapshot = healthScore.toSnapshot();

    expect(snapshot).toMatchObject({
      healthScoreId,
      businessId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      reportingPeriod: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      healthGrade: "B",
      healthStatus: "Healthy",
    });
    expect(snapshot.overallScore).toBeCloseTo(82.16666666666666);
    expect(snapshot.weightedMetrics).toEqual([
      {
        metricName: "Overall Achievement",
        weight: 40,
        rawValue: 105,
        normalizedScore: 100,
        weightedContribution: 40,
      },
      {
        metricName: "Overall Trend",
        weight: 25,
        rawValue: 100,
        normalizedScore: 100,
        weightedContribution: 25,
      },
      {
        metricName: "KPI Completion Rate",
        weight: 20,
        rawValue: 33.33333333333333,
        normalizedScore: 33.33333333333333,
        weightedContribution: 6.666666666666665,
      },
      {
        metricName: "Category Balance",
        weight: 15,
        rawValue: 70,
        normalizedScore: 70,
        weightedContribution: 10.5,
      },
    ]);
    expect(
      snapshot.weightedMetrics.reduce((total, metric) => total + metric.weight, 0)
    ).toBe(100);
    expect(Object.isFrozen(snapshot.weightedMetrics)).toBe(true);
    expect(Object.isFrozen(snapshot.executiveDashboard)).toBe(true);
  });

  it("derives every grade and health status", () => {
    const cases = [
      {
        dashboard: createDashboard({
          baseline: [{ category: "Revenue", actualValue: 80 }],
          comparison: [{ category: "Revenue", actualValue: 100 }],
        }),
        grade: "A",
        status: "Excellent",
      },
      {
        dashboard: createDashboard({
          baseline: [
            { category: "Revenue", actualValue: 80 },
            { category: "CRM", actualValue: 100 },
            { category: "Content" },
          ],
          comparison: [
            { category: "Revenue", actualValue: 120 },
            { category: "CRM", actualValue: 90 },
            { category: "Content" },
          ],
        }),
        grade: "B",
        status: "Healthy",
      },
      {
        dashboard: createDashboard({
          baseline: [
            { category: "Revenue", actualValue: 60 },
            { category: "CRM", actualValue: 60 },
          ],
          comparison: [
            { category: "Revenue", actualValue: 100 },
            { category: "CRM", actualValue: 60 },
          ],
        }),
        grade: "C",
        status: "Watch",
      },
      {
        dashboard: createDashboard({
          baseline: [
            { category: "Revenue", actualValue: 100 },
            { category: "CRM", actualValue: 40 },
          ],
          comparison: [
            { category: "Revenue", actualValue: 100 },
            { category: "CRM", actualValue: 40 },
          ],
        }),
        grade: "D",
        status: "AtRisk",
      },
      {
        dashboard: createDashboard({
          baseline: [{ category: "Revenue", actualValue: 100 }],
          comparison: [{ category: "Revenue", actualValue: 50 }],
        }),
        grade: "F",
        status: "Critical",
      },
    ];

    for (const current of cases) {
      const snapshot = createHealthScore(current.dashboard).toSnapshot();

      expect(snapshot.healthGrade).toBe(current.grade);
      expect(snapshot.healthStatus).toBe(current.status);
    }
  });

  it("rejects invalid health score inputs", () => {
    const dashboard = createDashboard({
      baseline: [{ category: "Revenue", actualValue: 80 }],
      comparison: [{ category: "Revenue", actualValue: 100 }],
    });

    expect(() =>
      PerformanceHealthScore.create({
        healthScoreId: "" as PerformanceHealthScoreId,
        generatedAt: "2026-07-01T00:00:00.000Z",
        executiveDashboard: dashboard,
      })
    ).toThrow("Performance health score ID is required.");
    expect(() =>
      PerformanceHealthScore.create({
        healthScoreId,
        generatedAt: "not-a-date",
        executiveDashboard: dashboard,
      })
    ).toThrow(
      "Performance health score generatedAt must be a valid timestamp."
    );
    expect(() =>
      PerformanceHealthScore.create({
        healthScoreId,
        generatedAt: "2026-07-01T00:00:00.000Z",
        executiveDashboard: undefined as unknown as ExecutiveDashboard,
      })
    ).toThrow("Performance health score executive dashboard is required.");
  });

  it("clamps scores to the valid range", () => {
    const snapshot = createHealthScore(
      createDashboard({
        baseline: [{ category: "Revenue", actualValue: 100 }],
        comparison: [{ category: "Revenue", actualValue: 150 }],
      })
    ).toSnapshot();

    const achievement = snapshot.weightedMetrics.find(
      (metric) => metric.metricName === "Overall Achievement"
    );

    expect(achievement).toMatchObject({
      rawValue: 150,
      normalizedScore: 100,
      weightedContribution: 40,
    });
    expect(snapshot.overallScore).toBe(100);
  });

  it("calculates deterministically through the calculator", () => {
    const calculator = new PerformanceHealthScoreCalculator();
    const executiveDashboard = createDashboard({
      baseline: [{ category: "Revenue", actualValue: 80 }],
      comparison: [{ category: "Revenue", actualValue: 100 }],
    });
    const input = {
      healthScoreId,
      generatedAt: "2026-07-01T00:00:00.000Z",
      executiveDashboard,
    };

    expect(calculator.calculate(input).toSnapshot()).toEqual(
      calculator.calculate(input).toSnapshot()
    );
  });

  it("exports performance health score primitives from the analytics module", () => {
    expect(PublicPerformanceHealthScore).toBe(PerformanceHealthScore);
    expect(PublicPerformanceHealthScoreCalculator).toBe(
      PerformanceHealthScoreCalculator
    );
  });
});
