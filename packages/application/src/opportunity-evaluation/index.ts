import type {
  OpportunityAcceptedEvent,
  OpportunityEvaluatedEvent,
  OpportunityEvaluation,
  OpportunityEvaluationArchivedEvent,
  OpportunityEvaluationCreatedEvent,
  OpportunityEvaluationDomainEvent,
  OpportunityEvaluationId,
  OpportunityEvaluationRepository,
  OpportunityEvaluationStatus,
  OpportunityEvaluationPriority,
  OpportunityRejectedEvent,
  OpportunitySourceSnapshot,
} from "@nextshift/domain";
import { OpportunityEvaluation as OpportunityEvaluationAggregate } from "@nextshift/domain";
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
type CreateEvaluationId = () => OpportunityEvaluationId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateEvaluationId: CreateEvaluationId = () =>
  crypto.randomUUID() as OpportunityEvaluationId;

export interface OpportunityEvaluationEventPublisher {
  publish(event: OpportunityEvaluationDomainEvent): Promise<void>;
}

export interface CreateOpportunityEvaluationCommand extends ApplicationCommand {
  readonly commandType: "CreateOpportunityEvaluation";
  readonly evaluationId?: OpportunityEvaluationId;
  readonly title: string;
  readonly summary: string;
  readonly source: OpportunitySourceSnapshot;
  readonly causationId?: CausationId;
}

export interface EvaluateOpportunityCommand extends ApplicationCommand {
  readonly commandType: "EvaluateOpportunity";
  readonly evaluationId: OpportunityEvaluationId;
  readonly marketFit: number;
  readonly businessValue: number;
  readonly urgency: number;
  readonly effort: number;
  readonly confidence: number;
  readonly causationId?: CausationId;
}

export interface AcceptOpportunityCommand extends ApplicationCommand {
  readonly commandType: "AcceptOpportunity";
  readonly evaluationId: OpportunityEvaluationId;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface RejectOpportunityCommand extends ApplicationCommand {
  readonly commandType: "RejectOpportunity";
  readonly evaluationId: OpportunityEvaluationId;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface ArchiveOpportunityEvaluationCommand
  extends ApplicationCommand {
  readonly commandType: "ArchiveOpportunityEvaluation";
  readonly evaluationId: OpportunityEvaluationId;
  readonly causationId?: CausationId;
}

export interface GetOpportunityEvaluationQuery extends ApplicationQuery {
  readonly queryType: "GetOpportunityEvaluation";
  readonly evaluationId: OpportunityEvaluationId;
}

export interface ListOpportunityEvaluationsQuery extends ApplicationQuery {
  readonly queryType: "ListOpportunityEvaluations";
}

export interface ListOpportunityEvaluationsByStatusQuery
  extends ApplicationQuery {
  readonly queryType: "ListOpportunityEvaluationsByStatus";
  readonly status: OpportunityEvaluationStatus;
}

export interface ListOpportunityEvaluationsByPriorityQuery
  extends ApplicationQuery {
  readonly queryType: "ListOpportunityEvaluationsByPriority";
  readonly priority: OpportunityEvaluationPriority;
}

export interface OpportunityEvaluationApplicationResult {
  readonly evaluation: OpportunityEvaluation;
}

export interface OpportunityEvaluationQueryResult {
  readonly evaluation: OpportunityEvaluation | null;
}

export interface OpportunityEvaluationListQueryResult {
  readonly evaluations: readonly OpportunityEvaluation[];
}

export interface OpportunityEvaluationApplicationError {
  readonly code:
    | "OpportunityEvaluationNotFound"
    | "ValidationFailed"
    | "OpportunityEvaluationPersistenceFailed"
    | "OpportunityEvaluationEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class OpportunityEvaluationApplicationService {
  constructor(
    private readonly evaluationRepository: OpportunityEvaluationRepository,
    private readonly eventPublisher: OpportunityEvaluationEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createEvaluationId: CreateEvaluationId =
      defaultCreateEvaluationId
  ) {}

  async createOpportunityEvaluation(
    command: CreateOpportunityEvaluationCommand
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    try {
      const createdAt = this.now();
      const evaluation = OpportunityEvaluationAggregate.create({
        evaluationId: command.evaluationId ?? this.createEvaluationId(),
        businessId: command.context.businessId,
        title: command.title,
        summary: command.summary,
        source: command.source,
        createdAt,
      });

      await this.evaluationRepository.save(evaluation);
      await this.publish(
        this.createOpportunityEvaluationCreatedEvent(
          command,
          evaluation,
          createdAt
        )
      );

      return success({ evaluation });
    } catch (error) {
      return failure(mapOpportunityEvaluationApplicationError(error));
    }
  }

  async evaluateOpportunity(
    command: EvaluateOpportunityCommand
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    try {
      const loaded = await this.loadEvaluation(command);
      if (!loaded.ok) return loaded;

      const evaluatedAt = this.now();
      loaded.value.evaluation.evaluate({
        marketFit: command.marketFit,
        businessValue: command.businessValue,
        urgency: command.urgency,
        effort: command.effort,
        confidence: command.confidence,
        evaluatedAt,
      });

      await this.evaluationRepository.save(loaded.value.evaluation);
      await this.publish(
        this.createOpportunityEvaluatedEvent(
          command,
          loaded.value.evaluation,
          evaluatedAt
        )
      );

      return success({ evaluation: loaded.value.evaluation });
    } catch (error) {
      return failure(mapOpportunityEvaluationApplicationError(error));
    }
  }

  async acceptOpportunity(
    command: AcceptOpportunityCommand
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    return this.recordDecision(command, "accepted");
  }

  async rejectOpportunity(
    command: RejectOpportunityCommand
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    return this.recordDecision(command, "rejected");
  }

  async archiveOpportunityEvaluation(
    command: ArchiveOpportunityEvaluationCommand
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    try {
      const loaded = await this.loadEvaluation(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.evaluation.archive(archivedAt);

      await this.evaluationRepository.save(loaded.value.evaluation);
      await this.publish(
        this.createOpportunityEvaluationArchivedEvent(command, archivedAt)
      );

      return success({ evaluation: loaded.value.evaluation });
    } catch (error) {
      return failure(mapOpportunityEvaluationApplicationError(error));
    }
  }

  async getOpportunityEvaluation(
    query: GetOpportunityEvaluationQuery
  ): Promise<OpportunityEvaluationQueryResult> {
    return {
      evaluation: await this.evaluationRepository.findById(query.evaluationId),
    };
  }

  async listOpportunityEvaluations(
    query: ListOpportunityEvaluationsQuery
  ): Promise<OpportunityEvaluationListQueryResult> {
    return {
      evaluations: await this.evaluationRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async listOpportunityEvaluationsByStatus(
    query: ListOpportunityEvaluationsByStatusQuery
  ): Promise<OpportunityEvaluationListQueryResult> {
    return {
      evaluations: await this.evaluationRepository.findByStatus(
        query.context.businessId,
        query.status
      ),
    };
  }

  async listOpportunityEvaluationsByPriority(
    query: ListOpportunityEvaluationsByPriorityQuery
  ): Promise<OpportunityEvaluationListQueryResult> {
    return {
      evaluations: await this.evaluationRepository.findByPriority(
        query.context.businessId,
        query.priority
      ),
    };
  }

  private async recordDecision(
    command: AcceptOpportunityCommand | RejectOpportunityCommand,
    decision: "accepted" | "rejected"
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    try {
      const loaded = await this.loadEvaluation(command);
      if (!loaded.ok) return loaded;

      const decidedAt = this.now();
      const input = {
        reason: command.reason,
        decidedAt,
      };

      if (decision === "accepted") {
        loaded.value.evaluation.accept(input);
      } else {
        loaded.value.evaluation.reject(input);
      }

      await this.evaluationRepository.save(loaded.value.evaluation);

      if (decision === "accepted") {
        await this.publish(
          this.createOpportunityAcceptedEvent(
            command as AcceptOpportunityCommand,
            decidedAt
          )
        );
      } else {
        await this.publish(
          this.createOpportunityRejectedEvent(
            command as RejectOpportunityCommand,
            decidedAt
          )
        );
      }

      return success({ evaluation: loaded.value.evaluation });
    } catch (error) {
      return failure(mapOpportunityEvaluationApplicationError(error));
    }
  }

  private async loadEvaluation(
    command: ApplicationCommand & {
      readonly evaluationId: OpportunityEvaluationId;
    }
  ): Promise<
    Result<
      OpportunityEvaluationApplicationResult,
      OpportunityEvaluationApplicationError
    >
  > {
    const evaluation = await this.evaluationRepository.findById(
      command.evaluationId
    );

    if (!evaluation) {
      return failure(evaluationNotFound(command.evaluationId));
    }

    if (evaluation.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Opportunity evaluation ${command.evaluationId} does not belong to the active business.`,
      });
    }

    return success({ evaluation });
  }

  private async publish(event: OpportunityEvaluationDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends OpportunityEvaluationDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: OpportunityEvaluationId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "OpportunityEvaluation" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createOpportunityEvaluationCreatedEvent(
    command: CreateOpportunityEvaluationCommand,
    evaluation: OpportunityEvaluation,
    createdAt: Timestamp
  ): OpportunityEvaluationCreatedEvent {
    const snapshot = evaluation.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "OpportunityEvaluationCreated",
        snapshot.evaluationId,
        createdAt
      ),
      payload: {
        evaluationId: snapshot.evaluationId,
        businessId: snapshot.businessId,
        title: snapshot.title,
        summary: snapshot.summary,
        source: snapshot.source,
        createdAt,
      },
    };
  }

  private createOpportunityEvaluatedEvent(
    command: EvaluateOpportunityCommand,
    evaluation: OpportunityEvaluation,
    evaluatedAt: Timestamp
  ): OpportunityEvaluatedEvent {
    const snapshot = evaluation.toSnapshot();

    if (!snapshot.score) {
      throw new Error("Opportunity evaluated event requires a score.");
    }

    return {
      ...this.createBaseEvent(
        command,
        "OpportunityEvaluated",
        command.evaluationId,
        evaluatedAt
      ),
      payload: {
        evaluationId: command.evaluationId,
        score: snapshot.score,
        evaluatedAt,
      },
    };
  }

  private createOpportunityAcceptedEvent(
    command: AcceptOpportunityCommand,
    acceptedAt: Timestamp
  ): OpportunityAcceptedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "OpportunityAccepted",
        command.evaluationId,
        acceptedAt
      ),
      payload: {
        evaluationId: command.evaluationId,
        reason: command.reason,
        acceptedAt,
      },
    };
  }

  private createOpportunityRejectedEvent(
    command: RejectOpportunityCommand,
    rejectedAt: Timestamp
  ): OpportunityRejectedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "OpportunityRejected",
        command.evaluationId,
        rejectedAt
      ),
      payload: {
        evaluationId: command.evaluationId,
        reason: command.reason,
        rejectedAt,
      },
    };
  }

  private createOpportunityEvaluationArchivedEvent(
    command: ArchiveOpportunityEvaluationCommand,
    archivedAt: Timestamp
  ): OpportunityEvaluationArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "OpportunityEvaluationArchived",
        command.evaluationId,
        archivedAt
      ),
      payload: {
        evaluationId: command.evaluationId,
        archivedAt,
      },
    };
  }
}

function evaluationNotFound(
  evaluationId: OpportunityEvaluationId
): OpportunityEvaluationApplicationError {
  return {
    code: "OpportunityEvaluationNotFound",
    message: `Opportunity evaluation ${evaluationId} was not found.`,
  };
}

function mapOpportunityEvaluationApplicationError(
  error: unknown
): OpportunityEvaluationApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Opportunity evaluation command failed validation.",
    cause: error,
  };
}
