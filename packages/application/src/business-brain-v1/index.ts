import type {
  BusinessBrainV1,
  BusinessBrainV1DomainEvent,
  BusinessBrainV1Id,
  BusinessBrainV1Repository,
  BusinessFoundationId,
  BusinessFoundationRepository,
} from "@nextshift/domain";
import { BusinessBrainV1 as BusinessBrainV1Aggregate } from "@nextshift/domain";
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
type CreateBrainId = () => BusinessBrainV1Id;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateBrainId: CreateBrainId = () =>
  crypto.randomUUID() as BusinessBrainV1Id;

export interface BusinessBrainV1EventPublisher {
  publish(event: BusinessBrainV1DomainEvent): Promise<void>;
}

export interface CreateBusinessBrainV1Command extends ApplicationCommand {
  readonly commandType: "CreateBusinessBrainV1";
  readonly brainId?: BusinessBrainV1Id;
  readonly foundationId: BusinessFoundationId;
  readonly causationId?: CausationId;
}

export interface SupersedeBusinessBrainV1Command extends ApplicationCommand {
  readonly commandType: "SupersedeBusinessBrainV1";
  readonly brainId: BusinessBrainV1Id;
  readonly causationId?: CausationId;
}

export interface ArchiveBusinessBrainV1Command extends ApplicationCommand {
  readonly commandType: "ArchiveBusinessBrainV1";
  readonly brainId: BusinessBrainV1Id;
  readonly causationId?: CausationId;
}

export interface GetBusinessBrainV1Query extends ApplicationQuery {
  readonly queryType: "GetBusinessBrainV1";
  readonly brainId: BusinessBrainV1Id;
}

export interface ListBusinessBrainV1ForBusinessQuery extends ApplicationQuery {
  readonly queryType: "ListBusinessBrainV1ForBusiness";
}

export interface GetLatestBusinessBrainV1ForFoundationQuery
  extends ApplicationQuery {
  readonly queryType: "GetLatestBusinessBrainV1ForFoundation";
  readonly foundationId: BusinessFoundationId;
}

export interface BusinessBrainV1ApplicationResult {
  readonly brain: BusinessBrainV1;
}

export interface BusinessBrainV1QueryResult {
  readonly brain: BusinessBrainV1 | null;
}

export interface BusinessBrainV1ListQueryResult {
  readonly brains: readonly BusinessBrainV1[];
}

export interface BusinessBrainV1ApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "BusinessBrainNotFound"
    | "ValidationFailed"
    | "BusinessBrainPersistenceFailed"
    | "BusinessBrainEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class BusinessBrainV1ApplicationService {
  constructor(
    private readonly brainRepository: BusinessBrainV1Repository,
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly eventPublisher: BusinessBrainV1EventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createBrainId: CreateBrainId = defaultCreateBrainId
  ) {}

  async createBusinessBrain(
    command: CreateBusinessBrainV1Command
  ): Promise<Result<BusinessBrainV1ApplicationResult, BusinessBrainV1ApplicationError>> {
    try {
      const foundation = await this.foundationRepository.findById(
        command.foundationId
      );

      if (!foundation) {
        return failure({
          code: "BusinessFoundationNotFound",
          message: "Business Foundation was not found.",
        });
      }

      if (foundation.businessId !== command.context.businessId) {
        return failure({
          code: "ValidationFailed",
          message: "Business Foundation does not belong to the command business.",
        });
      }

      const createdAt = this.now();
      const brain = BusinessBrainV1Aggregate.create({
        brainId: command.brainId ?? this.createBrainId(),
        foundation: foundation.toSnapshot(),
        createdAt,
      });

      await this.brainRepository.save(brain);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessBrainV1Created",
        aggregateId: brain.brainId,
        aggregateType: "BusinessBrainV1",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          brainId: brain.brainId,
          businessId: brain.businessId,
          foundationId: brain.foundationId,
          insightCount: brain.toSnapshot().insights.length,
          createdAt,
        },
      });

      return success({ brain });
    } catch (error) {
      return failure(mapBusinessBrainV1ApplicationError(error));
    }
  }

  async supersedeBusinessBrain(
    command: SupersedeBusinessBrainV1Command
  ): Promise<Result<BusinessBrainV1ApplicationResult, BusinessBrainV1ApplicationError>> {
    return this.transition(command, "superseded");
  }

  async archiveBusinessBrain(
    command: ArchiveBusinessBrainV1Command
  ): Promise<Result<BusinessBrainV1ApplicationResult, BusinessBrainV1ApplicationError>> {
    return this.transition(command, "archived");
  }

  async getBusinessBrain(
    query: GetBusinessBrainV1Query
  ): Promise<BusinessBrainV1QueryResult> {
    const brain = await this.brainRepository.findById(query.brainId);
    return {
      brain: brain?.businessId === query.context.businessId ? brain : null,
    };
  }

  async listBusinessBrainsForBusiness(
    query: ListBusinessBrainV1ForBusinessQuery
  ): Promise<BusinessBrainV1ListQueryResult> {
    return {
      brains: await this.brainRepository.findByBusinessId(query.context.businessId),
    };
  }

  async getLatestBusinessBrainForFoundation(
    query: GetLatestBusinessBrainV1ForFoundationQuery
  ): Promise<BusinessBrainV1QueryResult> {
    const brain = await this.brainRepository.findLatestByFoundationId(
      query.foundationId
    );
    return {
      brain: brain?.businessId === query.context.businessId ? brain : null,
    };
  }

  private async transition(
    command: (SupersedeBusinessBrainV1Command | ArchiveBusinessBrainV1Command) & {
      readonly causationId?: CausationId;
    },
    status: "superseded" | "archived"
  ): Promise<Result<BusinessBrainV1ApplicationResult, BusinessBrainV1ApplicationError>> {
    try {
      const loaded = await this.loadBrain(command);
      if (!loaded.ok) return loaded;

      const occurredAt = this.now();
      if (status === "superseded") {
        loaded.value.brain.supersede(occurredAt);
      } else {
        loaded.value.brain.archive(occurredAt);
      }

      await this.brainRepository.save(loaded.value.brain);
      await this.publish(
        status === "superseded"
          ? {
              eventId: this.createEventId(),
              eventType: "BusinessBrainV1Superseded",
              aggregateId: loaded.value.brain.brainId,
              aggregateType: "BusinessBrainV1",
              occurredAt,
              version: 1,
              correlationId: command.context.correlationId,
              causationId: command.causationId,
              payload: {
                brainId: loaded.value.brain.brainId,
                supersededAt: occurredAt,
              },
            }
          : {
              eventId: this.createEventId(),
              eventType: "BusinessBrainV1Archived",
              aggregateId: loaded.value.brain.brainId,
              aggregateType: "BusinessBrainV1",
              occurredAt,
              version: 1,
              correlationId: command.context.correlationId,
              causationId: command.causationId,
              payload: {
                brainId: loaded.value.brain.brainId,
                archivedAt: occurredAt,
              },
            }
      );

      return success({ brain: loaded.value.brain });
    } catch (error) {
      return failure(mapBusinessBrainV1ApplicationError(error));
    }
  }

  private async loadBrain(command: {
    readonly brainId: BusinessBrainV1Id;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<BusinessBrainV1ApplicationResult, BusinessBrainV1ApplicationError>> {
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

    return success({ brain });
  }

  private async publish(event: BusinessBrainV1DomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapBusinessBrainV1ApplicationError(
  error: unknown
): BusinessBrainV1ApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Business Brain operation failed.",
    cause: error,
  };
}
