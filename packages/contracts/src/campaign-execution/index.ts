import type { BusinessId, Timestamp } from "@nextshift/shared";

export type CampaignExecutionWorkflowEventType =
  | "CampaignExecutionCreated"
  | "CampaignExecutionPrepared"
  | "CampaignExecutionLaunched"
  | "CampaignExecutionCompleted"
  | "CampaignExecutionCancelled"
  | "CampaignExecutionArchived";

export type CampaignExecutionWorkflowPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type CampaignExecutionWorkflowChannel =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "xiaohongshu"
  | "email"
  | "whatsapp"
  | "webinar"
  | "landing_page"
  | "manual";

export interface CampaignExecutionCreatedPayload {
  readonly executionId: string;
  readonly businessId: BusinessId;
  readonly title: string;
  readonly objective: string;
  readonly channels: readonly CampaignExecutionWorkflowChannel[];
  readonly priority: CampaignExecutionWorkflowPriority;
  readonly sourceOpportunityId?: string;
  readonly sourceContentPlanId?: string;
  readonly createdAt: Timestamp;
}

export interface CampaignExecutionPreparedPayload {
  readonly executionId: string;
  readonly preparedAt: Timestamp;
}

export interface CampaignExecutionLaunchedPayload {
  readonly executionId: string;
  readonly launchedAt: Timestamp;
}

export interface CampaignExecutionCompletedPayload {
  readonly executionId: string;
  readonly resultSummary: string;
  readonly completedAt: Timestamp;
}

export interface CampaignExecutionCancelledPayload {
  readonly executionId: string;
  readonly reason: string;
  readonly cancelledAt: Timestamp;
}

export interface CampaignExecutionArchivedPayload {
  readonly executionId: string;
  readonly archivedAt: Timestamp;
}
