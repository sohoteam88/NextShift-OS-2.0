import type {
  ContentCalendarArchivedEvent,
  ContentCalendarCreatedEvent,
  ContentCalendarDomainEvent,
  ContentCalendarId,
  ContentCalendarRepository,
  ContentCalendarRestoredEvent,
  ContentId,
  ContentRepository,
  ContentRescheduledEvent,
  ContentScheduledEvent,
  ScheduledContentCancelledEvent,
  ScheduledContentPublishedEvent,
} from "@nextshift/domain";
import { ContentCalendar, createContentPlatform } from "@nextshift/domain";
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
type CreateCalendarId = () => ContentCalendarId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateCalendarId: CreateCalendarId = () =>
  crypto.randomUUID() as ContentCalendarId;

export interface ContentCalendarEventPublisher {
  publish(event: ContentCalendarDomainEvent): Promise<void>;
}

export interface CreateContentCalendarCommand extends ApplicationCommand {
  readonly commandType: "CreateContentCalendar";
  readonly calendarId?: ContentCalendarId;
  readonly name: string;
  readonly causationId?: CausationId;
}

export interface ScheduleContentCommand extends ApplicationCommand {
  readonly commandType: "ScheduleContent";
  readonly calendarId: ContentCalendarId;
  readonly contentId: ContentId;
  readonly platform: string;
  readonly scheduledFor: Timestamp;
  readonly causationId?: CausationId;
}

export interface RescheduleContentCommand extends ApplicationCommand {
  readonly commandType: "RescheduleContent";
  readonly calendarId: ContentCalendarId;
  readonly contentId: ContentId;
  readonly platform: string;
  readonly scheduledFor: Timestamp;
  readonly causationId?: CausationId;
}

export interface MarkScheduledContentPublishedCommand
  extends ApplicationCommand {
  readonly commandType: "MarkScheduledContentPublished";
  readonly calendarId: ContentCalendarId;
  readonly contentId: ContentId;
  readonly platform: string;
  readonly causationId?: CausationId;
}

export interface CancelScheduledContentCommand extends ApplicationCommand {
  readonly commandType: "CancelScheduledContent";
  readonly calendarId: ContentCalendarId;
  readonly contentId: ContentId;
  readonly platform: string;
  readonly causationId?: CausationId;
}

export interface ArchiveContentCalendarCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentCalendar";
  readonly calendarId: ContentCalendarId;
  readonly causationId?: CausationId;
}

export interface RestoreContentCalendarCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentCalendar";
  readonly calendarId: ContentCalendarId;
  readonly causationId?: CausationId;
}

export interface GetContentCalendarQuery extends ApplicationQuery {
  readonly queryType: "GetContentCalendar";
  readonly calendarId: ContentCalendarId;
}

export interface ContentCalendarApplicationResult {
  readonly calendar: ContentCalendar;
}

export interface ContentCalendarQueryResult {
  readonly calendar: ContentCalendar | null;
}

export interface ContentCalendarApplicationError {
  readonly code:
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentCalendarPersistenceFailed"
    | "ContentCalendarEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentCalendarApplicationService {
  constructor(
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly contentRepository: ContentRepository,
    private readonly eventPublisher: ContentCalendarEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createCalendarId: CreateCalendarId = defaultCreateCalendarId
  ) {}

  async createContentCalendar(
    command: CreateContentCalendarCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const createdAt = this.now();
      const calendar = ContentCalendar.create({
        calendarId: command.calendarId ?? this.createCalendarId(),
        businessId: command.context.businessId,
        name: command.name,
        createdAt,
      });

      await this.calendarRepository.save(calendar);
      await this.publish(
        this.createContentCalendarCreatedEvent(command, calendar, createdAt)
      );

      return success({ calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async scheduleContent(
    command: ScheduleContentCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const content = await this.contentRepository.findById(command.contentId);
      if (!content) return failure(contentNotFound(command.contentId));

      if (content.businessId !== command.context.businessId) {
        return failure(businessMismatch(command.contentId));
      }

      const scheduledAt = this.now();
      calendar.value.calendar.scheduleContent({
        contentId: command.contentId,
        platform: command.platform,
        scheduledFor: command.scheduledFor,
        scheduledAt,
      });

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createContentScheduledEvent(command, calendar.value.calendar)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async rescheduleContent(
    command: RescheduleContentCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const updatedAt = this.now();
      calendar.value.calendar.rescheduleContent(
        command.contentId,
        command.platform,
        command.scheduledFor,
        updatedAt
      );

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createContentRescheduledEvent(command, updatedAt)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async markScheduledContentPublished(
    command: MarkScheduledContentPublishedCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const publishedAt = this.now();
      calendar.value.calendar.markPublished(
        command.contentId,
        command.platform,
        publishedAt
      );

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createScheduledContentPublishedEvent(command, publishedAt)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async cancelScheduledContent(
    command: CancelScheduledContentCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const cancelledAt = this.now();
      calendar.value.calendar.cancelScheduledContent(
        command.contentId,
        command.platform,
        cancelledAt
      );

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createScheduledContentCancelledEvent(command, cancelledAt)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async archiveContentCalendar(
    command: ArchiveContentCalendarCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const archivedAt = this.now();
      calendar.value.calendar.archive(archivedAt);

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createContentCalendarArchivedEvent(command, archivedAt)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async restoreContentCalendar(
    command: RestoreContentCalendarCommand
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    try {
      const calendar = await this.loadCalendar(command);
      if (!calendar.ok) return calendar;

      const restoredAt = this.now();
      calendar.value.calendar.restore(restoredAt);

      await this.calendarRepository.save(calendar.value.calendar);
      await this.publish(
        this.createContentCalendarRestoredEvent(command, restoredAt)
      );

      return success({ calendar: calendar.value.calendar });
    } catch (error) {
      return failure(mapContentCalendarApplicationError(error));
    }
  }

  async getContentCalendar(
    query: GetContentCalendarQuery
  ): Promise<ContentCalendarQueryResult> {
    return {
      calendar: await this.calendarRepository.findById(query.calendarId),
    };
  }

  private async loadCalendar(
    command: ApplicationCommand & { readonly calendarId: ContentCalendarId }
  ): Promise<
    Result<ContentCalendarApplicationResult, ContentCalendarApplicationError>
  > {
    const calendar = await this.calendarRepository.findById(command.calendarId);

    if (!calendar) {
      return failure(calendarNotFound(command.calendarId));
    }

    if (calendar.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content calendar ${command.calendarId} does not belong to the active business.`,
      });
    }

    return success({ calendar });
  }

  private async publish(event: ContentCalendarDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends ContentCalendarDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentCalendarId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentCalendar" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentCalendarCreatedEvent(
    command: CreateContentCalendarCommand,
    calendar: ContentCalendar,
    createdAt: Timestamp
  ): ContentCalendarCreatedEvent {
    const snapshot = calendar.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentCalendarCreated",
        snapshot.calendarId,
        createdAt
      ),
      payload: {
        calendarId: snapshot.calendarId,
        businessId: snapshot.businessId,
        name: snapshot.name,
        createdAt,
      },
    };
  }

  private createContentScheduledEvent(
    command: ScheduleContentCommand,
    calendar: ContentCalendar
  ): ContentScheduledEvent {
    const platform = createContentPlatform(command.platform);
    const entry = calendar
      .listEntries()
      .find(
        (candidate) =>
          candidate.contentId === command.contentId &&
          candidate.platform === platform &&
          candidate.status === "scheduled"
      );

    if (!entry) {
      throw new Error("Scheduled content event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentScheduled",
        command.calendarId,
        entry.scheduledAt
      ),
      payload: entry,
    };
  }

  private createContentRescheduledEvent(
    command: RescheduleContentCommand,
    rescheduledAt: Timestamp
  ): ContentRescheduledEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ContentRescheduled",
        command.calendarId,
        rescheduledAt
      ),
      payload: {
        contentId: command.contentId,
        platform,
        scheduledFor: command.scheduledFor,
        rescheduledAt,
      },
    };
  }

  private createScheduledContentPublishedEvent(
    command: MarkScheduledContentPublishedCommand,
    publishedAt: Timestamp
  ): ScheduledContentPublishedEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ScheduledContentPublished",
        command.calendarId,
        publishedAt
      ),
      payload: {
        contentId: command.contentId,
        platform,
        publishedAt,
      },
    };
  }

  private createScheduledContentCancelledEvent(
    command: CancelScheduledContentCommand,
    cancelledAt: Timestamp
  ): ScheduledContentCancelledEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ScheduledContentCancelled",
        command.calendarId,
        cancelledAt
      ),
      payload: {
        contentId: command.contentId,
        platform,
        cancelledAt,
      },
    };
  }

  private createContentCalendarArchivedEvent(
    command: ArchiveContentCalendarCommand,
    archivedAt: Timestamp
  ): ContentCalendarArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentCalendarArchived",
        command.calendarId,
        archivedAt
      ),
      payload: {
        calendarId: command.calendarId,
        archivedAt,
      },
    };
  }

  private createContentCalendarRestoredEvent(
    command: RestoreContentCalendarCommand,
    restoredAt: Timestamp
  ): ContentCalendarRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentCalendarRestored",
        command.calendarId,
        restoredAt
      ),
      payload: {
        calendarId: command.calendarId,
        restoredAt,
      },
    };
  }
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentCalendarApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentCalendarApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function businessMismatch(contentId: ContentId): ContentCalendarApplicationError {
  return {
    code: "ValidationFailed",
    message: `Content asset ${contentId} does not belong to the active business.`,
  };
}

function mapContentCalendarApplicationError(
  error: unknown
): ContentCalendarApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content calendar command failed validation.",
    cause: error,
  };
}
