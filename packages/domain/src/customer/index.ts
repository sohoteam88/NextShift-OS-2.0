import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type CustomerId = Brand<string, "CustomerId">;
export type CustomerName = Brand<string, "CustomerName">;

export type CustomerStatus = "active" | "archived";
export type CustomerType = "individual" | "organization";
export type CommunicationPreference = "email" | "phone";

export interface ContactInformation {
  readonly email?: string;
  readonly phone?: string;
}

export interface CustomerSnapshot {
  readonly customerId: CustomerId;
  readonly businessId: BusinessId;
  readonly displayName: CustomerName;
  readonly email?: string;
  readonly phone?: string;
  readonly status: CustomerStatus;
  readonly type: CustomerType;
  readonly communicationPreference: CommunicationPreference;
  readonly tags: readonly string[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly archivedAt?: Timestamp;
}

export interface CreateCustomerInput {
  readonly customerId: CustomerId;
  readonly businessId: BusinessId;
  readonly displayName: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly communicationPreference?: CommunicationPreference;
  readonly tags?: readonly string[];
  readonly createdAt: Timestamp;
}

export interface UpdateCustomerProfileInput {
  readonly displayName?: string;
  readonly email?: string;
  readonly phone?: string;
  readonly type?: CustomerType;
  readonly communicationPreference?: CommunicationPreference;
  readonly tags?: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface CustomerEventMetadata {
  readonly eventId: EventId;
  readonly eventType: CustomerEventType;
  readonly aggregateId: CustomerId;
  readonly aggregateType: "Customer";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type CustomerEventType =
  | "CustomerCreated"
  | "CustomerUpdated"
  | "CustomerArchived"
  | "CustomerRestored";

export interface CustomerCreatedPayload {
  readonly customerId: CustomerId;
  readonly customerName: CustomerName;
  readonly customerType: CustomerType;
  readonly status: CustomerStatus;
  readonly createdAt: Timestamp;
}

export interface CustomerUpdatedPayload {
  readonly customerId: CustomerId;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface CustomerArchivedPayload {
  readonly customerId: CustomerId;
  readonly archivedAt: Timestamp;
  readonly reason?: string;
}

export interface CustomerRestoredPayload {
  readonly customerId: CustomerId;
  readonly restoredAt: Timestamp;
}

export interface CustomerCreatedEvent extends CustomerEventMetadata {
  readonly eventType: "CustomerCreated";
  readonly payload: CustomerCreatedPayload;
}

export interface CustomerUpdatedEvent extends CustomerEventMetadata {
  readonly eventType: "CustomerUpdated";
  readonly payload: CustomerUpdatedPayload;
}

export interface CustomerArchivedEvent extends CustomerEventMetadata {
  readonly eventType: "CustomerArchived";
  readonly payload: CustomerArchivedPayload;
}

export interface CustomerRestoredEvent extends CustomerEventMetadata {
  readonly eventType: "CustomerRestored";
  readonly payload: CustomerRestoredPayload;
}

export type CustomerDomainEvent =
  | CustomerCreatedEvent
  | CustomerUpdatedEvent
  | CustomerArchivedEvent
  | CustomerRestoredEvent;

export class Customer {
  private constructor(private readonly snapshot: CustomerSnapshot) {}

  static create(input: CreateCustomerInput): Customer {
    const contact = normalizeContact(input);
    const displayName = createCustomerName(input.displayName);
    const communicationPreference =
      input.communicationPreference ?? inferCommunicationPreference(contact);

    assertCommunicationPreference(communicationPreference, contact);

    return new Customer({
      customerId: input.customerId,
      businessId: input.businessId,
      displayName,
      email: contact.email,
      phone: contact.phone,
      status: "active",
      type: input.type ?? "individual",
      communicationPreference,
      tags: normalizeTags(input.tags),
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
    });
  }

  static rehydrate(snapshot: CustomerSnapshot): Customer {
    validateSnapshot(snapshot);
    return new Customer(cloneSnapshot(snapshot));
  }

  get customerId(): CustomerId {
    return this.snapshot.customerId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): CustomerStatus {
    return this.snapshot.status;
  }

  updateProfile(input: UpdateCustomerProfileInput): void {
    this.assertMutable();

    const nextContact = normalizeContact({
      email: input.email ?? this.snapshot.email,
      phone: input.phone ?? this.snapshot.phone,
    });
    const nextPreference =
      input.communicationPreference ?? this.snapshot.communicationPreference;

    assertCommunicationPreference(nextPreference, nextContact);

    const nextSnapshot: CustomerSnapshot = {
      ...this.snapshot,
      displayName:
        input.displayName === undefined
          ? this.snapshot.displayName
          : createCustomerName(input.displayName),
      email: nextContact.email,
      phone: nextContact.phone,
      type: input.type ?? this.snapshot.type,
      communicationPreference: nextPreference,
      tags:
        input.tags === undefined ? this.snapshot.tags : normalizeTags(input.tags),
      updatedAt: input.updatedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  archive(archivedAt: Timestamp): void {
    if (this.snapshot.status === "archived") {
      return;
    }

    const nextSnapshot: CustomerSnapshot = {
      ...this.snapshot,
      status: "archived",
      updatedAt: archivedAt,
      archivedAt,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  restore(restoredAt: Timestamp): void {
    if (this.snapshot.status === "active") {
      return;
    }

    const nextSnapshot: CustomerSnapshot = {
      ...this.snapshot,
      status: "active",
      updatedAt: restoredAt,
      archivedAt: undefined,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  toSnapshot(): CustomerSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private assertMutable(): void {
    if (this.snapshot.status === "archived") {
      throw new Error("Archived customers cannot be modified.");
    }
  }
}

export function createCustomerName(displayName: string): CustomerName {
  const normalized = displayName.trim();

  if (normalized.length === 0) {
    throw new Error("Customer display name is required.");
  }

  return normalized as CustomerName;
}

function normalizeContact(input: ContactInformation): ContactInformation {
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

function inferCommunicationPreference(
  contact: ContactInformation
): CommunicationPreference {
  return contact.email ? "email" : "phone";
}

function assertCommunicationPreference(
  preference: CommunicationPreference,
  contact: ContactInformation
): void {
  if (preference === "email" && !contact.email) {
    throw new Error("Email communication preference requires an email address.");
  }

  if (preference === "phone" && !contact.phone) {
    throw new Error("Phone communication preference requires a phone number.");
  }
}

function normalizeTags(tags: readonly string[] | undefined): readonly string[] {
  return [...new Set((tags ?? []).map((tag) => tag.trim()).filter(Boolean))];
}

function validateSnapshot(snapshot: CustomerSnapshot): void {
  createCustomerName(snapshot.displayName);
  normalizeContact({ email: snapshot.email, phone: snapshot.phone });
  assertCommunicationPreference(snapshot.communicationPreference, {
    email: snapshot.email,
    phone: snapshot.phone,
  });

  if (snapshot.status === "archived" && !snapshot.archivedAt) {
    throw new Error("Archived customers require an archivedAt timestamp.");
  }
}

function cloneSnapshot(snapshot: CustomerSnapshot): CustomerSnapshot {
  return {
    ...snapshot,
    tags: [...snapshot.tags],
  };
}

function replaceSnapshot(
  target: CustomerSnapshot,
  source: CustomerSnapshot
): void {
  Object.assign(target, cloneSnapshot(source));
}

export * from "./customer-repository";
export * from "./in-memory-customer-repository";
