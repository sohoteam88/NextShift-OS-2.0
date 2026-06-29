import {
  InMemoryCustomerRepository,
  InMemorySegmentRepository,
  type CustomerDomainEvent,
  type CustomerId,
  type SegmentDomainEvent,
  type SegmentId,
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
  SegmentApplicationService,
  type SegmentEventPublisher,
} from "../src/segment";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const customerId = "customer-1" as CustomerId;
const secondCustomerId = "customer-2" as CustomerId;
const segmentId = "segment-1" as SegmentId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingSegmentEventPublisher implements SegmentEventPublisher {
  readonly events: SegmentDomainEvent[] = [];

  async publish(event: SegmentDomainEvent): Promise<void> {
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
  const segmentRepository = new InMemorySegmentRepository();
  const customerPublisher = new RecordingCustomerEventPublisher();
  const segmentPublisher = new RecordingSegmentEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
    "2026-06-27T06:00:00.000Z",
  ];
  const customerIds = [customerId, secondCustomerId];
  const customerService = new CustomerApplicationService(
    customerRepository,
    customerPublisher,
    () => timestamps.shift() ?? "2026-06-27T07:00:00.000Z",
    () => eventId,
    () => customerIds.shift() ?? ("customer-next" as CustomerId)
  );
  const segmentService = new SegmentApplicationService(
    segmentRepository,
    segmentPublisher,
    customerService,
    () => timestamps.shift() ?? "2026-06-27T07:00:00.000Z",
    () => eventId,
    () => segmentId
  );

  return {
    customerRepository,
    customerService,
    segmentPublisher,
    segmentRepository,
    segmentService,
  };
}

async function createCustomer(
  service: CustomerApplicationService,
  id: CustomerId = customerId,
  email = "customer@example.com"
) {
  return service.createCustomer({
    commandType: "CreateCustomer",
    context,
    customerId: id,
    displayName: `Customer ${id}`,
    email,
  });
}

async function createSegment(service: SegmentApplicationService) {
  return service.createSegment({
    commandType: "CreateSegment",
    context,
    segmentId,
    name: "High Intent Customers",
    description: "Customers with buying intent.",
    rule: { ruleType: "manual" },
  });
}

describe("SegmentApplicationService", () => {
  it("creates and persists a segment", async () => {
    const { segmentPublisher, segmentRepository, segmentService } =
      createService();

    const result = await createSegment(segmentService);

    expect(result.ok).toBe(true);
    expect(await segmentRepository.findById(segmentId)).not.toBeNull();
    expect(segmentPublisher.events[0]).toMatchObject({
      eventType: "SegmentCreated",
      aggregateId: segmentId,
      aggregateType: "Segment",
      eventId,
      correlationId,
      version: 1,
      payload: {
        businessId,
        name: "High Intent Customers",
        rule: { ruleType: "manual" },
      },
    });
  });

  it("updates a segment", async () => {
    const { segmentPublisher, segmentService } = createService();

    await createSegment(segmentService);

    const result = await segmentService.updateSegment({
      commandType: "UpdateSegment",
      context,
      segmentId,
      name: "Priority Customers",
      rule: { ruleType: "all" },
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.segment.toSnapshot()).toMatchObject({
        name: "Priority Customers",
        rule: { ruleType: "all" },
      });
    }

    expect(segmentPublisher.events.at(-1)).toMatchObject({
      eventType: "SegmentUpdated",
      payload: {
        segmentId,
        updatedFields: ["name", "rule"],
      },
    });
  });

  it("assigns a customer", async () => {
    const { customerService, segmentPublisher, segmentService } = createService();

    await createCustomer(customerService);
    await createSegment(segmentService);

    const result = await segmentService.assignCustomer({
      commandType: "AssignCustomer",
      context,
      segmentId,
      customerId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.segment.listMembers()).toHaveLength(1);
    }

    expect(segmentPublisher.events.at(-1)).toMatchObject({
      eventType: "SegmentAssigned",
      payload: {
        segmentId,
        customerId,
        assignmentSource: "manual",
      },
    });
  });

  it("removes a customer", async () => {
    const { customerService, segmentPublisher, segmentService } = createService();

    await createCustomer(customerService);
    await createSegment(segmentService);
    await segmentService.assignCustomer({
      commandType: "AssignCustomer",
      context,
      segmentId,
      customerId,
    });

    const result = await segmentService.removeCustomer({
      commandType: "RemoveCustomer",
      context,
      segmentId,
      customerId,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.segment.listMembers()).toHaveLength(0);
      expect(result.value.segment.toSnapshot().memberships).toHaveLength(1);
    }

    expect(segmentPublisher.events.at(-1)).toMatchObject({
      eventType: "SegmentRemoved",
      payload: {
        segmentId,
        customerId,
      },
    });
  });

  it("evaluates deterministic rules", async () => {
    const { customerService, segmentPublisher, segmentService } = createService();

    await createCustomer(customerService, customerId, "customer@example.com");
    await createCustomer(
      customerService,
      secondCustomerId,
      "second@example.com"
    );
    await segmentService.createSegment({
      commandType: "CreateSegment",
      context,
      segmentId,
      name: "All Customers",
      rule: { ruleType: "all" },
    });

    const result = await segmentService.evaluateSegment({
      commandType: "EvaluateSegment",
      context,
      segmentId,
      customerIds: [customerId, secondCustomerId],
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.assignedCustomerIds).toEqual([
        customerId,
        secondCustomerId,
      ]);
      expect(result.value.segment.listMembers()).toHaveLength(2);
    }

    expect(segmentPublisher.events.at(-1)).toMatchObject({
      eventType: "SegmentEvaluated",
      payload: {
        segmentId,
        evaluatedCustomerIds: [customerId, secondCustomerId],
        assignedCustomerIds: [customerId, secondCustomerId],
      },
    });
  });

  it("rejects assignment for missing customers", async () => {
    const { segmentPublisher, segmentService } = createService();

    await createSegment(segmentService);

    const result = await segmentService.assignCustomer({
      commandType: "AssignCustomer",
      context,
      segmentId,
      customerId,
    });

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error.code).toBe("CustomerNotFound");
    }

    expect(
      segmentPublisher.events.filter((event) => event.eventType === "SegmentAssigned")
    ).toHaveLength(0);
  });

  it("lists members and customer segments", async () => {
    const { customerService, segmentService } = createService();

    await createCustomer(customerService);
    await createSegment(segmentService);
    await segmentService.assignCustomer({
      commandType: "AssignCustomer",
      context,
      segmentId,
      customerId,
    });

    const members = await segmentService.listMembers({
      queryType: "GetSegmentMembers",
      context,
      segmentId,
    });
    const segments = await segmentService.listCustomerSegments({
      queryType: "ListCustomerSegments",
      context,
      customerId,
    });

    expect(members.members).toHaveLength(1);
    expect(segments.segments).toHaveLength(1);
  });
});
