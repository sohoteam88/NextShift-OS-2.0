import prisma from '@/lib/prisma';

export async function listAllUsers(query: { search?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(50, Math.max(1, query.limit ?? 25));
  const where = query.search
    ? { deletedAt: null, OR: [{ name: { contains: query.search, mode: 'insensitive' as const } }, { email: { contains: query.search, mode: 'insensitive' as const } }] }
    : { deletedAt: null };
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, tenant: { select: { name: true, slug: true, plan: true } } } }),
  ]);
  return {
    data: users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt.toISOString(), tenantName: u.tenant?.name ?? '—', tenantSlug: u.tenant?.slug ?? '', tenantPlan: u.tenant?.plan ?? '' })),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
}

export async function getRecentAuditLogs(limit = 50) {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' }, take: limit,
    select: { id: true, action: true, targetType: true, targetId: true, metadata: true, createdAt: true, actor: { select: { name: true, email: true } }, tenant: { select: { name: true, slug: true } } },
  });
  return logs.map(l => ({ id: l.id, action: l.action, targetType: l.targetType, targetId: l.targetId, actorName: l.actor?.name ?? 'System', actorEmail: l.actor?.email ?? '', tenantName: l.tenant?.name ?? '—', tenantSlug: l.tenant?.slug ?? '', createdAt: l.createdAt.toISOString() }));
}
