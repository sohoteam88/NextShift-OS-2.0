import type {
  CustomerId,
  FollowUpId,
  InteractionId,
  LeadId,
  SegmentId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  CRMIntegrationEventPublisher,
  InMemoryIntegrationReplayStore,
  IntegrationEventMapper,
  type CRMDomainEvent,
  type IntegrationEventId,
} from "../src/integration-events";

const eventId = "event-1" as EventId;
const correlationId = "correlation-1" as CorrelationId;
const causationId = "causation-1" as CausationId;
const occurredAt = "2026-06-27T00:00:00.000Z" as Timestamp;
const businessId = "business-1" as BusinessId;
const customerId = "customer-1" as CustomerId;
const leadId = "lead-1" as LeadId;
const interactionId = "interaction-1" as InteractionId;
const followUpId = "follow-up-1" as FollowUpId;
const segmentId = "segment-1" as SegmentId;

describe("IntegrationEventMapper", () => {
  it("maps every CRM domain event type into immutable integration events", () => {
    const integrationEventIds = sampleEvents().map(
      (_, index) => `integration-event-${index + 1}` as IntegrationEventId
    );
    const mapper = new IntegrationEventMapper(
      () => integrationEventIds.shift() ?? ("integration-event-next" as IntegrationEventId)
    );

    const mapped = sampleEvents().map((event) => mapper.map(event));

    expect(mapped.map((event) => event.eventType)).toEqual([
      "CustomerCreated",
      "CustomerUpdated",
      "CustomerArchived",
      "CustomerRestored",
      "LeadCreated",
      "LeadUpdated",
      "LeadQualified",
      "LeadConverted",
      "LeadClosed",
      "InteractionRecorded",
      "CustomerNoteAdded",
      "FollowUpScheduled",
      "FollowUpUpdated",
      "FollowUpCompleted",
      "FollowUpCancelled",
      "FollowUpOverdue",
      "SegmentCreated",
      "SegmentUpdated",
      "SegmentAssigned",
      "SegmentRemoved",
      "SegmentEvaluated",
    ]);
    expect(mapped[0]).toMatchObject({
      integrationEventId: "integration-event-1",
      eventType: "CustomerCreated",
      aggregateType: "Customer",
      aggregateId: customerId,
      occurredAt,
      correlationId,
      causationId,
      version: 1,
      payload: {
        customerId,
      },
    });
    expect(mapped.at(-1)).toMatchObject({
      eventType: "SegmentEvaluated",
      aggregateType: "Segment",
      aggregateId: segmentId,
      payload: {
        evaluatedCustomerIds: [customerId],
        assignedCustomerIds: [customerId],
      },
    });
    expect(Object.isFrozen(mapped[0])).toBe(true);
    expect(Object.isFrozen(mapped[0]?.payload)).toBe(true);
    expect(Object.isFrozen(mapped.at(-1)?.payload)).toBe(true);
    expect(mapped[0]?.serializedPayload).toContain("customer-1");
  });
});

describe("CRMIntegrationEventPublisher", () => {
  it("publishes mapped integration events into the replay store", async () => {
    const store = new InMemoryIntegrationReplayStore();
    const publisher = new CRMIntegrationEventPublisher(
      store,
      new IntegrationEventMapper(() => "integration-event-1" as IntegrationEventId)
    );

    const integrationEvent = await publisher.publish(sampleEvents()[0]);

    expect(integrationEvent).toMatchObject({
      integrationEventId: "integration-event-1",
      eventType: "CustomerCreated",
    });
    await expect(store.replay()).resolves.toMatchObject([
      {
        integrationEventId: "integration-event-1",
        eventType: "CustomerCreated",
      },
    ]);
  });

  it("preserves replay ordering", async () => {
    const store = new InMemoryIntegrationReplayStore();
    const publisher = new CRMIntegrationEventPublisher(
      store,
      new IntegrationEventMapper(nextIntegrationEventId())
    );

    await publisher.publishMany([
      customerUpdatedEvent(),
      leadQualifiedEvent(),
      segmentAssignedEvent(),
    ]);

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "CustomerUpdated",
      "LeadQualified",
      "SegmentAssigned",
    ]);
  });

  it("replays by aggregate and by event type", async () => {
    const store = new InMemoryIntegrationReplayStore();
    const publisher = new CRMIntegrationEventPublisher(
      store,
      new IntegrationEventMapper(nextIntegrationEventId())
    );

    await publisher.publishMany([
      customerUpdatedEvent(),
      customerArchivedEvent(),
      leadQualifiedEvent(),
    ]);

    await expect(store.replayByAggregate("Customer", customerId)).resolves.toMatchObject([
      { eventType: "CustomerUpdated", aggregateId: customerId },
      { eventType: "CustomerArchived", aggregateId: customerId },
    ]);
    await expect(store.replayByEventType("LeadQualified")).resolves.toMatchObject([
      { eventType: "LeadQualified", aggregateId: leadId },
    ]);
  });

  it("returns immutable replay output", async () => {
    const store = new InMemoryIntegrationReplayStore();
    const publisher = new CRMIntegrationEventPublisher(
      store,
      new IntegrationEventMapper(nextIntegrationEventId())
    );

    await publisher.publish(segmentEvaluatedEvent());

    const replayed = await store.replay();
    const payload = replayed[0]?.payload as {
      readonly evaluatedCustomerIds: readonly CustomerId[];
    };

    expect(Object.isFrozen(replayed)).toBe(true);
    expect(Object.isFrozen(replayed[0])).toBe(true);
    expect(Object.isFrozen(replayed[0]?.payload)).toBe(true);
    expect(Object.isFrozen(payload.evaluatedCustomerIds)).toBe(true);
  });
});

function nextIntegrationEventId() {
  let sequence = 0;

  return () => {
    sequence += 1;
    return `integration-event-${sequence}` as IntegrationEventId;
  };
}

function sampleEvents(): CRMDomainEvent[] {
  return [
    customerCreatedEvent(),
    customerUpdatedEvent(),
    customerArchivedEvent(),
    customerRestoredEvent(),
    leadCreatedEvent(),
    leadUpdatedEvent(),
    leadQualifiedEvent(),
    leadConvertedEvent(),
    leadClosedEvent(),
    interactionRecordedEvent(),
    customerNoteAddedEvent(),
    followUpScheduledEvent(),
    followUpUpdatedEvent(),
    followUpCompletedEvent(),
    followUpCancelledEvent(),
    followUpOverdueEvent(),
    segmentCreatedEvent(),
    segmentUpdatedEvent(),
    segmentAssignedEvent(),
    segmentRemovedEvent(),
    segmentEvaluatedEvent(),
  ];
}

function baseEvent() {
  return {
    eventId,
    occurredAt,
    version: 1 as const,
    correlationId,
    causationId,
  };
}

function customerCreatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CustomerCreated",
    aggregateId: customerId,
    aggregateType: "Customer",
    payload: {
      customerId,
      customerName: "Acme Buyer",
      customerType: "organization",
      status: "active",
      createdAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function customerUpdatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CustomerUpdated",
    aggregateId: customerId,
    aggregateType: "Customer",
    payload: {
      customerId,
      updatedFields: ["displayName"],
      updatedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function customerArchivedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CustomerArchived",
    aggregateId: customerId,
    aggregateType: "Customer",
    payload: {
      customerId,
      archivedAt: occurredAt,
      reason: "Duplicate",
    },
  } as CRMDomainEvent;
}

function customerRestoredEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CustomerRestored",
    aggregateId: customerId,
    aggregateType: "Customer",
    payload: {
      customerId,
      restoredAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function leadCreatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "LeadCreated",
    aggregateId: leadId,
    aggregateType: "Lead",
    payload: {
      leadId,
      source: "webinar",
      createdAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function leadUpdatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "LeadUpdated",
    aggregateId: leadId,
    aggregateType: "Lead",
    payload: {
      leadId,
      updatedFields: ["source"],
      updatedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function leadQualifiedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "LeadQualified",
    aggregateId: leadId,
    aggregateType: "Lead",
    payload: {
      leadId,
      qualificationScore: 88,
      qualifiedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function leadConvertedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "LeadConverted",
    aggregateId: leadId,
    aggregateType: "Lead",
    payload: {
      leadId,
      customerId,
      convertedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function leadClosedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "LeadClosed",
    aggregateId: leadId,
    aggregateType: "Lead",
    payload: {
      leadId,
      reason: "Not a fit",
      closedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function interactionRecordedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "InteractionRecorded",
    aggregateId: interactionId,
    aggregateType: "Interaction",
    payload: {
      interactionId,
      customerId,
      interactionType: "call",
      interactionChannel: "phone",
      outcome: "connected",
      note: "Discussed renewal",
      occurredAt,
      recordedBy: "user-1",
    },
  } as CRMDomainEvent;
}

function customerNoteAddedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CustomerNoteAdded",
    aggregateId: interactionId,
    aggregateType: "Interaction",
    payload: {
      interactionId,
      customerId,
      note: "Important account",
      occurredAt,
      recordedBy: "user-1",
    },
  } as CRMDomainEvent;
}

function followUpScheduledEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "FollowUpScheduled",
    aggregateId: followUpId,
    aggregateType: "FollowUp",
    payload: {
      followUpId,
      customerId,
      interactionId,
      title: "Call owner",
      priority: "high",
      dueAt: occurredAt,
      assignedTo: "user-1",
      scheduledAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function followUpUpdatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "FollowUpUpdated",
    aggregateId: followUpId,
    aggregateType: "FollowUp",
    payload: {
      followUpId,
      updatedFields: ["priority"],
      updatedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function followUpCompletedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "FollowUpCompleted",
    aggregateId: followUpId,
    aggregateType: "FollowUp",
    payload: {
      followUpId,
      completedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function followUpCancelledEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "FollowUpCancelled",
    aggregateId: followUpId,
    aggregateType: "FollowUp",
    payload: {
      followUpId,
      cancelledAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function followUpOverdueEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "FollowUpOverdue",
    aggregateId: followUpId,
    aggregateType: "FollowUp",
    payload: {
      followUpId,
      customerId,
      dueAt: occurredAt,
      detectedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function segmentCreatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "SegmentCreated",
    aggregateId: segmentId,
    aggregateType: "Segment",
    payload: {
      segmentId,
      businessId,
      name: "VIP Customers",
      rule: { ruleType: "manual" },
      createdAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function segmentUpdatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "SegmentUpdated",
    aggregateId: segmentId,
    aggregateType: "Segment",
    payload: {
      segmentId,
      updatedFields: ["name"],
      updatedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function segmentAssignedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "SegmentAssigned",
    aggregateId: segmentId,
    aggregateType: "Segment",
    payload: {
      segmentId,
      customerId,
      assignmentSource: "manual",
      assignedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function segmentRemovedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "SegmentRemoved",
    aggregateId: segmentId,
    aggregateType: "Segment",
    payload: {
      segmentId,
      customerId,
      removedAt: occurredAt,
    },
  } as CRMDomainEvent;
}

function segmentEvaluatedEvent(): CRMDomainEvent {
  return {
    ...baseEvent(),
    eventType: "SegmentEvaluated",
    aggregateId: segmentId,
    aggregateType: "Segment",
    payload: {
      segmentId,
      evaluatedCustomerIds: [customerId],
      assignedCustomerIds: [customerId],
      evaluatedAt: occurredAt,
    },
  } as CRMDomainEvent;
}
