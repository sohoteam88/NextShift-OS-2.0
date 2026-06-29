import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import type { CustomerId } from "../customer";

export type SegmentId = Brand<string, "SegmentId">;
export type SegmentName = Brand<string, "SegmentName">;
export type SegmentStatus = "active" | "inactive";
export type SegmentAssignmentSource = "manual" | "rule";

export interface SegmentRule {
  readonly ruleType: "manual" | "all";
  readonly criteria?: Readonly<Record<string, string | number | boolean>>;
}

export interface SegmentMembershipSnapshot {
  readonly customerId: CustomerId;
  readonly assignedAt: Timestamp;
  readonly assignmentSource: SegmentAssignmentSource;
  readonly removedAt?: Timestamp;
}

export interface SegmentSnapshot {
  readonly segmentId: SegmentId;
  readonly businessId: BusinessId;
  readonly name: SegmentName;
  readonly description?: string;
  readonly rule: SegmentRule;
  readonly status: SegmentStatus;
  readonly memberships: readonly SegmentMembershipSnapshot[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateSegmentInput {
  readonly segmentId: SegmentId;
  readonly businessId: BusinessId;
  readonly name: string;
  readonly description?: string;
  readonly rule?: SegmentRule;
  readonly createdAt: Timestamp;
}

export interface UpdateSegmentInput {
  readonly name?: string;
  readonly description?: string;
  readonly rule?: SegmentRule;
  readonly active?: boolean;
  readonly updatedAt: Timestamp;
}

export interface SegmentEventMetadata {
  readonly eventId: EventId;
  readonly eventType: SegmentEventType;
  readonly aggregateId: SegmentId;
  readonly aggregateType: "Segment";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type SegmentEventType =
  | "SegmentCreated"
  | "SegmentUpdated"
  | "SegmentAssigned"
  | "SegmentRemoved"
  | "SegmentEvaluated";

export interface SegmentCreatedPayload {
  readonly segmentId: SegmentId;
  readonly businessId: BusinessId;
  readonly name: SegmentName;
  readonly rule: SegmentRule;
  readonly createdAt: Timestamp;
}

export interface SegmentUpdatedPayload {
  readonly segmentId: SegmentId;
  readonly updatedFields: readonly string[];
  readonly updatedAt: Timestamp;
}

export interface SegmentAssignedPayload {
  readonly segmentId: SegmentId;
  readonly customerId: CustomerId;
  readonly assignmentSource: SegmentAssignmentSource;
  readonly assignedAt: Timestamp;
}

export interface SegmentRemovedPayload {
  readonly segmentId: SegmentId;
  readonly customerId: CustomerId;
  readonly removedAt: Timestamp;
}

export interface SegmentEvaluatedPayload {
  readonly segmentId: SegmentId;
  readonly evaluatedCustomerIds: readonly CustomerId[];
  readonly assignedCustomerIds: readonly CustomerId[];
  readonly evaluatedAt: Timestamp;
}

export interface SegmentCreatedEvent extends SegmentEventMetadata {
  readonly eventType: "SegmentCreated";
  readonly payload: SegmentCreatedPayload;
}

export interface SegmentUpdatedEvent extends SegmentEventMetadata {
  readonly eventType: "SegmentUpdated";
  readonly payload: SegmentUpdatedPayload;
}

export interface SegmentAssignedEvent extends SegmentEventMetadata {
  readonly eventType: "SegmentAssigned";
  readonly payload: SegmentAssignedPayload;
}

export interface SegmentRemovedEvent extends SegmentEventMetadata {
  readonly eventType: "SegmentRemoved";
  readonly payload: SegmentRemovedPayload;
}

export interface SegmentEvaluatedEvent extends SegmentEventMetadata {
  readonly eventType: "SegmentEvaluated";
  readonly payload: SegmentEvaluatedPayload;
}

export type SegmentDomainEvent =
  | SegmentCreatedEvent
  | SegmentUpdatedEvent
  | SegmentAssignedEvent
  | SegmentRemovedEvent
  | SegmentEvaluatedEvent;

export class Segment {
  private constructor(private readonly snapshot: SegmentSnapshot) {}

  static create(input: CreateSegmentInput): Segment {
    const snapshot: SegmentSnapshot = {
      segmentId: input.segmentId,
      businessId: input.businessId,
      name: createSegmentName(input.name),
      description: normalizeOptionalText(input.description),
      rule: createSegmentRule(input.rule ?? { ruleType: "manual" }),
      status: "active",
      memberships: [],
      createdAt: createTimestamp(input.createdAt, "createdAt"),
      updatedAt: createTimestamp(input.createdAt, "updatedAt"),
    };

    validateSnapshot(snapshot);
    return new Segment(snapshot);
  }

  static rehydrate(snapshot: SegmentSnapshot): Segment {
    validateSnapshot(snapshot);
    return new Segment(cloneSnapshot(snapshot));
  }

  get segmentId(): SegmentId {
    return this.snapshot.segmentId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get status(): SegmentStatus {
    return this.snapshot.status;
  }

  update(input: UpdateSegmentInput): void {
    const nextSnapshot: SegmentSnapshot = {
      ...this.snapshot,
      name:
        input.name === undefined
          ? this.snapshot.name
          : createSegmentName(input.name),
      description:
        input.description === undefined
          ? this.snapshot.description
          : normalizeOptionalText(input.description),
      rule:
        input.rule === undefined
          ? this.snapshot.rule
          : createSegmentRule(input.rule),
      status:
        input.active === undefined
          ? this.snapshot.status
          : input.active
            ? "active"
            : "inactive",
      updatedAt: createTimestamp(input.updatedAt, "updatedAt"),
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  assignCustomer(
    customerId: CustomerId,
    assignedAt: Timestamp,
    assignmentSource: SegmentAssignmentSource = "manual"
  ): void {
    this.assertActive();

    if (this.hasActiveMembership(customerId)) {
      throw new Error("Customer is already assigned to this segment.");
    }

    const nextSnapshot: SegmentSnapshot = {
      ...this.snapshot,
      memberships: [
        ...this.snapshot.memberships,
        {
          customerId,
          assignedAt: createTimestamp(assignedAt, "assignedAt"),
          assignmentSource,
        },
      ],
      updatedAt: createTimestamp(assignedAt, "updatedAt"),
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  removeCustomer(customerId: CustomerId, removedAt: Timestamp): void {
    const timestamp = createTimestamp(removedAt, "removedAt");
    let removed = false;

    const memberships = this.snapshot.memberships.map((membership) => {
      if (membership.customerId !== customerId || membership.removedAt) {
        return membership;
      }

      removed = true;
      return {
        ...membership,
        removedAt: timestamp,
      };
    });

    if (!removed) {
      return;
    }

    const nextSnapshot: SegmentSnapshot = {
      ...this.snapshot,
      memberships,
      updatedAt: timestamp,
    };

    validateSnapshot(nextSnapshot);
    replaceSnapshot(this.snapshot, nextSnapshot);
  }

  evaluate(
    customerIds: readonly CustomerId[],
    evaluatedAt: Timestamp
  ): readonly CustomerId[] {
    this.assertActive();

    const assignedCustomerIds: CustomerId[] = [];

    if (this.snapshot.rule.ruleType === "all") {
      for (const customerId of customerIds) {
        if (!this.hasActiveMembership(customerId)) {
          this.assignCustomer(customerId, evaluatedAt, "rule");
          assignedCustomerIds.push(customerId);
        }
      }
    }

    return assignedCustomerIds;
  }

  listMembers(): readonly SegmentMembershipSnapshot[] {
    return this.snapshot.memberships
      .filter((membership) => !membership.removedAt)
      .map(cloneMembership);
  }

  toSnapshot(): SegmentSnapshot {
    return cloneSnapshot(this.snapshot);
  }

  private hasActiveMembership(customerId: CustomerId): boolean {
    return this.snapshot.memberships.some(
      (membership) => membership.customerId === customerId && !membership.removedAt
    );
  }

  private assertActive(): void {
    if (this.snapshot.status !== "active") {
      throw new Error("Inactive segments cannot accept assignments.");
    }
  }
}

export function createSegmentName(name: string): SegmentName {
  const normalized = name.trim();

  if (normalized.length === 0) {
    throw new Error("Segment name is required.");
  }

  return normalized as SegmentName;
}

export function createSegmentRule(rule: SegmentRule): SegmentRule {
  if (rule.ruleType !== "manual" && rule.ruleType !== "all") {
    throw new Error("Segment rule must be manual or all.");
  }

  return {
    ruleType: rule.ruleType,
    criteria: rule.criteria === undefined ? undefined : { ...rule.criteria },
  };
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function createTimestamp(value: Timestamp, fieldName: string): Timestamp {
  if (!Number.isFinite(Date.parse(value))) {
    throw new Error(`Segment ${fieldName} must be a valid timestamp.`);
  }

  return value;
}

function validateSnapshot(snapshot: SegmentSnapshot): void {
  createSegmentName(snapshot.name);
  createSegmentRule(snapshot.rule);
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");

  for (const membership of snapshot.memberships) {
    createTimestamp(membership.assignedAt, "assignedAt");

    if (membership.removedAt) {
      createTimestamp(membership.removedAt, "removedAt");
    }
  }

  const activeCustomerIds = new Set<CustomerId>();

  for (const membership of snapshot.memberships) {
    if (membership.removedAt) {
      continue;
    }

    if (activeCustomerIds.has(membership.customerId)) {
      throw new Error("Duplicate active segment membership is prohibited.");
    }

    activeCustomerIds.add(membership.customerId);
  }
}

function cloneSnapshot(snapshot: SegmentSnapshot): SegmentSnapshot {
  return {
    ...snapshot,
    rule: createSegmentRule(snapshot.rule),
    memberships: snapshot.memberships.map(cloneMembership),
  };
}

function cloneMembership(
  membership: SegmentMembershipSnapshot
): SegmentMembershipSnapshot {
  return { ...membership };
}

function replaceSnapshot(target: SegmentSnapshot, source: SegmentSnapshot): void {
  Object.assign(target, cloneSnapshot(source));
}

export * from "./segment-repository";
export * from "./in-memory-segment-repository";
