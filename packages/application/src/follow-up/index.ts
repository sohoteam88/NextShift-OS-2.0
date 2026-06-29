import type {
  CustomerId,
  FollowUpCancelledEvent,
  FollowUpCompletedEvent,
  FollowUpDomainEvent,
  FollowUpId,
  FollowUpOverdueEvent,
  FollowUpRepository,
  FollowUpScheduledEvent,
  FollowUpUpdatedEvent,
  InteractionId,
} from "@nextshift/domain";
import { FollowUp } from "@nextshift/domain";
import type {
  CausationId,
  EventId,
  Result,
  Timestamp,
} from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { CustomerApplicationService } from "../customer";
import type { ApplicationQuery } from "../queries";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateFollowUpId = () => FollowUpId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateFollowUpId: CreateFollowUpId = () =>
  crypto.randomUUID() as FollowUpId;

export interface FollowUpEventPublisher {
  publish(event: FollowUpDomainEvent): Promise<void>;
}

export interface ScheduleFollowUpCommand extends ApplicationCommand {
  readonly commandType: "ScheduleFollowUp";
  readonly followUpId?: FollowUpId;
  readonly customerId: CustomerId;
  readonly interactionId?: InteractionId;
  readonly title: string;
  readonly description?: string;
  readonly priority?: string;
  readonly dueAt: Timestamp;
  readonly assignedTo?: string;
  readonly causationId?: CausationId;
}

export interface UpdateFollowUpCommand extends ApplicationCommand {
  readonly commandType: "UpdateFollowUp";
  readonly followUpId: FollowUpId;
  readonly title?: string;
  readonly description?: string;
  readonly priority?: string;
  readonly dueAt?: Timestamp;
  readonly assignedTo?: string;
  readonly causationId?: CausationId;
}

export interface CompleteFollowUpCommand extends ApplicationCommand {
  readonly commandType: "CompleteFollowUp";
  readonly followUpId: FollowUpId;
  readonly causationId?: CausationId;
}

export interface CancelFollowUpCommand extends ApplicationCommand {
  readonly commandType: "CancelFollowUp";
  readonly followUpId: FollowUpId;
  readonly causationId?: CausationId;
}

export interface GetFollowUpQuery extends ApplicationQuery {
  readonly queryType: "GetFollowUp";
  readonly followUpId: FollowUpId;
}

export interface GetCustomerFollowUpsQuery extends ApplicationQuery {
  readonly queryType: "GetCustomerFollowUps";
  readonly customerId: CustomerId;
}

export interface ListPendingFollowUpsQuery extends ApplicationQuery {
  readonly queryType: "ListPendingFollowUps";
}

export interface ListOverdueFollowUpsQuery extends ApplicationQuery {
  readonly queryType: "ListOverdueFollowUps";
  readonly asOf?: Timestamp;
}

export interface FollowUpApplicationResult {
  readonly followUp: FollowUp;
}

export interface FollowUpQueryResult {
  readonly followUp: FollowUp | null;
}

export interface FollowUpListResult {
  readonly followUps: readonly FollowUp[];
}

export interface FollowUpApplicationError {
  readonly code:
    | "FollowUpNotFound"
    | "CustomerNotFound"
    | "ValidationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class FollowUpApplicationService {
  constructor(
    private readonly followUpRepository: FollowUpRepository,
    private readonly eventPublisher: FollowUpEventPublisher,
    private readonly customerApplicationService: CustomerApplicationService,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createFollowUpId: CreateFollowUpId = defaultCreateFollowUpId
  ) {}

  async scheduleFollowUp(
    command: ScheduleFollowUpCommand
  ): Promise<Result<FollowUpApplicationResult, FollowUpApplicationError>> {
    try {
      const customerExists = await this.customerExists(command);

      if (!customerExists) {
        return failure(customerNotFound(command.customerId));
      }

      const createdAt = this.now();
      const followUp = FollowUp.schedule({
        followUpId: command.followUpId ?? this.createFollowUpId(),
        customerId: command.customerId,
        interactionId: command.interactionId,
        title: command.title,
        description: command.description,
        priority: command.priority,
        dueAt: command.dueAt,
        assignedTo: command.assignedTo,
        createdAt,
      });

      await this.followUpRepository.save(followUp);
      await this.publish(
        this.createFollowUpScheduledEvent(command, followUp, createdAt)
      );

      return success({ followUp });
    } catch (error) {
      return failure(mapFollowUpApplicationError(error));
    }
  }

  async updateFollowUp(
    command: UpdateFollowUpCommand
  ): Promise<Result<FollowUpApplicationResult, FollowUpApplicationError>> {
    try {
      const followUp = await this.followUpRepository.findById(command.followUpId);

      if (!followUp) {
        return failure(followUpNotFound(command.followUpId));
      }

      const updatedAt = this.now();
      const updatedFields = collectUpdatedFields(command);

      followUp.update({
        title: command.title,
        description: command.description,
        priority: command.priority,
        dueAt: command.dueAt,
        assignedTo: command.assignedTo,
        updatedAt,
      });

      await this.followUpRepository.save(followUp);
      await this.publish(
        this.createFollowUpUpdatedEvent(
          command,
          command.followUpId,
          updatedFields,
          updatedAt
        )
      );

      return success({ followUp });
    } catch (error) {
      return failure(mapFollowUpApplicationError(error));
    }
  }

  async completeFollowUp(
    command: CompleteFollowUpCommand
  ): Promise<Result<FollowUpApplicationResult, FollowUpApplicationError>> {
    try {
      const completedAt = this.now();
      const followUp = await this.followUpRepository.complete(
        command.followUpId,
        completedAt
      );

      if (!followUp) {
        return failure(followUpNotFound(command.followUpId));
      }

      await this.publish(this.createFollowUpCompletedEvent(command, completedAt));

      return success({ followUp });
    } catch (error) {
      return failure(mapFollowUpApplicationError(error));
    }
  }

  async cancelFollowUp(
    command: CancelFollowUpCommand
  ): Promise<Result<FollowUpApplicationResult, FollowUpApplicationError>> {
    try {
      const cancelledAt = this.now();
      const followUp = await this.followUpRepository.cancel(
        command.followUpId,
        cancelledAt
      );

      if (!followUp) {
        return failure(followUpNotFound(command.followUpId));
      }

      await this.publish(this.createFollowUpCancelledEvent(command, cancelledAt));

      return success({ followUp });
    } catch (error) {
      return failure(mapFollowUpApplicationError(error));
    }
  }

  async getFollowUp(query: GetFollowUpQuery): Promise<FollowUpQueryResult> {
    return {
      followUp: await this.followUpRepository.findById(query.followUpId),
    };
  }

  async getCustomerFollowUps(
    query: GetCustomerFollowUpsQuery
  ): Promise<FollowUpListResult> {
    return {
      followUps: await this.followUpRepository.findByCustomer(query.customerId),
    };
  }

  async listPending(
    _query: ListPendingFollowUpsQuery
  ): Promise<FollowUpListResult> {
    return {
      followUps: await this.followUpRepository.findPending(),
    };
  }

  async listOverdue(
    query: ListOverdueFollowUpsQuery
  ): Promise<FollowUpListResult> {
    const detectedAt = query.asOf ?? this.now();
    const followUps = await this.followUpRepository.findOverdue(detectedAt);

    for (const followUp of followUps) {
      await this.publish(this.createFollowUpOverdueEvent(query, followUp, detectedAt));
    }

    return { followUps };
  }

  private async customerExists(
    command: ApplicationCommand & { readonly customerId: CustomerId }
  ): Promise<boolean> {
    const result = await this.customerApplicationService.getCustomer({
      queryType: "GetCustomer",
      context: command.context,
      customerId: command.customerId,
    });

    return result.customer !== null;
  }

  private async publish(event: FollowUpDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends FollowUpDomainEvent["eventType"]>(
    command: (ApplicationCommand | ApplicationQuery) & {
      readonly causationId?: CausationId;
    },
    eventType: TEventType,
    aggregateId: FollowUpId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "FollowUp" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createFollowUpScheduledEvent(
    command: ScheduleFollowUpCommand,
    followUp: FollowUp,
    scheduledAt: Timestamp
  ): FollowUpScheduledEvent {
    const snapshot = followUp.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "FollowUpScheduled",
        snapshot.followUpId,
        scheduledAt
      ),
      payload: {
        followUpId: snapshot.followUpId,
        customerId: snapshot.customerId,
        interactionId: snapshot.interactionId,
        title: snapshot.title,
        priority: snapshot.priority,
        dueAt: snapshot.dueAt,
        assignedTo: snapshot.assignedTo,
        scheduledAt,
      },
    };
  }

  private createFollowUpUpdatedEvent(
    command: UpdateFollowUpCommand,
    followUpId: FollowUpId,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): FollowUpUpdatedEvent {
    return {
      ...this.createBaseEvent(command, "FollowUpUpdated", followUpId, updatedAt),
      payload: {
        followUpId,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createFollowUpCompletedEvent(
    command: CompleteFollowUpCommand,
    completedAt: Timestamp
  ): FollowUpCompletedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "FollowUpCompleted",
        command.followUpId,
        completedAt
      ),
      payload: {
        followUpId: command.followUpId,
        completedAt,
      },
    };
  }

  private createFollowUpCancelledEvent(
    command: CancelFollowUpCommand,
    cancelledAt: Timestamp
  ): FollowUpCancelledEvent {
    return {
      ...this.createBaseEvent(
        command,
        "FollowUpCancelled",
        command.followUpId,
        cancelledAt
      ),
      payload: {
        followUpId: command.followUpId,
        cancelledAt,
      },
    };
  }

  private createFollowUpOverdueEvent(
    query: ListOverdueFollowUpsQuery,
    followUp: FollowUp,
    detectedAt: Timestamp
  ): FollowUpOverdueEvent {
    const snapshot = followUp.toSnapshot();

    return {
      ...this.createBaseEvent(
        query,
        "FollowUpOverdue",
        snapshot.followUpId,
        detectedAt
      ),
      payload: {
        followUpId: snapshot.followUpId,
        customerId: snapshot.customerId,
        dueAt: snapshot.dueAt,
        detectedAt,
      },
    };
  }
}

function collectUpdatedFields(command: UpdateFollowUpCommand): readonly string[] {
  const fields: string[] = [];

  if (command.title !== undefined) fields.push("title");
  if (command.description !== undefined) fields.push("description");
  if (command.priority !== undefined) fields.push("priority");
  if (command.dueAt !== undefined) fields.push("dueAt");
  if (command.assignedTo !== undefined) fields.push("assignedTo");

  return fields;
}

function followUpNotFound(followUpId: FollowUpId): FollowUpApplicationError {
  return {
    code: "FollowUpNotFound",
    message: `Follow-up ${followUpId} was not found.`,
  };
}

function customerNotFound(customerId: CustomerId): FollowUpApplicationError {
  return {
    code: "CustomerNotFound",
    message: `Customer ${customerId} was not found.`,
  };
}

function mapFollowUpApplicationError(error: unknown): FollowUpApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Follow-up command failed validation.",
    cause: error,
  };
}
