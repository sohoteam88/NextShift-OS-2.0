import type { AIProvider } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';

let anthropicInstance: AnthropicProvider | null = null;
let openaiInstance: OpenAIProvider | null = null;

function getAnthropicProvider(): AnthropicProvider {
  if (!anthropicInstance) anthropicInstance = new AnthropicProvider();
  return anthropicInstance;
}

function getOpenAIProvider(): OpenAIProvider {
  if (!openaiInstance) openaiInstance = new OpenAIProvider();
  return openaiInstance;
}

export function getProvider(preferred?: 'anthropic' | 'openai'): AIProvider {
  const choice = preferred ?? 'anthropic';

  if (choice === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
    return getAnthropicProvider();
  }

  if (choice === 'openai' && process.env.OPENAI_API_KEY) {
    return getOpenAIProvider();
  }

  if (process.env.ANTHROPIC_API_KEY) return getAnthropicProvider();
  if (process.env.OPENAI_API_KEY) return getOpenAIProvider();

  throw new Error('No AI provider configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY.');
}
