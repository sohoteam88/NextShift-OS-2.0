import type { Prisma } from '@prisma/client';
import { getAvailableModels, getModelsByTier, type ModelConfig } from './model-registry';
import { classifyTask, type TaskCategory, type TaskClassification } from './task-classifier';
import type { AIGenerateParams, AIGenerateResult, AIProvider, AIProviderName, AIStreamChunk } from '../providers/types';
import { AnthropicProvider } from '../providers/anthropic';
import { OpenAIProvider } from '../providers/openai';
import { DeepSeekProvider } from '../providers/deepseek';
import { MiniMaxProvider } from '../providers/minimax';
import { GeminiProvider } from '../providers/gemini';

export type RouterMode = 'cost_optimized' | 'quality_first' | 'balanced' | 'zh_optimized';

export interface RouterConfig {
  mode: RouterMode;
  preferredProvider?: AIProviderName;
  maxRetries: number;
  autoEscalate: boolean;
}

export interface RoutingDecision {
  taskCategory: TaskCategory;
  classification: TaskClassification;
  selectedModel: string;
  selectedModelName: string;
  selectedTier: string;
  provider: AIProviderName;
  estimatedCost: number;
  wasEscalated: boolean;
  originalTier: string;
}

const DEFAULT_CONFIG: RouterConfig = {
  mode: 'balanced',
  maxRetries: 2,
  autoEscalate: true,
};

const TIER_ORDER = ['C', 'B', 'A', 'S'];

export class AIRouter {
  private config: RouterConfig;
  private providers: Map<string, AIProvider> = new Map();

  constructor(config?: Partial<RouterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private getProviderForModel(model: ModelConfig): AIProvider {
    const key = model.provider;
    if (!this.providers.has(key)) {
      switch (key) {
        case 'anthropic':
          this.providers.set(key, new AnthropicProvider());
          break;
        case 'openai':
          this.providers.set(key, new OpenAIProvider());
          break;
        case 'deepseek':
          this.providers.set(key, new DeepSeekProvider());
          break;
        case 'minimax':
          this.providers.set(key, new MiniMaxProvider());
          break;
        case 'gemini':
          this.providers.set(key, new GeminiProvider());
          break;
      }
    }
    return this.providers.get(key)!;
  }

  async generate(
    params: AIGenerateParams,
    taskCategory: TaskCategory,
  ): Promise<AIGenerateResult & { routing: RoutingDecision }> {
    const { classification, model, routing: initialRouting } = this.createDecision(params, taskCategory);
    const { result, finalModel, wasEscalated } = await this.executeWithRetry(params, model, classification);

    const routing: RoutingDecision = {
      taskCategory,
      classification,
      selectedModel: finalModel.id,
      selectedModelName: finalModel.displayName,
      selectedTier: finalModel.tier,
      provider: finalModel.provider,
      estimatedCost: this.calculateCost(finalModel, result.tokensIn, result.tokensOut),
      wasEscalated,
      originalTier: initialRouting.originalTier,
    };

    return { ...result, model: finalModel.id, provider: finalModel.provider, routing };
  }

  async *generateStream(
    params: AIGenerateParams,
    taskCategory: TaskCategory,
  ): AsyncGenerator<AIStreamChunk & { routing?: RoutingDecision }> {
    const { model } = this.createDecision(params, taskCategory);
    const provider = this.getProviderForModel(model);
    yield* provider.generateStream({ ...params, model: model.id });
  }

  createDecision(params: AIGenerateParams, taskCategory: TaskCategory) {
    const classification = classifyTask(taskCategory, params.userMessage.length + params.systemPrompt.length);
    const model = this.selectModel(classification);
    const routing: RoutingDecision = {
      taskCategory,
      classification,
      selectedModel: model.id,
      selectedModelName: model.displayName,
      selectedTier: model.tier,
      provider: model.provider,
      estimatedCost: this.calculateCost(model, classification.estimatedInputTokens, classification.estimatedOutputTokens),
      wasEscalated: false,
      originalTier: classification.tier,
    };

    return { classification, model, routing };
  }

  selectModel(classification: TaskClassification): ModelConfig {
    let candidates = getModelsByTier(classification.tier);

    if (candidates.length === 0) {
      const higherTier = this.escalateTier(classification.tier);
      if (higherTier !== classification.tier) {
        candidates = getModelsByTier(higherTier);
      }
    }

    if (candidates.length === 0) {
      candidates = getAvailableModels();
    }

    if (candidates.length === 0) {
      throw new Error('No AI models available. Set at least one AI provider API key.');
    }

    return this.pickBestCandidate(candidates);
  }

  private pickBestCandidate(candidates: ModelConfig[]): ModelConfig {
    if (this.config.preferredProvider) {
      const preferred = candidates.filter((model) => model.provider === this.config.preferredProvider);
      if (preferred.length > 0) candidates = preferred;
    }

    return [...candidates].sort((a, b) => {
      switch (this.config.mode) {
        case 'cost_optimized':
          return (a.costPer1MInput + a.costPer1MOutput) - (b.costPer1MInput + b.costPer1MOutput);
        case 'quality_first':
          return b.qualityRating - a.qualityRating;
        case 'zh_optimized':
          if (b.zhQuality !== a.zhQuality) return b.zhQuality - a.zhQuality;
          return (a.costPer1MInput + a.costPer1MOutput) - (b.costPer1MInput + b.costPer1MOutput);
        case 'balanced':
        default: {
          const maxCost = Math.max(a.costPer1MInput + a.costPer1MOutput, b.costPer1MInput + b.costPer1MOutput, 1);
          const costScoreA = 10 * (1 - (a.costPer1MInput + a.costPer1MOutput) / maxCost);
          const costScoreB = 10 * (1 - (b.costPer1MInput + b.costPer1MOutput) / maxCost);
          const scoreA = a.qualityRating * 0.4 + a.zhQuality * 0.15 + a.speedRating * 0.15 + costScoreA * 0.3;
          const scoreB = b.qualityRating * 0.4 + b.zhQuality * 0.15 + b.speedRating * 0.15 + costScoreB * 0.3;
          return scoreB - scoreA;
        }
      }
    })[0];
  }

  private async executeWithRetry(
    params: AIGenerateParams,
    model: ModelConfig,
    classification: TaskClassification,
    attempt = 1,
  ): Promise<{ result: AIGenerateResult; finalModel: ModelConfig; wasEscalated: boolean }> {
    try {
      const provider = this.getProviderForModel(model);
      const result = await provider.generateText({ ...params, model: model.id });
      return { result, finalModel: model, wasEscalated: attempt > 1 };
    } catch (error) {
      console.error(`AI Router: ${model.id} failed (attempt ${attempt}/${this.config.maxRetries}):`, error);

      if (attempt >= this.config.maxRetries) {
        throw new Error(`AI Router: all attempts failed. Last model: ${model.id}. Error: ${String(error)}`);
      }

      const sameTierAlts = getModelsByTier(model.tier).filter((candidate) => candidate.id !== model.id);
      if (sameTierAlts.length > 0) {
        const next = this.pickBestCandidate(sameTierAlts);
        return this.executeWithRetry(params, next, classification, attempt + 1);
      }

      if (this.config.autoEscalate) {
        const higherTier = this.escalateTier(model.tier);
        if (higherTier !== model.tier) {
          const escalated = getModelsByTier(higherTier);
          if (escalated.length > 0) {
            return this.executeWithRetry(params, this.pickBestCandidate(escalated), classification, attempt + 1);
          }
        }
      }

      throw error;
    }
  }

  private escalateTier(tier: string): string {
    const index = TIER_ORDER.indexOf(tier);
    return index >= 0 && index < TIER_ORDER.length - 1 ? TIER_ORDER[index + 1] : tier;
  }

  private calculateCost(model: ModelConfig, tokensIn: number, tokensOut: number): number {
    return (tokensIn * model.costPer1MInput + tokensOut * model.costPer1MOutput) / 1_000_000;
  }

  preview(taskCategory: TaskCategory, inputLength?: number) {
    const classification = classifyTask(taskCategory, inputLength);
    const model = this.selectModel(classification);
    return {
      tier: model.tier,
      model: model.displayName,
      estimatedCost: this.calculateCost(model, classification.estimatedInputTokens, classification.estimatedOutputTokens),
      reason: classification.reason,
    };
  }
}

let instance: AIRouter | null = null;

export function getRouter(config?: Partial<RouterConfig>): AIRouter {
  if (!instance || config) {
    instance = new AIRouter(config);
  }
  return instance;
}

function parseRouterSettings(settings: Prisma.JsonValue | null | undefined): Partial<RouterConfig> {
  const raw = settings && typeof settings === 'object' && !Array.isArray(settings)
    ? (settings as Record<string, unknown>).ai_router
    : null;
  const routerSettings = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};

  return {
    mode: typeof routerSettings.mode === 'string' ? routerSettings.mode as RouterMode : 'balanced',
    preferredProvider: typeof routerSettings.preferred_provider === 'string'
      ? routerSettings.preferred_provider as AIProviderName
      : undefined,
    autoEscalate: typeof routerSettings.auto_escalate === 'boolean' ? routerSettings.auto_escalate : true,
  };
}

export async function getRouterForTenant(tenantId: string, overrides?: Partial<RouterConfig>): Promise<AIRouter> {
  const tenant = await (await import('@/lib/prisma')).default.tenant.findUnique({
    where: { id: tenantId },
    select: { settings: true },
  });

  return new AIRouter({ ...parseRouterSettings(tenant?.settings), ...overrides });
}
