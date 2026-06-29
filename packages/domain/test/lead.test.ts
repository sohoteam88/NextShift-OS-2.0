import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { Lead, InMemoryLeadRepository, type LeadId } from "../src/lead";
import type { CustomerId } from "../src/customer";

const businessId = "business-1" as BusinessId;
const leadId = "lead-1" as LeadId;
const customerId = "customer-1" as CustomerId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createLead(): Lead {
  return Lead.create({
    leadId,
    businessId,
    displayName: "Acme Prospect",
    email: "PROSPECT@EXAMPLE.COM",
    source: "webinar",
    createdAt,
  });
}

describe("Lead aggregate", () => {
  it("creates a lead", () => {
    const lead = createLead();

    expect(lead.toSnapshot()).toMatchObject({
      leadId,
      businessId,
      displayName: "Acme Prospect",
      email: "prospect@example.com",
      source: "webinar",
      status: "new",
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("fails without a display name", () => {
    expect(() =>
      Lead.create({
        leadId,
        businessId,
        displayName: " ",
        email: "prospect@example.com",
        source: "webinar",
        createdAt,
      })
    ).toThrow("Lead display name is required.");
  });

  it("fails without contact information", () => {
    expect(() =>
      Lead.create({
        leadId,
        businessId,
        displayName: "Acme Prospect",
        source: "webinar",
        createdAt,
      })
    ).toThrow("At least one contact method is required.");
  });

  it("updates a lead", () => {
    const lead = createLead();

    lead.update({
      displayName: "Acme Qualified Prospect",
      phone: "+60123456789",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(lead.toSnapshot()).toMatchObject({
      displayName: "Acme Qualified Prospect",
      phone: "+60123456789",
      updatedAt: "2026-06-27T01:00:00.000Z",
    });
  });

  it("qualifies a lead", () => {
    const lead = createLead();

    lead.qualify(82, "2026-06-27T02:00:00.000Z");

    expect(lead.toSnapshot()).toMatchObject({
      status: "qualified",
      qualificationScore: 82,
      updatedAt: "2026-06-27T02:00:00.000Z",
    });
  });

  it("converts a qualified lead", () => {
    const lead = createLead();

    lead.qualify(82, "2026-06-27T02:00:00.000Z");
    lead.convert(customerId, "2026-06-27T03:00:00.000Z");

    expect(lead.toSnapshot()).toMatchObject({
      status: "converted",
      convertedAt: "2026-06-27T03:00:00.000Z",
      convertedCustomerId: customerId,
    });
  });

  it("closes a lead", () => {
    const lead = createLead();

    lead.close("2026-06-27T04:00:00.000Z", "Not a fit");

    expect(lead.toSnapshot()).toMatchObject({
      status: "closed",
      closedAt: "2026-06-27T04:00:00.000Z",
      closeReason: "Not a fit",
    });
  });

  it("prevents duplicate conversion", () => {
    const lead = createLead();

    lead.qualify(82, "2026-06-27T02:00:00.000Z");
    lead.convert(customerId, "2026-06-27T03:00:00.000Z");

    expect(() =>
      lead.convert("customer-2" as CustomerId, "2026-06-27T04:00:00.000Z")
    ).toThrow("Only qualified leads may be converted.");
  });

  it("prevents update after conversion", () => {
    const lead = createLead();

    lead.qualify(82, "2026-06-27T02:00:00.000Z");
    lead.convert(customerId, "2026-06-27T03:00:00.000Z");

    expect(() =>
      lead.update({
        displayName: "Converted Prospect",
        updatedAt: "2026-06-27T04:00:00.000Z",
      })
    ).toThrow("Converted leads cannot be modified.");
  });

  it("prevents invalid state transitions", () => {
    const lead = createLead();

    expect(() => lead.convert(customerId, "2026-06-27T03:00:00.000Z")).toThrow(
      "Only qualified leads may be converted."
    );

    lead.close("2026-06-27T04:00:00.000Z");

    expect(() => lead.qualify(82, "2026-06-27T05:00:00.000Z")).toThrow(
      "Only new leads may be qualified."
    );
  });
});

describe("InMemoryLeadRepository", () => {
  it("saves and retrieves a lead by ID", async () => {
    const repository = new InMemoryLeadRepository();
    const lead = createLead();

    await repository.save(lead);

    expect((await repository.findById(leadId))?.toSnapshot()).toEqual(
      lead.toSnapshot()
    );
  });

  it("finds a lead by email", async () => {
    const repository = new InMemoryLeadRepository();

    await repository.save(createLead());

    expect(await repository.findByEmail("PROSPECT@example.com")).not.toBeNull();
  });

  it("finds a lead by phone", async () => {
    const repository = new InMemoryLeadRepository();
    const lead = Lead.create({
      leadId,
      businessId,
      displayName: "Phone Prospect",
      phone: "+60123456789",
      source: "referral",
      createdAt,
    });

    await repository.save(lead);

    expect(await repository.findByPhone("+60123456789")).not.toBeNull();
  });

  it("checks lead existence", async () => {
    const repository = new InMemoryLeadRepository();

    expect(await repository.exists(leadId)).toBe(false);

    await repository.save(createLead());

    expect(await repository.exists(leadId)).toBe(true);
  });

  it("closes a lead", async () => {
    const repository = new InMemoryLeadRepository();

    await repository.save(createLead());
    await repository.close(leadId, "2026-06-27T04:00:00.000Z", "Not a fit");

    expect((await repository.findById(leadId))?.toSnapshot()).toMatchObject({
      status: "closed",
      closeReason: "Not a fit",
    });
  });
});
