import type { BusinessId, Timestamp } from "@nextshift/shared";

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

export interface CreativeSourceContextPayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly businessName: string;
  readonly audience: string;
  readonly offer: string;
  readonly brandVoice: string;
  readonly recommendationIds: readonly string[];
  readonly conversationHandoffIntent?: string;
}

export interface AIWriterOutputPayload {
  readonly objective: string;
  readonly prompt: string;
  readonly targetAudience: string;
  readonly voice: string;
  readonly draftVariants: readonly string[];
  readonly evidenceSummaries: readonly string[];
}

export interface CreativePackagePayload {
  readonly packageId: string;
  readonly reviewState: CreativeReviewState;
}

export interface ContentGenerationPackagePayload extends CreativePackagePayload {
  readonly channel: string;
  readonly objective: string;
  readonly captions: readonly string[];
  readonly scripts: readonly string[];
  readonly outlines: readonly string[];
  readonly messageSections: readonly string[];
  readonly reviewNotes: readonly string[];
  readonly revisionState: CreativeReviewState;
}

export interface VisualGenerationPackagePayload extends CreativePackagePayload {
  readonly objective: string;
  readonly creativeDirection: string;
  readonly styleConstraints: readonly string[];
  readonly assetConcepts: readonly string[];
  readonly variants: readonly string[];
  readonly usageNotes: readonly string[];
}

export interface CarouselSlidePayload {
  readonly slideNumber: number;
  readonly copy: string;
  readonly visualDirection: string;
}

export interface CarouselPackagePayload {
  readonly packageId: string;
  readonly title: string;
  readonly slides: readonly CarouselSlidePayload[];
  readonly callToAction: string;
  readonly channelMetadata: string;
  readonly approvalState: CreativeReviewState;
}

export interface ReelPackagePayload {
  readonly packageId: string;
  readonly hook: string;
  readonly script: string;
  readonly scenePlan: readonly string[];
  readonly captions: readonly string[];
  readonly visualNotes: readonly string[];
  readonly durationTarget: string;
  readonly callToAction: string;
  readonly approvalState: CreativeReviewState;
}

export interface BlogDraftPackagePayload {
  readonly packageId: string;
  readonly title: string;
  readonly outline: readonly string[];
  readonly sections: readonly string[];
  readonly audienceSegmentReference: string;
  readonly messageReference: string;
  readonly reviewState: CreativeReviewState;
}

export interface EmailDraftPackagePayload {
  readonly packageId: string;
  readonly subject: string;
  readonly previewText: string;
  readonly body: string;
  readonly audienceSegmentReference: string;
  readonly offerReference: string;
  readonly reviewState: CreativeReviewState;
}

export interface PublishingPackagePayload {
  readonly publishingPackageId: string;
  readonly channelTarget: string;
  readonly packageType: "content" | "visual" | "carousel" | "reel" | "blog" | "email";
  readonly assetReferences: readonly string[];
  readonly copyReferences: readonly string[];
  readonly schedulingIntent: string;
  readonly approvalStatus: CreativeReviewState;
  readonly readinessState: PublishingReadinessState;
}

export interface BrandKitApplicationPayload {
  readonly brandKitApplicationId: string;
  readonly brandIdentityReference: string;
  readonly voiceAndToneConstraints: readonly string[];
  readonly visualStyleReferences: readonly string[];
  readonly prohibitedTerms: readonly string[];
  readonly validationNotes: readonly string[];
  readonly alignmentState: BrandAlignmentState;
}

export interface CreativeIntegrationReferencePayload {
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly recommendationIds: readonly string[];
  readonly creativePackageIds: readonly string[];
  readonly publishingPackageIds: readonly string[];
  readonly downstreamHandoffIntent?: string;
}

export interface CreativeStudioV1SummaryPayload {
  readonly creativeStudioId: string;
  readonly businessId: BusinessId;
  readonly foundationId: string;
  readonly brainId: string;
  readonly engineId: string;
  readonly conversationId: string;
  readonly sourceContext: CreativeSourceContextPayload;
  readonly aiWriter: AIWriterOutputPayload;
  readonly contentPackage: ContentGenerationPackagePayload;
  readonly visualPackage: VisualGenerationPackagePayload;
  readonly carouselPackage: CarouselPackagePayload;
  readonly reelPackage: ReelPackagePayload;
  readonly blogDraft: BlogDraftPackagePayload;
  readonly emailDraft: EmailDraftPackagePayload;
  readonly publishingPackage: PublishingPackagePayload;
  readonly brandKitApplication: BrandKitApplicationPayload;
  readonly integration: CreativeIntegrationReferencePayload;
  readonly lifecycleStatus: CreativeLifecycleStatus;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type CreativeStudioV1EventType =
  | "CreativeStudioV1Created"
  | "CreativeStudioReviewRequested"
  | "CreativeStudioApprovalRecorded"
  | "CreativeStudioPackagedForHandoff"
  | "CreativeStudioLifecycleChanged";

export interface CreativeStudioV1CreatedPayload {
  readonly creativeStudioId: string;
  readonly businessId: BusinessId;
  readonly conversationId: string;
  readonly packageCount: number;
  readonly createdAt: Timestamp;
}

export interface CreativeStudioV1ChangedPayload {
  readonly creativeStudioId: string;
  readonly status: CreativeLifecycleStatus;
  readonly changedAt: Timestamp;
}
