import {
  buildGenerationContext,
  runGeneration,
  type GenerationOutcome,
  type GenerationPlatform,
} from '@/modules/ai/generation';
import type { TaskCategory } from '@/modules/ai/router';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export type VideoGenerationMetadata = {
  generatedByAi: boolean;
  degradedLabel?: string;
};

type GenerateVideoJsonOptions<T> = {
  systemPrompt: string;
  userMessage: string;
  feature: string;
  fallback: T;
  platform: string;
  temperature?: number;
  maxTokens?: number;
  taskCategory?: TaskCategory;
  parse?: (text: string) => T;
};

const PLATFORM_MAP: Record<string, GenerationPlatform> = {
  facebook_reel: 'facebook',
  instagram_reel: 'instagram',
  tiktok: 'tiktok',
  instagram_story: 'instagram',
  xiaohongshu: 'xhs',
  youtube_shorts: 'tiktok',
};

function generationPlatform(platform: string): GenerationPlatform {
  // The shared gateway has no YouTube-specific prompt profile yet. TikTok's
  // short-form guidance is the closest safe profile for Shorts.
  return PLATFORM_MAP[platform] ?? 'tiktok';
}

/**
 * Extracts structured model output. Invalid output deliberately throws so the
 * shared generation gateway can retry and, if exhausted, return its labelled
 * template fallback instead of presenting a default as AI-authored content.
 */
export function parseJsonFromAI<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const objectStart = cleaned.indexOf('{');
  const arrayStart = cleaned.indexOf('[');
  const start = [objectStart, arrayStart].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  const end = start === arrayStart ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
  if (start === undefined || end === -1 || end < start) {
    throw new Error('AI returned malformed JSON');
  }

  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    throw new Error('AI returned malformed JSON');
  }
}

/**
 * Uses the canonical G5 gateway for every structured video response. A
 * malformed response is retried once; only then may the gateway return the
 * deterministic fallback, always carrying its user-visible degraded label.
 */
export async function generateVideoJson<T>(
  user: AuthUser,
  options: GenerateVideoJsonOptions<T>,
): Promise<GenerationOutcome<T>> {
  const context = await buildGenerationContext(user, {
    mode: 'retail',
    platform: generationPlatform(options.platform),
    businessPack: { promptContext: options.systemPrompt },
  });
  const generationOptions = {
    context,
    userMessage: options.userMessage,
    taskCategory: options.taskCategory ?? 'video_script',
    feature: options.feature,
    fallback: options.fallback,
    parse: options.parse ?? parseJsonFromAI<T>,
    temperature: options.temperature,
    maxTokens: options.maxTokens,
  };

  let outcome = await runGeneration(user, generationOptions);
  if (outcome.status === 'degraded') {
    outcome = await runGeneration(user, generationOptions);
  }
  return outcome;
}

export function generationMetadata(outcomes: Array<Pick<GenerationOutcome<unknown>, 'status'> & { userVisibleLabel?: string }>): VideoGenerationMetadata {
  const degraded = outcomes.find((outcome) => outcome.status === 'degraded');
  return degraded?.status === 'degraded'
    ? { generatedByAi: false, degradedLabel: degraded.userVisibleLabel }
    : { generatedByAi: true };
}
