// Response Normalizer — standardize all provider responses
import type { NormalizedResponse, AITaskType } from '../types/requests';

interface RawProviderResponse {
  text: string;
  tokensIn: number;
  tokensOut: number;
  model: string;
  provider: string;
  durationMs: number;
}

/**
 * Normalize a raw provider response into the standard format.
 * All AI calls should return this shape.
 */
export function normalizeResponse(
  raw: RawProviderResponse,
  taskType: AITaskType,
  creditsUsed: number,
  warnings: string[] = [],
): NormalizedResponse {
  let json: Record<string, unknown> | null = null;
  try {
    const cleaned = raw.text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    json = JSON.parse(cleaned);
  } catch {
    // Not JSON — that's fine
  }

  return {
    success: true,
    data: json ?? raw.text,
    text: raw.text,
    json,
    provider: raw.provider,
    model: raw.model,
    creditsUsed,
    warnings,
    error: null,
    metadata: {
      tokensIn: raw.tokensIn,
      tokensOut: raw.tokensOut,
      latencyMs: raw.durationMs,
      taskType,
      fallbackUsed: false,
    },
  };
}

/**
 * Create an error response with sanitized message.
 */
export function errorResponse(taskType: AITaskType, reason: string): NormalizedResponse {
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
    metadata: { tokensIn: 0, tokensOut: 0, latencyMs: 0, taskType, fallbackUsed: false },
  };
}
