import type { Revenue, RevenueSnapshot } from "../revenue";
import type { RevenueTarget, RevenueTargetSnapshot } from "../revenue-target";
import { RevenueProgress } from "./revenue-progress";

export class RevenueProgressCalculator {
  calculate(
    target: RevenueTarget,
    revenue: readonly Revenue[]
  ): RevenueProgress {
    const targetSnapshot = target.toSnapshot();

    assertActiveTarget(targetSnapshot);

    const matchingRevenue = revenue
      .map((item) => item.toSnapshot())
      .filter((item) => item.businessId === targetSnapshot.businessId)
      .filter((item) => item.status === "recognized")
      .filter((item) => isWithinTargetPeriod(item, targetSnapshot));

    const recognizedRevenue = matchingRevenue.reduce((total, item) => {
      assertCurrencyMatchesTarget(item, targetSnapshot);
      return total + item.summary.amount;
    }, 0);

    return RevenueProgress.create({
      revenueTargetId: targetSnapshot.revenueTargetId,
      businessId: targetSnapshot.businessId,
      targetPeriod: targetSnapshot.period,
      targetAmount: targetSnapshot.summary.targetAmount,
      recognizedRevenue,
      currency: targetSnapshot.summary.currency,
    });
  }
}

function assertActiveTarget(target: RevenueTargetSnapshot): void {
  if (target.status !== "active") {
    throw new Error("Only active revenue targets can be used for progress.");
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

function isWithinTargetPeriod(
  revenue: RevenueSnapshot,
  target: RevenueTargetSnapshot
): boolean {
  return (
    Date.parse(revenue.period.start) >= Date.parse(target.period.start) &&
    Date.parse(revenue.period.end) <= Date.parse(target.period.end)
  );
}
