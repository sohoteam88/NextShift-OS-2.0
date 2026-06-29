import type {
  ContentExecution,
  ContentExecutionArchivedEvent,
  ContentExecutionCancelledEvent,
  ContentExecutionCompletedEvent,
  ContentExecutionCreatedEvent,
  ContentExecutionDomainEvent,
  ContentExecutionEventType,
  ContentExecutionFailedEvent,
  ContentExecutionId,
  ContentExecutionRepository,
  ContentExecutionRestoredEvent,
  ContentExecutionScheduledEvent,
  ContentExecutionStartedEvent,
  ContentInsightSetId,
  ContentInsightRepository,
  ContentRecommendationId,
  ContentRecommendationRepository,
  ContentRecommendationSetId,
} from "@nextshift/domain";
import { ContentExecution as ContentExecutionAggregate } from "@nextshift/domain";
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
type CreateExecutionId = () => ContentExecutionId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateExecutionId: CreateExecutionId = () =>
  crypto.randomUUID() as ContentExecutionId;

export interface ContentExecutionEventPublisher {
  publish(event: ContentExecutionDomainEvent): Promise<void>;
}

export interface CreateContentExecutionFromRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "CreateContentExecutionFromRecommendation";
  readonly executionId?: ContentExecutionId;
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly causationId?: CausationId;
}

export interface ScheduleContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "ScheduleContentExecution";
  readonly executionId: ContentExecutionId;
  readonly scheduledFor: Timestamp;
  readonly causationId?: CausationId;
}

export interface StartContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "StartContentExecution";
  readonly executionId: ContentExecutionId;
  readonly causationId?: CausationId;
}

export interface CompleteContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "CompleteContentExecution";
  readonly executionId: ContentExecutionId;
  readonly note?: string;
  readonly causationId?: CausationId;
}

export interface FailContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "FailContentExecution";
  readonly executionId: ContentExecutionId;
  readonly note: string;
  readonly causationId?: CausationId;
}

export interface CancelContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "CancelContentExecution";
  readonly executionId: ContentExecutionId;
  readonly note?: string;
  readonly causationId?: CausationId;
}

export interface ArchiveContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentExecution";
  readonly executionId: ContentExecutionId;
  readonly causationId?: CausationId;
}

export interface RestoreContentExecutionCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentExecution";
  readonly executionId: ContentExecutionId;
  readonly causationId?: CausationId;
}

export interface GetContentExecutionQuery extends ApplicationQuery {
  readonly queryType: "GetContentExecution";
  readonly executionId: ContentExecutionId;
}

export interface ListPendingContentExecutionsQuery extends ApplicationQuery {
  readonly queryType: "ListPendingContentExecutions";
}

export interface ContentExecutionApplicationResult {
  readonly execution: ContentExecution;
}

export interface ContentExecutionQueryResult {
  readonly execution: ContentExecution | null;
}

export interface ContentExecutionListQueryResult {
  readonly executions: readonly ContentExecution[];
}

export interface ContentExecutionApplicationError {
  readonly code:
    | "ContentExecutionNotFound"
    | "ContentRecommendationSetNotFound"
    | "ContentInsightSetNotFound"
    | "ValidationFailed"
    | "ContentExecutionPersistenceFailed"
    | "ContentExecutionEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentExecutionApplicationService {
  constructor(
    private readonly executionRepository: ContentExecutionRepository,
    private readonly recommendationRepository: ContentRecommendationRepository,
    private readonly insightRepository: ContentInsightRepository,
    private readonly eventPublisher: ContentExecutionEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createExecutionId: CreateExecutionId =
      defaultCreateExecutionId
  ) {}

  async createContentExecutionFromRecommendation(
    command: CreateContentExecutionFromRecommendationCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    try {
      const validation = await this.validateRecommendation(command);
      if (!validation.ok) return validation;

      const existing = await this.executionRepository.findActiveByRecommendationId(
        command.recommendationId
      );

      if (existing) {
        return failure({
          code: "ValidationFailed",
          message: `Active content execution already exists for recommendation ${command.recommendationId}.`,
        });
      }

      const createdAt = this.now();
      const execution = ContentExecutionAggregate.create({
        executionId: command.executionId ?? this.createExecutionId(),
        businessId: command.context.businessId,
        recommendationSetId: command.recommendationSetId,
        recommendationId: command.recommendationId,
        variantSetId: validation.value.variantSetId,
        contentId: validation.value.contentId,
        platform: validation.value.platform,
        createdAt,
      });

      await this.executionRepository.save(execution);
      await this.publish(this.createContentExecutionCreatedEvent(command, execution));

      return success({ execution });
    } catch (error) {
      return failure(mapContentExecutionApplicationError(error));
    }
  }

  async scheduleContentExecution(
    command: ScheduleContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.schedule(command.scheduledFor, occurredAt);
      return this.createContentExecutionScheduledEvent(command, execution, occurredAt);
    });
  }

  async startContentExecution(
    command: StartContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.start(occurredAt);
      return this.createContentExecutionStartedEvent(command, execution, occurredAt);
    });
  }

  async completeContentExecution(
    command: CompleteContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.complete(occurredAt, command.note);
      return this.createContentExecutionCompletedEvent(command, execution, occurredAt);
    });
  }

  async failContentExecution(
    command: FailContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.fail(occurredAt, command.note);
      return this.createContentExecutionFailedEvent(command, execution, occurredAt);
    });
  }

  async cancelContentExecution(
    command: CancelContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.cancel(occurredAt, command.note);
      return this.createContentExecutionCancelledEvent(command, execution, occurredAt);
    });
  }

  async archiveContentExecution(
    command: ArchiveContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.archive(occurredAt);
      return this.createContentExecutionArchivedEvent(command, execution, occurredAt);
    });
  }

  async restoreContentExecution(
    command: RestoreContentExecutionCommand
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    return this.mutateExecution(command, (execution, occurredAt) => {
      execution.restore(occurredAt);
      return this.createContentExecutionRestoredEvent(command, execution, occurredAt);
    });
  }

  async getContentExecution(
    query: GetContentExecutionQuery
  ): Promise<ContentExecutionQueryResult> {
    return {
      execution: await this.executionRepository.findById(query.executionId),
    };
  }

  async listPendingContentExecutions(
    query: ListPendingContentExecutionsQuery
  ): Promise<ContentExecutionListQueryResult> {
    return {
      executions: await this.executionRepository.findPendingByBusinessId(
        query.context.businessId
      ),
    };
  }

  private async validateRecommendation(
    command: CreateContentExecutionFromRecommendationCommand
  ): Promise<
    Result<
      {
        readonly variantSetId: ReturnType<ContentExecution["toSnapshot"]>["variantSetId"];
        readonly contentId: ReturnType<ContentExecution["toSnapshot"]>["contentId"];
        readonly platform: ReturnType<ContentExecution["toSnapshot"]>["platform"];
      },
      ContentExecutionApplicationError
    >
  > {
    const recommendationSet = await this.recommendationRepository.findById(
      command.recommendationSetId
    );

    if (!recommendationSet) {
      return failure(recommendationSetNotFound(command.recommendationSetId));
    }

    if (recommendationSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content recommendation set ${command.recommendationSetId} does not belong to the active business.`,
      });
    }

    const recommendation = recommendationSet.getRecommendation(
      command.recommendationId
    );

    if (!recommendation) {
      return failure({
        code: "ValidationFailed",
        message: `Content recommendation ${command.recommendationId} was not found.`,
      });
    }

    if (!["open", "applied"].includes(recommendation.status)) {
      return failure({
        code: "ValidationFailed",
        message: `Content recommendation ${command.recommendationId} is not executable.`,
      });
    }

    const insightSet = await this.insightRepository.findById(
      recommendationSet.insightSetId
    );

    if (!insightSet) {
      return failure(insightSetNotFound(recommendationSet.insightSetId));
    }

    if (insightSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content insight set ${recommendationSet.insightSetId} does not belong to the active business.`,
      });
    }

    const insight = insightSet.getInsight(recommendation.insightId);

    if (!insight) {
      return failure({
        code: "ValidationFailed",
        message: `Content insight ${recommendation.insightId} was not found.`,
      });
    }

    return success({
      variantSetId: recommendationSet.variantSetId,
      contentId: recommendationSet.contentId,
      platform: insight.platform,
    });
  }

  private async mutateExecution<
    TCommand extends ApplicationCommand & { readonly executionId: ContentExecutionId },
  >(
    command: TCommand,
    mutate: (
      execution: ContentExecution,
      occurredAt: Timestamp
    ) => ContentExecutionDomainEvent
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const occurredAt = this.now();
      const event = mutate(loaded.value.execution, occurredAt);

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(event);

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapContentExecutionApplicationError(error));
    }
  }

  private async loadExecution(
    command: ApplicationCommand & { readonly executionId: ContentExecutionId }
  ): Promise<
    Result<ContentExecutionApplicationResult, ContentExecutionApplicationError>
  > {
    const execution = await this.executionRepository.findById(command.executionId);

    if (!execution) {
      return failure(executionNotFound(command.executionId));
    }

    if (execution.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content execution ${command.executionId} does not belong to the active business.`,
      });
    }

    return success({ execution });
  }

  private async publish(event: ContentExecutionDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends ContentExecutionEventType>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentExecutionId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentExecution" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentExecutionCreatedEvent(
    command: CreateContentExecutionFromRecommendationCommand,
    execution: ContentExecution
  ): ContentExecutionCreatedEvent {
    const snapshot = execution.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionCreated",
        snapshot.executionId,
        snapshot.createdAt
      ),
      payload: snapshot,
    };
  }

  private createContentExecutionScheduledEvent(
    command: ScheduleContentExecutionCommand,
    execution: ContentExecution,
    scheduledAt: Timestamp
  ): ContentExecutionScheduledEvent {
    const snapshot = execution.toSnapshot();

    if (!snapshot.scheduledFor || !snapshot.scheduledAt) {
      throw new Error("Content execution scheduled event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionScheduled",
        command.executionId,
        scheduledAt
      ),
      payload: {
        executionId: command.executionId,
        scheduledFor: snapshot.scheduledFor,
        scheduledAt: snapshot.scheduledAt,
      },
    };
  }

  private createContentExecutionStartedEvent(
    command: StartContentExecutionCommand,
    execution: ContentExecution,
    startedAt: Timestamp
  ): ContentExecutionStartedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionStarted",
        command.executionId,
        startedAt
      ),
      payload: {
        executionId: execution.executionId,
        startedAt,
      },
    };
  }

  private createContentExecutionCompletedEvent(
    command: CompleteContentExecutionCommand,
    execution: ContentExecution,
    completedAt: Timestamp
  ): ContentExecutionCompletedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionCompleted",
        command.executionId,
        completedAt
      ),
      payload: {
        executionId: execution.executionId,
        completedAt,
        note: execution.toSnapshot().note,
      },
    };
  }

  private createContentExecutionFailedEvent(
    command: FailContentExecutionCommand,
    execution: ContentExecution,
    failedAt: Timestamp
  ): ContentExecutionFailedEvent {
    const note = execution.toSnapshot().note;

    if (!note) {
      throw new Error("Content execution failed event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionFailed",
        command.executionId,
        failedAt
      ),
      payload: {
        executionId: execution.executionId,
        failedAt,
        note,
      },
    };
  }

  private createContentExecutionCancelledEvent(
    command: CancelContentExecutionCommand,
    execution: ContentExecution,
    cancelledAt: Timestamp
  ): ContentExecutionCancelledEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionCancelled",
        command.executionId,
        cancelledAt
      ),
      payload: {
        executionId: execution.executionId,
        cancelledAt,
        note: execution.toSnapshot().note,
      },
    };
  }

  private createContentExecutionArchivedEvent(
    command: ArchiveContentExecutionCommand,
    execution: ContentExecution,
    archivedAt: Timestamp
  ): ContentExecutionArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionArchived",
        command.executionId,
        archivedAt
      ),
      payload: {
        executionId: execution.executionId,
        archivedAt,
      },
    };
  }

  private createContentExecutionRestoredEvent(
    command: RestoreContentExecutionCommand,
    execution: ContentExecution,
    restoredAt: Timestamp
  ): ContentExecutionRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentExecutionRestored",
        command.executionId,
        restoredAt
      ),
      payload: {
        executionId: execution.executionId,
        restoredAt,
      },
    };
  }
}

function executionNotFound(
  executionId: ContentExecutionId
): ContentExecutionApplicationError {
  return {
    code: "ContentExecutionNotFound",
    message: `Content execution ${executionId} was not found.`,
  };
}

function recommendationSetNotFound(
  recommendationSetId: ContentRecommendationSetId
): ContentExecutionApplicationError {
  return {
    code: "ContentRecommendationSetNotFound",
    message: `Content recommendation set ${recommendationSetId} was not found.`,
  };
}

function insightSetNotFound(
  insightSetId: ContentInsightSetId
): ContentExecutionApplicationError {
  return {
    code: "ContentInsightSetNotFound",
    message: `Content insight set ${insightSetId} was not found.`,
  };
}

function mapContentExecutionApplicationError(
  error: unknown
): ContentExecutionApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Unknown content execution application error.",
    cause: error,
  };
}
