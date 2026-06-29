import type { Timestamp } from "@nextshift/shared";
import type { CustomerId } from "../customer";
import { FollowUp } from ".";
import type { FollowUpId, FollowUpSnapshot } from ".";
import type { FollowUpRepository } from "./follow-up-repository";

interface StoredFollowUp {
  readonly snapshot: FollowUpSnapshot;
  readonly sequence: number;
}

export class InMemoryFollowUpRepository implements FollowUpRepository {
  private readonly followUps = new Map<FollowUpId, StoredFollowUp>();
  private nextSequence = 0;

  async save(followUp: FollowUp): Promise<void> {
    const snapshot = followUp.toSnapshot();
    const existing = this.followUps.get(snapshot.followUpId);

    this.followUps.set(snapshot.followUpId, {
      snapshot: cloneSnapshot(snapshot),
      sequence: existing?.sequence ?? this.nextSequence,
    });

    if (!existing) {
      this.nextSequence += 1;
    }
  }

  async findById(followUpId: FollowUpId): Promise<FollowUp | null> {
    const stored = this.followUps.get(followUpId);
    return stored ? FollowUp.rehydrate(stored.snapshot) : null;
  }

  async findByCustomer(customerId: CustomerId): Promise<readonly FollowUp[]> {
    return this.sortedFollowUps((stored) => stored.snapshot.customerId === customerId);
  }

  async findPending(): Promise<readonly FollowUp[]> {
    return this.sortedFollowUps((stored) => stored.snapshot.status === "pending");
  }

  async findOverdue(asOf: Timestamp): Promise<readonly FollowUp[]> {
    return this.sortedFollowUps((stored) =>
      FollowUp.rehydrate(stored.snapshot).isOverdue(asOf)
    );
  }

  async complete(
    followUpId: FollowUpId,
    completedAt: Timestamp
  ): Promise<FollowUp | null> {
    const followUp = await this.findById(followUpId);

    if (!followUp) {
      return null;
    }

    followUp.complete(completedAt);
    await this.save(followUp);

    return followUp;
  }

  async cancel(
    followUpId: FollowUpId,
    cancelledAt: Timestamp
  ): Promise<FollowUp | null> {
    const followUp = await this.findById(followUpId);

    if (!followUp) {
      return null;
    }

    followUp.cancel(cancelledAt);
    await this.save(followUp);

    return followUp;
  }

  private sortedFollowUps(
    predicate: (stored: StoredFollowUp) => boolean
  ): readonly FollowUp[] {
    return [...this.followUps.values()]
      .filter(predicate)
      .sort(compareFollowUps)
      .map((stored) => FollowUp.rehydrate(stored.snapshot));
  }
}

function compareFollowUps(left: StoredFollowUp, right: StoredFollowUp): number {
  const byDueAt = Date.parse(left.snapshot.dueAt) - Date.parse(right.snapshot.dueAt);
  return byDueAt === 0 ? left.sequence - right.sequence : byDueAt;
}

function cloneSnapshot(snapshot: FollowUpSnapshot): FollowUpSnapshot {
  return { ...snapshot };
}
