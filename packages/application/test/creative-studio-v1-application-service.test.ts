import {
  BusinessBrainV1,
  BusinessFoundation,
  ConversationEngineV1,
  DecisionEngineV1,
  InMemoryBusinessBrainV1Repository,
  InMemoryBusinessFoundationRepository,
  InMemoryConversationEngineV1Repository,
  InMemoryCreativeStudioV1Repository,
  InMemoryDecisionEngineV1Repository,
  type BrandDnaId,
  type BusinessBrainV1Id,
  type BusinessFoundationId,
  type ConversationEngineV1Id,
  type CreativeStudioV1DomainEvent,
  type CreativeStudioV1Id,
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
  CreativeStudioV1ApplicationService,
  type CreativeStudioV1EventPublisher,
} from "../src/creative-studio-v1";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const creativeStudioId = "creative-studio-1" as CreativeStudioV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingCreativeStudioV1EventPublisher
  implements CreativeStudioV1EventPublisher
{
  readonly events: CreativeStudioV1DomainEvent[] = [];

  async publish(event: CreativeStudioV1DomainEvent): Promise<void> {
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
      offer: "guided creative execution platform",
      valueProposition: "Turn approved business intent into creative packages.",
      goals: ["Launch Creative Studio"],
      priorities: ["Create brand-aligned content"],
      lifecycleStage: "active",
    },
  });

  foundation.updateBrandDna({
    brandDnaId,
    positioning: "AI guided business operating system.",
    promise: "Every creative package is grounded in business context.",
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
  const publisher = new RecordingCreativeStudioV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
    "2026-07-08T05:00:00.000Z",
    "2026-07-08T06:00:00.000Z",
  ];
  const service = new CreativeStudioV1ApplicationService(
    creativeStudioRepository,
    foundationRepository,
    brainRepository,
    decisionEngineRepository,
    conversationRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T07:00:00.000Z",
    () => eventId,
    () => creativeStudioId
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
    rationale: "Approved for Creative Studio.",
    actorReference: "user-1",
    executionHandoffIntent: "Create content and publishing packages.",
    decidedAt: "2026-07-08T01:30:00.000Z",
  });

  await foundationRepository.save(foundation);
  await brainRepository.save(brain);
  await decisionEngineRepository.save(decisionEngine);
  await conversationRepository.save(conversation);

  return { creativeStudioRepository, publisher, service };
}

describe("CreativeStudioV1ApplicationService", () => {
  it("creates Creative Studio output from Foundation, Brain, Decision Engine, and Conversation Engine snapshots", async () => {
    const { creativeStudioRepository, publisher, service } =
      await createService();

    const created = await service.createCreativeStudio({
      commandType: "CreateCreativeStudioV1",
      context,
      creativeStudioId,
      foundationId,
      brainId,
      engineId,
      conversationId,
    });

    expect(created.ok).toBe(true);
    expect(await creativeStudioRepository.exists(creativeStudioId)).toBe(true);

    if (created.ok) {
      expect(created.value.creativeStudio.toSnapshot()).toMatchObject({
        creativeStudioId,
        businessId,
        foundationId,
        brainId,
        engineId,
        conversationId,
      });
      expect(
        created.value.creativeStudio.toSnapshot().integration.creativePackageIds
      ).toHaveLength(6);
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "CreativeStudioV1Created",
      aggregateId: creativeStudioId,
      aggregateType: "CreativeStudioV1",
      correlationId,
      payload: {
        creativeStudioId,
        businessId,
        conversationId,
      },
    });
  });

  it("queries, requests review, approves, and packages for handoff", async () => {
    const { publisher, service } = await createService();

    await service.createCreativeStudio({
      commandType: "CreateCreativeStudioV1",
      context,
      creativeStudioId,
      foundationId,
      brainId,
      engineId,
      conversationId,
    });

    const listed = await service.listCreativeStudiosForBusiness({
      queryType: "ListCreativeStudiosForBusiness",
      context,
    });
    expect(listed.creativeStudios).toHaveLength(1);

    const latest = await service.getLatestCreativeStudioForConversation({
      queryType: "GetLatestCreativeStudioForConversation",
      context,
      conversationId,
    });
    expect(latest.creativeStudio?.creativeStudioId).toBe(creativeStudioId);

    const review = await service.requestReview({
      commandType: "RequestCreativeStudioReview",
      context,
      creativeStudioId,
    });
    expect(review.ok).toBe(true);

    const approved = await service.approveCreativeStudio({
      commandType: "ApproveCreativeStudio",
      context,
      creativeStudioId,
    });
    expect(approved.ok).toBe(true);

    const handoff = await service.packageForHandoff({
      commandType: "PackageCreativeStudioForHandoff",
      context,
      creativeStudioId,
    });
    expect(handoff.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "CreativeStudioV1Created",
      "CreativeStudioReviewRequested",
      "CreativeStudioApprovalRecorded",
      "CreativeStudioPackagedForHandoff",
    ]);
  });

  it("rejects missing and foreign upstream access", async () => {
    const { service } = await createService();

    const missing = await service.createCreativeStudio({
      commandType: "CreateCreativeStudioV1",
      context,
      foundationId,
      brainId,
      engineId,
      conversationId: "missing-conversation" as ConversationEngineV1Id,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("ConversationNotFound");
    }

    const foreign = await service.createCreativeStudio({
      commandType: "CreateCreativeStudioV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
      brainId,
      engineId,
      conversationId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
