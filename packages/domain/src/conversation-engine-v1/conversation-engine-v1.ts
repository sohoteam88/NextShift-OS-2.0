import type {
  BusinessBrainV1Id,
  BusinessBrainV1Snapshot,
} from "../business-brain-v1";
import type {
  BusinessFoundationId,
  BusinessFoundationSnapshot,
} from "../business-foundation";
import type {
  DecisionEngineV1Id,
  DecisionEngineV1Snapshot,
  DecisionRecommendation,
  DecisionRecommendationId,
} from "../decision-engine-v1";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type ConversationEngineV1Id = Brand<string, "ConversationEngineV1Id">;
export type ConversationTurnId = Brand<string, "ConversationTurnId">;
export type ClarificationQuestionId = Brand<string, "ClarificationQuestionId">;
export type BrainstormOptionId = Brand<string, "BrainstormOptionId">;
export type ConversationMemoryReferenceId = Brand<
  string,
  "ConversationMemoryReferenceId"
>;

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

export interface ConversationContextReference {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly businessName: string;
  readonly activeRecommendationIds: readonly DecisionRecommendationId[];
  readonly priorConversationIds: readonly ConversationEngineV1Id[];
  readonly workspaceContext?: string;
}

export interface StrategyChatPrompt {
  readonly prompt: string;
  readonly tradeoffFrame: string;
  readonly evidenceSummary: string;
  readonly recommendedOpeningQuestion: string;
}

export interface ConversationTurn {
  readonly turnId: ConversationTurnId;
  readonly role: ConversationParticipantRole;
  readonly message: string;
  readonly relatedRecommendationId?: DecisionRecommendationId;
  readonly createdAt: Timestamp;
}

export interface RecommendationDiscussion {
  readonly recommendationId: DecisionRecommendationId;
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

export interface ClarificationQuestion {
  readonly clarificationId: ClarificationQuestionId;
  readonly question: string;
  readonly sourceReference: string;
  readonly status: ClarificationStatus;
  readonly response?: string;
  readonly followUpRequired: boolean;
}

export interface BrainstormOption {
  readonly optionId: BrainstormOptionId;
  readonly title: string;
  readonly rationale: string;
  readonly constraints: readonly string[];
  readonly evidenceSummaries: readonly string[];
  readonly status: BrainstormOptionStatus;
}

export interface FollowUpConversation {
  readonly parentConversationId?: ConversationEngineV1Id;
  readonly followUpReason: string;
  readonly continuitySummary: string;
  readonly unresolvedQuestions: readonly string[];
}

export interface ConversationMemoryReference {
  readonly memoryReferenceId: ConversationMemoryReferenceId;
  readonly sourceType: "business-memory" | "customer-memory" | "timeline" | "conversation";
  readonly sourceId: string;
  readonly summary: string;
}

export interface HumanApprovalConversation {
  readonly approvalQuestion: string;
  readonly status: HumanApprovalStatus;
  readonly rationale?: string;
  readonly actorReference?: string;
  readonly decidedAt?: Timestamp;
  readonly executionHandoffIntent?: string;
}

export interface ConversationEngineV1Snapshot {
  readonly conversationId: ConversationEngineV1Id;
  readonly businessId: BusinessId;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly context: ConversationContextReference;
  readonly strategyChat: StrategyChatPrompt;
  readonly turns: readonly ConversationTurn[];
  readonly recommendationDiscussions: readonly RecommendationDiscussion[];
  readonly clarifications: readonly ClarificationQuestion[];
  readonly brainstormOptions: readonly BrainstormOption[];
  readonly followUp: FollowUpConversation;
  readonly memoryReferences: readonly ConversationMemoryReference[];
  readonly approval: HumanApprovalConversation;
  readonly lifecycleStatus: ConversationLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateConversationEngineV1Input {
  readonly conversationId: ConversationEngineV1Id;
  readonly foundation: BusinessFoundationSnapshot;
  readonly brain: BusinessBrainV1Snapshot;
  readonly decisionEngine: DecisionEngineV1Snapshot;
  readonly priorConversationIds?: readonly ConversationEngineV1Id[];
  readonly workspaceContext?: string;
  readonly createdAt: Timestamp;
}

export interface ConversationEngineV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: ConversationEngineV1EventType;
  readonly aggregateId: ConversationEngineV1Id;
  readonly aggregateType: "ConversationEngineV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type ConversationEngineV1EventType =
  | "ConversationEngineV1Created"
  | "ConversationTurnAdded"
  | "ClarificationAnswered"
  | "ConversationApprovalRecorded"
  | "ConversationLifecycleChanged";

export interface ConversationEngineV1CreatedEvent
  extends ConversationEngineV1EventMetadata {
  readonly eventType: "ConversationEngineV1Created";
  readonly payload: {
    readonly conversationId: ConversationEngineV1Id;
    readonly businessId: BusinessId;
    readonly engineId: DecisionEngineV1Id;
    readonly recommendationDiscussionCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface ConversationEngineV1ChangedEvent
  extends ConversationEngineV1EventMetadata {
  readonly eventType:
    | "ConversationTurnAdded"
    | "ClarificationAnswered"
    | "ConversationApprovalRecorded"
    | "ConversationLifecycleChanged";
  readonly payload: {
    readonly conversationId: ConversationEngineV1Id;
    readonly status: ConversationLifecycleStatus;
    readonly changedAt: Timestamp;
  };
}

export type ConversationEngineV1DomainEvent =
  | ConversationEngineV1CreatedEvent
  | ConversationEngineV1ChangedEvent;

export class ConversationEngineV1 {
  private constructor(private snapshot: ConversationEngineV1Snapshot) {}

  static create(input: CreateConversationEngineV1Input): ConversationEngineV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    validateUpstream(input.foundation, input.brain, input.decisionEngine);
    const activeRecommendations = input.decisionEngine.recommendations.slice(0, 3);
    const clarifications = createClarifications(
      input.conversationId,
      input.brain,
      input.decisionEngine
    );
    const recommendationDiscussions = activeRecommendations.map((recommendation) =>
      createRecommendationDiscussion(recommendation)
    );

    return new ConversationEngineV1({
      conversationId: input.conversationId,
      businessId: input.foundation.businessId,
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      context: {
        foundationId: input.foundation.foundationId,
        brainId: input.brain.brainId,
        engineId: input.decisionEngine.engineId,
        businessName: input.foundation.twin.name,
        activeRecommendationIds: activeRecommendations.map(
          (recommendation) => recommendation.recommendationId
        ),
        priorConversationIds: [...(input.priorConversationIds ?? [])],
        workspaceContext: input.workspaceContext,
      },
      strategyChat: createStrategyChat(input.brain, input.decisionEngine),
      turns: [
        {
          turnId: `${input.conversationId}:turn:opening` as ConversationTurnId,
          role: "ai",
          message: input.decisionEngine.coachGuidance.prompt,
          relatedRecommendationId: activeRecommendations[0]?.recommendationId,
          createdAt,
        },
      ],
      recommendationDiscussions,
      clarifications,
      brainstormOptions: createBrainstormOptions(
        input.conversationId,
        activeRecommendations
      ),
      followUp: {
        parentConversationId: input.priorConversationIds?.at(-1),
        followUpReason:
          input.priorConversationIds?.length === undefined ||
          input.priorConversationIds.length === 0
            ? "Initial recommendation discussion."
            : "Continue prior recommendation discussion.",
        continuitySummary: input.brain.interpretation.meaning,
        unresolvedQuestions: clarifications
          .filter((clarification) => clarification.status === "open")
          .map((clarification) => clarification.question),
      },
      memoryReferences: createMemoryReferences(input.conversationId, input.foundation),
      approval: {
        approvalQuestion:
          activeRecommendations[0] === undefined
            ? "Do you approve continuing this strategic conversation?"
            : `Do you approve discussing: ${activeRecommendations[0].title}?`,
        status: "pending",
      },
      lifecycleStatus:
        clarifications.length > 0 ? "awaiting_clarification" : "opened",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: ConversationEngineV1Snapshot): ConversationEngineV1 {
    validateSnapshot(snapshot);
    return new ConversationEngineV1(cloneSnapshot(snapshot));
  }

  get conversationId(): ConversationEngineV1Id {
    return this.snapshot.conversationId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get engineId(): DecisionEngineV1Id {
    return this.snapshot.engineId;
  }

  addTurn(input: {
    readonly turnId: ConversationTurnId;
    readonly role: ConversationParticipantRole;
    readonly message: string;
    readonly relatedRecommendationId?: DecisionRecommendationId;
    readonly createdAt: Timestamp;
  }): void {
    const createdAt = createTimestamp(input.createdAt, "turn.createdAt");
    this.replace({
      ...this.snapshot,
      turns: [
        ...this.snapshot.turns,
        {
          turnId: input.turnId,
          role: input.role,
          message: createRequiredString(input.message, "Turn message"),
          relatedRecommendationId: input.relatedRecommendationId,
          createdAt,
        },
      ],
      lifecycleStatus: "in_progress",
      updatedAt: createdAt,
    });
  }

  answerClarification(
    clarificationId: ClarificationQuestionId,
    response: string,
    answeredAt: Timestamp
  ): void {
    const timestamp = createTimestamp(answeredAt, "answeredAt");
    let found = false;
    const clarifications = this.snapshot.clarifications.map((clarification) => {
      if (clarification.clarificationId !== clarificationId) return clarification;
      found = true;
      return {
        ...clarification,
        status: "answered" as const,
        response: createRequiredString(response, "Clarification response"),
        followUpRequired: false,
      };
    });

    if (!found) {
      throw new Error("Clarification question was not found.");
    }

    this.replace({
      ...this.snapshot,
      clarifications,
      lifecycleStatus: "in_progress",
      updatedAt: timestamp,
    });
  }

  requestApproval(requestedAt: Timestamp): void {
    this.transition("awaiting_approval", requestedAt);
  }

  approve(input: {
    readonly rationale: string;
    readonly actorReference: string;
    readonly decidedAt: Timestamp;
    readonly executionHandoffIntent?: string;
  }): void {
    this.recordApproval("approved", input);
  }

  reject(input: {
    readonly rationale: string;
    readonly actorReference: string;
    readonly decidedAt: Timestamp;
  }): void {
    this.recordApproval("rejected", input);
  }

  defer(input: {
    readonly rationale: string;
    readonly actorReference: string;
    readonly decidedAt: Timestamp;
  }): void {
    this.recordApproval("deferred", input);
  }

  resolve(resolvedAt: Timestamp): void {
    this.transition("resolved", resolvedAt);
  }

  archive(archivedAt: Timestamp): void {
    this.transition("archived", archivedAt);
  }

  toSnapshot(): ConversationEngineV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private recordApproval(
    status: Exclude<HumanApprovalStatus, "pending" | "revise">,
    input: {
      readonly rationale: string;
      readonly actorReference: string;
      readonly decidedAt: Timestamp;
      readonly executionHandoffIntent?: string;
    }
  ): void {
    const decidedAt = createTimestamp(input.decidedAt, "decidedAt");
    this.replace({
      ...this.snapshot,
      approval: {
        ...this.snapshot.approval,
        status,
        rationale: createRequiredString(input.rationale, "Approval rationale"),
        actorReference: createRequiredString(
          input.actorReference,
          "Actor reference"
        ),
        decidedAt,
        executionHandoffIntent: input.executionHandoffIntent,
      },
      lifecycleStatus: status,
      updatedAt: decidedAt,
    });
  }

  private transition(
    status: ConversationLifecycleStatus,
    changedAt: Timestamp
  ): void {
    const timestamp = createTimestamp(changedAt, "changedAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: status,
      updatedAt: timestamp,
    });
  }

  private replace(snapshot: ConversationEngineV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function createStrategyChat(
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot
): StrategyChatPrompt {
  return {
    prompt: decisionEngine.coachGuidance.prompt,
    tradeoffFrame: decisionEngine.coachGuidance.tradeoffExplanation,
    evidenceSummary: brain.understanding.summary,
    recommendedOpeningQuestion: decisionEngine.coachGuidance.clarifyingQuestion,
  };
}

function createRecommendationDiscussion(
  recommendation: DecisionRecommendation
): RecommendationDiscussion {
  return {
    recommendationId: recommendation.recommendationId,
    title: recommendation.title,
    recommendedAction: recommendation.recommendedAction,
    priority: recommendation.priorityScore.priority,
    confidence: recommendation.confidenceScore.score,
    rationale: recommendation.explanation.reason,
    evidenceSummaries: recommendation.explanation.evidence.map(
      (evidence) => evidence.summary
    ),
    userQuestions: [],
    discussionNotes: [recommendation.explanation.expectedBusinessValue],
    decisionIntent: undefined,
  };
}

function createClarifications(
  conversationId: ConversationEngineV1Id,
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot
): readonly ClarificationQuestion[] {
  const gapQuestions = decisionEngine.gaps.map((gap, index) => ({
    clarificationId: `${conversationId}:clarification:gap:${index + 1}` as ClarificationQuestionId,
    question: gap.recommendedFollowUp,
    sourceReference: gap.gapId,
    status: "open" as const,
    followUpRequired: true,
  }));
  const uncertaintyQuestions = brain.interpretation.uncertainty.map(
    (uncertainty, index) => ({
      clarificationId: `${conversationId}:clarification:uncertainty:${index + 1}` as ClarificationQuestionId,
      question: `Can you clarify: ${uncertainty}`,
      sourceReference: "business-brain-uncertainty",
      status: "open" as const,
      followUpRequired: true,
    })
  );

  return [...gapQuestions, ...uncertaintyQuestions];
}

function createBrainstormOptions(
  conversationId: ConversationEngineV1Id,
  recommendations: readonly DecisionRecommendation[]
): readonly BrainstormOption[] {
  return recommendations.map((recommendation, index) => ({
    optionId: `${conversationId}:brainstorm:${index + 1}` as BrainstormOptionId,
    title: `Explore ${recommendation.title}`,
    rationale: recommendation.summary,
    constraints: recommendation.explanation.riskNotes,
    evidenceSummaries: recommendation.explanation.evidence.map(
      (evidence) => evidence.summary
    ),
    status: "proposed",
  }));
}

function createMemoryReferences(
  conversationId: ConversationEngineV1Id,
  foundation: BusinessFoundationSnapshot
): readonly ConversationMemoryReference[] {
  const businessMemory = foundation.businessMemory.map((memory, index) => ({
    memoryReferenceId: `${conversationId}:memory:business:${index + 1}` as ConversationMemoryReferenceId,
    sourceType: "business-memory" as const,
    sourceId: memory.memoryId,
    summary: memory.fact,
  }));
  const customerMemory = foundation.customerMemory.map((memory, index) => ({
    memoryReferenceId: `${conversationId}:memory:customer:${index + 1}` as ConversationMemoryReferenceId,
    sourceType: "customer-memory" as const,
    sourceId: memory.memoryId,
    summary: `${memory.segment}: ${memory.need}`,
  }));
  const timeline = foundation.timeline.map((event, index) => ({
    memoryReferenceId: `${conversationId}:memory:timeline:${index + 1}` as ConversationMemoryReferenceId,
    sourceType: "timeline" as const,
    sourceId: event.eventId,
    summary: event.summary,
  }));

  return [...businessMemory, ...customerMemory, ...timeline];
}

function validateUpstream(
  foundation: BusinessFoundationSnapshot,
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot
): void {
  if (foundation.businessId !== brain.businessId) {
    throw new Error("Business Foundation and Business Brain must share a business.");
  }
  if (brain.businessId !== decisionEngine.businessId) {
    throw new Error("Business Brain and Decision Engine must share a business.");
  }
  if (brain.brainId !== decisionEngine.brainId) {
    throw new Error("Decision Engine must come from the supplied Business Brain.");
  }
}

function validateSnapshot(snapshot: ConversationEngineV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createRequiredString(snapshot.context.businessName, "Business name");
  snapshot.turns.forEach((turn) => {
    createRequiredString(turn.message, "Turn message");
    createTimestamp(turn.createdAt, "turn.createdAt");
  });
}

function cloneSnapshot(
  snapshot: ConversationEngineV1Snapshot
): ConversationEngineV1Snapshot {
  return {
    ...snapshot,
    context: {
      ...snapshot.context,
      activeRecommendationIds: [...snapshot.context.activeRecommendationIds],
      priorConversationIds: [...snapshot.context.priorConversationIds],
    },
    strategyChat: { ...snapshot.strategyChat },
    turns: snapshot.turns.map((turn) => ({ ...turn })),
    recommendationDiscussions: snapshot.recommendationDiscussions.map(
      (discussion) => ({
        ...discussion,
        evidenceSummaries: [...discussion.evidenceSummaries],
        userQuestions: [...discussion.userQuestions],
        discussionNotes: [...discussion.discussionNotes],
      })
    ),
    clarifications: snapshot.clarifications.map((clarification) => ({
      ...clarification,
    })),
    brainstormOptions: snapshot.brainstormOptions.map((option) => ({
      ...option,
      constraints: [...option.constraints],
      evidenceSummaries: [...option.evidenceSummaries],
    })),
    followUp: {
      ...snapshot.followUp,
      unresolvedQuestions: [...snapshot.followUp.unresolvedQuestions],
    },
    memoryReferences: snapshot.memoryReferences.map((reference) => ({
      ...reference,
    })),
    approval: { ...snapshot.approval },
  };
}

function createRequiredString(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function createTimestamp(value: Timestamp, label: string): Timestamp {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
  return value;
}
