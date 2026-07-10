import type {
  RevenueForecastReview,
  RevenueForecastReviewArchivedEvent,
  RevenueForecastReviewApprovedEvent,
  RevenueForecastReviewCreatedEvent,
  RevenueForecastReviewDomainEvent,
  RevenueForecastReviewId,
  RevenueForecastReviewRejectedEvent,
  RevenueForecastReviewRepository,
  RevenueForecastReviewStatus,
  RevenueForecastReviewSubmittedEvent,
  RevenueForecastSnapshot,
  RevenueTargetId,
} from "@nextshift/domain";
import { RevenueForecastReview as RevenueForecastReviewAggregate } from "@nextshift/domain";
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
type CreateReviewId = () => RevenueForecastReviewId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateReviewId: CreateReviewId = () =>
  crypto.randomUUID() as RevenueForecastReviewId;

export interface RevenueForecastReviewEventPublisher {
  publish(event: RevenueForecastReviewDomainEvent): Promise<void>;
}

export interface CreateRevenueForecastReviewCommand
  extends ApplicationCommand {
  readonly commandType: "CreateRevenueForecastReview";
  readonly reviewId?: RevenueForecastReviewId;
  readonly forecast: RevenueForecastSnapshot;
  readonly reviewNotes?: string;
  readonly causationId?: CausationId;
}

export interface SubmitRevenueForecastReviewCommand
  extends ApplicationCommand {
  readonly commandType: "SubmitRevenueForecastReview";
  readonly reviewId: RevenueForecastReviewId;
  readonly causationId?: CausationId;
}

export interface ApproveRevenueForecastReviewCommand
  extends ApplicationCommand {
  readonly commandType: "ApproveRevenueForecastReview";
  readonly reviewId: RevenueForecastReviewId;
  readonly reviewer: string;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface RejectRevenueForecastReviewCommand
  extends ApplicationCommand {
  readonly commandType: "RejectRevenueForecastReview";
  readonly reviewId: RevenueForecastReviewId;
  readonly reviewer: string;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface ArchiveRevenueForecastReviewCommand
  extends ApplicationCommand {
  readonly commandType: "ArchiveRevenueForecastReview";
  readonly reviewId: RevenueForecastReviewId;
  readonly causationId?: CausationId;
}

export interface GetRevenueForecastReviewQuery extends ApplicationQuery {
  readonly queryType: "GetRevenueForecastReview";
  readonly reviewId: RevenueForecastReviewId;
}

export interface ListRevenueForecastReviewsQuery extends ApplicationQuery {
  readonly queryType: "ListRevenueForecastReviews";
}

export interface ListRevenueForecastReviewsByStatusQuery
  extends ApplicationQuery {
  readonly queryType: "ListRevenueForecastReviewsByStatus";
  readonly status: RevenueForecastReviewStatus;
}

export interface ListRevenueForecastReviewsByTargetQuery
  extends ApplicationQuery {
  readonly queryType: "ListRevenueForecastReviewsByTarget";
  readonly revenueTargetId: RevenueTargetId;
}

export interface RevenueForecastReviewApplicationResult {
  readonly review: RevenueForecastReview;
}

export interface RevenueForecastReviewQueryResult {
  readonly review: RevenueForecastReview | null;
}

export interface RevenueForecastReviewListQueryResult {
  readonly reviews: readonly RevenueForecastReview[];
}

export interface RevenueForecastReviewApplicationError {
  readonly code:
    | "RevenueForecastReviewNotFound"
    | "ValidationFailed"
    | "RevenueForecastReviewPersistenceFailed"
    | "RevenueForecastReviewEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class RevenueForecastReviewApplicationService {
  constructor(
    private readonly reviewRepository: RevenueForecastReviewRepository,
    private readonly eventPublisher: RevenueForecastReviewEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createReviewId: CreateReviewId = defaultCreateReviewId
  ) {}

  async createRevenueForecastReview(
    command: CreateRevenueForecastReviewCommand
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    try {
      const createdAt = this.now();
      const review = RevenueForecastReviewAggregate.create({
        reviewId: command.reviewId ?? this.createReviewId(),
        businessId: command.context.businessId,
        forecast: command.forecast,
        reviewNotes: command.reviewNotes,
        createdAt,
      });

      await this.reviewRepository.save(review);
      await this.publish(
        this.createRevenueForecastReviewCreatedEvent(command, review, createdAt)
      );

      return success({ review });
    } catch (error) {
      return failure(mapRevenueForecastReviewApplicationError(error));
    }
  }

  async submitRevenueForecastReview(
    command: SubmitRevenueForecastReviewCommand
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const submittedAt = this.now();
      loaded.value.review.submit(submittedAt);

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createRevenueForecastReviewSubmittedEvent(command, submittedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapRevenueForecastReviewApplicationError(error));
    }
  }

  async approveRevenueForecastReview(
    command: ApproveRevenueForecastReviewCommand
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    return this.recordDecision(command, "approved");
  }

  async rejectRevenueForecastReview(
    command: RejectRevenueForecastReviewCommand
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    return this.recordDecision(command, "rejected");
  }

  async archiveRevenueForecastReview(
    command: ArchiveRevenueForecastReviewCommand
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.review.archive(archivedAt);

      await this.reviewRepository.save(loaded.value.review);
      await this.publish(
        this.createRevenueForecastReviewArchivedEvent(command, archivedAt)
      );

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapRevenueForecastReviewApplicationError(error));
    }
  }

  async getRevenueForecastReview(
    query: GetRevenueForecastReviewQuery
  ): Promise<RevenueForecastReviewQueryResult> {
    const review = await this.reviewRepository.findById(query.reviewId);

    if (!review || review.businessId !== query.context.businessId) {
      return { review: null };
    }

    return { review };
  }

  async listRevenueForecastReviews(
    query: ListRevenueForecastReviewsQuery
  ): Promise<RevenueForecastReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async listRevenueForecastReviewsByStatus(
    query: ListRevenueForecastReviewsByStatusQuery
  ): Promise<RevenueForecastReviewListQueryResult> {
    return {
      reviews: await this.reviewRepository.findByStatus(
        query.context.businessId,
        query.status
      ),
    };
  }

  async listRevenueForecastReviewsByTarget(
    query: ListRevenueForecastReviewsByTargetQuery
  ): Promise<RevenueForecastReviewListQueryResult> {
    const reviews = await this.reviewRepository.findByRevenueTargetId(
      query.revenueTargetId
    );

    return {
      reviews: Object.freeze(
        reviews.filter((review) => review.businessId === query.context.businessId)
      ),
    };
  }

  private async recordDecision(
    command:
      | ApproveRevenueForecastReviewCommand
      | RejectRevenueForecastReviewCommand,
    decision: "approved" | "rejected"
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    try {
      const loaded = await this.loadReview(command);
      if (!loaded.ok) return loaded;

      const decidedAt = this.now();
      const input = {
        reviewer: command.reviewer,
        reason: command.reason,
        decidedAt,
      };

      if (decision === "approved") {
        loaded.value.review.approve(input);
        await this.reviewRepository.save(loaded.value.review);
        await this.publish(
          this.createRevenueForecastReviewApprovedEvent(
            command as ApproveRevenueForecastReviewCommand,
            decidedAt
          )
        );
      } else {
        loaded.value.review.reject(input);
        await this.reviewRepository.save(loaded.value.review);
        await this.publish(
          this.createRevenueForecastReviewRejectedEvent(
            command as RejectRevenueForecastReviewCommand,
            decidedAt
          )
        );
      }

      return success({ review: loaded.value.review });
    } catch (error) {
      return failure(mapRevenueForecastReviewApplicationError(error));
    }
  }

  private async loadReview(
    command: ApplicationCommand & { readonly reviewId: RevenueForecastReviewId }
  ): Promise<
    Result<
      RevenueForecastReviewApplicationResult,
      RevenueForecastReviewApplicationError
    >
  > {
    const review = await this.reviewRepository.findById(command.reviewId);

    if (!review) {
      return failure(reviewNotFound(command.reviewId));
    }

    if (review.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Revenue forecast review ${command.reviewId} does not belong to the active business.`,
      });
    }

    return success({ review });
  }

  private async publish(event: RevenueForecastReviewDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends RevenueForecastReviewDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: RevenueForecastReviewId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "RevenueForecastReview" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createRevenueForecastReviewCreatedEvent(
    command: CreateRevenueForecastReviewCommand,
    review: RevenueForecastReview,
    createdAt: Timestamp
  ): RevenueForecastReviewCreatedEvent {
    const snapshot = review.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "RevenueForecastReviewCreated",
        snapshot.reviewId,
        createdAt
      ),
      payload: {
        reviewId: snapshot.reviewId,
        businessId: snapshot.businessId,
        revenueTargetId: snapshot.revenueTargetId,
        forecast: snapshot.forecast,
        reviewNotes: snapshot.reviewNotes,
        createdAt,
      },
    };
  }

  private createRevenueForecastReviewSubmittedEvent(
    command: SubmitRevenueForecastReviewCommand,
    submittedAt: Timestamp
  ): RevenueForecastReviewSubmittedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "RevenueForecastReviewSubmitted",
        command.reviewId,
        submittedAt
      ),
      payload: {
        reviewId: command.reviewId,
        submittedAt,
      },
    };
  }

  private createRevenueForecastReviewApprovedEvent(
    command: ApproveRevenueForecastReviewCommand,
    approvedAt: Timestamp
  ): RevenueForecastReviewApprovedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "RevenueForecastReviewApproved",
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

  private createRevenueForecastReviewRejectedEvent(
    command: RejectRevenueForecastReviewCommand,
    rejectedAt: Timestamp
  ): RevenueForecastReviewRejectedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "RevenueForecastReviewRejected",
        command.reviewId,
        rejectedAt
      ),
      payload: {
        reviewId: command.reviewId,
        reviewer: command.reviewer.trim(),
        reason: command.reason?.trim(),
        rejectedAt,
      },
    };
  }

  private createRevenueForecastReviewArchivedEvent(
    command: ArchiveRevenueForecastReviewCommand,
    archivedAt: Timestamp
  ): RevenueForecastReviewArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "RevenueForecastReviewArchived",
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
  reviewId: RevenueForecastReviewId
): RevenueForecastReviewApplicationError {
  return {
    code: "RevenueForecastReviewNotFound",
    message: `Revenue forecast review ${reviewId} was not found.`,
  };
}

function mapRevenueForecastReviewApplicationError(
  error: unknown
): RevenueForecastReviewApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Revenue forecast review command failed validation.",
    cause: error,
  };
}
