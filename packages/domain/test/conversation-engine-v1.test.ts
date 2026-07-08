import type { BusinessId } from "@nextshift/shared";
import { describe, expect, it } from "vitest";
import {
  BusinessBrainV1,
  type BusinessBrainV1Id,
} from "../src/business-brain-v1";
import {
  BusinessFoundation,
  type BrandDnaId,
  type BusinessFoundationId,
  type BusinessMemoryId,
  type BusinessTimelineEventId,
  type CustomerMemoryId,
  type KnowledgeNodeId,
} from "../src/business-foundation";
import {
  ConversationEngineV1,
  InMemoryConversationEngineV1Repository,
  type ConversationEngineV1Id,
  type ConversationTurnId,
} from "../src/conversation-engine-v1";
import {
  DecisionEngineV1,
  type DecisionEngineV1Id,
} from "../src/decision-engine-v1";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const brandDnaId = "brand-dna-1" as BrandDnaId;
const knowledgeNodeId = "knowledge-node-1" as KnowledgeNodeId;
const businessMemoryId = "business-memory-1" as BusinessMemoryId;
const customerMemoryId = "customer-memory-1" as CustomerMemoryId;
const timelineEventId = "timeline-1" as BusinessTimelineEventId;
const createdAt = "2026-07-08T00:00:00.000Z";

function source() {
  return {
    type: "manual" as const,
    referenceId: "source-1",
    summary: "Founder interview.",
    capturedAt: createdAt,
  };
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
  foundation.addKnowledgeNode({
    nodeId: knowledgeNodeId,
    type: "business",
    label: "NextShift Studio",
    summary: "The operating business.",
    confidence: 0.95,
    source: source(),
    createdAt: "2026-07-08T02:00:00.000Z",
  });
  foundation.addBusinessMemory({
    memoryId: businessMemoryId,
    title: "Decision pattern",
    fact: "Founder prefers evidence-backed recommendations.",
    tags: ["conversation"],
    source: source(),
    createdAt: "2026-07-08T03:00:00.000Z",
  });
  foundation.addCustomerMemory({
    memoryId: customerMemoryId,
    segment: "Solo founders",
    need: "Discuss tradeoffs before approving execution.",
    offerFit: "Guided operating system.",
    source: source(),
    createdAt: "2026-07-08T04:00:00.000Z",
  });
  foundation.addTimelineEvent({
    eventId: timelineEventId,
    type: "decision",
    title: "Decision Engine released",
    occurredAt: "2026-07-08T05:00:00.000Z",
    summary: "Decision Engine v1.0 was released.",
    source: source(),
  });

  return foundation;
}

function createUpstream() {
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

  return { foundation, brain, decisionEngine };
}

describe("ConversationEngineV1 aggregate", () => {
  it("creates strategy chat, discussion, context, brainstorming, memory, approval, and lifecycle outputs", () => {
    const { foundation, brain, decisionEngine } = createUpstream();
    const foundationBefore = foundation.toSnapshot();
    const brainBefore = brain.toSnapshot();
    const decisionBefore = decisionEngine.toSnapshot();

    const conversation = ConversationEngineV1.create({
      conversationId,
      foundation: foundationBefore,
      brain: brainBefore,
      decisionEngine: decisionBefore,
      createdAt,
    });
    const snapshot = conversation.toSnapshot();

    expect(snapshot).toMatchObject({
      conversationId,
      businessId,
      foundationId,
      brainId,
      engineId,
      context: {
        businessName: "NextShift Studio",
      },
      approval: {
        status: "pending",
      },
    });
    expect(snapshot.strategyChat.prompt).toContain("Start with:");
    expect(snapshot.recommendationDiscussions.length).toBeGreaterThan(0);
    expect(snapshot.brainstormOptions.length).toBeGreaterThan(0);
    expect(snapshot.memoryReferences.length).toBeGreaterThan(0);
    expect(snapshot.turns).toHaveLength(1);
    expect(foundation.toSnapshot()).toEqual(foundationBefore);
    expect(brain.toSnapshot()).toEqual(brainBefore);
    expect(decisionEngine.toSnapshot()).toEqual(decisionBefore);
  });

  it("supports clarification, turn, approval, resolution, and archive lifecycle transitions", () => {
    const { foundation, brain, decisionEngine } = createUpstream();
    const conversation = ConversationEngineV1.create({
      conversationId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      createdAt,
    });

    conversation.addTurn({
      turnId: "turn-2" as ConversationTurnId,
      role: "user",
      message: "I want to discuss the top recommendation.",
      createdAt: "2026-07-08T01:00:00.000Z",
    });
    expect(conversation.toSnapshot().lifecycleStatus).toBe("in_progress");

    conversation.requestApproval("2026-07-08T02:00:00.000Z");
    expect(conversation.toSnapshot().lifecycleStatus).toBe("awaiting_approval");

    conversation.approve({
      rationale: "The recommendation is aligned.",
      actorReference: "user-1",
      executionHandoffIntent: "Prepare a future execution brief.",
      decidedAt: "2026-07-08T03:00:00.000Z",
    });
    expect(conversation.toSnapshot().lifecycleStatus).toBe("approved");

    conversation.resolve("2026-07-08T04:00:00.000Z");
    expect(conversation.toSnapshot().lifecycleStatus).toBe("resolved");

    conversation.archive("2026-07-08T05:00:00.000Z");
    expect(conversation.toSnapshot().lifecycleStatus).toBe("archived");
  });
});

describe("InMemoryConversationEngineV1Repository", () => {
  it("saves and retrieves Conversation Engine outputs by business and Decision Engine", async () => {
    const repository = new InMemoryConversationEngineV1Repository();
    const { foundation, brain, decisionEngine } = createUpstream();
    const conversation = ConversationEngineV1.create({
      conversationId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      createdAt,
    });

    await repository.save(conversation);

    expect(await repository.exists(conversationId)).toBe(true);
    expect((await repository.findById(conversationId))?.toSnapshot()).toEqual(
      conversation.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(
      (await repository.findLatestByDecisionEngineId(engineId))?.conversationId
    ).toBe(conversationId);
  });
});
