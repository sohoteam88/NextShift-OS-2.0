import type {
  CustomerId,
  CustomerNoteAddedEvent,
  InteractionDomainEvent,
  InteractionId,
  InteractionRecordedEvent,
  InteractionRepository,
} from "@nextshift/domain";
import { Interaction } from "@nextshift/domain";
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
type CreateInteractionId = () => InteractionId;

const defaultNow: Now = () => new Date().toISOString();
const defaultCreateEventId: CreateEventId = () =>
  crypto.randomUUID() as EventId;
const defaultCreateInteractionId: CreateInteractionId = () =>
  crypto.randomUUID() as InteractionId;

export interface InteractionEventPublisher {
  publish(event: InteractionDomainEvent): Promise<void>;
}

export interface RecordInteractionCommand extends ApplicationCommand {
  readonly commandType: "RecordInteraction";
  readonly interactionId?: InteractionId;
  readonly customerId: CustomerId;
  readonly interactionType: string;
  readonly interactionChannel: string;
  readonly outcome?: string;
  readonly note?: string;
  readonly occurredAt?: Timestamp;
  readonly recordedBy?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly causationId?: CausationId;
}

export interface AddCustomerNoteCommand extends ApplicationCommand {
  readonly commandType: "AddCustomerNote";
  readonly interactionId?: InteractionId;
  readonly customerId: CustomerId;
  readonly note: string;
  readonly occurredAt?: Timestamp;
  readonly recordedBy?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly causationId?: CausationId;
}

export interface GetInteractionQuery extends ApplicationQuery {
  readonly queryType: "GetInteraction";
  readonly interactionId: InteractionId;
}

export interface GetCustomerTimelineQuery extends ApplicationQuery {
  readonly queryType: "GetCustomerTimeline";
  readonly customerId: CustomerId;
}

export interface InteractionApplicationResult {
  readonly interaction: Interaction;
}

export interface InteractionQueryResult {
  readonly interaction: Interaction | null;
}

export interface CustomerTimelineQueryResult {
  readonly interactions: readonly Interaction[];
}

export interface InteractionApplicationError {
  readonly code:
    | "InteractionNotFound"
    | "CustomerNotFound"
    | "ValidationFailed";
  readonly message: string;
  readonly cause?: unknown;
}

export class InteractionApplicationService {
  constructor(
    private readonly interactionRepository: InteractionRepository,
    private readonly eventPublisher: InteractionEventPublisher,
    private readonly customerApplicationService: CustomerApplicationService,
    private readonly now: Now = defaultNow,
    private readonly createEventId: CreateEventId = defaultCreateEventId,
    private readonly createInteractionId: CreateInteractionId = defaultCreateInteractionId
  ) {}

  async recordInteraction(
    command: RecordInteractionCommand
  ): Promise<Result<InteractionApplicationResult, InteractionApplicationError>> {
    try {
      const customerExists = await this.customerExists(command);

      if (!customerExists) {
        return failure(customerNotFound(command.customerId));
      }

      const occurredAt = command.occurredAt ?? this.now();
      const interaction = Interaction.record({
        interactionId: command.interactionId ?? this.createInteractionId(),
        customerId: command.customerId,
        interactionType: command.interactionType,
        interactionChannel: command.interactionChannel,
        outcome: command.outcome,
        note: command.note,
        occurredAt,
        recordedBy: resolveRecordedBy(command),
        metadata: command.metadata,
      });

      await this.interactionRepository.save(interaction);
      await this.publish(
        this.createInteractionRecordedEvent(command, interaction, occurredAt)
      );

      return success({ interaction });
    } catch (error) {
      return failure(mapInteractionApplicationError(error));
    }
  }

  async addCustomerNote(
    command: AddCustomerNoteCommand
  ): Promise<Result<InteractionApplicationResult, InteractionApplicationError>> {
    try {
      const customerExists = await this.customerExists(command);

      if (!customerExists) {
        return failure(customerNotFound(command.customerId));
      }

      const occurredAt = command.occurredAt ?? this.now();
      const interaction = Interaction.addNote({
        interactionId: command.interactionId ?? this.createInteractionId(),
        customerId: command.customerId,
        note: command.note,
        occurredAt,
        recordedBy: resolveRecordedBy(command),
        metadata: command.metadata,
      });

      await this.interactionRepository.save(interaction);
      await this.publish(
        this.createCustomerNoteAddedEvent(command, interaction, occurredAt)
      );

      return success({ interaction });
    } catch (error) {
      return failure(mapInteractionApplicationError(error));
    }
  }

  async getInteraction(
    query: GetInteractionQuery
  ): Promise<InteractionQueryResult> {
    return {
      interaction: await this.interactionRepository.findById(query.interactionId),
    };
  }

  async getTimeline(
    query: GetCustomerTimelineQuery
  ): Promise<CustomerTimelineQueryResult> {
    return {
      interactions: await this.interactionRepository.timeline(query.customerId),
    };
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

  private async publish(event: InteractionDomainEvent): Promise<void> {
    await this.eventPublisher.publish(event);
  }

  private createBaseEvent<
    TEventType extends InteractionDomainEvent["eventType"]
  >(
    command: ApplicationCommand & { readonly causationId?: CausationId },
    eventType: TEventType,
    aggregateId: InteractionId,
    occurredAt: Timestamp
  ) {
    return {
      eventId: this.createEventId(),
      eventType,
      aggregateId,
      aggregateType: "Interaction" as const,
      occurredAt,
      version: 1 as const,
      correlationId: command.context.correlationId,
      causationId: command.causationId,
    };
  }

  private createInteractionRecordedEvent(
    command: RecordInteractionCommand,
    interaction: Interaction,
    occurredAt: Timestamp
  ): InteractionRecordedEvent {
    const snapshot = interaction.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "InteractionRecorded",
        snapshot.interactionId,
        occurredAt
      ),
      payload: {
        interactionId: snapshot.interactionId,
        customerId: snapshot.customerId,
        interactionType: snapshot.interactionType,
        interactionChannel: snapshot.interactionChannel,
        outcome: snapshot.outcome,
        note: snapshot.note,
        occurredAt: snapshot.occurredAt,
        recordedBy: snapshot.recordedBy,
      },
    };
  }

  private createCustomerNoteAddedEvent(
    command: AddCustomerNoteCommand,
    interaction: Interaction,
    occurredAt: Timestamp
  ): CustomerNoteAddedEvent {
    const snapshot = interaction.toSnapshot();

    return {
      ...this.createBaseEvent(
        command,
        "CustomerNoteAdded",
        snapshot.interactionId,
        occurredAt
      ),
      payload: {
        interactionId: snapshot.interactionId,
        customerId: snapshot.customerId,
        note: snapshot.note ?? "",
        occurredAt: snapshot.occurredAt,
        recordedBy: snapshot.recordedBy,
      },
    };
  }
}

function resolveRecordedBy(command: {
  readonly recordedBy?: string;
  readonly context: ApplicationCommand["context"];
}): string {
  return command.recordedBy ?? command.context.actor.actorType;
}

function customerNotFound(customerId: CustomerId): InteractionApplicationError {
  return {
    code: "CustomerNotFound",
    message: `Customer ${customerId} was not found.`,
  };
}

function mapInteractionApplicationError(
  error: unknown
): InteractionApplicationError {
  if (error instanceof Error) {
    return {
      code: "ValidationFailed",
      message: error.message,
      cause: error,
    };
  }

  return {
    code: "ValidationFailed",
    message: "Interaction command failed validation.",
    cause: error,
  };
}
