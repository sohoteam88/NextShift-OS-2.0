// ─── Unified Task Taxonomy (V5-2: merged 14 TaskCategory + 16 AITaskType) ──────

export type TaskCategory =
  // Original ai/ categories (14)
  | 'brand_extraction' | 'interview_dialogue' | 'interview_analysis'
  | 'content_generation' | 'video_script' | 'whatsapp_reply'
  | 'lead_analysis' | 'content_calendar' | 'content_insights'
  | 'username_generation' | 'bio_generation' | 'funnel_copy'
  | 'translation' | 'formatting'
  // Merged ai-router AITaskType values (16)
  | 'brand_discovery' | 'brand_dna_generation' | 'social_setup_generation'
  | 'video_script_generation' | 'lead_magnet_generation' | 'webinar_generation'
  | 'funnel_generation' | 'traffic_strategy' | 'crm_insight'
  | 'analytics_insight' | 'summarization' | 'classification'
  | 'extraction';

// Backward-compat alias for ai-router consumers
export type AITaskType = TaskCategory;

export interface TaskClassification {
  category: TaskCategory;
  tier: 'S' | 'A' | 'B' | 'C';
  reason: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

const TASK_ROUTING: Record<TaskCategory, { tier: 'S' | 'A' | 'B' | 'C'; reason: string; avgOutputTokens: number }> = {
  // ── Original ai/ categories ──
  brand_extraction: { tier: 'A', reason: 'Structured extraction from unstructured voice/text, needs deep understanding', avgOutputTokens: 800 },
  interview_dialogue: { tier: 'B', reason: 'Conversational brand discovery with structured slot extraction', avgOutputTokens: 450 },
  interview_analysis: { tier: 'A', reason: 'Final brand positioning synthesis from full discovery dialogue', avgOutputTokens: 1200 },
  content_generation: { tier: 'B', reason: 'Template-guided creative writing, standard complexity', avgOutputTokens: 500 },
  video_script: { tier: 'B', reason: 'Structured output with clear JSON format', avgOutputTokens: 800 },
  whatsapp_reply: { tier: 'B', reason: 'Short contextual replies, low complexity', avgOutputTokens: 300 },
  lead_analysis: { tier: 'A', reason: 'Multi-signal analysis with strategic recommendations', avgOutputTokens: 600 },
  content_calendar: { tier: 'A', reason: 'Complex 30-day planning with distribution logic', avgOutputTokens: 2500 },
  content_insights: { tier: 'A', reason: 'Data analysis with strategic optimization advice', avgOutputTokens: 800 },
  username_generation: { tier: 'B', reason: 'Creative but simple, short output', avgOutputTokens: 300 },
  bio_generation: { tier: 'B', reason: 'Short copy with character constraints', avgOutputTokens: 300 },
  funnel_copy: { tier: 'A', reason: 'Multi-section persuasive copy requiring coherence', avgOutputTokens: 1500 },
  translation: { tier: 'C', reason: 'Direct translation, minimal reasoning', avgOutputTokens: 500 },
  formatting: { tier: 'C', reason: 'Mechanical text manipulation', avgOutputTokens: 200 },
  // ── Merged ai-router AITaskType values ──
  brand_discovery: { tier: 'A', reason: 'Deep brand positioning analysis from user interview', avgOutputTokens: 800 },
  brand_dna_generation: { tier: 'A', reason: 'Brand DNA synthesis with multi-dimensional output', avgOutputTokens: 1200 },
  social_setup_generation: { tier: 'B', reason: 'Social media account setup recommendations', avgOutputTokens: 600 },
  video_script_generation: { tier: 'A', reason: 'Full video script with scene breakdown', avgOutputTokens: 1200 },
  lead_magnet_generation: { tier: 'A', reason: 'Lead magnet content with landing page copy', avgOutputTokens: 800 },
  webinar_generation: { tier: 'A', reason: 'Full webinar script and slide outline', avgOutputTokens: 2500 },
  funnel_generation: { tier: 'S', reason: 'Complete multi-section funnel requiring deep coherence', avgOutputTokens: 4000 },
  traffic_strategy: { tier: 'A', reason: 'Multi-platform traffic strategy with budget allocation', avgOutputTokens: 1000 },
  crm_insight: { tier: 'B', reason: 'Customer segmentation and pipeline analysis', avgOutputTokens: 600 },
  analytics_insight: { tier: 'A', reason: 'KPI analysis with strategic optimization advice', avgOutputTokens: 800 },
  summarization: { tier: 'B', reason: 'Text summarization, moderate reasoning', avgOutputTokens: 400 },
  classification: { tier: 'C', reason: 'Mechanical categorization, minimal reasoning', avgOutputTokens: 200 },
  extraction: { tier: 'B', reason: 'Structured field extraction from text', avgOutputTokens: 400 },
};

export function classifyTask(category: TaskCategory, inputLength?: number): TaskClassification {
  const routing = TASK_ROUTING[category];
  let tier = routing.tier;
  const estimatedInputTokens = inputLength ? Math.ceil(inputLength / 3) : 500;

  if (estimatedInputTokens > 10000 && (tier === 'B' || tier === 'C')) {
    tier = 'A';
  }
  if (estimatedInputTokens > 50000) {
    tier = 'S';
  }

  return {
    category,
    tier,
    reason: routing.reason + (tier !== routing.tier ? ` (escalated: large input ${estimatedInputTokens} tokens)` : ''),
    estimatedInputTokens,
    estimatedOutputTokens: routing.avgOutputTokens,
  };
}
