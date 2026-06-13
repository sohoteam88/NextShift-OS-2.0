// ============================================================
// AI Model Router — Main entry point
// Wraps existing AIRouter with plan-aware policy, cost estimation,
// fallback handling, and normalized responses.
// ============================================================

import { getRouterForTenant } from '@/modules/ai/router';
import type { TaskCategory } from '@/modules/ai/router/task-classifier';
import prisma from '@/lib/prisma';
import type { AITaskType, NormalizedResponse, RouterRequest, PlanTier } from './types';
import { decidePolicy, getTaskDefinition } from './modelPolicyEngine';
import { estimateCredits } from './costEstimator';
import { getFirstAvailable, getAvailableProviders } from './providerRegistry';
import { executeWithFallback } from './fallbackHandler';
import { normalizeResponse, errorResponse } from './responseNormalizer';
import { enforceQuota } from '@/modules/ai/usage/quota';

// Map new AITaskType to existing TaskCategory
function mapToTaskCategory(taskType: AITaskType): TaskCategory {
  const mapping: Record<AITaskType, TaskCategory> = {
    brand_discovery: 'interview_dialogue', brand_dna_generation: 'interview_analysis',
    social_setup_generation: 'content_generation', content_generation: 'content_generation',
    video_script_generation: 'brand_extraction', lead_magnet_generation: 'content_generation',
    webinar_generation: 'content_generation', funnel_generation: 'content_generation',
    traffic_strategy: 'content_generation', whatsapp_reply: 'content_generation',
    crm_insight: 'content_generation', analytics_insight: 'content_generation',
    translation: 'content_generation', summarization: 'content_generation',
    classification: 'content_generation', extraction: 'brand_extraction',
  };
  return mapping[taskType] ?? 'content_generation';
}

// ============================================================
// Main routing function — the ONE entry point for all AI calls
// ============================================================

/**
 * Route an AI request through the centralized router.
 * This should be the ONLY way any module calls AI.
 *
 * Example:
 *   const result = await routeAiRequest({
 *     tenantId, userId, taskType: 'content_generation',
 *     systemPrompt: '...', userPrompt: '...',
 *   });
 */
export async function routeAiRequest(request: RouterRequest): Promise<NormalizedResponse> {
  const startTime = Date.now();

  // 1. Check quota
  try {
    await enforceQuota(request.tenantId);
  } catch {
    return errorResponse(request.taskType, 'AI额度不足');
  }

  // 2. Get user plan
  const tenant = await prisma.tenant.findUnique({ where: { id: request.tenantId }, select: { plan: true } });
  const plan: PlanTier = (tenant?.plan as PlanTier) ?? 'free';

  // 3. Policy decision
  const policy = decidePolicy(plan, request.taskType);

  // 4. Estimate credits
  const cost = estimateCredits(request.taskType);
  if (cost.estimatedCredits > policy.maxCredits) {
    return errorResponse(request.taskType, '当前计划不支持此操作。请升级计划。');
  }

  // 5. Determine available providers
  const providers = getAvailableProviders();
  const availableNames = providers.filter(p => p.available).map(p => p.name);

  if (availableNames.length === 0) {
    return errorResponse(request.taskType, '没有可用的AI服务。请检查API密钥配置。');
  }

  // 6. Prioritize: preferred → fallback → any available
  const taskDef = getTaskDefinition(request.taskType);
  const priorityList = [...taskDef.preferredProviders, ...taskDef.fallbackProviders].filter(p => availableNames.includes(p));

  // 7. Execute with fallback
  const result = await executeWithFallback(
    request,
    priorityList.length > 0 ? priorityList : availableNames,
    async (providerName, req) => {
      const router = await getRouterForTenant(req.tenantId, {
        mode: providerName === 'anthropic' ? 'quality_first' : providerName === 'deepseek' ? 'cost_optimized' : 'balanced',
      });

      const aiResult = await router.generate(
        { systemPrompt: req.systemPrompt, userMessage: req.userPrompt, temperature: 0.7, maxTokens: 2000 },
        mapToTaskCategory(req.taskType),
      );

      return normalizeResponse(
        {
          text: aiResult.text, tokensIn: aiResult.tokensIn, tokensOut: aiResult.tokensOut,
          model: aiResult.model, provider: providerName, durationMs: Date.now() - startTime,
        },
        request.taskType,
        cost.estimatedCredits,
        cost.warning ? [cost.warning] : [],
      );
    },
    policy.maxRetries,
  );

  return result;
}

// Re-export for convenience
export { getAvailableProviders } from './providerRegistry';
export { estimateCredits } from './costEstimator';
export { decidePolicy } from './modelPolicyEngine';
