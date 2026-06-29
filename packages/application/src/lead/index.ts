import type {
  CustomerId,
  LeadClosedEvent,
  LeadConvertedEvent,
  LeadCreatedEvent,
  LeadDomainEvent,
  LeadId,
  LeadQualifiedEvent,
  LeadRepository,
  LeadSource,
  LeadUpdatedEvent,
  QualificationScore,
} from "@nextshift/domain";
import { Lead } from "@nextshift/domain";
import type {
  CausationId,
  EventId,
  Result,
  Timestamp,
} from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import type { ApplicationCommand } from "../commands";
import type { ApplicationQuery } from "../queries";
import type { CustomerApplicationService } from "../customer";

type Now = () => Timestamp;
type CreateEventId = () => EventId;
type CreateLeadId = () => LeadId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateLeadId: CreateLeadId = () => crypto.randomUUID() as LeadId;

export interface LeadEventPublisher {
  publish(event: LeadDomainEvent): Promise<void>;
}

export interface CreateLeadCommand extends ApplicationCommand {
  readonly commandType: "CreateLead";
  readonly leadId?: LeadId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: string;
  readonly causationId?: CausationId;
}

export interface UpdateLeadCommand extends ApplicationCommand {
  readonly commandType: "UpdateLead";
  readonly leadId: LeadId;
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source?: string;
  readonly causationId?: CausationId;
}

export interface QualifyLeadCommand extends ApplicationCommand {
  readonly commandType: "QualifyLead";
  readonly leadId: LeadId;
  readonly qualificationScore: number;
  readonly causationId?: CausationId;
}

export interface ConvertLeadCommand extends ApplicationCommand {
  readonly commandType: "ConvertLead";
  readonly leadId: LeadId;
  readonly customerId?: CustomerId;
  readonly causationId?: CausationId;
}

export interface CloseLeadCommand extends ApplicationCommand {
  readonly commandType: "CloseLead";
  readonly leadId: LeadId;
  readonly reason?: string;
  readonly causationId?: CausationId;
}

export interface GetLeadQuery extends ApplicationQuery {
  readonly queryType: "GetLead";
  readonly leadId: LeadId;
}

export interface FindLeadByEmailQuery extends ApplicationQuery {
  readonly queryType: "FindLeadByEmail";
  readonly email: string;
}

export interface FindLeadByPhoneQuery extends ApplicationQuery {
  readonly queryType: "FindLeadByPhone";
  readonly phone: string;
}

export interface LeadApplicationResult {
  readonly lead: Lead;
}

export interface LeadConversionResult {
  readonly lead: Lead;
  readonly customerId: CustomerId;
}

export interface LeadQueryResult {
  readonly lead: Lead | null;
}

export interface LeadApplicationError {
  readonly code:
    | "LeadNotFound"
    | "ValidationFailed"
    | "LeadCustomerConversionFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class LeadApplicationService {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly eventPublisher: LeadEventPublisher,
    private readonly customerApplicationService: CustomerApplicationService,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createLeadId: CreateLeadId = defaultCreateLeadId
  ) {}

  async createLead(
    command: CreateLeadCommand
  ): Promise<Result<LeadApplicationResult, LeadApplicationError>> {
    try {
      const createdAt = this.now();
      const lead = Lead.create({
        leadId: command.leadId ?? this.createLeadId(),
        businessId: command.context.businessId,
        displayName: command.displayName,
        email: command.email,
        phone: command.phone,
        source: command.source,
        createdAt,
      });

      await this.leadRepository.save(lead);
      await this.publish(this.createLeadCreatedEvent(command, lead, createdAt));

      return success({ lead });
    } catch (error) {
      return failure(mapLeadApplicationError(error));
    }
  }

  async updateLead(
    command: UpdateLeadCommand
  ): Promise<Result<LeadApplicationResult, LeadApplicationError>> {
    try {
      const lead = await this.leadRepository.findById(command.leadId);

      if (!lead) {
        return failure(leadNotFound(command.leadId));
      }

      const updatedAt = this.now();
      const updatedFields = collectUpdatedFields(command);

      lead.update({
        displayName: command.displayName,
        email: command.email,
        phone: command.phone,
        source: command.source,
        updatedAt,
      });

      await this.leadRepository.save(lead);
      await this.publish(
        this.createLeadUpdatedEvent(
          command,
          lead.leadId,
          updatedFields,
          updatedAt
        )
      );

      return success({ lead });
    } catch (error) {
      return failure(mapLeadApplicationError(error));
    }
  }

  async qualifyLead(
    command: QualifyLeadCommand
  ): Promise<Result<LeadApplicationResult, LeadApplicationError>> {
    try {
      const lead = await this.leadRepository.findById(command.leadId);

      if (!lead) {
        return failure(leadNotFound(command.leadId));
      }

      const qualifiedAt = this.now();
      lead.qualify(command.qualificationScore, qualifiedAt);
      await this.leadRepository.save(lead);
      await this.publish(this.createLeadQualifiedEvent(command, lead, qualifiedAt));

      return success({ lead });
    } catch (error) {
      return failure(mapLeadApplicationError(error));
    }
  }

  async convertLead(
    command: ConvertLeadCommand
  ): Promise<Result<LeadConversionResult, LeadApplicationError>> {
    try {
      const lead = await this.leadRepository.findById(command.leadId);

      if (!lead) {
        return failure(leadNotFound(command.leadId));
      }

      const leadSnapshot = lead.toSnapshot();

      if (leadSnapshot.status !== "qualified") {
        return failure({
          code: "ValidationFailed",
          message: "Only qualified leads may be converted.",
        });
      }

      const convertedAt = this.now();
      const customerResult =
        await this.customerApplicationService.createCustomer({
          commandType: "CreateCustomer",
          context: command.context,
          customerId: command.customerId,
          displayName: leadSnapshot.displayName,
          email: leadSnapshot.email,
          phone: leadSnapshot.phone,
          causationId: command.causationId,
        });

      if (!customerResult.ok) {
        return failure({
          code: "LeadCustomerConversionFailed",
          message: "Lead conversion failed while creating customer.",
          cause: customerResult.error,
        });
      }

      const customerId = customerResult.value.customer.customerId;

      lead.convert(customerId, convertedAt);
      await this.leadRepository.save(lead);
      await this.publish(
        this.createLeadConvertedEvent(command, lead.leadId, customerId, convertedAt)
      );

      return success({ lead, customerId });
    } catch (error) {
      return failure(mapLeadApplicationError(error));
    }
  }

  async closeLead(
    command: CloseLeadCommand
  ): Promise<Result<LeadApplicationResult, LeadApplicationError>> {
    try {
      const lead = await this.leadRepository.findById(command.leadId);

      if (!lead) {
        return failure(leadNotFound(command.leadId));
      }

      const closedAt = this.now();
      lead.close(closedAt, command.reason);
      await this.leadRepository.save(lead);
      await this.publish(this.createLeadClosedEvent(command, closedAt));

      return success({ lead });
    } catch (error) {
      return failure(mapLeadApplicationError(error));
    }
  }

  async getLead(query: GetLeadQuery): Promise<LeadQueryResult> {
    return { lead: await this.leadRepository.findById(query.leadId) };
  }

  async findLeadByEmail(query: FindLeadByEmailQuery): Promise<LeadQueryResult> {
    return { lead: await this.leadRepository.findByEmail(query.email) };
  }

  async findLeadByPhone(query: FindLeadByPhoneQuery): Promise<LeadQueryResult> {
    return { lead: await this.leadRepository.findByPhone(query.phone) };
  }

  private async publish(event: LeadDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<TEventType extends LeadDomainEvent["eventType"]>(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: LeadId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "Lead" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createLeadCreatedEvent(
    command: CreateLeadCommand,
    lead: Lead,
    createdAt: Timestamp
  ): LeadCreatedEvent {
    const snapshot = lead.toSnapshot();

    return {
      ...this.createBaseEvent(command, "LeadCreated", snapshot.leadId, createdAt),
      payload: {
        leadId: snapshot.leadId,
        source: snapshot.source,
        createdAt,
      },
    };
  }

  private createLeadUpdatedEvent(
    command: UpdateLeadCommand,
    leadId: LeadId,
    updatedFields: readonly string[],
    updatedAt: Timestamp
  ): LeadUpdatedEvent {
    return {
      ...this.createBaseEvent(command, "LeadUpdated", leadId, updatedAt),
      payload: {
        leadId,
        updatedFields,
        updatedAt,
      },
    };
  }

  private createLeadQualifiedEvent(
    command: QualifyLeadCommand,
    lead: Lead,
    qualifiedAt: Timestamp
  ): LeadQualifiedEvent {
    const snapshot = lead.toSnapshot();

    return {
      ...this.createBaseEvent(command, "LeadQualified", lead.leadId, qualifiedAt),
      payload: {
        leadId: lead.leadId,
        qualificationScore: snapshot.qualificationScore as QualificationScore,
        qualifiedAt,
      },
    };
  }

  private createLeadConvertedEvent(
    command: ConvertLeadCommand,
    leadId: LeadId,
    customerId: CustomerId,
    convertedAt: Timestamp
  ): LeadConvertedEvent {
    return {
      ...this.createBaseEvent(command, "LeadConverted", leadId, convertedAt),
      payload: {
        leadId,
        customerId,
        convertedAt,
      },
    };
  }

  private createLeadClosedEvent(
    command: CloseLeadCommand,
    closedAt: Timestamp
  ): LeadClosedEvent {
    return {
      ...this.createBaseEvent(command, "LeadClosed", command.leadId, closedAt),
      payload: {
        leadId: command.leadId,
        reason: command.reason,
        closedAt,
      },
    };
  }
}

function collectUpdatedFields(command: UpdateLeadCommand): readonly string[] {
  const fields: string[] = [];

  if (command.displayName !== undefined) fields.push("displayName");
  if (command.email !== undefined) fields.push("email");
  if (command.phone !== undefined) fields.push("phone");
  if (command.source !== undefined) fields.push("source");

  return fields;
}

function leadNotFound(leadId: LeadId): LeadApplicationError {
  return {
    code: "LeadNotFound",
    message: `Lead ${leadId} was not found.`,
  };
}

function mapLeadApplicationError(error: unknown): LeadApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Lead command failed validation.",
    cause: error,
  };
}
