import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;
const USD_TO_RM = 4.7;

const PLAN_MRR_RM: Record<string, number> = {
  starter: 0,
  growth: 149,
  pro: 399,
  enterprise: 999,
};

export type ChurnRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type FounderAlertPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export type TenantHealthRecord = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  users: number;
  funnels: number;
  leads: number;
  activity: number;
  healthScore: number;
  revenue: number;
  churnRisk: ChurnRiskLevel;
  riskSignals: string[];
};

export type PlatformOperatingData = {
  summary: {
    mrr: number;
    arr: number;
    activeTenants: number;
    activeUsers: number;
    aiCost: number;
    grossMargin: number;
    totalTenants: number;
    totalUsers: number;
    betaConversionRate: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    arpu: number;
    arpt: number;
    growthPercent: number;
    forecast30: number;
    forecast90: number;
    forecast180: number;
    forecast365: number;
    planDistribution: { plan: string; tenants: number; revenue: number }[];
  };
  ai: {
    calls: number;
    cost: number;
    revenue: number;
    margin: number;
    costPerTenant: number;
    costPerUser: number;
    mostExpensiveTenant: string;
    mostEfficientTenant: string;
  };
  tenants: TenantHealthRecord[];
  growth: {
    today: GrowthWindow;
    sevenDays: GrowthWindow;
    thirtyDays: GrowthWindow;
    ninetyDays: GrowthWindow;
  };
  funnels: {
    bestFunnel: string;
    worstFunnel: string;
    rows: Array<{ type: string; leads: number; appointments: number; customers: number; members: number; revenue: number; conversion: number }>;
  };
  beta: {
    invited: number;
    activated: number;
    contentCompleted: number;
    funnelsPublished: number;
    firstLead: number;
    firstCustomer: number;
    firstMember: number;
  };
  alerts: Array<{ title: string; description: string; priority: FounderAlertPriority; href: string }>;
  briefing: string[];
};

type GrowthWindow = {
  label: string;
  newUsers: number;
  newTenants: number;
  activationPercent: number;
  contentPercent: number;
  leadPercent: number;
  customerPercent: number;
  memberPercent: number;
};

function rm(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0) * USD_TO_RM;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS);
}

function planRevenue(plan: string) {
  return PLAN_MRR_RM[plan] ?? PLAN_MRR_RM.starter;
}

function riskLevel(score: number, signals: string[]): ChurnRiskLevel {
  if (score < 35 || signals.length >= 4) return 'Critical';
  if (score < 55 || signals.length >= 3) return 'High';
  if (score < 75 || signals.length >= 1) return 'Medium';
  return 'Low';
}

function classifyFunnel(title: string) {
  const value = title.toLowerCase();
  if (value.includes('recruit') || value.includes('member') || value.includes('team')) return 'Recruitment Funnel';
  if (value.includes('upgrade') || value.includes('upsell')) return 'Upgrade Funnel';
  return 'Retail Funnel';
}

class PlatformOperatingService {
  async getOperatingData(): Promise<PlatformOperatingData> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = monthStart;
    const weekAgo = daysAgo(7);
    const fourteenDaysAgo = daysAgo(14);

    const [
      tenants,
      users,
      funnels,
      leadGroups,
      customers,
      contents,
      aiUsage,
      aiUsagePrevious,
      aiByTenant,
      inviteCount,
    ] = await Promise.all([
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

    const tenantMap = new Map(tenants.map((tenant) => [tenant.id, tenant]));
    const usersByTenant = new Map<string, typeof users>();
    const funnelsByTenant = new Map<string, typeof funnels>();
    const contentsByTenant = new Map<string, typeof contents>();
    const customersByTenant = new Map<string, typeof customers>();
    const leadsByTenant = new Map<string, number>();
    const appointmentsByTenant = new Map<string, number>();

    for (const user of users) usersByTenant.set(user.tenantId, [...(usersByTenant.get(user.tenantId) ?? []), user]);
    for (const funnel of funnels) funnelsByTenant.set(funnel.tenantId, [...(funnelsByTenant.get(funnel.tenantId) ?? []), funnel]);
    for (const content of contents) contentsByTenant.set(content.tenantId, [...(contentsByTenant.get(content.tenantId) ?? []), content]);
    for (const customer of customers) customersByTenant.set(customer.tenantId, [...(customersByTenant.get(customer.tenantId) ?? []), customer]);
    for (const row of leadGroups) {
      leadsByTenant.set(row.tenantId, (leadsByTenant.get(row.tenantId) ?? 0) + row._count._all);
      const stage = row.pipelineStage.toLowerCase();
      if (stage.includes('appointment') || stage.includes('booking') || stage.includes('demo')) {
        appointmentsByTenant.set(row.tenantId, (appointmentsByTenant.get(row.tenantId) ?? 0) + row._count._all);
      }
    }

    const aiCost = rm(aiUsage._sum.costUsd);
    const previousAiCost = rm(aiUsagePrevious._sum.costUsd);
    const mrr = tenants.reduce((sum, tenant) => sum + (tenant.status === 'active' ? planRevenue(tenant.plan) : 0), 0);
    const previousMrr = Math.max(0, mrr - planRevenue('growth') * Math.max(0, tenants.filter((tenant) => tenant.createdAt >= monthStart).length));
    const activeUsers = users.filter((user) => (user.userProgress?.lastActivityAt ?? user.updatedAt) >= weekAgo).length;
    const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
    const grossMargin = mrr > 0 ? clamp(((mrr - aiCost) / mrr) * 100) : 0;

    const aiTenantMap = new Map(aiByTenant.map((row) => [row.tenantId, { calls: row._count._all, cost: rm(row._sum.costUsd) }]));
    const tenantHealth = tenants.map((tenant) => {
      const tenantUsers = usersByTenant.get(tenant.id) ?? [];
      const tenantFunnels = funnelsByTenant.get(tenant.id) ?? [];
      const tenantContents = contentsByTenant.get(tenant.id) ?? [];
      const tenantCustomers = customersByTenant.get(tenant.id) ?? [];
      const tenantLeads = leadsByTenant.get(tenant.id) ?? 0;
      const recentUsers = tenantUsers.filter((user) => (user.userProgress?.lastActivityAt ?? user.updatedAt) >= fourteenDaysAgo).length;
      const recentContent = tenantContents.filter((content) => content.createdAt >= fourteenDaysAgo).length;
      const funnelViews = tenantFunnels.reduce((sum, funnel) => sum + funnel.views, 0);
      const signals: string[] = [];
      if (tenantUsers.length > 0 && recentUsers === 0) signals.push('No login 14 days');
      if (recentContent === 0) signals.push('No content 14 days');
      if (tenantFunnels.length > 0 && funnelViews === 0) signals.push('No funnel activity');
      if ((aiTenantMap.get(tenant.id)?.calls ?? 0) === 0) signals.push('Declining AI usage');
      const healthScore = clamp(
        (tenant.status === 'active' ? 20 : 0) +
          (tenantUsers.length ? Math.min(25, (recentUsers / tenantUsers.length) * 25) : 8) +
          (tenantLeads > 0 ? 18 : 4) +
          (tenantFunnels.length > 0 && funnelViews > 0 ? 17 : 5) +
          (recentContent > 0 ? 12 : 2) +
          (tenantCustomers.length > 0 ? 8 : 2),
      );
      return {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        users: tenantUsers.length,
        funnels: tenantFunnels.length,
        leads: tenantLeads,
        activity: recentUsers + recentContent + (aiTenantMap.get(tenant.id)?.calls ?? 0),
        healthScore,
        revenue: tenant.status === 'active' ? planRevenue(tenant.plan) : 0,
        churnRisk: riskLevel(healthScore, signals),
        riskSignals: signals,
      };
    }).sort((a, b) => a.healthScore - b.healthScore);

    const alertCandidates = [
      ...tenantHealth
        .filter((tenant) => tenant.churnRisk === 'Critical' || tenant.churnRisk === 'High')
        .slice(0, 5)
        .map((tenant) => ({
          title: `${tenant.name} churn risk`,
          description: `${tenant.healthScore}/100 health · ${tenant.riskSignals.join(', ') || 'low activity'}`,
          priority: tenant.churnRisk === 'Critical' ? 'Critical' as const : 'High' as const,
          href: '/platform-admin/tenant-health',
        })),
      ...(grossMargin > 0 && grossMargin < 60 ? [{ title: 'AI cost spike', description: `Gross margin is ${grossMargin}%`, priority: 'High' as const, href: '/platform-admin/ai-profitability' }] : []),
      ...(mrr < previousMrr ? [{ title: 'Revenue drop', description: 'MRR is lower than previous period estimate.', priority: 'Critical' as const, href: '/platform-admin/revenue' }] : []),
      ...(activeTenants < tenants.length ? [{ title: 'Inactive tenant', description: `${tenants.length - activeTenants} tenants are not active.`, priority: 'Medium' as const, href: '/platform-admin/tenant-health' }] : []),
    ];

    const growthWindow = (label: string, days: number): GrowthWindow => {
      const since = daysAgo(days);
      const newUsers = users.filter((user) => user.createdAt >= since).length;
      const newTenants = tenants.filter((tenant) => tenant.createdAt >= since).length;
      const activated = users.filter((user) => user.createdAt >= since && user.status === 'active').length;
      const contentUsers = new Set(contents.filter((content) => content.createdAt >= since).map((content) => content.ownerId)).size;
      const leadTenants = new Set(leadGroups.filter((row) => row._count._all > 0).map((row) => row.tenantId)).size;
      const customerTenants = new Set(customers.filter((customer) => customer.createdAt >= since).map((customer) => customer.tenantId)).size;
      return {
        label,
        newUsers,
        newTenants,
        activationPercent: newUsers ? clamp((activated / newUsers) * 100) : 0,
        contentPercent: newUsers ? clamp((contentUsers / newUsers) * 100) : 0,
        leadPercent: tenants.length ? clamp((leadTenants / tenants.length) * 100) : 0,
        customerPercent: tenants.length ? clamp((customerTenants / tenants.length) * 100) : 0,
        memberPercent: newUsers ? clamp((users.filter((user) => user.sponsorId && user.createdAt >= since).length / newUsers) * 100) : 0,
      };
    };

    const funnelBuckets = new Map<string, { leads: number; appointments: number; customers: number; members: number; revenue: number; conversion: number }>();
    for (const type of ['Retail Funnel', 'Recruitment Funnel', 'Upgrade Funnel']) {
      funnelBuckets.set(type, { leads: 0, appointments: 0, customers: 0, members: 0, revenue: 0, conversion: 0 });
    }
    for (const funnel of funnels) {
      const bucket = funnelBuckets.get(classifyFunnel(funnel.title));
      if (!bucket) continue;
      bucket.leads += funnel.conversions;
      bucket.conversion += funnel.views > 0 ? funnel.conversions / funnel.views : 0;
    }
    for (const tenant of tenants) {
      const bucket = funnelBuckets.get('Retail Funnel');
      if (!bucket) continue;
      bucket.customers += customersByTenant.get(tenant.id)?.length ?? 0;
      bucket.appointments += appointmentsByTenant.get(tenant.id) ?? 0;
      bucket.members += (usersByTenant.get(tenant.id) ?? []).filter((user) => user.sponsorId).length;
      bucket.revenue += tenant.status === 'active' ? planRevenue(tenant.plan) : 0;
    }
    const funnelRows = Array.from(funnelBuckets.entries()).map(([type, value]) => ({
      type,
      ...value,
      conversion: value.leads > 0 ? clamp((value.customers / value.leads) * 100) : 0,
    }));
    const bestFunnel = [...funnelRows].sort((a, b) => b.conversion - a.conversion)[0]?.type ?? 'None';
    const worstFunnel = [...funnelRows].sort((a, b) => a.conversion - b.conversion)[0]?.type ?? 'None';

    const contentCompleted = new Set(contents.map((content) => content.ownerId)).size;
    const funnelsPublished = funnels.filter((funnel) => funnel.status === 'published' || funnel.publishedAt).length;
    const firstLead = new Set(leadGroups.map((row) => row.tenantId)).size;
    const firstCustomer = new Set(customers.map((customer) => customer.tenantId)).size;
    const firstMember = new Set(users.filter((user) => user.sponsorId).map((user) => user.tenantId)).size;
    const activated = users.filter((user) => user.status === 'active').length;

    const mostExpensive = [...aiTenantMap.entries()].sort((a, b) => b[1].cost - a[1].cost)[0];
    const efficient = tenantHealth
      .filter((tenant) => (aiTenantMap.get(tenant.id)?.cost ?? 0) > 0)
      .sort((a, b) => (b.leads + b.users) / (aiTenantMap.get(b.id)?.cost ?? 1) - (a.leads + a.users) / (aiTenantMap.get(a.id)?.cost ?? 1))[0];

    const aiRevenue = mrr;
    const aiMargin = aiRevenue > 0 ? clamp(((aiRevenue - aiCost) / aiRevenue) * 100) : 0;
    const growthPercent = previousMrr > 0 ? Math.round(((mrr - previousMrr) / previousMrr) * 1000) / 10 : 0;
    const betaConversionRate = inviteCount > 0 ? clamp((activated / inviteCount) * 100) : 0;

    return {
      summary: {
        mrr,
        arr: mrr * 12,
        activeTenants,
        activeUsers,
        aiCost,
        grossMargin,
        totalTenants: tenants.length,
        totalUsers: users.length,
        betaConversionRate,
      },
      revenue: {
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
          tenants.reduce<Record<string, number>>((acc, tenant) => {
            acc[tenant.plan] = (acc[tenant.plan] ?? 0) + 1;
            return acc;
          }, {}),
        ).map(([plan, count]) => ({ plan, tenants: count, revenue: count * planRevenue(plan) })),
      },
      ai: {
        calls: aiUsage._count._all,
        cost: aiCost,
        revenue: aiRevenue,
        margin: aiMargin,
        costPerTenant: activeTenants ? Math.round(aiCost / activeTenants) : 0,
        costPerUser: users.length ? Math.round(aiCost / users.length) : 0,
        mostExpensiveTenant: mostExpensive ? tenantMap.get(mostExpensive[0])?.name ?? 'Unknown' : 'None',
        mostEfficientTenant: efficient?.name ?? 'None',
      },
      tenants: tenantHealth,
      growth: {
        today: growthWindow('Today', 1),
        sevenDays: growthWindow('7 Days', 7),
        thirtyDays: growthWindow('30 Days', 30),
        ninetyDays: growthWindow('90 Days', 90),
      },
      funnels: { bestFunnel, worstFunnel, rows: funnelRows },
      beta: {
        invited: inviteCount,
        activated,
        contentCompleted,
        funnelsPublished,
        firstLead,
        firstCustomer,
        firstMember,
      },
      alerts: alertCandidates.length > 0 ? alertCandidates : [{ title: 'Platform stable', description: 'No critical founder alerts detected.', priority: 'Low', href: '/platform-admin' }],
      briefing: [
        `MRR is RM${mrr.toLocaleString()} with ${activeTenants} active tenants.`,
        `${tenantHealth.filter((tenant) => tenant.churnRisk === 'High' || tenant.churnRisk === 'Critical').length} tenants are at churn risk.`,
        `${bestFunnel} is currently the best performing funnel.`,
        `AI margin is ${aiMargin}% with RM${Math.round(aiCost).toLocaleString()} estimated monthly AI cost.`,
      ],
    };
  }
}

export const platformOperatingService = new PlatformOperatingService();
