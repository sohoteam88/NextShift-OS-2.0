import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  Revenue,
  RevenueProgressCalculator,
  RevenueTarget,
  type RevenueId,
  type RevenueTargetId,
} from "../src";
import { RevenueProgressCalculator as PublicRevenueProgressCalculator } from "../src/revenue-progress";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const targetId = "target-1" as RevenueTargetId;

function createTarget(
  amount = 1000,
  currency = "USD",
  targetBusinessId: BusinessId = businessId
): RevenueTarget {
  return RevenueTarget.create({
    revenueTargetId: targetId,
    businessId: targetBusinessId,
    name: "Monthly Revenue Target",
    period: {
      start: "2026-06-01T00:00:00.000Z",
      end: "2026-07-01T00:00:00.000Z",
    },
    summary: {
      targetAmount: amount,
      currency,
    },
    createdAt: "2026-05-25T00:00:00.000Z",
  });
}

function createRevenue(input: {
  readonly id: string;
  readonly amount: number;
  readonly currency?: string;
  readonly status?: "draft" | "recorded" | "recognized";
  readonly start?: string;
  readonly end?: string;
  readonly businessId?: BusinessId;
}): Revenue {
  const revenue = Revenue.create({
    revenueId: input.id as RevenueId,
    businessId: input.businessId ?? businessId,
    source: "subscription",
    period: {
      start: input.start ?? "2026-06-01T00:00:00.000Z",
      end: input.end ?? "2026-06-15T00:00:00.000Z",
    },
    summary: {
      amount: input.amount,
      currency: input.currency ?? "USD",
      transactionCount: 1,
    },
    createdAt: "2026-06-01T00:00:00.000Z",
  });

  if (input.status === "recorded" || input.status === "recognized") {
    revenue.record("2026-06-02T00:00:00.000Z");
  }

  if (input.status === "recognized") {
    revenue.recognize("2026-06-03T00:00:00.000Z");
  }

  return revenue;
}

describe("RevenueProgressCalculator", () => {
  it("calculates empty revenue collection", () => {
    const calculator = new RevenueProgressCalculator();

    const progress = calculator.calculate(createTarget(), []);

    expect(progress.toSnapshot()).toMatchObject({
      revenueTargetId: targetId,
      businessId,
      targetAmount: 1000,
      recognizedRevenue: 0,
      remainingAmount: 1000,
      achievementPercentage: 0,
      currency: "USD",
      status: "not_started",
    });
  });

  it("calculates partial achievement", () => {
    const calculator = new RevenueProgressCalculator();

    const progress = calculator.calculate(createTarget(), [
      createRevenue({
        id: "revenue-1",
        amount: 400,
        status: "recognized",
      }),
    ]);

    expect(progress.toSnapshot()).toMatchObject({
      recognizedRevenue: 400,
      remainingAmount: 600,
      achievementPercentage: 40,
      status: "in_progress",
    });
  });

  it("calculates full achievement", () => {
    const calculator = new RevenueProgressCalculator();

    const progress = calculator.calculate(createTarget(), [
      createRevenue({
        id: "revenue-1",
        amount: 1000,
        status: "recognized",
      }),
    ]);

    expect(progress.toSnapshot()).toMatchObject({
      recognizedRevenue: 1000,
      remainingAmount: 0,
      achievementPercentage: 100,
      status: "achieved",
    });
  });

  it("calculates over-achievement without negative remaining amount", () => {
    const calculator = new RevenueProgressCalculator();

    const progress = calculator.calculate(createTarget(), [
      createRevenue({
        id: "revenue-1",
        amount: 1250,
        status: "recognized",
      }),
    ]);

    expect(progress.toSnapshot()).toMatchObject({
      recognizedRevenue: 1250,
      remainingAmount: 0,
      achievementPercentage: 125,
      status: "exceeded",
    });
  });

  it("rejects matching recognized revenue with mismatched currency", () => {
    const calculator = new RevenueProgressCalculator();

    expect(() =>
      calculator.calculate(createTarget(), [
        createRevenue({
          id: "revenue-1",
          amount: 250,
          currency: "MYR",
          status: "recognized",
        }),
      ])
    ).toThrow("Revenue currency must match target currency.");
  });

  it("excludes revenue outside target period, other businesses, and non-recognized revenue", () => {
    const calculator = new RevenueProgressCalculator();

    const progress = calculator.calculate(createTarget(), [
      createRevenue({
        id: "revenue-1",
        amount: 100,
        status: "recognized",
        start: "2026-05-01T00:00:00.000Z",
        end: "2026-05-15T00:00:00.000Z",
      }),
      createRevenue({
        id: "revenue-2",
        amount: 200,
        status: "recorded",
      }),
      createRevenue({
        id: "revenue-3",
        amount: 300,
        status: "recognized",
        businessId: otherBusinessId,
      }),
      createRevenue({
        id: "revenue-4",
        amount: 400,
        status: "recognized",
      }),
    ]);

    expect(progress.toSnapshot()).toMatchObject({
      recognizedRevenue: 400,
      remainingAmount: 600,
      achievementPercentage: 40,
    });
  });

  it("rejects archived targets", () => {
    const calculator = new RevenueProgressCalculator();
    const target = createTarget();
    target.archive("2026-06-28T00:00:00.000Z");

    expect(() => calculator.calculate(target, [])).toThrow(
      "Only active revenue targets can be used for progress."
    );
  });

  it("exports calculator from the revenue-progress module", () => {
    expect(PublicRevenueProgressCalculator).toBe(RevenueProgressCalculator);
  });
});
