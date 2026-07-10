import { CampaignExecutionWorkflow } from "@nextshift/domain";
import type { ContentPlanId, OpportunityEvaluationId } from "@nextshift/domain";
import type {
  CausationId,
  EventId,
  Result,
  Timestamp,
} from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";

type CampaignExecution =
  CampaignExecutionWorkflow.CampaignExecution;
type CampaignExecutionDomainEvent =
  CampaignExecutionWorkflow.CampaignExecutionDomainEvent;
type CampaignExecutionId =
  CampaignExecutionWorkflow.CampaignExecutionId;
type CampaignExecutionPriority =
  CampaignExecutionWorkflow.CampaignExecutionPriority;
type CampaignExecutionRepository =
  CampaignExecutionWorkflow.CampaignExecutionRepository;
type CampaignExecutionStatus =
  CampaignExecutionWorkflow.CampaignExecutionStatus;
type CampaignExecutionCreatedEvent =
  CampaignExecutionWorkflow.CampaignExecutionCreatedEvent;
type CampaignExecutionPreparedEvent =
  CampaignExecutionWorkflow.CampaignExecutionPreparedEvent;
type CampaignExecutionLaunchedEvent =
  CampaignExecutionWorkflow.CampaignExecutionLaunchedEvent;
type CampaignExecutionCompletedEvent =
  CampaignExecutionWorkflow.CampaignExecutionCompletedEvent;
type CampaignExecutionCancelledEvent =
  CampaignExecutionWorkflow.CampaignExecutionCancelledEvent;
type CampaignExecutionArchivedEvent =
  CampaignExecutionWorkflow.CampaignExecutionArchivedEvent;

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateExecutionId = () => CampaignExecutionId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateExecutionId: CreateExecutionId = () =>
  crypto.randomUUID() as CampaignExecutionId;

export interface CampaignExecutionEventPublisher {
  publish(event: CampaignExecutionDomainEvent): Promise<void>;
}

export interface CreateCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "CreateCampaignExecution";
  readonly executionId?: CampaignExecutionId;
  readonly title: string;
  readonly objective: string;
  readonly channels: readonly string[];
  readonly priority: CampaignExecutionPriority;
  readonly sourceOpportunityId?: OpportunityEvaluationId;
  readonly sourceContentPlanId?: ContentPlanId;
  readonly causationId?: CausationId;
}

export interface PrepareCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "PrepareCampaignExecution";
  readonly executionId: CampaignExecutionId;
  readonly causationId?: CausationId;
}

export interface LaunchCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "LaunchCampaignExecution";
  readonly executionId: CampaignExecutionId;
  readonly causationId?: CausationId;
}

export interface CompleteCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "CompleteCampaignExecution";
  readonly executionId: CampaignExecutionId;
  readonly resultSummary: string;
  readonly causationId?: CausationId;
}

export interface CancelCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "CancelCampaignExecution";
  readonly executionId: CampaignExecutionId;
  readonly reason: string;
  readonly causationId?: CausationId;
}

export interface ArchiveCampaignExecutionCommand extends ApplicationCommand {
  readonly commandType: "ArchiveCampaignExecution";
  readonly executionId: CampaignExecutionId;
  readonly causationId?: CausationId;
}

export interface GetCampaignExecutionQuery extends ApplicationQuery {
  readonly queryType: "GetCampaignExecution";
  readonly executionId: CampaignExecutionId;
}

export interface ListCampaignExecutionsQuery extends ApplicationQuery {
  readonly queryType: "ListCampaignExecutions";
}

export interface ListCampaignExecutionsByStatusQuery extends ApplicationQuery {
  readonly queryType: "ListCampaignExecutionsByStatus";
  readonly status: CampaignExecutionStatus;
}

export interface ListCampaignExecutionsByPriorityQuery
  extends ApplicationQuery {
  readonly queryType: "ListCampaignExecutionsByPriority";
  readonly priority: CampaignExecutionPriority;
}

export interface CampaignExecutionApplicationResult {
  readonly execution: CampaignExecution;
}

export interface CampaignExecutionQueryResult {
  readonly execution: CampaignExecution | null;
}

export interface CampaignExecutionListQueryResult {
  readonly executions: readonly CampaignExecution[];
}

export interface CampaignExecutionApplicationError {
  readonly code:
    | "CampaignExecutionNotFound"
    | "ValidationFailed"
    | "CampaignExecutionPersistenceFailed"
    | "CampaignExecutionEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CampaignExecutionApplicationService {
  constructor(
    private readonly executionRepository: CampaignExecutionRepository,
    private readonly eventPublisher: CampaignExecutionEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createExecutionId: CreateExecutionId =
      defaultCreateExecutionId
  ) {}

  async createCampaignExecution(
    command: CreateCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const createdAt = this.now();
      const execution = CampaignExecutionWorkflow.CampaignExecution.create({
        executionId: command.executionId ?? this.createExecutionId(),
        businessId: command.context.businessId,
        title: command.title,
        objective: command.objective,
        channels: command.channels,
        priority: command.priority,
        sourceOpportunityId: command.sourceOpportunityId,
        sourceContentPlanId: command.sourceContentPlanId,
        createdAt,
      });

      await this.executionRepository.save(execution);
      await this.publish(
        this.createCampaignExecutionCreatedEvent(command, execution, createdAt)
      );

      return success({ execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async prepareCampaignExecution(
    command: PrepareCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const preparedAt = this.now();
      loaded.value.execution.prepare(preparedAt);

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(
        this.createCampaignExecutionPreparedEvent(command, preparedAt)
      );

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async launchCampaignExecution(
    command: LaunchCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const launchedAt = this.now();
      loaded.value.execution.launch(launchedAt);

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(
        this.createCampaignExecutionLaunchedEvent(command, launchedAt)
      );

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async completeCampaignExecution(
    command: CompleteCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const completedAt = this.now();
      loaded.value.execution.complete({
        resultSummary: command.resultSummary,
        completedAt,
      });

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(
        this.createCampaignExecutionCompletedEvent(command, completedAt)
      );

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async cancelCampaignExecution(
    command: CancelCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const cancelledAt = this.now();
      loaded.value.execution.cancel({
        reason: command.reason,
        cancelledAt,
      });

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(
        this.createCampaignExecutionCancelledEvent(command, cancelledAt)
      );

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async archiveCampaignExecution(
    command: ArchiveCampaignExecutionCommand
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    try {
      const loaded = await this.loadExecution(command);
      if (!loaded.ok) return loaded;

      const archivedAt = this.now();
      loaded.value.execution.archive(archivedAt);

      await this.executionRepository.save(loaded.value.execution);
      await this.publish(
        this.createCampaignExecutionArchivedEvent(command, archivedAt)
      );

      return success({ execution: loaded.value.execution });
    } catch (error) {
      return failure(mapCampaignExecutionApplicationError(error));
    }
  }

  async getCampaignExecution(
    query: GetCampaignExecutionQuery
  ): Promise<CampaignExecutionQueryResult> {
    const execution = await this.executionRepository.findById(query.executionId);

    if (!execution || execution.businessId !== query.context.businessId) {
      return { execution: null };
    }

    return { execution };
  }

  async listCampaignExecutions(
    query: ListCampaignExecutionsQuery
  ): Promise<CampaignExecutionListQueryResult> {
    return {
      executions: await this.executionRepository.findByBusinessId(
        query.context.businessId
      ),
    };
  }

  async listCampaignExecutionsByStatus(
    query: ListCampaignExecutionsByStatusQuery
  ): Promise<CampaignExecutionListQueryResult> {
    return {
      executions: await this.executionRepository.findByStatus(
        query.context.businessId,
        query.status
      ),
    };
  }

  async listCampaignExecutionsByPriority(
    query: ListCampaignExecutionsByPriorityQuery
  ): Promise<CampaignExecutionListQueryResult> {
    return {
      executions: await this.executionRepository.findByPriority(
        query.context.businessId,
        query.priority
      ),
    };
  }

  private async loadExecution(
    command: ApplicationCommand & { readonly executionId: CampaignExecutionId }
  ): Promise<
    Result<CampaignExecutionApplicationResult, CampaignExecutionApplicationError>
  > {
    const execution = await this.executionRepository.findById(command.executionId);

    if (!execution) {
      return failure(executionNotFound(command.executionId));
    }

    if (execution.businessId !== command.context.businessId) {
      return failure({
        code: "ValidationFailed",
        message: `Campaign execution ${command.executionId} does not belong to the active business.`,
      });
    }

    return success({ execution });
  }

  private async publish(event: CampaignExecutionDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends CampaignExecutionDomainEvent["eventType"],
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: CampaignExecutionId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "CampaignExecution" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createCampaignExecutionCreatedEvent(
    command: CreateCampaignExecutionCommand,
    execution: CampaignExecution,
    createdAt: Timestamp
  ): CampaignExecutionCreatedEvent {
    const snapshot = execution.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionCreated",
        snapshot.executionId,
        createdAt
      ),
      payload: {
        executionId: snapshot.executionId,
        businessId: snapshot.businessId,
        title: snapshot.title,
        objective: snapshot.objective,
        channels: snapshot.channels,
        priority: snapshot.priority,
        sourceOpportunityId: snapshot.sourceOpportunityId,
        sourceContentPlanId: snapshot.sourceContentPlanId,
        createdAt,
      },
    };
  }

  private createCampaignExecutionPreparedEvent(
    command: PrepareCampaignExecutionCommand,
    preparedAt: Timestamp
  ): CampaignExecutionPreparedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionPrepared",
        command.executionId,
        preparedAt
      ),
      payload: {
        executionId: command.executionId,
        preparedAt,
      },
    };
  }

  private createCampaignExecutionLaunchedEvent(
    command: LaunchCampaignExecutionCommand,
    launchedAt: Timestamp
  ): CampaignExecutionLaunchedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionLaunched",
        command.executionId,
        launchedAt
      ),
      payload: {
        executionId: command.executionId,
        launchedAt,
      },
    };
  }

  private createCampaignExecutionCompletedEvent(
    command: CompleteCampaignExecutionCommand,
    completedAt: Timestamp
  ): CampaignExecutionCompletedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionCompleted",
        command.executionId,
        completedAt
      ),
      payload: {
        executionId: command.executionId,
        resultSummary: command.resultSummary.trim(),
        completedAt,
      },
    };
  }

  private createCampaignExecutionCancelledEvent(
    command: CancelCampaignExecutionCommand,
    cancelledAt: Timestamp
  ): CampaignExecutionCancelledEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionCancelled",
        command.executionId,
        cancelledAt
      ),
      payload: {
        executionId: command.executionId,
        reason: command.reason.trim(),
        cancelledAt,
      },
    };
  }

  private createCampaignExecutionArchivedEvent(
    command: ArchiveCampaignExecutionCommand,
    archivedAt: Timestamp
  ): CampaignExecutionArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CampaignExecutionArchived",
        command.executionId,
        archivedAt
      ),
      payload: {
        executionId: command.executionId,
        archivedAt,
      },
    };
  }
}

function executionNotFound(
  executionId: CampaignExecutionId
): CampaignExecutionApplicationError {
  return {
    code: "CampaignExecutionNotFound",
    message: `Campaign execution ${executionId} was not found.`,
  };
}

function mapCampaignExecutionApplicationError(
  error: unknown
): CampaignExecutionApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Campaign execution command failed validation.",
    cause: error,
  };
}
