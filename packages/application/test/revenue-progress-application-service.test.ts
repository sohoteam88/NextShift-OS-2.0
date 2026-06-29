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
  RevenueProgressApplicationService,
  RevenueProgressApplicationService as PublicRevenueProgressApplicationService,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const targetId = "target-1" as RevenueTargetId;

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
  const service = new RevenueProgressApplicationService(
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
  currency = "USD"
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
  revenue.recognize("2026-06-03T00:00:00.000Z");

  return revenue;
}

describe("RevenueProgressApplicationService", () => {
  it("calculates revenue progress from repositories", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 400));

    const result = await service.calculateRevenueProgress({
      queryType: "CalculateRevenueProgress",
      context,
      revenueTargetId: targetId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.progress.toSnapshot()).toMatchObject({
        revenueTargetId: targetId,
        businessId,
        targetAmount: 1000,
        recognizedRevenue: 400,
        remainingAmount: 600,
        achievementPercentage: 40,
      });
    }
  });

  it("gets, compares, and summarizes revenue progress", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 1000));

    const get = await service.getRevenueProgress({
      queryType: "GetRevenueProgress",
      context,
      revenueTargetId: targetId,
    });
    const compare = await service.compareRevenueAgainstTarget({
      queryType: "CompareRevenueAgainstTarget",
      context,
      revenueTargetId: targetId,
    });
    const summary = await service.generateRevenueProgressSummary({
      queryType: "GenerateRevenueProgressSummary",
      context,
      revenueTargetId: targetId,
    });

    expect(get.ok).toBe(true);
    expect(compare.ok).toBe(true);
    expect(summary.ok).toBe(true);

    if (get.ok) {
      expect(get.value.progress.toSnapshot()).toMatchObject({
        status: "achieved",
        achievementPercentage: 100,
      });
    }
  });

  it("lists revenue progress by business", async () => {
    const { revenueRepository, service, targetRepository } = createService();
    await targetRepository.save(createTarget());
    await targetRepository.save(
      createTarget("target-2" as RevenueTargetId, otherBusinessId)
    );
    await revenueRepository.save(createRecognizedRevenue("revenue-1", 250));
    await revenueRepository.save(
      createRecognizedRevenue("revenue-2", 900, otherBusinessId)
    );

    const result = await service.listRevenueProgressByBusiness({
      queryType: "ListRevenueProgressByBusiness",
      context,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.progress).toHaveLength(1);
      expect(result.value.progress[0]?.toSnapshot()).toMatchObject({
        businessId,
        recognizedRevenue: 250,
      });
    }
  });

  it("preserves business isolation for target queries", async () => {
    const { service, targetRepository } = createService();
    await targetRepository.save(createTarget());

    const result = await service.calculateRevenueProgress({
      queryType: "CalculateRevenueProgress",
      context: otherContext,
      revenueTargetId: targetId,
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

    const result = await service.calculateRevenueProgress({
      queryType: "CalculateRevenueProgress",
      context,
      revenueTargetId: targetId,
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

    const result = await service.calculateRevenueProgress({
      queryType: "CalculateRevenueProgress",
      context,
      revenueTargetId: targetId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Revenue currency must match target currency.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicRevenueProgressApplicationService).toBe(
      RevenueProgressApplicationService
    );
  });
});
