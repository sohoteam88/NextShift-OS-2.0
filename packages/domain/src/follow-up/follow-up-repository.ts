import type { CustomerId } from "../customer";
import type { FollowUp, FollowUpId } from ".";
import type { Timestamp } from "@nextshift/shared";

export interface FollowUpRepository {
  save(followUp: FollowUp): Promise<void>;
  findById(followUpId: FollowUpId): Promise<FollowUp | null>;
  findByCustomer(customerId: CustomerId): Promise<readonly FollowUp[]>;
  findPending(): Promise<readonly FollowUp[]>;
  findOverdue(asOf: Timestamp): Promise<readonly FollowUp[]>;
  complete(followUpId: FollowUpId, completedAt: Timestamp): Promise<FollowUp | null>;
  cancel(followUpId: FollowUpId, cancelledAt: Timestamp): Promise<FollowUp | null>;
}
