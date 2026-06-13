// AI Router Advisor — admin visibility and recommendations
import type { NormalizedResponse } from './types';

export interface RouterStats {
  totalCalls: number;
  failedCalls: number;
  avgLatencyMs: number;
  byProvider: Record<string, number>;
  byModule: Record<string, number>;
  costsByTenant: Array<{ tenantId: string; creditsUsed: number }>;
  highCostAlerts: string[];
}

/**
 * Generate admin-facing usage summary from response logs.
 */
export function analyzeUsage(responses: NormalizedResponse[]): RouterStats {
  const byProvider: Record<string, number> = {};
  const byModule: Record<string, number> = {};
  let failedCalls = 0;
  let totalLatency = 0;

  for (const r of responses) {
    byProvider[r.provider] = (byProvider[r.provider] ?? 0) + 1;
    byModule[r.metadata.taskType] = (byModule[r.metadata.taskType] ?? 0) + 1;
    if (!r.success) failedCalls++;
    totalLatency += r.metadata.latencyMs;
  }

  return {
    totalCalls: responses.length,
    failedCalls,
    avgLatencyMs: responses.length > 0 ? Math.round(totalLatency / responses.length) : 0,
    byProvider,
    byModule,
    costsByTenant: [],
    highCostAlerts: failedCalls > responses.length * 0.1 ? ['故障率超过10%，请检查AI服务'] : [],
  };
}

/**
 * Get recommendations for optimizing AI usage.
 */
export function getRouterAdvisorTips(stats: RouterStats): string[] {
  const tips: string[] = [];
  if (stats.failedCalls > 0) tips.push(`有${stats.failedCalls}次AI调用失败，检查provider可用性。`);
  if (stats.avgLatencyMs > 5000) tips.push('AI响应延迟较高，考虑切换更快的模型。');
  const deepseekCount = stats.byProvider['deepseek'] ?? 0;
  const anthropicCount = stats.byProvider['anthropic'] ?? 0;
  if (anthropicCount > deepseekCount * 3) tips.push('大量高成本调用，考虑将非关键任务切换到DeepSeek。');
  if (tips.length === 0) tips.push('AI路由运行正常。');
  return tips;
}
