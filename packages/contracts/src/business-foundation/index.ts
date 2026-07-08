import type { BusinessId, Timestamp } from "@nextshift/shared";

export type BusinessFoundationLifecycleStage =
  | "draft"
  | "active"
  | "paused"
  | "archived";

export type BusinessFoundationSourceType =
  | "manual"
  | "conversation"
  | "document"
  | "workflow"
  | "system";

export type BusinessFoundationRecordType =
  | "knowledge-node"
  | "knowledge-relationship"
  | "story"
  | "business-memory"
  | "content-memory"
  | "customer-memory"
  | "timeline-event"
  | "learning"
  | "reflection";

export interface BusinessFoundationSourcePayload {
  readonly type: BusinessFoundationSourceType;
  readonly referenceId: string;
  readonly summary: string;
  readonly capturedAt: Timestamp;
}

export interface BusinessTwinPayload {
  readonly name: string;
  readonly market: string;
  readonly audience: string;
  readonly offer: string;
  readonly valueProposition: string;
  readonly goals: readonly string[];
  readonly priorities: readonly string[];
  readonly lifecycleStage: BusinessFoundationLifecycleStage;
}

export interface BrandDnaPayload {
  readonly brandDnaId: string;
  readonly positioning: string;
  readonly promise: string;
  readonly voice: string;
  readonly values: readonly string[];
  readonly differentiators: readonly string[];
  readonly audienceFit: string;
  readonly proofMarkers: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface BusinessFoundationSummaryPayload {
  readonly foundationId: string;
  readonly businessId: BusinessId;
  readonly twin: BusinessTwinPayload;
  readonly brandDna?: BrandDnaPayload;
  readonly knowledgeNodeCount: number;
  readonly storyCount: number;
  readonly businessMemoryCount: number;
  readonly contentMemoryCount: number;
  readonly customerMemoryCount: number;
  readonly timelineEventCount: number;
  readonly learningRecordCount: number;
  readonly reflectionRecordCount: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type BusinessFoundationEventType =
  | "BusinessFoundationCreated"
  | "BusinessFoundationBrandDnaUpdated"
  | "BusinessFoundationRecordAdded";

export interface BusinessFoundationCreatedPayload {
  readonly foundationId: string;
  readonly businessId: BusinessId;
  readonly createdAt: Timestamp;
}

export interface BusinessFoundationBrandDnaUpdatedPayload {
  readonly foundationId: string;
  readonly businessId: BusinessId;
  readonly brandDnaId: string;
  readonly updatedAt: Timestamp;
}

export interface BusinessFoundationRecordAddedPayload {
  readonly foundationId: string;
  readonly businessId: BusinessId;
  readonly recordType: BusinessFoundationRecordType;
  readonly recordId: string;
}
