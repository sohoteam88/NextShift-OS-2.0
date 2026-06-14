import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AdminUserRecord, AdminUserRole, AdminUserStatus, AdminUsersResponse } from '../types';

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

export async function listUsers(
  tenantId: string,
  query: { search?: string; role?: string; status?: string; page?: number; limit?: number },
  options: { includeAllTenants?: boolean } = {},
): Promise<AdminUsersResponse> {
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
  const actor = await prisma.user.findFirst({ where: { id: operatorId, tenantId, deletedAt: null }, select: { id: true, name: true, role: true } });
  if (!actor) throw new AppError('UNAUTHORIZED', 401, 'Authentication required');

  const target = await prisma.user.findFirst({ where: { id: userId, tenantId, deletedAt: null }, select: { id: true, name: true, role: true, status: true } });
  if (!target) throw new AppError('NOT_FOUND', 404, 'User not found');

  const nextRole = data.role ?? target.role;
  const nextStatus = data.status ?? target.status;

  if (data.role !== undefined && !VALID_ROLES.includes(data.role as AdminUserRole)) throw new AppError('VALIDATION_ERROR', 400, 'Invalid role');
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as AdminUserStatus)) throw new AppError('VALIDATION_ERROR', 400, 'Invalid status');
  if (data.role === 'operator' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign operator roles');
  if (data.role === 'platform_admin' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can assign platform admin roles');
  if (operatorId === userId && data.role !== undefined && data.role !== target.role) throw new AppError('FORBIDDEN', 403, 'You cannot change your own role');
  if (target.role === 'platform_admin' && actor.role !== 'platform_admin') throw new AppError('FORBIDDEN', 403, 'Only platform admins can manage platform admin users');
  if (target.role === 'operator' && actor.role !== 'platform_admin' && data.role !== undefined && data.role !== 'operator') throw new AppError('FORBIDDEN', 403, 'Only platform admins can change operator roles');

  const operatorCount = await prisma.user.count({ where: { tenantId, deletedAt: null, role: 'operator' } });
  if (target.role === 'operator' && data.role !== undefined && data.role !== 'operator' && operatorCount <= 1) throw new AppError('CONFLICT', 409, 'Cannot demote the last operator');
  if (target.role === 'operator' && data.status === 'suspended' && operatorCount <= 1) throw new AppError('CONFLICT', 409, 'Cannot suspend the last operator');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { ...(data.role !== undefined ? { role: data.role } : {}), ...(data.status !== undefined ? { status: data.status } : {}), updatedAt: new Date() },
    select: { id: true, tenantId: true, name: true, email: true, phone: true, role: true, status: true, avatarUrl: true, languagePreference: true, createdAt: true, updatedAt: true },
  });

  const changeParts: string[] = [];
  if (data.role !== undefined && data.role !== target.role) changeParts.push(`Role changed: ${target.role} → ${data.role}`);
  if (data.status !== undefined && data.status !== target.status) changeParts.push(`Status changed: ${target.status} → ${data.status}`);

  if (changeParts.length > 0) {
    await logAudit(tenantId, actor.id, `${changeParts.join('; ')} by ${actor.name}`, 'user', userId, {
      actor: { id: actor.id, name: actor.name, role: actor.role },
      target: { id: target.id, name: target.name },
      from: { role: target.role, status: target.status },
      to: { role: nextRole, status: nextStatus },
    });
  }

  return toUserRecord(updated);
}
