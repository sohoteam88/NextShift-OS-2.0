// Fallback Handler — retry logic + graceful degradation
import type { NormalizedResponse, RouterRequest } from './types';

export interface FallbackConfig {
  maxRetries: number;
  retryDelayMs: number;
  providers: string[];
}

/**
 * Execute an AI call with retry + fallback across providers.
 * Never exposes raw provider errors to users.
 */
export async function executeWithFallback(
  request: RouterRequest,
  providers: string[],
  executeProvider: (provider: string, req: RouterRequest) => Promise<NormalizedResponse>,
  maxRetries: number = 3,
): Promise<NormalizedResponse> {
  const errors: string[] = [];
  const attemptedProviders: string[] = [];

  for (const provider of providers) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await executeProvider(provider, request);
        result.metadata.fallbackUsed = attemptedProviders.length > 0;
        return result;
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${provider}:${errMsg}`);
        attemptedProviders.push(provider);

        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, 500 * (attempt + 1))); // Exponential backoff
        }
      }
    }
  }

  // All providers failed — return sanitized error
  return {
    success: false,
    data: null,
    text: '',
    json: null,
    provider: 'none',
    model: 'none',
    creditsUsed: 0,
    warnings: [],
    error: 'AI服务暂时不可用，请稍后再试。',
    metadata: { tokensIn: 0, tokensOut: 0, latencyMs: 0, taskType: request.taskType, fallbackUsed: true },
  };
}
