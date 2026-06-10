export type TaskCategory =
  | 'brand_extraction'
  | 'interview_dialogue'
  | 'interview_analysis'
  | 'content_generation'
  | 'video_script'
  | 'whatsapp_reply'
  | 'lead_analysis'
  | 'content_calendar'
  | 'content_insights'
  | 'username_generation'
  | 'bio_generation'
  | 'funnel_copy'
  | 'translation'
  | 'formatting';

export interface TaskClassification {
  category: TaskCategory;
  tier: 'S' | 'A' | 'B' | 'C';
  reason: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
}

const TASK_ROUTING: Record<TaskCategory, { tier: 'S' | 'A' | 'B' | 'C'; reason: string; avgOutputTokens: number }> = {
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
