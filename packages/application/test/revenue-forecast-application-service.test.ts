import {
  InMemoryRevenueRepository,
  InMemoryRevenueTargetRepository,
  Revenue,
  RevenueTarget,
  type RevenueId,
  type RevenueTargetId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  RevenueForecastApplicationService,
  RevenueForecastApplicationService as PublicRevenueForecastApplicationService,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const targetId = "target-1" as RevenueTargetId;
const asOf = "2026-06-16T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

const otherContext = {
  businessId: otherBusinessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
};

function createService() {
  const targetRepository = new InMemoryRevenueTargetRepository();
  const revenueRepository = new InMemoryRevenueRepository();
  const service = new RevenueForecastApplicationService(
    targetRepository,
    revenueRepository
  );

  return { revenueRepository, service, targetRepository };
}

function createTarget(
  id: RevenueTargetId = targetId,
  targetBusinessId: BusinessId = businessId,
  currency = "USD"
): RevenueTarget {
  return RevenueTarget.create({
    revenueTargetId: id,
    businessId: targetBusinessId,
    name: "Monthly Revenue Target",
    period: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
    },
    summary: {
      targetAmount: 1000,
      currency,
    },
    createdAt: "2026-05-25T00:00:00.000Z",
  });
}

function createRecognizedRevenue(
  id: string,
  amount: number,
  revenueBusinessId: BusinessId = businessId,
  currency = "USD",
  recognizedAt = "2026-06-03T00:00:00.000Z"
): Revenue {
  const revenue = Revenue.create({
    revenueId: id as RevenueId,
    businessId: revenueBusinessId,
    source: "subscription",
    period: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-06-15T00:00:00.000Z",
    },
    summary: {
      amount,
      currency,
      transactionCount: 1,
    },
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  revenue.record("2026-06-02T00:00:00.000Z");
  revenue.recognize(recognizedAt);

  return revenue;
}

describe("RevenueForecastApplicationService", () => {
  it("calculates revenue forecast from repositories", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 400));

    const result = await service.calculateRevenueForecast({
      queryType: "CalculateRevenueForecast",
      context,
      revenueTargetId: targetId,
      asOf,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.forecast.toSnapshot()).toMatchObject({
        revenueTargetId: targetId,
        businessId,
        targetAmount: 1000,
        recognizedRevenue: 400,
        forecastRevenue: 800,
        forecastRemainingRevenue: 200,
        forecastAchievementPercentage: 80,
      });
    }
  });

  it("gets and summarizes revenue forecast", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 500));

    const get = await service.getRevenueForecast({
      queryType: "GetRevenueForecast",
      context,
      revenueTargetId: targetId,
      asOf,
    });
    const summary = await service.generateRevenueForecastSummary({
      queryType: "GenerateRevenueForecastSummary",
      context,
      revenueTargetId: targetId,
      asOf,
    });

    expect(get.ok).toBe(true);
    expect(summary.ok).toBe(true);

    if (get.ok) {
      expect(get.value.forecast.toSnapshot()).toMatchObject({
        status: "on_target",
        forecastAchievementPercentage: 100,
      });
    }
  });

  it("lists revenue forecasts by business", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await targetRepository.save(
      createTarget("target-2" as RevenueTargetId, otherBusinessId)
    );
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 250));
    await revenueRepository.save(
      createRecognizedRevenue("revenue-2", 900, otherBusinessId)
    );

    const result = await service.listRevenueForecastsByBusiness({
      queryType: "ListRevenueForecastsByBusiness",
      context,
      asOf,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.forecasts).toHaveLength(1);
      expect(result.value.forecasts[0]?.toSnapshot()).toMatchObject({
        businessId,
        recognizedRevenue: 250,
        forecastRevenue: 500,
      });
    }
  });

  it("preserves business isolation for target queries", async () => {
    const { service, targetRepository } = createService();
    await targetRepository.save(createTarget());

    const result = await service.calculateRevenueForecast({
      queryType: "CalculateRevenueForecast",
      context: otherContext,
      revenueTargetId: targetId,
      asOf,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "RevenueTargetNotFound",
      });
    }
  });

  it("returns not found for missing targets", async () => {
    const { service } = createService();

    const result = await service.calculateRevenueForecast({
      queryType: "CalculateRevenueForecast",
      context,
      revenueTargetId: targetId,
      asOf,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "RevenueTargetNotFound",
      });
    }
  });

  it("propagates currency validation failures", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(
      createRecognizedRevenue("revenue-1", 400, businessId, "MYR")
    );

    const result = await service.calculateRevenueForecast({
      queryType: "CalculateRevenueForecast",
      context,
      revenueTargetId: targetId,
      asOf,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Revenue currency must match target currency.",
      });
    }
  });

  it("filters recognized revenue after the as-of timestamp", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 400));
    await revenueRepository.save(
      createRecognizedRevenue(
        "revenue-2",
        500,
        businessId,
        "USD",
        "2026-06-20T00:00:00.000Z"
      )
    );

    const result = await service.calculateRevenueForecast({
      queryType: "CalculateRevenueForecast",
      context,
      revenueTargetId: targetId,
      asOf,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.forecast.toSnapshot()).toMatchObject({
        recognizedRevenue: 400,
        forecastRevenue: 800,
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicRevenueForecastApplicationService).toBe(
      RevenueForecastApplicationService
    );
  });
});
