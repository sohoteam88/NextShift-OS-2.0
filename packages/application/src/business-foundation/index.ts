import type {
  BrandDnaId,
  BrandDnaSnapshot,
  BusinessFoundation,
  BusinessFoundationDomainEvent,
  BusinessFoundationId,
  BusinessFoundationRecordType,
  BusinessFoundationRepository,
  BusinessMemorySnapshot,
  BusinessTimelineEventSnapshot,
  ContentMemorySnapshot,
  CustomerMemorySnapshot,
  KnowledgeNodeSnapshot,
  KnowledgeRelationshipSnapshot,
  LearningFoundationRecordSnapshot,
  ReflectionFoundationRecordSnapshot,
  StoryVaultItemSnapshot,
  BusinessTwinSnapshot,
} from "@nextshift/domain";
import { BusinessFoundation as BusinessFoundationAggregate } from "@nextshift/domain";
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
type CreateFoundationId = () => BusinessFoundationId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateFoundationId: CreateFoundationId = () =>
  crypto.randomUUID() as BusinessFoundationId;

export interface BusinessFoundationEventPublisher {
  publish(event: BusinessFoundationDomainEvent): Promise<void>;
}

export interface CreateBusinessFoundationCommand extends ApplicationCommand {
  readonly commandType: "CreateBusinessFoundation";
  readonly foundationId?: BusinessFoundationId;
  readonly twin: BusinessTwinSnapshot;
  readonly causationId?: CausationId;
}

export interface UpdateBusinessFoundationBrandDnaCommand
  extends ApplicationCommand {
  readonly commandType: "UpdateBusinessFoundationBrandDna";
  readonly foundationId: BusinessFoundationId;
  readonly brandDna: Omit<BrandDnaSnapshot, "updatedAt"> & {
    readonly updatedAt?: Timestamp;
  };
  readonly causationId?: CausationId;
}

export interface AddBusinessFoundationKnowledgeNodeCommand
  extends ApplicationCommand {
  readonly commandType: "AddBusinessFoundationKnowledgeNode";
  readonly foundationId: BusinessFoundationId;
  readonly node: KnowledgeNodeSnapshot;
  readonly causationId?: CausationId;
}

export interface AddBusinessFoundationKnowledgeRelationshipCommand
  extends ApplicationCommand {
  readonly commandType: "AddBusinessFoundationKnowledgeRelationship";
  readonly foundationId: BusinessFoundationId;
  readonly relationship: KnowledgeRelationshipSnapshot;
  readonly causationId?: CausationId;
}

export interface AddBusinessFoundationStoryCommand extends ApplicationCommand {
  readonly commandType: "AddBusinessFoundationStory";
  readonly foundationId: BusinessFoundationId;
  readonly story: StoryVaultItemSnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationBusinessMemoryCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationBusinessMemory";
  readonly foundationId: BusinessFoundationId;
  readonly memory: BusinessMemorySnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationContentMemoryCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationContentMemory";
  readonly foundationId: BusinessFoundationId;
  readonly memory: ContentMemorySnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationCustomerMemoryCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationCustomerMemory";
  readonly foundationId: BusinessFoundationId;
  readonly memory: CustomerMemorySnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationTimelineEventCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationTimelineEvent";
  readonly foundationId: BusinessFoundationId;
  readonly event: BusinessTimelineEventSnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationLearningCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationLearning";
  readonly foundationId: BusinessFoundationId;
  readonly learning: LearningFoundationRecordSnapshot;
  readonly causationId?: CausationId;
}

export interface RecordBusinessFoundationReflectionCommand
  extends ApplicationCommand {
  readonly commandType: "RecordBusinessFoundationReflection";
  readonly foundationId: BusinessFoundationId;
  readonly reflection: ReflectionFoundationRecordSnapshot;
  readonly causationId?: CausationId;
}

export interface GetBusinessFoundationQuery extends ApplicationQuery {
  readonly queryType: "GetBusinessFoundation";
  readonly foundationId: BusinessFoundationId;
}

export interface GetBusinessFoundationForBusinessQuery
  extends ApplicationQuery {
  readonly queryType: "GetBusinessFoundationForBusiness";
}

export interface BusinessFoundationApplicationResult {
  readonly foundation: BusinessFoundation;
}

export interface BusinessFoundationQueryResult {
  readonly foundation: BusinessFoundation | null;
}

export interface BusinessFoundationApplicationError {
  readonly code:
    | "BusinessFoundationNotFound"
    | "ValidationFailed"
    | "BusinessFoundationPersistenceFailed"
    | "BusinessFoundationEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class BusinessFoundationApplicationService {
  constructor(
    private readonly foundationRepository: BusinessFoundationRepository,
    private readonly eventPublisher: BusinessFoundationEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createFoundationId: CreateFoundationId =
      defaultCreateFoundationId
  ) {}

  async createBusinessFoundation(
    command: CreateBusinessFoundationCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    try {
      const createdAt = this.now();
      const foundation = BusinessFoundationAggregate.create({
        foundationId: command.foundationId ?? this.createFoundationId(),
        businessId: command.context.businessId,
        twin: command.twin,
        createdAt,
      });

      await this.foundationRepository.save(foundation);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessFoundationCreated",
        aggregateId: foundation.foundationId,
        aggregateType: "BusinessFoundation",
        occurredAt: createdAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          foundationId: foundation.foundationId,
          businessId: foundation.businessId,
          createdAt,
        },
      });

      return success({ foundation });
    } catch (error) {
      return failure(mapBusinessFoundationApplicationError(error));
    }
  }

  async updateBrandDna(
    command: UpdateBusinessFoundationBrandDnaCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    try {
      const loaded = await this.loadFoundation(command);
      if (!loaded.ok) return loaded;

      const updatedAt = command.brandDna.updatedAt ?? this.now();
      loaded.value.foundation.updateBrandDna({
        ...command.brandDna,
        updatedAt,
      });

      await this.foundationRepository.save(loaded.value.foundation);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessFoundationBrandDnaUpdated",
        aggregateId: loaded.value.foundation.foundationId,
        aggregateType: "BusinessFoundation",
        occurredAt: updatedAt,
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          foundationId: loaded.value.foundation.foundationId,
          businessId: loaded.value.foundation.businessId,
          brandDnaId: command.brandDna.brandDnaId,
          updatedAt,
        },
      });

      return success({ foundation: loaded.value.foundation });
    } catch (error) {
      return failure(mapBusinessFoundationApplicationError(error));
    }
  }

  async addKnowledgeNode(
    command: AddBusinessFoundationKnowledgeNodeCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(command, "knowledge-node", command.node.nodeId, (foundation) =>
      foundation.addKnowledgeNode(command.node)
    );
  }

  async addKnowledgeRelationship(
    command: AddBusinessFoundationKnowledgeRelationshipCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "knowledge-relationship",
      `${command.relationship.fromNodeId}:${command.relationship.toNodeId}:${command.relationship.relationshipType}`,
      (foundation) => foundation.addKnowledgeRelationship(command.relationship)
    );
  }

  async addStory(
    command: AddBusinessFoundationStoryCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(command, "story", command.story.storyId, (foundation) =>
      foundation.addStory(command.story)
    );
  }

  async recordBusinessMemory(
    command: RecordBusinessFoundationBusinessMemoryCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "business-memory",
      command.memory.memoryId,
      (foundation) => foundation.addBusinessMemory(command.memory)
    );
  }

  async recordContentMemory(
    command: RecordBusinessFoundationContentMemoryCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "content-memory",
      command.memory.memoryId,
      (foundation) => foundation.addContentMemory(command.memory)
    );
  }

  async recordCustomerMemory(
    command: RecordBusinessFoundationCustomerMemoryCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "customer-memory",
      command.memory.memoryId,
      (foundation) => foundation.addCustomerMemory(command.memory)
    );
  }

  async recordTimelineEvent(
    command: RecordBusinessFoundationTimelineEventCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "timeline-event",
      command.event.eventId,
      (foundation) => foundation.addTimelineEvent(command.event)
    );
  }

  async recordLearning(
    command: RecordBusinessFoundationLearningCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "learning",
      command.learning.learningId,
      (foundation) => foundation.addLearning(command.learning)
    );
  }

  async recordReflection(
    command: RecordBusinessFoundationReflectionCommand
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    return this.record(
      command,
      "reflection",
      command.reflection.reflectionId,
      (foundation) => foundation.addReflection(command.reflection)
    );
  }

  async getBusinessFoundation(
    query: GetBusinessFoundationQuery
  ): Promise<BusinessFoundationQueryResult> {
    const foundation = await this.foundationRepository.findById(
      query.foundationId
    );

    return {
      foundation:
        foundation?.businessId === query.context.businessId ? foundation : null,
    };
  }

  async getBusinessFoundationForBusiness(
    query: GetBusinessFoundationForBusinessQuery
  ): Promise<BusinessFoundationQueryResult> {
    return {
      foundation: await this.foundationRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  private async record(
    command: ApplicationCommand & {
      readonly foundationId: BusinessFoundationId;
      readonly causationId?: CausationId;
    },
    recordType: BusinessFoundationRecordType,
    recordId: string,
    apply: (foundation: BusinessFoundation) => void
  ): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    try {
      const loaded = await this.loadFoundation(command);
      if (!loaded.ok) return loaded;

      apply(loaded.value.foundation);
      await this.foundationRepository.save(loaded.value.foundation);
      await this.publish({
        eventId: this.createEventId(),
        eventType: "BusinessFoundationRecordAdded",
        aggregateId: loaded.value.foundation.foundationId,
        aggregateType: "BusinessFoundation",
        occurredAt: this.now(),
        version: 1,
        correlationId: command.context.correlationId,
        causationId: command.causationId,
        payload: {
          foundationId: loaded.value.foundation.foundationId,
          businessId: loaded.value.foundation.businessId,
          recordType,
          recordId,
        },
      });

      return success({ foundation: loaded.value.foundation });
    } catch (error) {
      return failure(mapBusinessFoundationApplicationError(error));
    }
  }

  private async loadFoundation(command: {
    readonly foundationId: BusinessFoundationId;
    readonly context: ApplicationCommand["context"];
  }): Promise<Result<BusinessFoundationApplicationResult, BusinessFoundationApplicationError>> {
    const foundation = await this.foundationRepository.findById(
      command.foundationId
    );

    if (!foundation) {
      return failure({
        code: "BusinessFoundationNotFound",
        message: "Business foundation was not found.",
      });
    }

    if (foundation.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: "Business foundation does not belong to the command business.",
      });
    }

    return success({ foundation });
  }

  private async publish(event: BusinessFoundationDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }
}

function mapBusinessFoundationApplicationError(
  error: unknown
): BusinessFoundationApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Business foundation operation failed.",
    cause: error,
  };
}
