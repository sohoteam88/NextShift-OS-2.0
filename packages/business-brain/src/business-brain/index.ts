import type {
  ActivateBusinessTwinRequest,
  BusinessBrainContextRequest,
  BusinessBrainContract,
  CreateBusinessProfileRequest,
  GenerateBusinessUnderstandingRequest,
  GetBrandProfileRequest,
  GetBusinessGoalsRequest,
  GetBusinessTwinStatusRequest,
  GetBusinessUnderstandingRequest,
  GetCustomerProfileRequest,
  GetBusinessProfileRequest,
  GetOfferProfileRequest,
  UpdateBrandProfileRequest,
  UpdateBusinessGoalsRequest,
  UpdateCustomerProfileRequest,
  UpdateOfferProfileRequest,
  BusinessTwinSnapshot,
} from "@nextshift/contracts";
import { BusinessProfileEventPublisher } from "@nextshift/event-bus";
import type {
  BrandDNA,
  BusinessGoalsProfile,
  BusinessProfile,
  BusinessTwinActivation,
  BusinessUnderstanding,
  CustomerProfile,
  OfferProfile,
} from "@nextshift/domain";
import type { EventBus } from "@nextshift/event-bus";
import type { Result, Timestamp } from "@nextshift/shared";
import { failure, success } from "@nextshift/shared";
import {
  InMemoryBusinessProfileStore,
  type BusinessProfileStore,
} from "../business-profile";

export interface BusinessBrainDependencies {
  readonly businessProfileStore?: BusinessProfileStore;
  readonly eventBus?: EventBus;
  readonly businessProfileEvents?: BusinessProfileEventPublisher;
  readonly now?: () => Timestamp;
}

export class BusinessBrain implements BusinessBrainContract {
  private readonly businessProfileStore: BusinessProfileStore;
  private readonly businessProfileEvents?: BusinessProfileEventPublisher;
  private readonly now: () => Timestamp;

  constructor(dependencies: BusinessBrainDependencies = {}) {
    this.businessProfileStore =
      dependencies.businessProfileStore ?? new InMemoryBusinessProfileStore();
    this.businessProfileEvents =
      dependencies.businessProfileEvents ??
      (dependencies.eventBus
        ? new BusinessProfileEventPublisher(dependencies.eventBus)
        : undefined);
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  async createBusinessProfile(
    request: CreateBusinessProfileRequest
  ): Promise<Result<BusinessProfile>> {
    const businessName = request.identity.businessName.trim();

    if (businessName.length === 0) {
      return failure(
        new Error("BusinessProfile identity.businessName is required")
      );
    }

    const createdAt = request.createdAt ?? this.now();
    const profile: BusinessProfile = {
      businessId: request.businessId,
      tenant: request.tenant,
      identity: {
        ...request.identity,
        businessName,
      },
      metadata: {
        createdAt,
        source: request.source ?? "user",
        completenessScore: this.calculateIdentityCompleteness(request.identity),
      },
    };

    await this.businessProfileStore.save(profile);

    await this.businessProfileEvents?.publishCreated({
      businessId: profile.businessId,
      tenant: profile.tenant,
      occurredAt: createdAt,
      payload: {
        businessId: profile.businessId,
        identity: profile.identity,
        profileVersion: 1,
        createdAt,
      },
    });

    return success(profile);
  }

  async getBusinessProfile(
    request: GetBusinessProfileRequest
  ): Promise<Result<BusinessProfile | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile);
  }

  async updateBrandProfile(
    request: UpdateBrandProfileRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error("Business profile must exist before Brand DNA can be updated")
      );
    }

    const updatedProfile: BusinessProfile = {
      ...profile,
      brand: request.brand,
      metadata: {
        ...profile.metadata,
        updatedAt: request.updatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    await this.businessProfileEvents?.publishBrandUpdated({
      businessId: updatedProfile.businessId,
      tenant: updatedProfile.tenant,
      occurredAt: request.updatedAt,
      payload: {
        businessId: updatedProfile.businessId,
        brand: updatedProfile.brand ?? {},
        profileVersion: 1,
        updatedAt: request.updatedAt,
      },
    });

    return success(updatedProfile);
  }

  async getBrandProfile(
    request: GetBrandProfileRequest
  ): Promise<Result<BrandDNA | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.brand ?? null);
  }

  async updateOfferProfile(
    request: UpdateOfferProfileRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          "Business profile must exist before Offer Profile can be updated"
        )
      );
    }

    const updatedProfile: BusinessProfile = {
      ...profile,
      offer: request.offer,
      metadata: {
        ...profile.metadata,
        updatedAt: request.updatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    await this.businessProfileEvents?.publishOfferUpdated({
      businessId: updatedProfile.businessId,
      tenant: updatedProfile.tenant,
      occurredAt: request.updatedAt,
      payload: {
        businessId: updatedProfile.businessId,
        offer: updatedProfile.offer ?? {},
        profileVersion: 1,
        updatedAt: request.updatedAt,
      },
    });

    return success(updatedProfile);
  }

  async getOfferProfile(
    request: GetOfferProfileRequest
  ): Promise<Result<OfferProfile | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.offer ?? null);
  }

  async updateCustomerProfile(
    request: UpdateCustomerProfileRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          "Business profile must exist before Customer Profile can be updated"
        )
      );
    }

    const updatedProfile: BusinessProfile = {
      ...profile,
      customer: request.customer,
      metadata: {
        ...profile.metadata,
        updatedAt: request.updatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    await this.businessProfileEvents?.publishCustomerUpdated({
      businessId: updatedProfile.businessId,
      tenant: updatedProfile.tenant,
      occurredAt: request.updatedAt,
      payload: {
        businessId: updatedProfile.businessId,
        customer: updatedProfile.customer ?? {},
        profileVersion: 1,
        updatedAt: request.updatedAt,
      },
    });

    return success(updatedProfile);
  }

  async getCustomerProfile(
    request: GetCustomerProfileRequest
  ): Promise<Result<CustomerProfile | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.customer ?? null);
  }

  async updateBusinessGoals(
    request: UpdateBusinessGoalsRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          "Business profile must exist before Business Goals can be updated"
        )
      );
    }

    const updatedProfile: BusinessProfile = {
      ...profile,
      goals: request.goals,
      metadata: {
        ...profile.metadata,
        updatedAt: request.updatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    await this.businessProfileEvents?.publishBusinessGoalsUpdated({
      businessId: updatedProfile.businessId,
      tenant: updatedProfile.tenant,
      occurredAt: request.updatedAt,
      payload: {
        businessId: updatedProfile.businessId,
        goals: updatedProfile.goals ?? {},
        profileVersion: 1,
        updatedAt: request.updatedAt,
      },
    });

    return success(updatedProfile);
  }

  async getBusinessGoals(
    request: GetBusinessGoalsRequest
  ): Promise<Result<BusinessGoalsProfile | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.goals ?? null);
  }

  async generateBusinessUnderstanding(
    request: GenerateBusinessUnderstandingRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          "Business profile must exist before Business Understanding can be generated"
        )
      );
    }

    const understanding = synthesizeBusinessUnderstanding(profile);
    const updatedProfile: BusinessProfile = {
      ...profile,
      understanding,
      metadata: {
        ...profile.metadata,
        updatedAt: request.generatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    await this.businessProfileEvents?.publishBusinessUnderstandingGenerated({
      businessId: updatedProfile.businessId,
      tenant: updatedProfile.tenant,
      occurredAt: request.generatedAt,
      payload: {
        businessId: updatedProfile.businessId,
        understanding,
        profileVersion: 1,
        generatedAt: request.generatedAt,
      },
    });

    return success(updatedProfile);
  }

  async getBusinessUnderstanding(
    request: GetBusinessUnderstandingRequest
  ): Promise<Result<BusinessUnderstanding | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.understanding ?? null);
  }

  async activateBusinessTwin(
    request: ActivateBusinessTwinRequest
  ): Promise<Result<BusinessProfile>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          "Business profile must exist before Business Twin can be activated"
        )
      );
    }

    const activation = assessBusinessTwinActivation(
      profile,
      request.activatedAt
    );
    const updatedProfile: BusinessProfile = {
      ...profile,
      activation,
      metadata: {
        ...profile.metadata,
        updatedAt: request.activatedAt,
        source: request.source,
      },
    };

    await this.businessProfileStore.save(updatedProfile);

    if (activation.activated && activation.activatedAt) {
      await this.businessProfileEvents?.publishBusinessTwinActivated({
        businessId: updatedProfile.businessId,
        tenant: updatedProfile.tenant,
        occurredAt: activation.activatedAt,
        payload: {
          businessId: updatedProfile.businessId,
          activation,
          profileVersion: 1,
          activatedAt: activation.activatedAt,
        },
      });
    }

    return success(updatedProfile);
  }

  async getBusinessTwinStatus(
    request: GetBusinessTwinStatusRequest
  ): Promise<Result<BusinessTwinActivation | null>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    return success(profile?.activation ?? null);
  }

  async getBusinessContext(
    request: BusinessBrainContextRequest
  ): Promise<Result<BusinessTwinSnapshot>> {
    const profile = await this.businessProfileStore.get(
      request.businessId,
      request.tenant
    );

    if (!profile) {
      return failure(
        new Error(
          `Business profile has not been initialized for purpose: ${request.purpose}`
        )
      );
    }

    return success({
      businessId: request.businessId,
      tenant: request.tenant,
      version: 1,
      capturedAt: this.now(),
      identity: {
        businessName: profile.identity.businessName,
        legalName: profile.identity.legalName,
        industry: profile.identity.industry,
        businessStage: profile.identity.businessStage,
        country: profile.identity.country,
        timeZone: profile.identity.timeZone,
      },
      brand: profile.brand
        ? {
            brandName: profile.brand.brandName,
            brandStory: profile.brand.brandStory,
            vision: profile.brand.vision,
            mission: profile.brand.mission,
            values: profile.brand.values,
            voice: profile.brand.voice,
            positioning: profile.brand.positioning,
          }
        : undefined,
      offer: profile.offer
        ? {
            coreOffer: profile.offer.coreOffer,
            products: profile.offer.products,
            services: profile.offer.services,
            valueProposition: profile.offer.valueProposition,
          }
        : undefined,
      customer: profile.customer
        ? {
            targetCustomer: profile.customer.targetCustomer,
            personas: profile.customer.personas,
            problems: profile.customer.problems,
            desiredOutcomes: profile.customer.desiredOutcomes,
          }
        : undefined,
      goals: profile.goals
        ? {
            revenueGoal: profile.goals.revenueGoal,
            growthGoal: profile.goals.growthGoal,
            priorityGoal: profile.goals.priorityGoal,
            currentChallenges: profile.goals.currentChallenges,
            successDefinition: profile.goals.successDefinition,
          }
        : undefined,
      understanding: profile.understanding
        ? {
            executiveSummary: profile.understanding.executiveSummary,
            strengths: profile.understanding.strengths,
            weaknesses: profile.understanding.weaknesses,
            opportunities: profile.understanding.opportunities,
            missingInformation: profile.understanding.missingInformation,
            contradictions: profile.understanding.contradictions,
            confidence: profile.understanding.confidence,
          }
        : undefined,
      activation: profile.activation
        ? {
            activated: profile.activation.activated,
            activatedAt: profile.activation.activatedAt,
            readinessScore: profile.activation.readinessScore,
            readinessReason: profile.activation.readinessReason,
          }
        : undefined,
    });
  }

  private calculateIdentityCompleteness(
    identity: CreateBusinessProfileRequest["identity"]
  ): number {
    const fields = [
      identity.businessName,
      identity.industry,
      identity.businessStage,
      identity.country,
      identity.timeZone,
    ];
    const completed = fields.filter((field) => Boolean(field)).length;

    return completed / fields.length;
  }
}

function synthesizeBusinessUnderstanding(
  profile: BusinessProfile
): BusinessUnderstanding {
  const missingInformation = identifyMissingInformation(profile);
  const strengths = identifyStrengths(profile);
  const weaknesses = identifyWeaknesses(profile);
  const opportunities = identifyOpportunities(profile);
  const contradictions = identifyContradictions(profile);

  return {
    executiveSummary: buildExecutiveSummary(profile),
    strengths,
    weaknesses,
    opportunities,
    missingInformation,
    contradictions,
    confidence: calculateUnderstandingConfidence(profile),
  };
}

function assessBusinessTwinActivation(
  profile: BusinessProfile,
  activatedAt: Timestamp
): BusinessTwinActivation {
  const missingRequirements = identifyMissingActivationRequirements(profile);
  const readinessScore = clamp((6 - missingRequirements.length) / 6);

  if (readinessScore === 1) {
    return {
      activated: true,
      activatedAt,
      readinessScore,
      readinessReason: "Business Twin is ready.",
    };
  }

  return {
    activated: false,
    readinessScore,
    readinessReason: `Business Twin is not ready. Missing: ${missingRequirements.join(
      ", "
    )}.`,
  };
}

function identifyMissingActivationRequirements(
  profile: BusinessProfile
): readonly string[] {
  const missing: string[] = [];

  if (!hasText(profile.identity.businessName) || !hasText(profile.identity.industry)) {
    missing.push("identity");
  }

  if (!profile.brand) {
    missing.push("brand DNA");
  }

  if (!profile.offer) {
    missing.push("offer profile");
  }

  if (!profile.customer) {
    missing.push("customer intelligence");
  }

  if (!profile.goals) {
    missing.push("business goals");
  }

  if (!profile.understanding) {
    missing.push("business understanding");
  }

  return missing;
}

function identifyMissingInformation(
  profile: BusinessProfile
): readonly string[] {
  const missing: string[] = [];

  if (!hasText(profile.identity.businessName)) {
    missing.push("Missing business identity.");
  }

  if (!hasText(profile.identity.industry)) {
    missing.push("Missing industry.");
  }

  if (!profile.brand) {
    missing.push("Missing brand DNA.");
  }

  if (!profile.offer) {
    missing.push("Missing offer.");
  }

  if (!profile.customer) {
    missing.push("Missing customer understanding.");
  }

  if (!profile.goals) {
    missing.push("Missing business goals.");
  }

  return missing;
}

function identifyStrengths(profile: BusinessProfile): readonly string[] {
  const strengths: string[] = [];

  if (profile.brand) {
    strengths.push("Brand DNA is defined.");
  }

  if (profile.offer) {
    strengths.push("Offer Profile is defined.");
  }

  if (profile.customer) {
    strengths.push("Customer Intelligence is defined.");
  }

  if (profile.goals) {
    strengths.push("Business Goals are defined.");
  }

  return strengths;
}

function identifyWeaknesses(profile: BusinessProfile): readonly string[] {
  const weaknesses: string[] = [];

  if (!hasText(profile.customer?.targetCustomer)) {
    weaknesses.push("No clear target customer.");
  }

  if (!hasText(profile.offer?.valueProposition)) {
    weaknesses.push("No clear value proposition.");
  }

  if (!hasText(profile.goals?.priorityGoal)) {
    weaknesses.push("No priority goal.");
  }

  if (!hasText(profile.brand?.positioning)) {
    weaknesses.push("No brand positioning.");
  }

  return weaknesses;
}

function identifyOpportunities(profile: BusinessProfile): readonly string[] {
  const opportunities: string[] = [];

  if (profile.offer && profile.customer) {
    opportunities.push("Customer acquisition opportunity.");
  }

  if (profile.brand && profile.offer) {
    opportunities.push("Content positioning opportunity.");
  }

  if (profile.customer && profile.goals) {
    opportunities.push("Growth alignment opportunity.");
  }

  return opportunities;
}

function identifyContradictions(profile: BusinessProfile): readonly string[] {
  const contradictions: string[] = [];

  if (
    profile.offer &&
    !hasText(profile.offer.coreOffer) &&
    isEmpty(profile.offer.products) &&
    isEmpty(profile.offer.services)
  ) {
    contradictions.push(
      "Offer exists but products, services, and core offer are missing."
    );
  }

  if (
    profile.customer &&
    !hasText(profile.customer.targetCustomer) &&
    isEmpty(profile.customer.personas)
  ) {
    contradictions.push(
      "Customer intelligence exists but target customer and personas are missing."
    );
  }

  if (
    profile.goals &&
    !hasText(profile.goals.priorityGoal) &&
    isEmpty(profile.goals.currentChallenges)
  ) {
    contradictions.push(
      "Business goals exist but priority goal and current challenges are missing."
    );
  }

  return contradictions;
}

function calculateUnderstandingConfidence(profile: BusinessProfile): number {
  const completedSections = [
    hasText(profile.identity.businessName) && hasText(profile.identity.industry),
    Boolean(profile.brand),
    Boolean(profile.offer),
    Boolean(profile.customer),
    Boolean(profile.goals),
  ].filter(Boolean).length;

  return clamp(completedSections / 5);
}

function buildExecutiveSummary(profile: BusinessProfile): string {
  const businessName = trimmed(profile.identity.businessName);
  const industry = trimmed(profile.identity.industry);
  const coreOffer = trimmed(profile.offer?.coreOffer);
  const targetCustomer = trimmed(profile.customer?.targetCustomer);
  const priorityGoal = trimmed(profile.goals?.priorityGoal);
  const subject = businessName ?? "This business";
  const sentences: string[] = [];

  if (industry && coreOffer) {
    sentences.push(`${subject} is a ${industry} business focused on ${coreOffer}.`);
  } else if (industry) {
    sentences.push(`${subject} is a ${industry} business.`);
  } else if (coreOffer) {
    sentences.push(`${subject} is focused on ${coreOffer}.`);
  } else {
    sentences.push(`${subject} has an initialized business profile.`);
  }

  if (targetCustomer) {
    sentences.push(`It serves ${targetCustomer}.`);
  }

  if (priorityGoal) {
    sentences.push(`It is currently prioritizing ${priorityGoal}.`);
  }

  return sentences.join(" ");
}

function hasText(value: string | undefined): boolean {
  return trimmed(value) !== undefined;
}

function trimmed(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}

function isEmpty<T>(value: readonly T[] | undefined): boolean {
  return !value || value.length === 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}
