import type { AIProvider, AIGenerateParams, AIGenerateResult } from './types';
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

export async function generateWithFallback(
  params: AIGenerateParams,
  preferred?: 'anthropic' | 'openai',
): Promise<AIGenerateResult> {
  const primary = getProvider(preferred);

  try {
    return await primary.generateText(params);
  } catch (error) {
    console.error(`AI provider ${primary.name} failed:`, error);

    const fallbackName = primary.name === 'anthropic' ? 'openai' : 'anthropic';
    try {
      const fallback = getProvider(fallbackName);
      console.log(`Falling back to ${fallback.name}`);
      return await fallback.generateText(params);
    } catch (fallbackError) {
      console.error(`Fallback provider ${fallbackName} also failed:`, fallbackError);
      throw new Error('All AI providers failed. Please try again later.');
    }
  }
}
