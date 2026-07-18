import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { tenantService } from '@/modules/tenant/services/tenant-service';
import type { PlatformTenantDetail, PlatformTenantOverview } from '../types';
import type { PlanTier } from '@/modules/tenant/constants/plans';
import { requirePlatformAdminDataAccess } from '@/lib/security/platform-data-authority';

type TenantListQuery = { search?: string; plan?: string; status?: string; page?: number; limit?: number };
type TenantCreateInput = { name: string; slug: string; plan: PlanTier; ownerId: string; ownerEmail: string; ownerName: string };
type TenantUpdateInput = { name?: string; slug?: string; plan?: PlanTier; status?: 'active' | 'suspended'; maxMembers?: number; maxAiCalls?: number };

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) { return Number(value ?? 0); }
function startOfMonth(date = new Date()) { const v = new Date(date); v.setDate(1); v.setHours(0,0,0,0); return v; }

async function loadAiUsageSummary(tenantId: string) {
  const monthStart = startOfMonth();
  const [summary, byFeature] = await Promise.all([
    prisma.aIUsageLog.aggregate({ where: { tenantId, createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true } }),
    prisma.aIUsageLog.groupBy({ by: ['feature'], where: { tenantId, createdAt: { gte: monthStart } }, _count: { _all: true }, _sum: { costUsd: true } }),
  ]);
  return {
    callsThisMonth: summary._count._all,
    costThisMonth: decimalToNumber(summary._sum.costUsd),
    byFeature: Object.fromEntries(byFeature.map(r => [r.feature, { calls: r._count._all, cost: decimalToNumber(r._sum.costUsd) }])),
  };
}

async function loadTenantOverview(tenant: { id: string; name: string; slug: string; plan: string; maxMembers: number; maxAiCalls: number; status: string; createdAt: Date; updatedAt: Date }) {
  const [usage, aiUsage] = await Promise.all([tenantService.getUsage(tenant.id), loadAiUsageSummary(tenant.id)]);
  return { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, status: tenant.status, maxMembers: tenant.maxMembers, maxAiCalls: tenant.maxAiCalls, createdAt: tenant.createdAt.toISOString(), updatedAt: tenant.updatedAt.toISOString(), usage, aiCallsThisMonth: aiUsage.callsThisMonth, aiCostThisMonth: aiUsage.costThisMonth } as PlatformTenantOverview;
}

export async function listTenants(query: TenantListQuery = {}) {
  await requirePlatformAdminDataAccess();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 10));
  const where: Prisma.TenantWhereInput = {
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}),
    ...(query.plan ? { plan: query.plan } : {}),
    ...(query.status ? { status: query.status } : {}),
  };
  const [total, tenants] = await Promise.all([
    prisma.tenant.count({ where }),
    prisma.tenant.findMany({ where, orderBy: [{ createdAt: 'desc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit, select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true, createdAt: true, updatedAt: true } }),
  ]);
  const data = await Promise.all(tenants.map(loadTenantOverview));
  return { data, meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function getTenantDetail(tenantId: string): Promise<PlatformTenantDetail> {
  await requirePlatformAdminDataAccess();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true, settings: true, createdAt: true, updatedAt: true } });
  if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  const [usage, ai, users, leads, funnels] = await Promise.all([
    tenantService.getUsage(tenantId), loadAiUsageSummary(tenantId),
    prisma.user.findMany({ where: { tenantId, deletedAt: null }, orderBy: [{ createdAt: 'asc' }, { name: 'asc' }], select: { id: true, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true, languagePreference: true, createdAt: true, updatedAt: true } }),
    prisma.lead.groupBy({ by: ['pipelineStage'], where: { tenantId, deletedAt: null }, _count: { _all: true } }),
    prisma.funnel.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, select: { id: true, title: true, status: true, views: true, conversions: true, createdAt: true } }),
  ]);
  return {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, status: tenant.status, maxMembers: tenant.maxMembers, maxAiCalls: tenant.maxAiCalls, settings: tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings) ? { ...(tenant.settings as Prisma.JsonObject) } as Record<string, unknown> : {}, createdAt: tenant.createdAt.toISOString(), updatedAt: tenant.updatedAt.toISOString() },
    usage, ai,
    users: users.map(u => ({ id: u.id, tenantId: '', tenantName: undefined, tenantSlug: undefined, name: u.name, email: u.email, phone: u.phone, role: u.role as any, status: u.status as any, avatarUrl: u.avatarUrl, languagePreference: u.languagePreference, createdAt: u.createdAt.toISOString(), updatedAt: u.updatedAt.toISOString() })),
    leads: { total: leads.reduce((s, r) => s + r._count._all, 0), byStage: leads.map(r => ({ stage: r.pipelineStage, count: r._count._all })) },
    funnels: funnels.map(f => ({ ...f, createdAt: f.createdAt.toISOString() })),
    storageUsedMb: 0,
  };
}

export async function suspendTenant(tenantId: string) { return tenantService.suspend(tenantId); }
export async function upgradeTenant(tenantId: string, plan: PlanTier) { return tenantService.upgradePlan(tenantId, plan); }
export async function createTenant(input: TenantCreateInput) { return tenantService.create(input); }

export async function updateTenant(tenantId: string, data: TenantUpdateInput) {
  const current = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!current) throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  if (current.status === 'deleted') throw new AppError('TENANT_DELETED_TERMINAL', 409, 'Deleted tenant is terminal');
  if (data.plan) await tenantService.upgradePlan(tenantId, data.plan);
  return prisma.tenant.update({ where: { id: tenantId }, data: { ...(data.name !== undefined ? { name: data.name } : {}), ...(data.slug !== undefined ? { slug: data.slug } : {}), ...(data.status !== undefined ? { status: data.status } : {}), ...(data.maxMembers !== undefined ? { maxMembers: data.maxMembers } : {}), ...(data.maxAiCalls !== undefined ? { maxAiCalls: data.maxAiCalls } : {}), updatedAt: new Date() }, select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true } });
}
