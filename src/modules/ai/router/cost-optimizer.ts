import { MODEL_REGISTRY, type ModelConfig } from './model-registry';
import type { TaskCategory } from './task-classifier';

interface CategoryUsage {
  category: TaskCategory;
  calls: number;
}

export interface CostEstimate {
  withRouter: number;
  withoutRouter: number;
  savings: number;
  savingsPercent: number;
  breakdown: { category: string; calls: number; routedModel: string; cost: number }[];
}

const AVG_TOKENS: Record<string, { input: number; output: number }> = {
  brand_extraction: { input: 2000, output: 800 },
  content_generation: { input: 800, output: 500 },
  video_script: { input: 800, output: 800 },
  whatsapp_reply: { input: 600, output: 300 },
  lead_analysis: { input: 1000, output: 600 },
  content_calendar: { input: 1500, output: 2500 },
  content_insights: { input: 1500, output: 800 },
  username_generation: { input: 500, output: 300 },
  bio_generation: { input: 600, output: 300 },
  funnel_copy: { input: 800, output: 1500 },
  translation: { input: 500, output: 500 },
  formatting: { input: 200, output: 200 },
};

const TIER_B_TASKS: TaskCategory[] = [
  'content_generation',
  'whatsapp_reply',
  'username_generation',
  'bio_generation',
  'video_script',
  'translation',
  'formatting',
];

export function estimateMonthlyCost(usage: CategoryUsage[]): CostEstimate {
  const sonnet = MODEL_REGISTRY.find((model) => model.id === 'claude-sonnet-4-20250514')!;
  const haiku = MODEL_REGISTRY.find((model) => model.id === 'claude-haiku-4-5-20251001')!;
  let withoutRouter = 0;
  let withRouter = 0;
  const breakdown: CostEstimate['breakdown'] = [];

  for (const { category, calls } of usage) {
    const tokens = AVG_TOKENS[category] ?? { input: 500, output: 500 };
    const costFn = (model: ModelConfig) =>
      calls * (tokens.input * model.costPer1MInput + tokens.output * model.costPer1MOutput) / 1_000_000;

    withoutRouter += costFn(sonnet);
    const routedModel = TIER_B_TASKS.includes(category) ? haiku : sonnet;
    const cost = costFn(routedModel);
    withRouter += cost;
    breakdown.push({ category, calls, routedModel: routedModel.displayName, cost: +cost.toFixed(4) });
  }

  const savings = withoutRouter - withRouter;
  return {
    withRouter: +withRouter.toFixed(2),
    withoutRouter: +withoutRouter.toFixed(2),
    savings: +savings.toFixed(2),
    savingsPercent: withoutRouter > 0 ? +((savings / withoutRouter) * 100).toFixed(1) : 0,
    breakdown,
  };
}

export async function estimateFromActualUsage(tenantId: string): Promise<CostEstimate> {
  const prisma = (await import('@/lib/prisma')).default;
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const logs = await prisma.aIUsageLog.groupBy({
    by: ['feature'],
    where: { tenantId, createdAt: { gte: startOfMonth } },
    _count: { _all: true },
  });

  return estimateMonthlyCost(logs.map((log) => ({
    category: log.feature as TaskCategory,
    calls: log._count._all,
  })));
}
