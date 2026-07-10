import type { BusinessId, Timestamp } from "@nextshift/shared";

export type ContentPlanWorkflowEventType =
  | "ContentPlanCreated"
  | "ContentSubmittedForReview"
  | "ContentApproved"
  | "ContentRejected"
  | "ContentRevisionRequested";

export type ContentPlanWorkflowDecision =
  | "approved"
  | "rejected"
  | "needs_revision";

export interface ContentPlanCreatedPayload {
  readonly planId: string;
  readonly businessId: BusinessId;
  readonly title?: string;
  readonly objective?: string;
  readonly audience?: string;
  readonly channel?: string;
  readonly priority?: "low" | "medium" | "high";
  readonly recommendedPublishDate?: Timestamp;
  readonly createdAt: Timestamp;
}

export interface ContentSubmittedForReviewPayload {
  readonly planId: string;
  readonly submittedAt: Timestamp;
}

export interface ContentApprovalDecisionPayload {
  readonly planId: string;
  readonly reviewer: string;
  readonly decision: ContentPlanWorkflowDecision;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}
