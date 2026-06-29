import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { InMemoryCustomerRepository, type CustomerDomainEvent, type CustomerId } from "@nextshift/domain";
import { describe, expect, it } from "vitest";
import { CustomerApplicationService, type CustomerEventPublisher } from "../src/customer";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const customerId = "customer-1" as CustomerId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingCustomerEventPublisher implements CustomerEventPublisher {
  readonly events: CustomerDomainEvent[] = [];

  async publish(event: CustomerDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createService() {
  const repository = new InMemoryCustomerRepository();
  const publisher = new RecordingCustomerEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
  ];
  const service = new CustomerApplicationService(
    repository,
    publisher,
    () => timestamps.shift() ?? "2026-06-27T04:00:00.000Z",
    () => eventId,
    () => customerId
  );

  return { repository, publisher, service };
}

describe("CustomerApplicationService", () => {
  it("creates and persists a customer", async () => {
    const { publisher, repository, service } = createService();

    const result = await service.createCustomer({
      commandType: "CreateCustomer",
      context,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
    });

    expect(result.ok).toBe(true);
    expect(await repository.exists(customerId)).toBe(true);
    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "CustomerCreated",
      aggregateId: customerId,
      aggregateType: "Customer",
      eventId,
      correlationId,
      version: 1,
    });
  });

  it("updates and persists customer changes", async () => {
    const { publisher, service } = createService();

    await service.createCustomer({
      commandType: "CreateCustomer",
      context,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
    });

    const result = await service.updateCustomer({
      commandType: "UpdateCustomer",
      context,
      customerId,
      displayName: "Acme Champion",
      tags: ["vip"],
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.customer.toSnapshot()).toMatchObject({
        displayName: "Acme Champion",
        tags: ["vip"],
      });
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "CustomerUpdated",
      payload: {
        customerId,
        updatedFields: ["displayName", "tags"],
      },
    });
  });

  it("archives a customer", async () => {
    const { publisher, service } = createService();

    await service.createCustomer({
      commandType: "CreateCustomer",
      context,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
    });

    const result = await service.archiveCustomer({
      commandType: "ArchiveCustomer",
      context,
      customerId,
      reason: "Duplicate",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.customer.toSnapshot()).toMatchObject({
        status: "archived",
      });
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "CustomerArchived",
      payload: {
        customerId,
        reason: "Duplicate",
      },
    });
  });

  it("restores a customer", async () => {
    const { publisher, service } = createService();

    await service.createCustomer({
      commandType: "CreateCustomer",
      context,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
    });
    await service.archiveCustomer({
      commandType: "ArchiveCustomer",
      context,
      customerId,
    });

    const result = await service.restoreCustomer({
      commandType: "RestoreCustomer",
      context,
      customerId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.customer.toSnapshot()).toMatchObject({
        status: "active",
        archivedAt: undefined,
      });
    }

    expect(publisher.events.at(-1)).toMatchObject({
      eventType: "CustomerRestored",
      payload: {
        customerId,
      },
    });
  });

  it("does not publish an event when persistence fails", async () => {
    const publisher = new RecordingCustomerEventPublisher();
    const service = new CustomerApplicationService(
      {
        async save() {
          throw new Error("save failed");
        },
        async findById() {
          return null;
        },
        async findByEmail() {
          return null;
        },
        async findByPhone() {
          return null;
        },
        async search() {
          return [];
        },
        async exists() {
          return false;
        },
        async archive() {
          return null;
        },
      },
      publisher,
      () => "2026-06-27T00:00:00.000Z",
      () => eventId,
      () => customerId
    );

    const result = await service.createCustomer({
      commandType: "CreateCustomer",
      context,
      displayName: "Acme Buyer",
      email: "buyer@example.com",
    });

    expect(result.ok).toBe(false);
    expect(publisher.events).toHaveLength(0);
  });
});
