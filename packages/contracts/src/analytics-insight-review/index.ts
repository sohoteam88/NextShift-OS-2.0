import type { BusinessId, Timestamp } from "@nextshift/shared";

export type AnalyticsInsightReviewEventType =
  | "AnalyticsInsightReviewCreated"
  | "AnalyticsInsightReviewSubmitted"
  | "AnalyticsInsightReviewApproved"
  | "AnalyticsInsightReviewDismissed"
  | "AnalyticsInsightReviewArchived";

export type AnalyticsInsightReviewCategory =
  | "crm"
  | "content"
  | "opportunity"
  | "campaign"
  | "revenue"
  | "customer"
  | "operational"
  | "strategic";

export type AnalyticsInsightReviewPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AnalyticsInsightReviewSourceType =
  | "crm"
  | "content"
  | "opportunity"
  | "campaign"
  | "revenue_forecast"
  | "analytics"
  | "manual"
  | "system";

export interface AnalyticsInsightReviewSourcePayload {
  readonly type: AnalyticsInsightReviewSourceType;
  readonly referenceId: string;
  readonly summary: string;
}

export interface AnalyticsInsightReviewCreatedPayload {
  readonly reviewId: string;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly summary: string;
  readonly category: AnalyticsInsightReviewCategory;
  readonly priority: AnalyticsInsightReviewPriority;
  readonly sources: readonly AnalyticsInsightReviewSourcePayload[];
  readonly createdAt: Timestamp;
}

export interface AnalyticsInsightReviewSubmittedPayload {
  readonly reviewId: string;
  readonly submittedAt: Timestamp;
}

export interface AnalyticsInsightReviewApprovedPayload {
  readonly reviewId: string;
  readonly reviewer: string;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}

export interface AnalyticsInsightReviewDismissedPayload {
  readonly reviewId: string;
  readonly reviewer: string;
  readonly reason: string;
  readonly dismissedAt: Timestamp;
}

export interface AnalyticsInsightReviewArchivedPayload {
  readonly reviewId: string;
  readonly archivedAt: Timestamp;
}
