import type {
  CustomerId,
  Segment,
  SegmentAssignedEvent,
  SegmentCreatedEvent,
  SegmentDomainEvent,
  SegmentEvaluatedEvent,
  SegmentId,
  SegmentRemovedEvent,
  SegmentRepository,
  SegmentRule,
  SegmentUpdatedEvent,
} from "@nextshift/domain";
import { Segment as SegmentAggregate } from "@nextshift/domain";
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
type CreateSegmentId = () => SegmentId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateSegmentId: CreateSegmentId = () =>
  crypto.randomUUID() as SegmentId;

export interface SegmentEventPublisher {
  publish(event: SegmentDomainEvent): Promise<void>;
}

export interface CreateSegmentCommand extends ApplicationCommand {
  readonly commandType: "CreateSegment";
  readonly segmentId?: SegmentId;
  readonly name: string;
  readonly description?: string;
  readonly rule?: SegmentRule;
  readonly causationId?: CausationId;
}

export interface UpdateSegmentCommand extends ApplicationCommand {
  readonly commandType: "UpdateSegment";
  readonly segmentId: SegmentId;
  readonly name?: string;
  readonly description?: string;
  readonly rule?: SegmentRule;
  readonly active?: boolean;
  readonly causationId?: CausationId;
}

export interface AssignCustomerCommand extends ApplicationCommand {
  readonly commandType: "AssignCustomer";
  readonly segmentId: SegmentId;
  readonly customerId: CustomerId;
  readonly causationId?: CausationId;
}

export interface RemoveCustomerCommand extends ApplicationCommand {
  readonly commandType: "RemoveCustomer";
  readonly segmentId: SegmentId;
  readonly customerId: CustomerId;
  readonly causationId?: CausationId;
}

export interface EvaluateSegmentCommand extends ApplicationCommand {
  readonly commandType: "EvaluateSegment";
  readonly segmentId: SegmentId;
  readonly customerIds: readonly CustomerId[];
  readonly causationId?: CausationId;
}

export interface GetSegmentQuery extends ApplicationQuery {
  readonly queryType: "GetSegment";
  readonly segmentId: SegmentId;
}

export interface GetSegmentMembersQuery extends ApplicationQuery {
  readonly queryType: "GetSegmentMembers";
  readonly segmentId: SegmentId;
}

export interface ListCustomerSegmentsQuery extends ApplicationQuery {
  readonly queryType: "ListCustomerSegments";
  readonly customerId: CustomerId;
}

export interface SegmentApplicationResult {
  readonly segment: Segment;
}

export interface SegmentEvaluationResult {
  readonly segment: Segment;
  readonly evaluatedCustomerIds: readonly CustomerId[];
  readonly assignedCustomerIds: readonly CustomerId[];
}

export interface SegmentQueryResult {
  readonly segment: Segment | null;
}

export interface SegmentMembersResult {
  readonly members: readonly ReturnType<Segment["listMembers"]>[number][];
}

export interface SegmentListResult {
  readonly segments: readonly Segment[];
}

export interface SegmentApplicationError {
  readonly code:
    | "SegmentNotFound"
    | "CustomerNotFound"
    | "ValidationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class SegmentApplicationService {
  constructor(
    private readonly segmentRepository: SegmentRepository,
    private readonly eventPublisher: SegmentEventPublisher,
    private readonly customerApplicationService: CustomerApplicationService,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createSegmentId: CreateSegmentId = defaultCreateSegmentId
  ) {}

  async createSegment(
    command: CreateSegmentCommand
  ): Promise<Result<SegmentApplicationResult, SegmentApplicationError>> {
    try {
      const createdAt = this.now();
      const segment = SegmentAggregate.create({
        segmentId: command.segmentId ?? this.createSegmentId(),
        businessId: command.context.businessId,
        name: command.name,
        description: command.description,
        rule: command.rule,
        createdAt,
      });

      await this.segmentRepository.save(segment);
      await this.publish(this.createSegmentCreatedEvent(command, segment, createdAt));

      return success({ segment });
    } catch (error) {
      return failure(mapSegmentApplicationError(error));
    }
  }

  async updateSegment(
    command: UpdateSegmentCommand
  ): Promise<Result<SegmentApplicationResult, SegmentApplicationError>> {
    try {
      const segment = await this.segmentRepository.findById(command.segmentId);

      if (!segment) {
        return failure(segmentNotFound(command.segmentId));
      }

      const updatedAt = this.now();
      const updatedFields = collectUpdatedFields(command);

      segment.update({
        name: command.name,
        description: command.description,
        rule: command.rule,
        active: command.active,
        updatedAt,
      });

      await this.segmentRepository.save(segment);
      await this.publish(
        this.createSegmentUpdatedEvent(
          command,
          command.segmentId,
          updatedFields,
          updatedAt
        )
      );

      return success({ segment });
    } catch (error) {
      return failure(mapSegmentApplicationError(error));
    }
  }

  async assignCustomer(
    command: AssignCustomerCommand
  ): Promise<Result<SegmentApplicationResult, SegmentApplicationError>> {
    try {
      if (!(await this.customerExists(command, command.customerId))) {
        return failure(customerNotFound(command.customerId));
      }

      const assignedAt = this.now();
      const segment = await this.segmentRepository.assignCustomer(
        command.segmentId,
        command.customerId,
        assignedAt,
        "manual"
      );

      if (!segment) {
        return failure(segmentNotFound(command.segmentId));
      }

      await this.publish(this.createSegmentAssignedEvent(command, assignedAt));

      return success({ segment });
    } catch (error) {
      return failure(mapSegmentApplicationError(error));
    }
  }

  async removeCustomer(
    command: RemoveCustomerCommand
  ): Promise<Result<SegmentApplicationResult, SegmentApplicationError>> {
    try {
      if (!(await this.customerExists(command, command.customerId))) {
        return failure(customerNotFound(command.customerId));
      }

      const removedAt = this.now();
      const segment = await this.segmentRepository.removeCustomer(
        command.segmentId,
        command.customerId,
        removedAt
      );

      if (!segment) {
        return failure(segmentNotFound(command.segmentId));
      }

      await this.publish(this.createSegmentRemovedEvent(command, removedAt));

      return success({ segment });
    } catch (error) {
      return failure(mapSegmentApplicationError(error));
    }
  }

  async evaluateSegment(
    command: EvaluateSegmentCommand
  ): Promise<Result<SegmentEvaluationResult, SegmentApplicationError>> {
    try {
      const segment = await this.segmentRepository.findById(command.segmentId);

      if (!segment) {
        return failure(segmentNotFound(command.segmentId));
      }

      for (const customerId of command.customerIds) {
        if (!(await this.customerExists(command, customerId))) {
          return failure(customerNotFound(customerId));
        }
      }

      const evaluatedAt = this.now();
      const assignedCustomerIds = await this.segmentRepository.evaluate(
        command.segmentId,
        command.customerIds,
        evaluatedAt
      );
      const evaluatedSegment =
        (await this.segmentRepository.findById(command.segmentId)) ?? segment;

      await this.publish(
        this.createSegmentEvaluatedEvent(command, assignedCustomerIds, evaluatedAt)
      );

      return success({
        segment: evaluatedSegment,
        evaluatedCustomerIds: command.customerIds,
        assignedCustomerIds,
      });
    } catch (error) {
      return failure(mapSegmentApplicationError(error));
    }
  }

  async getSegment(query: GetSegmentQuery): Promise<SegmentQueryResult> {
    return {
      segment: await this.segmentRepository.findById(query.segmentId),
    };
  }

  async listMembers(
    query: GetSegmentMembersQuery
  ): Promise<SegmentMembersResult> {
    return {
      members: await this.segmentRepository.listMembers(query.segmentId),
    };
  }

  async listCustomerSegments(
    query: ListCustomerSegmentsQuery
  ): Promise<SegmentListResult> {
    return {
      segments: await this.segmentRepository.listCustomerSegments(query.customerId),
    };
  }

  private async customerExists(
    command: ApplicationCommand,
    customerId: CustomerId
  ): Promise<boolean> {
    const result = await this.customerApplicationService.getCustomer({
      queryType: "GetCustomer",
      context: command.context,
      customerId,
    });

    return result.customer !== null;
  }

  private async publish(event: SegmentDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends SegmentDomainEvent["eventType"]>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: SegmentId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "Segment" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createSegmentCreatedEvent(
    command: CreateSegmentCommand,
    segment: Segment,
    createdAt: Timestamp
  ): SegmentCreatedEvent {
    const snapshot = segment.toSnapshot();

    return {
      ...this.createBaseEvent(command, "SegmentCreated", snapshot.segmentId, createdAt),
      payload: {
        segmentId: snapshot.segmentId,
        businessId: snapshot.businessId,
        name: snapshot.name,
        rule: snapshot.rule,
        createdAt,
      },
    };
  }

  private createSegmentUpdatedEvent(
    command: UpdateSegmentCommand,
    segmentId: SegmentId,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): SegmentUpdatedEvent {
    return {
      ...this.createBaseEvent(command, "SegmentUpdated", segmentId, updatedAt),
      payload: {
        segmentId,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createSegmentAssignedEvent(
    command: AssignCustomerCommand,
    assignedAt: Timestamp
  ): SegmentAssignedEvent {
    return {
      ...this.createBaseEvent(command, "SegmentAssigned", command.segmentId, assignedAt),
      payload: {
        segmentId: command.segmentId,
        customerId: command.customerId,
        assignmentSource: "manual",
        assignedAt,
      },
    };
  }

  private createSegmentRemovedEvent(
    command: RemoveCustomerCommand,
    removedAt: Timestamp
  ): SegmentRemovedEvent {
    return {
      ...this.createBaseEvent(command, "SegmentRemoved", command.segmentId, removedAt),
      payload: {
        segmentId: command.segmentId,
        customerId: command.customerId,
        removedAt,
      },
    };
  }

  private createSegmentEvaluatedEvent(
    command: EvaluateSegmentCommand,
    assignedCustomerIds: readonly CustomerId[],
    evaluatedAt: Timestamp
  ): SegmentEvaluatedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "SegmentEvaluated",
        command.segmentId,
        evaluatedAt
      ),
      payload: {
        segmentId: command.segmentId,
        evaluatedCustomerIds: command.customerIds,
        assignedCustomerIds,
        evaluatedAt,
      },
    };
  }
}

function collectUpdatedFields(command: UpdateSegmentCommand): readonly string[] {
  const fields: string[] = [];

  if (command.name !== undefined) fields.push("name");
  if (command.description !== undefined) fields.push("description");
  if (command.rule !== undefined) fields.push("rule");
  if (command.active !== undefined) fields.push("active");

  return fields;
}

function segmentNotFound(segmentId: SegmentId): SegmentApplicationError {
  return {
    code: "SegmentNotFound",
    message: `Segment ${segmentId} was not found.`,
  };
}

function customerNotFound(customerId: CustomerId): SegmentApplicationError {
  return {
    code: "CustomerNotFound",
    message: `Customer ${customerId} was not found.`,
  };
}

function mapSegmentApplicationError(error: unknown): SegmentApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Segment command failed validation.",
    cause: error,
  };
}
