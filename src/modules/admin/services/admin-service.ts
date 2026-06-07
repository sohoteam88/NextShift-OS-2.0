import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type {
  AdminSettingsResponse,
  AdminUserRecord,
  AdminUserRole,
  AdminUserStatus,
  AdminUsersResponse,
  TenantUsageStats,
} from '../types';

const VALID_ROLES: AdminUserRole[] = ['member', 'leader', 'operator', 'platform_admin'];
const VALID_STATUSES: AdminUserStatus[] = ['active', 'pending', 'suspended'];

function normalizeSettings(settings: unknown): Prisma.JsonObject {
  return settings && typeof settings === 'object' && !Array.isArray(settings)
    ? ({ ...(settings as Prisma.JsonObject) } as Prisma.JsonObject)
    : {};
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfMonth(date: Date) {
  const next = startOfDay(date);
  next.setDate(1);
  return next;
}

function toUserRecord(user: {
  id: string;
  tenantId: string;
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
    tenantId: user.tenantId,
    tenantName: user.tenant?.name,
    tenantSlug: user.tenant?.slug,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role as AdminUserRole,
    status: user.status as AdminUserStatus,
    avatarUrl: user.avatarUrl,
    languagePreference: user.languagePreference,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

function byteSize(value: unknown) {
  return Buffer.byteLength(JSON.stringify(value ?? null), 'utf8');
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

  const totalBytes =
    contents.reduce((sum, row) => sum + byteSize(row), 0) +
    funnels.reduce((sum, row) => sum + byteSize(row), 0) +
    promptTemplates.reduce((sum, row) => sum + byteSize(row), 0) +
    messages.reduce((sum, row) => sum + byteSize(row), 0) +
    voiceProfiles.reduce((sum, row) => sum + byteSize(row), 0) +
    events.reduce((sum, row) => sum + byteSize(row), 0);

  return Math.round((totalBytes / 1_048_576) * 10) / 10;
}

async function logAudit(
  tenantId: string,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      tenantId,
      actorId,
      action,
      targetType,
      targetId,
      metadata: metadata as Prisma.InputJsonValue,
    },
  });
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
  return prisma.aIUsageLog.count({
    where: {
      tenantId,
      createdAt: { gte: since },
    },
  });
}

async function getTenantBase(tenantId: string) {
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
    },
  });

  if (!tenant) {
    throw new AppError('NOT_FOUND', 404, 'Tenant not found');
  }

  return tenant;
}

async function getTenantUsageStats(tenantId: string): Promise<TenantUsageStats> {
  const [users, byRole, aiCallsThisMonth, storageUsedMb] = await Promise.all([
    getStatusCounts(tenantId),
    getRoleCounts(tenantId),
    getCurrentMonthlyAiCalls(tenantId),
    estimateStorageMb(tenantId),
  ]);

  const currentMembers = users.total;

  return {
    users,
    byRole,
    limits: {
      max_members: 0,
      max_ai_calls: 0,
      max_storage_mb: 0,
    },
    usage: {
      current_members: currentMembers,
      ai_calls_this_month: aiCallsThisMonth,
      storage_used_mb: storageUsedMb,
    },
  };
}

export const adminService = {
  async listUsers(
    tenantId: string,
    query: { search?: string; role?: string; status?: string; page?: number; limit?: number },
    options: { includeAllTenants?: boolean } = {},
  ): Promise<AdminUsersResponse> {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(Math.max(1, query.limit ?? 10), 50);
    const where: Prisma.UserWhereInput = {
      ...(options.includeAllTenants ? {} : { tenantId }),
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          tenantId: true,
          tenant: {
            select: {
              name: true,
              slug: true,
            },
          },
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
    ]);

    return {
      data: users.map(toUserRecord),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  },

  async updateUser(
    operatorId: string,
    tenantId: string,
    userId: string,
    data: { role?: string; status?: string },
  ) {
    const actor = await prisma.user.findFirst({
      where: { id: operatorId, tenantId, deletedAt: null },
      select: { id: true, name: true, role: true },
    });
    if (!actor) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }

    const target = await prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        role: true,
        status: true,
      },
    });
    if (!target) {
      throw new AppError('NOT_FOUND', 404, 'User not found');
    }

    const nextRole = data.role ?? target.role;
    const nextStatus = data.status ?? target.status;

    if (data.role !== undefined && !VALID_ROLES.includes(data.role as AdminUserRole)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid role');
    }
    if (data.status !== undefined && !VALID_STATUSES.includes(data.status as AdminUserStatus)) {
      throw new AppError('VALIDATION_ERROR', 400, 'Invalid status');
    }

    if (data.role === 'operator' && actor.role !== 'platform_admin') {
      throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign operator roles');
    }
    if (data.role === 'platform_admin' && actor.role !== 'platform_admin') {
      throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign platform admin roles');
    }

    if (operatorId === userId && data.role !== undefined && data.role !== target.role) {
      throw new AppError('FORBIDDEN', 403, 'You cannot change your own role');
    }

    if (target.role === 'platform_admin' && actor.role !== 'platform_admin') {
      throw new AppError('FORBIDDEN', 403, 'Only platform admins can manage platform admin users');
    }

    if (target.role === 'operator' && actor.role !== 'platform_admin' && data.role !== undefined && data.role !== 'operator') {
      throw new AppError('FORBIDDEN', 403, 'Only platform admins can change operator roles');
    }

    const operatorCount = await prisma.user.count({
      where: { tenantId, deletedAt: null, role: 'operator' },
    });
    if (
      target.role === 'operator' &&
      data.role !== undefined &&
      data.role !== 'operator' &&
      operatorCount <= 1
    ) {
      throw new AppError('CONFLICT', 409, 'Cannot demote the last operator');
    }

    if (target.role === 'operator' && data.status === 'suspended' && operatorCount <= 1) {
      throw new AppError('CONFLICT', 409, 'Cannot suspend the last operator');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        tenantId: true,
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
    });

    const changeParts: string[] = [];
    if (data.role !== undefined && data.role !== target.role) {
      changeParts.push(`Role changed: ${target.role} → ${data.role}`);
    }
    if (data.status !== undefined && data.status !== target.status) {
      changeParts.push(`Status changed: ${target.status} → ${data.status}`);
    }

    if (changeParts.length > 0) {
      await logAudit(tenantId, actor.id, `${changeParts.join('; ')} by ${actor.name}`, 'user', userId, {
        actor: { id: actor.id, name: actor.name, role: actor.role },
        target: { id: target.id, name: target.name },
        from: { role: target.role, status: target.status },
        to: { role: nextRole, status: nextStatus },
      });
    }

    return toUserRecord(updated);
  },

  async getTenantStats(tenantId: string): Promise<TenantUsageStats> {
    const tenant = await getTenantBase(tenantId);
    const stats = await getTenantUsageStats(tenantId);

    return {
      ...stats,
      limits: {
        max_members: tenant.maxMembers,
        max_ai_calls: tenant.maxAiCalls,
        max_storage_mb: (() => {
          const settings = normalizeSettings(tenant.settings);
          return typeof settings.max_storage_mb === 'number' ? (settings.max_storage_mb as number) : 500;
        })(),
      },
    };
  },

  async getTenantSettings(tenantId: string): Promise<AdminSettingsResponse['data']> {
    const [tenant, stats] = await Promise.all([getTenantBase(tenantId), adminService.getTenantStats(tenantId)]);
    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        maxMembers: tenant.maxMembers,
        maxAiCalls: tenant.maxAiCalls,
        status: tenant.status,
        settings: normalizeSettings(tenant.settings) as Record<string, unknown>,
      },
      stats,
    };
  },

  async updateTenantSettings(
    actorId: string,
    tenantId: string,
    data: { name?: string; logo_url?: string; settings?: Record<string, unknown> },
  ) {
    const actor = await prisma.user.findFirst({
      where: { id: actorId, tenantId, deletedAt: null },
      select: { id: true, name: true, role: true },
    });
    if (!actor) {
      throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
    }
    if (!['operator', 'platform_admin'].includes(actor.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const tenant = await getTenantBase(tenantId);
    const settings = normalizeSettings(tenant.settings);
    const nextSettings = {
      ...settings,
      ...(data.settings ?? {}),
      ...(data.logo_url !== undefined ? { logo_url: data.logo_url } : {}),
    };

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        settings: nextSettings as Prisma.InputJsonValue,
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
        settings: true,
      },
    });

    await logAudit(tenantId, actor.id, `Tenant settings updated by ${actor.name}`, 'tenant', tenantId, {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      from: { name: tenant.name, settings: tenant.settings },
      to: { name: updated.name, settings: updated.settings },
    });

    return {
      tenant: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        plan: updated.plan,
        maxMembers: updated.maxMembers,
        maxAiCalls: updated.maxAiCalls,
        status: updated.status,
        settings: normalizeSettings(updated.settings) as Record<string, unknown>,
      },
      stats: await adminService.getTenantStats(tenantId),
    };
  },
};
