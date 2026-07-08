import type {
  BusinessBrainV1Id,
  BusinessBrainV1Repository,
  BusinessFoundationId,
  BusinessFoundationRepository,
  ConversationEngineV1Id,
  ConversationEngineV1Repository,
  CreativeStudioV1Id,
  CreativeStudioV1Repository,
  DecisionEngineV1Id,
  DecisionEngineV1Repository,
  GrowthRevenueV1,
  GrowthRevenueV1DomainEvent,
  GrowthRevenueV1Id,
  GrowthRevenueV1Repository,
  RevenueLifecycleStatus,
} from "@nextshift/domain";
import { GrowthRevenueV1 as GrowthRevenueV1Aggregate } from "@nextshift/domain";
import type { CausationId, EventId, Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateGrowthRevenueId = () => GrowthRevenueV1Id;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateGrowthRevenueId: CreateGrowthRevenueId = () =>
  crypto.randomUUID() as GrowthRevenueV1Id;

export interface GrowthRevenueV1EventPublisher {
  publish(event: GrowthRevenueV1DomainEvent): Promise<void>;
}

export interface CreateGrowthRevenueV1Command extends ApplicationCommand {
  readonly commandType: "CreateGrowthRevenueV1";
  readonly growthRevenueId?: GrowthRevenueV1Id;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly causationId?: CausationId;
}

export interface ChangeGrowthRevenueLifecycleCommand
  extends ApplicationCommand {
  readonly commandType: "ChangeGrowthRevenueLifecycle";
  readonly growthRevenueId: GrowthRevenueV1Id;
  readonly status: Exclude<RevenueLifecycleStatus, "planned">;
  readonly causationId?: CausationId;
}

export interface GetGrowthRevenueV1Query extends ApplicationQuery {
  readonly queryType: "GetGrowthRevenueV1";
  readonly growthRevenueId: GrowthRevenueV1Id;
}

export interface ListGrowthRevenueForBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListGrowthRevenueForBusiness";
}

export interface GetLatestGrowthRevenueForCreativeStudioQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestGrowthRevenueForCreativeStudio";
  readonly creativeStudioId: CreativeStudioV1Id;
}

export interface GrowthRevenueV1ApplicationResult {
  readonly growthRevenue: GrowthRevenueV1;
}

export interface GrowthRevenueV1QueryResult {
  readonly growthRevenue: GrowthRevenueV1 | null;
}

export interface GrowthRevenueV1ListQueryResult {
  readonly growthRevenueRecords: readonly GrowthRevenueV1[];
}

export interface GrowthRevenueV1ApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "BusinessBrainNotFound"
    | "DecisionEngineNotFound"
    | "ConversationNotFound"
    | "CreativeStudioNotFound"
    | "GrowthRevenueNotFound"
    | "ValidationFailed"
    | "GrowthRevenuePersistenceFailed"
    | "GrowthRevenueEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class GrowthRevenueV1ApplicationService {
  constructor(
    private readonly growthRevenueRepository: GrowthRevenueV1Repository,
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly decisionEngineRepository: DecisionEngineV1Repository,
    private readonly conversationRepository: ConversationEngineV1Repository,
    private readonly creativeStudioRepository: CreativeStudioV1Repository,
    private readonly eventPublisher: GrowthRevenueV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createGrowthRevenueId: CreateGrowthRevenueId = defaultCreateGrowthRevenueId
  ) {}

  async createGrowthRevenue(
    command: CreateGrowthRevenueV1Command
  ): Promise<Result<GrowthRevenueV1ApplicationResult, GrowthRevenueV1ApplicationError>> {
    try {
      const loaded = await this.loadUpstream(command);
      if (!loaded.ok) return loaded;

      const createdAt = this.now();
      const growthRevenue = GrowthRevenueV1Aggregate.create({
        growthRevenueId:
          command.growthRevenueId ?? this.createGrowthRevenueId(),
        foundation: loaded.value.foundation.toSnapshot(),
        brain: loaded.value.brain.toSnapshot(),
        decisionEngine: loaded.value.decisionEngine.toSnapshot(),
        conversation: loaded.value.conversation.toSnapshot(),
        creativeStudio: loaded.value.creativeStudio.toSnapshot(),
        createdAt,
      });

      await this.growthRevenueRepository.save(growthRevenue);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "GrowthRevenueV1Created",
        aggregateId: growthRevenue.growthRevenueId,
        aggregateType: "GrowthRevenueV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          growthRevenueId: growthRevenue.growthRevenueId,
          businessId: growthRevenue.businessId,
          creativeStudioId: growthRevenue.creativeStudioId,
          recommendationCount:
            growthRevenue.toSnapshot().growthRecommendations.length,
          createdAt,
        },
      });

      return success({ growthRevenue });
    } catch (error) {
      return failure(mapGrowthRevenueV1ApplicationError(error));
    }
  }

  async changeLifecycle(
    command: ChangeGrowthRevenueLifecycleCommand
  ): Promise<Result<GrowthRevenueV1ApplicationResult, GrowthRevenueV1ApplicationError>> {
    try {
      const loaded = await this.loadGrowthRevenue(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      if (command.status === "active") {
        loaded.value.growthRevenue.activate(changedAt);
      } else if (command.status === "reviewing") {
        loaded.value.growthRevenue.review(changedAt);
      } else if (command.status === "forecasted") {
        loaded.value.growthRevenue.markForecasted(changedAt);
      } else if (command.status === "won") {
        loaded.value.growthRevenue.markWon(changedAt);
      } else if (command.status === "lost") {
        loaded.value.growthRevenue.markLost(changedAt);
      } else {
        loaded.value.growthRevenue.archive(changedAt);
      }

      await this.growthRevenueRepository.save(loaded.value.growthRevenue);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "GrowthRevenueLifecycleChanged",
        aggregateId: loaded.value.growthRevenue.growthRevenueId,
        aggregateType: "GrowthRevenueV1",
        occurredAt: changedAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          growthRevenueId: loaded.value.growthRevenue.growthRevenueId,
          status: loaded.value.growthRevenue.toSnapshot().lifecycleStatus,
          changedAt,
        },
      });

      return success({ growthRevenue: loaded.value.growthRevenue });
    } catch (error) {
      return failure(mapGrowthRevenueV1ApplicationError(error));
    }
  }

  async getGrowthRevenue(
    query: GetGrowthRevenueV1Query
  ): Promise<GrowthRevenueV1QueryResult> {
    const growthRevenue = await this.growthRevenueRepository.findById(
      query.growthRevenueId
    );
    return {
      growthRevenue:
        growthRevenue?.businessId === query.context.businessId
          ? growthRevenue
          : null,
    };
  }

  async listGrowthRevenueForBusiness(
    query: ListGrowthRevenueForBusinessQuery
  ): Promise<GrowthRevenueV1ListQueryResult> {
    return {
      growthRevenueRecords:
        await this.growthRevenueRepository.findByBusinessId(
          query.context.businessId
        ),
    };
  }

  async getLatestGrowthRevenueForCreativeStudio(
    query: GetLatestGrowthRevenueForCreativeStudioQuery
  ): Promise<GrowthRevenueV1QueryResult> {
    const growthRevenue =
      await this.growthRevenueRepository.findLatestByCreativeStudioId(
        query.creativeStudioId
      );
    return {
      growthRevenue:
        growthRevenue?.businessId === query.context.businessId
          ? growthRevenue
          : null,
    };
  }

  private async loadUpstream(command: {
    readonly foundationId: BusinessFoundationId;
    readonly brainId: BusinessBrainV1Id;
    readonly engineId: DecisionEngineV1Id;
    readonly conversationId: ConversationEngineV1Id;
    readonly creativeStudioId: CreativeStudioV1Id;
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
      },
      GrowthRevenueV1ApplicationError
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

    if (
      foundation.businessId !== command.context.businessId ||
      brain.businessId !== command.context.businessId ||
      decisionEngine.businessId !== command.context.businessId ||
      conversation.businessId !== command.context.businessId ||
      creativeStudio.businessId !== command.context.businessId
    ) {
      return failure({
        code: "ValidationFailed",
        message: "Growth & Revenue upstream records do not belong to the command business.",
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

    return success({
      foundation,
      brain,
      decisionEngine,
      conversation,
      creativeStudio,
    });
  }

  private async loadGrowthRevenue(command: {
    readonly growthRevenueId: GrowthRevenueV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<GrowthRevenueV1ApplicationResult, GrowthRevenueV1ApplicationError>> {
    const growthRevenue = await this.growthRevenueRepository.findById(
      command.growthRevenueId
    );

    if (!growthRevenue) {
      return failure({
        code: "GrowthRevenueNotFound",
        message: "Growth & Revenue record was not found.",
      });
    }

    if (growthRevenue.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Growth & Revenue does not belong to the command business.",
      });
    }

    return success({ growthRevenue });
  }

  private async publish(event: GrowthRevenueV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapGrowthRevenueV1ApplicationError(
  error: unknown
): GrowthRevenueV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Growth & Revenue operation failed.",
    cause: error,
  };
}
