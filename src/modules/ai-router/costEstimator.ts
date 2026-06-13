// Cost Estimator — credit estimation before AI calls
import type { AITaskType, CostEstimate } from './types';
import { getTaskDefinition } from './modelPolicyEngine';

export function estimateCredits(taskType: AITaskType, estimatedTokens?: number): CostEstimate {
  const task = getTaskDefinition(taskType);
  const baseCredits = task.estimatedCredits;

  // Adjust for token count if provided
  let credits = baseCredits;
  if (estimatedTokens) {
    credits = Math.max(1, Math.ceil(estimatedTokens / 500));
  }

  const costLevel = credits <= 2 ? 'low' : credits <= 8 ? 'medium' : 'high';
  const warning = costLevel === 'high' ? '此操作消耗较多AI额度' : undefined;

  return { estimatedCredits: credits, estimatedCostLevel: costLevel, warning };
}

export function estimateCost_USD(taskType: AITaskType): number {
  const rates: Record<string, number> = {
    brand_discovery: 0.015, brand_dna_generation: 0.025, social_setup_generation: 0.008,
    content_generation: 0.006, video_script_generation: 0.030, lead_magnet_generation: 0.015,
    webinar_generation: 0.030, funnel_generation: 0.045, traffic_strategy: 0.020,
    whatsapp_reply: 0.002, crm_insight: 0.008, analytics_insight: 0.020,
    translation: 0.003, summarization: 0.003, classification: 0.002, extraction: 0.004,
  };
  return rates[taskType] ?? 0.005;
}
