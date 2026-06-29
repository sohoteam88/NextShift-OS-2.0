import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CustomerId } from "../customer";

export type LeadId = Brand<string, "LeadId">;
export type LeadSource = Brand<string, "LeadSource">;
export type QualificationScore = Brand<number, "QualificationScore">;

export type LeadStatus = "new" | "qualified" | "converted" | "closed";

export interface LeadSnapshot {
  readonly leadId: LeadId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: LeadSource;
  readonly status: LeadStatus;
  readonly qualificationScore?: QualificationScore;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly convertedAt?: Timestamp;
  readonly convertedCustomerId?: CustomerId;
  readonly closedAt?: Timestamp;
  readonly closeReason?: string;
}

export interface CreateLeadInput {
  readonly leadId: LeadId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source: string;
  readonly createdAt: Timestamp;
}

export interface UpdateLeadInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly source?: string;
  readonly updatedAt: Timestamp;
}

export interface LeadEventMetadata {
  readonly eventId: EventId;
  readonly eventType: LeadEventType;
  readonly aggregateId: LeadId;
  readonly aggregateType: "Lead";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type LeadEventType =
  | "LeadCreated"
  | "LeadUpdated"
  | "LeadQualified"
  | "LeadConverted"
  | "LeadClosed";

export interface LeadCreatedPayload {
  readonly leadId: LeadId;
  readonly source: LeadSource;
  readonly createdAt: Timestamp;
}

export interface LeadUpdatedPayload {
  readonly leadId: LeadId;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface LeadQualifiedPayload {
  readonly leadId: LeadId;
  readonly qualificationScore: QualificationScore;
  readonly qualifiedAt: Timestamp;
}

export interface LeadConvertedPayload {
  readonly leadId: LeadId;
  readonly customerId: CustomerId;
  readonly convertedAt: Timestamp;
}

export interface LeadClosedPayload {
  readonly leadId: LeadId;
  readonly reason?: string;
  readonly closedAt: Timestamp;
}

export interface LeadCreatedEvent extends LeadEventMetadata {
  readonly eventType: "LeadCreated";
  readonly payload: LeadCreatedPayload;
}

export interface LeadUpdatedEvent extends LeadEventMetadata {
  readonly eventType: "LeadUpdated";
  readonly payload: LeadUpdatedPayload;
}

export interface LeadQualifiedEvent extends LeadEventMetadata {
  readonly eventType: "LeadQualified";
  readonly payload: LeadQualifiedPayload;
}

export interface LeadConvertedEvent extends LeadEventMetadata {
  readonly eventType: "LeadConverted";
  readonly payload: LeadConvertedPayload;
}

export interface LeadClosedEvent extends LeadEventMetadata {
  readonly eventType: "LeadClosed";
  readonly payload: LeadClosedPayload;
}

export type LeadDomainEvent =
  | LeadCreatedEvent
  | LeadUpdatedEvent
  | LeadQualifiedEvent
  | LeadConvertedEvent
  | LeadClosedEvent;

export class Lead {
  private constructor(private readonly snapshot: LeadSnapshot) {}

  static create(input: CreateLeadInput): Lead {
    const contact = normalizeLeadContact({
      email: input.email,
      phone: input.phone,
    });

    return new Lead({
      leadId: input.leadId,
      businessId: input.businessId,
      displayName: normalizeDisplayName(input.displayName),
      email: contact.email,
      phone: contact.phone,
      source: createLeadSource(input.source),
      status: "new",
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    });
  }

  static rehydrate(snapshot: LeadSnapshot): Lead {
    validateSnapshot(snapshot);
    return new Lead(cloneSnapshot(snapshot));
  }

  get leadId(): LeadId {
    return this.snapshot.leadId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): LeadStatus {
    return this.snapshot.status;
  }

  update(input: UpdateLeadInput): void {
    this.assertMutable();

    const nextContact = normalizeLeadContact({
      email: input.email ?? this.snapshot.email,
      phone: input.phone ?? this.snapshot.phone,
    });

    const nextSnapshot: LeadSnapshot = {
      ...this.snapshot,
      displayName:
        input.displayName === undefined
          ? this.snapshot.displayName
          : normalizeDisplayName(input.displayName),
      email: nextContact.email,
      phone: nextContact.phone,
      source:
        input.source === undefined
          ? this.snapshot.source
          : createLeadSource(input.source),
      updatedAt: input.updatedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  qualify(score: number, qualifiedAt: Timestamp): void {
    if (this.snapshot.status !== "new") {
      throw new Error("Only new leads may be qualified.");
    }

    const qualificationScore = createQualificationScore(score);
    const nextSnapshot: LeadSnapshot = {
      ...this.snapshot,
      status: "qualified",
      qualificationScore,
      updatedAt: qualifiedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  convert(customerId: CustomerId, convertedAt: Timestamp): void {
    if (this.snapshot.status !== "qualified") {
      throw new Error("Only qualified leads may be converted.");
    }

    if (this.snapshot.convertedCustomerId) {
      throw new Error("Lead has already created a customer.");
    }

    const nextSnapshot: LeadSnapshot = {
      ...this.snapshot,
      status: "converted",
      convertedAt,
      convertedCustomerId: customerId,
      updatedAt: convertedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  close(closedAt: Timestamp, reason?: string): void {
    if (this.snapshot.status === "converted") {
      throw new Error("Converted leads cannot be closed.");
    }

    if (this.snapshot.status === "closed") {
      throw new Error("Closed leads cannot be reopened.");
    }

    const nextSnapshot: LeadSnapshot = {
      ...this.snapshot,
      status: "closed",
      updatedAt: closedAt,
      closedAt,
      closeReason: reason?.trim() || undefined,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  toSnapshot(): LeadSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "converted") {
      throw new Error("Converted leads cannot be modified.");
    }

    if (this.snapshot.status === "closed") {
      throw new Error("Closed leads cannot be reopened.");
    }
  }
}

export function createLeadSource(source: string): LeadSource {
  const normalized = source.trim();

  if (normalized.length === 0) {
    throw new Error("Lead source is required.");
  }

  return normalized as LeadSource;
}

export function createQualificationScore(score: number): QualificationScore {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error("Qualification score must be between 0 and 100.");
  }

  return score as QualificationScore;
}

function normalizeDisplayName(displayName: string): string {
  const normalized = displayName.trim();

  if (normalized.length === 0) {
    throw new Error("Lead display name is required.");
  }

  return normalized;
}

function normalizeLeadContact(input: {
  readonly email?: string;
  readonly phone?: string;
}): { readonly email?: string; readonly phone?: string } {
  const email = input.email?.trim().toLowerCase();
  const phone = input.phone?.trim();

  if (!email && !phone) {
    throw new Error("At least one contact method is required.");
  }

  return {
    email: email || undefined,
    phone: phone || undefined,
  };
}

function validateSnapshot(snapshot: LeadSnapshot): void {
  normalizeDisplayName(snapshot.displayName);
  createLeadSource(snapshot.source);
  normalizeLeadContact({ email: snapshot.email, phone: snapshot.phone });

  if (snapshot.qualificationScore !== undefined) {
    createQualificationScore(snapshot.qualificationScore);
  }

  if (snapshot.status === "converted") {
    if (!snapshot.convertedAt || !snapshot.convertedCustomerId) {
      throw new Error("Converted leads require conversion metadata.");
    }
  }

  if (snapshot.status === "closed" && !snapshot.closedAt) {
    throw new Error("Closed leads require a closedAt timestamp.");
  }
}

function cloneSnapshot(snapshot: LeadSnapshot): LeadSnapshot {
  return { ...snapshot };
}

function replaceSnapshot(target: LeadSnapshot, source: LeadSnapshot): void {
  Object.assign(target, cloneSnapshot(source));
}

export * from "./lead-repository";
export * from "./in-memory-lead-repository";
