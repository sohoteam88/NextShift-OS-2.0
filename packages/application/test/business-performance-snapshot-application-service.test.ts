import {
  KPI,
  type BusinessPerformanceSnapshotId,
  type KPIId,
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
const snapshotId = "snapshot-1" as BusinessPerformanceSnapshotId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

function createKPI(input: {
  readonly id: string;
  readonly category?: string;
  readonly actualValue?: number;
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

function snapshotCommand(kpis: readonly KPI[]) {
  return {
    commandType: "CreateBusinessPerformanceSnapshot" as const,
    context,
    snapshotId,
    reportingPeriod: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
    },
    generatedAt: "2026-06-28T00:00:00.000Z",
    kpis,
  };
}

describe("BusinessPerformanceSnapshot application orchestration", () => {
  it("creates business performance snapshots", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createBusinessPerformanceSnapshot(
      snapshotCommand([
        createKPI({ id: "kpi-1", actualValue: 80 }),
        createKPI({ id: "kpi-2", category: "CRM", actualValue: 100 }),
      ])
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.snapshot.toSnapshot()).toMatchObject({
        snapshotId,
        businessId,
        overallAchievement: 90,
        overallStatus: "OnTrack",
      });
    }
  });

  it("evaluates business performance snapshots", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.evaluateBusinessPerformanceSnapshot({
      queryType: "EvaluateBusinessPerformanceSnapshot",
      context,
      snapshotId,
      reportingPeriod: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      generatedAt: "2026-06-28T00:00:00.000Z",
      kpis: [createKPI({ id: "kpi-1", actualValue: 125 })],
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.snapshot.toSnapshot()).toMatchObject({
        overallAchievement: 125,
        overallStatus: "Exceeded",
      });
    }
  });

  it("propagates validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const empty = await service.createBusinessPerformanceSnapshot(
      snapshotCommand([])
    );
    const crossBusiness = await service.createBusinessPerformanceSnapshot(
      snapshotCommand([
        createKPI({
          id: "kpi-1",
          businessId: otherBusinessId,
        }),
      ])
    );

    expect(empty.ok).toBe(false);
    expect(crossBusiness.ok).toBe(false);

    if (!empty.ok) {
      expect(empty.error).toMatchObject({
        code: "ValidationFailed",
        message: "Business performance snapshot requires at least one KPI.",
      });
    }

    if (!crossBusiness.ok) {
      expect(crossBusiness.error).toMatchObject({
        code: "ValidationFailed",
        message: "All KPIs must belong to the snapshot business.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
