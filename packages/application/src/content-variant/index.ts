import type {
  ContentCalendarRepository,
  ContentId,
  ContentPlanRepository,
  ContentRepository,
  ContentVariantAddedEvent,
  ContentVariantApprovedEvent,
  ContentVariantArchivedEvent,
  ContentVariantDomainEvent,
  ContentVariantRepository,
  ContentVariantSetArchivedEvent,
  ContentVariantSetCreatedEvent,
  ContentVariantSetId,
  ContentVariantSetRestoredEvent,
  ContentVariantUpdatedEvent,
} from "@nextshift/domain";
import {
  ContentVariantSet,
  createContentPlatform,
} from "@nextshift/domain";
import type { ContentCalendarId, ContentPlanId } from "@nextshift/domain";
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
type CreateVariantSetId = () => ContentVariantSetId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateVariantSetId: CreateVariantSetId = () =>
  crypto.randomUUID() as ContentVariantSetId;

export interface ContentVariantEventPublisher {
  publish(event: ContentVariantDomainEvent): Promise<void>;
}

export interface CreateContentVariantSetCommand extends ApplicationCommand {
  readonly commandType: "CreateContentVariantSet";
  readonly variantSetId?: ContentVariantSetId;
  readonly planId: ContentPlanId;
  readonly contentId: ContentId;
  readonly causationId?: CausationId;
}

export interface AddContentVariantCommand extends ApplicationCommand {
  readonly commandType: "AddContentVariant";
  readonly variantSetId: ContentVariantSetId;
  readonly platform: string;
  readonly format: string;
  readonly hook: string;
  readonly body?: string;
  readonly cta: string;
  readonly ctaType: string;
  readonly causationId?: CausationId;
}

export interface UpdateContentVariantCommand extends ApplicationCommand {
  readonly commandType: "UpdateContentVariant";
  readonly variantSetId: ContentVariantSetId;
  readonly platform: string;
  readonly format?: string;
  readonly hook?: string;
  readonly body?: string;
  readonly cta?: string;
  readonly ctaType?: string;
  readonly causationId?: CausationId;
}

export interface ApproveContentVariantCommand extends ApplicationCommand {
  readonly commandType: "ApproveContentVariant";
  readonly variantSetId: ContentVariantSetId;
  readonly platform: string;
  readonly causationId?: CausationId;
}

export interface ArchiveContentVariantCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentVariant";
  readonly variantSetId: ContentVariantSetId;
  readonly platform: string;
  readonly causationId?: CausationId;
}

export interface ArchiveContentVariantSetCommand extends ApplicationCommand {
  readonly commandType: "ArchiveContentVariantSet";
  readonly variantSetId: ContentVariantSetId;
  readonly causationId?: CausationId;
}

export interface RestoreContentVariantSetCommand extends ApplicationCommand {
  readonly commandType: "RestoreContentVariantSet";
  readonly variantSetId: ContentVariantSetId;
  readonly causationId?: CausationId;
}

export interface GetContentVariantSetQuery extends ApplicationQuery {
  readonly queryType: "GetContentVariantSet";
  readonly variantSetId: ContentVariantSetId;
}

export interface ContentVariantApplicationResult {
  readonly variantSet: ContentVariantSet;
}

export interface ContentVariantQueryResult {
  readonly variantSet: ContentVariantSet | null;
}

export interface ContentVariantApplicationError {
  readonly code:
    | "ContentVariantSetNotFound"
    | "ContentPlanNotFound"
    | "ContentCalendarNotFound"
    | "ContentAssetNotFound"
    | "ValidationFailed"
    | "ContentVariantPersistenceFailed"
    | "ContentVariantEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class ContentVariantApplicationService {
  constructor(
    private readonly variantRepository: ContentVariantRepository,
    private readonly contentRepository: ContentRepository,
    private readonly planRepository: ContentPlanRepository,
    private readonly calendarRepository: ContentCalendarRepository,
    private readonly eventPublisher: ContentVariantEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createVariantSetId: CreateVariantSetId =
      defaultCreateVariantSetId
  ) {}

  async createContentVariantSet(
    command: CreateContentVariantSetCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const validation = await this.validatePlanContent(command);
      if (!validation.ok) return validation;

      const createdAt = this.now();
      const variantSet = ContentVariantSet.create({
        variantSetId: command.variantSetId ?? this.createVariantSetId(),
        businessId: command.context.businessId,
        planId: command.planId,
        contentId: command.contentId,
        createdAt,
      });

      await this.variantRepository.save(variantSet);
      await this.publish(
        this.createContentVariantSetCreatedEvent(command, variantSet, createdAt)
      );

      return success({ variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async addContentVariant(
    command: AddContentVariantCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const plan = await this.planRepository.findById(
        loaded.value.variantSet.planId
      );

      if (!plan) return failure(planNotFound(loaded.value.variantSet.planId));

      const entry = plan.getEntry(loaded.value.variantSet.contentId);
      const platform = createContentPlatform(command.platform);

      if (!entry || !entry.platforms.includes(platform)) {
        return failure({
          code: "ValidationFailed",
          message: `Platform ${platform} is not part of the planned content entry.`,
        });
      }

      const createdAt = this.now();
      loaded.value.variantSet.addVariant({
        platform,
        format: command.format,
        hook: command.hook,
        body: command.body,
        cta: command.cta,
        ctaType: command.ctaType,
        createdAt,
      });

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantAddedEvent(command, loaded.value.variantSet)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async updateContentVariant(
    command: UpdateContentVariantCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const updatedAt = this.now();
      const updatedFields = loaded.value.variantSet.updateVariant({
        platform: command.platform,
        format: command.format,
        hook: command.hook,
        body: command.body,
        cta: command.cta,
        ctaType: command.ctaType,
        updatedAt,
      });

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantUpdatedEvent(command, updatedFields, updatedAt)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async approveContentVariant(
    command: ApproveContentVariantCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const approvedAt = this.now();
      loaded.value.variantSet.approveVariant(command.platform, approvedAt);

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantApprovedEvent(command, approvedAt)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async archiveContentVariant(
    command: ArchiveContentVariantCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.variantSet.archiveVariant(command.platform, archivedAt);

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantArchivedEvent(command, archivedAt)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async archiveContentVariantSet(
    command: ArchiveContentVariantSetCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.variantSet.archive(archivedAt);

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantSetArchivedEvent(command, archivedAt)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async restoreContentVariantSet(
    command: RestoreContentVariantSetCommand
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    try {
      const loaded = await this.loadVariantSet(command);
      if (!loaded.ok) return loaded;

      const restoredAt = this.now();
      loaded.value.variantSet.restore(restoredAt);

      await this.variantRepository.save(loaded.value.variantSet);
      await this.publish(
        this.createContentVariantSetRestoredEvent(command, restoredAt)
      );

      return success({ variantSet: loaded.value.variantSet });
    } catch (error) {
      return failure(mapContentVariantApplicationError(error));
    }
  }

  async getContentVariantSet(
    query: GetContentVariantSetQuery
  ): Promise<ContentVariantQueryResult> {
    return {
      variantSet: await this.variantRepository.findById(query.variantSetId),
    };
  }

  private async validatePlanContent(
    command: CreateContentVariantSetCommand
  ): Promise<
    Result<{ readonly valid: true }, ContentVariantApplicationError>
  > {
    const plan = await this.planRepository.findById(command.planId);
    if (!plan) return failure(planNotFound(command.planId));

    if (plan.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content plan ${command.planId} does not belong to the active business.`,
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

    const content = await this.contentRepository.findById(command.contentId);
    if (!content) return failure(contentNotFound(command.contentId));

    if (content.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content asset ${command.contentId} does not belong to the active business.`,
      });
    }

    if (!plan.getEntry(command.contentId)) {
      return failure({
        code: "ValidationFailed",
        message: `Content asset ${command.contentId} is not part of content plan ${command.planId}.`,
      });
    }

    return success({ valid: true });
  }

  private async loadVariantSet(
    command: ApplicationCommand & {
      readonly variantSetId: ContentVariantSetId;
    }
  ): Promise<
    Result<ContentVariantApplicationResult, ContentVariantApplicationError>
  > {
    const variantSet = await this.variantRepository.findById(
      command.variantSetId
    );

    if (!variantSet) {
      return failure(variantSetNotFound(command.variantSetId));
    }

    if (variantSet.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Content variant set ${command.variantSetId} does not belong to the active business.`,
      });
    }

    return success({ variantSet });
  }

  private async publish(event: ContentVariantDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends ContentVariantDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: ContentVariantSetId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "ContentVariantSet" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createContentVariantSetCreatedEvent(
    command: CreateContentVariantSetCommand,
    variantSet: ContentVariantSet,
    createdAt: Timestamp
  ): ContentVariantSetCreatedEvent {
    const snapshot = variantSet.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantSetCreated",
        snapshot.variantSetId,
        createdAt
      ),
      payload: {
        variantSetId: snapshot.variantSetId,
        businessId: snapshot.businessId,
        planId: snapshot.planId,
        contentId: snapshot.contentId,
        createdAt,
      },
    };
  }

  private createContentVariantAddedEvent(
    command: AddContentVariantCommand,
    variantSet: ContentVariantSet
  ): ContentVariantAddedEvent {
    const variant = variantSet.getVariant(command.platform);

    if (!variant || variant.status !== "draft") {
      throw new Error("Content variant added event could not be created.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantAdded",
        command.variantSetId,
        variant.createdAt
      ),
      payload: variant,
    };
  }

  private createContentVariantUpdatedEvent(
    command: UpdateContentVariantCommand,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): ContentVariantUpdatedEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantUpdated",
        command.variantSetId,
        updatedAt
      ),
      payload: {
        platform,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createContentVariantApprovedEvent(
    command: ApproveContentVariantCommand,
    approvedAt: Timestamp
  ): ContentVariantApprovedEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantApproved",
        command.variantSetId,
        approvedAt
      ),
      payload: {
        platform,
        approvedAt,
      },
    };
  }

  private createContentVariantArchivedEvent(
    command: ArchiveContentVariantCommand,
    archivedAt: Timestamp
  ): ContentVariantArchivedEvent {
    const platform = createContentPlatform(command.platform);

    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantArchived",
        command.variantSetId,
        archivedAt
      ),
      payload: {
        platform,
        archivedAt,
      },
    };
  }

  private createContentVariantSetArchivedEvent(
    command: ArchiveContentVariantSetCommand,
    archivedAt: Timestamp
  ): ContentVariantSetArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantSetArchived",
        command.variantSetId,
        archivedAt
      ),
      payload: {
        variantSetId: command.variantSetId,
        archivedAt,
      },
    };
  }

  private createContentVariantSetRestoredEvent(
    command: RestoreContentVariantSetCommand,
    restoredAt: Timestamp
  ): ContentVariantSetRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "ContentVariantSetRestored",
        command.variantSetId,
        restoredAt
      ),
      payload: {
        variantSetId: command.variantSetId,
        restoredAt,
      },
    };
  }
}

function variantSetNotFound(
  variantSetId: ContentVariantSetId
): ContentVariantApplicationError {
  return {
    code: "ContentVariantSetNotFound",
    message: `Content variant set ${variantSetId} was not found.`,
  };
}

function planNotFound(planId: ContentPlanId): ContentVariantApplicationError {
  return {
    code: "ContentPlanNotFound",
    message: `Content plan ${planId} was not found.`,
  };
}

function calendarNotFound(
  calendarId: ContentCalendarId
): ContentVariantApplicationError {
  return {
    code: "ContentCalendarNotFound",
    message: `Content calendar ${calendarId} was not found.`,
  };
}

function contentNotFound(contentId: ContentId): ContentVariantApplicationError {
  return {
    code: "ContentAssetNotFound",
    message: `Content asset ${contentId} was not found.`,
  };
}

function mapContentVariantApplicationError(
  error: unknown
): ContentVariantApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Content variant command failed validation.",
    cause: error,
  };
}
