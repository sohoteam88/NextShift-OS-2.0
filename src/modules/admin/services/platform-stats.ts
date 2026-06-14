import prisma from '@/lib/prisma';
import type { PlatformStats } from '../types';

function decimalToNumber(value: any) { return Number(value ?? 0); }
function startOfMonth(d = new Date()) { const v = new Date(d); v.setDate(1); v.setHours(0,0,0,0); return v; }

export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalTenants, activeTenants, totalUsers, totalLeads, totalFunnels, aiUsage, planGroups] = await Promise.all([
    prisma.tenant.count(),
    prisma.tenant.count({ where: { status: 'active' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { deletedAt: null } }),
    prisma.funnel.count(),
    prisma.aIUsageLog.aggregate({ where: { createdAt: { gte: startOfMonth() } }, _count: { _all: true }, _sum: { costUsd: true } }),
    prisma.tenant.groupBy({ by: ['plan'], _count: { _all: true } }),
  ]);

  const tenantsByPlan: PlatformStats['tenants_by_plan'] = { starter: 0, growth: 0, pro: 0 };
  for (const row of planGroups) { const key = row.plan as keyof typeof tenantsByPlan; if (key in tenantsByPlan) tenantsByPlan[key] = row._count._all; }

  return {
    total_tenants: totalTenants, active_tenants: activeTenants, total_users: totalUsers,
    total_leads: totalLeads, total_funnels: totalFunnels,
    ai_cost_this_month: decimalToNumber(aiUsage._sum.costUsd),
    ai_calls_this_month: aiUsage._count._all,
    tenants_by_plan: tenantsByPlan,
  };
}
