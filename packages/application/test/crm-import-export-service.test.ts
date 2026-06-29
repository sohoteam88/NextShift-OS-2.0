import {
  InMemoryCustomerRepository,
  InMemoryFollowUpRepository,
  InMemoryInteractionRepository,
  InMemoryLeadRepository,
  InMemorySegmentRepository,
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
import {
  CRMExportService,
  CRMImportService,
} from "../src/import-export";
import { LeadApplicationService, type LeadEventPublisher } from "../src/lead";
import { CRMQueryService } from "../src/query";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const customerId = "customer-1" as CustomerId;
const secondCustomerId = "customer-2" as CustomerId;
const leadId = "lead-1" as LeadId;
const secondLeadId = "lead-2" as LeadId;
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

class RecordingLeadEventPublisher implements LeadEventPublisher {
  readonly events: LeadDomainEvent[] = [];

  async publish(event: LeadDomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createFixture() {
  const customerRepository = new InMemoryCustomerRepository();
  const leadRepository = new InMemoryLeadRepository();
  const interactionRepository = new InMemoryInteractionRepository();
  const followUpRepository = new InMemoryFollowUpRepository();
  const segmentRepository = new InMemorySegmentRepository();
  const customerPublisher = new RecordingCustomerEventPublisher();
  const leadPublisher = new RecordingLeadEventPublisher();
  const timestamps = [
    "2026-06-27T00:00:00.000Z",
    "2026-06-27T01:00:00.000Z",
    "2026-06-27T02:00:00.000Z",
    "2026-06-27T03:00:00.000Z",
    "2026-06-27T04:00:00.000Z",
    "2026-06-27T05:00:00.000Z",
  ];
  const customerApplicationService = new CustomerApplicationService(
    customerRepository,
    customerPublisher,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => customerId
  );
  const leadApplicationService = new LeadApplicationService(
    leadRepository,
    leadPublisher,
    customerApplicationService,
    () => timestamps.shift() ?? "2026-06-27T06:00:00.000Z",
    () => eventId,
    () => leadId
  );
  const queryService = new CRMQueryService(
    customerRepository,
    leadRepository,
    interactionRepository,
    followUpRepository,
    segmentRepository
  );

  return {
    customerPublisher,
    customerRepository,
    exportService: new CRMExportService(queryService),
    importService: new CRMImportService(
      customerApplicationService,
      leadApplicationService
    ),
    leadPublisher,
    leadRepository,
  };
}

describe("CRMImportService", () => {
  it("imports customers through CustomerApplicationService and skips existing duplicates", async () => {
    const {
      customerPublisher,
      customerRepository,
      importService,
    } = createFixture();

    const firstResult = await importService.importCustomers({
      context,
      records: [
        {
          customerId,
          businessId,
          displayName: "Acme Coffee",
          email: "owner@acme.test",
          phone: "+60120000001",
          type: "organization",
          tags: ["vip"],
        },
      ],
    });
    const duplicateResult = await importService.importCustomers({
      context,
      records: [
        {
          customerId: secondCustomerId,
          businessId,
          displayName: "Acme Duplicate",
          email: "OWNER@ACME.TEST",
        },
      ],
    });

    expect(firstResult).toMatchObject({
      total: 1,
      imported: 1,
      skipped: 0,
      failed: 0,
    });
    expect(duplicateResult).toMatchObject({
      total: 1,
      imported: 0,
      skipped: 1,
      failed: 0,
    });
    expect(await customerRepository.exists(customerId)).toBe(true);
    expect(customerPublisher.events).toHaveLength(1);
  });

  it("imports leads through LeadApplicationService and rejects batch duplicates", async () => {
    const { importService, leadPublisher, leadRepository } = createFixture();

    const result = await importService.importLeads({
      context,
      records: [
        {
          leadId,
          businessId,
          displayName: "Acme Lead",
          email: "lead@acme.test",
          source: "webinar",
        },
        {
          leadId: secondLeadId,
          businessId,
          displayName: "Duplicate Email",
          email: "lead@acme.test",
          source: "referral",
        },
      ],
    });

    expect(result).toMatchObject({
      total: 2,
      imported: 1,
      skipped: 0,
      failed: 1,
    });
    expect(result.validationErrors).toMatchObject([
      {
        recordIndex: 1,
        field: "email",
        code: "DuplicateEmail",
      },
    ]);
    expect(await leadRepository.exists(leadId)).toBe(true);
    expect(await leadRepository.exists(secondLeadId)).toBe(false);
    expect(leadPublisher.events).toHaveLength(1);
  });

  it("reports validation failures while continuing valid customer imports", async () => {
    const { customerRepository, importService } = createFixture();

    const result = await importService.importCustomers({
      context,
      records: [
        {
          customerId,
          businessId,
          displayName: "Valid Customer",
          email: "valid@example.com",
        },
        {
          customerId: secondCustomerId,
          businessId: otherBusinessId,
          displayName: "",
          email: "not-an-email",
          phone: "x",
        },
      ],
    });

    expect(result).toMatchObject({
      total: 2,
      imported: 1,
      skipped: 0,
      failed: 1,
    });
    expect(result.validationErrors.map((error) => error.code)).toEqual([
      "BusinessMismatch",
      "InvalidEmail",
      "InvalidPhone",
      "Required",
    ]);
    expect(await customerRepository.exists(customerId)).toBe(true);
    expect(await customerRepository.exists(secondCustomerId)).toBe(false);
  });

  it("handles empty import datasets", async () => {
    const { importService } = createFixture();

    await expect(
      importService.importCustomers({ context, records: [] })
    ).resolves.toMatchObject({
      total: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      validationErrors: [],
      records: [],
    });
  });
});

describe("CRMExportService", () => {
  it("exports immutable customer DTOs through CRMQueryService", async () => {
    const { exportService, importService } = createFixture();

    await importService.importCustomers({
      context,
      records: [
        {
          customerId,
          businessId,
          displayName: "Acme Coffee",
          email: "owner@acme.test",
          phone: "+60120000001",
          type: "organization",
          tags: ["vip"],
        },
      ],
    });

    const exported = await exportService.exportCustomers({
      filters: { displayName: "acme" },
    });

    expect(exported).toMatchObject([
      {
        customerId,
        businessId,
        displayName: "Acme Coffee",
        email: "owner@acme.test",
        phone: "+60120000001",
        type: "organization",
        tags: ["vip"],
      },
    ]);
    expect(Object.isFrozen(exported)).toBe(true);
    expect(Object.isFrozen(exported[0])).toBe(true);
    expect(Object.isFrozen(exported[0]?.tags)).toBe(true);
  });

  it("exports immutable lead DTOs through CRMQueryService", async () => {
    const { exportService, importService } = createFixture();

    await importService.importLeads({
      context,
      records: [
        {
          leadId,
          businessId,
          displayName: "Acme Lead",
          email: "lead@acme.test",
          source: "webinar",
        },
      ],
    });

    const exported = await exportService.exportLeads({
      filters: { source: "web" },
    });

    expect(exported).toMatchObject([
      {
        leadId,
        businessId,
        displayName: "Acme Lead",
        email: "lead@acme.test",
        source: "webinar",
        status: "new",
      },
    ]);
    expect(Object.isFrozen(exported)).toBe(true);
    expect(Object.isFrozen(exported[0])).toBe(true);
  });
});
