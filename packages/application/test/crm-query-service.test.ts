import {
  Customer,
  FollowUp,
  InMemoryCustomerRepository,
  InMemoryFollowUpRepository,
  InMemoryInteractionRepository,
  InMemoryLeadRepository,
  InMemorySegmentRepository,
  Interaction,
  Lead,
  Segment,
  type CustomerId,
  type FollowUpId,
  type InteractionId,
  type LeadId,
  type SegmentId,
} from "@nextshift/domain";
import type { BusinessId, Timestamp } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import { CRMQueryService } from "../src/query";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const customerId = "customer-1" as CustomerId;
const secondCustomerId = "customer-2" as CustomerId;
const leadId = "lead-1" as LeadId;
const secondLeadId = "lead-2" as LeadId;
const firstInteractionId = "interaction-1" as InteractionId;
const secondInteractionId = "interaction-2" as InteractionId;
const followUpId = "follow-up-1" as FollowUpId;
const secondFollowUpId = "follow-up-2" as FollowUpId;
const segmentId = "segment-1" as SegmentId;
const otherSegmentId = "segment-2" as SegmentId;

function createFixture() {
  const customerRepository = new InMemoryCustomerRepository();
  const leadRepository = new InMemoryLeadRepository();
  const interactionRepository = new InMemoryInteractionRepository();
  const followUpRepository = new InMemoryFollowUpRepository();
  const segmentRepository = new InMemorySegmentRepository();
  const service = new CRMQueryService(
    customerRepository,
    leadRepository,
    interactionRepository,
    followUpRepository,
    segmentRepository
  );

  return {
    customerRepository,
    followUpRepository,
    interactionRepository,
    leadRepository,
    segmentRepository,
    service,
  };
}

describe("CRMQueryService", () => {
  it("searches and reads customers through repository APIs", async () => {
    const { customerRepository, service } = createFixture();

    await customerRepository.save(
      Customer.create({
        customerId,
        businessId,
        displayName: "Acme Coffee",
        email: "owner@acme.test",
        phone: "+60120000001",
        type: "organization",
        tags: ["vip"],
        createdAt: timestamp("2026-06-27T00:00:00.000Z"),
      })
    );
    await customerRepository.save(
      Customer.create({
        customerId: secondCustomerId,
        businessId,
        displayName: "Beta Retail",
        email: "hello@beta.test",
        phone: "+60120000002",
        createdAt: timestamp("2026-06-27T01:00:00.000Z"),
      })
    );

    await expect(service.searchCustomers({ displayName: "coffee" })).resolves.toMatchObject([
      {
        customerId,
        displayName: "Acme Coffee",
        email: "owner@acme.test",
        phone: "+60120000001",
        type: "organization",
        tags: ["vip"],
      },
    ]);
    await expect(service.getCustomerById(customerId)).resolves.toMatchObject({
      customerId,
    });
    await expect(service.getCustomerByEmail("OWNER@ACME.TEST")).resolves.toMatchObject({
      customerId,
    });
    await expect(service.getCustomerByPhone("+60120000002")).resolves.toMatchObject({
      customerId: secondCustomerId,
    });
  });

  it("searches and reads leads through repository APIs", async () => {
    const { leadRepository, service } = createFixture();
    const qualifiedLead = Lead.create({
      leadId,
      businessId,
      displayName: "Acme Lead",
      email: "lead@acme.test",
      source: "webinar",
      createdAt: timestamp("2026-06-27T00:00:00.000Z"),
    });
    qualifiedLead.qualify(88, timestamp("2026-06-27T01:00:00.000Z"));

    await leadRepository.save(qualifiedLead);
    await leadRepository.save(
      Lead.create({
        leadId: secondLeadId,
        businessId,
        displayName: "Referral Lead",
        phone: "+60120000003",
        source: "referral",
        createdAt: timestamp("2026-06-27T02:00:00.000Z"),
      })
    );

    await expect(service.searchLeads({ status: "qualified" })).resolves.toMatchObject([
      {
        leadId,
        source: "webinar",
        status: "qualified",
        qualificationScore: 88,
      },
    ]);
    await expect(service.searchLeads({ source: "refer" })).resolves.toMatchObject([
      {
        leadId: secondLeadId,
        source: "referral",
      },
    ]);
    await expect(service.getLeadById(leadId)).resolves.toMatchObject({
      leadId,
    });
  });

  it("returns customer timelines and interaction lookups", async () => {
    const { interactionRepository, service } = createFixture();

    await interactionRepository.save(
      Interaction.record({
        interactionId: secondInteractionId,
        customerId,
        interactionType: "email",
        interactionChannel: "email",
        outcome: "sent",
        note: "Sent renewal email",
        occurredAt: timestamp("2026-06-27T02:00:00.000Z"),
        recordedBy: "user-1",
      })
    );
    await interactionRepository.save(
      Interaction.record({
        interactionId: firstInteractionId,
        customerId,
        interactionType: "call",
        interactionChannel: "phone",
        outcome: "connected",
        note: "Discussed plan",
        occurredAt: timestamp("2026-06-27T01:00:00.000Z"),
        recordedBy: "user-1",
      })
    );

    const timeline = await service.getCustomerTimeline(customerId);

    expect(timeline.map((entry) => entry.interactionId)).toEqual([
      firstInteractionId,
      secondInteractionId,
    ]);
    await expect(service.getInteractionById(secondInteractionId)).resolves.toMatchObject({
      interactionId: secondInteractionId,
      outcome: "sent",
    });
  });

  it("lists pending and overdue follow-ups without mutating aggregates", async () => {
    const { followUpRepository, service } = createFixture();

    await followUpRepository.save(
      FollowUp.schedule({
        followUpId,
        customerId,
        title: "Call owner",
        priority: "high",
        dueAt: timestamp("2026-06-27T01:00:00.000Z"),
        createdAt: timestamp("2026-06-27T00:00:00.000Z"),
      })
    );
    await followUpRepository.save(
      FollowUp.schedule({
        followUpId: secondFollowUpId,
        customerId: secondCustomerId,
        title: "Send quote",
        priority: "medium",
        dueAt: timestamp("2026-06-28T00:00:00.000Z"),
        createdAt: timestamp("2026-06-27T00:00:00.000Z"),
      })
    );

    await expect(service.listPendingFollowUps({ customerId })).resolves.toMatchObject([
      {
        followUpId,
        status: "pending",
        priority: "high",
      },
    ]);
    await expect(
      service.listOverdueFollowUps(timestamp("2026-06-27T12:00:00.000Z"))
    ).resolves.toMatchObject([
      {
        followUpId,
        title: "Call owner",
      },
    ]);
    await expect(service.getFollowUpById(secondFollowUpId)).resolves.toMatchObject({
      followUpId: secondFollowUpId,
    });
  });

  it("lists segments, segment members, and customer segment memberships", async () => {
    const { segmentRepository, service } = createFixture();
    const segment = Segment.create({
      segmentId,
      businessId,
      name: "VIP Customers",
      description: "High-value customers",
      createdAt: timestamp("2026-06-27T00:00:00.000Z"),
    });
    segment.assignCustomer(customerId, timestamp("2026-06-27T01:00:00.000Z"));

    await segmentRepository.save(segment);
    await segmentRepository.save(
      Segment.create({
        segmentId: otherSegmentId,
        businessId: otherBusinessId,
        name: "Other Business Segment",
        createdAt: timestamp("2026-06-27T02:00:00.000Z"),
      })
    );

    await expect(service.listSegments({ businessId })).resolves.toMatchObject([
      {
        segmentId,
        name: "VIP Customers",
        memberCount: 1,
      },
    ]);
    await expect(service.getSegmentById(segmentId)).resolves.toMatchObject({
      segmentId,
    });
    await expect(service.listSegmentMembers(segmentId)).resolves.toMatchObject([
      {
        customerId,
        assignmentSource: "manual",
      },
    ]);
    await expect(service.listCustomerSegments(customerId)).resolves.toMatchObject([
      {
        segmentId,
      },
    ]);
  });
});

function timestamp(value: string): Timestamp {
  return value as Timestamp;
}
