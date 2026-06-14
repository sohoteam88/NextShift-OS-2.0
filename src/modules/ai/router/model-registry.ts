import type { AIProviderName } from '../providers/types';

export interface ModelConfig {
  id: string;
  provider: AIProviderName;
  tier: 'S' | 'A' | 'B' | 'C';
  displayName: string;
  costPer1MInput: number;
  costPer1MOutput: number;
  maxTokens: number;
  speedRating: number;
  qualityRating: number;
  contextWindow: number;
  supportsStreaming: boolean;
  available: boolean;
  zhQuality: number;
}

export const MODEL_REGISTRY: ModelConfig[] = [
  {
    id: 'claude-opus-4-20250514',
    provider: 'anthropic',
    tier: 'S',
    displayName: 'Claude Opus 4',
    costPer1MInput: 15,
    costPer1MOutput: 75,
    maxTokens: 4096,
    speedRating: 4,
    qualityRating: 10,
    contextWindow: 200000,
    supportsStreaming: true,
    available: true,
    zhQuality: 9,
  },
  {
    id: 'claude-sonnet-4-20250514',
    provider: 'anthropic',
    tier: 'A',
    displayName: 'Claude Sonnet 4',
    costPer1MInput: 3,
    costPer1MOutput: 15,
    maxTokens: 4096,
    speedRating: 7,
    qualityRating: 9,
    contextWindow: 200000,
    supportsStreaming: true,
    available: true,
    zhQuality: 9,
  },
  {
    id: 'gpt-4o',
    provider: 'openai',
    tier: 'A',
    displayName: 'GPT-4o',
    costPer1MInput: 2.5,
    costPer1MOutput: 10,
    maxTokens: 4096,
    speedRating: 7,
    qualityRating: 8,
    contextWindow: 128000,
    supportsStreaming: true,
    available: true,
    zhQuality: 8,
  },
  {
    id: 'gemini-2.5-pro',
    provider: 'gemini',
    tier: 'A',
    displayName: 'Gemini 2.5 Pro',
    costPer1MInput: 1.25,
    costPer1MOutput: 10,
    maxTokens: 8192,
    speedRating: 7,
    qualityRating: 8,
    contextWindow: 1000000,
    supportsStreaming: true,
    available: true,
    zhQuality: 7,
  },
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    tier: 'A',
    displayName: 'DeepSeek V3',
    costPer1MInput: 0.27,
    costPer1MOutput: 1.1,
    maxTokens: 4096,
    speedRating: 8,
    qualityRating: 8,
    contextWindow: 64000,
    supportsStreaming: true,
    available: true,
    zhQuality: 10,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    provider: 'anthropic',
    tier: 'B',
    displayName: 'Claude Haiku 4.5',
    costPer1MInput: 0.8,
    costPer1MOutput: 4,
    maxTokens: 4096,
    speedRating: 10,
    qualityRating: 6,
    contextWindow: 200000,
    supportsStreaming: true,
    available: true,
    zhQuality: 7,
  },
  {
    id: 'gpt-4o-mini',
    provider: 'openai',
    tier: 'B',
    displayName: 'GPT-4o Mini',
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
    maxTokens: 4096,
    speedRating: 10,
    qualityRating: 5,
    contextWindow: 128000,
    supportsStreaming: true,
    available: true,
    zhQuality: 6,
  },
  {
    id: 'gemini-2.5-flash',
    provider: 'gemini',
    tier: 'B',
    displayName: 'Gemini 2.5 Flash',
    costPer1MInput: 0.15,
    costPer1MOutput: 0.6,
    maxTokens: 8192,
    speedRating: 10,
    qualityRating: 6,
    contextWindow: 1000000,
    supportsStreaming: true,
    available: true,
    zhQuality: 6,
  },
  {
    id: 'minimax-abab-6.5s',
    provider: 'minimax',
    tier: 'C',
    displayName: 'MiniMax ABAB 6.5s',
    costPer1MInput: 0.17,
    costPer1MOutput: 0.17,
    maxTokens: 4096,
    speedRating: 9,
    qualityRating: 4,
    contextWindow: 32000,
    supportsStreaming: true,
    available: true,
    zhQuality: 8,
  },
  {
    id: 'deepseek-chat-cheap',
    provider: 'deepseek',
    tier: 'C',
    displayName: 'DeepSeek V3 (cached)',
    costPer1MInput: 0.07,
    costPer1MOutput: 1.1,
    maxTokens: 4096,
    speedRating: 9,
    qualityRating: 7,
    contextWindow: 64000,
    supportsStreaming: true,
    available: true,
    zhQuality: 10,
  },
];

function isProviderConfigured(provider: AIProviderName) {
  switch (provider) {
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'openai':
      return !!process.env.OPENAI_API_KEY;
    case 'deepseek':
      return !!process.env.DEEPSEEK_API_KEY;
    case 'minimax':
      return !!process.env.MINIMAX_API_KEY;
    case 'gemini':
      return !!process.env.GEMINI_API_KEY;
  }
}

export function getAvailableModels(): ModelConfig[] {
  return MODEL_REGISTRY.filter((model) => model.available && isProviderConfigured(model.provider));
}

export function getModelsByTier(tier: string): ModelConfig[] {
  return getAvailableModels().filter((model) => model.tier === tier);
}

export function getModelById(id: string): ModelConfig | undefined {
  return MODEL_REGISTRY.find((model) => model.id === id);
}

// ─── Derived provider summaries (canonical — replaces ai-router/providerRegistry) ───

export interface ProviderSummary {
  name: string;
  available: boolean;
  models: string[];
  supportsJson: boolean;
  supportsStreaming: boolean;
  costTier: 'low' | 'medium' | 'high';
}

const PROVIDER_COST_TIERS: Record<string, 'low' | 'medium' | 'high'> = {
  anthropic: 'high', openai: 'high', deepseek: 'low', gemini: 'medium', minimax: 'low',
};

export function getProviderSummaries(): ProviderSummary[] {
  const available = getAvailableModels();
  const grouped = new Map<string, ModelConfig[]>();
  for (const m of available) {
    if (!grouped.has(m.provider)) grouped.set(m.provider, []);
    grouped.get(m.provider)!.push(m);
  }
  return Array.from(grouped.entries()).map(([name, models]) => ({
    name,
    available: true,
    models: models.map(m => m.id),
    supportsJson: name !== 'deepseek' && name !== 'minimax',
    supportsStreaming: models.every(m => m.supportsStreaming),
    costTier: PROVIDER_COST_TIERS[name] ?? 'medium',
  }));
}

export function getFirstAvailableProvider(preferredList: string[]): string {
  const summaries = getProviderSummaries();
  for (const name of preferredList) {
    if (summaries.find(s => s.name === name)?.available) return name;
  }
  const any = summaries.find(s => s.available);
  return any?.name ?? 'deepseek';
}
