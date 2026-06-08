import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AIGenerateResult } from '../providers/types';

const COST_TABLE: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3, output: 15 },
  'gpt-4o': { input: 2.5, output: 10 },
};

export function calculateCost(model: string, tokensIn: number, tokensOut: number): number {
  const rates = COST_TABLE[model] ?? COST_TABLE['claude-sonnet-4-20250514'];
  return (tokensIn * rates.input + tokensOut * rates.output) / 1_000_000;
}

export async function logAIUsage(params: {
  tenantId: string;
  userId: string;
  templateId?: string;
  feature: string;
  result: AIGenerateResult;
}) {
  const cost = calculateCost(params.result.model, params.result.tokensIn, params.result.tokensOut);

  return prisma.aIUsageLog.create({
    data: {
      tenantId: params.tenantId,
      userId: params.userId,
      ...(params.templateId ? { templateId: params.templateId } : {}),
      provider: params.result.provider,
      model: params.result.model,
      category: params.feature,
      feature: params.feature,
      tokensIn: params.result.tokensIn,
      tokensOut: params.result.tokensOut,
      durationMs: params.result.durationMs,
      costUsd: new Prisma.Decimal(cost.toFixed(6)),
    },
  });
}

export async function getUsageStats(tenantId: string, userId?: string) {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const where: Record<string, unknown> = {
    tenantId,
    createdAt: { gte: startOfMonth },
  };

  if (userId) {
    where.userId = userId;
  }

  const logs = await prisma.aIUsageLog.findMany({
    where,
    select: {
      feature: true,
      costUsd: true,
      tokensIn: true,
      tokensOut: true,
    },
  });

  const totalCalls = logs.length;
  const totalCost = logs.reduce((sum, log) => sum + Number(log.costUsd), 0);
  const totalTokens = logs.reduce((sum, log) => sum + log.tokensIn + log.tokensOut, 0);

  const byFeature: Record<string, { calls: number; cost: number }> = {};
  for (const log of logs) {
    if (!byFeature[log.feature]) {
      byFeature[log.feature] = { calls: 0, cost: 0 };
    }
    byFeature[log.feature].calls += 1;
    byFeature[log.feature].cost += Number(log.costUsd);
  }

  return { totalCalls, totalCost, totalTokens, byFeature };
}
