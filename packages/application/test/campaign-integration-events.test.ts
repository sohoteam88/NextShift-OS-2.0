import type {
  CampaignDomainEvent,
  CampaignId,
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
  CampaignIntegrationEventMapper,
  CampaignIntegrationEventPublisher,
  InMemoryCampaignIntegrationReplayStore,
  type CampaignIntegrationEventId,
} from "../src/integration-events/campaign";

const eventId = "event-1" as EventId;
const correlationId = "correlation-1" as CorrelationId;
const causationId = "causation-1" as CausationId;
const occurredAt = "2026-06-28T00:00:00.000Z" as Timestamp;
const businessId = "business-1" as BusinessId;
const campaignId = "campaign-1" as CampaignId;

describe("CampaignIntegrationEventMapper", () => {
  it("maps every campaign domain event type into immutable integration events", () => {
    const integrationEventIds = sampleEvents().map(
      (_, index) =>
        `campaign-integration-event-${index + 1}` as CampaignIntegrationEventId
    );
    const mapper = new CampaignIntegrationEventMapper(
      () =>
        integrationEventIds.shift() ??
        ("campaign-integration-event-next" as CampaignIntegrationEventId)
    );

    const mapped = sampleEvents().map((event) => mapper.map(event));

    expect(mapped.map((event) => event.eventType)).toEqual([
      "CampaignCreated",
      "CampaignUpdated",
      "CampaignLaunched",
      "CampaignPaused",
      "CampaignResumed",
      "CampaignCompleted",
      "CampaignArchived",
      "CampaignRestored",
    ]);
    expect(mapped[0]).toMatchObject({
      integrationEventId: "campaign-integration-event-1",
      eventId,
      eventType: "CampaignCreated",
      aggregateType: "Campaign",
      aggregateId: campaignId,
      occurredAt,
      correlationId,
      causationId,
      version: 1,
      payload: {
        campaignId,
        businessId,
        name: "90 Day Launch Campaign",
        channels: ["instagram", "email"],
      },
    });
    expect(mapped.at(-1)).toMatchObject({
      eventType: "CampaignRestored",
      payload: {
        campaignId,
        restoredAt: occurredAt,
      },
    });
    expect(Object.isFrozen(mapped[0])).toBe(true);
    expect(Object.isFrozen(mapped[0]?.payload)).toBe(true);
    expect(Object.isFrozen((mapped[0]?.payload as { readonly channels: readonly string[] }).channels)).toBe(true);
    expect(mapped[0]?.serializedPayload).toContain("90 Day Launch Campaign");
  });

  it("rejects unsupported event types defensively", () => {
    const mapper = new CampaignIntegrationEventMapper(
      () => "campaign-integration-event-1" as CampaignIntegrationEventId
    );

    expect(() =>
      mapper.map({
        ...baseEvent(),
        eventType: "CampaignUnsupported",
        aggregateType: "Campaign",
        aggregateId: campaignId,
        payload: {},
      } as unknown as CampaignDomainEvent)
    ).toThrow("Unsupported campaign integration event: CampaignUnsupported.");
  });
});

describe("CampaignIntegrationEventPublisher", () => {
  it("publishes mapped integration events into the replay store", async () => {
    const store = new InMemoryCampaignIntegrationReplayStore();
    const publisher = new CampaignIntegrationEventPublisher(
      store,
      new CampaignIntegrationEventMapper(
        () => "campaign-integration-event-1" as CampaignIntegrationEventId
      )
    );

    const integrationEvent = await publisher.publish(campaignCreatedEvent());

    expect(integrationEvent).toMatchObject({
      integrationEventId: "campaign-integration-event-1",
      eventType: "CampaignCreated",
      eventId,
    });
    await expect(store.replay()).resolves.toMatchObject([
      {
        integrationEventId: "campaign-integration-event-1",
        eventType: "CampaignCreated",
      },
    ]);
  });

  it("preserves replay ordering", async () => {
    const store = new InMemoryCampaignIntegrationReplayStore();
    const publisher = new CampaignIntegrationEventPublisher(
      store,
      new CampaignIntegrationEventMapper(nextCampaignIntegrationEventId())
    );

    await publisher.publishMany([
      campaignUpdatedEvent(),
      campaignLaunchedEvent(),
      campaignCompletedEvent(),
    ]);

    const replayed = await store.replay();

    expect(replayed.map((event) => event.eventType)).toEqual([
      "CampaignUpdated",
      "CampaignLaunched",
      "CampaignCompleted",
    ]);
  });

  it("replays by aggregate and by event type", async () => {
    const store = new InMemoryCampaignIntegrationReplayStore();
    const publisher = new CampaignIntegrationEventPublisher(
      store,
      new CampaignIntegrationEventMapper(nextCampaignIntegrationEventId())
    );

    await publisher.publishMany([
      campaignLaunchedEvent(),
      campaignPausedEvent(),
      campaignRestoredEvent(),
    ]);

    await expect(store.replayByAggregate("Campaign", campaignId)).resolves.toMatchObject([
      { eventType: "CampaignLaunched", aggregateId: campaignId },
      { eventType: "CampaignPaused", aggregateId: campaignId },
      { eventType: "CampaignRestored", aggregateId: campaignId },
    ]);
    await expect(store.replayByEventType("CampaignPaused")).resolves.toMatchObject([
      { eventType: "CampaignPaused", aggregateId: campaignId },
    ]);
  });

  it("returns immutable replay output", async () => {
    const store = new InMemoryCampaignIntegrationReplayStore();
    const publisher = new CampaignIntegrationEventPublisher(
      store,
      new CampaignIntegrationEventMapper(nextCampaignIntegrationEventId())
    );

    await publisher.publish(campaignCreatedEvent());

    const replayed = await store.replay();
    const payload = replayed[0]?.payload as {
      readonly channels: readonly string[];
    };

    expect(Object.isFrozen(replayed)).toBe(true);
    expect(Object.isFrozen(replayed[0])).toBe(true);
    expect(Object.isFrozen(replayed[0]?.payload)).toBe(true);
    expect(Object.isFrozen(payload.channels)).toBe(true);
  });
});

function nextCampaignIntegrationEventId() {
  let sequence = 0;

  return () => {
    sequence += 1;
    return `campaign-integration-event-${sequence}` as CampaignIntegrationEventId;
  };
}

function sampleEvents(): CampaignDomainEvent[] {
  return [
    campaignCreatedEvent(),
    campaignUpdatedEvent(),
    campaignLaunchedEvent(),
    campaignPausedEvent(),
    campaignResumedEvent(),
    campaignCompletedEvent(),
    campaignArchivedEvent(),
    campaignRestoredEvent(),
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

function campaignCreatedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignCreated",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      businessId,
      name: "90 Day Launch Campaign",
      objective: "Generate qualified leads.",
      channels: ["instagram", "email"],
      createdAt: occurredAt,
    },
  } as CampaignDomainEvent;
}

function campaignUpdatedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignUpdated",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      updatedFields: ["name", "objective"],
      updatedAt: occurredAt,
    },
  };
}

function campaignLaunchedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignLaunched",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      launchedAt: occurredAt,
    },
  };
}

function campaignPausedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignPaused",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      pausedAt: occurredAt,
    },
  };
}

function campaignResumedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignResumed",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      resumedAt: occurredAt,
    },
  };
}

function campaignCompletedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignCompleted",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      completedAt: occurredAt,
    },
  };
}

function campaignArchivedEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignArchived",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      archivedAt: occurredAt,
    },
  };
}

function campaignRestoredEvent(): CampaignDomainEvent {
  return {
    ...baseEvent(),
    eventType: "CampaignRestored",
    aggregateId: campaignId,
    aggregateType: "Campaign",
    payload: {
      campaignId,
      restoredAt: occurredAt,
    },
  };
}
