import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  AnalyticsApplicationService,
  AnalyticsApplicationService as PublicAnalyticsApplicationService,
} from "../src";
import type { KPIId } from "@nextshift/domain";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const kpiId = "kpi-1" as KPIId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

describe("AnalyticsApplicationService", () => {
  it("creates KPI through domain calculation", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createKPI({
      commandType: "CreateKPI",
      context,
      kpiId,
      name: "Revenue Growth",
      category: "Revenue",
      targetValue: 100,
      actualValue: 80,
      unit: "USD",
      measurementDate: "2026-06-28T00:00:00.000Z",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.kpi.toSnapshot()).toMatchObject({
        businessId,
        achievementPercentage: 80,
        variance: -20,
        status: "OnTrack",
      });
    }
  });

  it("evaluates KPI inputs without persistence", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.evaluateKPI({
      queryType: "EvaluateKPI",
      context,
      kpi: {
        kpiId,
        name: "Lead Conversion",
        category: "CRM",
        targetValue: 100,
        actualValue: 100,
        unit: "count",
        measurementDate: "2026-06-28T00:00:00.000Z",
      },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.kpi.toSnapshot()).toMatchObject({
        businessId,
        status: "Achieved",
      });
    }
  });

  it("returns KPI summary", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.getKPISummary({
      queryType: "GetKPISummary",
      context,
      kpi: {
        kpiId,
        name: "Campaign ROI",
        category: "Campaign",
        targetValue: 100,
        actualValue: 125,
        unit: "percent",
        measurementDate: "2026-06-28T00:00:00.000Z",
      },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.summary).toMatchObject({
        kpiId,
        name: "Campaign ROI",
        targetValue: 100,
        actualValue: 125,
        achievementPercentage: 125,
        variance: 25,
        status: "Exceeded",
      });
    }
  });

  it("propagates validation failures", async () => {
    const service = new AnalyticsApplicationService();

    const result = await service.createKPI({
      commandType: "CreateKPI",
      context,
      kpiId,
      name: "",
      category: "Revenue",
      targetValue: 100,
      actualValue: 80,
      unit: "USD",
      measurementDate: "2026-06-28T00:00:00.000Z",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "KPI name is required.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicAnalyticsApplicationService).toBe(AnalyticsApplicationService);
  });
});
