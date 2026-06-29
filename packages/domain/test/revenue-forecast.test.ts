import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  Revenue,
  RevenueForecastCalculator,
  RevenueProgressCalculator,
  RevenueTarget,
  type RevenueId,
  type RevenueTargetId,
} from "../src";
import { RevenueForecastCalculator as PublicRevenueForecastCalculator } from "../src/revenue-forecast";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const targetId = "target-1" as RevenueTargetId;
const asOf = "2026-06-16T00:00:00.000Z";

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
  readonly recognizedAt?: string;
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
    revenue.recognize(input.recognizedAt ?? "2026-06-03T00:00:00.000Z");
  }

  return revenue;
}

function calculateForecast(revenue: readonly Revenue[]) {
  const target = createTarget();
  const progress = new RevenueProgressCalculator().calculate(target, revenue);

  return new RevenueForecastCalculator().calculate(
    target,
    progress,
    revenue,
    asOf
  );
}

describe("RevenueForecastCalculator", () => {
  it("calculates empty revenue history", () => {
    const forecast = calculateForecast([]);

    expect(forecast.toSnapshot()).toMatchObject({
      revenueTargetId: targetId,
      businessId,
      targetAmount: 1000,
      recognizedRevenue: 0,
      forecastRevenue: 0,
      forecastRemainingRevenue: 1000,
      forecastAchievementPercentage: 0,
      forecastVariance: -1000,
      currency: "USD",
      status: "no_progress",
    });
  });

  it("forecasts partial progress deterministically", () => {
    const forecast = calculateForecast([
      createRevenue({
        id: "revenue-1",
        amount: 400,
        status: "recognized",
      }),
    ]);

    expect(forecast.toSnapshot()).toMatchObject({
      recognizedRevenue: 400,
      forecastRevenue: 800,
      forecastRemainingRevenue: 200,
      forecastAchievementPercentage: 80,
      forecastVariance: -200,
      status: "below_target",
    });
  });

  it("forecasts full achievement", () => {
    const forecast = calculateForecast([
      createRevenue({
        id: "revenue-1",
        amount: 500,
        status: "recognized",
      }),
    ]);

    expect(forecast.toSnapshot()).toMatchObject({
      recognizedRevenue: 500,
      forecastRevenue: 1000,
      forecastRemainingRevenue: 0,
      forecastAchievementPercentage: 100,
      forecastVariance: 0,
      status: "on_target",
    });
  });

  it("forecasts over-achievement without negative remaining revenue", () => {
    const forecast = calculateForecast([
      createRevenue({
        id: "revenue-1",
        amount: 750,
        status: "recognized",
      }),
    ]);

    expect(forecast.toSnapshot()).toMatchObject({
      recognizedRevenue: 750,
      forecastRevenue: 1500,
      forecastRemainingRevenue: 0,
      forecastAchievementPercentage: 150,
      forecastVariance: 500,
      status: "above_target",
    });
  });

  it("rejects matching recognized revenue with mismatched currency", () => {
    const target = createTarget();
    const revenue = [
      createRevenue({
        id: "revenue-1",
        amount: 250,
        currency: "MYR",
        status: "recognized",
      }),
    ];
    const progress = new RevenueProgressCalculator().calculate(target, []);

    expect(() =>
      new RevenueForecastCalculator().calculate(target, progress, revenue, asOf)
    ).toThrow("Revenue currency must match target currency.");
  });

  it("rejects archived targets", () => {
    const target = createTarget();
    target.archive("2026-06-28T00:00:00.000Z");
    const progress = new RevenueProgressCalculator().calculate(
      createTarget(),
      []
    );

    expect(() =>
      new RevenueForecastCalculator().calculate(target, progress, [], asOf)
    ).toThrow("Only active revenue targets can be used for forecast.");
  });

  it("excludes revenue outside target period, other businesses, non-recognized revenue, and revenue after as-of", () => {
    const revenue = [
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
        amount: 500,
        status: "recognized",
        recognizedAt: "2026-06-20T00:00:00.000Z",
      }),
      createRevenue({
        id: "revenue-5",
        amount: 400,
        status: "recognized",
      }),
    ];
    const target = createTarget();
    const revenueAsOf = revenue.filter((item) => {
      const snapshot = item.toSnapshot();

      return (
        snapshot.status !== "recognized" ||
        (snapshot.recognizedAt !== undefined &&
          Date.parse(snapshot.recognizedAt) <= Date.parse(asOf))
      );
    });
    const progress = new RevenueProgressCalculator().calculate(
      target,
      revenueAsOf
    );

    const forecast = new RevenueForecastCalculator().calculate(
      target,
      progress,
      revenue,
      asOf
    );

    expect(forecast.toSnapshot()).toMatchObject({
      recognizedRevenue: 400,
      forecastRevenue: 800,
    });
  });

  it("handles no elapsed time without division by zero", () => {
    const forecast = new RevenueForecastCalculator().calculate(
      createTarget(),
      new RevenueProgressCalculator().calculate(createTarget(), []),
      [],
      "2026-06-01T00:00:00.000Z"
    );

    expect(forecast.toSnapshot()).toMatchObject({
      forecastRevenue: 0,
      forecastAchievementPercentage: 0,
      status: "no_progress",
    });
  });

  it("produces deterministic forecast calculations", () => {
    const revenue = [
      createRevenue({
        id: "revenue-1",
        amount: 400,
        status: "recognized",
      }),
    ];

    expect(calculateForecast(revenue).toSnapshot()).toEqual(
      calculateForecast(revenue).toSnapshot()
    );
  });

  it("exports calculator from the revenue-forecast module", () => {
    expect(PublicRevenueForecastCalculator).toBe(RevenueForecastCalculator);
  });
});
