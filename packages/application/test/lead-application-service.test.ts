import {
  InMemoryCustomerRepository,
  InMemoryLeadRepository,
  type CustomerDomainEvent,
  type CustomerId,
  type LeadDomainEvent,
  type LeadId,
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
import { LeadApplicationService, type LeadEventPublisher } from "../src/lead";

const businessId = "business-1" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const leadId = "lead-1" as LeadId;
const customerId = "customer-1" as CustomerId;
const eventId = "event-1" as EventId;

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingLeadEventPublisher implements LeadEventPublisher {
  readonly events: LeadDomainEvent[] = [];

  async publish(event: LeadDomainEvent): Promise<void> {
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
  const leadRepository = new InMemoryLeadRepository();
  const customerRepository = new InMemoryCustomerRepository();
  const leadPublisher = new RecordingLeadEventPublisher();
  const customerPublisher = new RecordingCustomerEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const customerService = new CustomerApplicationService(
    customerRepository,
    customerPublisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => customerId
  );
  const leadService = new LeadApplicationService(
    leadRepository,
    leadPublisher,
    customerService,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => leadId
  );

  return {
    customerPublisher,
    customerRepository,
    leadPublisher,
    leadRepository,
    leadService,
  };
}

async function createLead(service: LeadApplicationService) {
  return service.createLead({
    commandType: "CreateLead",
    context,
    displayName: "Acme Prospect",
    email: "prospect@example.com",
    source: "webinar",
  });
}

describe("LeadApplicationService", () => {
  it("creates and persists a lead", async () => {
    const { leadPublisher, leadRepository, leadService } = createService();

    const result = await createLead(leadService);

    expect(result.ok).toBe(true);
    expect(await leadRepository.exists(leadId)).toBe(true);
    expect(leadPublisher.events).toHaveLength(1);
    expect(leadPublisher.events[0]).toMatchObject({
      eventType: "LeadCreated",
      aggregateId: leadId,
      aggregateType: "Lead",
      eventId,
      correlationId,
      version: 1,
    });
  });

  it("updates and persists lead changes", async () => {
    const { leadPublisher, leadService } = createService();

    await createLead(leadService);

    const result = await leadService.updateLead({
      commandType: "UpdateLead",
      context,
      leadId,
      displayName: "Acme Qualified Prospect",
      source: "referral",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.lead.toSnapshot()).toMatchObject({
        displayName: "Acme Qualified Prospect",
        source: "referral",
      });
    }

    expect(leadPublisher.events.at(-1)).toMatchObject({
      eventType: "LeadUpdated",
      payload: {
        leadId,
        updatedFields: ["displayName", "source"],
      },
    });
  });

  it("qualifies a lead", async () => {
    const { leadPublisher, leadService } = createService();

    await createLead(leadService);

    const result = await leadService.qualifyLead({
      commandType: "QualifyLead",
      context,
      leadId,
      qualificationScore: 88,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.lead.toSnapshot()).toMatchObject({
        status: "qualified",
        qualificationScore: 88,
      });
    }

    expect(leadPublisher.events.at(-1)).toMatchObject({
      eventType: "LeadQualified",
      payload: {
        leadId,
        qualificationScore: 88,
      },
    });
  });

  it("converts a qualified lead into exactly one customer", async () => {
    const {
      customerPublisher,
      customerRepository,
      leadPublisher,
      leadService,
    } = createService();

    await createLead(leadService);
    await leadService.qualifyLead({
      commandType: "QualifyLead",
      context,
      leadId,
      qualificationScore: 88,
    });

    const result = await leadService.convertLead({
      commandType: "ConvertLead",
      context,
      leadId,
      customerId,
    });

    expect(result.ok).toBe(true);
    expect(await customerRepository.exists(customerId)).toBe(true);
    expect(customerPublisher.events).toHaveLength(1);

    if (result.ok) {
      expect(result.value.lead.toSnapshot()).toMatchObject({
        status: "converted",
        convertedCustomerId: customerId,
      });
      expect(result.value.customerId).toBe(customerId);
    }

    expect(leadPublisher.events.at(-1)).toMatchObject({
      eventType: "LeadConverted",
      payload: {
        leadId,
        customerId,
      },
    });
  });

  it("does not create a duplicate customer on repeated conversion", async () => {
    const { customerPublisher, leadPublisher, leadService } = createService();

    await createLead(leadService);
    await leadService.qualifyLead({
      commandType: "QualifyLead",
      context,
      leadId,
      qualificationScore: 88,
    });
    await leadService.convertLead({
      commandType: "ConvertLead",
      context,
      leadId,
      customerId,
    });

    const result = await leadService.convertLead({
      commandType: "ConvertLead",
      context,
      leadId,
      customerId,
    });

    expect(result.ok).toBe(false);
    expect(customerPublisher.events).toHaveLength(1);
    expect(leadPublisher.events.filter((event) => event.eventType === "LeadConverted"))
      .toHaveLength(1);
  });

  it("closes a lead", async () => {
    const { leadPublisher, leadService } = createService();

    await createLead(leadService);

    const result = await leadService.closeLead({
      commandType: "CloseLead",
      context,
      leadId,
      reason: "Not a fit",
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value.lead.toSnapshot()).toMatchObject({
        status: "closed",
        closeReason: "Not a fit",
      });
    }

    expect(leadPublisher.events.at(-1)).toMatchObject({
      eventType: "LeadClosed",
      payload: {
        leadId,
        reason: "Not a fit",
      },
    });
  });

  it("does not create a customer for unqualified leads", async () => {
    const { customerPublisher, leadService } = createService();

    await createLead(leadService);

    const result = await leadService.convertLead({
      commandType: "ConvertLead",
      context,
      leadId,
      customerId,
    });

    expect(result.ok).toBe(false);
    expect(customerPublisher.events).toHaveLength(0);
  });
});
