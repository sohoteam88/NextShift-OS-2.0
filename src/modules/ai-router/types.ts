// ============================================================
// AI Model Router — Types (extends existing ai/ infrastructure)
// ============================================================

export type AITaskType =
  | 'brand_discovery' | 'brand_dna_generation' | 'social_setup_generation'
  | 'content_generation' | 'video_script_generation' | 'lead_magnet_generation'
  | 'webinar_generation' | 'funnel_generation' | 'traffic_strategy'
  | 'whatsapp_reply' | 'crm_insight' | 'analytics_insight'
  | 'translation' | 'summarization' | 'classification' | 'extraction';

export type PlanTier = 'free' | 'starter' | 'pro' | 'agency';

export interface TaskDefinition {
  taskType: AITaskType;
  complexity: 'low' | 'medium' | 'high';
  qualityRequirement: 'low' | 'medium' | 'high';
  speedRequirement: 'low' | 'medium' | 'high';
  costSensitivity: 'low' | 'medium' | 'high';
  estimatedCredits: number;
  preferredProviders: string[];
  fallbackProviders: string[];
}

export interface PolicyDecision {
  allowedModels: string[];
  preferredProvider: string;
  maxCredits: number;
  maxRetries: number;
  allowPremium: boolean;
}

export interface CostEstimate {
  estimatedCredits: number;
  estimatedCostLevel: 'low' | 'medium' | 'high';
  warning?: string;
}

export interface NormalizedResponse {
  success: boolean;
  data: unknown;
  text: string;
  json: Record<string, unknown> | null;
  provider: string;
  model: string;
  creditsUsed: number;
  warnings: string[];
  error: string | null;
  metadata: {
    tokensIn: number;
    tokensOut: number;
    latencyMs: number;
    taskType: AITaskType;
    fallbackUsed: boolean;
  };
}

export interface RouterRequest {
  tenantId: string;
  userId: string;
  taskType: AITaskType;
  systemPrompt: string;
  userPrompt: string;
  outputFormat?: 'text' | 'json';
  complexity?: 'low' | 'medium' | 'high';
  preferredModel?: string;
  maxCredits?: number;
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  models: string[];
  supportsJson: boolean;
  supportsStreaming: boolean;
  costTier: 'low' | 'medium' | 'high';
}
