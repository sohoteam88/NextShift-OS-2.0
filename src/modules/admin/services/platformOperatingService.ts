// Platform Operating Service — Orchestrator (V6-7C)
// Computation logic extracted to:
//   ai-profitability.ts   (revenue, AI metrics, summary)
//   tenant-health.ts      (tenant scoring, churn risk)
//   system-monitoring.ts  (growth windows, alerts, funnel analysis)

import { prisma } from '@/lib/prisma';
import { rm, computeRevenueMetrics, computeAIMetrics, computeSummary } from './ai-profitability';
import { computeTenantHealth } from './tenant-health';
import { computeGrowthWindow, computeAlerts, computeFunnelAnalysis } from './system-monitoring';

// Re-export types for backward compat
export type { ChurnRiskLevel } from './tenant-health';
export type { TenantHealthRecord } from './tenant-health';
export type { FounderAlertPriority } from './system-monitoring';

const DAY_MS = 24 * 60 * 60 * 1000;
function daysAgo(d: number) { return new Date(Date.now() - d * DAY_MS); }

export type PlatformOperatingData = {
  summary: { mrr: number; arr: number; activeTenants: number; activeUsers: number; aiCost: number; grossMargin: number; totalTenants: number; totalUsers: number; betaConversionRate: number };
  revenue: { mrr: number; arr: number; arpu: number; arpt: number; growthPercent: number; forecast30: number; forecast90: number; forecast180: number; forecast365: number; planDistribution: { plan: string; tenants: number; revenue: number }[] };
  ai: { calls: number; cost: number; revenue: number; margin: number; costPerTenant: number; costPerUser: number; mostExpensiveTenant: string; mostEfficientTenant: string };
  tenants: import('./tenant-health').TenantHealthRecord[];
  growth: { today: any; sevenDays: any; thirtyDays: any; ninetyDays: any };
  funnels: { bestFunnel: string; worstFunnel: string; rows: { type: string; leads: number; appointments: number; customers: number; members: number; revenue: number; conversion: number }[] };
  beta: { invited: number; activated: number; contentCompleted: number; funnelsPublished: number; firstLead: number; firstCustomer: number; firstMember: number };
  alerts: import('./system-monitoring').FounderAlert[];
  briefing: string[];
};

class PlatformOperatingService {
  async getOperatingData(): Promise<PlatformOperatingData> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = monthStart;
    const weekAgo = daysAgo(7);

    const [tenants, users, funnels, leadGroups, customers, contents, aiUsage, aiUsagePrevious, aiByTenant, inviteCount] = await Promise.all([
      prisma.tenant.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.user.findMany({ where: { deletedAt: null }, include: { userProgress: true } }),
      prisma.funnel.findMany(),
      prisma.lead.groupBy({ by: ['tenantId', 'pipelineStage'], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.customer.findMany(),
      prisma.content.findMany({ where: { createdAt: { gte: daysAgo(90) } } }),
      prisma.aIUsageLog.aggregate({ where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true } }),
      prisma.aIUsageLog.aggregate({ where: { createdAt: { gte: previousMonthStart, lt: previousMonthEnd } }, _count: { _all: true }, _sum: { costUsd: true } }),
      prisma.aIUsageLog.groupBy({ by: ['tenantId'], where: { createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true } }),
      prisma.inviteCode.count(),
    ]);

    // Build lookup maps
    const usersByTenant = new Map<string, typeof users>(); const funnelsByTenant = new Map<string, typeof funnels>();
    const contentsByTenant = new Map<string, typeof contents>(); const customersByTenant = new Map<string, typeof customers>();
    const leadsByTenant = new Map<string, number>(); const appointmentsByTenant = new Map<string, number>();
    for (const u of users) usersByTenant.set(u.tenantId, [...(usersByTenant.get(u.tenantId) ?? []), u]);
    for (const f of funnels) funnelsByTenant.set(f.tenantId, [...(funnelsByTenant.get(f.tenantId) ?? []), f]);
    for (const c of contents) contentsByTenant.set(c.tenantId, [...(contentsByTenant.get(c.tenantId) ?? []), c]);
    for (const c of customers) customersByTenant.set(c.tenantId, [...(customersByTenant.get(c.tenantId) ?? []), c]);
    for (const row of leadGroups) {
      leadsByTenant.set(row.tenantId, (leadsByTenant.get(row.tenantId) ?? 0) + row._count._all);
      const stage = row.pipelineStage.toLowerCase();
      if (stage.includes('appointment') || stage.includes('booking') || stage.includes('demo')) appointmentsByTenant.set(row.tenantId, (appointmentsByTenant.get(row.tenantId) ?? 0) + row._count._all);
    }

    // Delegate computation
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const activeUsers = users.filter(u => (u.userProgress?.lastActivityAt ?? u.updatedAt) >= weekAgo).length;
    const revenue = computeRevenueMetrics(tenants, users, 0, aiUsage, activeTenants);
    const ai = computeAIMetrics(aiUsage, aiByTenant, tenants, users, revenue.mrr, activeTenants);
    const tenantHealth = computeTenantHealth(tenants, usersByTenant, funnelsByTenant, contentsByTenant, customersByTenant, leadsByTenant, ai.aiTenantMap);
    const aiCost = rm(aiUsage._sum.costUsd);
    const betaConversionRate = inviteCount > 0 ? (() => { const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v))); const activated = users.filter(u => u.status === 'active').length; return clamp((activated / inviteCount) * 100); })() : 0;
    const summary = computeSummary(revenue.mrr, activeTenants, activeUsers, aiCost, tenants, users, betaConversionRate);
    const growth = {
      today: computeGrowthWindow('Today', 1, users, tenants, contents, leadGroups, customers),
      sevenDays: computeGrowthWindow('7 Days', 7, users, tenants, contents, leadGroups, customers),
      thirtyDays: computeGrowthWindow('30 Days', 30, users, tenants, contents, leadGroups, customers),
      ninetyDays: computeGrowthWindow('90 Days', 90, users, tenants, contents, leadGroups, customers),
    };
    const funnelAnalysis = computeFunnelAnalysis(funnels, tenants, customersByTenant, appointmentsByTenant, usersByTenant);
    const alerts = computeAlerts(tenantHealth, summary.grossMargin, revenue.mrr, revenue.previousMrr, activeTenants, tenants.length);

    return {
      summary,
      revenue: { mrr: revenue.mrr, arr: revenue.arr, arpu: revenue.arpu, arpt: revenue.arpt, growthPercent: revenue.growthPercent, forecast30: revenue.forecast30, forecast90: revenue.forecast90, forecast180: revenue.forecast180, forecast365: revenue.forecast365, planDistribution: revenue.planDistribution },
      ai: { calls: ai.calls, cost: ai.cost, revenue: ai.revenue, margin: ai.margin, costPerTenant: ai.costPerTenant, costPerUser: ai.costPerUser, mostExpensiveTenant: ai.mostExpensiveTenant, mostEfficientTenant: tenantHealth.filter(t => (ai.aiTenantMap.get(t.id)?.cost ?? 0) > 0).sort((a, b) => (b.leads + b.users) / (ai.aiTenantMap.get(b.id)?.cost ?? 1) - (a.leads + a.users) / (ai.aiTenantMap.get(a.id)?.cost ?? 1))[0]?.name ?? 'None' },
      tenants: tenantHealth,
      growth,
      funnels: funnelAnalysis,
      beta: {
        invited: inviteCount,
        activated: users.filter(u => u.status === 'active').length,
        contentCompleted: new Set(contents.map(c => c.ownerId)).size,
        funnelsPublished: funnels.filter(f => f.status === 'published' || f.publishedAt).length,
        firstLead: new Set(leadGroups.map(r => r.tenantId)).size,
        firstCustomer: new Set(customers.map(c => c.tenantId)).size,
        firstMember: new Set(users.filter(u => u.sponsorId).map(u => u.tenantId)).size,
      },
      alerts,
      briefing: [
        `MRR is RM${revenue.mrr.toLocaleString()} with ${activeTenants} active tenants.`,
        `${tenantHealth.filter(t => t.churnRisk === 'High' || t.churnRisk === 'Critical').length} tenants are at churn risk.`,
        `${funnelAnalysis.bestFunnel} is currently the best performing funnel.`,
        `AI margin is ${ai.margin}% with RM${Math.round(aiCost).toLocaleString()} estimated monthly AI cost.`,
      ],
    };
  }
}

export const platformOperatingService = new PlatformOperatingService();
