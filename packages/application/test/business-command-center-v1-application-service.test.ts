import {
  BusinessBrainV1,
  BusinessFoundation,
  ConversationEngineV1,
  CreativeStudioV1,
  DecisionEngineV1,
  GrowthRevenueV1,
  InMemoryBusinessBrainV1Repository,
  InMemoryBusinessCommandCenterV1Repository,
  InMemoryBusinessFoundationRepository,
  InMemoryConversationEngineV1Repository,
  InMemoryCreativeStudioV1Repository,
  InMemoryDecisionEngineV1Repository,
  InMemoryGrowthRevenueV1Repository,
  type BrandDnaId,
  type BusinessBrainV1Id,
  type BusinessCommandCenterV1DomainEvent,
  type BusinessCommandCenterV1Id,
  type BusinessFoundationId,
  type ConversationEngineV1Id,
  type CreativeStudioV1Id,
  type DecisionEngineV1Id,
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
  BusinessCommandCenterV1ApplicationService,
  type BusinessCommandCenterV1EventPublisher,
} from "../src/business-command-center-v1";

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
const commandCenterId = "command-center-1" as BusinessCommandCenterV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingBusinessCommandCenterV1EventPublisher
  implements BusinessCommandCenterV1EventPublisher
{
  readonly events: BusinessCommandCenterV1DomainEvent[] = [];

  async publish(event: BusinessCommandCenterV1DomainEvent): Promise<void> {
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
      goals: ["Launch Command Center"],
      priorities: ["Focus daily operating actions"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every daily action is grounded in business context.",
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
  const commandCenterRepository = new InMemoryBusinessCommandCenterV1Repository();
  const publisher = new RecordingBusinessCommandCenterV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
    "2026-07-08T05:00:00.000Z",
  ];
  const service = new BusinessCommandCenterV1ApplicationService(
    commandCenterRepository,
    foundationRepository,
    brainRepository,
    decisionEngineRepository,
    conversationRepository,
    creativeStudioRepository,
    growthRevenueRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T06:00:00.000Z",
    () => eventId,
    () => commandCenterId
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
    rationale: "Approved for Business Command Center.",
    actorReference: "user-1",
    executionHandoffIntent: "Create daily command center focus records.",
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
  const growthRevenue = GrowthRevenueV1.create({
    growthRevenueId,
    foundation: foundation.toSnapshot(),
    brain: brain.toSnapshot(),
    decisionEngine: decisionEngine.toSnapshot(),
    conversation: conversation.toSnapshot(),
    creativeStudio: creativeStudio.toSnapshot(),
    createdAt,
  });

  await foundationRepository.save(foundation);
  await brainRepository.save(brain);
  await decisionEngineRepository.save(decisionEngine);
  await conversationRepository.save(conversation);
  await creativeStudioRepository.save(creativeStudio);
  await growthRevenueRepository.save(growthRevenue);

  return { commandCenterRepository, publisher, service };
}

describe("BusinessCommandCenterV1ApplicationService", () => {
  it("creates Business Command Center output from all released upstream snapshots", async () => {
    const { commandCenterRepository, publisher, service } =
      await createService();

    const created = await service.createCommandCenter({
      commandType: "CreateBusinessCommandCenterV1",
      context,
      commandCenterId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      growthRevenueId,
    });

    expect(created.ok).toBe(true);
    expect(await commandCenterRepository.exists(commandCenterId)).toBe(true);

    if (created.ok) {
      expect(created.value.commandCenter.toSnapshot()).toMatchObject({
        commandCenterId,
        businessId,
        foundationId,
        brainId,
        engineId,
        conversationId,
        creativeStudioId,
        growthRevenueId,
      });
      expect(
        created.value.commandCenter.toSnapshot().aiRecommendationFeed.length
      ).toBeGreaterThan(0);
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "BusinessCommandCenterV1Created",
      aggregateId: commandCenterId,
      aggregateType: "BusinessCommandCenterV1",
      correlationId,
      payload: {
        commandCenterId,
        businessId,
        growthRevenueId,
      },
    });
  });

  it("queries and changes lifecycle", async () => {
    const { publisher, service } = await createService();

    await service.createCommandCenter({
      commandType: "CreateBusinessCommandCenterV1",
      context,
      commandCenterId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      growthRevenueId,
    });

    const listed = await service.listCommandCentersForBusiness({
      queryType: "ListBusinessCommandCentersForBusiness",
      context,
    });
    expect(listed.commandCenters).toHaveLength(1);

    const latest = await service.getLatestCommandCenterForGrowthRevenue({
      queryType: "GetLatestBusinessCommandCenterForGrowthRevenue",
      context,
      growthRevenueId,
    });
    expect(latest.commandCenter?.commandCenterId).toBe(commandCenterId);

    const changed = await service.changeLifecycle({
      commandType: "ChangeBusinessCommandCenterLifecycle",
      context,
      commandCenterId,
      status: "active",
    });
    expect(changed.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "BusinessCommandCenterV1Created",
      "BusinessCommandCenterLifecycleChanged",
    ]);
  });

  it("rejects missing and foreign upstream access", async () => {
    const { service } = await createService();

    const missing = await service.createCommandCenter({
      commandType: "CreateBusinessCommandCenterV1",
      context,
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      growthRevenueId: "missing-growth" as GrowthRevenueV1Id,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("GrowthRevenueNotFound");
    }

    const foreign = await service.createCommandCenter({
      commandType: "CreateBusinessCommandCenterV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
      brainId,
      engineId,
      conversationId,
      creativeStudioId,
      growthRevenueId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
