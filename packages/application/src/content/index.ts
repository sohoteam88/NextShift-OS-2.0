import type {
  ContentAssetArchivedEvent,
  ContentAssetCreatedEvent,
  ContentAssetPublishedEvent,
  ContentAssetRestoredEvent,
  ContentAssetUpdatedEvent,
  ContentDomainEvent,
  ContentId,
  ContentRepository,
} from "@nextshift/domain";
import { ContentAsset } from "@nextshift/domain";
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
type CreateContentId = () => ContentId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateContentId: CreateContentId = () =>
  crypto.randomUUID() as ContentId;

export interface ContentEventPublisher {
  publish(event: ContentDomainEvent): Promise<void>;
}

export interface CreateContentAssetCommand extends ApplicationCommand {
  readonly commandType: "CreateContentAsset";
  readonly contentId?: ContentId;
  readonly type: string;
  readonly category?: string;
  readonly title: string;
  readonly body?: string;
  readonly tags?: readonly string[];
  readonly causationId?: CausationId;
}

export interface UpdateContentAssetCommand extends ApplicationCommand {
  readonly commandType: "UpdateContentAsset";
  readonly contentId: ContentId;
  readonly type?: string;
  readonly category?: string;
  readonly title?: string;
  readonly body?: string;
  readonly tags?: readonly string[];
  readonly causationId?: CausationId;
}

export interface PublishContentAssetCommand extends ApplicationCommand {
  readonly commandType: "PublishContentAsset";
  readonly contentId: ContentId;
  readonly causationId?: CausationId;
}

export interface ArchiveContentAssetCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentAsset";
  readonly contentId: ContentId;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface RestoreContentAssetCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentAsset";
  readonly contentId: ContentId;
  readonly causationId?: CausationId;
}

export interface GetContentAssetQuery extends ApplicationQuery {
  readonly queryType: "GetContentAsset";
  readonly contentId: ContentId;
}

export interface ContentAssetApplicationResult {
  readonly content: ContentAsset;
}

export interface ContentAssetQueryResult {
  readonly content: ContentAsset | null;
}

export interface ContentApplicationError {
  readonly code:
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentPersistenceFailed"
    | "ContentEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentApplicationService {
  constructor(
    private readonly repository: ContentRepository,
    private readonly eventPublisher: ContentEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createContentId: CreateContentId = defaultCreateContentId
  ) {}

  async createContentAsset(
    command: CreateContentAssetCommand
  ): Promise<Result<ContentAssetApplicationResult, ContentApplicationError>> {
    try {
      const createdAt = this.now();
      const content = ContentAsset.create({
        contentId: command.contentId ?? this.createContentId(),
        businessId: command.context.businessId,
        type: command.type,
        category: command.category,
        title: command.title,
        body: command.body,
        tags: command.tags,
        createdAt,
      });

      await this.repository.save(content);
      await this.publish(
        this.createContentAssetCreatedEvent(command, content, createdAt)
      );

      return success({ content });
    } catch (error) {
      return failure(mapContentApplicationError(error));
    }
  }

  async updateContentAsset(
    command: UpdateContentAssetCommand
  ): Promise<Result<ContentAssetApplicationResult, ContentApplicationError>> {
    try {
      const content = await this.repository.findById(command.contentId);

      if (!content) {
        return failure(notFound(command.contentId));
      }

      const updatedAt = this.now();
      const updatedFields = collectUpdatedFields(command);

      content.update({
        type: command.type,
        category: command.category,
        title: command.title,
        body: command.body,
        tags: command.tags,
        updatedAt,
      });

      await this.repository.save(content);
      await this.publish(
        this.createContentAssetUpdatedEvent(command, updatedFields, updatedAt)
      );

      return success({ content });
    } catch (error) {
      return failure(mapContentApplicationError(error));
    }
  }

  async publishContentAsset(
    command: PublishContentAssetCommand
  ): Promise<Result<ContentAssetApplicationResult, ContentApplicationError>> {
    try {
      const content = await this.repository.findById(command.contentId);

      if (!content) {
        return failure(notFound(command.contentId));
      }

      const publishedAt = this.now();
      content.publish(publishedAt);
      await this.repository.save(content);
      await this.publish(this.createContentAssetPublishedEvent(command, publishedAt));

      return success({ content });
    } catch (error) {
      return failure(mapContentApplicationError(error));
    }
  }

  async archiveContentAsset(
    command: ArchiveContentAssetCommand
  ): Promise<Result<ContentAssetApplicationResult, ContentApplicationError>> {
    try {
      const content = await this.repository.findById(command.contentId);

      if (!content) {
        return failure(notFound(command.contentId));
      }

      const archivedAt = this.now();
      content.archive(archivedAt);
      await this.repository.save(content);
      await this.publish(this.createContentAssetArchivedEvent(command, archivedAt));

      return success({ content });
    } catch (error) {
      return failure(mapContentApplicationError(error));
    }
  }

  async restoreContentAsset(
    command: RestoreContentAssetCommand
  ): Promise<Result<ContentAssetApplicationResult, ContentApplicationError>> {
    try {
      const content = await this.repository.findById(command.contentId);

      if (!content) {
        return failure(notFound(command.contentId));
      }

      const restoredAt = this.now();
      content.restore(restoredAt);
      await this.repository.save(content);
      await this.publish(this.createContentAssetRestoredEvent(command, restoredAt));

      return success({ content });
    } catch (error) {
      return failure(mapContentApplicationError(error));
    }
  }

  async getContentAsset(
    query: GetContentAssetQuery
  ): Promise<ContentAssetQueryResult> {
    return { content: await this.repository.findById(query.contentId) };
  }

  private async publish(event: ContentDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends ContentDomainEvent["eventType"]>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentAsset" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentAssetCreatedEvent(
    command: CreateContentAssetCommand,
    content: ContentAsset,
    createdAt: Timestamp
  ): ContentAssetCreatedEvent {
    const snapshot = content.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentAssetCreated",
        snapshot.contentId,
        createdAt
      ),
      payload: {
        contentId: snapshot.contentId,
        businessId: snapshot.businessId,
        type: snapshot.type,
        category: snapshot.category,
        title: snapshot.title,
        status: snapshot.status,
        createdAt,
      },
    };
  }

  private createContentAssetUpdatedEvent(
    command: UpdateContentAssetCommand,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): ContentAssetUpdatedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentAssetUpdated",
        command.contentId,
        updatedAt
      ),
      payload: {
        contentId: command.contentId,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createContentAssetPublishedEvent(
    command: PublishContentAssetCommand,
    publishedAt: Timestamp
  ): ContentAssetPublishedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentAssetPublished",
        command.contentId,
        publishedAt
      ),
      payload: {
        contentId: command.contentId,
        publishedAt,
      },
    };
  }

  private createContentAssetArchivedEvent(
    command: ArchiveContentAssetCommand,
    archivedAt: Timestamp
  ): ContentAssetArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentAssetArchived",
        command.contentId,
        archivedAt
      ),
      payload: {
        contentId: command.contentId,
        archivedAt,
        reason: command.reason,
      },
    };
  }

  private createContentAssetRestoredEvent(
    command: RestoreContentAssetCommand,
    restoredAt: Timestamp
  ): ContentAssetRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentAssetRestored",
        command.contentId,
        restoredAt
      ),
      payload: {
        contentId: command.contentId,
        restoredAt,
      },
    };
  }
}

function collectUpdatedFields(
  command: UpdateContentAssetCommand
): readonly string[] {
  const fields: string[] = [];

  if (command.type !== undefined) fields.push("type");
  if (command.category !== undefined) fields.push("category");
  if (command.title !== undefined) fields.push("title");
  if (command.body !== undefined) fields.push("body");
  if (command.tags !== undefined) fields.push("tags");

  return fields;
}

function notFound(contentId: ContentId): ContentApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function mapContentApplicationError(error: unknown): ContentApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content command failed validation.",
    cause: error,
  };
}
