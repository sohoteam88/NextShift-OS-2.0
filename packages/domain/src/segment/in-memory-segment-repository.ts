import type { BusinessId, Timestamp } from "@nextshift/shared";
import type { CustomerId } from "../customer";
import { Segment } from ".";
import type {
  SegmentAssignmentSource,
  SegmentId,
  SegmentMembershipSnapshot,
  SegmentSnapshot,
} from ".";
import type { SegmentRepository } from "./segment-repository";

interface StoredSegment {
  readonly snapshot: SegmentSnapshot;
  readonly sequence: number;
}

export class InMemorySegmentRepository implements SegmentRepository {
  private readonly segments = new Map<SegmentId, StoredSegment>();
  private nextSequence = 0;

  async save(segment: Segment): Promise<void> {
    const snapshot = segment.toSnapshot();
    const existing = this.segments.get(snapshot.segmentId);
    const duplicateName = [...this.segments.values()].find(
      (stored) =>
        stored.snapshot.businessId === snapshot.businessId &&
        normalizeName(stored.snapshot.name) === normalizeName(snapshot.name) &&
        stored.snapshot.segmentId !== snapshot.segmentId
    );

    if (duplicateName) {
      throw new Error("Segment name must be unique within a business.");
    }

    this.segments.set(snapshot.segmentId, {
      snapshot: cloneSnapshot(snapshot),
      sequence: existing?.sequence ?? this.nextSequence,
    });

    if (!existing) {
      this.nextSequence += 1;
    }
  }

  async findById(segmentId: SegmentId): Promise<Segment | null> {
    const stored = this.segments.get(segmentId);
    return stored ? Segment.rehydrate(stored.snapshot) : null;
  }

  async findByName(
    businessId: BusinessId,
    name: string
  ): Promise<Segment | null> {
    const normalized = normalizeName(name);
    const stored = [...this.segments.values()].find(
      (segment) =>
        segment.snapshot.businessId === businessId &&
        normalizeName(segment.snapshot.name) === normalized
    );

    return stored ? Segment.rehydrate(stored.snapshot) : null;
  }

  async list(businessId?: BusinessId): Promise<readonly Segment[]> {
    return [...this.segments.values()]
      .filter((stored) => !businessId || stored.snapshot.businessId === businessId)
      .sort(compareSegments)
      .map((stored) => Segment.rehydrate(stored.snapshot));
  }

  async assignCustomer(
    segmentId: SegmentId,
    customerId: CustomerId,
    assignedAt: Timestamp,
    assignmentSource: SegmentAssignmentSource = "manual"
  ): Promise<Segment | null> {
    const segment = await this.findById(segmentId);

    if (!segment) {
      return null;
    }

    segment.assignCustomer(customerId, assignedAt, assignmentSource);
    await this.save(segment);

    return segment;
  }

  async removeCustomer(
    segmentId: SegmentId,
    customerId: CustomerId,
    removedAt: Timestamp
  ): Promise<Segment | null> {
    const segment = await this.findById(segmentId);

    if (!segment) {
      return null;
    }

    segment.removeCustomer(customerId, removedAt);
    await this.save(segment);

    return segment;
  }

  async evaluate(
    segmentId: SegmentId,
    customerIds: readonly CustomerId[],
    evaluatedAt: Timestamp
  ): Promise<readonly CustomerId[]> {
    const segment = await this.findById(segmentId);

    if (!segment) {
      return [];
    }

    const assignedCustomerIds = segment.evaluate(customerIds, evaluatedAt);
    await this.save(segment);

    return assignedCustomerIds;
  }

  async listMembers(
    segmentId: SegmentId
  ): Promise<readonly SegmentMembershipSnapshot[]> {
    const segment = await this.findById(segmentId);
    return segment ? segment.listMembers() : [];
  }

  async listCustomerSegments(
    customerId: CustomerId
  ): Promise<readonly Segment[]> {
    return [...this.segments.values()]
      .filter((stored) =>
        stored.snapshot.memberships.some(
          (membership) =>
            membership.customerId === customerId && !membership.removedAt
        )
      )
      .sort(compareSegments)
      .map((stored) => Segment.rehydrate(stored.snapshot));
  }
}

function compareSegments(left: StoredSegment, right: StoredSegment): number {
  const byCreatedAt =
    Date.parse(left.snapshot.createdAt) - Date.parse(right.snapshot.createdAt);
  return byCreatedAt === 0 ? left.sequence - right.sequence : byCreatedAt;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function cloneSnapshot(snapshot: SegmentSnapshot): SegmentSnapshot {
  return {
    ...snapshot,
    rule: {
      ...snapshot.rule,
      criteria:
        snapshot.rule.criteria === undefined
          ? undefined
          : { ...snapshot.rule.criteria },
    },
    memberships: snapshot.memberships.map((membership) => ({ ...membership })),
  };
}
