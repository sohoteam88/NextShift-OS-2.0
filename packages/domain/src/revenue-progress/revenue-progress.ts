import type { BusinessId } from "@nextshift/shared";
import type { RevenueTargetId, RevenueTargetPeriod } from "../revenue-target";

export type RevenueProgressStatus =
  | "not_started"
  | "in_progress"
  | "achieved"
  | "exceeded";

export interface RevenueProgressSnapshot {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly targetPeriod: RevenueTargetPeriod;
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly remainingAmount: number;
  readonly achievementPercentage: number;
  readonly currency: string;
  readonly status: RevenueProgressStatus;
}

export interface CreateRevenueProgressInput {
  readonly revenueTargetId: RevenueTargetId;
  readonly businessId: BusinessId;
  readonly targetPeriod: RevenueTargetPeriod;
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly currency: string;
}

export class RevenueProgress {
  private constructor(private readonly snapshot: RevenueProgressSnapshot) {}

  static create(input: CreateRevenueProgressInput): RevenueProgress {
    const targetAmount = createPositiveAmount(
      input.targetAmount,
      "target amount"
    );
    const recognizedRevenue = createNonNegativeAmount(
      input.recognizedRevenue,
      "recognized revenue"
    );
    const currency = createProgressCurrency(input.currency);
    const remainingAmount = Math.max(targetAmount - recognizedRevenue, 0);
    const achievementPercentage = (recognizedRevenue / targetAmount) * 100;

    return new RevenueProgress(
      Object.freeze({
        revenueTargetId: input.revenueTargetId,
        businessId: input.businessId,
        targetPeriod: Object.freeze({ ...input.targetPeriod }),
        targetAmount,
        recognizedRevenue,
        remainingAmount,
        achievementPercentage,
        currency,
        status: determineProgressStatus(achievementPercentage),
      })
    );
  }

  get revenueTargetId(): RevenueTargetId {
    return this.snapshot.revenueTargetId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): RevenueProgressStatus {
    return this.snapshot.status;
  }

  toSnapshot(): RevenueProgressSnapshot {
    return {
      ...this.snapshot,
      targetPeriod: Object.freeze({ ...this.snapshot.targetPeriod }),
    };
  }
}

export function createProgressCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new Error("Revenue progress currency must be a three-letter code.");
  }

  return normalized;
}

function createPositiveAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Revenue progress ${label} must be positive.`);
  }

  return value;
}

function createNonNegativeAmount(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Revenue progress ${label} must be non-negative.`);
  }

  return value;
}

function determineProgressStatus(
  achievementPercentage: number
): RevenueProgressStatus {
  if (achievementPercentage === 0) {
    return "not_started";
  }

  if (achievementPercentage < 100) {
    return "in_progress";
  }

  if (achievementPercentage === 100) {
    return "achieved";
  }

  return "exceeded";
}
