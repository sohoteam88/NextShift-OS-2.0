import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  InMemoryRevenueRepository,
  Revenue,
  createRevenuePeriod,
  createRevenueSource,
  createRevenueSummary,
  type RevenueId,
} from "../src/revenue";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const revenueId = "revenue-1" as RevenueId;
const createdAt = "2026-06-28T00:00:00.000Z";

function createRevenue(id: RevenueId = revenueId): Revenue {
  return Revenue.create({
    revenueId: id,
    businessId,
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
    createdAt,
  });
}

describe("Revenue aggregate", () => {
  it("creates draft revenue with normalized value objects", () => {
    const revenue = createRevenue();

    expect(revenue.toSnapshot()).toMatchObject({
      revenueId,
      businessId,
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
      status: "draft",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("validates revenue value objects", () => {
    expect(() => createRevenueSource("grant")).toThrow(
      "Unsupported revenue source: grant."
    );

    expect(() =>
      createRevenuePeriod({
        start: "2026-07-01T00:00:00.000Z",
        end: "2026-06-01T00:00:00.000Z",
      })
    ).toThrow("Revenue period end must be after start.");

    expect(() =>
      createRevenueSummary({
        amount: -1,
        currency: "USD",
        transactionCount: 1,
      })
    ).toThrow("Revenue amount must be a non-negative finite number.");

    expect(() =>
      createRevenueSummary({
        amount: 100,
        currency: "US",
        transactionCount: 1,
      })
    ).toThrow("Revenue currency must be a three-letter code.");

    expect(() =>
      createRevenueSummary({
        amount: 100,
        currency: "USD",
        transactionCount: 0,
      })
    ).toThrow("Revenue transaction count must be a positive integer.");
  });

  it("records and recognizes revenue", () => {
    const revenue = createRevenue();

    revenue.record("2026-06-28T01:00:00.000Z");
    revenue.recognize("2026-06-28T02:00:00.000Z");

    expect(revenue.toSnapshot()).toMatchObject({
      status: "recognized",
      recordedAt: "2026-06-28T01:00:00.000Z",
      recognizedAt: "2026-06-28T02:00:00.000Z",
      updatedAt: "2026-06-28T02:00:00.000Z",
    });
  });

  it("archives revenue", () => {
    const revenue = createRevenue();

    revenue.archive("2026-06-28T03:00:00.000Z");

    expect(revenue.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T03:00:00.000Z",
      updatedAt: "2026-06-28T03:00:00.000Z",
    });
  });

  it("prevents invalid lifecycle transitions", () => {
    const revenue = createRevenue();

    expect(() => revenue.recognize("2026-06-28T01:00:00.000Z")).toThrow(
      "Only recorded revenue may be recognized."
    );

    revenue.record("2026-06-28T01:00:00.000Z");

    expect(() => revenue.record("2026-06-28T02:00:00.000Z")).toThrow(
      "Only draft revenue may be recorded."
    );

    revenue.recognize("2026-06-28T03:00:00.000Z");

    expect(() => revenue.recognize("2026-06-28T04:00:00.000Z")).toThrow(
      "Only recorded revenue may be recognized."
    );
  });

  it("emits domain events for lifecycle changes", () => {
    const revenue = createRevenue();

    expect(revenue.pullDomainEvents()).toMatchObject([
      {
        eventType: "RevenueCreated",
        aggregateType: "Revenue",
        aggregateId: revenueId,
        version: 1,
      },
    ]);

    revenue.record("2026-06-28T01:00:00.000Z");
    revenue.recognize("2026-06-28T02:00:00.000Z");
    revenue.archive("2026-06-28T03:00:00.000Z");

    expect(revenue.pullDomainEvents()).toMatchObject([
      { eventType: "RevenueRecorded" },
      { eventType: "RevenueRecognized" },
      { eventType: "RevenueArchived" },
    ]);
  });

  it("compares revenue identity by ID", () => {
    const revenue = createRevenue();
    const sameRevenue = Revenue.rehydrate(revenue.toSnapshot());
    const otherRevenue = createRevenue("revenue-2" as RevenueId);

    expect(revenue.sameIdentityAs(sameRevenue)).toBe(true);
    expect(revenue.sameIdentityAs(otherRevenue)).toBe(false);
  });
});

describe("InMemoryRevenueRepository", () => {
  it("saves and retrieves revenue by ID", async () => {
    const repository = new InMemoryRevenueRepository();
    const revenue = createRevenue();

    await repository.save(revenue);

    expect((await repository.findById(revenueId))?.toSnapshot()).toEqual(
      revenue.toSnapshot()
    );
  });

  it("lists revenue by business", async () => {
    const repository = new InMemoryRevenueRepository();

    await repository.save(createRevenue());
    await repository.save(
      Revenue.create({
        revenueId: "revenue-2" as RevenueId,
        businessId: otherBusinessId,
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
        createdAt: "2026-06-28T01:00:00.000Z",
      })
    );

    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
  });

  it("searches revenue by source, status, and currency", async () => {
    const repository = new InMemoryRevenueRepository();
    const revenue = createRevenue();
    revenue.record("2026-06-28T01:00:00.000Z");

    await repository.save(revenue);

    expect(
      await repository.search({
        businessId,
        source: "subscription",
        status: "recorded",
        currency: "usd",
      })
    ).toHaveLength(1);
  });

  it("checks existence and archives revenue", async () => {
    const repository = new InMemoryRevenueRepository();

    expect(await repository.exists(revenueId)).toBe(false);

    await repository.save(createRevenue());

    expect(await repository.exists(revenueId)).toBe(true);

    const archived = await repository.archive(
      revenueId,
      "2026-06-28T04:00:00.000Z"
    );

    expect(archived?.toSnapshot()).toMatchObject({
      status: "archived",
      archivedAt: "2026-06-28T04:00:00.000Z",
    });
  });
});
