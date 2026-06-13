export type PlanId = 'free' | 'starter' | 'pro' | 'agency';
export type FeatureKey = 'mission_engine'|'brand_discovery'|'brand_dna'|'social_setup'|'content_engine'|'video_production'|'lead_magnet'|'webinar'|'funnel_builder'|'traffic_engine'|'whatsapp_ai'|'crm'|'analytics'|'admin'|'agency_management';
export type SubscriptionStatus = 'trial'|'active'|'past_due'|'paused'|'cancelled'|'manual';

export interface PlanDefinition { id: PlanId; name: string; priceLabel: string; targetUser: string; features: FeatureKey[]; limits: { aiCredits: number; videosPerMonth: number; funnels: number; leads: number; seats: number; workspaces: number }; recommendedFor: string; }
export interface FeatureGateResult { allowed: boolean; reason?: string; requiredPlan?: PlanId; upgradeLink?: string; }
export interface UsageLimitResult { allowed: boolean; used: number; limit: number; remaining: number; warning?: string; }
export interface Subscription { plan: PlanId; status: SubscriptionStatus; aiCreditsUsed: number; aiCreditsLimit: number; seatsUsed: number; seatsLimit: number; videosUsed: number; videosLimit: number; funnelsUsed: number; funnelsLimit: number; leadsUsed: number; leadsLimit: number; }
export interface UpgradeRecommendation { id: string; reason: string; currentPlan: PlanId; targetPlan: PlanId; benefit: string; urgency: 'low'|'medium'|'high'; }

export const ALL_FEATURE_KEYS: FeatureKey[] = ['mission_engine','brand_discovery','brand_dna','social_setup','content_engine','video_production','lead_magnet','webinar','funnel_builder','traffic_engine','whatsapp_ai','crm','analytics','admin','agency_management'];

// Manual Admin Override
export interface ManualOverride {
  enabled: boolean;
  planOverride?: PlanId;
  expiresAt?: string;
  customAiCredits?: number;
  customFeatures?: FeatureKey[];
  reason: string;
  grantedBy: string;
  grantedAt: string;
  updatedAt: string;
}
