import {
  InMemoryCustomerRepository,
  InMemoryFollowUpRepository,
  type CustomerDomainEvent,
  type CustomerId,
  type FollowUpDomainEvent,
  type FollowUpId,
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
  FollowUpApplicationService,
  type FollowUpEventPublisher,
} from "../src/follow-up";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const customerId = "customer-1" as CustomerId;
const followUpId = "follow-up-1" as FollowUpId;
const secondFollowUpId = "follow-up-2" as FollowUpId;
const interactionId = "interaction-1" as InteractionId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingFollowUpEventPublisher implements FollowUpEventPublisher {
  readonly events: FollowUpDomainEvent[] = [];

  async publish(event: FollowUpDomainEvent): Promise<void> {
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
  const followUpRepository = new InMemoryFollowUpRepository();
  const customerPublisher = new RecordingCustomerEventPublisher();
  const followUpPublisher = new RecordingFollowUpEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const followUpIds = [followUpId, secondFollowUpId];
  const customerService = new CustomerApplicationService(
    customerRepository,
    customerPublisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => customerId
  );
  const followUpService = new FollowUpApplicationService(
    followUpRepository,
    followUpPublisher,
    customerService,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => followUpIds.shift() ?? ("follow-up-next" as FollowUpId)
  );

  return {
    customerRepository,
    customerService,
    followUpPublisher,
    followUpRepository,
    followUpService,
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

async function scheduleFollowUp(service: FollowUpApplicationService) {
  return service.scheduleFollowUp({
    commandType: "ScheduleFollowUp",
    context,
    customerId,
    interactionId,
    title: "Send proposal",
    description: "Share the proposal after discovery.",
    priority: "high",
    dueAt: "2026-06-28T00:00:00.000Z",
    assignedTo: "user-1",
  });
}

describe("FollowUpApplicationService", () => {
  it("schedules and persists a follow-up", async () => {
    const {
      customerService,
      followUpPublisher,
      followUpRepository,
      followUpService,
    } = createService();

    await createCustomer(customerService);

    const result = await scheduleFollowUp(followUpService);

    expect(result.ok).toBe(true);
    expect(await followUpRepository.findById(followUpId)).not.toBeNull();
    expect(followUpPublisher.events[0]).toMatchObject({
      eventType: "FollowUpScheduled",
      aggregateId: followUpId,
      aggregateType: "FollowUp",
      eventId,
      correlationId,
      version: 1,
      payload: {
        customerId,
        interactionId,
        title: "Send proposal",
        priority: "high",
      },
    });
  });

  it("updates a follow-up", async () => {
    const { customerService, followUpPublisher, followUpService } =
      createService();

    await createCustomer(customerService);
    await scheduleFollowUp(followUpService);

    const result = await followUpService.updateFollowUp({
      commandType: "UpdateFollowUp",
      context,
      followUpId,
      title: "Send revised proposal",
      priority: "urgent",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.followUp.toSnapshot()).toMatchObject({
        title: "Send revised proposal",
        priority: "urgent",
      });
    }

    expect(followUpPublisher.events.at(-1)).toMatchObject({
      eventType: "FollowUpUpdated",
      payload: {
        followUpId,
        updatedFields: ["title", "priority"],
      },
    });
  });

  it("completes a follow-up", async () => {
    const { customerService, followUpPublisher, followUpService } =
      createService();

    await createCustomer(customerService);
    await scheduleFollowUp(followUpService);

    const result = await followUpService.completeFollowUp({
      commandType: "CompleteFollowUp",
      context,
      followUpId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.followUp.toSnapshot().status).toBe("completed");
    }

    expect(followUpPublisher.events.at(-1)).toMatchObject({
      eventType: "FollowUpCompleted",
      payload: { followUpId },
    });
  });

  it("cancels a follow-up", async () => {
    const { customerService, followUpPublisher, followUpService } =
      createService();

    await createCustomer(customerService);
    await scheduleFollowUp(followUpService);

    const result = await followUpService.cancelFollowUp({
      commandType: "CancelFollowUp",
      context,
      followUpId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.followUp.toSnapshot().status).toBe("cancelled");
    }

    expect(followUpPublisher.events.at(-1)).toMatchObject({
      eventType: "FollowUpCancelled",
      payload: { followUpId },
    });
  });

  it("lists pending follow-ups", async () => {
    const { customerService, followUpService } = createService();

    await createCustomer(customerService);
    await scheduleFollowUp(followUpService);

    const result = await followUpService.listPending({
      queryType: "ListPendingFollowUps",
      context,
    });

    expect(result.followUps.map((followUp) => followUp.followUpId)).toEqual([
      followUpId,
    ]);
  });

  it("lists overdue follow-ups and publishes overdue events", async () => {
    const { customerService, followUpPublisher, followUpService } =
      createService();

    await createCustomer(customerService);
    await followUpService.scheduleFollowUp({
      commandType: "ScheduleFollowUp",
      context,
      customerId,
      title: "Call customer",
      dueAt: "2026-06-27T00:30:00.000Z",
    });

    const result = await followUpService.listOverdue({
      queryType: "ListOverdueFollowUps",
      context,
      asOf: "2026-06-28T00:00:00.000Z",
    });

    expect(result.followUps.map((followUp) => followUp.followUpId)).toEqual([
      followUpId,
    ]);
    expect(followUpPublisher.events.at(-1)).toMatchObject({
      eventType: "FollowUpOverdue",
      payload: {
        followUpId,
        customerId,
        dueAt: "2026-06-27T00:30:00.000Z",
      },
    });
  });

  it("rejects scheduling for missing customers", async () => {
    const { followUpPublisher, followUpService } = createService();

    const result = await scheduleFollowUp(followUpService);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("CustomerNotFound");
    }

    expect(followUpPublisher.events).toHaveLength(0);
  });

  it("gets customer follow-ups", async () => {
    const { customerService, followUpService } = createService();

    await createCustomer(customerService);
    await scheduleFollowUp(followUpService);

    const result = await followUpService.getCustomerFollowUps({
      queryType: "GetCustomerFollowUps",
      context,
      customerId,
    });

    expect(result.followUps).toHaveLength(1);
  });
});
