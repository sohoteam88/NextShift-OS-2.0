import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  InMemoryRevenueTargetRepository,
  RevenueTarget,
  createRevenueTargetName,
  createRevenueTargetPeriod,
  createRevenueTargetSummary,
  type RevenueTargetId,
} from "../src/revenue-target";
import {
  InMemoryRevenueTargetRepository as PublicInMemoryRevenueTargetRepository,
  RevenueTarget as PublicRevenueTarget,
} from "../src";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const revenueTargetId = "target-1" as RevenueTargetId;
const createdAt = "2026-06-28T00:00:00.000Z";

function createTarget(id: RevenueTargetId = revenueTargetId): RevenueTarget {
  return RevenueTarget.create({
    revenueTargetId: id,
    businessId,
    name: "Q3 Revenue Target",
    period: {
      start: "2026-07-01T00:00:00.000Z",
      end: "2026-10-01T00:00:00.000Z",
    },
    summary: {
      targetAmount: 50000,
      currency: "usd",
    },
    createdAt,
  });
}

describe("RevenueTarget aggregate", () => {
  it("creates an active revenue target", () => {
    const target = createTarget();

    expect(target.toSnapshot()).toMatchObject({
      revenueTargetId,
      businessId,
      name: "Q3 Revenue Target",
      period: {
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-10-01T00:00:00.000Z",
      },
      summary: {
        targetAmount: 50000,
        currency: "USD",
      },
      status: "active",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("validates revenue target value objects", () => {
    expect(() => createRevenueTargetName(" ")).toThrow(
      "Revenue target name is required."
    );

    expect(() =>
      createRevenueTargetPeriod({
        start: "2026-10-01T00:00:00.000Z",
        end: "2026-07-01T00:00:00.000Z",
      })
    ).toThrow("Revenue target period end must be after start.");

    expect(() =>
      createRevenueTargetSummary({
        targetAmount: 0,
        currency: "USD",
      })
    ).toThrow("Revenue target amount must be a positive finite number.");

    expect(() =>
      createRevenueTargetSummary({
        targetAmount: 1000,
        currency: "US",
      })
    ).toThrow("Revenue target currency must be a three-letter code.");
  });

  it("updates target details", () => {
    const target = createTarget();

    target.update({
      name: "Updated Revenue Target",
      period: {
        start: "2026-08-01T00:00:00.000Z",
        end: "2026-11-01T00:00:00.000Z",
      },
      summary: {
        targetAmount: 75000,
        currency: "myr",
      },
      updatedAt: "2026-06-28T01:00:00.000Z",
    });

    expect(target.toSnapshot()).toMatchObject({
      name: "Updated Revenue Target",
      period: {
        start: "2026-08-01T00:00:00.000Z",
        end: "2026-11-01T00:00:00.000Z",
      },
      summary: {
        targetAmount: 75000,
        currency: "MYR",
      },
      updatedAt: "2026-06-28T01:00:00.000Z",
    });
  });

  it("archives target and prevents later updates", () => {
    const target = createTarget();

    target.archive("2026-06-28T02:00:00.000Z");

    expect(target.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T02:00:00.000Z",
    });

    expect(() =>
      target.update({
        name: "Archived update",
        updatedAt: "2026-06-28T03:00:00.000Z",
      })
    ).toThrow("Archived revenue targets cannot be modified.");
  });

  it("emits domain events", () => {
    const target = createTarget();

    expect(target.pullDomainEvents()).toMatchObject([
      {
        eventType: "RevenueTargetCreated",
        aggregateType: "RevenueTarget",
        aggregateId: revenueTargetId,
        version: 1,
      },
    ]);

    target.update({
      name: "Updated Revenue Target",
      updatedAt: "2026-06-28T01:00:00.000Z",
    });
    target.archive("2026-06-28T02:00:00.000Z");

    expect(target.pullDomainEvents()).toMatchObject([
      {
        eventType: "RevenueTargetUpdated",
        payload: {
          updatedFields: ["name"],
        },
      },
      {
        eventType: "RevenueTargetArchived",
      },
    ]);
  });
});

describe("InMemoryRevenueTargetRepository", () => {
  it("saves and retrieves targets by ID", async () => {
    const repository = new InMemoryRevenueTargetRepository();
    const target = createTarget();

    await repository.save(target);

    expect((await repository.findById(revenueTargetId))?.toSnapshot()).toEqual(
      target.toSnapshot()
    );
  });

  it("lists targets by business", async () => {
    const repository = new InMemoryRevenueTargetRepository();

    await repository.save(createTarget());
    await repository.save(
      RevenueTarget.create({
        revenueTargetId: "target-2" as RevenueTargetId,
        businessId: otherBusinessId,
        name: "Other Target",
        period: {
          start: "2026-07-01T00:00:00.000Z",
          end: "2026-10-01T00:00:00.000Z",
        },
        summary: {
          targetAmount: 25000,
          currency: "MYR",
        },
        createdAt: "2026-06-28T01:00:00.000Z",
      })
    );

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
  });

  it("searches targets by criteria", async () => {
    const repository = new InMemoryRevenueTargetRepository();
    const target = createTarget();

    await repository.save(target);

    expect(
      await repository.search({
        businessId,
        status: "active",
        currency: "usd",
        name: "q3",
      })
    ).toHaveLength(1);
  });

  it("checks existence and archives targets", async () => {
    const repository = new InMemoryRevenueTargetRepository();

    expect(await repository.exists(revenueTargetId)).toBe(false);

    await repository.save(createTarget());

    expect(await repository.exists(revenueTargetId)).toBe(true);

    const archived = await repository.archive(
      revenueTargetId,
      "2026-06-28T04:00:00.000Z"
    );

    expect(archived?.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T04:00:00.000Z",
    });
  });
});

describe("Revenue target public exports", () => {
  it("exports target aggregate and repository from the domain package", () => {
    expect(PublicRevenueTarget).toBe(RevenueTarget);
    expect(PublicInMemoryRevenueTargetRepository).toBe(
      InMemoryRevenueTargetRepository
    );
  });
});
