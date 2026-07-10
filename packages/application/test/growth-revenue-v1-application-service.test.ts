import {
  BusinessBrainV1,
  BusinessFoundation,
  ConversationEngineV1,
  CreativeStudioV1,
  DecisionEngineV1,
  InMemoryBusinessBrainV1Repository,
  InMemoryBusinessFoundationRepository,
  InMemoryConversationEngineV1Repository,
  InMemoryCreativeStudioV1Repository,
  InMemoryDecisionEngineV1Repository,
  InMemoryGrowthRevenueV1Repository,
  type BrandDnaId,
  type BusinessBrainV1Id,
  type BusinessFoundationId,
  type ConversationEngineV1Id,
  type CreativeStudioV1Id,
  type DecisionEngineV1Id,
  type GrowthRevenueV1DomainEvent,
  type GrowthRevenueV1Id,
} from "@nextshift/domain";
import type {
  BusinessId,
  CorrelationId,
  EventId,
  TenantId,
} from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  GrowthRevenueV1ApplicationService,
  type GrowthRevenueV1EventPublisher,
} from "../src/growth-revenue-v1";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const creativeStudioId = "creative-studio-1" as CreativeStudioV1Id;
const growthRevenueId = "growth-revenue-1" as GrowthRevenueV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingGrowthRevenueV1EventPublisher
  implements GrowthRevenueV1EventPublisher
{
  readonly events: GrowthRevenueV1DomainEvent[] = [];

  async publish(event: GrowthRevenueV1DomainEvent): Promise<void> {
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
      offer: "guided revenue execution platform",
      valueProposition: "Turn approved creative into measurable revenue.",
      goals: ["Launch Growth & Revenue"],
      priorities: ["Convert qualified leads"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every revenue action is grounded in business context.",
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
  const foundationRepository = new InMemoryBusinessFoundationRepository();
  const brainRepository = new InMemoryBusinessBrainV1Repository();
  const decisionEngineRepository = new InMemoryDecisionEngineV1Repository();
  const conversationRepository = new InMemoryConversationEngineV1Repository();
  const creativeStudioRepository = new InMemoryCreativeStudioV1Repository();
  const growthRevenueRepository = new InMemoryGrowthRevenueV1Repository();
  const publisher = new RecordingGrowthRevenueV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
    "2026-07-08T05:00:00.000Z",
  ];
  const service = new GrowthRevenueV1ApplicationService(
    growthRevenueRepository,
    foundationRepository,
    brainRepository,
    decisionEngineRepository,
    conversationRepository,
    creativeStudioRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T06:00:00.000Z",
    () => eventId,
    () => growthRevenueId
  );
  const foundation = createFoundation();
  const brain = BusinessBrainV1.create({
    brainId,
    foundation: foundation.toSnapshot(),
    createdAt,
  });
  const decisionEngine = DecisionEngineV1.create({
    engineId,
    brain: brain.toSnapshot(),
    createdAt,
  });
  const conversation = ConversationEngineV1.create({
    conversationId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    createdAt,
  });
  conversation.approve({
    rationale: "Approved for Growth & Revenue.",
    actorReference: "user-1",
    executionHandoffIntent: "Create growth and revenue planning records.",
    decidedAt: "2026-07-08T01:00:00.000Z",
  });
  const creativeStudio = CreativeStudioV1.create({
    creativeStudioId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    conversation: conversation.toSnapshot(),
    createdAt,
  });
  creativeStudio.packageForHandoff("2026-07-08T01:30:00.000Z");

  await foundationRepository.save(foundation);
  await brainRepository.save(brain);
  await decisionEngineRepository.save(decisionEngine);
  await conversationRepository.save(conversation);
  await creativeStudioRepository.save(creativeStudio);

  return { growthRevenueRepository, publisher, service };
}

describe("GrowthRevenueV1ApplicationService", () => {
  it("creates Growth & Revenue output from all released upstream snapshots", async () => {
    const { growthRevenueRepository, publisher, service } =
      await createService();

    const created = await service.createGrowthRevenue({
      commandType: "CreateGrowthRevenueV1",
      context,
      growthRevenueId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
    });

    expect(created.ok).toBe(true);
    expect(await growthRevenueRepository.exists(growthRevenueId)).toBe(true);

    if (created.ok) {
      expect(created.value.growthRevenue.toSnapshot()).toMatchObject({
        growthRevenueId,
        businessId,
        foundationId,
        brainId,
        engineId,
        conversationId,
        creativeStudioId,
      });
      expect(
        created.value.growthRevenue.toSnapshot().growthRecommendations.length
      ).toBeGreaterThan(0);
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "GrowthRevenueV1Created",
      aggregateId: growthRevenueId,
      aggregateType: "GrowthRevenueV1",
      correlationId,
      payload: {
        growthRevenueId,
        businessId,
        creativeStudioId,
      },
    });
  });

  it("queries and changes lifecycle", async () => {
    const { publisher, service } = await createService();

    await service.createGrowthRevenue({
      commandType: "CreateGrowthRevenueV1",
      context,
      growthRevenueId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
    });

    const listed = await service.listGrowthRevenueForBusiness({
      queryType: "ListGrowthRevenueForBusiness",
      context,
    });
    expect(listed.growthRevenueRecords).toHaveLength(1);

    const latest = await service.getLatestGrowthRevenueForCreativeStudio({
      queryType: "GetLatestGrowthRevenueForCreativeStudio",
      context,
      creativeStudioId,
    });
    expect(latest.growthRevenue?.growthRevenueId).toBe(growthRevenueId);

    const changed = await service.changeLifecycle({
      commandType: "ChangeGrowthRevenueLifecycle",
      context,
      growthRevenueId,
      status: "forecasted",
    });
    expect(changed.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "GrowthRevenueV1Created",
      "GrowthRevenueLifecycleChanged",
    ]);
  });

  it("rejects missing and foreign upstream access", async () => {
    const { service } = await createService();

    const missing = await service.createGrowthRevenue({
      commandType: "CreateGrowthRevenueV1",
      context,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId: "missing-creative" as CreativeStudioV1Id,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("CreativeStudioNotFound");
    }

    const foreign = await service.createGrowthRevenue({
      commandType: "CreateGrowthRevenueV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
