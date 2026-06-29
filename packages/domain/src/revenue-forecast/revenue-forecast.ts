import type { BusinessId, Timestamp } from "@nextshift/shared";
import type { RevenueTargetId, RevenueTargetPeriod } from "../revenue-target";

export type RevenueForecastStatus =
  | "no_progress"
  | "below_target"
  | "on_target"
  | "above_target";

export interface RevenueForecastSnapshot {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly targetPeriod: RevenueTargetPeriod;
  readonly asOf: Timestamp;
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly forecastRevenue: number;
  readonly forecastRemainingRevenue: number;
  readonly forecastAchievementPercentage: number;
  readonly forecastVariance: number;
  readonly currency: string;
  readonly status: RevenueForecastStatus;
}

export interface CreateRevenueForecastInput {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly targetPeriod: RevenueTargetPeriod;
  readonly asOf: Timestamp;
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly forecastRevenue: number;
  readonly currency: string;
}

export class RevenueForecast {
  private constructor(private readonly snapshot: RevenueForecastSnapshot) {}

  static create(input: CreateRevenueForecastInput): RevenueForecast {
    const targetAmount = createPositiveAmount(
      input.targetAmount,
      "target amount"
    );
    const recognizedRevenue = createNonNegativeAmount(
      input.recognizedRevenue,
      "recognized revenue"
    );
    const forecastRevenue = createNonNegativeAmount(
      input.forecastRevenue,
      "forecast revenue"
    );
    const currency = createForecastCurrency(input.currency);
    const asOf = createForecastTimestamp(input.asOf, "asOf");
    const forecastRemainingRevenue = Math.max(targetAmount - forecastRevenue, 0);
    const forecastAchievementPercentage = (forecastRevenue / targetAmount) * 100;
    const forecastVariance = forecastRevenue - targetAmount;

    return new RevenueForecast(
      Object.freeze({
        revenueTargetId: input.revenueTargetId,
        businessId: input.businessId,
        targetPeriod: Object.freeze({ ...input.targetPeriod }),
        asOf,
        targetAmount,
        recognizedRevenue,
        forecastRevenue,
        forecastRemainingRevenue,
        forecastAchievementPercentage,
        forecastVariance,
        currency,
        status: determineForecastStatus(forecastAchievementPercentage),
      })
    );
  }

  get revenueTargetId(): RevenueTargetId {
    return this.snapshot.revenueTargetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): RevenueForecastStatus {
    return this.snapshot.status;
  }

  toSnapshot(): RevenueForecastSnapshot {
    return {
      ...this.snapshot,
      targetPeriod: Object.freeze({ ...this.snapshot.targetPeriod }),
    };
  }
}

export function createForecastCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error("Revenue forecast currency must be a three-letter code.");
  }

  return normalized;
}

export function createForecastTimestamp(
  value: Timestamp,
  field: string
): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Revenue forecast ${field} must be a valid timestamp.`);
  }

  return value;
}

function createPositiveAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Revenue forecast ${label} must be positive.`);
  }

  return value;
}

function createNonNegativeAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Revenue forecast ${label} must be non-negative.`);
  }

  return value;
}

function determineForecastStatus(
  forecastAchievementPercentage: number
): RevenueForecastStatus {
  if (forecastAchievementPercentage === 0) {
    return "no_progress";
  }

  if (forecastAchievementPercentage < 100) {
    return "below_target";
  }

  if (forecastAchievementPercentage === 100) {
    return "on_target";
  }

  return "above_target";
}
