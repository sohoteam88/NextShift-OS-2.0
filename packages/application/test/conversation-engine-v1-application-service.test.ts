import {
  BusinessBrainV1,
  BusinessFoundation,
  DecisionEngineV1,
  InMemoryBusinessBrainV1Repository,
  InMemoryBusinessFoundationRepository,
  InMemoryConversationEngineV1Repository,
  InMemoryDecisionEngineV1Repository,
  type BrandDnaId,
  type BusinessBrainV1Id,
  type BusinessFoundationId,
  type ConversationEngineV1DomainEvent,
  type ConversationEngineV1Id,
  type ConversationTurnId,
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
  ConversationEngineV1ApplicationService,
  type ConversationEngineV1EventPublisher,
} from "../src/conversation-engine-v1";

const businessId = "business-1" as BusinessId;
const otherBusinessId = "business-2" as BusinessId;
const tenantId = "tenant-1" as TenantId;
const correlationId = "correlation-1" as CorrelationId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const eventId = "event-1" as EventId;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const createdAt = "2026-07-08T00:00:00.000Z";

const context = {
  businessId,
  tenant: { tenantId },
  actor: { actorType: "user" as const },
  correlationId,
};

class RecordingConversationEngineV1EventPublisher
  implements ConversationEngineV1EventPublisher
{
  readonly events: ConversationEngineV1DomainEvent[] = [];

  async publish(event: ConversationEngineV1DomainEvent): Promise<void> {
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
      goals: ["Launch Conversation Engine"],
      priorities: ["Discuss recommended next actions"],
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
  const foundationRepository = new InMemoryBusinessFoundationRepository();
  const brainRepository = new InMemoryBusinessBrainV1Repository();
  const decisionEngineRepository = new InMemoryDecisionEngineV1Repository();
  const conversationRepository = new InMemoryConversationEngineV1Repository();
  const publisher = new RecordingConversationEngineV1EventPublisher();
  const timestamps = [
    "2026-07-08T02:00:00.000Z",
    "2026-07-08T03:00:00.000Z",
    "2026-07-08T04:00:00.000Z",
    "2026-07-08T05:00:00.000Z",
  ];
  const service = new ConversationEngineV1ApplicationService(
    conversationRepository,
    foundationRepository,
    brainRepository,
    decisionEngineRepository,
    publisher,
    () => timestamps.shift() ?? "2026-07-08T06:00:00.000Z",
    () => eventId,
    () => conversationId,
    () => "turn-2" as ConversationTurnId
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

  await foundationRepository.save(foundation);
  await brainRepository.save(brain);
  await decisionEngineRepository.save(decisionEngine);

  return { conversationRepository, publisher, service };
}

describe("ConversationEngineV1ApplicationService", () => {
  it("creates Conversation Engine output from Foundation, Brain, and Decision Engine snapshots", async () => {
    const { conversationRepository, publisher, service } = await createService();

    const created = await service.createConversation({
      commandType: "CreateConversationEngineV1",
      context,
      conversationId,
      foundationId,
      brainId,
      engineId,
    });

    expect(created.ok).toBe(true);
    expect(await conversationRepository.exists(conversationId)).toBe(true);

    if (created.ok) {
      expect(created.value.conversation.toSnapshot()).toMatchObject({
        conversationId,
        businessId,
        foundationId,
        brainId,
        engineId,
      });
      expect(
        created.value.conversation.toSnapshot().recommendationDiscussions.length
      ).toBeGreaterThan(0);
    }

    expect(publisher.events).toHaveLength(1);
    expect(publisher.events[0]).toMatchObject({
      eventType: "ConversationEngineV1Created",
      aggregateId: conversationId,
      aggregateType: "ConversationEngineV1",
      correlationId,
      payload: {
        conversationId,
        businessId,
        engineId,
      },
    });
  });

  it("queries, adds a turn, requests approval, and approves the conversation", async () => {
    const { publisher, service } = await createService();

    await service.createConversation({
      commandType: "CreateConversationEngineV1",
      context,
      conversationId,
      foundationId,
      brainId,
      engineId,
    });

    const listed = await service.listConversationsForBusiness({
      queryType: "ListConversationsForBusiness",
      context,
    });
    expect(listed.conversations).toHaveLength(1);

    const turn = await service.addTurn({
      commandType: "AddConversationTurn",
      context,
      conversationId,
      role: "user",
      message: "Let's discuss this recommendation.",
    });
    expect(turn.ok).toBe(true);

    const approval = await service.requestApproval({
      commandType: "RequestConversationApproval",
      context,
      conversationId,
    });
    expect(approval.ok).toBe(true);

    const approved = await service.approveConversation({
      commandType: "ApproveConversation",
      context,
      conversationId,
      rationale: "The conversation clarified the next step.",
      actorReference: "user-1",
      executionHandoffIntent: "Prepare a future execution brief.",
    });
    expect(approved.ok).toBe(true);

    expect(publisher.events.map((event) => event.eventType)).toEqual([
      "ConversationEngineV1Created",
      "ConversationTurnAdded",
      "ConversationLifecycleChanged",
      "ConversationApprovalRecorded",
    ]);
  });

  it("rejects missing and foreign upstream access", async () => {
    const { service } = await createService();

    const missing = await service.createConversation({
      commandType: "CreateConversationEngineV1",
      context,
      foundationId,
      brainId,
      engineId: "missing-engine" as DecisionEngineV1Id,
    });

    expect(missing.ok).toBe(false);
    if (!missing.ok) {
      expect(missing.error.code).toBe("DecisionEngineNotFound");
    }

    const foreign = await service.createConversation({
      commandType: "CreateConversationEngineV1",
      context: {
        ...context,
        businessId: otherBusinessId,
      },
      foundationId,
      brainId,
      engineId,
    });

    expect(foreign.ok).toBe(false);
    if (!foreign.ok) {
      expect(foreign.error.code).toBe("ValidationFailed");
    }
  });
});
