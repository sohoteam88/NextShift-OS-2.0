import type {
  ContentCalendarRepository,
  ContentCalendarId,
  ContentId,
  ContentInsightId,
  ContentInsightRepository,
  ContentInsightSetId,
  ContentPerformanceRepository,
  ContentPerformanceId,
  ContentPlanId,
  ContentPlanRepository,
  ContentRecommendationAppliedEvent,
  ContentRecommendationArchivedEvent,
  ContentRecommendationDismissedEvent,
  ContentRecommendationDomainEvent,
  ContentRecommendationId,
  ContentRecommendationRecordedEvent,
  ContentRecommendationRepository,
  ContentRecommendationSet,
  ContentRecommendationSetArchivedEvent,
  ContentRecommendationSetCreatedEvent,
  ContentRecommendationSetId,
  ContentRecommendationSetRestoredEvent,
  ContentRepository,
  ContentVariantRepository,
  ContentVariantSetId,
} from "@nextshift/domain";
import {
  ContentRecommendationSet as ContentRecommendationSetAggregate,
  createRecommendationFromInsight,
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
type CreateRecommendationSetId = () => ContentRecommendationSetId;
type CreateRecommendationId = () => ContentRecommendationId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateRecommendationSetId: CreateRecommendationSetId = () =>
  crypto.randomUUID() as ContentRecommendationSetId;
const defaultCreateRecommendationId: CreateRecommendationId = () =>
  crypto.randomUUID() as ContentRecommendationId;

export interface ContentRecommendationEventPublisher {
  publish(event: ContentRecommendationDomainEvent): Promise<void>;
}

export interface CreateContentRecommendationSetCommand
  extends ApplicationCommand {
  readonly commandType: "CreateContentRecommendationSet";
  readonly recommendationSetId?: ContentRecommendationSetId;
  readonly insightSetId: ContentInsightSetId;
  readonly causationId?: CausationId;
}

export interface GenerateContentRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "GenerateContentRecommendation";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly insightId: ContentInsightId;
  readonly recommendationId?: ContentRecommendationId;
  readonly causationId?: CausationId;
}

export interface ApplyContentRecommendationCommand extends ApplicationCommand {
  readonly commandType: "ApplyContentRecommendation";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly causationId?: CausationId;
}

export interface DismissContentRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "DismissContentRecommendation";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentRecommendationCommand
  extends ApplicationCommand {
  readonly commandType: "ArchiveContentRecommendation";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly recommendationId: ContentRecommendationId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentRecommendationSetCommand
  extends ApplicationCommand {
  readonly commandType: "ArchiveContentRecommendationSet";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly causationId?: CausationId;
}

export interface RestoreContentRecommendationSetCommand
  extends ApplicationCommand {
  readonly commandType: "RestoreContentRecommendationSet";
  readonly recommendationSetId: ContentRecommendationSetId;
  readonly causationId?: CausationId;
}

export interface GetContentRecommendationSetQuery extends ApplicationQuery {
  readonly queryType: "GetContentRecommendationSet";
  readonly recommendationSetId: ContentRecommendationSetId;
}

export interface ContentRecommendationApplicationResult {
  readonly recommendationSet: ContentRecommendationSet;
}

export interface ContentRecommendationQueryResult {
  readonly recommendationSet: ContentRecommendationSet | null;
}

export interface ContentRecommendationApplicationError {
  readonly code:
    | "ContentRecommendationSetNotFound"
    | "ContentInsightSetNotFound"
    | "ContentPerformanceNotFound"
    | "ContentVariantSetNotFound"
    | "ContentPlanNotFound"
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentRecommendationPersistenceFailed"
    | "ContentRecommendationEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentRecommendationApplicationService {
  constructor(
    private readonly recommendationRepository: ContentRecommendationRepository,
    private readonly insightRepository: ContentInsightRepository,
    private readonly performanceRepository: ContentPerformanceRepository,
    private readonly variantRepository: ContentVariantRepository,
    private readonly contentRepository: ContentRepository,
    private readonly planRepository: ContentPlanRepository,
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly eventPublisher: ContentRecommendationEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createRecommendationSetId: CreateRecommendationSetId =
      defaultCreateRecommendationSetId,
    private readonly createRecommendationId: CreateRecommendationId =
      defaultCreateRecommendationId
  ) {}

  async createContentRecommendationSet(
    command: CreateContentRecommendationSetCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const validation = await this.validateInsightSet(command.insightSetId, command);
      if (!validation.ok) return validation;

      const createdAt = this.now();
      const recommendationSet = ContentRecommendationSetAggregate.create({
        recommendationSetId:
          command.recommendationSetId ?? this.createRecommendationSetId(),
        businessId: command.context.businessId,
        insightSetId: command.insightSetId,
        performanceId: validation.value.performanceId,
        variantSetId: validation.value.variantSetId,
        contentId: validation.value.contentId,
        createdAt,
      });

      await this.recommendationRepository.save(recommendationSet);
      await this.publish(
        this.createContentRecommendationSetCreatedEvent(
          command,
          recommendationSet,
          createdAt
        )
      );

      return success({ recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async generateContentRecommendation(
    command: GenerateContentRecommendationCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const insightSet = await this.insightRepository.findById(
        loaded.value.recommendationSet.insightSetId
      );

      if (!insightSet) {
        return failure(insightSetNotFound(loaded.value.recommendationSet.insightSetId));
      }

      const insight = insightSet.getInsight(command.insightId);

      if (!insight || insight.status !== "open") {
        return failure({
          code: "ValidationFailed",
          message: `Open content insight ${command.insightId} was not found.`,
        });
      }

      const createdAt = this.now();
      loaded.value.recommendationSet.recordRecommendation(
        createRecommendationFromInsight(
          command.recommendationId ?? this.createRecommendationId(),
          insight,
          createdAt
        )
      );

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationRecordedEvent(
          command,
          loaded.value.recommendationSet
        )
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async applyContentRecommendation(
    command: ApplyContentRecommendationCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const appliedAt = this.now();
      loaded.value.recommendationSet.applyRecommendation(
        command.recommendationId,
        appliedAt
      );

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationAppliedEvent(command, appliedAt)
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async dismissContentRecommendation(
    command: DismissContentRecommendationCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const dismissedAt = this.now();
      loaded.value.recommendationSet.dismissRecommendation(
        command.recommendationId,
        dismissedAt
      );

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationDismissedEvent(command, dismissedAt)
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async archiveContentRecommendation(
    command: ArchiveContentRecommendationCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.recommendationSet.archiveRecommendation(
        command.recommendationId,
        archivedAt
      );

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationArchivedEvent(command, archivedAt)
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async archiveContentRecommendationSet(
    command: ArchiveContentRecommendationSetCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.recommendationSet.archive(archivedAt);

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationSetArchivedEvent(command, archivedAt)
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async restoreContentRecommendationSet(
    command: RestoreContentRecommendationSetCommand
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
    >
  > {
    try {
      const loaded = await this.loadRecommendationSet(command);
      if (!loaded.ok) return loaded;

      const restoredAt = this.now();
      loaded.value.recommendationSet.restore(restoredAt);

      await this.recommendationRepository.save(
        loaded.value.recommendationSet
      );
      await this.publish(
        this.createContentRecommendationSetRestoredEvent(command, restoredAt)
      );

      return success({ recommendationSet: loaded.value.recommendationSet });
    } catch (error) {
      return failure(mapContentRecommendationApplicationError(error));
    }
  }

  async getContentRecommendationSet(
    query: GetContentRecommendationSetQuery
  ): Promise<ContentRecommendationQueryResult> {
    return {
      recommendationSet: await this.recommendationRepository.findById(
        query.recommendationSetId
      ),
    };
  }

  private async validateInsightSet(
    insightSetId: ContentInsightSetId,
    command: ApplicationCommand
  ): Promise<
    Result<
      {
        readonly performanceId: ReturnType<ContentRecommendationSet["toSnapshot"]>["performanceId"];
        readonly variantSetId: ContentVariantSetId;
        readonly contentId: ContentId;
      },
      ContentRecommendationApplicationError
    >
  > {
    const insightSet = await this.insightRepository.findById(insightSetId);
    if (!insightSet) return failure(insightSetNotFound(insightSetId));

    if (insightSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content insight set ${insightSetId} does not belong to the active business.`,
      });
    }

    const performance = await this.performanceRepository.findById(
      insightSet.performanceId
    );
    if (!performance) return failure(performanceNotFound(insightSet.performanceId));

    if (performance.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content performance ${insightSet.performanceId} does not belong to the active business.`,
      });
    }

    const variantSet = await this.variantRepository.findById(
      insightSet.variantSetId
    );
    if (!variantSet) return failure(variantSetNotFound(insightSet.variantSetId));

    if (variantSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content variant set ${insightSet.variantSetId} does not belong to the active business.`,
      });
    }

    const content = await this.contentRepository.findById(insightSet.contentId);
    if (!content) return failure(contentNotFound(insightSet.contentId));

    if (content.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content asset ${insightSet.contentId} does not belong to the active business.`,
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
      performanceId: insightSet.performanceId,
      variantSetId: insightSet.variantSetId,
      contentId: insightSet.contentId,
    });
  }

  private async loadRecommendationSet(
    command: ApplicationCommand & {
      readonly recommendationSetId: ContentRecommendationSetId;
    }
  ): Promise<
    Result<
      ContentRecommendationApplicationResult,
      ContentRecommendationApplicationError
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

    return success({ recommendationSet });
  }

  private async publish(event: ContentRecommendationDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends ContentRecommendationDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentRecommendationSetId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentRecommendationSet" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentRecommendationSetCreatedEvent(
    command: CreateContentRecommendationSetCommand,
    recommendationSet: ContentRecommendationSet,
    createdAt: Timestamp
  ): ContentRecommendationSetCreatedEvent {
    const snapshot = recommendationSet.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationSetCreated",
        snapshot.recommendationSetId,
        createdAt
      ),
      payload: {
        recommendationSetId: snapshot.recommendationSetId,
        businessId: snapshot.businessId,
        insightSetId: snapshot.insightSetId,
        performanceId: snapshot.performanceId,
        variantSetId: snapshot.variantSetId,
        contentId: snapshot.contentId,
        createdAt,
      },
    };
  }

  private createContentRecommendationRecordedEvent(
    command: GenerateContentRecommendationCommand,
    recommendationSet: ContentRecommendationSet
  ): ContentRecommendationRecordedEvent {
    const recommendationId =
      command.recommendationId ?? recommendationSet.listRecommendations().at(-1)?.recommendationId;
    const recommendation = recommendationId
      ? recommendationSet.getRecommendation(recommendationId)
      : null;

    if (!recommendation || recommendation.status !== "open") {
      throw new Error("Content recommendation recorded event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationRecorded",
        command.recommendationSetId,
        recommendation.createdAt
      ),
      payload: recommendation,
    };
  }

  private createContentRecommendationAppliedEvent(
    command: ApplyContentRecommendationCommand,
    appliedAt: Timestamp
  ): ContentRecommendationAppliedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationApplied",
        command.recommendationSetId,
        appliedAt
      ),
      payload: {
        recommendationId: command.recommendationId,
        appliedAt,
      },
    };
  }

  private createContentRecommendationDismissedEvent(
    command: DismissContentRecommendationCommand,
    dismissedAt: Timestamp
  ): ContentRecommendationDismissedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationDismissed",
        command.recommendationSetId,
        dismissedAt
      ),
      payload: {
        recommendationId: command.recommendationId,
        dismissedAt,
      },
    };
  }

  private createContentRecommendationArchivedEvent(
    command: ArchiveContentRecommendationCommand,
    archivedAt: Timestamp
  ): ContentRecommendationArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationArchived",
        command.recommendationSetId,
        archivedAt
      ),
      payload: {
        recommendationId: command.recommendationId,
        archivedAt,
      },
    };
  }

  private createContentRecommendationSetArchivedEvent(
    command: ArchiveContentRecommendationSetCommand,
    archivedAt: Timestamp
  ): ContentRecommendationSetArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationSetArchived",
        command.recommendationSetId,
        archivedAt
      ),
      payload: {
        recommendationSetId: command.recommendationSetId,
        archivedAt,
      },
    };
  }

  private createContentRecommendationSetRestoredEvent(
    command: RestoreContentRecommendationSetCommand,
    restoredAt: Timestamp
  ): ContentRecommendationSetRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentRecommendationSetRestored",
        command.recommendationSetId,
        restoredAt
      ),
      payload: {
        recommendationSetId: command.recommendationSetId,
        restoredAt,
      },
    };
  }
}

function recommendationSetNotFound(
  recommendationSetId: ContentRecommendationSetId
): ContentRecommendationApplicationError {
  return {
    code: "ContentRecommendationSetNotFound",
    message: `Content recommendation set ${recommendationSetId} was not found.`,
  };
}

function insightSetNotFound(
  insightSetId: ContentInsightSetId
): ContentRecommendationApplicationError {
  return {
    code: "ContentInsightSetNotFound",
    message: `Content insight set ${insightSetId} was not found.`,
  };
}

function performanceNotFound(
  performanceId: ContentPerformanceId
): ContentRecommendationApplicationError {
  return {
    code: "ContentPerformanceNotFound",
    message: `Content performance ${performanceId} was not found.`,
  };
}

function variantSetNotFound(
  variantSetId: ContentVariantSetId
): ContentRecommendationApplicationError {
  return {
    code: "ContentVariantSetNotFound",
    message: `Content variant set ${variantSetId} was not found.`,
  };
}

function planNotFound(
  planId: ContentPlanId
): ContentRecommendationApplicationError {
  return {
    code: "ContentPlanNotFound",
    message: `Content plan ${planId} was not found.`,
  };
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentRecommendationApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentRecommendationApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function mapContentRecommendationApplicationError(
  error: unknown
): ContentRecommendationApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content recommendation command failed validation.",
    cause: error,
  };
}
