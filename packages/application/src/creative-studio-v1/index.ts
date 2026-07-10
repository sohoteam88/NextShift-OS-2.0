import type {
  BusinessBrainV1Id,
  BusinessBrainV1Repository,
  BusinessFoundationId,
  BusinessFoundationRepository,
  ConversationEngineV1Id,
  ConversationEngineV1Repository,
  CreativeLifecycleStatus,
  CreativeStudioV1,
  CreativeStudioV1DomainEvent,
  CreativeStudioV1Id,
  CreativeStudioV1Repository,
  DecisionEngineV1Id,
  DecisionEngineV1Repository,
} from "@nextshift/domain";
import { CreativeStudioV1 as CreativeStudioV1Aggregate } from "@nextshift/domain";
import type { CausationId, EventId, Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateCreativeStudioId = () => CreativeStudioV1Id;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateCreativeStudioId: CreateCreativeStudioId = () =>
  crypto.randomUUID() as CreativeStudioV1Id;

export interface CreativeStudioV1EventPublisher {
  publish(event: CreativeStudioV1DomainEvent): Promise<void>;
}

export interface CreateCreativeStudioV1Command extends ApplicationCommand {
  readonly commandType: "CreateCreativeStudioV1";
  readonly creativeStudioId?: CreativeStudioV1Id;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly causationId?: CausationId;
}

export interface RequestCreativeStudioReviewCommand extends ApplicationCommand {
  readonly commandType: "RequestCreativeStudioReview";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface ApproveCreativeStudioCommand extends ApplicationCommand {
  readonly commandType: "ApproveCreativeStudio";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface RequestCreativeStudioRevisionCommand extends ApplicationCommand {
  readonly commandType: "RequestCreativeStudioRevision";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface RejectCreativeStudioCommand extends ApplicationCommand {
  readonly commandType: "RejectCreativeStudio";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface PackageCreativeStudioForHandoffCommand
  extends ApplicationCommand {
  readonly commandType: "PackageCreativeStudioForHandoff";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface ArchiveCreativeStudioCommand extends ApplicationCommand {
  readonly commandType: "ArchiveCreativeStudio";
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface GetCreativeStudioV1Query extends ApplicationQuery {
  readonly queryType: "GetCreativeStudioV1";
  readonly creativeStudioId: CreativeStudioV1Id;
}

export interface ListCreativeStudiosForBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListCreativeStudiosForBusiness";
}

export interface GetLatestCreativeStudioForConversationQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestCreativeStudioForConversation";
  readonly conversationId: ConversationEngineV1Id;
}

export interface CreativeStudioV1ApplicationResult {
  readonly creativeStudio: CreativeStudioV1;
}

export interface CreativeStudioV1QueryResult {
  readonly creativeStudio: CreativeStudioV1 | null;
}

export interface CreativeStudioV1ListQueryResult {
  readonly creativeStudios: readonly CreativeStudioV1[];
}

export interface CreativeStudioV1ApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "BusinessBrainNotFound"
    | "DecisionEngineNotFound"
    | "ConversationNotFound"
    | "CreativeStudioNotFound"
    | "ValidationFailed"
    | "CreativeStudioPersistenceFailed"
    | "CreativeStudioEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CreativeStudioV1ApplicationService {
  constructor(
    private readonly creativeStudioRepository: CreativeStudioV1Repository,
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly decisionEngineRepository: DecisionEngineV1Repository,
    private readonly conversationRepository: ConversationEngineV1Repository,
    private readonly eventPublisher: CreativeStudioV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createCreativeStudioId: CreateCreativeStudioId = defaultCreateCreativeStudioId
  ) {}

  async createCreativeStudio(
    command: CreateCreativeStudioV1Command
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    try {
      const loaded = await this.loadUpstream(command);
      if (!loaded.ok) return loaded;

      const createdAt = this.now();
      const creativeStudio = CreativeStudioV1Aggregate.create({
        creativeStudioId:
          command.creativeStudioId ?? this.createCreativeStudioId(),
        foundation: loaded.value.foundation.toSnapshot(),
        brain: loaded.value.brain.toSnapshot(),
        decisionEngine: loaded.value.decisionEngine.toSnapshot(),
        conversation: loaded.value.conversation.toSnapshot(),
        createdAt,
      });

      await this.creativeStudioRepository.save(creativeStudio);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "CreativeStudioV1Created",
        aggregateId: creativeStudio.creativeStudioId,
        aggregateType: "CreativeStudioV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          creativeStudioId: creativeStudio.creativeStudioId,
          businessId: creativeStudio.businessId,
          conversationId: creativeStudio.conversationId,
          packageCount: 7,
          createdAt,
        },
      });

      return success({ creativeStudio });
    } catch (error) {
      return failure(mapCreativeStudioV1ApplicationError(error));
    }
  }

  async requestReview(
    command: RequestCreativeStudioReviewCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    return this.transition(command, "in_review", "CreativeStudioReviewRequested");
  }

  async approveCreativeStudio(
    command: ApproveCreativeStudioCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    return this.transition(command, "approved", "CreativeStudioApprovalRecorded");
  }

  async requestRevision(
    command: RequestCreativeStudioRevisionCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    return this.transition(
      command,
      "revision_requested",
      "CreativeStudioLifecycleChanged"
    );
  }

  async rejectCreativeStudio(
    command: RejectCreativeStudioCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    return this.transition(command, "rejected", "CreativeStudioLifecycleChanged");
  }

  async packageForHandoff(
    command: PackageCreativeStudioForHandoffCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    try {
      const loaded = await this.loadCreativeStudio(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      loaded.value.creativeStudio.packageForHandoff(changedAt);

      return this.saveAndPublish(
        loaded.value.creativeStudio,
        command,
        "CreativeStudioPackagedForHandoff",
        changedAt
      );
    } catch (error) {
      return failure(mapCreativeStudioV1ApplicationError(error));
    }
  }

  async archiveCreativeStudio(
    command: ArchiveCreativeStudioCommand
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    return this.transition(command, "archived", "CreativeStudioLifecycleChanged");
  }

  async getCreativeStudio(
    query: GetCreativeStudioV1Query
  ): Promise<CreativeStudioV1QueryResult> {
    const creativeStudio = await this.creativeStudioRepository.findById(
      query.creativeStudioId
    );
    return {
      creativeStudio:
        creativeStudio?.businessId === query.context.businessId
          ? creativeStudio
          : null,
    };
  }

  async listCreativeStudiosForBusiness(
    query: ListCreativeStudiosForBusinessQuery
  ): Promise<CreativeStudioV1ListQueryResult> {
    return {
      creativeStudios: await this.creativeStudioRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async getLatestCreativeStudioForConversation(
    query: GetLatestCreativeStudioForConversationQuery
  ): Promise<CreativeStudioV1QueryResult> {
    const creativeStudio =
      await this.creativeStudioRepository.findLatestByConversationId(
        query.conversationId
      );
    return {
      creativeStudio:
        creativeStudio?.businessId === query.context.businessId
          ? creativeStudio
          : null,
    };
  }

  private async loadUpstream(command: {
    readonly foundationId: BusinessFoundationId;
    readonly brainId: BusinessBrainV1Id;
    readonly engineId: DecisionEngineV1Id;
    readonly conversationId: ConversationEngineV1Id;
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
        readonly conversation: NonNullable<
          Awaited<ReturnType<ConversationEngineV1Repository["findById"]>>
        >;
      },
      CreativeStudioV1ApplicationError
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

    const conversation = await this.conversationRepository.findById(
      command.conversationId
    );
    if (!conversation) {
      return failure({
        code: "ConversationNotFound",
        message: "Conversation Engine was not found.",
      });
    }

    if (
      foundation.businessId !== command.context.businessId ||
      brain.businessId !== command.context.businessId ||
      decisionEngine.businessId !== command.context.businessId ||
      conversation.businessId !== command.context.businessId
    ) {
      return failure({
        code: "ValidationFailed",
        message: "Creative Studio upstream records do not belong to the command business.",
      });
    }

    if (decisionEngine.brainId !== brain.brainId) {
      return failure({
        code: "ValidationFailed",
        message: "Decision Engine does not belong to the supplied Business Brain.",
      });
    }

    if (conversation.engineId !== decisionEngine.engineId) {
      return failure({
        code: "ValidationFailed",
        message: "Conversation Engine does not belong to the supplied Decision Engine.",
      });
    }

    return success({ foundation, brain, decisionEngine, conversation });
  }

  private async loadCreativeStudio(command: {
    readonly creativeStudioId: CreativeStudioV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    const creativeStudio = await this.creativeStudioRepository.findById(
      command.creativeStudioId
    );

    if (!creativeStudio) {
      return failure({
        code: "CreativeStudioNotFound",
        message: "Creative Studio record was not found.",
      });
    }

    if (creativeStudio.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Creative Studio does not belong to the command business.",
      });
    }

    return success({ creativeStudio });
  }

  private async transition(
    command:
      | RequestCreativeStudioReviewCommand
      | ApproveCreativeStudioCommand
      | RequestCreativeStudioRevisionCommand
      | RejectCreativeStudioCommand
      | ArchiveCreativeStudioCommand,
    status: Exclude<CreativeLifecycleStatus, "drafted" | "packaged" | "ready_for_handoff">,
    eventType: Exclude<
      CreativeStudioV1DomainEvent["eventType"],
      "CreativeStudioV1Created" | "CreativeStudioPackagedForHandoff"
    >
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    try {
      const loaded = await this.loadCreativeStudio(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      if (status === "in_review") {
        loaded.value.creativeStudio.requestReview(changedAt);
      } else if (status === "approved") {
        loaded.value.creativeStudio.approve(changedAt);
      } else if (status === "revision_requested") {
        loaded.value.creativeStudio.requestRevision(changedAt);
      } else if (status === "rejected") {
        loaded.value.creativeStudio.reject(changedAt);
      } else {
        loaded.value.creativeStudio.archive(changedAt);
      }

      return this.saveAndPublish(
        loaded.value.creativeStudio,
        command,
        eventType,
        changedAt
      );
    } catch (error) {
      return failure(mapCreativeStudioV1ApplicationError(error));
    }
  }

  private async saveAndPublish(
    creativeStudio: CreativeStudioV1,
    command: {
      readonly context: ApplicationCommand["context"];
      readonly causationId?: CausationId;
    },
    eventType: Exclude<
      CreativeStudioV1DomainEvent["eventType"],
      "CreativeStudioV1Created"
    >,
    changedAt: Timestamp
  ): Promise<Result<CreativeStudioV1ApplicationResult, CreativeStudioV1ApplicationError>> {
    await this.creativeStudioRepository.save(creativeStudio);
    await this.publish({
      eventId: this.createEventId(),
      eventType,
      aggregateId: creativeStudio.creativeStudioId,
      aggregateType: "CreativeStudioV1",
      occurredAt: changedAt,
      version: 1,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
      payload: {
        creativeStudioId: creativeStudio.creativeStudioId,
        status: creativeStudio.toSnapshot().lifecycleStatus,
        changedAt,
      },
    });

    return success({ creativeStudio });
  }

  private async publish(event: CreativeStudioV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapCreativeStudioV1ApplicationError(
  error: unknown
): CreativeStudioV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Creative Studio operation failed.",
    cause: error,
  };
}
