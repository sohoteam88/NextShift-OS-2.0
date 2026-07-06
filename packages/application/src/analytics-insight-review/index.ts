import type {
  AnalyticsInsightReview,
  AnalyticsInsightReviewArchivedEvent,
  AnalyticsInsightReviewApprovedEvent,
  AnalyticsInsightReviewCategory,
  AnalyticsInsightReviewCreatedEvent,
  AnalyticsInsightReviewDismissedEvent,
  AnalyticsInsightReviewDomainEvent,
  AnalyticsInsightReviewId,
  AnalyticsInsightReviewPriority,
  AnalyticsInsightReviewRepository,
  AnalyticsInsightReviewSourceSnapshot,
  AnalyticsInsightReviewStatus,
  AnalyticsInsightReviewSubmittedEvent,
} from "@nextshift/domain";
import { AnalyticsInsightReview as AnalyticsInsightReviewAggregate } from "@nextshift/domain";
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
type CreateReviewId = () => AnalyticsInsightReviewId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateReviewId: CreateReviewId = () =>
  crypto.randomUUID() as AnalyticsInsightReviewId;

export interface AnalyticsInsightReviewEventPublisher {
  publish(event: AnalyticsInsightReviewDomainEvent): Promise<void>;
}

export interface CreateAnalyticsInsightReviewCommand extends ApplicationCommand {
  readonly commandType: "CreateAnalyticsInsightReview";
  readonly reviewId?: AnalyticsInsightReviewId;
  readonly title: string;
  readonly summary: string;
  readonly category: AnalyticsInsightReviewCategory;
  readonly priority: AnalyticsInsightReviewPriority;
  readonly sources: readonly AnalyticsInsightReviewSourceSnapshot[];
  readonly causationId?: CausationId;
}

export interface SubmitAnalyticsInsightReviewCommand extends ApplicationCommand {
  readonly commandType: "SubmitAnalyticsInsightReview";
  readonly reviewId: AnalyticsInsightReviewId;
  readonly causationId?: CausationId;
}

export interface ApproveAnalyticsInsightReviewCommand extends ApplicationCommand {
  readonly commandType: "ApproveAnalyticsInsightReview";
  readonly reviewId: AnalyticsInsightReviewId;
  readonly reviewer: string;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface DismissAnalyticsInsightReviewCommand extends ApplicationCommand {
  readonly commandType: "DismissAnalyticsInsightReview";
  readonly reviewId: AnalyticsInsightReviewId;
  readonly reviewer: string;
  readonly reason: string;
  readonly causationId?: CausationId;
}

export interface ArchiveAnalyticsInsightReviewCommand extends ApplicationCommand {
  readonly commandType: "ArchiveAnalyticsInsightReview";
  readonly reviewId: AnalyticsInsightReviewId;
  readonly causationId?: CausationId;
}

export interface GetAnalyticsInsightReviewQuery extends ApplicationQuery {
  readonly queryType: "GetAnalyticsInsightReview";
  readonly reviewId: AnalyticsInsightReviewId;
}

export interface ListAnalyticsInsightReviewsQuery extends ApplicationQuery {
  readonly queryType: "ListAnalyticsInsightReviews";
}

export interface ListAnalyticsInsightReviewsByStatusQuery
  extends ApplicationQuery {
  readonly queryType: "ListAnalyticsInsightReviewsByStatus";
  readonly status: AnalyticsInsightReviewStatus;
}

export interface ListAnalyticsInsightReviewsByPriorityQuery
  extends ApplicationQuery {
  readonly queryType: "ListAnalyticsInsightReviewsByPriority";
  readonly priority: AnalyticsInsightReviewPriority;
}

export interface ListAnalyticsInsightReviewsByCategoryQuery
  extends ApplicationQuery {
  readonly queryType: "ListAnalyticsInsightReviewsByCategory";
  readonly category: AnalyticsInsightReviewCategory;
}

export interface AnalyticsInsightReviewApplicationResult {
  readonly review: AnalyticsInsightReview;
}

export interface AnalyticsInsightReviewQueryResult {
  readonly review: AnalyticsInsightReview | null;
}

export interface AnalyticsInsightReviewListQueryResult {
  readonly reviews: readonly AnalyticsInsightReview[];
}

export interface AnalyticsInsightReviewApplicationError {
  readonly code:
    | "AnalyticsInsightReviewNotFound"
    | "ValidationFailed"
    | "AnalyticsInsightReviewPersistenceFailed"
    | "AnalyticsInsightReviewEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class AnalyticsInsightReviewApplicationService {
  constructor(
    private readonly reviewRepository: AnalyticsInsightReviewRepository,
    private readonly eventPublisher: AnalyticsInsightReviewEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createReviewId: CreateReviewId = defaultCreateReviewId
  ) {}

  async createAnalyticsInsightReview(
    command: CreateAnalyticsInsightReviewCommand
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    try {
      const createdAt = this.now();
      const review = AnalyticsInsightReviewAggregate.create({
        reviewId: command.reviewId ?? this.createReviewId(),
        businessId: command.context.businessId,
        title: command.title,
        summary: command.summary,
        category: command.category,
        priority: command.priority,
        sources: command.sources,
        createdAt,
      });

      await this.reviewRepository.save(review);
      await this.publish(
        this.createAnalyticsInsightReviewCreatedEvent(command, review, createdAt)
      );

      return success({ review });
    } catch (error) {
      return failure(mapAnalyticsInsightReviewApplicationError(error));
    }
  }

  async submitAnalyticsInsightReview(
    command: SubmitAnalyticsInsightReviewCommand
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const submittedAt = this.now();
      loaded.value.review.submit(submittedAt);

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createAnalyticsInsightReviewSubmittedEvent(command, submittedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapAnalyticsInsightReviewApplicationError(error));
    }
  }

  async approveAnalyticsInsightReview(
    command: ApproveAnalyticsInsightReviewCommand
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const approvedAt = this.now();
      loaded.value.review.approve({
        reviewer: command.reviewer,
        reason: command.reason,
        approvedAt,
      });

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createAnalyticsInsightReviewApprovedEvent(command, approvedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapAnalyticsInsightReviewApplicationError(error));
    }
  }

  async dismissAnalyticsInsightReview(
    command: DismissAnalyticsInsightReviewCommand
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const dismissedAt = this.now();
      loaded.value.review.dismiss({
        reviewer: command.reviewer,
        reason: command.reason,
        dismissedAt,
      });

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createAnalyticsInsightReviewDismissedEvent(command, dismissedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapAnalyticsInsightReviewApplicationError(error));
    }
  }

  async archiveAnalyticsInsightReview(
    command: ArchiveAnalyticsInsightReviewCommand
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.review.archive(archivedAt);

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createAnalyticsInsightReviewArchivedEvent(command, archivedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapAnalyticsInsightReviewApplicationError(error));
    }
  }

  async getAnalyticsInsightReview(
    query: GetAnalyticsInsightReviewQuery
  ): Promise<AnalyticsInsightReviewQueryResult> {
    const review = await this.reviewRepository.findById(query.reviewId);

    if (!review || review.businessId !== query.context.businessId) {
      return { review: null };
    }

    return { review };
  }

  async listAnalyticsInsightReviews(
    query: ListAnalyticsInsightReviewsQuery
  ): Promise<AnalyticsInsightReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async listAnalyticsInsightReviewsByStatus(
    query: ListAnalyticsInsightReviewsByStatusQuery
  ): Promise<AnalyticsInsightReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByStatus(
        query.context.businessId,
        query.status
      ),
    };
  }

  async listAnalyticsInsightReviewsByPriority(
    query: ListAnalyticsInsightReviewsByPriorityQuery
  ): Promise<AnalyticsInsightReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByPriority(
        query.context.businessId,
        query.priority
      ),
    };
  }

  async listAnalyticsInsightReviewsByCategory(
    query: ListAnalyticsInsightReviewsByCategoryQuery
  ): Promise<AnalyticsInsightReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByCategory(
        query.context.businessId,
        query.category
      ),
    };
  }

  private async loadReview(
    command: ApplicationCommand & { readonly reviewId: AnalyticsInsightReviewId }
  ): Promise<
    Result<
      AnalyticsInsightReviewApplicationResult,
      AnalyticsInsightReviewApplicationError
    >
  > {
    const review = await this.reviewRepository.findById(command.reviewId);

    if (!review) {
      return failure(reviewNotFound(command.reviewId));
    }

    if (review.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Analytics insight review ${command.reviewId} does not belong to the active business.`,
      });
    }

    return success({ review });
  }

  private async publish(event: AnalyticsInsightReviewDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends AnalyticsInsightReviewDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: AnalyticsInsightReviewId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "AnalyticsInsightReview" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createAnalyticsInsightReviewCreatedEvent(
    command: CreateAnalyticsInsightReviewCommand,
    review: AnalyticsInsightReview,
    createdAt: Timestamp
  ): AnalyticsInsightReviewCreatedEvent {
    const snapshot = review.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "AnalyticsInsightReviewCreated",
        snapshot.reviewId,
        createdAt
      ),
      payload: {
        reviewId: snapshot.reviewId,
        businessId: snapshot.businessId,
        title: snapshot.title,
        summary: snapshot.summary,
        category: snapshot.category,
        priority: snapshot.priority,
        sources: snapshot.sources,
        createdAt,
      },
    };
  }

  private createAnalyticsInsightReviewSubmittedEvent(
    command: SubmitAnalyticsInsightReviewCommand,
    submittedAt: Timestamp
  ): AnalyticsInsightReviewSubmittedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "AnalyticsInsightReviewSubmitted",
        command.reviewId,
        submittedAt
      ),
      payload: {
        reviewId: command.reviewId,
        submittedAt,
      },
    };
  }

  private createAnalyticsInsightReviewApprovedEvent(
    command: ApproveAnalyticsInsightReviewCommand,
    approvedAt: Timestamp
  ): AnalyticsInsightReviewApprovedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "AnalyticsInsightReviewApproved",
        command.reviewId,
        approvedAt
      ),
      payload: {
        reviewId: command.reviewId,
        reviewer: command.reviewer.trim(),
        reason: command.reason?.trim(),
        approvedAt,
      },
    };
  }

  private createAnalyticsInsightReviewDismissedEvent(
    command: DismissAnalyticsInsightReviewCommand,
    dismissedAt: Timestamp
  ): AnalyticsInsightReviewDismissedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "AnalyticsInsightReviewDismissed",
        command.reviewId,
        dismissedAt
      ),
      payload: {
        reviewId: command.reviewId,
        reviewer: command.reviewer.trim(),
        reason: command.reason.trim(),
        dismissedAt,
      },
    };
  }

  private createAnalyticsInsightReviewArchivedEvent(
    command: ArchiveAnalyticsInsightReviewCommand,
    archivedAt: Timestamp
  ): AnalyticsInsightReviewArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "AnalyticsInsightReviewArchived",
        command.reviewId,
        archivedAt
      ),
      payload: {
        reviewId: command.reviewId,
        archivedAt,
      },
    };
  }
}

function reviewNotFound(
  reviewId: AnalyticsInsightReviewId
): AnalyticsInsightReviewApplicationError {
  return {
    code: "AnalyticsInsightReviewNotFound",
    message: `Analytics insight review ${reviewId} was not found.`,
  };
}

function mapAnalyticsInsightReviewApplicationError(
  error: unknown
): AnalyticsInsightReviewApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Analytics insight review command failed validation.",
    cause: error,
  };
}
