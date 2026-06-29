import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import type { CustomerId } from "../src/customer";
import {
  InMemorySegmentRepository,
  Segment,
  type SegmentId,
} from "../src/segment";

const businessId = "business-1" as BusinessId;
const segmentId = "segment-1" as SegmentId;
const customerId = "customer-1" as CustomerId;
const secondCustomerId = "customer-2" as CustomerId;
const createdAt = "2026-06-27T00:00:00.000Z";

function createSegment(id: SegmentId = segmentId): Segment {
  return Segment.create({
    segmentId: id,
    businessId,
    name: "High Intent Customers",
    description: "Customers with clear buying intent.",
    rule: { ruleType: "manual" },
    createdAt,
  });
}

describe("Segment aggregate", () => {
  it("creates a segment", () => {
    const segment = createSegment();

    expect(segment.toSnapshot()).toMatchObject({
      segmentId,
      businessId,
      name: "High Intent Customers",
      description: "Customers with clear buying intent.",
      rule: { ruleType: "manual" },
      status: "active",
      memberships: [],
      createdAt,
      updatedAt: createdAt,
    });
  });

  it("updates a segment", () => {
    const segment = createSegment();

    segment.update({
      name: "Priority Customers",
      description: "Customers ready for expansion.",
      rule: { ruleType: "all" },
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(segment.toSnapshot()).toMatchObject({
      name: "Priority Customers",
      description: "Customers ready for expansion.",
      rule: { ruleType: "all" },
      updatedAt: "2026-06-27T01:00:00.000Z",
    });
  });

  it("assigns a customer", () => {
    const segment = createSegment();

    segment.assignCustomer(customerId, "2026-06-27T02:00:00.000Z");

    expect(segment.listMembers()).toEqual([
      {
        customerId,
        assignedAt: "2026-06-27T02:00:00.000Z",
        assignmentSource: "manual",
      },
    ]);
  });

  it("removes a customer while preserving membership history", () => {
    const segment = createSegment();

    segment.assignCustomer(customerId, "2026-06-27T02:00:00.000Z");
    segment.removeCustomer(customerId, "2026-06-27T03:00:00.000Z");

    expect(segment.listMembers()).toEqual([]);
    expect(segment.toSnapshot().memberships).toMatchObject([
      {
        customerId,
        assignedAt: "2026-06-27T02:00:00.000Z",
        removedAt: "2026-06-27T03:00:00.000Z",
      },
    ]);
  });

  it("prevents duplicate active membership", () => {
    const segment = createSegment();

    segment.assignCustomer(customerId, "2026-06-27T02:00:00.000Z");

    expect(() =>
      segment.assignCustomer(customerId, "2026-06-27T03:00:00.000Z")
    ).toThrow("Customer is already assigned to this segment.");
  });

  it("prevents assignment to inactive segments", () => {
    const segment = createSegment();

    segment.update({
      active: false,
      updatedAt: "2026-06-27T01:00:00.000Z",
    });

    expect(() =>
      segment.assignCustomer(customerId, "2026-06-27T02:00:00.000Z")
    ).toThrow("Inactive segments cannot accept assignments.");
  });

  it("evaluates deterministic all rules", () => {
    const segment = Segment.create({
      segmentId,
      businessId,
      name: "All Customers",
      rule: { ruleType: "all" },
      createdAt,
    });

    const assigned = segment.evaluate(
      [customerId, secondCustomerId],
      "2026-06-27T02:00:00.000Z"
    );

    expect(assigned).toEqual([customerId, secondCustomerId]);
    expect(segment.listMembers()).toHaveLength(2);
  });
});

describe("InMemorySegmentRepository", () => {
  it("saves and retrieves a segment by ID", async () => {
    const repository = new InMemorySegmentRepository();
    const segment = createSegment();

    await repository.save(segment);

    expect((await repository.findById(segmentId))?.toSnapshot()).toEqual(
      segment.toSnapshot()
    );
  });

  it("finds a segment by name within a business", async () => {
    const repository = new InMemorySegmentRepository();

    await repository.save(createSegment());

    expect(
      await repository.findByName(businessId, "high intent customers")
    ).not.toBeNull();
  });

  it("prevents duplicate segment names in the same business", async () => {
    const repository = new InMemorySegmentRepository();

    await repository.save(createSegment("segment-1" as SegmentId));

    await expect(
      repository.save(createSegment("segment-2" as SegmentId))
    ).rejects.toThrow("Segment name must be unique within a business.");
  });

  it("assigns and removes customers", async () => {
    const repository = new InMemorySegmentRepository();

    await repository.save(createSegment());
    await repository.assignCustomer(
      segmentId,
      customerId,
      "2026-06-27T02:00:00.000Z"
    );

    expect(await repository.listMembers(segmentId)).toHaveLength(1);

    await repository.removeCustomer(
      segmentId,
      customerId,
      "2026-06-27T03:00:00.000Z"
    );

    expect(await repository.listMembers(segmentId)).toHaveLength(0);
  });

  it("evaluates and lists customer segments", async () => {
    const repository = new InMemorySegmentRepository();
    const segment = Segment.create({
      segmentId,
      businessId,
      name: "All Customers",
      rule: { ruleType: "all" },
      createdAt,
    });

    await repository.save(segment);

    const assigned = await repository.evaluate(
      segmentId,
      [customerId],
      "2026-06-27T02:00:00.000Z"
    );

    expect(assigned).toEqual([customerId]);
    expect(await repository.listCustomerSegments(customerId)).toHaveLength(1);
  });
});
