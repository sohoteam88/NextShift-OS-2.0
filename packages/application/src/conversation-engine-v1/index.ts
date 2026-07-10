import type {
  BusinessBrainV1Id,
  BusinessBrainV1Repository,
  BusinessFoundationId,
  BusinessFoundationRepository,
  ConversationEngineV1,
  ConversationEngineV1DomainEvent,
  ConversationEngineV1Id,
  ConversationEngineV1Repository,
  ConversationLifecycleStatus,
  ConversationTurnId,
  ClarificationQuestionId,
  DecisionEngineV1Id,
  DecisionEngineV1Repository,
  DecisionRecommendationId,
} from "@nextshift/domain";
import { ConversationEngineV1 as ConversationEngineV1Aggregate } from "@nextshift/domain";
import type {
  CausationId,
  EventId,
  Result,
  Timestamp,
} from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateConversationId = () => ConversationEngineV1Id;
type CreateTurnId = () => ConversationTurnId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateConversationId: CreateConversationId = () =>
  crypto.randomUUID() as ConversationEngineV1Id;
const defaultCreateTurnId: CreateTurnId = () =>
  crypto.randomUUID() as ConversationTurnId;

export interface ConversationEngineV1EventPublisher {
  publish(event: ConversationEngineV1DomainEvent): Promise<void>;
}

export interface CreateConversationEngineV1Command extends ApplicationCommand {
  readonly commandType: "CreateConversationEngineV1";
  readonly conversationId?: ConversationEngineV1Id;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly priorConversationIds?: readonly ConversationEngineV1Id[];
  readonly workspaceContext?: string;
  readonly causationId?: CausationId;
}

export interface AddConversationTurnCommand extends ApplicationCommand {
  readonly commandType: "AddConversationTurn";
  readonly conversationId: ConversationEngineV1Id;
  readonly turnId?: ConversationTurnId;
  readonly role: "ai" | "user" | "system";
  readonly message: string;
  readonly relatedRecommendationId?: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface AnswerClarificationCommand extends ApplicationCommand {
  readonly commandType: "AnswerClarification";
  readonly conversationId: ConversationEngineV1Id;
  readonly clarificationId: ClarificationQuestionId;
  readonly response: string;
  readonly causationId?: CausationId;
}

export interface RequestConversationApprovalCommand extends ApplicationCommand {
  readonly commandType: "RequestConversationApproval";
  readonly conversationId: ConversationEngineV1Id;
  readonly causationId?: CausationId;
}

export interface ApproveConversationCommand extends ApplicationCommand {
  readonly commandType: "ApproveConversation";
  readonly conversationId: ConversationEngineV1Id;
  readonly rationale: string;
  readonly actorReference: string;
  readonly executionHandoffIntent?: string;
  readonly causationId?: CausationId;
}

export interface RejectConversationCommand extends ApplicationCommand {
  readonly commandType: "RejectConversation";
  readonly conversationId: ConversationEngineV1Id;
  readonly rationale: string;
  readonly actorReference: string;
  readonly causationId?: CausationId;
}

export interface DeferConversationCommand extends ApplicationCommand {
  readonly commandType: "DeferConversation";
  readonly conversationId: ConversationEngineV1Id;
  readonly rationale: string;
  readonly actorReference: string;
  readonly causationId?: CausationId;
}

export interface ResolveConversationCommand extends ApplicationCommand {
  readonly commandType: "ResolveConversation";
  readonly conversationId: ConversationEngineV1Id;
  readonly causationId?: CausationId;
}

export interface ArchiveConversationCommand extends ApplicationCommand {
  readonly commandType: "ArchiveConversation";
  readonly conversationId: ConversationEngineV1Id;
  readonly causationId?: CausationId;
}

export interface GetConversationEngineV1Query extends ApplicationQuery {
  readonly queryType: "GetConversationEngineV1";
  readonly conversationId: ConversationEngineV1Id;
}

export interface ListConversationsForBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListConversationsForBusiness";
}

export interface GetLatestConversationForDecisionEngineQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestConversationForDecisionEngine";
  readonly engineId: DecisionEngineV1Id;
}

export interface ConversationEngineV1ApplicationResult {
  readonly conversation: ConversationEngineV1;
}

export interface ConversationEngineV1QueryResult {
  readonly conversation: ConversationEngineV1 | null;
}

export interface ConversationEngineV1ListQueryResult {
  readonly conversations: readonly ConversationEngineV1[];
}

export interface ConversationEngineV1ApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "BusinessBrainNotFound"
    | "DecisionEngineNotFound"
    | "ConversationNotFound"
    | "ValidationFailed"
    | "ConversationPersistenceFailed"
    | "ConversationEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ConversationEngineV1ApplicationService {
  constructor(
    private readonly conversationRepository: ConversationEngineV1Repository,
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly decisionEngineRepository: DecisionEngineV1Repository,
    private readonly eventPublisher: ConversationEngineV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createConversationId: CreateConversationId = defaultCreateConversationId,
    private readonly createTurnId: CreateTurnId = defaultCreateTurnId
  ) {}

  async createConversation(
    command: CreateConversationEngineV1Command
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadUpstream(command);
      if (!loaded.ok) return loaded;

      const createdAt = this.now();
      const conversation = ConversationEngineV1Aggregate.create({
        conversationId: command.conversationId ?? this.createConversationId(),
        foundation: loaded.value.foundation.toSnapshot(),
        brain: loaded.value.brain.toSnapshot(),
        decisionEngine: loaded.value.decisionEngine.toSnapshot(),
        priorConversationIds: command.priorConversationIds,
        workspaceContext: command.workspaceContext,
        createdAt,
      });

      await this.conversationRepository.save(conversation);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "ConversationEngineV1Created",
        aggregateId: conversation.conversationId,
        aggregateType: "ConversationEngineV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          conversationId: conversation.conversationId,
          businessId: conversation.businessId,
          engineId: conversation.engineId,
          recommendationDiscussionCount:
            conversation.toSnapshot().recommendationDiscussions.length,
          createdAt,
        },
      });

      return success({ conversation });
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  async addTurn(
    command: AddConversationTurnCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadConversation(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      loaded.value.conversation.addTurn({
        turnId: command.turnId ?? this.createTurnId(),
        role: command.role,
        message: command.message,
        relatedRecommendationId: command.relatedRecommendationId,
        createdAt: changedAt,
      });

      return this.saveAndPublish(
        loaded.value.conversation,
        command,
        "ConversationTurnAdded",
        changedAt
      );
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  async answerClarification(
    command: AnswerClarificationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadConversation(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      loaded.value.conversation.answerClarification(
        command.clarificationId,
        command.response,
        changedAt
      );

      return this.saveAndPublish(
        loaded.value.conversation,
        command,
        "ClarificationAnswered",
        changedAt
      );
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  async requestApproval(
    command: RequestConversationApprovalCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    return this.transition(command, "awaiting_approval");
  }

  async approveConversation(
    command: ApproveConversationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadConversation(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      loaded.value.conversation.approve({
        rationale: command.rationale,
        actorReference: command.actorReference,
        executionHandoffIntent: command.executionHandoffIntent,
        decidedAt: changedAt,
      });

      return this.saveAndPublish(
        loaded.value.conversation,
        command,
        "ConversationApprovalRecorded",
        changedAt
      );
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  async rejectConversation(
    command: RejectConversationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    return this.recordNegativeApproval(command, "rejected");
  }

  async deferConversation(
    command: DeferConversationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    return this.recordNegativeApproval(command, "deferred");
  }

  async resolveConversation(
    command: ResolveConversationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    return this.transition(command, "resolved");
  }

  async archiveConversation(
    command: ArchiveConversationCommand
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    return this.transition(command, "archived");
  }

  async getConversation(
    query: GetConversationEngineV1Query
  ): Promise<ConversationEngineV1QueryResult> {
    const conversation = await this.conversationRepository.findById(
      query.conversationId
    );
    return {
      conversation:
        conversation?.businessId === query.context.businessId
          ? conversation
          : null,
    };
  }

  async listConversationsForBusiness(
    query: ListConversationsForBusinessQuery
  ): Promise<ConversationEngineV1ListQueryResult> {
    return {
      conversations: await this.conversationRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async getLatestConversationForDecisionEngine(
    query: GetLatestConversationForDecisionEngineQuery
  ): Promise<ConversationEngineV1QueryResult> {
    const conversation =
      await this.conversationRepository.findLatestByDecisionEngineId(
        query.engineId
      );
    return {
      conversation:
        conversation?.businessId === query.context.businessId
          ? conversation
          : null,
    };
  }

  private async loadUpstream(command: {
    readonly foundationId: BusinessFoundationId;
    readonly brainId: BusinessBrainV1Id;
    readonly engineId: DecisionEngineV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<
    Result<
      {
        readonly foundation: NonNullable<
          Awaited<ReturnType<BusinessFoundationRepository["findById"]>>
        >;
        readonly brain: NonNullable<
          Awaited<ReturnType<BusinessBrainV1Repository["findById"]>>
        >;
        readonly decisionEngine: NonNullable<
          Awaited<ReturnType<DecisionEngineV1Repository["findById"]>>
        >;
      },
      ConversationEngineV1ApplicationError
    >
  > {
    const foundation = await this.foundationRepository.findById(
      command.foundationId
    );
    if (!foundation) {
      return failure({
        code: "BusinessFoundationNotFound",
        message: "Business Foundation was not found.",
      });
    }

    const brain = await this.brainRepository.findById(command.brainId);
    if (!brain) {
      return failure({
        code: "BusinessBrainNotFound",
        message: "Business Brain was not found.",
      });
    }

    const decisionEngine = await this.decisionEngineRepository.findById(
      command.engineId
    );
    if (!decisionEngine) {
      return failure({
        code: "DecisionEngineNotFound",
        message: "Decision Engine was not found.",
      });
    }

    if (
      foundation.businessId !== command.context.businessId ||
      brain.businessId !== command.context.businessId ||
      decisionEngine.businessId !== command.context.businessId
    ) {
      return failure({
        code: "ValidationFailed",
        message: "Conversation upstream records do not belong to the command business.",
      });
    }

    if (decisionEngine.brainId !== brain.brainId) {
      return failure({
        code: "ValidationFailed",
        message: "Decision Engine does not belong to the supplied Business Brain.",
      });
    }

    return success({ foundation, brain, decisionEngine });
  }

  private async loadConversation(command: {
    readonly conversationId: ConversationEngineV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    const conversation = await this.conversationRepository.findById(
      command.conversationId
    );

    if (!conversation) {
      return failure({
        code: "ConversationNotFound",
        message: "Conversation Engine record was not found.",
      });
    }

    if (conversation.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Conversation does not belong to the command business.",
      });
    }

    return success({ conversation });
  }

  private async transition(
    command: (
      | RequestConversationApprovalCommand
      | ResolveConversationCommand
      | ArchiveConversationCommand
    ) & {
      readonly causationId?: CausationId;
    },
    status: "awaiting_approval" | "resolved" | "archived"
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadConversation(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      if (status === "awaiting_approval") {
        loaded.value.conversation.requestApproval(changedAt);
      } else if (status === "resolved") {
        loaded.value.conversation.resolve(changedAt);
      } else {
        loaded.value.conversation.archive(changedAt);
      }

      return this.saveAndPublish(
        loaded.value.conversation,
        command,
        "ConversationLifecycleChanged",
        changedAt
      );
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  private async recordNegativeApproval(
    command: RejectConversationCommand | DeferConversationCommand,
    status: "rejected" | "deferred"
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadConversation(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      if (status === "rejected") {
        loaded.value.conversation.reject({
          rationale: command.rationale,
          actorReference: command.actorReference,
          decidedAt: changedAt,
        });
      } else {
        loaded.value.conversation.defer({
          rationale: command.rationale,
          actorReference: command.actorReference,
          decidedAt: changedAt,
        });
      }

      return this.saveAndPublish(
        loaded.value.conversation,
        command,
        "ConversationApprovalRecorded",
        changedAt
      );
    } catch (error) {
      return failure(mapConversationEngineV1ApplicationError(error));
    }
  }

  private async saveAndPublish(
    conversation: ConversationEngineV1,
    command: { readonly context: ApplicationCommand["context"]; readonly causationId?: CausationId },
    eventType: Exclude<
      ConversationEngineV1DomainEvent["eventType"],
      "ConversationEngineV1Created"
    >,
    changedAt: Timestamp
  ): Promise<Result<ConversationEngineV1ApplicationResult, ConversationEngineV1ApplicationError>> {
    await this.conversationRepository.save(conversation);
    await this.publish({
      eventId: this.createEventId(),
      eventType,
      aggregateId: conversation.conversationId,
      aggregateType: "ConversationEngineV1",
      occurredAt: changedAt,
      version: 1,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
      payload: {
        conversationId: conversation.conversationId,
        status: conversation.toSnapshot().lifecycleStatus,
        changedAt,
      },
    });

    return success({ conversation });
  }

  private async publish(event: ConversationEngineV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapConversationEngineV1ApplicationError(
  error: unknown
): ConversationEngineV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Conversation Engine operation failed.",
    cause: error,
  };
}
