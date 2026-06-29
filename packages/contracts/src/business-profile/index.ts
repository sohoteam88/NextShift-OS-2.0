import type { BusinessId, TenantContext, Timestamp } from "@nextshift/shared";

export type BusinessStage =
  | "idea"
  | "startup"
  | "early_growth"
  | "growth"
  | "scale"
  | "mature";

export interface BusinessIdentityPayload {
  readonly businessName: string;
  readonly legalName?: string;
  readonly industry?: string;
  readonly businessStage?: BusinessStage;
  readonly country?: string;
  readonly timeZone?: string;
}

export type BrandVoicePayload =
  | "professional"
  | "friendly"
  | "premium"
  | "bold"
  | "educational"
  | "inspirational"
  | "casual";

export interface BrandDNAPayload {
  readonly brandName?: string;
  readonly brandStory?: string;
  readonly vision?: string;
  readonly mission?: string;
  readonly values?: readonly string[];
  readonly voice?: BrandVoicePayload;
  readonly positioning?: string;
}

export interface ProductProfilePayload {
  readonly productId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface ServiceProfilePayload {
  readonly serviceId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface OfferProfilePayload {
  readonly coreOffer?: string;
  readonly products?: readonly ProductProfilePayload[];
  readonly services?: readonly ServiceProfilePayload[];
  readonly valueProposition?: string;
}

export interface CustomerPersonaPayload {
  readonly personaId?: string;
  readonly name: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly goals?: readonly string[];
}

export interface CustomerProfilePayload {
  readonly targetCustomer?: string;
  readonly personas?: readonly CustomerPersonaPayload[];
  readonly problems?: readonly string[];
  readonly desiredOutcomes?: readonly string[];
}

export interface BusinessGoalsProfilePayload {
  readonly revenueGoal?: string;
  readonly growthGoal?: string;
  readonly priorityGoal?: string;
  readonly currentChallenges?: readonly string[];
  readonly successDefinition?: string;
}

export interface BusinessUnderstandingPayload {
  readonly executiveSummary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly opportunities: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
}

export interface BusinessTwinActivationPayload {
  readonly activated: boolean;
  readonly activatedAt?: Timestamp;
  readonly readinessScore: number;
  readonly readinessReason?: string;
}

export interface BusinessProfileMetadataPayload {
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
  readonly completenessScore?: number;
}

export interface BusinessProfileRecord {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly identity: BusinessIdentityPayload;
  readonly brand?: BrandDNAPayload;
  readonly offer?: OfferProfilePayload;
  readonly customer?: CustomerProfilePayload;
  readonly goals?: BusinessGoalsProfilePayload;
  readonly understanding?: BusinessUnderstandingPayload;
  readonly activation?: BusinessTwinActivationPayload;
  readonly metadata: BusinessProfileMetadataPayload;
}

export interface CreateBusinessProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly identity: BusinessIdentityPayload;
  readonly source?: BusinessProfileMetadataPayload["source"];
  readonly createdAt?: Timestamp;
}

export interface GetBusinessProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface UpdateBrandProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly brand: BrandDNAPayload;
  readonly updatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetBrandProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface UpdateOfferProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly offer: OfferProfilePayload;
  readonly updatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetOfferProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface UpdateCustomerProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly customer: CustomerProfilePayload;
  readonly updatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetCustomerProfileRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface UpdateBusinessGoalsRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly goals: BusinessGoalsProfilePayload;
  readonly updatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetBusinessGoalsRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface GenerateBusinessUnderstandingRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly generatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetBusinessUnderstandingRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface ActivateBusinessTwinRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly activatedAt: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
}

export interface GetBusinessTwinStatusRequest {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
}

export interface BusinessProfileCreatedPayload {
  readonly businessId: BusinessId;
  readonly identity: BusinessIdentityPayload;
  readonly profileVersion: number;
  readonly createdAt: Timestamp;
}

export interface BrandProfileUpdatedPayload {
  readonly businessId: BusinessId;
  readonly brand: BrandDNAPayload;
  readonly profileVersion: number;
  readonly updatedAt: Timestamp;
}

export interface CustomerProfileUpdatedPayload {
  readonly businessId: BusinessId;
  readonly customer: CustomerProfilePayload;
  readonly profileVersion: number;
  readonly updatedAt: Timestamp;
}

export interface OfferProfileUpdatedPayload {
  readonly businessId: BusinessId;
  readonly offer: OfferProfilePayload;
  readonly profileVersion: number;
  readonly updatedAt: Timestamp;
}

export interface BusinessGoalsUpdatedPayload {
  readonly businessId: BusinessId;
  readonly goals: BusinessGoalsProfilePayload;
  readonly profileVersion: number;
  readonly updatedAt: Timestamp;
}

export interface BusinessUnderstandingGeneratedPayload {
  readonly businessId: BusinessId;
  readonly understanding: BusinessUnderstandingPayload;
  readonly profileVersion: number;
  readonly generatedAt: Timestamp;
}

export interface BusinessTwinActivatedPayload {
  readonly businessId: BusinessId;
  readonly activation: BusinessTwinActivationPayload;
  readonly profileVersion: number;
  readonly activatedAt: Timestamp;
}
