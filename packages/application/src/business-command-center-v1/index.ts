import type {
  BusinessBrainV1Id,
  BusinessBrainV1Repository,
  BusinessCommandCenterV1,
  BusinessCommandCenterV1DomainEvent,
  BusinessCommandCenterV1Id,
  BusinessCommandCenterV1Repository,
  BusinessFoundationId,
  BusinessFoundationRepository,
  CommandCenterLifecycleStatus,
  ConversationEngineV1Id,
  ConversationEngineV1Repository,
  CreativeStudioV1Id,
  CreativeStudioV1Repository,
  DecisionEngineV1Id,
  DecisionEngineV1Repository,
  GrowthRevenueV1Id,
  GrowthRevenueV1Repository,
} from "@nextshift/domain";
import { BusinessCommandCenterV1 as BusinessCommandCenterV1Aggregate } from "@nextshift/domain";
import type { CausationId, EventId, Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateCommandCenterId = () => BusinessCommandCenterV1Id;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateCommandCenterId: CreateCommandCenterId = () =>
  crypto.randomUUID() as BusinessCommandCenterV1Id;

export interface BusinessCommandCenterV1EventPublisher {
  publish(event: BusinessCommandCenterV1DomainEvent): Promise<void>;
}

export interface CreateBusinessCommandCenterV1Command
  extends ApplicationCommand {
  readonly commandType: "CreateBusinessCommandCenterV1";
  readonly commandCenterId?: BusinessCommandCenterV1Id;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly causationId?: CausationId;
}

export interface ChangeBusinessCommandCenterLifecycleCommand
  extends ApplicationCommand {
  readonly commandType: "ChangeBusinessCommandCenterLifecycle";
  readonly commandCenterId: BusinessCommandCenterV1Id;
  readonly status: Exclude<CommandCenterLifecycleStatus, "drafted">;
  readonly causationId?: CausationId;
}

export interface GetBusinessCommandCenterV1Query extends ApplicationQuery {
  readonly queryType: "GetBusinessCommandCenterV1";
  readonly commandCenterId: BusinessCommandCenterV1Id;
}

export interface ListBusinessCommandCentersForBusinessQuery
  extends ApplicationQuery {
  readonly queryType: "ListBusinessCommandCentersForBusiness";
}

export interface GetLatestBusinessCommandCenterForGrowthRevenueQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestBusinessCommandCenterForGrowthRevenue";
  readonly growthRevenueId: GrowthRevenueV1Id;
}

export interface BusinessCommandCenterV1ApplicationResult {
  readonly commandCenter: BusinessCommandCenterV1;
}

export interface BusinessCommandCenterV1QueryResult {
  readonly commandCenter: BusinessCommandCenterV1 | null;
}

export interface BusinessCommandCenterV1ListQueryResult {
  readonly commandCenters: readonly BusinessCommandCenterV1[];
}

export interface BusinessCommandCenterV1ApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "BusinessBrainNotFound"
    | "DecisionEngineNotFound"
    | "ConversationNotFound"
    | "CreativeStudioNotFound"
    | "GrowthRevenueNotFound"
    | "BusinessCommandCenterNotFound"
    | "ValidationFailed"
    | "BusinessCommandCenterPersistenceFailed"
    | "BusinessCommandCenterEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class BusinessCommandCenterV1ApplicationService {
  constructor(
    private readonly commandCenterRepository: BusinessCommandCenterV1Repository,
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly decisionEngineRepository: DecisionEngineV1Repository,
    private readonly conversationRepository: ConversationEngineV1Repository,
    private readonly creativeStudioRepository: CreativeStudioV1Repository,
    private readonly growthRevenueRepository: GrowthRevenueV1Repository,
    private readonly eventPublisher: BusinessCommandCenterV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createCommandCenterId: CreateCommandCenterId = defaultCreateCommandCenterId
  ) {}

  async createCommandCenter(
    command: CreateBusinessCommandCenterV1Command
  ): Promise<
    Result<
      BusinessCommandCenterV1ApplicationResult,
      BusinessCommandCenterV1ApplicationError
    >
  > {
    try {
      const loaded = await this.loadUpstream(command);
      if (!loaded.ok) return loaded;

      const createdAt = this.now();
      const commandCenter = BusinessCommandCenterV1Aggregate.create({
        commandCenterId:
          command.commandCenterId ?? this.createCommandCenterId(),
        foundation: loaded.value.foundation.toSnapshot(),
        brain: loaded.value.brain.toSnapshot(),
        decisionEngine: loaded.value.decisionEngine.toSnapshot(),
        conversation: loaded.value.conversation.toSnapshot(),
        creativeStudio: loaded.value.creativeStudio.toSnapshot(),
        growthRevenue: loaded.value.growthRevenue.toSnapshot(),
        createdAt,
      });

      await this.commandCenterRepository.save(commandCenter);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessCommandCenterV1Created",
        aggregateId: commandCenter.commandCenterId,
        aggregateType: "BusinessCommandCenterV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          commandCenterId: commandCenter.commandCenterId,
          businessId: commandCenter.businessId,
          growthRevenueId: commandCenter.growthRevenueId,
          recommendationCount:
            commandCenter.toSnapshot().aiRecommendationFeed.length,
          createdAt,
        },
      });

      return success({ commandCenter });
    } catch (error) {
      return failure(mapBusinessCommandCenterV1ApplicationError(error));
    }
  }

  async changeLifecycle(
    command: ChangeBusinessCommandCenterLifecycleCommand
  ): Promise<
    Result<
      BusinessCommandCenterV1ApplicationResult,
      BusinessCommandCenterV1ApplicationError
    >
  > {
    try {
      const loaded = await this.loadCommandCenter(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      if (command.status === "reviewed") {
        loaded.value.commandCenter.review(changedAt);
      } else if (command.status === "active") {
        loaded.value.commandCenter.activate(changedAt);
      } else if (command.status === "resolved") {
        loaded.value.commandCenter.resolve(changedAt);
      } else {
        loaded.value.commandCenter.archive(changedAt);
      }

      await this.commandCenterRepository.save(loaded.value.commandCenter);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessCommandCenterLifecycleChanged",
        aggregateId: loaded.value.commandCenter.commandCenterId,
        aggregateType: "BusinessCommandCenterV1",
        occurredAt: changedAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          commandCenterId: loaded.value.commandCenter.commandCenterId,
          status: loaded.value.commandCenter.toSnapshot().lifecycleStatus,
          changedAt,
        },
      });

      return success({ commandCenter: loaded.value.commandCenter });
    } catch (error) {
      return failure(mapBusinessCommandCenterV1ApplicationError(error));
    }
  }

  async getCommandCenter(
    query: GetBusinessCommandCenterV1Query
  ): Promise<BusinessCommandCenterV1QueryResult> {
    const commandCenter = await this.commandCenterRepository.findById(
      query.commandCenterId
    );
    return {
      commandCenter:
        commandCenter?.businessId === query.context.businessId
          ? commandCenter
          : null,
    };
  }

  async listCommandCentersForBusiness(
    query: ListBusinessCommandCentersForBusinessQuery
  ): Promise<BusinessCommandCenterV1ListQueryResult> {
    return {
      commandCenters: await this.commandCenterRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async getLatestCommandCenterForGrowthRevenue(
    query: GetLatestBusinessCommandCenterForGrowthRevenueQuery
  ): Promise<BusinessCommandCenterV1QueryResult> {
    const commandCenter =
      await this.commandCenterRepository.findLatestByGrowthRevenueId(
        query.growthRevenueId
      );
    return {
      commandCenter:
        commandCenter?.businessId === query.context.businessId
          ? commandCenter
          : null,
    };
  }

  private async loadUpstream(command: {
    readonly foundationId: BusinessFoundationId;
    readonly brainId: BusinessBrainV1Id;
    readonly engineId: DecisionEngineV1Id;
    readonly conversationId: ConversationEngineV1Id;
    readonly creativeStudioId: CreativeStudioV1Id;
    readonly growthRevenueId: GrowthRevenueV1Id;
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
        readonly creativeStudio: NonNullable<
          Awaited<ReturnType<CreativeStudioV1Repository["findById"]>>
        >;
        readonly growthRevenue: NonNullable<
          Awaited<ReturnType<GrowthRevenueV1Repository["findById"]>>
        >;
      },
      BusinessCommandCenterV1ApplicationError
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

    const creativeStudio = await this.creativeStudioRepository.findById(
      command.creativeStudioId
    );
    if (!creativeStudio) {
      return failure({
        code: "CreativeStudioNotFound",
        message: "Creative Studio was not found.",
      });
    }

    const growthRevenue = await this.growthRevenueRepository.findById(
      command.growthRevenueId
    );
    if (!growthRevenue) {
      return failure({
        code: "GrowthRevenueNotFound",
        message: "Growth & Revenue record was not found.",
      });
    }

    if (
      foundation.businessId !== command.context.businessId ||
      brain.businessId !== command.context.businessId ||
      decisionEngine.businessId !== command.context.businessId ||
      conversation.businessId !== command.context.businessId ||
      creativeStudio.businessId !== command.context.businessId ||
      growthRevenue.businessId !== command.context.businessId
    ) {
      return failure({
        code: "ValidationFailed",
        message: "Business Command Center upstream records do not belong to the command business.",
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

    if (creativeStudio.conversationId !== conversation.conversationId) {
      return failure({
        code: "ValidationFailed",
        message: "Creative Studio does not belong to the supplied Conversation Engine.",
      });
    }

    if (growthRevenue.creativeStudioId !== creativeStudio.creativeStudioId) {
      return failure({
        code: "ValidationFailed",
        message: "Growth & Revenue does not belong to the supplied Creative Studio.",
      });
    }

    return success({
      foundation,
      brain,
      decisionEngine,
      conversation,
      creativeStudio,
      growthRevenue,
    });
  }

  private async loadCommandCenter(command: {
    readonly commandCenterId: BusinessCommandCenterV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<
    Result<
      BusinessCommandCenterV1ApplicationResult,
      BusinessCommandCenterV1ApplicationError
    >
  > {
    const commandCenter = await this.commandCenterRepository.findById(
      command.commandCenterId
    );

    if (!commandCenter) {
      return failure({
        code: "BusinessCommandCenterNotFound",
        message: "Business Command Center record was not found.",
      });
    }

    if (commandCenter.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Business Command Center does not belong to the command business.",
      });
    }

    return success({ commandCenter });
  }

  private async publish(event: BusinessCommandCenterV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapBusinessCommandCenterV1ApplicationError(
  error: unknown
): BusinessCommandCenterV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Business Command Center operation failed.",
    cause: error,
  };
}
