import type {
  BusinessId,
  SourceMetadata,
  TenantContext,
  Timestamp,
} from "@nextshift/shared";

export interface BusinessTwinSnapshot {
  readonly businessId: BusinessId;
  readonly tenant: TenantContext;
  readonly version: number;
  readonly capturedAt: Timestamp;
  readonly identity?: BusinessIdentityContext;
  readonly brand?: BrandDNAContext;
  readonly offer?: OfferContext;
  readonly customer?: CustomerContext;
  readonly goals?: BusinessGoalsContext;
  readonly understanding?: BusinessUnderstandingContext;
  readonly activation?: BusinessTwinActivationContext;
  readonly strategy?: BusinessStrategyContext;
  readonly knowledge?: BusinessKnowledgeContext;
  readonly memory?: BusinessMemoryContext;
}

export interface BusinessIdentityContext {
  readonly businessName?: string;
  readonly legalName?: string;
  readonly industry?: string;
  readonly businessStage?: string;
  readonly country?: string;
  readonly timeZone?: string;
  readonly vision?: string;
  readonly mission?: string;
  readonly values?: readonly string[];
  readonly positioning?: string;
}

export interface BrandDNAContext {
  readonly brandName?: string;
  readonly brandStory?: string;
  readonly vision?: string;
  readonly mission?: string;
  readonly values?: readonly string[];
  readonly voice?: string;
  readonly positioning?: string;
}

export interface ProductContext {
  readonly productId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface ServiceContext {
  readonly serviceId?: string;
  readonly name: string;
  readonly description?: string;
  readonly category?: string;
}

export interface OfferContext {
  readonly coreOffer?: string;
  readonly products?: readonly ProductContext[];
  readonly services?: readonly ServiceContext[];
  readonly valueProposition?: string;
}

export interface CustomerPersonaContext {
  readonly personaId?: string;
  readonly name: string;
  readonly description?: string;
  readonly painPoints?: readonly string[];
  readonly goals?: readonly string[];
}

export interface CustomerContext {
  readonly targetCustomer?: string;
  readonly personas?: readonly CustomerPersonaContext[];
  readonly problems?: readonly string[];
  readonly desiredOutcomes?: readonly string[];
}

export interface BusinessGoalsContext {
  readonly revenueGoal?: string;
  readonly growthGoal?: string;
  readonly priorityGoal?: string;
  readonly currentChallenges?: readonly string[];
  readonly successDefinition?: string;
}

export interface BusinessUnderstandingContext {
  readonly executiveSummary: string;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly opportunities: readonly string[];
  readonly missingInformation: readonly string[];
  readonly contradictions: readonly string[];
  readonly confidence: number;
}

export interface BusinessTwinActivationContext {
  readonly activated: boolean;
  readonly activatedAt?: Timestamp;
  readonly readinessScore: number;
  readonly readinessReason?: string;
}

export interface BusinessStrategyContext {
  readonly goals?: readonly string[];
  readonly priorities?: readonly string[];
  readonly constraints?: readonly string[];
}

export interface BusinessKnowledgeContext {
  readonly summary?: string;
  readonly evidence?: readonly SourceMetadata[];
}

export interface BusinessMemoryContext {
  readonly summary?: string;
  readonly lastUpdatedAt?: Timestamp;
}
