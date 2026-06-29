import {
  InMemoryRevenueRepository,
  type RevenueId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { RevenueApplicationService } from "../src/revenue";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const revenueId = "revenue-1" as RevenueId;

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
  const repository = new InMemoryRevenueRepository();
  const timestamps = [
    "2026-06-28T00:00:00.000Z",
    "2026-06-28T01:00:00.000Z",
    "2026-06-28T02:00:00.000Z",
    "2026-06-28T03:00:00.000Z",
  ];
  const service = new RevenueApplicationService(
    repository,
    () => timestamps.shift() ?? "2026-06-28T04:00:00.000Z",
    () => revenueId
  );

  return { repository, service };
}

async function createRevenue(service: RevenueApplicationService) {
  return service.createRevenue({
    commandType: "CreateRevenue",
    context,
    revenueId,
    source: "subscription",
    period: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
    },
    summary: {
      amount: 12000,
      currency: "usd",
      transactionCount: 12,
    },
  });
}

describe("RevenueApplicationService", () => {
  it("creates and persists revenue", async () => {
    const { repository, service } = createService();

    const result = await createRevenue(service);

    expect(result.ok).toBe(true);
    expect(await repository.exists(revenueId)).toBe(true);

    if (result.ok) {
      expect(result.value.revenue.toSnapshot()).toMatchObject({
        revenueId,
        businessId,
        source: "subscription",
        status: "draft",
        summary: {
          amount: 12000,
          currency: "USD",
          transactionCount: 12,
        },
        createdAt: "2026-06-28T00:00:00.000Z",
      });
    }
  });

  it("records, recognizes, and archives revenue", async () => {
    const { service } = createService();
    await createRevenue(service);

    const recorded = await service.recordRevenue({
      commandType: "RecordRevenue",
      context,
      revenueId,
    });
    const recognized = await service.recognizeRevenue({
      commandType: "RecognizeRevenue",
      context,
      revenueId,
    });
    const archived = await service.archiveRevenue({
      commandType: "ArchiveRevenue",
      context,
      revenueId,
    });

    expect(recorded.ok).toBe(true);
    expect(recognized.ok).toBe(true);
    expect(archived.ok).toBe(true);

    if (recorded.ok) {
      expect(recorded.value.revenue.toSnapshot()).toMatchObject({
        status: "recorded",
        recordedAt: "2026-06-28T01:00:00.000Z",
      });
    }

    if (recognized.ok) {
      expect(recognized.value.revenue.toSnapshot()).toMatchObject({
        status: "recognized",
        recognizedAt: "2026-06-28T02:00:00.000Z",
      });
    }

    if (archived.ok) {
      expect(archived.value.revenue.toSnapshot()).toMatchObject({
        status: "archived",
        archivedAt: "2026-06-28T03:00:00.000Z",
      });
    }
  });

  it("queries revenue by ID, business, and search criteria", async () => {
    const { service } = createService();
    await createRevenue(service);
    await service.createRevenue({
      commandType: "CreateRevenue",
      context: otherContext,
      revenueId: "revenue-2" as RevenueId,
      source: "service",
      period: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      summary: {
        amount: 5000,
        currency: "MYR",
        transactionCount: 2,
      },
    });
    await service.recordRevenue({
      commandType: "RecordRevenue",
      context,
      revenueId,
    });

    const byId = await service.getRevenue({
      queryType: "GetRevenue",
      context,
      revenueId,
    });
    const byBusiness = await service.listRevenueByBusiness({
      queryType: "ListRevenueByBusiness",
      context,
    });
    const bySearch = await service.searchRevenue({
      queryType: "SearchRevenue",
      context,
      criteria: {
        source: "subscription",
        status: "recorded",
        currency: "usd",
      },
    });

    expect(byId.revenue?.revenueId).toBe(revenueId);
    expect(byBusiness.revenue).toHaveLength(1);
    expect(bySearch.revenue).toHaveLength(1);
  });

  it("hides revenue outside the query context", async () => {
    const { service } = createService();
    await createRevenue(service);

    const result = await service.getRevenue({
      queryType: "GetRevenue",
      context: otherContext,
      revenueId,
    });

    expect(result.revenue).toBeNull();
  });

  it("returns not found for missing aggregate commands", async () => {
    const { service } = createService();

    const result = await service.recordRevenue({
      commandType: "RecordRevenue",
      context,
      revenueId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "RevenueNotFound",
      });
    }
  });

  it("returns validation failures for invalid lifecycle transitions", async () => {
    const { service } = createService();
    await createRevenue(service);

    const result = await service.recognizeRevenue({
      commandType: "RecognizeRevenue",
      context,
      revenueId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "ValidationFailed",
        message: "Only recorded revenue may be recognized.",
      });
    }
  });

  it("returns validation failures for duplicate creation and invalid IDs", async () => {
    const { service } = createService();
    await createRevenue(service);

    const duplicate = await createRevenue(service);
    const invalid = await service.createRevenue({
      commandType: "CreateRevenue",
      context,
      revenueId: " " as RevenueId,
      source: "subscription",
      period: {
        start: "2026-06-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      },
      summary: {
        amount: 12000,
        currency: "USD",
        transactionCount: 12,
      },
    });

    expect(duplicate.ok).toBe(false);
    expect(invalid.ok).toBe(false);

    if (!duplicate.ok) {
      expect(duplicate.error).toMatchObject({
        code: "ValidationFailed",
        message: "Revenue revenue-1 already exists.",
      });
    }

    if (!invalid.ok) {
      expect(invalid.error).toMatchObject({
        code: "ValidationFailed",
        message: "Revenue ID is required.",
      });
    }
  });
});
