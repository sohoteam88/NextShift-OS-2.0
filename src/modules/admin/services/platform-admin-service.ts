import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { tenantService } from '@/modules/tenant/services/tenant-service';
import type {
  AdminUserRecord,
  PlatformAICostBreakdown,
  PlatformStats,
  PlatformTenantDetail,
  PlatformTenantOverview,
} from '../types';
import type { PlanTier } from '@/modules/tenant/constants/plans';

type TenantListQuery = {
  search?: string;
  plan?: string;
  status?: string;
  page?: number;
  limit?: number;
};

type TenantCreateInput = {
  name: string;
  slug: string;
  plan: PlanTier;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
};

type TenantUpdateInput = {
  name?: string;
  slug?: string;
  plan?: PlanTier;
  status?: string;
  maxMembers?: number;
  maxAiCalls?: number;
};

function startOfMonth(date = new Date()) {
  const value = new Date(date);
  value.setDate(1);
  value.setHours(0, 0, 0, 0);
  return value;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0);
}

function toUserRecord(user: {
  id: string;
  tenantId?: string;
  tenant?: {
    name: string;
    slug: string;
  } | null;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  avatarUrl: string | null;
  languagePreference: string;
  createdAt: Date;
  updatedAt: Date;
}): AdminUserRecord {
  return {
    id: user.id,
    tenantId: user.tenantId ?? '',
    tenantName: user.tenant?.name,
    tenantSlug: user.tenant?.slug,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as AdminUserRecord['role'],
    status: user.status as AdminUserRecord['status'],
    avatarUrl: user.avatarUrl,
    languagePreference: user.languagePreference,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

async function estimateStorageMb(tenantId: string) {
  const [contents, funnels, promptTemplates, messages, voiceProfiles, events] = await Promise.all([
    prisma.content.findMany({
      where: { tenantId },
      select: { title: true, body: true, promptUsed: true, status: true },
    }),
    prisma.funnel.findMany({
      where: { tenantId },
      select: { title: true, config: true, status: true },
    }),
    prisma.aIPromptTemplate.findMany({
      where: { tenantId },
      select: { name: true, prompt: true, systemPrompt: true, userPromptTemplate: true },
    }),
    prisma.scheduledMessage.findMany({
      where: { tenantId },
      select: { message: true, status: true },
    }),
    prisma.voiceProfile.findMany({
      where: { tenantId },
      select: { transcript: true, extractedData: true, status: true },
    }),
    prisma.analyticsEvent.findMany({
      where: { tenantId },
      select: { eventName: true, properties: true },
    }),
  ]);

  const byteSize = (value: unknown) => Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
  const totalBytes =
    contents.reduce((sum, row) => sum + byteSize(row), 0) +
    funnels.reduce((sum, row) => sum + byteSize(row), 0) +
    promptTemplates.reduce((sum, row) => sum + byteSize(row), 0) +
    messages.reduce((sum, row) => sum + byteSize(row), 0) +
    voiceProfiles.reduce((sum, row) => sum + byteSize(row), 0) +
    events.reduce((sum, row) => sum + byteSize(row), 0);

  return Math.round((totalBytes / 1_048_576) * 10) / 10;
}

async function loadAiUsageSummary(tenantId: string) {
  const monthStart = startOfMonth();
  const [summary, byFeature] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: { tenantId, createdAt: { gte: monthStart } },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ['feature'],
      where: { tenantId, createdAt: { gte: monthStart } },
      _count: { _all: true },
      _sum: { costUsd: true },
    }),
  ]);

  return {
    callsThisMonth: summary._count._all,
    costThisMonth: decimalToNumber(summary._sum.costUsd),
    byFeature: Object.fromEntries(
      byFeature.map((row) => [
        row.feature,
        {
          calls: row._count._all,
          cost: decimalToNumber(row._sum.costUsd),
        },
      ]),
    ),
  };
}

async function loadTenantOverview(tenant: {
  id: string;
  name: string;
  slug: string;
  plan: string;
  maxMembers: number;
  maxAiCalls: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}) {
  const [usage, aiUsage] = await Promise.all([
    tenantService.getUsage(tenant.id),
    loadAiUsageSummary(tenant.id),
  ]);

  const overview: PlatformTenantOverview = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    status: tenant.status,
    maxMembers: tenant.maxMembers,
    maxAiCalls: tenant.maxAiCalls,
    createdAt: tenant.createdAt.toISOString(),
    updatedAt: tenant.updatedAt.toISOString(),
    usage,
    aiCallsThisMonth: aiUsage.callsThisMonth,
    aiCostThisMonth: aiUsage.costThisMonth,
  };

  return overview;
}

export const platformAdminService = {
  async listTenants(query: TenantListQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 10));
    const where: Prisma.TenantWhereInput = {
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(query.plan ? { plan: query.plan } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          maxMembers: true,
          maxAiCalls: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    const data = await Promise.all(tenants.map(loadTenantOverview));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async getTenantDetail(tenantId: string): Promise<PlatformTenantDetail> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        maxMembers: true,
        maxAiCalls: true,
        status: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!tenant) {
      throw new AppError('NOT_FOUND', 404, 'Tenant not found');
    }

    const [usage, ai, users, leads, funnels, storageUsedMb] = await Promise.all([
      tenantService.getUsage(tenantId),
      loadAiUsageSummary(tenantId),
      prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        orderBy: [{ createdAt: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          languagePreference: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.lead.groupBy({
        by: ['pipelineStage'],
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
      }),
      prisma.funnel.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          views: true,
          conversions: true,
          createdAt: true,
        },
      }),
      estimateStorageMb(tenantId),
    ]);

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        status: tenant.status,
        maxMembers: tenant.maxMembers,
        maxAiCalls: tenant.maxAiCalls,
        settings: tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
          ? ({ ...(tenant.settings as Prisma.JsonObject) } as Record<string, unknown>)
          : {},
        createdAt: tenant.createdAt.toISOString(),
        updatedAt: tenant.updatedAt.toISOString(),
      },
      usage,
      ai,
      users: users.map(toUserRecord),
      leads: {
        total: leads.reduce((sum, row) => sum + row._count._all, 0),
        byStage: leads.map((row) => ({
          stage: row.pipelineStage,
          count: row._count._all,
        })),
      },
      funnels: funnels.map((funnel) => ({
        ...funnel,
        createdAt: funnel.createdAt.toISOString(),
      })),
      storageUsedMb,
    };
  },

  async getPlatformStats(): Promise<PlatformStats> {
    const [totalTenants, activeTenants, totalUsers, totalLeads, totalFunnels, aiUsage, planGroups] =
      await Promise.all([
        prisma.tenant.count(),
        prisma.tenant.count({ where: { status: 'active' } }),
        prisma.user.count({ where: { deletedAt: null } }),
        prisma.lead.count({ where: { deletedAt: null } }),
        prisma.funnel.count(),
        prisma.aIUsageLog.aggregate({
          where: { createdAt: { gte: startOfMonth() } },
          _count: { _all: true },
          _sum: { costUsd: true },
        }),
        prisma.tenant.groupBy({
          by: ['plan'],
          _count: { _all: true },
        }),
      ]);

    const tenantsByPlan = {
      starter: 0,
      growth: 0,
      pro: 0,
    };

    for (const row of planGroups) {
      if (row.plan in tenantsByPlan) {
        tenantsByPlan[row.plan as keyof typeof tenantsByPlan] = row._count._all;
      }
    }

    return {
      total_tenants: totalTenants,
      active_tenants: activeTenants,
      total_users: totalUsers,
      total_leads: totalLeads,
      total_funnels: totalFunnels,
      ai_cost_this_month: decimalToNumber(aiUsage._sum.costUsd),
      ai_calls_this_month: aiUsage._count._all,
      tenants_by_plan: tenantsByPlan,
    };
  },

  async getAICostBreakdown(): Promise<PlatformAICostBreakdown[]> {
    const monthStart = startOfMonth();
    const [tenants, usageGroups] = await Promise.all([
      prisma.tenant.findMany({
        select: { id: true, name: true, slug: true, plan: true },
        orderBy: { name: 'asc' },
      }),
      prisma.aIUsageLog.groupBy({
        by: ['tenantId'],
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { costUsd: true },
      }),
    ]);

    const usageMap = new Map(
      usageGroups.map((row) => [
        row.tenantId,
        {
          calls: row._count._all,
          cost: decimalToNumber(row._sum.costUsd),
        },
      ]),
    );

    return tenants
      .map((tenant) => {
        const usage = usageMap.get(tenant.id) ?? { calls: 0, cost: 0 };
        return {
          tenantId: tenant.id,
          tenantName: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          callsThisMonth: usage.calls,
          costThisMonth: usage.cost,
        };
      })
      .sort((a, b) => b.costThisMonth - a.costThisMonth || b.callsThisMonth - a.callsThisMonth || a.tenantName.localeCompare(b.tenantName));
  },

  async getAIModelBreakdown() {
    const monthStart = startOfMonth();
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const [summary, byModel, byFeature, recentLogs] = await Promise.all([
      prisma.aIUsageLog.aggregate({
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      }),
      prisma.aIUsageLog.groupBy({
        by: ['model', 'provider'],
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
        orderBy: [{ _sum: { costUsd: 'desc' } }],
      }),
      prisma.aIUsageLog.groupBy({
        by: ['feature', 'category'],
        where: { createdAt: { gte: monthStart } },
        _count: { _all: true },
        _sum: { costUsd: true },
        orderBy: [{ _sum: { costUsd: 'desc' } }],
      }),
      prisma.aIUsageLog.findMany({
        where: { createdAt: { gte: fourteenDaysAgo } },
        select: { createdAt: true, costUsd: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const dailyMap = new Map<string, { cost: number; calls: number }>();
    for (const log of recentLogs) {
      const day = log.createdAt.toISOString().slice(0, 10);
      const prev = dailyMap.get(day) ?? { cost: 0, calls: 0 };
      dailyMap.set(day, { cost: prev.cost + decimalToNumber(log.costUsd), calls: prev.calls + 1 });
    }

    const daily: { date: string; cost: number; calls: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = d.toISOString().slice(0, 10);
      daily.push({ date: day, ...(dailyMap.get(day) ?? { cost: 0, calls: 0 }) });
    }

    const totalCost = decimalToNumber(summary._sum.costUsd);
    const totalCalls = summary._count._all;

    return {
      totalCostThisMonth: totalCost,
      totalCallsThisMonth: totalCalls,
      totalTokensIn: summary._sum.tokensIn ?? 0,
      totalTokensOut: summary._sum.tokensOut ?? 0,
      avgCostPerCall: totalCalls > 0 ? totalCost / totalCalls : 0,
      byModel: byModel.map((row) => ({
        model: row.model,
        provider: row.provider,
        calls: row._count._all,
        costUsd: decimalToNumber(row._sum.costUsd),
        tokensIn: row._sum.tokensIn ?? 0,
        tokensOut: row._sum.tokensOut ?? 0,
      })),
      byFeature: byFeature.map((row) => ({
        feature: row.feature,
        category: row.category,
        calls: row._count._all,
        costUsd: decimalToNumber(row._sum.costUsd),
      })),
      daily,
    };
  },

  async suspendTenant(tenantId: string) {
    return tenantService.suspend(tenantId);
  },

  async upgradeTenant(tenantId: string, plan: PlanTier) {
    return tenantService.upgradePlan(tenantId, plan);
  },

  async createTenant(input: TenantCreateInput) {
    return tenantService.create(input);
  },

  async updateTenant(tenantId: string, data: TenantUpdateInput) {
    if (data.plan) {
      await tenantService.upgradePlan(tenantId, data.plan);
    }

    return prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.maxMembers !== undefined ? { maxMembers: data.maxMembers } : {}),
        ...(data.maxAiCalls !== undefined ? { maxAiCalls: data.maxAiCalls } : {}),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        plan: true,
        maxMembers: true,
        maxAiCalls: true,
        status: true,
      },
    });
  },
};
