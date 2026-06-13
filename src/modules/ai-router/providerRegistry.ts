// Provider Registry — detect available providers from env
import type { ProviderInfo } from './types';

/**
 * Detect which providers are available based on environment variables.
 * Missing env var → provider marked unavailable (no crash).
 */
export function getAvailableProviders(): ProviderInfo[] {
  return [
    {
      name: 'anthropic',
      available: !!(process.env.ANTHROPIC_API_KEY),
      models: ['claude-sonnet-4-6', 'claude-opus-4-8', 'claude-fable-5'],
      supportsJson: true,
      supportsStreaming: true,
      costTier: 'high',
    },
    {
      name: 'openai',
      available: !!(process.env.OPENAI_API_KEY),
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
      supportsJson: true,
      supportsStreaming: true,
      costTier: 'high',
    },
    {
      name: 'deepseek',
      available: !!(process.env.DEEPSEEK_API_KEY),
      models: ['deepseek-v4-pro', 'deepseek-chat'],
      supportsJson: false,
      supportsStreaming: true,
      costTier: 'low',
    },
    {
      name: 'gemini',
      available: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      models: ['gemini-2.5-pro', 'gemini-2.5-flash'],
      supportsJson: true,
      supportsStreaming: true,
      costTier: 'medium',
    },
    {
      name: 'minimax',
      available: !!(process.env.MINIMAX_API_KEY),
      models: ['abab-7b'],
      supportsJson: false,
      supportsStreaming: false,
      costTier: 'low',
    },
  ];
}

/**
 * Get the first available provider from a priority list.
 */
export function getFirstAvailable(preferredList: string[]): string {
  const providers = getAvailableProviders();
  for (const name of preferredList) {
    const p = providers.find(pr => pr.name === name);
    if (p?.available) return name;
  }
  // Fallback: return any available provider
  const any = providers.find(p => p.available);
  return any?.name ?? 'deepseek'; // Default to deepseek as cheapest available
}
