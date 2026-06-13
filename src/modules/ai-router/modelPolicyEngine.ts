// ============================================================
// Model Policy Engine — Plan-based routing rules
// ============================================================

import type { AITaskType, PlanTier, PolicyDecision, TaskDefinition } from './types';

const TASK_DEFINITIONS: Record<AITaskType, TaskDefinition> = {
  brand_discovery: { taskType: 'brand_discovery', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'medium', costSensitivity: 'medium', estimatedCredits: 5, preferredProviders: ['anthropic', 'openai'], fallbackProviders: ['deepseek', 'gemini'] },
  brand_dna_generation: { taskType: 'brand_dna_generation', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'low', costSensitivity: 'low', estimatedCredits: 5, preferredProviders: ['anthropic'], fallbackProviders: ['openai', 'deepseek'] },
  social_setup_generation: { taskType: 'social_setup_generation', complexity: 'medium', qualityRequirement: 'medium', speedRequirement: 'medium', costSensitivity: 'medium', estimatedCredits: 3, preferredProviders: ['openai', 'deepseek'], fallbackProviders: ['gemini'] },
  content_generation: { taskType: 'content_generation', complexity: 'medium', qualityRequirement: 'medium', speedRequirement: 'high', costSensitivity: 'high', estimatedCredits: 3, preferredProviders: ['deepseek', 'openai'], fallbackProviders: ['gemini'] },
  video_script_generation: { taskType: 'video_script_generation', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'medium', costSensitivity: 'medium', estimatedCredits: 10, preferredProviders: ['anthropic', 'openai'], fallbackProviders: ['deepseek'] },
  lead_magnet_generation: { taskType: 'lead_magnet_generation', complexity: 'medium', qualityRequirement: 'high', speedRequirement: 'medium', costSensitivity: 'medium', estimatedCredits: 5, preferredProviders: ['anthropic', 'openai'], fallbackProviders: ['deepseek'] },
  webinar_generation: { taskType: 'webinar_generation', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'low', costSensitivity: 'low', estimatedCredits: 10, preferredProviders: ['anthropic'], fallbackProviders: ['openai', 'deepseek'] },
  funnel_generation: { taskType: 'funnel_generation', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'medium', costSensitivity: 'medium', estimatedCredits: 15, preferredProviders: ['anthropic', 'openai'], fallbackProviders: ['deepseek'] },
  traffic_strategy: { taskType: 'traffic_strategy', complexity: 'medium', qualityRequirement: 'medium', speedRequirement: 'medium', costSensitivity: 'high', estimatedCredits: 8, preferredProviders: ['openai', 'deepseek'], fallbackProviders: ['gemini'] },
  whatsapp_reply: { taskType: 'whatsapp_reply', complexity: 'low', qualityRequirement: 'medium', speedRequirement: 'high', costSensitivity: 'high', estimatedCredits: 1, preferredProviders: ['deepseek', 'openai'], fallbackProviders: ['gemini'] },
  crm_insight: { taskType: 'crm_insight', complexity: 'medium', qualityRequirement: 'medium', speedRequirement: 'medium', costSensitivity: 'high', estimatedCredits: 3, preferredProviders: ['openai', 'deepseek'], fallbackProviders: ['gemini'] },
  analytics_insight: { taskType: 'analytics_insight', complexity: 'high', qualityRequirement: 'high', speedRequirement: 'low', costSensitivity: 'medium', estimatedCredits: 8, preferredProviders: ['anthropic', 'gemini'], fallbackProviders: ['openai'] },
  translation: { taskType: 'translation', complexity: 'low', qualityRequirement: 'low', speedRequirement: 'high', costSensitivity: 'high', estimatedCredits: 1, preferredProviders: ['deepseek', 'gemini'], fallbackProviders: ['openai'] },
  summarization: { taskType: 'summarization', complexity: 'low', qualityRequirement: 'medium', speedRequirement: 'high', costSensitivity: 'high', estimatedCredits: 1, preferredProviders: ['deepseek', 'openai'], fallbackProviders: ['gemini'] },
  classification: { taskType: 'classification', complexity: 'low', qualityRequirement: 'medium', speedRequirement: 'high', costSensitivity: 'high', estimatedCredits: 1, preferredProviders: ['deepseek', 'openai'], fallbackProviders: ['gemini'] },
  extraction: { taskType: 'extraction', complexity: 'low', qualityRequirement: 'high', speedRequirement: 'high', costSensitivity: 'medium', estimatedCredits: 1, preferredProviders: ['openai', 'anthropic'], fallbackProviders: ['deepseek'] },
};

const PLAN_POLICIES: Record<PlanTier, { maxCreditsPerCall: number; allowPremium: boolean; maxRetries: number; preferCheapModels: boolean }> = {
  free: { maxCreditsPerCall: 3, allowPremium: false, maxRetries: 1, preferCheapModels: true },
  starter: { maxCreditsPerCall: 10, allowPremium: false, maxRetries: 2, preferCheapModels: false },
  pro: { maxCreditsPerCall: 50, allowPremium: true, maxRetries: 3, preferCheapModels: false },
  agency: { maxCreditsPerCall: 100, allowPremium: true, maxRetries: 5, preferCheapModels: false },
};

export function getTaskDefinition(taskType: AITaskType): TaskDefinition {
  return TASK_DEFINITIONS[taskType] ?? TASK_DEFINITIONS.content_generation;
}

export function decidePolicy(plan: PlanTier, taskType: AITaskType): PolicyDecision {
  const task = getTaskDefinition(taskType);
  const planPolicy = PLAN_POLICIES[plan] ?? PLAN_POLICIES.free;

  let allowedProviders = planPolicy.preferCheapModels
    ? task.fallbackProviders.filter(p => ['deepseek', 'gemini'].includes(p))
    : task.preferredProviders;

  if (!planPolicy.allowPremium) {
    allowedProviders = allowedProviders.filter(p => !['anthropic'].includes(p));
  }

  return {
    allowedModels: allowedProviders,
    preferredProvider: allowedProviders[0] ?? 'deepseek',
    maxCredits: Math.min(task.estimatedCredits, planPolicy.maxCreditsPerCall),
    maxRetries: planPolicy.maxRetries,
    allowPremium: planPolicy.allowPremium,
  };
}
