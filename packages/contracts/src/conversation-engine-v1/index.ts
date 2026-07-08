import type { BusinessId, Timestamp } from "@nextshift/shared";

export type ConversationParticipantRole = "ai" | "user" | "system";

export type ConversationLifecycleStatus =
  | "opened"
  | "in_progress"
  | "awaiting_clarification"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "deferred"
  | "resolved"
  | "archived";

export type ClarificationStatus = "open" | "answered" | "deferred";
export type BrainstormOptionStatus = "proposed" | "selected" | "discarded";
export type HumanApprovalStatus = "pending" | "approved" | "rejected" | "revise" | "deferred";

export interface ConversationContextPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly businessName: string;
  readonly activeRecommendationIds: readonly string[];
  readonly priorConversationIds: readonly string[];
  readonly workspaceContext?: string;
}

export interface StrategyChatPromptPayload {
  readonly prompt: string;
  readonly tradeoffFrame: string;
  readonly evidenceSummary: string;
  readonly recommendedOpeningQuestion: string;
}

export interface ConversationTurnPayload {
  readonly turnId: string;
  readonly role: ConversationParticipantRole;
  readonly message: string;
  readonly relatedRecommendationId?: string;
  readonly createdAt: Timestamp;
}

export interface RecommendationDiscussionPayload {
  readonly recommendationId: string;
  readonly title: string;
  readonly recommendedAction: string;
  readonly priority: string;
  readonly confidence: number;
  readonly rationale: string;
  readonly evidenceSummaries: readonly string[];
  readonly userQuestions: readonly string[];
  readonly discussionNotes: readonly string[];
  readonly decisionIntent?: HumanApprovalStatus;
}

export interface ClarificationQuestionPayload {
  readonly clarificationId: string;
  readonly question: string;
  readonly sourceReference: string;
  readonly status: ClarificationStatus;
  readonly response?: string;
  readonly followUpRequired: boolean;
}

export interface BrainstormOptionPayload {
  readonly optionId: string;
  readonly title: string;
  readonly rationale: string;
  readonly constraints: readonly string[];
  readonly evidenceSummaries: readonly string[];
  readonly status: BrainstormOptionStatus;
}

export interface FollowUpConversationPayload {
  readonly parentConversationId?: string;
  readonly followUpReason: string;
  readonly continuitySummary: string;
  readonly unresolvedQuestions: readonly string[];
}

export interface ConversationMemoryReferencePayload {
  readonly memoryReferenceId: string;
  readonly sourceType: "business-memory" | "customer-memory" | "timeline" | "conversation";
  readonly sourceId: string;
  readonly summary: string;
}

export interface HumanApprovalConversationPayload {
  readonly approvalQuestion: string;
  readonly status: HumanApprovalStatus;
  readonly rationale?: string;
  readonly actorReference?: string;
  readonly decidedAt?: Timestamp;
  readonly executionHandoffIntent?: string;
}

export interface ConversationEngineV1SummaryPayload {
  readonly conversationId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly context: ConversationContextPayload;
  readonly strategyChat: StrategyChatPromptPayload;
  readonly turns: readonly ConversationTurnPayload[];
  readonly recommendationDiscussions: readonly RecommendationDiscussionPayload[];
  readonly clarifications: readonly ClarificationQuestionPayload[];
  readonly brainstormOptions: readonly BrainstormOptionPayload[];
  readonly followUp: FollowUpConversationPayload;
  readonly memoryReferences: readonly ConversationMemoryReferencePayload[];
  readonly approval: HumanApprovalConversationPayload;
  readonly lifecycleStatus: ConversationLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type ConversationEngineV1EventType =
  | "ConversationEngineV1Created"
  | "ConversationTurnAdded"
  | "ClarificationAnswered"
  | "ConversationApprovalRecorded"
  | "ConversationLifecycleChanged";

export interface ConversationEngineV1CreatedPayload {
  readonly conversationId: string;
  readonly businessId: BusinessId;
  readonly engineId: string;
  readonly recommendationDiscussionCount: number;
  readonly createdAt: Timestamp;
}

export interface ConversationEngineV1ChangedPayload {
  readonly conversationId: string;
  readonly status: ConversationLifecycleStatus;
  readonly changedAt: Timestamp;
}
