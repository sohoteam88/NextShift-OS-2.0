import type {
  ContentCalendarRepository,
  ContentCalendarId,
  ContentId,
  ContentInsightArchivedEvent,
  ContentInsightDomainEvent,
  ContentInsightId,
  ContentInsightRecordedEvent,
  ContentInsightRepository,
  ContentInsightResolvedEvent,
  ContentInsightSet,
  ContentInsightSetArchivedEvent,
  ContentInsightSetCreatedEvent,
  ContentInsightSetId,
  ContentInsightSetRestoredEvent,
  ContentPerformanceId,
  ContentPerformanceRepository,
  ContentPlanId,
  ContentPlanRepository,
  ContentRepository,
  ContentVariantRepository,
  ContentVariantSetId,
} from "@nextshift/domain";
import {
  ContentInsightSet as ContentInsightSetAggregate,
  createContentPlatform,
  createInsightFromSummary,
} from "@nextshift/domain";
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
type CreateInsightSetId = () => ContentInsightSetId;
type CreateInsightId = () => ContentInsightId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateInsightSetId: CreateInsightSetId = () =>
  crypto.randomUUID() as ContentInsightSetId;
const defaultCreateInsightId: CreateInsightId = () =>
  crypto.randomUUID() as ContentInsightId;

export interface ContentInsightEventPublisher {
  publish(event: ContentInsightDomainEvent): Promise<void>;
}

export interface CreateContentInsightSetCommand extends ApplicationCommand {
  readonly commandType: "CreateContentInsightSet";
  readonly insightSetId?: ContentInsightSetId;
  readonly performanceId: ContentPerformanceId;
  readonly causationId?: CausationId;
}

export interface GenerateContentInsightCommand extends ApplicationCommand {
  readonly commandType: "GenerateContentInsight";
  readonly insightSetId: ContentInsightSetId;
  readonly platform: string;
  readonly insightId?: ContentInsightId;
  readonly causationId?: CausationId;
}

export interface ResolveContentInsightCommand extends ApplicationCommand {
  readonly commandType: "ResolveContentInsight";
  readonly insightSetId: ContentInsightSetId;
  readonly insightId: ContentInsightId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentInsightCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentInsight";
  readonly insightSetId: ContentInsightSetId;
  readonly insightId: ContentInsightId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentInsightSetCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentInsightSet";
  readonly insightSetId: ContentInsightSetId;
  readonly causationId?: CausationId;
}

export interface RestoreContentInsightSetCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentInsightSet";
  readonly insightSetId: ContentInsightSetId;
  readonly causationId?: CausationId;
}

export interface GetContentInsightSetQuery extends ApplicationQuery {
  readonly queryType: "GetContentInsightSet";
  readonly insightSetId: ContentInsightSetId;
}

export interface ContentInsightApplicationResult {
  readonly insightSet: ContentInsightSet;
}

export interface ContentInsightQueryResult {
  readonly insightSet: ContentInsightSet | null;
}

export interface ContentInsightApplicationError {
  readonly code:
    | "ContentInsightSetNotFound"
    | "ContentPerformanceNotFound"
    | "ContentVariantSetNotFound"
    | "ContentPlanNotFound"
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentInsightPersistenceFailed"
    | "ContentInsightEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentInsightApplicationService {
  constructor(
    private readonly insightRepository: ContentInsightRepository,
    private readonly performanceRepository: ContentPerformanceRepository,
    private readonly variantRepository: ContentVariantRepository,
    private readonly contentRepository: ContentRepository,
    private readonly planRepository: ContentPlanRepository,
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly eventPublisher: ContentInsightEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createInsightSetId: CreateInsightSetId =
      defaultCreateInsightSetId,
    private readonly createInsightId: CreateInsightId = defaultCreateInsightId
  ) {}

  async createContentInsightSet(
    command: CreateContentInsightSetCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const validation = await this.validatePerformance(command.performanceId, command);
      if (!validation.ok) return validation;

      const createdAt = this.now();
      const insightSet = ContentInsightSetAggregate.create({
        insightSetId: command.insightSetId ?? this.createInsightSetId(),
        businessId: command.context.businessId,
        performanceId: command.performanceId,
        variantSetId: validation.value.variantSetId,
        contentId: validation.value.contentId,
        createdAt,
      });

      await this.insightRepository.save(insightSet);
      await this.publish(
        this.createContentInsightSetCreatedEvent(command, insightSet, createdAt)
      );

      return success({ insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async generateContentInsight(
    command: GenerateContentInsightCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const loaded = await this.loadInsightSet(command);
      if (!loaded.ok) return loaded;

      const performance = await this.performanceRepository.findById(
        loaded.value.insightSet.performanceId
      );

      if (!performance) {
        return failure(performanceNotFound(loaded.value.insightSet.performanceId));
      }

      const variantSet = await this.variantRepository.findById(
        loaded.value.insightSet.variantSetId
      );

      if (!variantSet) {
        return failure(variantSetNotFound(loaded.value.insightSet.variantSetId));
      }

      if (!variantSet.getVariant(command.platform)) {
        return failure({
          code: "ValidationFailed",
          message: `Content variant for platform ${command.platform} was not found.`,
        });
      }

      const createdAt = this.now();
      const summary = performance.summarizePlatform(command.platform);
      const input = createInsightFromSummary(
        command.insightId ?? this.createInsightId(),
        summary,
        createdAt
      );

      loaded.value.insightSet.recordInsight(input);

      await this.insightRepository.save(loaded.value.insightSet);
      await this.publish(
        this.createContentInsightRecordedEvent(command, loaded.value.insightSet)
      );

      return success({ insightSet: loaded.value.insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async resolveContentInsight(
    command: ResolveContentInsightCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const loaded = await this.loadInsightSet(command);
      if (!loaded.ok) return loaded;

      const resolvedAt = this.now();
      loaded.value.insightSet.resolveInsight(command.insightId, resolvedAt);

      await this.insightRepository.save(loaded.value.insightSet);
      await this.publish(
        this.createContentInsightResolvedEvent(command, resolvedAt)
      );

      return success({ insightSet: loaded.value.insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async archiveContentInsight(
    command: ArchiveContentInsightCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const loaded = await this.loadInsightSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.insightSet.archiveInsight(command.insightId, archivedAt);

      await this.insightRepository.save(loaded.value.insightSet);
      await this.publish(
        this.createContentInsightArchivedEvent(command, archivedAt)
      );

      return success({ insightSet: loaded.value.insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async archiveContentInsightSet(
    command: ArchiveContentInsightSetCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const loaded = await this.loadInsightSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.insightSet.archive(archivedAt);

      await this.insightRepository.save(loaded.value.insightSet);
      await this.publish(
        this.createContentInsightSetArchivedEvent(command, archivedAt)
      );

      return success({ insightSet: loaded.value.insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async restoreContentInsightSet(
    command: RestoreContentInsightSetCommand
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    try {
      const loaded = await this.loadInsightSet(command);
      if (!loaded.ok) return loaded;

      const restoredAt = this.now();
      loaded.value.insightSet.restore(restoredAt);

      await this.insightRepository.save(loaded.value.insightSet);
      await this.publish(
        this.createContentInsightSetRestoredEvent(command, restoredAt)
      );

      return success({ insightSet: loaded.value.insightSet });
    } catch (error) {
      return failure(mapContentInsightApplicationError(error));
    }
  }

  async getContentInsightSet(
    query: GetContentInsightSetQuery
  ): Promise<ContentInsightQueryResult> {
    return {
      insightSet: await this.insightRepository.findById(query.insightSetId),
    };
  }

  private async validatePerformance(
    performanceId: ContentPerformanceId,
    command: ApplicationCommand
  ): Promise<
    Result<
      { readonly variantSetId: ContentVariantSetId; readonly contentId: ContentId },
      ContentInsightApplicationError
    >
  > {
    const performance = await this.performanceRepository.findById(performanceId);
    if (!performance) return failure(performanceNotFound(performanceId));

    if (performance.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content performance ${performanceId} does not belong to the active business.`,
      });
    }

    const variantSet = await this.variantRepository.findById(
      performance.variantSetId
    );
    if (!variantSet) return failure(variantSetNotFound(performance.variantSetId));

    if (variantSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content variant set ${performance.variantSetId} does not belong to the active business.`,
      });
    }

    const content = await this.contentRepository.findById(performance.contentId);
    if (!content) return failure(contentNotFound(performance.contentId));

    if (content.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content asset ${performance.contentId} does not belong to the active business.`,
      });
    }

    const plan = await this.planRepository.findById(variantSet.planId);
    if (!plan) return failure(planNotFound(variantSet.planId));

    if (plan.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content plan ${variantSet.planId} does not belong to the active business.`,
      });
    }

    const calendar = await this.calendarRepository.findById(plan.calendarId);
    if (!calendar) return failure(calendarNotFound(plan.calendarId));

    if (calendar.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content calendar ${plan.calendarId} does not belong to the active business.`,
      });
    }

    return success({
      variantSetId: performance.variantSetId,
      contentId: performance.contentId,
    });
  }

  private async loadInsightSet(
    command: ApplicationCommand & { readonly insightSetId: ContentInsightSetId }
  ): Promise<Result<ContentInsightApplicationResult, ContentInsightApplicationError>> {
    const insightSet = await this.insightRepository.findById(command.insightSetId);

    if (!insightSet) {
      return failure(insightSetNotFound(command.insightSetId));
    }

    if (insightSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content insight set ${command.insightSetId} does not belong to the active business.`,
      });
    }

    return success({ insightSet });
  }

  private async publish(event: ContentInsightDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends ContentInsightDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentInsightSetId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentInsightSet" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentInsightSetCreatedEvent(
    command: CreateContentInsightSetCommand,
    insightSet: ContentInsightSet,
    createdAt: Timestamp
  ): ContentInsightSetCreatedEvent {
    const snapshot = insightSet.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightSetCreated",
        snapshot.insightSetId,
        createdAt
      ),
      payload: {
        insightSetId: snapshot.insightSetId,
        businessId: snapshot.businessId,
        performanceId: snapshot.performanceId,
        variantSetId: snapshot.variantSetId,
        contentId: snapshot.contentId,
        createdAt,
      },
    };
  }

  private createContentInsightRecordedEvent(
    command: GenerateContentInsightCommand,
    insightSet: ContentInsightSet
  ): ContentInsightRecordedEvent {
    const platform = createContentPlatform(command.platform);
    const insight = insightSet
      .listInsights()
      .find(
        (candidate) =>
          candidate.platform === platform && candidate.status === "open"
      );

    if (!insight) {
      throw new Error("Content insight recorded event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightRecorded",
        command.insightSetId,
        insight.createdAt
      ),
      payload: insight,
    };
  }

  private createContentInsightResolvedEvent(
    command: ResolveContentInsightCommand,
    resolvedAt: Timestamp
  ): ContentInsightResolvedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightResolved",
        command.insightSetId,
        resolvedAt
      ),
      payload: {
        insightId: command.insightId,
        resolvedAt,
      },
    };
  }

  private createContentInsightArchivedEvent(
    command: ArchiveContentInsightCommand,
    archivedAt: Timestamp
  ): ContentInsightArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightArchived",
        command.insightSetId,
        archivedAt
      ),
      payload: {
        insightId: command.insightId,
        archivedAt,
      },
    };
  }

  private createContentInsightSetArchivedEvent(
    command: ArchiveContentInsightSetCommand,
    archivedAt: Timestamp
  ): ContentInsightSetArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightSetArchived",
        command.insightSetId,
        archivedAt
      ),
      payload: {
        insightSetId: command.insightSetId,
        archivedAt,
      },
    };
  }

  private createContentInsightSetRestoredEvent(
    command: RestoreContentInsightSetCommand,
    restoredAt: Timestamp
  ): ContentInsightSetRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentInsightSetRestored",
        command.insightSetId,
        restoredAt
      ),
      payload: {
        insightSetId: command.insightSetId,
        restoredAt,
      },
    };
  }
}

function insightSetNotFound(
  insightSetId: ContentInsightSetId
): ContentInsightApplicationError {
  return {
    code: "ContentInsightSetNotFound",
    message: `Content insight set ${insightSetId} was not found.`,
  };
}

function performanceNotFound(
  performanceId: ContentPerformanceId
): ContentInsightApplicationError {
  return {
    code: "ContentPerformanceNotFound",
    message: `Content performance ${performanceId} was not found.`,
  };
}

function variantSetNotFound(
  variantSetId: ContentVariantSetId
): ContentInsightApplicationError {
  return {
    code: "ContentVariantSetNotFound",
    message: `Content variant set ${variantSetId} was not found.`,
  };
}

function planNotFound(
  planId: ContentPlanId
): ContentInsightApplicationError {
  return {
    code: "ContentPlanNotFound",
    message: `Content plan ${planId} was not found.`,
  };
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentInsightApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentInsightApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function mapContentInsightApplicationError(
  error: unknown
): ContentInsightApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content insight command failed validation.",
    cause: error,
  };
}
