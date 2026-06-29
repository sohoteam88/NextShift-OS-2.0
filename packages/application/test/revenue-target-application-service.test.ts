import {
  InMemoryRevenueTargetRepository,
  type RevenueTargetId,
} from "@nextshift/domain";
import type { BusinessId, TenantId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  RevenueTargetApplicationService,
  RevenueTargetApplicationService as PublicRevenueTargetApplicationService,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const revenueTargetId = "target-1" as RevenueTargetId;

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
  const repository = new InMemoryRevenueTargetRepository();
  const timestamps = [
    "2026-06-28T00:00:00.000Z",
    "2026-06-28T01:00:00.000Z",
    "2026-06-28T02:00:00.000Z",
  ];
  const service = new RevenueTargetApplicationService(
    repository,
    () => timestamps.shift() ?? "2026-06-28T03:00:00.000Z",
    () => revenueTargetId
  );

  return { repository, service };
}

async function createTarget(service: RevenueTargetApplicationService) {
  return service.createRevenueTarget({
    commandType: "CreateRevenueTarget",
    context,
    revenueTargetId,
    name: "Q3 Revenue Target",
    period: {
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-10-01T00:00:00.000Z",
    },
    summary: {
      targetAmount: 50000,
      currency: "usd",
    },
  });
}

describe("RevenueTargetApplicationService", () => {
  it("creates and persists a revenue target", async () => {
    const { repository, service } = createService();

    const result = await createTarget(service);

    expect(result.ok).toBe(true);
    expect(await repository.exists(revenueTargetId)).toBe(true);

    if (result.ok) {
      expect(result.value.target.toSnapshot()).toMatchObject({
        revenueTargetId,
        businessId,
        name: "Q3 Revenue Target",
        status: "active",
        summary: {
          targetAmount: 50000,
          currency: "USD",
        },
        createdAt: "2026-06-28T00:00:00.000Z",
      });
    }
  });

  it("updates and archives revenue targets", async () => {
    const { service } = createService();
    await createTarget(service);

    const updated = await service.updateRevenueTarget({
      commandType: "UpdateRevenueTarget",
      context,
      revenueTargetId,
      name: "Updated Target",
      summary: {
        targetAmount: 75000,
        currency: "myr",
      },
    });
    const archived = await service.archiveRevenueTarget({
      commandType: "ArchiveRevenueTarget",
      context,
      revenueTargetId,
    });

    expect(updated.ok).toBe(true);
    expect(archived.ok).toBe(true);

    if (updated.ok) {
      expect(updated.value.target.toSnapshot()).toMatchObject({
        name: "Updated Target",
        summary: {
          targetAmount: 75000,
          currency: "MYR",
        },
        updatedAt: "2026-06-28T01:00:00.000Z",
      });
    }

    if (archived.ok) {
      expect(archived.value.target.toSnapshot()).toMatchObject({
        status: "archived",
        archivedAt: "2026-06-28T02:00:00.000Z",
      });
    }
  });

  it("queries targets by ID, business, and search criteria", async () => {
    const { service } = createService();
    await createTarget(service);
    await service.createRevenueTarget({
      commandType: "CreateRevenueTarget",
      context: otherContext,
      revenueTargetId: "target-2" as RevenueTargetId,
      name: "Other Target",
      period: {
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-10-01T00:00:00.000Z",
      },
      summary: {
        targetAmount: 25000,
        currency: "MYR",
      },
    });

    const byId = await service.getRevenueTarget({
      queryType: "GetRevenueTarget",
      context,
      revenueTargetId,
    });
    const byBusiness = await service.listRevenueTargetsByBusiness({
      queryType: "ListRevenueTargetsByBusiness",
      context,
    });
    const bySearch = await service.searchRevenueTargets({
      queryType: "SearchRevenueTargets",
      context,
      criteria: {
        status: "active",
        currency: "usd",
        name: "q3",
      },
    });

    expect(byId.target?.revenueTargetId).toBe(revenueTargetId);
    expect(byBusiness.targets).toHaveLength(1);
    expect(bySearch.targets).toHaveLength(1);
  });

  it("preserves business isolation in queries and commands", async () => {
    const { service } = createService();
    await createTarget(service);

    const hidden = await service.getRevenueTarget({
      queryType: "GetRevenueTarget",
      context: otherContext,
      revenueTargetId,
    });
    const update = await service.updateRevenueTarget({
      commandType: "UpdateRevenueTarget",
      context: otherContext,
      revenueTargetId,
      name: "Other update",
    });

    expect(hidden.target).toBeNull();
    expect(update.ok).toBe(false);

    if (!update.ok) {
      expect(update.error).toMatchObject({
        code: "RevenueTargetNotFound",
      });
    }
  });

  it("returns not found for missing target commands", async () => {
    const { service } = createService();

    const result = await service.archiveRevenueTarget({
      commandType: "ArchiveRevenueTarget",
      context,
      revenueTargetId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatchObject({
        code: "RevenueTargetNotFound",
      });
    }
  });

  it("returns validation failures for duplicates and invalid transitions", async () => {
    const { service } = createService();
    await createTarget(service);

    const duplicate = await createTarget(service);
    await service.archiveRevenueTarget({
      commandType: "ArchiveRevenueTarget",
      context,
      revenueTargetId,
    });
    const archivedUpdate = await service.updateRevenueTarget({
      commandType: "UpdateRevenueTarget",
      context,
      revenueTargetId,
      name: "Archived update",
    });

    expect(duplicate.ok).toBe(false);
    expect(archivedUpdate.ok).toBe(false);

    if (!duplicate.ok) {
      expect(duplicate.error).toMatchObject({
        code: "ValidationFailed",
        message: "Revenue target target-1 already exists.",
      });
    }

    if (!archivedUpdate.ok) {
      expect(archivedUpdate.error).toMatchObject({
        code: "ValidationFailed",
        message: "Archived revenue targets cannot be modified.",
      });
    }
  });

  it("exports the service from the application package", () => {
    expect(PublicRevenueTargetApplicationService).toBe(
      RevenueTargetApplicationService
    );
  });
});
