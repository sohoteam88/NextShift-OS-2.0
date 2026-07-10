import type { BusinessId, Timestamp } from "@nextshift/shared";

export type RevenueForecastReviewEventType =
  | "RevenueForecastReviewCreated"
  | "RevenueForecastReviewSubmitted"
  | "RevenueForecastReviewApproved"
  | "RevenueForecastReviewRejected"
  | "RevenueForecastReviewArchived";

export interface RevenueForecastReviewForecastPayload {
  readonly revenueTargetId: string;
  readonly businessId: BusinessId;
  readonly targetPeriod: {
    readonly start: Timestamp;
    readonly end: Timestamp;
  };
  readonly asOf: Timestamp;
  readonly targetAmount: number;
  readonly recognizedRevenue: number;
  readonly forecastRevenue: number;
  readonly forecastRemainingRevenue: number;
  readonly forecastAchievementPercentage: number;
  readonly forecastVariance: number;
  readonly currency: string;
  readonly status: string;
}

export interface RevenueForecastReviewCreatedPayload {
  readonly reviewId: string;
  readonly businessId: BusinessId;
  readonly revenueTargetId: string;
  readonly forecast: RevenueForecastReviewForecastPayload;
  readonly reviewNotes?: string;
  readonly createdAt: Timestamp;
}

export interface RevenueForecastReviewSubmittedPayload {
  readonly reviewId: string;
  readonly submittedAt: Timestamp;
}

export interface RevenueForecastReviewApprovedPayload {
  readonly reviewId: string;
  readonly reviewer: string;
  readonly reason?: string;
  readonly approvedAt: Timestamp;
}

export interface RevenueForecastReviewRejectedPayload {
  readonly reviewId: string;
  readonly reviewer: string;
  readonly reason?: string;
  readonly rejectedAt: Timestamp;
}

export interface RevenueForecastReviewArchivedPayload {
  readonly reviewId: string;
  readonly archivedAt: Timestamp;
}
