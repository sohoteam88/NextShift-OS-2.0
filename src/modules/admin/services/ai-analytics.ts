import prisma from '@/lib/prisma';
import type { PlatformAICostBreakdown } from '../types';

function decimalToNumber(value: any) { return Number(value ?? 0); }
function startOfMonth(d = new Date()) { const v = new Date(d); v.setDate(1); v.setHours(0,0,0,0); return v; }

export async function getAICostBreakdown(): Promise<PlatformAICostBreakdown[]> {
  const monthStart = startOfMonth();
  const [tenants, usageGroups] = await Promise.all([
    prisma.tenant.findMany({ select: { id: true, name: true, slug: true, plan: true }, orderBy: { name: 'asc' } }),
    prisma.aIUsageLog.groupBy({ by: ['tenantId'], where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true } }),
  ]);
  const usageMap = new Map(usageGroups.map(r => [r.tenantId, { calls: r._count._all, cost: decimalToNumber(r._sum.costUsd) }]));
  return tenants
    .map(t => { const u = usageMap.get(t.id) ?? { calls: 0, cost: 0 }; return { tenantId: t.id, tenantName: t.name, slug: t.slug, plan: t.plan, callsThisMonth: u.calls, costThisMonth: u.cost }; })
    .sort((a, b) => b.costThisMonth - a.costThisMonth || b.callsThisMonth - a.callsThisMonth || a.tenantName.localeCompare(b.tenantName));
}

export async function getAIModelBreakdown() {
  const monthStart = startOfMonth();
  const fourteenDaysAgo = new Date(); fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13); fourteenDaysAgo.setHours(0,0,0,0);
  const [summary, byModel, byFeature, recentLogs] = await Promise.all([
    prisma.aIUsageLog.aggregate({ where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true, tokensIn: true, tokensOut: true } }),
    prisma.aIUsageLog.groupBy({ by: ['model', 'provider'], where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true, tokensIn: true, tokensOut: true }, orderBy: [{ _sum: { costUsd: 'desc' } }] }),
    prisma.aIUsageLog.groupBy({ by: ['feature', 'category'], where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true }, orderBy: [{ _sum: { costUsd: 'desc' } }] }),
    prisma.aIUsageLog.findMany({ where: { createdAt: { gte: fourteenDaysAgo } }, select: { createdAt: true, costUsd: true }, orderBy: { createdAt: 'asc' } }),
  ]);

  const dailyMap = new Map<string, { cost: number; calls: number }>();
  for (const log of recentLogs) {
    const day = log.createdAt.toISOString().slice(0, 10);
    const prev = dailyMap.get(day) ?? { cost: 0, calls: 0 };
    dailyMap.set(day, { cost: prev.cost + decimalToNumber(log.costUsd), calls: prev.calls + 1 });
  }
  const daily: { date: string; cost: number; calls: number }[] = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const day = d.toISOString().slice(0,10); daily.push({ date: day, ...(dailyMap.get(day) ?? { cost: 0, calls: 0 }) }); }

  const totalCost = decimalToNumber(summary._sum.costUsd);
  const totalCalls = summary._count._all;
  return {
    totalCostThisMonth: totalCost, totalCallsThisMonth: totalCalls,
    totalTokensIn: summary._sum.tokensIn ?? 0, totalTokensOut: summary._sum.tokensOut ?? 0,
    avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
    byModel: byModel.map(r => ({ model: r.model, provider: r.provider, calls: r._count._all, costUsd: decimalToNumber(r._sum.costUsd), tokensIn: r._sum.tokensIn ?? 0, tokensOut: r._sum.tokensOut ?? 0 })),
    byFeature: byFeature.map(r => ({ feature: r.feature, category: r.category, calls: r._count._all, costUsd: decimalToNumber(r._sum.costUsd) })),
    daily,
  };
}
