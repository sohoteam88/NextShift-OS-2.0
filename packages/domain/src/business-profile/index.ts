import type { BusinessId, TenantContext, Timestamp } from "@nextshift/shared";

export type BusinessStage =
  | "idea"
  | "startup"
  | "early_growth"
  | "growth"
  | "scale"
  | "mature";

export interface BusinessIdentity {
  readonly businessName: string;
  readonly legalName?: string;
  readonly industry?: string;
  readonly businessStage?: BusinessStage;
  readonly country?: string;
  readonly timeZone?: string;
}

export type BrandVoice =
  | "professional"
  | "friendly"
  | "premium"
  | "bold"
  | "educational"
  | "inspirational"
  | "casual";

export interface BrandDNA {
  readonly brandName?: string;
  readonly brandStory?: string;
  readonly vision?: string;
  readonly mission?: string;
  readonly values?: readonly string[];
  readonly voice?: BrandVoice;
  readonly positioning?: string;
}

export interface ProductProfile {
  readonly productId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface ServiceProfile {
  readonly serviceId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface OfferProfile {
  readonly coreOffer?: string;
  readonly products?: readonly ProductProfile[];
  readonly services?: readonly ServiceProfile[];
  readonly valueProposition?: string;
}

export interface CustomerPersonaProfile {
  readonly personaId?: string;
  readonly name: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly goals?: readonly string[];
}

export interface CustomerProfile {
  readonly targetCustomer?: string;
  readonly personas?: readonly CustomerPersonaProfile[];
  readonly problems?: readonly string[];
  readonly desiredOutcomes?: readonly string[];
}

export interface BusinessGoalsProfile {
  readonly revenueGoal?: string;
  readonly growthGoal?: string;
  readonly priorityGoal?: string;
  readonly currentChallenges?: readonly string[];
  readonly successDefinition?: string;
}

export interface BusinessUnderstanding {
  readonly executiveSummary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly opportunities: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
}

export interface BusinessTwinActivation {
  readonly activated: boolean;
  readonly activatedAt?: Timestamp;
  readonly readinessScore: number;
  readonly readinessReason?: string;
}

export interface BusinessProfileMetadata {
  readonly createdAt: Timestamp;
  readonly updatedAt?: Timestamp;
  readonly source: "user" | "agent" | "import" | "system";
  readonly completenessScore?: number;
}

export interface BusinessProfile {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly identity: BusinessIdentity;
  readonly brand?: BrandDNA;
  readonly offer?: OfferProfile;
  readonly customer?: CustomerProfile;
  readonly goals?: BusinessGoalsProfile;
  readonly understanding?: BusinessUnderstanding;
  readonly activation?: BusinessTwinActivation;
  readonly metadata: BusinessProfileMetadata;
}
