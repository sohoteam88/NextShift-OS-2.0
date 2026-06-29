import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessPerformanceSnapshot,
  KPI,
  TrendAnalysis,
  TrendAnalysisCalculator,
  type BusinessPerformanceSnapshotId,
  type KPIId,
  type TrendAnalysisId,
} from "../src";
import {
  TrendAnalysis as PublicTrendAnalysis,
  TrendAnalysisCalculator as PublicTrendAnalysisCalculator,
} from "../src/analytics";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const trendId = "trend-1" as TrendAnalysisId;

function createKPI(input: {
  readonly id: string;
  readonly actualValue?: number;
  readonly category?: string;
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

function createTrend(
  baseline = createSnapshot({
    id: "snapshot-1",
    start: "2026-05-01T00:00:00.000Z",
    end: "2026-06-01T00:00:00.000Z",
    kpis: [
      createKPI({ id: "kpi-1", actualValue: 80 }),
      createKPI({ id: "kpi-2", category: "CRM", actualValue: 100 }),
    ],
  }),
  comparison = createSnapshot({
    id: "snapshot-2",
    start: "2026-06-01T00:00:00.000Z",
    end: "2026-07-01T00:00:00.000Z",
    kpis: [
      createKPI({ id: "kpi-3", actualValue: 100 }),
      createKPI({ id: "kpi-4", category: "CRM", actualValue: 120 }),
    ],
  })
) {
  return TrendAnalysis.create({
    trendId,
    baselineSnapshot: baseline,
    comparisonSnapshot: comparison,
    generatedAt: "2026-07-01T00:00:00.000Z",
  });
}

describe("TrendAnalysis", () => {
  it("creates immutable trend analysis with metric comparisons", () => {
    const trend = createTrend();
    const snapshot = trend.toSnapshot();

    expect(snapshot).toMatchObject({
      trendId,
      businessId,
      baselineSnapshotId: "snapshot-1",
      comparisonSnapshotId: "snapshot-2",
      overallGrowthRate: 22.40740740740741,
      overallTrend: "Improving",
    });
    expect(snapshot.metricComparisons).toEqual([
      {
        metricName: "Overall Achievement",
        baselineValue: 90,
        comparisonValue: 110,
        absoluteChange: 20,
        percentageChange: 22.22222222222222,
        trendDirection: "Improving",
      },
      {
        metricName: "CRM Achievement",
        baselineValue: 100,
        comparisonValue: 120,
        absoluteChange: 20,
        percentageChange: 20,
        trendDirection: "Improving",
      },
      {
        metricName: "Revenue Achievement",
        baselineValue: 80,
        comparisonValue: 100,
        absoluteChange: 20,
        percentageChange: 25,
        trendDirection: "Improving",
      },
    ]);
    expect(Object.isFrozen(snapshot.metricComparisons)).toBe(true);
  });

  it("derives stable and declining trend directions", () => {
    const stable = createTrend(
      createSnapshot({
        id: "snapshot-1",
        start: "2026-05-01T00:00:00.000Z",
        end: "2026-06-01T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-1", actualValue: 100 })],
      }),
      createSnapshot({
        id: "snapshot-2",
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-2", actualValue: 104 })],
      })
    );
    const declining = createTrend(
      createSnapshot({
        id: "snapshot-1",
        start: "2026-05-01T00:00:00.000Z",
        end: "2026-06-01T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-1", actualValue: 100 })],
      }),
      createSnapshot({
        id: "snapshot-2",
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-2", actualValue: 90 })],
      })
    );

    expect(stable.toSnapshot()).toMatchObject({
      overallGrowthRate: 4,
      overallTrend: "Stable",
    });
    expect(declining.toSnapshot()).toMatchObject({
      overallGrowthRate: -10,
      overallTrend: "Declining",
    });
  });

  it("handles zero baseline percentage changes without using them in overall growth", () => {
    const trend = createTrend(
      createSnapshot({
        id: "snapshot-1",
        start: "2026-05-01T00:00:00.000Z",
        end: "2026-06-01T00:00:00.000Z",
        kpis: [
          createKPI({ id: "kpi-1", category: "Revenue", actualValue: 0 }),
          createKPI({ id: "kpi-2", category: "CRM", actualValue: 80 }),
        ],
      }),
      createSnapshot({
        id: "snapshot-2",
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
        kpis: [
          createKPI({ id: "kpi-3", category: "Revenue", actualValue: 50 }),
          createKPI({ id: "kpi-4", category: "CRM", actualValue: 100 }),
        ],
      })
    );

    const revenueMetric = trend
      .toSnapshot()
      .metricComparisons.find(
        (metric) => metric.metricName === "Revenue Achievement"
      );

    expect(revenueMetric).toMatchObject({
      baselineValue: 0,
      comparisonValue: 50,
      absoluteChange: 50,
      percentageChange: undefined,
      trendDirection: "Stable",
    });
    expect(trend.toSnapshot().overallGrowthRate).toBe(56.25);
  });

  it("rejects invalid trend inputs", () => {
    const baseline = createSnapshot({
      id: "snapshot-1",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-1", actualValue: 80 })],
    });
    const comparison = createSnapshot({
      id: "snapshot-2",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      kpis: [
        createKPI({
          id: "kpi-2",
          actualValue: 100,
          businessId: otherBusinessId,
        }),
      ],
      businessId: otherBusinessId,
    });
    const reversed = createSnapshot({
      id: "snapshot-3",
      start: "2026-04-01T00:00:00.000Z",
      end: "2026-05-01T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-3", actualValue: 100 })],
    });

    expect(() =>
      TrendAnalysis.create({
        trendId: "" as TrendAnalysisId,
        baselineSnapshot: baseline,
        comparisonSnapshot: baseline,
        generatedAt: "2026-07-01T00:00:00.000Z",
      })
    ).toThrow("Trend analysis ID is required.");
    expect(() => createTrend(baseline, comparison)).toThrow(
      "Trend analysis snapshots must belong to the same business."
    );
    expect(() => createTrend(baseline, baseline)).toThrow(
      "Trend analysis requires different snapshots."
    );
    expect(() => createTrend(baseline, reversed)).toThrow(
      "Trend analysis baseline period must precede comparison period."
    );
  });

  it("rejects trends without comparable percentage changes", () => {
    expect(() =>
      createTrend(
        createSnapshot({
          id: "snapshot-1",
          start: "2026-05-01T00:00:00.000Z",
          end: "2026-06-01T00:00:00.000Z",
          kpis: [createKPI({ id: "kpi-1", actualValue: 0 })],
        }),
        createSnapshot({
          id: "snapshot-2",
          start: "2026-06-01T00:00:00.000Z",
          end: "2026-07-01T00:00:00.000Z",
          kpis: [createKPI({ id: "kpi-2", actualValue: 100 })],
        })
      )
    ).toThrow("Trend analysis requires at least one comparable metric.");
  });

  it("calculates deterministically through the calculator", () => {
    const calculator = new TrendAnalysisCalculator();
    const baseline = createSnapshot({
      id: "snapshot-1",
      start: "2026-05-01T00:00:00.000Z",
      end: "2026-06-01T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-1", actualValue: 80 })],
    });
    const comparison = createSnapshot({
      id: "snapshot-2",
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-2", actualValue: 100 })],
    });
    const input = {
      trendId,
      baselineSnapshot: baseline,
      comparisonSnapshot: comparison,
      generatedAt: "2026-07-01T00:00:00.000Z",
    };

    expect(calculator.calculate(input).toSnapshot()).toEqual(
      calculator.calculate(input).toSnapshot()
    );
  });

  it("exports trend primitives from the analytics module", () => {
    expect(PublicTrendAnalysis).toBe(TrendAnalysis);
    expect(PublicTrendAnalysisCalculator).toBe(TrendAnalysisCalculator);
  });
});
