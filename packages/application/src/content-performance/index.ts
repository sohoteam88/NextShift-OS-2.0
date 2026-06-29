import type {
  ContentCalendarRepository,
  ContentCalendarId,
  ContentId,
  ContentMetricsRecordedEvent,
  ContentPerformanceArchivedEvent,
  ContentPerformanceCreatedEvent,
  ContentPerformanceDomainEvent,
  ContentPerformanceId,
  ContentPerformanceRepository,
  ContentPerformanceRestoredEvent,
  ContentPlanId,
  ContentPlanRepository,
  ContentRepository,
  ContentVariantRepository,
  ContentVariantSetId,
} from "@nextshift/domain";
import { ContentPerformance } from "@nextshift/domain";
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
type CreatePerformanceId = () => ContentPerformanceId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreatePerformanceId: CreatePerformanceId = () =>
  crypto.randomUUID() as ContentPerformanceId;

export interface ContentPerformanceEventPublisher {
  publish(event: ContentPerformanceDomainEvent): Promise<void>;
}

export interface CreateContentPerformanceCommand extends ApplicationCommand {
  readonly commandType: "CreateContentPerformance";
  readonly performanceId?: ContentPerformanceId;
  readonly variantSetId: ContentVariantSetId;
  readonly causationId?: CausationId;
}

export interface RecordContentMetricsCommand extends ApplicationCommand {
  readonly commandType: "RecordContentMetrics";
  readonly performanceId: ContentPerformanceId;
  readonly platform: string;
  readonly measuredAt: Timestamp;
  readonly impressions?: number;
  readonly reach?: number;
  readonly engagements?: number;
  readonly clicks?: number;
  readonly saves?: number;
  readonly shares?: number;
  readonly comments?: number;
  readonly leads?: number;
  readonly conversions?: number;
  readonly causationId?: CausationId;
}

export interface ArchiveContentPerformanceCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentPerformance";
  readonly performanceId: ContentPerformanceId;
  readonly causationId?: CausationId;
}

export interface RestoreContentPerformanceCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentPerformance";
  readonly performanceId: ContentPerformanceId;
  readonly causationId?: CausationId;
}

export interface GetContentPerformanceQuery extends ApplicationQuery {
  readonly queryType: "GetContentPerformance";
  readonly performanceId: ContentPerformanceId;
}

export interface ContentPerformanceApplicationResult {
  readonly performance: ContentPerformance;
}

export interface ContentPerformanceQueryResult {
  readonly performance: ContentPerformance | null;
}

export interface ContentPerformanceApplicationError {
  readonly code:
    | "ContentPerformanceNotFound"
    | "ContentVariantSetNotFound"
    | "ContentPlanNotFound"
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentPerformancePersistenceFailed"
    | "ContentPerformanceEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentPerformanceApplicationService {
  constructor(
    private readonly performanceRepository: ContentPerformanceRepository,
    private readonly variantRepository: ContentVariantRepository,
    private readonly contentRepository: ContentRepository,
    private readonly planRepository: ContentPlanRepository,
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly eventPublisher: ContentPerformanceEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createPerformanceId: CreatePerformanceId =
      defaultCreatePerformanceId
  ) {}

  async createContentPerformance(
    command: CreateContentPerformanceCommand
  ): Promise<
    Result<ContentPerformanceApplicationResult, ContentPerformanceApplicationError>
  > {
    try {
      const validation = await this.validateVariantSet(command.variantSetId, command);
      if (!validation.ok) return validation;

      const createdAt = this.now();
      const performance = ContentPerformance.create({
        performanceId: command.performanceId ?? this.createPerformanceId(),
        businessId: command.context.businessId,
        variantSetId: command.variantSetId,
        contentId: validation.value.contentId,
        createdAt,
      });

      await this.performanceRepository.save(performance);
      await this.publish(
        this.createContentPerformanceCreatedEvent(command, performance, createdAt)
      );

      return success({ performance });
    } catch (error) {
      return failure(mapContentPerformanceApplicationError(error));
    }
  }

  async recordContentMetrics(
    command: RecordContentMetricsCommand
  ): Promise<
    Result<ContentPerformanceApplicationResult, ContentPerformanceApplicationError>
  > {
    try {
      const loaded = await this.loadPerformance(command);
      if (!loaded.ok) return loaded;

      const variantSet = await this.variantRepository.findById(
        loaded.value.performance.variantSetId
      );

      if (!variantSet) {
        return failure(variantSetNotFound(loaded.value.performance.variantSetId));
      }

      if (!variantSet.getVariant(command.platform)) {
        return failure({
          code: "ValidationFailed",
          message: `Content variant for platform ${command.platform} was not found.`,
        });
      }

      const recordedAt = this.now();
      loaded.value.performance.recordMetrics({
        platform: command.platform,
        measuredAt: command.measuredAt,
        impressions: command.impressions,
        reach: command.reach,
        engagements: command.engagements,
        clicks: command.clicks,
        saves: command.saves,
        shares: command.shares,
        comments: command.comments,
        leads: command.leads,
        conversions: command.conversions,
        recordedAt,
      });

      await this.performanceRepository.save(loaded.value.performance);
      await this.publish(
        this.createContentMetricsRecordedEvent(command, loaded.value.performance)
      );

      return success({ performance: loaded.value.performance });
    } catch (error) {
      return failure(mapContentPerformanceApplicationError(error));
    }
  }

  async archiveContentPerformance(
    command: ArchiveContentPerformanceCommand
  ): Promise<
    Result<ContentPerformanceApplicationResult, ContentPerformanceApplicationError>
  > {
    try {
      const loaded = await this.loadPerformance(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.performance.archive(archivedAt);

      await this.performanceRepository.save(loaded.value.performance);
      await this.publish(
        this.createContentPerformanceArchivedEvent(command, archivedAt)
      );

      return success({ performance: loaded.value.performance });
    } catch (error) {
      return failure(mapContentPerformanceApplicationError(error));
    }
  }

  async restoreContentPerformance(
    command: RestoreContentPerformanceCommand
  ): Promise<
    Result<ContentPerformanceApplicationResult, ContentPerformanceApplicationError>
  > {
    try {
      const loaded = await this.loadPerformance(command);
      if (!loaded.ok) return loaded;

      const restoredAt = this.now();
      loaded.value.performance.restore(restoredAt);

      await this.performanceRepository.save(loaded.value.performance);
      await this.publish(
        this.createContentPerformanceRestoredEvent(command, restoredAt)
      );

      return success({ performance: loaded.value.performance });
    } catch (error) {
      return failure(mapContentPerformanceApplicationError(error));
    }
  }

  async getContentPerformance(
    query: GetContentPerformanceQuery
  ): Promise<ContentPerformanceQueryResult> {
    return {
      performance: await this.performanceRepository.findById(query.performanceId),
    };
  }

  private async validateVariantSet(
    variantSetId: ContentVariantSetId,
    command: ApplicationCommand
  ): Promise<
    Result<{ readonly contentId: ContentId }, ContentPerformanceApplicationError>
  > {
    const variantSet = await this.variantRepository.findById(variantSetId);
    if (!variantSet) return failure(variantSetNotFound(variantSetId));

    if (variantSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content variant set ${variantSetId} does not belong to the active business.`,
      });
    }

    const content = await this.contentRepository.findById(variantSet.contentId);
    if (!content) return failure(contentNotFound(variantSet.contentId));

    if (content.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content asset ${variantSet.contentId} does not belong to the active business.`,
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

    return success({ contentId: variantSet.contentId });
  }

  private async loadPerformance(
    command: ApplicationCommand & { readonly performanceId: ContentPerformanceId }
  ): Promise<
    Result<ContentPerformanceApplicationResult, ContentPerformanceApplicationError>
  > {
    const performance = await this.performanceRepository.findById(
      command.performanceId
    );

    if (!performance) {
      return failure(performanceNotFound(command.performanceId));
    }

    if (performance.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content performance ${command.performanceId} does not belong to the active business.`,
      });
    }

    return success({ performance });
  }

  private async publish(event: ContentPerformanceDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends ContentPerformanceDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentPerformanceId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentPerformance" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentPerformanceCreatedEvent(
    command: CreateContentPerformanceCommand,
    performance: ContentPerformance,
    createdAt: Timestamp
  ): ContentPerformanceCreatedEvent {
    const snapshot = performance.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentPerformanceCreated",
        snapshot.performanceId,
        createdAt
      ),
      payload: {
        performanceId: snapshot.performanceId,
        businessId: snapshot.businessId,
        variantSetId: snapshot.variantSetId,
        contentId: snapshot.contentId,
        createdAt,
      },
    };
  }

  private createContentMetricsRecordedEvent(
    command: RecordContentMetricsCommand,
    performance: ContentPerformance
  ): ContentMetricsRecordedEvent {
    const metric = performance
      .listMetrics()
      .find(
        (candidate) =>
          candidate.platform === command.platform &&
          candidate.measuredAt === command.measuredAt
      );

    if (!metric) {
      throw new Error("Content metrics recorded event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentMetricsRecorded",
        command.performanceId,
        metric.recordedAt
      ),
      payload: metric,
    };
  }

  private createContentPerformanceArchivedEvent(
    command: ArchiveContentPerformanceCommand,
    archivedAt: Timestamp
  ): ContentPerformanceArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentPerformanceArchived",
        command.performanceId,
        archivedAt
      ),
      payload: {
        performanceId: command.performanceId,
        archivedAt,
      },
    };
  }

  private createContentPerformanceRestoredEvent(
    command: RestoreContentPerformanceCommand,
    restoredAt: Timestamp
  ): ContentPerformanceRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentPerformanceRestored",
        command.performanceId,
        restoredAt
      ),
      payload: {
        performanceId: command.performanceId,
        restoredAt,
      },
    };
  }
}

function performanceNotFound(
  performanceId: ContentPerformanceId
): ContentPerformanceApplicationError {
  return {
    code: "ContentPerformanceNotFound",
    message: `Content performance ${performanceId} was not found.`,
  };
}

function variantSetNotFound(
  variantSetId: ContentVariantSetId
): ContentPerformanceApplicationError {
  return {
    code: "ContentVariantSetNotFound",
    message: `Content variant set ${variantSetId} was not found.`,
  };
}

function planNotFound(
  planId: ContentPlanId
): ContentPerformanceApplicationError {
  return {
    code: "ContentPlanNotFound",
    message: `Content plan ${planId} was not found.`,
  };
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentPerformanceApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentPerformanceApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function mapContentPerformanceApplicationError(
  error: unknown
): ContentPerformanceApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content performance command failed validation.",
    cause: error,
  };
}
