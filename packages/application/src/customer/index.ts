import type {
  CustomerArchivedEvent,
  CustomerCreatedEvent,
  CustomerDomainEvent,
  CustomerId,
  CustomerRepository,
  CustomerRestoredEvent,
  CustomerType,
  CustomerUpdatedEvent,
  CommunicationPreference,
} from "@nextshift/domain";
import { Customer } from "@nextshift/domain";
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
type CreateCustomerId = () => CustomerId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateCustomerId: CreateCustomerId = () =>
  crypto.randomUUID() as CustomerId;

export interface CustomerEventPublisher {
  publish(event: CustomerDomainEvent): Promise<void>;
}

export interface CreateCustomerCommand extends ApplicationCommand {
  readonly commandType: "CreateCustomer";
  readonly customerId?: CustomerId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly communicationPreference?: CommunicationPreference;
  readonly tags?: readonly string[];
  readonly causationId?: CausationId;
}

export interface UpdateCustomerCommand extends ApplicationCommand {
  readonly commandType: "UpdateCustomer";
  readonly customerId: CustomerId;
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly communicationPreference?: CommunicationPreference;
  readonly tags?: readonly string[];
  readonly causationId?: CausationId;
}

export interface ArchiveCustomerCommand extends ApplicationCommand {
  readonly commandType: "ArchiveCustomer";
  readonly customerId: CustomerId;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface RestoreCustomerCommand extends ApplicationCommand {
  readonly commandType: "RestoreCustomer";
  readonly customerId: CustomerId;
  readonly causationId?: CausationId;
}

export interface GetCustomerQuery extends ApplicationQuery {
  readonly queryType: "GetCustomer";
  readonly customerId: CustomerId;
}

export interface FindCustomerByEmailQuery extends ApplicationQuery {
  readonly queryType: "FindCustomerByEmail";
  readonly email: string;
}

export interface FindCustomerByPhoneQuery extends ApplicationQuery {
  readonly queryType: "FindCustomerByPhone";
  readonly phone: string;
}

export interface CustomerApplicationResult {
  readonly customer: Customer;
}

export interface CustomerQueryResult {
  readonly customer: Customer | null;
}

export interface CustomerApplicationError {
  readonly code:
    | "CustomerNotFound"
    | "ValidationFailed"
    | "CustomerPersistenceFailed"
    | "CustomerEventPublicationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class CustomerApplicationService {
  constructor(
    private readonly repository: CustomerRepository,
    private readonly eventPublisher: CustomerEventPublisher,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createCustomerId: CreateCustomerId = defaultCreateCustomerId
  ) {}

  async createCustomer(
    command: CreateCustomerCommand
  ): Promise<Result<CustomerApplicationResult, CustomerApplicationError>> {
    try {
      const createdAt = this.now();
      const customer = Customer.create({
        customerId: command.customerId ?? this.createCustomerId(),
        businessId: command.context.businessId,
        displayName: command.displayName,
        email: command.email,
        phone: command.phone,
        type: command.type,
        communicationPreference: command.communicationPreference,
        tags: command.tags,
        createdAt,
      });

      await this.repository.save(customer);
      await this.publish(
        this.createCustomerCreatedEvent(command, customer, createdAt)
      );

      return success({ customer });
    } catch (error) {
      return failure(mapApplicationError(error));
    }
  }

  async updateCustomer(
    command: UpdateCustomerCommand
  ): Promise<Result<CustomerApplicationResult, CustomerApplicationError>> {
    try {
      const customer = await this.repository.findById(command.customerId);

      if (!customer) {
        return failure(notFound(command.customerId));
      }

      const updatedAt = this.now();
      const updatedFields = collectUpdatedFields(command);

      customer.updateProfile({
        displayName: command.displayName,
        email: command.email,
        phone: command.phone,
        type: command.type,
        communicationPreference: command.communicationPreference,
        tags: command.tags,
        updatedAt,
      });

      await this.repository.save(customer);
      await this.publish(
        this.createCustomerUpdatedEvent(
          command,
          customer.customerId,
          updatedFields,
          updatedAt
        )
      );

      return success({ customer });
    } catch (error) {
      return failure(mapApplicationError(error));
    }
  }

  async archiveCustomer(
    command: ArchiveCustomerCommand
  ): Promise<Result<CustomerApplicationResult, CustomerApplicationError>> {
    try {
      const customer = await this.repository.findById(command.customerId);

      if (!customer) {
        return failure(notFound(command.customerId));
      }

      const archivedAt = this.now();

      customer.archive(archivedAt);
      await this.repository.save(customer);
      await this.publish(this.createCustomerArchivedEvent(command, archivedAt));

      return success({ customer });
    } catch (error) {
      return failure(mapApplicationError(error));
    }
  }

  async restoreCustomer(
    command: RestoreCustomerCommand
  ): Promise<Result<CustomerApplicationResult, CustomerApplicationError>> {
    try {
      const customer = await this.repository.findById(command.customerId);

      if (!customer) {
        return failure(notFound(command.customerId));
      }

      const restoredAt = this.now();

      customer.restore(restoredAt);
      await this.repository.save(customer);
      await this.publish(this.createCustomerRestoredEvent(command, restoredAt));

      return success({ customer });
    } catch (error) {
      return failure(mapApplicationError(error));
    }
  }

  async getCustomer(query: GetCustomerQuery): Promise<CustomerQueryResult> {
    return { customer: await this.repository.findById(query.customerId) };
  }

  async findCustomerByEmail(
    query: FindCustomerByEmailQuery
  ): Promise<CustomerQueryResult> {
    return { customer: await this.repository.findByEmail(query.email) };
  }

  async findCustomerByPhone(
    query: FindCustomerByPhoneQuery
  ): Promise<CustomerQueryResult> {
    return { customer: await this.repository.findByPhone(query.phone) };
  }

  private async publish(event: CustomerDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends CustomerDomainEvent["eventType"]>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: CustomerId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "Customer" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createCustomerCreatedEvent(
    command: CreateCustomerCommand,
    customer: Customer,
    createdAt: Timestamp
  ): CustomerCreatedEvent {
    const snapshot = customer.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "CustomerCreated",
        snapshot.customerId,
        createdAt
      ),
      payload: {
        customerId: snapshot.customerId,
        customerName: snapshot.displayName,
        customerType: snapshot.type,
        status: snapshot.status,
        createdAt,
      },
    };
  }

  private createCustomerUpdatedEvent(
    command: UpdateCustomerCommand,
    customerId: CustomerId,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): CustomerUpdatedEvent {
    return {
      ...this.createBaseEvent(command, "CustomerUpdated", customerId, updatedAt),
      payload: {
        customerId,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createCustomerArchivedEvent(
    command: ArchiveCustomerCommand,
    archivedAt: Timestamp
  ): CustomerArchivedEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CustomerArchived",
        command.customerId,
        archivedAt
      ),
      payload: {
        customerId: command.customerId,
        archivedAt,
        reason: command.reason,
      },
    };
  }

  private createCustomerRestoredEvent(
    command: RestoreCustomerCommand,
    restoredAt: Timestamp
  ): CustomerRestoredEvent {
    return {
      ...this.createBaseEvent(
        command,
        "CustomerRestored",
        command.customerId,
        restoredAt
      ),
      payload: {
        customerId: command.customerId,
        restoredAt,
      },
    };
  }
}

function collectUpdatedFields(command: UpdateCustomerCommand): readonly string[] {
  const fields: string[] = [];

  if (command.displayName !== undefined) fields.push("displayName");
  if (command.email !== undefined) fields.push("email");
  if (command.phone !== undefined) fields.push("phone");
  if (command.type !== undefined) fields.push("type");
  if (command.communicationPreference !== undefined) {
    fields.push("communicationPreference");
  }
  if (command.tags !== undefined) fields.push("tags");

  return fields;
}

function notFound(customerId: CustomerId): CustomerApplicationError {
  return {
    code: "CustomerNotFound",
    message: `Customer ${customerId} was not found.`,
  };
}

function mapApplicationError(error: unknown): CustomerApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Customer command failed validation.",
    cause: error,
  };
}
