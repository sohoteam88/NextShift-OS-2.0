import type {
  BusinessBrainV1Id,
  BusinessBrainV1Snapshot,
} from "../business-brain-v1";
import type {
  BusinessFoundationId,
  BusinessFoundationSnapshot,
} from "../business-foundation";
import type {
  ConversationEngineV1Id,
  ConversationEngineV1Snapshot,
} from "../conversation-engine-v1";
import type {
  DecisionEngineV1Id,
  DecisionRecommendation,
  DecisionRecommendationId,
  DecisionEngineV1Snapshot,
} from "../decision-engine-v1";
import type {
  Brand,
  BusinessId,
  CausationId,
  CorrelationId,
  EventId,
  Timestamp,
} from "@nextshift/shared";

export type CreativeStudioV1Id = Brand<string, "CreativeStudioV1Id">;
export type CreativePackageId = Brand<string, "CreativePackageId">;
export type PublishingPackageId = Brand<string, "PublishingPackageId">;
export type BrandKitApplicationId = Brand<string, "BrandKitApplicationId">;

export type CreativeLifecycleStatus =
  | "drafted"
  | "in_review"
  | "revision_requested"
  | "approved"
  | "packaged"
  | "ready_for_handoff"
  | "rejected"
  | "archived";

export type CreativeReviewState = "draft" | "in_review" | "approved" | "revision_requested";
export type BrandAlignmentState = "aligned" | "needs_review";
export type PublishingReadinessState = "draft" | "ready_for_handoff";

export interface CreativeSourceContext {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly brandVoice: string;
  readonly recommendationIds: readonly DecisionRecommendationId[];
  readonly conversationHandoffIntent?: string;
}

export interface AIWriterOutput {
  readonly objective: string;
  readonly prompt: string;
  readonly targetAudience: string;
  readonly voice: string;
  readonly draftVariants: readonly string[];
  readonly evidenceSummaries: readonly string[];
}

export interface ContentGenerationPackage {
  readonly packageId: CreativePackageId;
  readonly channel: string;
  readonly objective: string;
  readonly captions: readonly string[];
  readonly scripts: readonly string[];
  readonly outlines: readonly string[];
  readonly messageSections: readonly string[];
  readonly reviewNotes: readonly string[];
  readonly revisionState: CreativeReviewState;
}

export interface VisualGenerationPackage {
  readonly packageId: CreativePackageId;
  readonly objective: string;
  readonly creativeDirection: string;
  readonly styleConstraints: readonly string[];
  readonly assetConcepts: readonly string[];
  readonly variants: readonly string[];
  readonly usageNotes: readonly string[];
  readonly reviewState: CreativeReviewState;
}

export interface CarouselSlide {
  readonly slideNumber: number;
  readonly copy: string;
  readonly visualDirection: string;
}

export interface CarouselPackage {
  readonly packageId: CreativePackageId;
  readonly title: string;
  readonly slides: readonly CarouselSlide[];
  readonly callToAction: string;
  readonly channelMetadata: string;
  readonly approvalState: CreativeReviewState;
}

export interface ReelPackage {
  readonly packageId: CreativePackageId;
  readonly hook: string;
  readonly script: string;
  readonly scenePlan: readonly string[];
  readonly captions: readonly string[];
  readonly visualNotes: readonly string[];
  readonly durationTarget: string;
  readonly callToAction: string;
  readonly approvalState: CreativeReviewState;
}

export interface BlogDraftPackage {
  readonly packageId: CreativePackageId;
  readonly title: string;
  readonly outline: readonly string[];
  readonly sections: readonly string[];
  readonly audienceSegmentReference: string;
  readonly messageReference: string;
  readonly reviewState: CreativeReviewState;
}

export interface EmailDraftPackage {
  readonly packageId: CreativePackageId;
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly audienceSegmentReference: string;
  readonly offerReference: string;
  readonly reviewState: CreativeReviewState;
}

export interface PublishingPackage {
  readonly publishingPackageId: PublishingPackageId;
  readonly channelTarget: string;
  readonly packageType: "content" | "visual" | "carousel" | "reel" | "blog" | "email";
  readonly assetReferences: readonly CreativePackageId[];
  readonly copyReferences: readonly CreativePackageId[];
  readonly schedulingIntent: string;
  readonly approvalStatus: CreativeReviewState;
  readonly readinessState: PublishingReadinessState;
}

export interface BrandKitApplication {
  readonly brandKitApplicationId: BrandKitApplicationId;
  readonly brandIdentityReference: string;
  readonly voiceAndToneConstraints: readonly string[];
  readonly visualStyleReferences: readonly string[];
  readonly prohibitedTerms: readonly string[];
  readonly validationNotes: readonly string[];
  readonly alignmentState: BrandAlignmentState;
}

export interface CreativeIntegrationReference {
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly recommendationIds: readonly DecisionRecommendationId[];
  readonly creativePackageIds: readonly CreativePackageId[];
  readonly publishingPackageIds: readonly PublishingPackageId[];
  readonly downstreamHandoffIntent?: string;
}

export interface CreativeStudioV1Snapshot {
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly businessId: BusinessId;
  readonly foundationId: BusinessFoundationId;
  readonly brainId: BusinessBrainV1Id;
  readonly engineId: DecisionEngineV1Id;
  readonly conversationId: ConversationEngineV1Id;
  readonly sourceContext: CreativeSourceContext;
  readonly aiWriter: AIWriterOutput;
  readonly contentPackage: ContentGenerationPackage;
  readonly visualPackage: VisualGenerationPackage;
  readonly carouselPackage: CarouselPackage;
  readonly reelPackage: ReelPackage;
  readonly blogDraft: BlogDraftPackage;
  readonly emailDraft: EmailDraftPackage;
  readonly publishingPackage: PublishingPackage;
  readonly brandKitApplication: BrandKitApplication;
  readonly integration: CreativeIntegrationReference;
  readonly lifecycleStatus: CreativeLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateCreativeStudioV1Input {
  readonly creativeStudioId: CreativeStudioV1Id;
  readonly foundation: BusinessFoundationSnapshot;
  readonly brain: BusinessBrainV1Snapshot;
  readonly decisionEngine: DecisionEngineV1Snapshot;
  readonly conversation: ConversationEngineV1Snapshot;
  readonly createdAt: Timestamp;
}

export interface CreativeStudioV1EventMetadata {
  readonly eventId: EventId;
  readonly eventType: CreativeStudioV1EventType;
  readonly aggregateId: CreativeStudioV1Id;
  readonly aggregateType: "CreativeStudioV1";
  readonly occurredAt: Timestamp;
  readonly version: 1;
  readonly correlationId?: CorrelationId;
  readonly causationId?: CausationId;
}

export type CreativeStudioV1EventType =
  | "CreativeStudioV1Created"
  | "CreativeStudioReviewRequested"
  | "CreativeStudioApprovalRecorded"
  | "CreativeStudioPackagedForHandoff"
  | "CreativeStudioLifecycleChanged";

export interface CreativeStudioV1CreatedEvent
  extends CreativeStudioV1EventMetadata {
  readonly eventType: "CreativeStudioV1Created";
  readonly payload: {
    readonly creativeStudioId: CreativeStudioV1Id;
    readonly businessId: BusinessId;
    readonly conversationId: ConversationEngineV1Id;
    readonly packageCount: number;
    readonly createdAt: Timestamp;
  };
}

export interface CreativeStudioV1ChangedEvent
  extends CreativeStudioV1EventMetadata {
  readonly eventType:
    | "CreativeStudioReviewRequested"
    | "CreativeStudioApprovalRecorded"
    | "CreativeStudioPackagedForHandoff"
    | "CreativeStudioLifecycleChanged";
  readonly payload: {
    readonly creativeStudioId: CreativeStudioV1Id;
    readonly status: CreativeLifecycleStatus;
    readonly changedAt: Timestamp;
  };
}

export type CreativeStudioV1DomainEvent =
  | CreativeStudioV1CreatedEvent
  | CreativeStudioV1ChangedEvent;

export class CreativeStudioV1 {
  private constructor(private snapshot: CreativeStudioV1Snapshot) {}

  static create(input: CreateCreativeStudioV1Input): CreativeStudioV1 {
    const createdAt = createTimestamp(input.createdAt, "createdAt");
    validateUpstream(
      input.foundation,
      input.brain,
      input.decisionEngine,
      input.conversation
    );
    const recommendations = input.decisionEngine.recommendations.slice(0, 2);
    const packageIds = createPackageIds(input.creativeStudioId);
    const brandVoice =
      input.foundation.brandDna?.voice ?? "clear, helpful, and brand-aligned";
    const evidenceSummaries = collectEvidenceSummaries(input.brain, recommendations);
    const sourceContext: CreativeSourceContext = {
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      businessName: input.foundation.twin.name,
      audience: input.foundation.twin.audience,
      offer: input.foundation.twin.offer,
      brandVoice,
      recommendationIds: recommendations.map(
        (recommendation) => recommendation.recommendationId
      ),
      conversationHandoffIntent:
        input.conversation.approval.executionHandoffIntent,
    };
    const aiWriter = createAIWriter(input, sourceContext, evidenceSummaries);
    const contentPackage = createContentPackage(packageIds.content, aiWriter);
    const visualPackage = createVisualPackage(
      packageIds.visual,
      input.foundation,
      input.decisionEngine
    );
    const carouselPackage = createCarouselPackage(
      packageIds.carousel,
      input.foundation,
      recommendations
    );
    const reelPackage = createReelPackage(
      packageIds.reel,
      input.foundation,
      recommendations
    );
    const blogDraft = createBlogDraft(packageIds.blog, input.foundation, aiWriter);
    const emailDraft = createEmailDraft(packageIds.email, input.foundation);
    const publishingPackage = createPublishingPackage(
      input.creativeStudioId,
      packageIds
    );

    return new CreativeStudioV1({
      creativeStudioId: input.creativeStudioId,
      businessId: input.foundation.businessId,
      foundationId: input.foundation.foundationId,
      brainId: input.brain.brainId,
      engineId: input.decisionEngine.engineId,
      conversationId: input.conversation.conversationId,
      sourceContext,
      aiWriter,
      contentPackage,
      visualPackage,
      carouselPackage,
      reelPackage,
      blogDraft,
      emailDraft,
      publishingPackage,
      brandKitApplication: createBrandKitApplication(
        input.creativeStudioId,
        input.foundation
      ),
      integration: {
        foundationId: input.foundation.foundationId,
        brainId: input.brain.brainId,
        engineId: input.decisionEngine.engineId,
        conversationId: input.conversation.conversationId,
        recommendationIds: sourceContext.recommendationIds,
        creativePackageIds: Object.values(packageIds),
        publishingPackageIds: [publishingPackage.publishingPackageId],
        downstreamHandoffIntent:
          input.conversation.approval.executionHandoffIntent,
      },
      lifecycleStatus: "drafted",
      createdAt,
      updatedAt: createdAt,
    });
  }

  static rehydrate(snapshot: CreativeStudioV1Snapshot): CreativeStudioV1 {
    validateSnapshot(snapshot);
    return new CreativeStudioV1(cloneSnapshot(snapshot));
  }

  get creativeStudioId(): CreativeStudioV1Id {
    return this.snapshot.creativeStudioId;
  }

  get businessId(): BusinessId {
    return this.snapshot.businessId;
  }

  get conversationId(): ConversationEngineV1Id {
    return this.snapshot.conversationId;
  }

  requestReview(requestedAt: Timestamp): void {
    this.transition("in_review", requestedAt);
  }

  approve(approvedAt: Timestamp): void {
    this.transition("approved", approvedAt);
  }

  requestRevision(requestedAt: Timestamp): void {
    this.transition("revision_requested", requestedAt);
  }

  reject(rejectedAt: Timestamp): void {
    this.transition("rejected", rejectedAt);
  }

  packageForHandoff(packagedAt: Timestamp): void {
    const timestamp = createTimestamp(packagedAt, "packagedAt");
    this.replace({
      ...this.snapshot,
      publishingPackage: {
        ...this.snapshot.publishingPackage,
        approvalStatus: "approved",
        readinessState: "ready_for_handoff",
      },
      lifecycleStatus: "ready_for_handoff",
      updatedAt: timestamp,
    });
  }

  archive(archivedAt: Timestamp): void {
    this.transition("archived", archivedAt);
  }

  toSnapshot(): CreativeStudioV1Snapshot {
    return cloneSnapshot(this.snapshot);
  }

  private transition(status: CreativeLifecycleStatus, changedAt: Timestamp): void {
    const timestamp = createTimestamp(changedAt, "changedAt");
    this.replace({
      ...this.snapshot,
      lifecycleStatus: status,
      updatedAt: timestamp,
    });
  }

  private replace(snapshot: CreativeStudioV1Snapshot): void {
    validateSnapshot(snapshot);
    this.snapshot = cloneSnapshot(snapshot);
  }
}

function createAIWriter(
  input: CreateCreativeStudioV1Input,
  sourceContext: CreativeSourceContext,
  evidenceSummaries: readonly string[]
): AIWriterOutput {
  const topRecommendation = input.decisionEngine.recommendations[0];
  const objective =
    topRecommendation?.recommendedAction ??
    input.conversation.approval.executionHandoffIntent ??
    input.brain.interpretation.meaning;

  return {
    objective,
    prompt: `Create brand-aligned creative for ${sourceContext.businessName}: ${objective}`,
    targetAudience: sourceContext.audience,
    voice: sourceContext.brandVoice,
    draftVariants: [
      `${sourceContext.businessName} helps ${sourceContext.audience} ${input.foundation.twin.valueProposition}.`,
      `Turn ${sourceContext.offer} into a clear next step for ${sourceContext.audience}.`,
    ],
    evidenceSummaries,
  };
}

function createContentPackage(
  packageId: CreativePackageId,
  aiWriter: AIWriterOutput
): ContentGenerationPackage {
  return {
    packageId,
    channel: "multi-channel",
    objective: aiWriter.objective,
    captions: aiWriter.draftVariants,
    scripts: [`Hook: ${aiWriter.prompt}`, `Body: ${aiWriter.evidenceSummaries[0] ?? aiWriter.objective}`],
    outlines: ["problem", "context", "recommendation", "call to action"],
    messageSections: [aiWriter.objective, ...aiWriter.evidenceSummaries],
    reviewNotes: ["Generated from approved upstream context."],
    revisionState: "draft",
  };
}

function createVisualPackage(
  packageId: CreativePackageId,
  foundation: BusinessFoundationSnapshot,
  decisionEngine: DecisionEngineV1Snapshot
): VisualGenerationPackage {
  return {
    packageId,
    objective: `Visualize ${decisionEngine.healthEvaluation.summary}`,
    creativeDirection: `${foundation.twin.name} should feel ${foundation.brandDna?.voice ?? "clear and practical"}.`,
    styleConstraints: [
      foundation.brandDna?.positioning ?? foundation.twin.valueProposition,
      ...foundation.twin.priorities,
    ],
    assetConcepts: decisionEngine.opportunities.map(
      (opportunity) => opportunity.title
    ),
    variants: ["primary social graphic", "supporting story visual"],
    usageNotes: ["Use as generation-ready visual direction, not as final rendered assets."],
    reviewState: "draft",
  };
}

function createCarouselPackage(
  packageId: CreativePackageId,
  foundation: BusinessFoundationSnapshot,
  recommendations: readonly DecisionRecommendation[]
): CarouselPackage {
  const slides = recommendations.length > 0
    ? recommendations.map((recommendation, index) => ({
        slideNumber: index + 1,
        copy: recommendation.summary,
        visualDirection: recommendation.explanation.reason,
      }))
    : [
        {
          slideNumber: 1,
          copy: foundation.twin.valueProposition,
          visualDirection: foundation.twin.market,
        },
      ];

  return {
    packageId,
    title: `${foundation.twin.name} recommendation carousel`,
    slides,
    callToAction: foundation.twin.offer,
    channelMetadata: "carousel-ready package",
    approvalState: "draft",
  };
}

function createReelPackage(
  packageId: CreativePackageId,
  foundation: BusinessFoundationSnapshot,
  recommendations: readonly DecisionRecommendation[]
): ReelPackage {
  const topRecommendation = recommendations[0];
  return {
    packageId,
    hook: topRecommendation?.title ?? foundation.twin.valueProposition,
    script:
      topRecommendation?.recommendedAction ??
      `Explain how ${foundation.twin.offer} helps ${foundation.twin.audience}.`,
    scenePlan: ["problem setup", "business context", "recommended next step"],
    captions: [
      topRecommendation?.summary ?? foundation.twin.valueProposition,
      foundation.twin.offer,
    ],
    visualNotes: ["Keep the reel grounded in brand and audience context."],
    durationTarget: "30-60 seconds",
    callToAction: foundation.twin.offer,
    approvalState: "draft",
  };
}

function createBlogDraft(
  packageId: CreativePackageId,
  foundation: BusinessFoundationSnapshot,
  aiWriter: AIWriterOutput
): BlogDraftPackage {
  return {
    packageId,
    title: `How ${foundation.twin.name} helps ${foundation.twin.audience}`,
    outline: ["current situation", "strategic context", "recommended action"],
    sections: [aiWriter.objective, ...aiWriter.evidenceSummaries],
    audienceSegmentReference: foundation.twin.audience,
    messageReference: aiWriter.objective,
    reviewState: "draft",
  };
}

function createEmailDraft(
  packageId: CreativePackageId,
  foundation: BusinessFoundationSnapshot
): EmailDraftPackage {
  return {
    packageId,
    subject: `${foundation.twin.name}: your next business step`,
    previewText: foundation.twin.valueProposition,
    body: `Here is a focused next step for ${foundation.twin.audience}: ${foundation.twin.offer}.`,
    audienceSegmentReference: foundation.twin.audience,
    offerReference: foundation.twin.offer,
    reviewState: "draft",
  };
}

function createPublishingPackage(
  creativeStudioId: CreativeStudioV1Id,
  packageIds: Record<string, CreativePackageId>
): PublishingPackage {
  return {
    publishingPackageId: `${creativeStudioId}:publishing:primary` as PublishingPackageId,
    channelTarget: "workspace handoff",
    packageType: "content",
    assetReferences: [packageIds.visual, packageIds.carousel, packageIds.reel],
    copyReferences: [packageIds.content, packageIds.blog, packageIds.email],
    schedulingIntent: "Ready for future scheduling approval.",
    approvalStatus: "draft",
    readinessState: "draft",
  };
}

function createBrandKitApplication(
  creativeStudioId: CreativeStudioV1Id,
  foundation: BusinessFoundationSnapshot
): BrandKitApplication {
  return {
    brandKitApplicationId: `${creativeStudioId}:brand-kit:primary` as BrandKitApplicationId,
    brandIdentityReference:
      foundation.brandDna?.brandDnaId ?? foundation.foundationId,
    voiceAndToneConstraints: [
      foundation.brandDna?.voice ?? "clear and practical",
      foundation.brandDna?.promise ?? foundation.twin.valueProposition,
    ],
    visualStyleReferences: foundation.brandDna?.differentiators ?? [],
    prohibitedTerms: [],
    validationNotes: ["Brand kit constraints applied from Business Foundation."],
    alignmentState: foundation.brandDna ? "aligned" : "needs_review",
  };
}

function createPackageIds(
  creativeStudioId: CreativeStudioV1Id
): Record<"content" | "visual" | "carousel" | "reel" | "blog" | "email", CreativePackageId> {
  return {
    content: `${creativeStudioId}:package:content` as CreativePackageId,
    visual: `${creativeStudioId}:package:visual` as CreativePackageId,
    carousel: `${creativeStudioId}:package:carousel` as CreativePackageId,
    reel: `${creativeStudioId}:package:reel` as CreativePackageId,
    blog: `${creativeStudioId}:package:blog` as CreativePackageId,
    email: `${creativeStudioId}:package:email` as CreativePackageId,
  };
}

function collectEvidenceSummaries(
  brain: BusinessBrainV1Snapshot,
  recommendations: readonly DecisionRecommendation[]
): readonly string[] {
  return [
    brain.understanding.summary,
    ...recommendations.flatMap((recommendation) =>
      recommendation.explanation.evidence.map((evidence) => evidence.summary)
    ),
  ];
}

function validateUpstream(
  foundation: BusinessFoundationSnapshot,
  brain: BusinessBrainV1Snapshot,
  decisionEngine: DecisionEngineV1Snapshot,
  conversation: ConversationEngineV1Snapshot
): void {
  if (foundation.businessId !== brain.businessId) {
    throw new Error("Business Foundation and Business Brain must share a business.");
  }
  if (brain.businessId !== decisionEngine.businessId) {
    throw new Error("Business Brain and Decision Engine must share a business.");
  }
  if (decisionEngine.businessId !== conversation.businessId) {
    throw new Error("Decision Engine and Conversation Engine must share a business.");
  }
  if (brain.brainId !== decisionEngine.brainId) {
    throw new Error("Decision Engine must come from the supplied Business Brain.");
  }
  if (decisionEngine.engineId !== conversation.engineId) {
    throw new Error("Conversation Engine must come from the supplied Decision Engine.");
  }
}

function validateSnapshot(snapshot: CreativeStudioV1Snapshot): void {
  createTimestamp(snapshot.createdAt, "createdAt");
  createTimestamp(snapshot.updatedAt, "updatedAt");
  createRequiredString(snapshot.sourceContext.businessName, "Business name");
  createRequiredString(snapshot.aiWriter.prompt, "AI Writer prompt");
  createRequiredString(snapshot.contentPackage.objective, "Content objective");
}

function cloneSnapshot(snapshot: CreativeStudioV1Snapshot): CreativeStudioV1Snapshot {
  return {
    ...snapshot,
    sourceContext: {
      ...snapshot.sourceContext,
      recommendationIds: [...snapshot.sourceContext.recommendationIds],
    },
    aiWriter: {
      ...snapshot.aiWriter,
      draftVariants: [...snapshot.aiWriter.draftVariants],
      evidenceSummaries: [...snapshot.aiWriter.evidenceSummaries],
    },
    contentPackage: {
      ...snapshot.contentPackage,
      captions: [...snapshot.contentPackage.captions],
      scripts: [...snapshot.contentPackage.scripts],
      outlines: [...snapshot.contentPackage.outlines],
      messageSections: [...snapshot.contentPackage.messageSections],
      reviewNotes: [...snapshot.contentPackage.reviewNotes],
    },
    visualPackage: {
      ...snapshot.visualPackage,
      styleConstraints: [...snapshot.visualPackage.styleConstraints],
      assetConcepts: [...snapshot.visualPackage.assetConcepts],
      variants: [...snapshot.visualPackage.variants],
      usageNotes: [...snapshot.visualPackage.usageNotes],
    },
    carouselPackage: {
      ...snapshot.carouselPackage,
      slides: snapshot.carouselPackage.slides.map((slide) => ({ ...slide })),
    },
    reelPackage: {
      ...snapshot.reelPackage,
      scenePlan: [...snapshot.reelPackage.scenePlan],
      captions: [...snapshot.reelPackage.captions],
      visualNotes: [...snapshot.reelPackage.visualNotes],
    },
    blogDraft: {
      ...snapshot.blogDraft,
      outline: [...snapshot.blogDraft.outline],
      sections: [...snapshot.blogDraft.sections],
    },
    emailDraft: { ...snapshot.emailDraft },
    publishingPackage: {
      ...snapshot.publishingPackage,
      assetReferences: [...snapshot.publishingPackage.assetReferences],
      copyReferences: [...snapshot.publishingPackage.copyReferences],
    },
    brandKitApplication: {
      ...snapshot.brandKitApplication,
      voiceAndToneConstraints: [
        ...snapshot.brandKitApplication.voiceAndToneConstraints,
      ],
      visualStyleReferences: [
        ...snapshot.brandKitApplication.visualStyleReferences,
      ],
      prohibitedTerms: [...snapshot.brandKitApplication.prohibitedTerms],
      validationNotes: [...snapshot.brandKitApplication.validationNotes],
    },
    integration: {
      ...snapshot.integration,
      recommendationIds: [...snapshot.integration.recommendationIds],
      creativePackageIds: [...snapshot.integration.creativePackageIds],
      publishingPackageIds: [...snapshot.integration.publishingPackageIds],
    },
  };
}

function createRequiredString(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

function createTimestamp(value: Timestamp, label: string): Timestamp {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be a valid timestamp.`);
  }
  return value;
}
