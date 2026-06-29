import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotCalculator,
  KPI,
  type BusinessPerformanceSnapshotId,
  type KPIId,
} from "../src";
import {
  BusinessPerformanceSnapshot as PublicBusinessPerformanceSnapshot,
  BusinessPerformanceSnapshotCalculator as PublicBusinessPerformanceSnapshotCalculator,
} from "../src/analytics";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const snapshotId = "snapshot-1" as BusinessPerformanceSnapshotId;

function createKPI(input: {
  readonly id: string;
  readonly category?: string;
  readonly actualValue?: number;
  readonly targetValue?: number;
  readonly businessId?: BusinessId;
}) {
  return KPI.create({
    kpiId: input.id as KPIId,
    businessId: input.businessId ?? businessId,
    name: "KPI",
    category: input.category ?? "Revenue",
    targetValue: input.targetValue ?? 100,
    actualValue: input.actualValue,
    unit: "points",
    measurementDate: "2026-06-28T00:00:00.000Z",
  });
}

function createSnapshot(kpis: readonly KPI[]) {
  return BusinessPerformanceSnapshot.create({
    snapshotId,
    businessId,
    reportingPeriod: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
    },
    generatedAt: "2026-06-28T00:00:00.000Z",
    kpis,
  });
}

describe("BusinessPerformanceSnapshot", () => {
  it("creates immutable snapshots with overall and category aggregation", () => {
    const snapshot = createSnapshot([
      createKPI({ id: "kpi-1", category: "Revenue", actualValue: 80 }),
      createKPI({ id: "kpi-2", category: "Revenue", actualValue: 120 }),
      createKPI({ id: "kpi-3", category: "CRM", actualValue: 70 }),
      createKPI({ id: "kpi-4", category: "CRM" }),
    ]);

    const result = snapshot.toSnapshot();

    expect(result).toMatchObject({
      snapshotId,
      businessId,
      overallAchievement: 90,
      overallStatus: "OnTrack",
    });
    expect(result.kpis).toHaveLength(4);
    expect(result.categorySummaries).toEqual([
      {
        category: "CRM",
        totalKPIs: 2,
        achievedKPIs: 0,
        averageAchievement: 70,
        highestAchievement: 70,
        lowestAchievement: 70,
        status: "OnTrack",
      },
      {
        category: "Revenue",
        totalKPIs: 2,
        achievedKPIs: 1,
        averageAchievement: 100,
        highestAchievement: 120,
        lowestAchievement: 80,
        status: "Achieved",
      },
    ]);
    expect(Object.isFrozen(result.kpis)).toBe(true);
    expect(Object.isFrozen(result.categorySummaries)).toBe(true);
  });

  it("excludes pending KPIs from averages", () => {
    const snapshot = createSnapshot([
      createKPI({ id: "kpi-1", actualValue: 80 }),
      createKPI({ id: "kpi-2" }),
    ]);

    expect(snapshot.toSnapshot()).toMatchObject({
      overallAchievement: 80,
      overallStatus: "OnTrack",
      categorySummaries: [
        {
          totalKPIs: 2,
          achievedKPIs: 0,
          averageAchievement: 80,
          highestAchievement: 80,
          lowestAchievement: 80,
          status: "OnTrack",
        },
      ],
    });
  });

  it("returns Warning when no KPIs are evaluated", () => {
    const snapshot = createSnapshot([
      createKPI({ id: "kpi-1" }),
      createKPI({ id: "kpi-2", category: "CRM" }),
    ]);

    expect(snapshot.toSnapshot()).toMatchObject({
      overallAchievement: undefined,
      overallStatus: "Warning",
    });
    expect(snapshot.toSnapshot().categorySummaries).toEqual([
      {
        category: "CRM",
        totalKPIs: 1,
        achievedKPIs: 0,
        averageAchievement: undefined,
        highestAchievement: undefined,
        lowestAchievement: undefined,
        status: "Warning",
      },
      {
        category: "Revenue",
        totalKPIs: 1,
        achievedKPIs: 0,
        averageAchievement: undefined,
        highestAchievement: undefined,
        lowestAchievement: undefined,
        status: "Warning",
      },
    ]);
  });

  it("derives every overall status threshold", () => {
    expect(
      createSnapshot([createKPI({ id: "kpi-1", actualValue: 69 })]).toSnapshot()
        .overallStatus
    ).toBe("Warning");
    expect(
      createSnapshot([createKPI({ id: "kpi-1", actualValue: 70 })]).toSnapshot()
        .overallStatus
    ).toBe("OnTrack");
    expect(
      createSnapshot([createKPI({ id: "kpi-1", actualValue: 100 })]).toSnapshot()
        .overallStatus
    ).toBe("Achieved");
    expect(
      createSnapshot([createKPI({ id: "kpi-1", actualValue: 125 })]).toSnapshot()
        .overallStatus
    ).toBe("Exceeded");
  });

  it("rejects invalid snapshot inputs", () => {
    expect(() => createSnapshot([])).toThrow(
      "Business performance snapshot requires at least one KPI."
    );
    expect(() =>
      BusinessPerformanceSnapshot.create({
        snapshotId: "" as BusinessPerformanceSnapshotId,
        businessId,
        reportingPeriod: {
          start: "2026-06-01T00:00:00.000Z",
          end: "2026-07-01T00:00:00.000Z",
        },
        generatedAt: "2026-06-28T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-1" })],
      })
    ).toThrow("Business performance snapshot ID is required.");
    expect(() =>
      BusinessPerformanceSnapshot.create({
        snapshotId,
        businessId,
        reportingPeriod: {
          start: "2026-07-01T00:00:00.000Z",
          end: "2026-06-01T00:00:00.000Z",
        },
        generatedAt: "2026-06-28T00:00:00.000Z",
        kpis: [createKPI({ id: "kpi-1" })],
      })
    ).toThrow(
      "Business performance reporting period end must be after start."
    );
    expect(() =>
      createSnapshot([
        createKPI({
          id: "kpi-1",
          businessId: otherBusinessId,
        }),
      ])
    ).toThrow("All KPIs must belong to the snapshot business.");
  });

  it("calculates deterministically through the calculator", () => {
    const calculator = new BusinessPerformanceSnapshotCalculator();
    const input = {
      snapshotId,
      businessId,
      reportingPeriod: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      generatedAt: "2026-06-28T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-1", actualValue: 80 })],
    };

    expect(calculator.calculate(input).toSnapshot()).toEqual(
      calculator.calculate(input).toSnapshot()
    );
  });

  it("exports snapshot primitives from the analytics module", () => {
    expect(PublicBusinessPerformanceSnapshot).toBe(BusinessPerformanceSnapshot);
    expect(PublicBusinessPerformanceSnapshotCalculator).toBe(
      BusinessPerformanceSnapshotCalculator
    );
  });
});
