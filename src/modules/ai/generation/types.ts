import type { BrandContext } from '@/modules/brand-dna/types';
import type { ContentTrack } from '@/modules/content-engine/types';
import type { AIGenerateResult } from '../providers/types';
import type { RoutingDecision, TaskCategory } from '../router';

/** Platforms with shared writing-style guidance for generation consumers. */
export type GenerationPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'xhs'
  | 'threads'
  | 'email'
  | 'blog';

export interface PlatformCharacteristics {
  platform: GenerationPlatform;
  label: string;
  styleGuidance: string;
  formatGuidance: string;
}

/**
 * O1 injection seam. This intentionally contains no business, product, or
 * brand copy; the future business-pack provider supplies a scoped prompt only
 * when a generation caller opts in.
 */
export interface BusinessPackSlice {
  promptContext?: string;
  metadata?: Record<string, unknown>;
}

/** Shared, module-neutral inputs for every AI-backed generation service. */
export interface GenerationContext {
  brandContext: BrandContext | null;
  brandDnaVersion: number;
  mode: ContentTrack;
  platform: PlatformCharacteristics;
  businessPack?: BusinessPackSlice;
}

export type RoutedGenerationResult = AIGenerateResult & { routing: RoutingDecision };

export const GENERATION_DEGRADE_LABEL = 'AI 暂时不可用，这是基础版本' as const;

export type GenerationOutcome<T> =
  | {
      status: 'success';
      source: 'ai';
      value: T;
      text: string;
      result: RoutedGenerationResult;
    }
  | {
      status: 'degraded';
      source: 'template_fallback';
      value: T;
      userVisibleLabel: typeof GENERATION_DEGRADE_LABEL;
      reason: string;
    };

export interface BuildGenerationContextOptions {
  mode: ContentTrack;
  platform: GenerationPlatform;
  businessPack?: BusinessPackSlice;
}

export interface RunGenerationOptions<T> {
  context: GenerationContext;
  userMessage: string;
  taskCategory: TaskCategory;
  feature: string;
  fallback: T;
  parse?: (text: string) => T;
  temperature?: number;
  maxTokens?: number;
}
