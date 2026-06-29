import type { Timestamp } from "@nextshift/shared";
import type { Revenue, RevenueSnapshot } from "../revenue";
import type { RevenueProgress } from "../revenue-progress";
import type { RevenueTarget, RevenueTargetSnapshot } from "../revenue-target";
import {
  RevenueForecast,
  createForecastTimestamp,
} from "./revenue-forecast";

export class RevenueForecastCalculator {
  calculate(
    target: RevenueTarget,
    progress: RevenueProgress,
    revenue: readonly Revenue[],
    asOf: Timestamp
  ): RevenueForecast {
    const targetSnapshot = target.toSnapshot();
    const progressSnapshot = progress.toSnapshot();
    const forecastAsOf = createForecastTimestamp(asOf, "asOf");

    assertActiveTarget(targetSnapshot);
    assertProgressMatchesTarget(progressSnapshot, targetSnapshot);

    const matchingRevenue = revenue
      .map((item) => item.toSnapshot())
      .filter((item) => item.businessId === targetSnapshot.businessId)
      .filter((item) => item.status === "recognized")
      .filter((item) => isWithinTargetPeriod(item, targetSnapshot))
      .filter((item) => isRecognizedByAsOf(item, forecastAsOf));

    const recognizedRevenue = matchingRevenue.reduce((total, item) => {
      assertCurrencyMatchesTarget(item, targetSnapshot);
      return total + item.summary.amount;
    }, 0);

    assertRecognizedRevenueMatchesProgress(
      recognizedRevenue,
      progressSnapshot.recognizedRevenue
    );

    const forecastRevenue = calculateForecastRevenue(
      recognizedRevenue,
      targetSnapshot,
      forecastAsOf
    );

    return RevenueForecast.create({
      revenueTargetId: targetSnapshot.revenueTargetId,
      businessId: targetSnapshot.businessId,
      targetPeriod: targetSnapshot.period,
      asOf: forecastAsOf,
      targetAmount: targetSnapshot.summary.targetAmount,
      recognizedRevenue,
      forecastRevenue,
      currency: targetSnapshot.summary.currency,
    });
  }
}

interface ProgressSnapshot {
  readonly revenueTargetId: RevenueTargetSnapshot["revenueTargetId"];
  readonly businessId: RevenueTargetSnapshot["businessId"];
  readonly targetPeriod: RevenueTargetSnapshot["period"];
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly currency: string;
}

function assertActiveTarget(target: RevenueTargetSnapshot): void {
  if (target.status !== "active") {
    throw new Error("Only active revenue targets can be used for forecast.");
  }
}

function assertProgressMatchesTarget(
  progress: ProgressSnapshot,
  target: RevenueTargetSnapshot
): void {
  if (
    progress.revenueTargetId !== target.revenueTargetId ||
    progress.businessId !== target.businessId ||
    progress.targetAmount !== target.summary.targetAmount ||
    progress.currency !== target.summary.currency ||
    progress.targetPeriod.start !== target.period.start ||
    progress.targetPeriod.end !== target.period.end
  ) {
    throw new Error("Revenue progress must match the revenue target.");
  }
}

function assertCurrencyMatchesTarget(
  revenue: RevenueSnapshot,
  target: RevenueTargetSnapshot
): void {
  if (revenue.summary.currency !== target.summary.currency) {
    throw new Error("Revenue currency must match target currency.");
  }
}

function assertRecognizedRevenueMatchesProgress(
  recognizedRevenue: number,
  progressRecognizedRevenue: number
): void {
  if (recognizedRevenue !== progressRecognizedRevenue) {
    throw new Error("Revenue progress must match recognized revenue baseline.");
  }
}

function isWithinTargetPeriod(
  revenue: RevenueSnapshot,
  target: RevenueTargetSnapshot
): boolean {
  return (
    Date.parse(revenue.period.start) >= Date.parse(target.period.start) &&
    Date.parse(revenue.period.end) <= Date.parse(target.period.end)
  );
}

function isRecognizedByAsOf(
  revenue: RevenueSnapshot,
  asOf: Timestamp
): boolean {
  return (
    revenue.recognizedAt !== undefined &&
    Date.parse(revenue.recognizedAt) <= Date.parse(asOf)
  );
}

function calculateForecastRevenue(
  recognizedRevenue: number,
  target: RevenueTargetSnapshot,
  asOf: Timestamp
): number {
  const elapsedRatio = calculateElapsedRatio(target, asOf);

  if (recognizedRevenue === 0 || elapsedRatio === 0) {
    return 0;
  }

  return recognizedRevenue / elapsedRatio;
}

function calculateElapsedRatio(
  target: RevenueTargetSnapshot,
  asOf: Timestamp
): number {
  const start = Date.parse(target.period.start);
  const end = Date.parse(target.period.end);
  const asOfTime = Date.parse(asOf);
  const effectiveAsOf = Math.min(Math.max(asOfTime, start), end);
  const duration = end - start;

  if (duration <= 0) {
    throw new Error("Revenue target period end must be after start.");
  }

  return (effectiveAsOf - start) / duration;
}
