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
  type ConversationEngineV1Id,
} from "../src/conversation-engine-v1";
import {
  CreativeStudioV1,
  InMemoryCreativeStudioV1Repository,
  type CreativeStudioV1Id,
} from "../src/creative-studio-v1";
import {
  DecisionEngineV1,
  type DecisionEngineV1Id,
} from "../src/decision-engine-v1";

const businessId = "business-1" as BusinessId;
const foundationId = "foundation-1" as BusinessFoundationId;
const brainId = "brain-1" as BusinessBrainV1Id;
const engineId = "engine-1" as DecisionEngineV1Id;
const conversationId = "conversation-1" as ConversationEngineV1Id;
const creativeStudioId = "creative-studio-1" as CreativeStudioV1Id;
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
    title: "Creative pattern",
    fact: "Founder prefers evidence-backed creative.",
    tags: ["creative"],
    source: source(),
    createdAt: "2026-07-08T03:00:00.000Z",
  });
  foundation.addCustomerMemory({
    memoryId: customerMemoryId,
    segment: "Solo founders",
    need: "Create clear content from approved strategy.",
    offerFit: "Guided creative system.",
    source: source(),
    createdAt: "2026-07-08T04:00:00.000Z",
  });
  foundation.addTimelineEvent({
    eventId: timelineEventId,
    type: "decision",
    title: "Conversation Engine released",
    occurredAt: "2026-07-08T05:00:00.000Z",
    summary: "Conversation Engine v1.0 was released.",
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
    decidedAt: "2026-07-08T06:00:00.000Z",
  });

  return { foundation, brain, decisionEngine, conversation };
}

describe("CreativeStudioV1 aggregate", () => {
  it("creates writer, content, visual, carousel, reel, blog, email, publishing, brand, lifecycle, and integration outputs", () => {
    const { foundation, brain, decisionEngine, conversation } = createUpstream();
    const foundationBefore = foundation.toSnapshot();
    const brainBefore = brain.toSnapshot();
    const decisionBefore = decisionEngine.toSnapshot();
    const conversationBefore = conversation.toSnapshot();

    const creativeStudio = CreativeStudioV1.create({
      creativeStudioId,
      foundation: foundationBefore,
      brain: brainBefore,
      decisionEngine: decisionBefore,
      conversation: conversationBefore,
      createdAt,
    });
    const snapshot = creativeStudio.toSnapshot();

    expect(snapshot).toMatchObject({
      creativeStudioId,
      businessId,
      foundationId,
      brainId,
      engineId,
      conversationId,
      lifecycleStatus: "drafted",
      sourceContext: {
        businessName: "NextShift Studio",
        conversationHandoffIntent: "Create content and publishing packages.",
      },
      brandKitApplication: {
        alignmentState: "aligned",
      },
    });
    expect(snapshot.aiWriter.draftVariants).toHaveLength(2);
    expect(snapshot.contentPackage.captions.length).toBeGreaterThan(0);
    expect(snapshot.visualPackage.assetConcepts.length).toBeGreaterThan(0);
    expect(snapshot.carouselPackage.slides.length).toBeGreaterThan(0);
    expect(snapshot.reelPackage.scenePlan).toContain("recommended next step");
    expect(snapshot.blogDraft.sections.length).toBeGreaterThan(0);
    expect(snapshot.emailDraft.subject).toContain("NextShift Studio");
    expect(snapshot.publishingPackage.readinessState).toBe("draft");
    expect(snapshot.integration.creativePackageIds).toHaveLength(6);
    expect(foundation.toSnapshot()).toEqual(foundationBefore);
    expect(brain.toSnapshot()).toEqual(brainBefore);
    expect(decisionEngine.toSnapshot()).toEqual(decisionBefore);
    expect(conversation.toSnapshot()).toEqual(conversationBefore);
  });

  it("supports review, approval, handoff, revision, rejection, and archive lifecycle transitions", () => {
    const { foundation, brain, decisionEngine, conversation } = createUpstream();
    const creativeStudio = CreativeStudioV1.create({
      creativeStudioId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      createdAt,
    });

    creativeStudio.requestReview("2026-07-08T01:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe("in_review");

    creativeStudio.approve("2026-07-08T02:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe("approved");

    creativeStudio.packageForHandoff("2026-07-08T03:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe("ready_for_handoff");
    expect(creativeStudio.toSnapshot().publishingPackage.readinessState).toBe(
      "ready_for_handoff"
    );

    creativeStudio.requestRevision("2026-07-08T04:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe(
      "revision_requested"
    );

    creativeStudio.reject("2026-07-08T05:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe("rejected");

    creativeStudio.archive("2026-07-08T06:00:00.000Z");
    expect(creativeStudio.toSnapshot().lifecycleStatus).toBe("archived");
  });
});

describe("InMemoryCreativeStudioV1Repository", () => {
  it("saves and retrieves Creative Studio outputs by business and Conversation Engine", async () => {
    const repository = new InMemoryCreativeStudioV1Repository();
    const { foundation, brain, decisionEngine, conversation } = createUpstream();
    const creativeStudio = CreativeStudioV1.create({
      creativeStudioId,
      foundation: foundation.toSnapshot(),
      brain: brain.toSnapshot(),
      decisionEngine: decisionEngine.toSnapshot(),
      conversation: conversation.toSnapshot(),
      createdAt,
    });

    await repository.save(creativeStudio);

    expect(await repository.exists(creativeStudioId)).toBe(true);
    expect((await repository.findById(creativeStudioId))?.toSnapshot()).toEqual(
      creativeStudio.toSnapshot()
    );
    expect(await repository.findByBusinessId(businessId)).toHaveLength(1);
    expect(
      (await repository.findLatestByConversationId(conversationId))
        ?.creativeStudioId
    ).toBe(creativeStudioId);
  });
});
