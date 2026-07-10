import type {
  BusinessBrainV1Repository,
  BusinessBrainV1Id,
  DecisionEngineV1,
  DecisionEngineV1DomainEvent,
  DecisionEngineV1Id,
  DecisionEngineV1Repository,
  DecisionRecommendationId,
  DecisionLifecycleStatus,
} from "@nextshift/domain";
import { DecisionEngineV1 as DecisionEngineV1Aggregate } from "@nextshift/domain";
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
type CreateEngineId = () => DecisionEngineV1Id;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateEngineId: CreateEngineId = () =>
  crypto.randomUUID() as DecisionEngineV1Id;

type DecisionRecommendationTransition =
  | "reviewed"
  | "accepted"
  | "rejected"
  | "superseded"
  | "archived";

export interface DecisionEngineV1EventPublisher {
  publish(event: DecisionEngineV1DomainEvent): Promise<void>;
}

export interface CreateDecisionEngineV1Command extends ApplicationCommand {
  readonly commandType: "CreateDecisionEngineV1";
  readonly engineId?: DecisionEngineV1Id;
  readonly brainId: BusinessBrainV1Id;
  readonly causationId?: CausationId;
}

export interface ReviewDecisionRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "ReviewDecisionRecommendation";
  readonly engineId: DecisionEngineV1Id;
  readonly recommendationId: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface AcceptDecisionRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "AcceptDecisionRecommendation";
  readonly engineId: DecisionEngineV1Id;
  readonly recommendationId: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface RejectDecisionRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "RejectDecisionRecommendation";
  readonly engineId: DecisionEngineV1Id;
  readonly recommendationId: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface SupersedeDecisionRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "SupersedeDecisionRecommendation";
  readonly engineId: DecisionEngineV1Id;
  readonly recommendationId: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface ArchiveDecisionRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "ArchiveDecisionRecommendation";
  readonly engineId: DecisionEngineV1Id;
  readonly recommendationId: DecisionRecommendationId;
  readonly causationId?: CausationId;
}

export interface GetDecisionEngineV1Query extends ApplicationQuery {
  readonly queryType: "GetDecisionEngineV1";
  readonly engineId: DecisionEngineV1Id;
}

export interface ListDecisionEnginesForBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListDecisionEnginesForBusiness";
}

export interface GetLatestDecisionEngineForBrainQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestDecisionEngineForBrain";
  readonly brainId: BusinessBrainV1Id;
}

export interface DecisionEngineV1ApplicationResult {
  readonly engine: DecisionEngineV1;
}

export interface DecisionEngineV1QueryResult {
  readonly engine: DecisionEngineV1 | null;
}

export interface DecisionEngineV1ListQueryResult {
  readonly engines: readonly DecisionEngineV1[];
}

export interface DecisionEngineV1ApplicationError {
  readonly code:
    | "BusinessBrainNotFound"
    | "DecisionEngineNotFound"
    | "ValidationFailed"
    | "DecisionEnginePersistenceFailed"
    | "DecisionEngineEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class DecisionEngineV1ApplicationService {
  constructor(
    private readonly engineRepository: DecisionEngineV1Repository,
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly eventPublisher: DecisionEngineV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createEngineId: CreateEngineId = defaultCreateEngineId
  ) {}

  async createDecisionEngine(
    command: CreateDecisionEngineV1Command
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    try {
      const brain = await this.brainRepository.findById(command.brainId);

      if (!brain) {
        return failure({
          code: "BusinessBrainNotFound",
          message: "Business Brain was not found.",
        });
      }

      if (brain.businessId !== command.context.businessId) {
        return failure({
          code: "ValidationFailed",
          message: "Business Brain does not belong to the command business.",
        });
      }

      const createdAt = this.now();
      const engine = DecisionEngineV1Aggregate.create({
        engineId: command.engineId ?? this.createEngineId(),
        brain: brain.toSnapshot(),
        createdAt,
      });

      await this.engineRepository.save(engine);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "DecisionEngineV1Created",
        aggregateId: engine.engineId,
        aggregateType: "DecisionEngineV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          engineId: engine.engineId,
          businessId: engine.businessId,
          brainId: engine.brainId,
          recommendationCount: engine.toSnapshot().recommendations.length,
          createdAt,
        },
      });

      return success({ engine });
    } catch (error) {
      return failure(mapDecisionEngineV1ApplicationError(error));
    }
  }

  async reviewRecommendation(
    command: ReviewDecisionRecommendationCommand
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    return this.transitionRecommendation(command, "reviewed");
  }

  async acceptRecommendation(
    command: AcceptDecisionRecommendationCommand
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    return this.transitionRecommendation(command, "accepted");
  }

  async rejectRecommendation(
    command: RejectDecisionRecommendationCommand
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    return this.transitionRecommendation(command, "rejected");
  }

  async supersedeRecommendation(
    command: SupersedeDecisionRecommendationCommand
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    return this.transitionRecommendation(command, "superseded");
  }

  async archiveRecommendation(
    command: ArchiveDecisionRecommendationCommand
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    return this.transitionRecommendation(command, "archived");
  }

  async getDecisionEngine(
    query: GetDecisionEngineV1Query
  ): Promise<DecisionEngineV1QueryResult> {
    const engine = await this.engineRepository.findById(query.engineId);
    return {
      engine: engine?.businessId === query.context.businessId ? engine : null,
    };
  }

  async listDecisionEnginesForBusiness(
    query: ListDecisionEnginesForBusinessQuery
  ): Promise<DecisionEngineV1ListQueryResult> {
    return {
      engines: await this.engineRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async getLatestDecisionEngineForBrain(
    query: GetLatestDecisionEngineForBrainQuery
  ): Promise<DecisionEngineV1QueryResult> {
    const engine = await this.engineRepository.findLatestByBrainId(query.brainId);
    return {
      engine: engine?.businessId === query.context.businessId ? engine : null,
    };
  }

  private async transitionRecommendation(
    command: (
      | ReviewDecisionRecommendationCommand
      | AcceptDecisionRecommendationCommand
      | RejectDecisionRecommendationCommand
      | SupersedeDecisionRecommendationCommand
      | ArchiveDecisionRecommendationCommand
    ) & {
      readonly causationId?: CausationId;
    },
    status: DecisionRecommendationTransition
  ): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    try {
      const loaded = await this.loadEngine(command);
      if (!loaded.ok) return loaded;

      const changedAt = this.now();
      this.applyTransition(
        loaded.value.engine,
        command.recommendationId,
        status,
        changedAt
      );

      await this.engineRepository.save(loaded.value.engine);
      await this.publish({
        eventId: this.createEventId(),
        eventType: eventTypeForStatus(status),
        aggregateId: loaded.value.engine.engineId,
        aggregateType: "DecisionEngineV1",
        occurredAt: changedAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          engineId: loaded.value.engine.engineId,
          recommendationId: command.recommendationId,
          status,
          changedAt,
        },
      });

      return success({ engine: loaded.value.engine });
    } catch (error) {
      return failure(mapDecisionEngineV1ApplicationError(error));
    }
  }

  private async loadEngine(command: {
    readonly engineId: DecisionEngineV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<DecisionEngineV1ApplicationResult, DecisionEngineV1ApplicationError>> {
    const engine = await this.engineRepository.findById(command.engineId);

    if (!engine) {
      return failure({
        code: "DecisionEngineNotFound",
        message: "Decision Engine was not found.",
      });
    }

    if (engine.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Decision Engine does not belong to the command business.",
      });
    }

    return success({ engine });
  }

  private applyTransition(
    engine: DecisionEngineV1,
    recommendationId: DecisionRecommendationId,
    status: DecisionRecommendationTransition,
    changedAt: Timestamp
  ): void {
    if (status === "reviewed") {
      engine.reviewRecommendation(recommendationId, changedAt);
    } else if (status === "accepted") {
      engine.acceptRecommendation(recommendationId, changedAt);
    } else if (status === "rejected") {
      engine.rejectRecommendation(recommendationId, changedAt);
    } else if (status === "superseded") {
      engine.supersedeRecommendation(recommendationId, changedAt);
    } else {
      engine.archiveRecommendation(recommendationId, changedAt);
    }
  }

  private async publish(event: DecisionEngineV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function eventTypeForStatus(
  status: DecisionRecommendationTransition
): DecisionEngineV1DomainEvent["eventType"] {
  if (status === "reviewed") return "DecisionRecommendationReviewed";
  if (status === "accepted") return "DecisionRecommendationAccepted";
  if (status === "rejected") return "DecisionRecommendationRejected";
  if (status === "superseded") return "DecisionRecommendationSuperseded";
  return "DecisionRecommendationArchived";
}

function mapDecisionEngineV1ApplicationError(
  error: unknown
): DecisionEngineV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Decision Engine operation failed.",
    cause: error,
  };
}
