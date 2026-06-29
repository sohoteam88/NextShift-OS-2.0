import type { BusinessId, Timestamp } from "@nextshift/shared";
import { Revenue, type RevenueId, type RevenueSnapshot } from "./revenue";
import type {
  RevenueRepository,
  RevenueSearchCriteria,
} from "./revenue-repository";

export class InMemoryRevenueRepository implements RevenueRepository {
  private readonly revenue = new Map<RevenueId, RevenueSnapshot>();

  async save(revenue: Revenue): Promise<void> {
    const snapshot = revenue.toSnapshot();
    this.revenue.set(snapshot.revenueId, cloneSnapshot(snapshot));
  }

  async findById(revenueId: RevenueId): Promise<Revenue | null> {
    const snapshot = this.revenue.get(revenueId);
    return snapshot ? Revenue.rehydrate(snapshot) : null;
  }

  async findByBusinessId(businessId: BusinessId): Promise<readonly Revenue[]> {
    return this.search({ businessId });
  }

  async search(criteria: RevenueSearchCriteria): Promise<readonly Revenue[]> {
    return [...this.revenue.values()]
      .filter((revenue) => matchesCriteria(revenue, criteria))
      .sort(compareRevenue)
      .map((revenue) => Revenue.rehydrate(revenue));
  }

  async exists(revenueId: RevenueId): Promise<boolean> {
    return this.revenue.has(revenueId);
  }

  async archive(
    revenueId: RevenueId,
    archivedAt: Timestamp
  ): Promise<Revenue | null> {
    const revenue = await this.findById(revenueId);

    if (!revenue) {
      return null;
    }

    revenue.archive(archivedAt);
    await this.save(revenue);

    return revenue;
  }
}

function matchesCriteria(
  revenue: RevenueSnapshot,
  criteria: RevenueSearchCriteria
): boolean {
  if (criteria.businessId && revenue.businessId !== criteria.businessId) {
    return false;
  }

  if (criteria.source && revenue.source !== criteria.source) {
    return false;
  }

  if (criteria.status && revenue.status !== criteria.status) {
    return false;
  }

  return !(
    criteria.currency &&
    revenue.summary.currency !== criteria.currency.trim().toUpperCase()
  );
}

function compareRevenue(
  left: RevenueSnapshot,
  right: RevenueSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(snapshot: RevenueSnapshot): RevenueSnapshot {
  return {
    ...snapshot,
    period: Object.freeze({ ...snapshot.period }),
    summary: Object.freeze({ ...snapshot.summary }),
  };
}
