import type {
  Brand,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CustomerId } from "../customer";

export type InteractionId = Brand<string, "InteractionId">;
export type InteractionChannel = Brand<string, "InteractionChannel">;
export type InteractionOutcome = Brand<string, "InteractionOutcome">;
export type InteractionTimestamp = Timestamp;

export type InteractionType =
  | "call"
  | "meeting"
  | "email"
  | "whatsapp"
  | "sms"
  | "visit"
  | "note";

export interface InteractionSnapshot {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly interactionType: InteractionType;
  readonly interactionChannel: InteractionChannel;
  readonly outcome?: InteractionOutcome;
  readonly note?: string;
  readonly occurredAt: InteractionTimestamp;
  readonly recordedBy: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CreateInteractionInput {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly interactionType: string;
  readonly interactionChannel: string;
  readonly outcome?: string;
  readonly note?: string;
  readonly occurredAt: Timestamp;
  readonly recordedBy: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CreateCustomerNoteInput {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly note: string;
  readonly occurredAt: Timestamp;
  readonly recordedBy: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface InteractionEventMetadata {
  readonly eventId: EventId;
  readonly eventType: InteractionEventType;
  readonly aggregateId: InteractionId;
  readonly aggregateType: "Interaction";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type InteractionEventType = "InteractionRecorded" | "CustomerNoteAdded";

export interface InteractionRecordedPayload {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly interactionType: InteractionType;
  readonly interactionChannel: InteractionChannel;
  readonly outcome?: InteractionOutcome;
  readonly note?: string;
  readonly occurredAt: Timestamp;
  readonly recordedBy: string;
}

export interface CustomerNoteAddedPayload {
  readonly interactionId: InteractionId;
  readonly customerId: CustomerId;
  readonly note: string;
  readonly occurredAt: Timestamp;
  readonly recordedBy: string;
}

export interface InteractionRecordedEvent extends InteractionEventMetadata {
  readonly eventType: "InteractionRecorded";
  readonly payload: InteractionRecordedPayload;
}

export interface CustomerNoteAddedEvent extends InteractionEventMetadata {
  readonly eventType: "CustomerNoteAdded";
  readonly payload: CustomerNoteAddedPayload;
}

export type InteractionDomainEvent =
  | InteractionRecordedEvent
  | CustomerNoteAddedEvent;

export class Interaction {
  private constructor(private readonly snapshot: InteractionSnapshot) {}

  static record(input: CreateInteractionInput): Interaction {
    const snapshot: InteractionSnapshot = {
      interactionId: input.interactionId,
      customerId: input.customerId,
      interactionType: createInteractionType(input.interactionType),
      interactionChannel: createInteractionChannel(input.interactionChannel),
      outcome:
        input.outcome === undefined
          ? undefined
          : createInteractionOutcome(input.outcome),
      note:
        input.note === undefined ? undefined : normalizeOptionalNote(input.note),
      occurredAt: createInteractionTimestamp(input.occurredAt),
      recordedBy: normalizeRecordedBy(input.recordedBy),
      metadata: cloneMetadata(input.metadata),
    };

    validateSnapshot(snapshot);
    return new Interaction(snapshot);
  }

  static addNote(input: CreateCustomerNoteInput): Interaction {
    const note = normalizeRequiredNote(input.note);

    return new Interaction({
      interactionId: input.interactionId,
      customerId: input.customerId,
      interactionType: "note",
      interactionChannel: createInteractionChannel("note"),
      outcome: createInteractionOutcome("noted"),
      note,
      occurredAt: createInteractionTimestamp(input.occurredAt),
      recordedBy: normalizeRecordedBy(input.recordedBy),
      metadata: cloneMetadata(input.metadata),
    });
  }

  static rehydrate(snapshot: InteractionSnapshot): Interaction {
    validateSnapshot(snapshot);
    return new Interaction(cloneSnapshot(snapshot));
  }

  get interactionId(): InteractionId {
    return this.snapshot.interactionId;
  }

  get customerId(): CustomerId {
    return this.snapshot.customerId;
  }

  get occurredAt(): Timestamp {
    return this.snapshot.occurredAt;
  }

  toSnapshot(): InteractionSnapshot {
    return cloneSnapshot(this.snapshot);
  }
}

export function createInteractionType(
  interactionType: string
): InteractionType {
  const normalized = interactionType.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new Error("Interaction type is required.");
  }

  if (!isInteractionType(normalized)) {
    throw new Error(`Unsupported interaction type: ${interactionType}.`);
  }

  return normalized;
}

export function createInteractionChannel(
  interactionChannel: string
): InteractionChannel {
  const normalized = interactionChannel.trim().toLowerCase();

  if (normalized.length === 0) {
    throw new Error("Interaction channel is required.");
  }

  return normalized as InteractionChannel;
}

export function createInteractionOutcome(
  outcome: string
): InteractionOutcome {
  const normalized = outcome.trim();

  if (normalized.length === 0) {
    throw new Error("Interaction outcome is required.");
  }

  return normalized as InteractionOutcome;
}

export function createInteractionTimestamp(
  occurredAt: Timestamp
): InteractionTimestamp {
  const value = Date.parse(occurredAt);

  if (!Number.isFinite(value)) {
    throw new Error("Interaction timestamp must be a valid timestamp.");
  }

  return occurredAt;
}

function isInteractionType(value: string): value is InteractionType {
  return [
    "call",
    "meeting",
    "email",
    "whatsapp",
    "sms",
    "visit",
    "note",
  ].includes(value);
}

function normalizeRecordedBy(recordedBy: string): string {
  const normalized = recordedBy.trim();

  if (normalized.length === 0) {
    throw new Error("Interaction recordedBy is required.");
  }

  return normalized;
}

function normalizeOptionalNote(note: string): string | undefined {
  const normalized = note.trim();
  return normalized.length === 0 ? undefined : normalized;
}

function normalizeRequiredNote(note: string): string {
  const normalized = note.trim();

  if (normalized.length === 0) {
    throw new Error("Customer note is required.");
  }

  return normalized;
}

function validateSnapshot(snapshot: InteractionSnapshot): void {
  createInteractionType(snapshot.interactionType);
  createInteractionChannel(snapshot.interactionChannel);
  createInteractionTimestamp(snapshot.occurredAt);
  normalizeRecordedBy(snapshot.recordedBy);

  if (snapshot.outcome !== undefined) {
    createInteractionOutcome(snapshot.outcome);
  }

  if (snapshot.interactionType === "note") {
    normalizeRequiredNote(snapshot.note ?? "");
  }
}

function cloneSnapshot(snapshot: InteractionSnapshot): InteractionSnapshot {
  return {
    ...snapshot,
    metadata: cloneMetadata(snapshot.metadata),
  };
}

function cloneMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined
): Readonly<Record<string, unknown>> | undefined {
  return metadata === undefined ? undefined : { ...metadata };
}

export * from "./interaction-repository";
export * from "./in-memory-interaction-repository";
