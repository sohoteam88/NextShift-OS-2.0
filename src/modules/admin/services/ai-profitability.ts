// AI Profitability — Revenue + AI cost metrics computation

const USD_TO_RM = 4.7;
const PLAN_MRR_RM: Record<string, number> = { starter: 0, growth: 149, pro: 399, enterprise: 999 };

export function rm(value: any) { return Number(value ?? 0) * USD_TO_RM; }
export function clamp(value: number) { return Math.max(0, Math.min(100, Math.round(value))); }
export function planRevenue(plan: string) { return PLAN_MRR_RM[plan] ?? PLAN_MRR_RM.starter; }

export function computeRevenueMetrics(
  tenants: Array<{ status: string; plan: string; createdAt: Date; id: string }>,
  users: Array<{ id: string }>,
  aiCost: number,
  aiUsage: { _count: { _all: number } },
  activeTenants: number,
) {
  const mrr = tenants.reduce((sum, t) => sum + (t.status === 'active' ? planRevenue(t.plan) : 0), 0);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const previousMrr = Math.max(0, mrr - planRevenue('growth') * Math.max(0, tenants.filter(t => t.createdAt >= monthStart).length));
  const growthPercent = previousMrr > 0 ? Math.round(((mrr - previousMrr) / previousMrr) * 1000) / 10 : 0;

  return {
    mrr,
    arr: mrr * 12,
    arpu: users.length ? Math.round(mrr / users.length) : 0,
    arpt: activeTenants ? Math.round(mrr / activeTenants) : 0,
    growthPercent,
    forecast30: Math.round(mrr * (1 + Math.max(0, growthPercent) / 100)),
    forecast90: Math.round(mrr * 3 * (1 + Math.max(0, growthPercent) / 100)),
    forecast180: Math.round(mrr * 6 * (1 + Math.max(0, growthPercent) / 100)),
    forecast365: Math.round(mrr * 12 * (1 + Math.max(0, growthPercent) / 100)),
    planDistribution: Object.entries(
      tenants.reduce<Record<string, number>>((acc, t) => { acc[t.plan] = (acc[t.plan] ?? 0) + 1; return acc; }, {}),
    ).map(([plan, count]) => ({ plan, tenants: count, revenue: count * planRevenue(plan) })),
    previousMrr,
  };
}

export function computeAIMetrics(
  aiUsage: { _count: { _all: number }; _sum: { costUsd: any } },
  aiByTenant: Array<{ tenantId: string; _count: { _all: number }; _sum: { costUsd: any } }>,
  tenants: Array<{ id: string; name: string }>,
  users: Array<{ id: string }>,
  mrr: number,
  activeTenants: number,
) {
  const aiCost = rm(aiUsage._sum.costUsd);
  const aiTenantMap = new Map(aiByTenant.map(r => [r.tenantId, { calls: r._count._all, cost: rm(r._sum.costUsd) }]));
  const aiRevenue = mrr;
  const aiMargin = aiRevenue > 0 ? clamp(((aiRevenue - aiCost) / aiRevenue) * 100) : 0;
  const mostExpensive = [...aiTenantMap.entries()].sort((a, b) => b[1].cost - a[1].cost)[0];

  return {
    calls: aiUsage._count._all, cost: aiCost, revenue: aiRevenue, margin: aiMargin,
    costPerTenant: activeTenants ? Math.round(aiCost / activeTenants) : 0,
    costPerUser: users.length ? Math.round(aiCost / users.length) : 0,
    mostExpensiveTenant: mostExpensive ? tenants.find(t => t.id === mostExpensive[0])?.name ?? 'Unknown' : 'None',
    mostEfficientTenant: 'None', // set by caller
    aiTenantMap,
  };
}

export function computeSummary(
  mrr: number, activeTenants: number, activeUsers: number,
  aiCost: number, tenants: Array<{ id: string }>, users: Array<{ id: string }>,
  betaConversionRate: number,
) {
  return {
    mrr, arr: mrr * 12, activeTenants, activeUsers, aiCost,
    grossMargin: mrr > 0 ? clamp(((mrr - aiCost) / mrr) * 100) : 0,
    totalTenants: tenants.length, totalUsers: users.length, betaConversionRate,
  };
}
