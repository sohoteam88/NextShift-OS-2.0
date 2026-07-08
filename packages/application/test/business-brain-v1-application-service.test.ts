import {
  BusinessFoundation,
  InMemoryBusinessBrainV1Repository,
  InMemoryBusinessFoundationRepository,
  type BrandDnaId,
  type BusinessBrainV1DomainEvent,
  type BusinessBrainV1Id,
  type BusinessFoundationId,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessBrainV1ApplicationService,
  type BusinessBrainV1EventPublisher,
} from "../src/business-brain-v1";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingBusinessBrainV1EventPublisher
  implements BusinessBrainV1EventPublisher
{
  readonly events: BusinessBrainV1DomainEvent[] = [];

  async publish(event: BusinessBrainV1DomainEvent): Promise<void> {
    this.events.push(event);
  }
}

function createFoundation(): BusinessFoundation {
  const foundation = BusinessFoundation.create({
    foundationId,
    businessId,
    createdAt,
    twin: {
      name: "NextShift Studio",
      market: "AI business operating systems",
      audience: "solo founders",
      offer: "guided business execution platform",
      valueProposition: "Turn business context into approved execution.",
      goals: ["Launch Business Brain"],
      priorities: ["Interpret foundation facts"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every next action is grounded in business context.",
    voice: "clear and pragmatic",
    values: ["clarity"],
    differentiators: ["business memory"],
    audienceFit: "Founder-led teams.",
    proofMarkers: ["workflow catalog"],
    updatedAt: "2026-07-08T01:00:00.000Z",
  });

  return foundation;
}

async function createService() {
  const brainRepository = new InMemoryBusinessBrainV1Repository();
  const foundationRepository = new InMemoryBusinessFoundationRepository();
  const publisher = new RecordingBusinessBrainV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
  ];
  const service = new BusinessBrainV1ApplicationService(
    brainRepository,
    foundationRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T05:00:00.000Z",
    () => eventId,
    () => brainId
  );

  await foundationRepository.save(createFoundation());

  return { brainRepository, foundationRepository, publisher, service };
}

describe("BusinessBrainV1ApplicationService", () => {
  it("creates Business Brain intelligence from a released Foundation snapshot", async () => {
    const { brainRepository, publisher, service } = await createService();

    const created = await service.createBusinessBrain({
      commandType: "CreateBusinessBrainV1",
      context,
      brainId,
      foundationId,
    });

    expect(created.ok).toBe(true);
    expect(await brainRepository.exists(brainId)).toBe(true);

    if (created.ok) {
      expect(created.value.brain.toSnapshot()).toMatchObject({
        brainId,
        businessId,
        foundationId,
        lifecycleStatus: "interpreted",
        context: {
          businessName: "NextShift Studio",
        },
      });
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "BusinessBrainV1Created",
      aggregateId: brainId,
      aggregateType: "BusinessBrainV1",
      correlationId,
      payload: {
        brainId,
        businessId,
        foundationId,
      },
    });
  });

  it("queries, supersedes, and archives Business Brain outputs", async () => {
    const { publisher, service } = await createService();

    await service.createBusinessBrain({
      commandType: "CreateBusinessBrainV1",
      context,
      brainId,
      foundationId,
    });

    const listed = await service.listBusinessBrainsForBusiness({
      queryType: "ListBusinessBrainV1ForBusiness",
      context,
    });
    expect(listed.brains).toHaveLength(1);

    const superseded = await service.supersedeBusinessBrain({
      commandType: "SupersedeBusinessBrainV1",
      context,
      brainId,
    });
    expect(superseded.ok).toBe(true);

    const archived = await service.archiveBusinessBrain({
      commandType: "ArchiveBusinessBrainV1",
      context,
      brainId,
    });
    expect(archived.ok).toBe(true);
    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "BusinessBrainV1Created",
      "BusinessBrainV1Superseded",
      "BusinessBrainV1Archived",
    ]);
  });

  it("rejects missing and foreign Foundation access", async () => {
    const { service } = await createService();

    const missing = await service.createBusinessBrain({
      commandType: "CreateBusinessBrainV1",
      context,
      foundationId: "missing-foundation" as BusinessFoundationId,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("BusinessFoundationNotFound");
    }

    const foreign = await service.createBusinessBrain({
      commandType: "CreateBusinessBrainV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
