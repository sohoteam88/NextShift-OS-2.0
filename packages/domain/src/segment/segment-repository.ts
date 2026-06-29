import type { BusinessId, Timestamp } from "@nextshift/shared";
import type { CustomerId } from "../customer";
import type {
  Segment,
  SegmentAssignmentSource,
  SegmentId,
  SegmentMembershipSnapshot,
} from ".";

export interface SegmentRepository {
  save(segment: Segment): Promise<void>;
  findById(segmentId: SegmentId): Promise<Segment | null>;
  findByName(businessId: BusinessId, name: string): Promise<Segment | null>;
  list(businessId?: BusinessId): Promise<readonly Segment[]>;
  assignCustomer(
    segmentId: SegmentId,
    customerId: CustomerId,
    assignedAt: Timestamp,
    assignmentSource?: SegmentAssignmentSource
  ): Promise<Segment | null>;
  removeCustomer(
    segmentId: SegmentId,
    customerId: CustomerId,
    removedAt: Timestamp
  ): Promise<Segment | null>;
  evaluate(
    segmentId: SegmentId,
    customerIds: readonly CustomerId[],
    evaluatedAt: Timestamp
  ): Promise<readonly CustomerId[]>;
  listMembers(segmentId: SegmentId): Promise<readonly SegmentMembershipSnapshot[]>;
  listCustomerSegments(customerId: CustomerId): Promise<readonly Segment[]>;
}
