import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { createServiceRoleSupabaseClient, hasServiceRoleSupabaseCredentials } from '@/lib/supabase/server';
import type { AdminUserRecord, AdminUserRole, AdminUserStatus, AdminUsersResponse } from '../types';
import { requirePlatformAdminDataAccess } from '@/lib/security/platform-data-authority';

const VALID_ROLES: AdminUserRole[] = ['member', 'leader', 'operator', 'platform_admin'];
const VALID_STATUSES: AdminUserStatus[] = ['active', 'pending', 'suspended'];

function toUserRecord(user: {
  id: string; tenantId: string; tenant?: { name: string; slug: string } | null;
  name: string; email: string; phone: string | null; role: string; status: string;
  avatarUrl: string | null; languagePreference: string; createdAt: Date; updatedAt: Date;
}): AdminUserRecord {
  return {
    id: user.id, tenantId: user.tenantId, tenantName: user.tenant?.name, tenantSlug: user.tenant?.slug,
    name: user.name, email: user.email, phone: user.phone,
    role: user.role as AdminUserRole, status: user.status as AdminUserStatus,
    avatarUrl: user.avatarUrl, languagePreference: user.languagePreference,
    createdAt: user.createdAt.toISOString(), updatedAt: user.updatedAt.toISOString(),
  };
}

async function logAudit(tenantId: string, actorId: string, action: string, targetType: string, targetId: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({ data: { tenantId, actorId, action, targetType, targetId, metadata: metadata as Prisma.InputJsonValue } });
}

async function loadActor(operatorId: string) {
  const actor = await prisma.user.findFirst({
    where: { id: operatorId, deletedAt: null },
    select: { id: true, tenantId: true, name: true, role: true },
  });
  if (!actor) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');
  if (!['operator', 'platform_admin'].includes(actor.role)) {
    throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
  }
  return actor;
}

async function loadTarget(actor: Awaited<ReturnType<typeof loadActor>>, userId: string) {
  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      deletedAt: null,
      ...(actor.role === 'platform_admin' ? {} : { tenantId: actor.tenantId }),
    },
    select: { id: true, tenantId: true, name: true, email: true, role: true, status: true },
  });
  if (!target) throw new AppError('NOT_FOUND', 404, 'User not found');
  return target;
}

async function assertCanManageTarget(
  actor: Awaited<ReturnType<typeof loadActor>>,
  target: Awaited<ReturnType<typeof loadTarget>>,
  data: { role?: string; status?: string } = {},
) {
  if (data.role !== undefined && !VALID_ROLES.includes(data.role as AdminUserRole)) throw new AppError('VALIDATION_ERROR', 400, 'Invalid role');
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as AdminUserStatus)) throw new AppError('VALIDATION_ERROR', 400, 'Invalid status');
  if (data.role === 'operator' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign operator roles');
  if (data.role === 'platform_admin' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign platform admin roles');
  if (actor.id === target.id && data.role !== undefined && data.role !== target.role) throw new AppError('FORBIDDEN', 403, 'You cannot change your own role');
  if (target.role === 'platform_admin' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can manage platform admin users');
  if (target.role === 'operator' && actor.role !== 'platform_admin' && data.role !== undefined && data.role !== 'operator') throw new AppError('FORBIDDEN', 403, 'Only platform admins can change operator roles');

  const operatorCount = await prisma.user.count({ where: { tenantId: target.tenantId, deletedAt: null, role: 'operator' } });
  if (target.role === 'operator' && data.role !== undefined && data.role !== 'operator' && operatorCount <= 1) throw new AppError('CONFLICT', 409, 'Cannot demote the last operator');
  if (target.role === 'operator' && data.status === 'suspended' && operatorCount <= 1) throw new AppError('CONFLICT', 409, 'Cannot suspend the last operator');
}

export async function listUsers(
  tenantId: string,
  query: { search?: string; role?: string; status?: string; page?: number; limit?: number },
  options: { includeAllTenants?: boolean } = {},
): Promise<AdminUsersResponse> {
  if (options.includeAllTenants) await requirePlatformAdminDataAccess();
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(Math.max(1, query.limit ?? 10), 50);
  const where: Prisma.UserWhereInput = {
    ...(options.includeAllTenants ? {} : { tenantId }), deletedAt: null,
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { email: { contains: query.search, mode: 'insensitive' } }] } : {}),
  };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: [{ createdAt: 'desc' }, { name: 'asc' }], skip: (page - 1) * limit, take: limit, select: { id: true, tenantId: true, tenant: { select: { name: true, slug: true } }, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true, languagePreference: true, createdAt: true, updatedAt: true } }),
  ]);
  return { data: users.map(toUserRecord), meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
}

export async function updateUser(operatorId: string, tenantId: string, userId: string, data: { role?: string; status?: string }) {
  const actor = await loadActor(operatorId);
  const target = await loadTarget(actor, userId);

  const nextRole = data.role ?? target.role;
  const nextStatus = data.status ?? target.status;

  await assertCanManageTarget(actor, target, data);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(data.role !== undefined ? { role: data.role } : {}), ...(data.status !== undefined ? { status: data.status } : {}), updatedAt: new Date() },
    select: { id: true, tenantId: true, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true, languagePreference: true, createdAt: true, updatedAt: true },
  });

  const changeParts: string[] = [];
  if (data.role !== undefined && data.role !== target.role) changeParts.push(`Role changed: ${target.role} → ${data.role}`);
  if (data.status !== undefined && data.status !== target.status) changeParts.push(`Status changed: ${target.status} → ${data.status}`);

  if (changeParts.length > 0) {
    await logAudit(target.tenantId, actor.id, `${changeParts.join('; ')} by ${actor.name}`, 'user', userId, {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      target: { id: target.id, name: target.name },
      from: { role: target.role, status: target.status },
      to: { role: nextRole, status: nextStatus },
    });
  }

  return toUserRecord(updated);
}

export async function resetUserPassword(operatorId: string, userId: string, password: string) {
  const actor = await loadActor(operatorId);
  const target = await loadTarget(actor, userId);
  await assertCanManageTarget(actor, target);

  if (actor.id === target.id) {
    throw new AppError('FORBIDDEN', 403, 'Use settings to update your own password');
  }

  const supabaseAdmin = createServiceRoleSupabaseClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password });
  if (error) throw new AppError('AUTH_UPDATE_FAILED', 400, error.message);

  await logAudit(target.tenantId, actor.id, `Password reset by ${actor.name}`, 'user', userId, {
    actor: { id: actor.id, name: actor.name, role: actor.role },
    target: { id: target.id, name: target.name, email: target.email },
  });

  return { ok: true };
}

export async function deleteUser(operatorId: string, userId: string) {
  const actor = await loadActor(operatorId);
  const target = await loadTarget(actor, userId);
  await assertCanManageTarget(actor, target, { status: 'suspended' });

  if (actor.id === target.id) {
    throw new AppError('FORBIDDEN', 403, 'You cannot delete your own account');
  }

  let authDeletion: 'soft_deleted' | 'skipped_missing_service_role' | 'already_missing' = 'skipped_missing_service_role';

  if (hasServiceRoleSupabaseCredentials()) {
    const supabaseAdmin = createServiceRoleSupabaseClient();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(target.id, true);
    if (error) {
      const message = error.message.toLowerCase();
      const status = 'status' in error && typeof error.status === 'number' ? error.status : null;
      if (status === 404 || message.includes('not found') || message.includes('no user')) {
        authDeletion = 'already_missing';
      } else {
        throw new AppError('AUTH_DELETE_FAILED', 400, error.message);
      }
    } else {
      authDeletion = 'soft_deleted';
    }
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { status: 'suspended', deletedAt: new Date(), updatedAt: new Date() },
    select: { id: true, tenantId: true, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true, languagePreference: true, createdAt: true, updatedAt: true },
  });

  await logAudit(target.tenantId, actor.id, `User deleted by ${actor.name}`, 'user', userId, {
    actor: { id: actor.id, name: actor.name, role: actor.role },
    target: { id: target.id, name: target.name, email: target.email, role: target.role, status: target.status },
    deletion: 'soft_delete_app_user',
    authDeletion,
  });

  return toUserRecord(updated);
}
