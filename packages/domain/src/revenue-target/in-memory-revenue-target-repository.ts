import type { BusinessId, Timestamp } from "@nextshift/shared";
import {
  RevenueTarget,
  type RevenueTargetId,
  type RevenueTargetSnapshot,
} from "./revenue-target";
import type {
  RevenueTargetRepository,
  RevenueTargetSearchCriteria,
} from "./revenue-target-repository";

export class InMemoryRevenueTargetRepository
  implements RevenueTargetRepository
{
  private readonly targets = new Map<RevenueTargetId, RevenueTargetSnapshot>();

  async save(target: RevenueTarget): Promise<void> {
    const snapshot = target.toSnapshot();
    this.targets.set(snapshot.revenueTargetId, cloneSnapshot(snapshot));
  }

  async findById(
    targetId: RevenueTargetId
  ): Promise<RevenueTarget | null> {
    const snapshot = this.targets.get(targetId);
    return snapshot ? RevenueTarget.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly RevenueTarget[]> {
    return this.search({ businessId });
  }

  async search(
    criteria: RevenueTargetSearchCriteria
  ): Promise<readonly RevenueTarget[]> {
    return [...this.targets.values()]
      .filter((target) => matchesCriteria(target, criteria))
      .sort(compareTargets)
      .map((target) => RevenueTarget.rehydrate(target));
  }

  async exists(targetId: RevenueTargetId): Promise<boolean> {
    return this.targets.has(targetId);
  }

  async archive(
    targetId: RevenueTargetId,
    archivedAt: Timestamp
  ): Promise<RevenueTarget | null> {
    const target = await this.findById(targetId);

    if (!target) {
      return null;
    }

    target.archive(archivedAt);
    await this.save(target);

    return target;
  }
}

function matchesCriteria(
  target: RevenueTargetSnapshot,
  criteria: RevenueTargetSearchCriteria
): boolean {
  if (criteria.businessId && target.businessId !== criteria.businessId) {
    return false;
  }

  if (criteria.status && target.status !== criteria.status) {
    return false;
  }

  if (
    criteria.currency &&
    target.summary.currency !== criteria.currency.trim().toUpperCase()
  ) {
    return false;
  }

  return !(
    criteria.name &&
    !target.name.toLowerCase().includes(criteria.name.trim().toLowerCase())
  );
}

function compareTargets(
  left: RevenueTargetSnapshot,
  right: RevenueTargetSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(
  snapshot: RevenueTargetSnapshot
): RevenueTargetSnapshot {
  return {
    ...snapshot,
    period: Object.freeze({ ...snapshot.period }),
    summary: Object.freeze({ ...snapshot.summary }),
  };
}
