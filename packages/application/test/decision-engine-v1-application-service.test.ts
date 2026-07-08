import {
  BusinessBrainV1,
  BusinessFoundation,
  InMemoryBusinessBrainV1Repository,
  InMemoryDecisionEngineV1Repository,
  type BrandDnaId,
  type BusinessBrainV1Id,
  type BusinessFoundationId,
  type DecisionEngineV1DomainEvent,
  type DecisionEngineV1Id,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  DecisionEngineV1ApplicationService,
  type DecisionEngineV1EventPublisher,
} from "../src/decision-engine-v1";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingDecisionEngineV1EventPublisher
  implements DecisionEngineV1EventPublisher
{
  readonly events: DecisionEngineV1DomainEvent[] = [];

  async publish(event: DecisionEngineV1DomainEvent): Promise<void> {
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
      goals: ["Launch Decision Engine"],
      priorities: ["Prioritize next actions"],
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
  const engineRepository = new InMemoryDecisionEngineV1Repository();
  const brainRepository = new InMemoryBusinessBrainV1Repository();
  const publisher = new RecordingDecisionEngineV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
  ];
  const service = new DecisionEngineV1ApplicationService(
    engineRepository,
    brainRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T05:00:00.000Z",
    () => eventId,
    () => engineId
  );

  await brainRepository.save(
    BusinessBrainV1.create({
      brainId,
      foundation: createFoundation().toSnapshot(),
      createdAt,
    })
  );

  return { brainRepository, engineRepository, publisher, service };
}

describe("DecisionEngineV1ApplicationService", () => {
  it("creates Decision Engine output from a Business Brain snapshot", async () => {
    const { engineRepository, publisher, service } = await createService();

    const created = await service.createDecisionEngine({
      commandType: "CreateDecisionEngineV1",
      context,
      engineId,
      brainId,
    });

    expect(created.ok).toBe(true);
    expect(await engineRepository.exists(engineId)).toBe(true);

    if (created.ok) {
      expect(created.value.engine.toSnapshot()).toMatchObject({
        engineId,
        businessId,
        brainId,
      });
      expect(
        created.value.engine.toSnapshot().recommendations.length
      ).toBeGreaterThan(0);
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "DecisionEngineV1Created",
      aggregateId: engineId,
      aggregateType: "DecisionEngineV1",
      correlationId,
      payload: {
        engineId,
        businessId,
        brainId,
      },
    });
  });

  it("queries and transitions recommendation lifecycle", async () => {
    const { publisher, service } = await createService();

    const created = await service.createDecisionEngine({
      commandType: "CreateDecisionEngineV1",
      context,
      engineId,
      brainId,
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const recommendationId = created.value.engine.toSnapshot().recommendations[0]
      ?.recommendationId;
    expect(recommendationId).toBeDefined();
    if (!recommendationId) return;

    const listed = await service.listDecisionEnginesForBusiness({
      queryType: "ListDecisionEnginesForBusiness",
      context,
    });
    expect(listed.engines).toHaveLength(1);

    const reviewed = await service.reviewRecommendation({
      commandType: "ReviewDecisionRecommendation",
      context,
      engineId,
      recommendationId,
    });
    expect(reviewed.ok).toBe(true);

    const accepted = await service.acceptRecommendation({
      commandType: "AcceptDecisionRecommendation",
      context,
      engineId,
      recommendationId,
    });
    expect(accepted.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "DecisionEngineV1Created",
      "DecisionRecommendationReviewed",
      "DecisionRecommendationAccepted",
    ]);
  });

  it("rejects missing and foreign Business Brain access", async () => {
    const { service } = await createService();

    const missing = await service.createDecisionEngine({
      commandType: "CreateDecisionEngineV1",
      context,
      brainId: "missing-brain" as BusinessBrainV1Id,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("BusinessBrainNotFound");
    }

    const foreign = await service.createDecisionEngine({
      commandType: "CreateDecisionEngineV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      brainId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
