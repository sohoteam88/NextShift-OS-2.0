import {
  InMemoryCustomerRepository,
  InMemoryInteractionRepository,
  type CustomerDomainEvent,
  type CustomerId,
  type InteractionDomainEvent,
  type InteractionId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  CustomerApplicationService,
  type CustomerEventPublisher,
} from "../src/customer";
import {
  InteractionApplicationService,
  type InteractionEventPublisher,
} from "../src/interaction";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const customerId = "customer-1" as CustomerId;
const interactionId = "interaction-1" as InteractionId;
const noteInteractionId = "interaction-note-1" as InteractionId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingInteractionEventPublisher implements InteractionEventPublisher {
  readonly events: InteractionDomainEvent[] = [];

  async publish(event: InteractionDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

class RecordingCustomerEventPublisher implements CustomerEventPublisher {
  readonly events: CustomerDomainEvent[] = [];

  async publish(event: CustomerDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const customerRepository = new InMemoryCustomerRepository();
  const interactionRepository = new InMemoryInteractionRepository();
  const customerPublisher = new RecordingCustomerEventPublisher();
  const interactionPublisher = new RecordingInteractionEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
  ];
  const interactionIds = [interactionId, noteInteractionId];
  const customerService = new CustomerApplicationService(
    customerRepository,
    customerPublisher,
    () => timestamps.shift() ?? "2026-06-27T05:00:00.000Z",
    () => eventId,
    () => customerId
  );
  const interactionService = new InteractionApplicationService(
    interactionRepository,
    interactionPublisher,
    customerService,
    () => timestamps.shift() ?? "2026-06-27T05:00:00.000Z",
    () => eventId,
    () => interactionIds.shift() ?? ("interaction-next" as InteractionId)
  );

  return {
    customerRepository,
    customerService,
    interactionPublisher,
    interactionRepository,
    interactionService,
  };
}

async function createCustomer(service: CustomerApplicationService) {
  return service.createCustomer({
    commandType: "CreateCustomer",
    context,
    customerId,
    displayName: "Acme Customer",
    email: "customer@example.com",
  });
}

describe("InteractionApplicationService", () => {
  it("records and persists an interaction", async () => {
    const {
      customerService,
      interactionPublisher,
      interactionRepository,
      interactionService,
    } = createService();

    await createCustomer(customerService);

    const result = await interactionService.recordInteraction({
      commandType: "RecordInteraction",
      context,
      customerId,
      interactionType: "Call",
      interactionChannel: "Phone",
      outcome: "Booked demo",
      note: "Customer asked about onboarding.",
      recordedBy: "user-1",
    });

    expect(result.ok).toBe(true);
    expect(await interactionRepository.findById(interactionId)).not.toBeNull();
    expect(interactionPublisher.events).toHaveLength(1);
    expect(interactionPublisher.events[0]).toMatchObject({
      eventType: "InteractionRecorded",
      aggregateId: interactionId,
      aggregateType: "Interaction",
      eventId,
      correlationId,
      version: 1,
      payload: {
        customerId,
        interactionType: "call",
        interactionChannel: "phone",
      },
    });
  });

  it("adds customer notes to the timeline", async () => {
    const { customerService, interactionPublisher, interactionService } =
      createService();

    await createCustomer(customerService);

    const result = await interactionService.addCustomerNote({
      commandType: "AddCustomerNote",
      context,
      customerId,
      note: "Prefers monthly check-ins.",
      recordedBy: "user-1",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.interaction.toSnapshot()).toMatchObject({
        interactionType: "note",
        note: "Prefers monthly check-ins.",
      });
    }

    expect(interactionPublisher.events.at(-1)).toMatchObject({
      eventType: "CustomerNoteAdded",
      payload: {
        customerId,
        note: "Prefers monthly check-ins.",
      },
    });
  });

  it("retrieves a customer timeline", async () => {
    const { customerService, interactionService } = createService();

    await createCustomer(customerService);
    await interactionService.recordInteraction({
      commandType: "RecordInteraction",
      context,
      customerId,
      interactionType: "Email",
      interactionChannel: "Email",
      outcome: "Sent proposal",
      occurredAt: "2026-06-27T03:00:00.000Z",
      recordedBy: "user-1",
    });
    await interactionService.addCustomerNote({
      commandType: "AddCustomerNote",
      context,
      customerId,
      note: "Budget confirmed.",
      occurredAt: "2026-06-27T02:00:00.000Z",
      recordedBy: "user-1",
    });

    const timeline = await interactionService.getTimeline({
      queryType: "GetCustomerTimeline",
      context,
      customerId,
    });

    expect(
      timeline.interactions.map(
        (interaction) => interaction.toSnapshot().interactionType
      )
    ).toEqual(["note", "email"]);
  });

  it("rejects interactions for missing customers", async () => {
    const { interactionPublisher, interactionService } = createService();

    const result = await interactionService.recordInteraction({
      commandType: "RecordInteraction",
      context,
      customerId,
      interactionType: "Call",
      interactionChannel: "Phone",
      outcome: "No answer",
      recordedBy: "user-1",
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("CustomerNotFound");
    }

    expect(interactionPublisher.events).toHaveLength(0);
  });

  it("retrieves an interaction by ID", async () => {
    const { customerService, interactionService } = createService();

    await createCustomer(customerService);
    await interactionService.recordInteraction({
      commandType: "RecordInteraction",
      context,
      customerId,
      interactionType: "Visit",
      interactionChannel: "In person",
      outcome: "Collected requirements",
      recordedBy: "user-1",
    });

    const result = await interactionService.getInteraction({
      queryType: "GetInteraction",
      context,
      interactionId,
    });

    expect(result.interaction?.interactionId).toBe(interactionId);
  });
});
