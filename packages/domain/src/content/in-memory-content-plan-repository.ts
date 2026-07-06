import type { BusinessId } from "@nextshift/shared";
import type { ContentCalendarId } from "./calendar";
import { ContentPlan } from "./plan";
import type {
  ContentPlanId,
  ContentPlanSnapshot,
  PlannedContentSnapshot,
} from "./plan";
import type { ContentPlanRepository } from "./content-plan-repository";

export class InMemoryContentPlanRepository implements ContentPlanRepository {
  private readonly plans = new Map<ContentPlanId, ContentPlanSnapshot>();

  async save(plan: ContentPlan): Promise<void> {
    const snapshot = plan.toSnapshot();
    this.plans.set(snapshot.planId, cloneSnapshot(snapshot));
  }

  async findById(planId: ContentPlanId): Promise<ContentPlan | null> {
    const snapshot = this.plans.get(planId);
    return snapshot ? ContentPlan.rehydrate(snapshot) : null;
  }

  async findByBusinessId(
    businessId: BusinessId
  ): Promise<readonly ContentPlan[]> {
    return [...this.plans.values()]
      .filter((plan) => plan.businessId === businessId)
      .sort(comparePlans)
      .map((plan) => ContentPlan.rehydrate(plan));
  }

  async findByCalendarId(
    calendarId: ContentCalendarId
  ): Promise<readonly ContentPlan[]> {
    return [...this.plans.values()]
      .filter((plan) => plan.calendarId === calendarId)
      .sort(comparePlans)
      .map((plan) => ContentPlan.rehydrate(plan));
  }

  async findPendingApprovals(
    businessId: BusinessId
  ): Promise<readonly ContentPlan[]> {
    return [...this.plans.values()]
      .filter(
        (plan) =>
          plan.businessId === businessId && plan.status === "pending_review"
      )
      .sort(comparePlans)
      .map((plan) => ContentPlan.rehydrate(plan));
  }

  async findApproved(businessId: BusinessId): Promise<readonly ContentPlan[]> {
    return [...this.plans.values()]
      .filter(
        (plan) => plan.businessId === businessId && plan.status === "approved"
      )
      .sort(comparePlans)
      .map((plan) => ContentPlan.rehydrate(plan));
  }

  async listEntries(
    planId: ContentPlanId
  ): Promise<readonly PlannedContentSnapshot[]> {
    return cloneEntries(this.plans.get(planId)?.entries ?? []);
  }

  async exists(planId: ContentPlanId): Promise<boolean> {
    return this.plans.has(planId);
  }
}

function comparePlans(
  left: ContentPlanSnapshot,
  right: ContentPlanSnapshot
): number {
  return Date.parse(left.createdAt) - Date.parse(right.createdAt);
}

function cloneSnapshot(snapshot: ContentPlanSnapshot): ContentPlanSnapshot {
  return {
    ...snapshot,
    entries: cloneEntries(snapshot.entries),
    approvalHistory:
      snapshot.approvalHistory === undefined
        ? undefined
        : Object.freeze(
            snapshot.approvalHistory.map((approval) => ({ ...approval }))
          ),
  };
}

function cloneEntries(
  entries: readonly PlannedContentSnapshot[]
): readonly PlannedContentSnapshot[] {
  return Object.freeze(
    entries.map((entry) => ({
      ...entry,
      platforms: Object.freeze([...entry.platforms]),
    }))
  );
}
