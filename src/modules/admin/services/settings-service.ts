import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AdminSettingsResponse, TenantUsageStats } from '../types';

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings) ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject) : {};
}

function startOfMonth(date: Date) { const next = new Date(date); next.setHours(0,0,0,0); next.setDate(1); return next; }

function byteSize(value: unknown) { return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8'); }

async function estimateStorageMb(tenantId: string) {
  const [contents, funnels, promptTemplates, messages, voiceProfiles, events] = await Promise.all([
    prisma.content.findMany({ where: { tenantId }, select: { title: true, body: true, promptUsed: true, status: true } }),
    prisma.funnel.findMany({ where: { tenantId }, select: { title: true, config: true, status: true } }),
    prisma.aIPromptTemplate.findMany({ where: { tenantId }, select: { name: true, prompt: true, systemPrompt: true, userPromptTemplate: true } }),
    prisma.scheduledMessage.findMany({ where: { tenantId }, select: { message: true, status: true } }),
    prisma.voiceProfile.findMany({ where: { tenantId }, select: { transcript: true, extractedData: true, status: true } }),
    prisma.analyticsEvent.findMany({ where: { tenantId }, select: { eventName: true, properties: true } }),
  ]);
  const totalBytes = [contents, funnels, promptTemplates, messages, voiceProfiles, events].reduce((sum, rows) => sum + rows.reduce((s, r) => s + byteSize(r), 0), 0);
  return Math.round((totalBytes / 1_048_576) * 10) / 10;
}

async function getRoleCounts(tenantId: string) {
  const [operator, leader, member, platformAdmin] = await Promise.all([
    prisma.user.count({ where: { tenantId, deletedAt: null, role: 'operator' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null, role: 'leader' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null, role: 'member' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null, role: 'platform_admin' } }),
  ]);
  return { operator, leader, member, platform_admin: platformAdmin };
}

async function getStatusCounts(tenantId: string) {
  const [active, pending, suspended, total] = await Promise.all([
    prisma.user.count({ where: { tenantId, deletedAt: null, status: 'active' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null, status: 'pending' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null, status: 'suspended' } }),
    prisma.user.count({ where: { tenantId, deletedAt: null } }),
  ]);
  return { active, pending, suspended, total };
}

async function getCurrentMonthlyAiCalls(tenantId: string) {
  const since = startOfMonth(new Date());
  return prisma.aIUsageLog.count({ where: { tenantId, createdAt: { gte: since } } });
}

async function getTenantBase(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true, settings: true } });
  if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  return tenant;
}

async function getTenantUsageStats(tenantId: string): Promise<TenantUsageStats> {
  const [users, byRole, aiCallsThisMonth, storageUsedMb] = await Promise.all([getStatusCounts(tenantId), getRoleCounts(tenantId), getCurrentMonthlyAiCalls(tenantId), estimateStorageMb(tenantId)]);
  return { users, byRole, limits: { max_members: 0, max_ai_calls: 0, max_storage_mb: 0 }, usage: { current_members: users.total, ai_calls_this_month: aiCallsThisMonth, storage_used_mb: storageUsedMb } };
}

async function logAudit(tenantId: string, actorId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { tenantId, actorId, action, targetType, targetId, metadata: metadata as Prisma.InputJsonValue } });
}

export async function getTenantStats(tenantId: string): Promise<TenantUsageStats> {
  const tenant = await getTenantBase(tenantId);
  const stats = await getTenantUsageStats(tenantId);
  return { ...stats, limits: { max_members: tenant.maxMembers, max_ai_calls: tenant.maxAiCalls, max_storage_mb: (() => { const s = normalizeSettings(tenant.settings); return typeof s.max_storage_mb === 'number' ? (s.max_storage_mb as number) : 500; })() } };
}

export async function getTenantSettings(tenantId: string): Promise<AdminSettingsResponse['data']> {
  const [tenant, stats] = await Promise.all([getTenantBase(tenantId), getTenantStats(tenantId)]);
  return {
    tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, plan: tenant.plan, maxMembers: tenant.maxMembers, maxAiCalls: tenant.maxAiCalls, status: tenant.status, settings: normalizeSettings(tenant.settings) as Record<string, unknown> },
    stats,
  };
}

export async function updateTenantSettings(actorId: string, tenantId: string, data: { name?: string; logo_url?: string; settings?: Record<string, unknown> }) {
  const actor = await prisma.user.findFirst({ where: { id: actorId, tenantId, deletedAt: null }, select: { id: true, name: true, role: true } });
  if (!actor) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
  if (!['operator', 'platform_admin'].includes(actor.role)) throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');

  const tenant = await getTenantBase(tenantId);
  const settings = normalizeSettings(tenant.settings);
  const nextSettings = { ...settings, ...(data.settings ?? {}), ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}) };

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { ...(data.name !== undefined ? { name: data.name } : {}), settings: nextSettings as Prisma.InputJsonValue, updatedAt: new Date() },
    select: { id: true, name: true, slug: true, plan: true, maxMembers: true, maxAiCalls: true, status: true, settings: true },
  });

  await logAudit(tenantId, actor.id, `Tenant settings updated by ${actor.name}`, 'tenant', tenantId, { actor: { id: actor.id, name: actor.name, role: actor.role }, from: { name: tenant.name, settings: tenant.settings }, to: { name: updated.name, settings: updated.settings } });

  return { tenant: { id: updated.id, name: updated.name, slug: updated.slug, plan: updated.plan, maxMembers: updated.maxMembers, maxAiCalls: updated.maxAiCalls, status: updated.status, settings: normalizeSettings(updated.settings) as Record<string, unknown> }, stats: await getTenantStats(tenantId) };
}
