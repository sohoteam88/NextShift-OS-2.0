import type {
  ContentCalendarRepository,
  ContentId,
  ContentPlanArchivedEvent,
  ContentPlanCreatedEvent,
  ContentPlanDomainEvent,
  ContentPlanId,
  ContentPlanRepository,
  ContentPlanRestoredEvent,
  ContentRepository,
  PlannedContentAddedEvent,
  PlannedContentRemovedEvent,
  PlannedContentScheduledEvent,
} from "@nextshift/domain";
import { ContentPlan } from "@nextshift/domain";
import type {
  CausationId,
  EventId,
  Result,
  Timestamp,
} from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ContentCalendarId } from "@nextshift/domain";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreatePlanId = () => ContentPlanId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreatePlanId: CreatePlanId = () =>
  crypto.randomUUID() as ContentPlanId;

export interface ContentPlanEventPublisher {
  publish(event: ContentPlanDomainEvent): Promise<void>;
}

export interface CreateContentPlanCommand extends ApplicationCommand {
  readonly commandType: "CreateContentPlan";
  readonly planId?: ContentPlanId;
  readonly calendarId: ContentCalendarId;
  readonly name: string;
  readonly causationId?: CausationId;
}

export interface AddContentToPlanCommand extends ApplicationCommand {
  readonly commandType: "AddContentToPlan";
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly platforms: readonly string[];
  readonly plannedFor: Timestamp;
  readonly causationId?: CausationId;
}

export interface SchedulePlannedContentCommand extends ApplicationCommand {
  readonly commandType: "SchedulePlannedContent";
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly causationId?: CausationId;
}

export interface RemoveContentFromPlanCommand extends ApplicationCommand {
  readonly commandType: "RemoveContentFromPlan";
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentPlanCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentPlan";
  readonly planId: ContentPlanId;
  readonly causationId?: CausationId;
}

export interface RestoreContentPlanCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentPlan";
  readonly planId: ContentPlanId;
  readonly causationId?: CausationId;
}

export interface GetContentPlanQuery extends ApplicationQuery {
  readonly queryType: "GetContentPlan";
  readonly planId: ContentPlanId;
}

export interface ContentPlanApplicationResult {
  readonly plan: ContentPlan;
}

export interface ContentPlanQueryResult {
  readonly plan: ContentPlan | null;
}

export interface ContentPlanApplicationError {
  readonly code:
    | "ContentPlanNotFound"
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentPlanPersistenceFailed"
    | "ContentPlanEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentPlanApplicationService {
  constructor(
    private readonly planRepository: ContentPlanRepository,
    private readonly contentRepository: ContentRepository,
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly eventPublisher: ContentPlanEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createPlanId: CreatePlanId = defaultCreatePlanId
  ) {}

  async createContentPlan(
    command: CreateContentPlanCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const calendar = await this.calendarRepository.findById(command.calendarId);

      if (!calendar) {
        return failure(calendarNotFound(command.calendarId));
      }

      if (calendar.businessId !== command.context.businessId) {
        return failure(calendarBusinessMismatch(command.calendarId));
      }

      const createdAt = this.now();
      const plan = ContentPlan.create({
        planId: command.planId ?? this.createPlanId(),
        businessId: command.context.businessId,
        calendarId: command.calendarId,
        name: command.name,
        createdAt,
      });

      await this.planRepository.save(plan);
      await this.publish(this.createContentPlanCreatedEvent(command, plan, createdAt));

      return success({ plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async addContentToPlan(
    command: AddContentToPlanCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const planResult = await this.loadPlan(command);
      if (!planResult.ok) return planResult;

      const content = await this.contentRepository.findById(command.contentId);
      if (!content) return failure(contentNotFound(command.contentId));

      if (content.businessId !== command.context.businessId) {
        return failure(contentBusinessMismatch(command.contentId));
      }

      const addedAt = this.now();
      planResult.value.plan.addPlannedContent({
        contentId: command.contentId,
        platforms: command.platforms,
        plannedFor: command.plannedFor,
        addedAt,
      });

      await this.planRepository.save(planResult.value.plan);
      await this.publish(
        this.createPlannedContentAddedEvent(command, planResult.value.plan)
      );

      return success({ plan: planResult.value.plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async schedulePlannedContent(
    command: SchedulePlannedContentCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const planResult = await this.loadPlan(command);
      if (!planResult.ok) return planResult;

      const plan = planResult.value.plan;
      const entry = plan.getEntry(command.contentId);

      if (!entry || entry.status !== "planned") {
        return failure({
          code: "ValidationFailed",
          message: `Planned content ${command.contentId} is not ready to schedule.`,
        });
      }

      const calendar = await this.calendarRepository.findById(plan.calendarId);
      if (!calendar) return failure(calendarNotFound(plan.calendarId));

      if (calendar.businessId !== command.context.businessId) {
        return failure(calendarBusinessMismatch(plan.calendarId));
      }

      const scheduledAt = this.now();
      for (const platform of entry.platforms) {
        calendar.scheduleContent({
          contentId: entry.contentId,
          platform,
          scheduledFor: entry.plannedFor,
          scheduledAt,
        });
      }
      plan.markContentScheduled(command.contentId, scheduledAt);

      await this.calendarRepository.save(calendar);
      await this.planRepository.save(plan);
      await this.publish(
        this.createPlannedContentScheduledEvent(command, plan, entry, scheduledAt)
      );

      return success({ plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async removeContentFromPlan(
    command: RemoveContentFromPlanCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const planResult = await this.loadPlan(command);
      if (!planResult.ok) return planResult;

      const removedAt = this.now();
      planResult.value.plan.removePlannedContent(command.contentId, removedAt);

      await this.planRepository.save(planResult.value.plan);
      await this.publish(
        this.createPlannedContentRemovedEvent(command, removedAt)
      );

      return success({ plan: planResult.value.plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async archiveContentPlan(
    command: ArchiveContentPlanCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const planResult = await this.loadPlan(command);
      if (!planResult.ok) return planResult;

      const archivedAt = this.now();
      planResult.value.plan.archive(archivedAt);

      await this.planRepository.save(planResult.value.plan);
      await this.publish(
        this.createContentPlanArchivedEvent(command, archivedAt)
      );

      return success({ plan: planResult.value.plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async restoreContentPlan(
    command: RestoreContentPlanCommand
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    try {
      const planResult = await this.loadPlan(command);
      if (!planResult.ok) return planResult;

      const restoredAt = this.now();
      planResult.value.plan.restore(restoredAt);

      await this.planRepository.save(planResult.value.plan);
      await this.publish(
        this.createContentPlanRestoredEvent(command, restoredAt)
      );

      return success({ plan: planResult.value.plan });
    } catch (error) {
      return failure(mapContentPlanApplicationError(error));
    }
  }

  async getContentPlan(query: GetContentPlanQuery): Promise<ContentPlanQueryResult> {
    return {
      plan: await this.planRepository.findById(query.planId),
    };
  }

  private async loadPlan(
    command: ApplicationCommand & { readonly planId: ContentPlanId }
  ): Promise<Result<ContentPlanApplicationResult, ContentPlanApplicationError>> {
    const plan = await this.planRepository.findById(command.planId);

    if (!plan) {
      return failure(planNotFound(command.planId));
    }

    if (plan.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content plan ${command.planId} does not belong to the active business.`,
      });
    }

    return success({ plan });
  }

  private async publish(event: ContentPlanDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends ContentPlanDomainEvent["eventType"]>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentPlanId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentPlan" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentPlanCreatedEvent(
    command: CreateContentPlanCommand,
    plan: ContentPlan,
    createdAt: Timestamp
  ): ContentPlanCreatedEvent {
    const snapshot = plan.toSnapshot();

    return {
      ...this.createBaseEvent(command, "ContentPlanCreated", snapshot.planId, createdAt),
      payload: {
        planId: snapshot.planId,
        businessId: snapshot.businessId,
        calendarId: snapshot.calendarId,
        name: snapshot.name,
        createdAt,
      },
    };
  }

  private createPlannedContentAddedEvent(
    command: AddContentToPlanCommand,
    plan: ContentPlan
  ): PlannedContentAddedEvent {
    const entry = plan.getEntry(command.contentId);

    if (!entry || entry.status !== "planned") {
      throw new Error("Planned content added event could not be created.");
    }

    return {
      ...this.createBaseEvent(command, "PlannedContentAdded", command.planId, entry.addedAt),
      payload: entry,
    };
  }

  private createPlannedContentScheduledEvent(
    command: SchedulePlannedContentCommand,
    plan: ContentPlan,
    entry: NonNullable<ReturnType<ContentPlan["getEntry"]>>,
    scheduledAt: Timestamp
  ): PlannedContentScheduledEvent {
    return {
      ...this.createBaseEvent(command, "PlannedContentScheduled", command.planId, scheduledAt),
      payload: {
        contentId: command.contentId,
        calendarId: plan.calendarId,
        platforms: entry.platforms,
        plannedFor: entry.plannedFor,
        scheduledAt,
      },
    };
  }

  private createPlannedContentRemovedEvent(
    command: RemoveContentFromPlanCommand,
    removedAt: Timestamp
  ): PlannedContentRemovedEvent {
    return {
      ...this.createBaseEvent(command, "PlannedContentRemoved", command.planId, removedAt),
      payload: {
        contentId: command.contentId,
        removedAt,
      },
    };
  }

  private createContentPlanArchivedEvent(
    command: ArchiveContentPlanCommand,
    archivedAt: Timestamp
  ): ContentPlanArchivedEvent {
    return {
      ...this.createBaseEvent(command, "ContentPlanArchived", command.planId, archivedAt),
      payload: {
        planId: command.planId,
        archivedAt,
      },
    };
  }

  private createContentPlanRestoredEvent(
    command: RestoreContentPlanCommand,
    restoredAt: Timestamp
  ): ContentPlanRestoredEvent {
    return {
      ...this.createBaseEvent(command, "ContentPlanRestored", command.planId, restoredAt),
      payload: {
        planId: command.planId,
        restoredAt,
      },
    };
  }
}

function planNotFound(planId: ContentPlanId): ContentPlanApplicationError {
  return {
    code: "ContentPlanNotFound",
    message: `Content plan ${planId} was not found.`,
  };
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentPlanApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentPlanApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function calendarBusinessMismatch(
  calendarId: ContentCalendarId
): ContentPlanApplicationError {
  return {
    code: "ValidationFailed",
    message: `Content calendar ${calendarId} does not belong to the active business.`,
  };
}

function contentBusinessMismatch(
  contentId: ContentId
): ContentPlanApplicationError {
  return {
    code: "ValidationFailed",
    message: `Content asset ${contentId} does not belong to the active business.`,
  };
}

function mapContentPlanApplicationError(
  error: unknown
): ContentPlanApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content plan command failed validation.",
    cause: error,
  };
}
