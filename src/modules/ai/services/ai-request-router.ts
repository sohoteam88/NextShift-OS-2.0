// ============================================================
// AI Model Router — Main entry point
// Wraps existing AIRouter with plan-aware policy, cost estimation,
// fallback handling, and normalized responses.
// ============================================================

import { getRouterForTenant } from '@/modules/ai/router';
import type { TaskCategory } from '@/modules/ai/router/task-classifier';
import prisma from '@/lib/prisma';
import type { NormalizedResponse, RouterRequest, PlanTier, AITaskType } from '../types/requests';
import { decidePolicy, getTaskDefinition } from './model-policy-engine';
import { estimateCredits } from './cost-estimator';
import { getFirstAvailable, getAvailableProviders } from './provider-registry';
import { executeWithFallback } from './fallback-handler';
import { normalizeResponse, errorResponse } from './response-normalizer';
import { enforceQuota } from '@/modules/ai/usage/quota';

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
        req.taskType as TaskCategory,
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
export { getAvailableProviders } from './provider-registry';
export { estimateCredits } from './cost-estimator';
export { decidePolicy } from './model-policy-engine';
